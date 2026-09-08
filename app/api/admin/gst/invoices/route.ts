import { env } from "cloudflare:workers";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../../db";
import {
  businessTaxSettings,
  customerAddresses,
  customerOrders,
  customerProfiles,
  orderItems,
  productTaxProfiles,
  taxInvoices,
} from "../../../../../db/schema";
import { getAdminUser } from "../../../../admin-auth";
import {
  calculateInclusiveTax,
  financialYearFor,
  stateCodeFor,
} from "../../../../gst";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin)
    return Response.json({ error: "Admin access required." }, { status: 401 });
  const body = (await request.json()) as { orderId?: number };
  const orderId = Number(body.orderId);
  if (!Number.isInteger(orderId) || orderId < 1) {
    return Response.json({ error: "A valid order is required." }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(taxInvoices)
    .where(eq(taxInvoices.orderId, orderId))
    .limit(1);
  if (existing) return Response.json({ invoice: existing, alreadyIssued: true });

  const [[settings], [order]] = await Promise.all([
    db.select().from(businessTaxSettings).limit(1),
    db
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.id, orderId))
      .limit(1),
  ]);
  if (!settings?.enabled) {
    return Response.json(
      { error: "Complete and enable GST business settings first." },
      { status: 409 },
    );
  }
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
  if (order.paymentStatus !== "paid") {
    return Response.json(
      { error: "A tax invoice can only be issued after payment is confirmed." },
      { status: 409 },
    );
  }
  if (!order.shippingAddressId) {
    return Response.json(
      { error: "The order needs a saved billing/delivery address." },
      { status: 409 },
    );
  }

  const [[address], [profile], items] = await Promise.all([
    db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.id, order.shippingAddressId))
      .limit(1),
    db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, order.userId))
      .limit(1),
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
  ]);
  if (!address || address.userId !== order.userId) {
    return Response.json(
      { error: "The order billing address is unavailable." },
      { status: 409 },
    );
  }
  if (!items.length) {
    return Response.json({ error: "The order has no invoice lines." }, { status: 409 });
  }

  const taxProfiles = await db
    .select()
    .from(productTaxProfiles)
    .where(inArray(productTaxProfiles.productSlug, items.map((item) => item.productSlug)));
  const taxMap = new Map(
    taxProfiles.map((taxProfile) => [taxProfile.productSlug, taxProfile]),
  );
  const missing = [
    ...new Set(
      items
        .filter((item) => !taxMap.has(item.productSlug))
        .map((item) => item.productName),
    ),
  ];
  if (missing.length) {
    return Response.json(
      {
        error: `Verify HSN and GST rate before invoicing: ${missing.join(", ")}.`,
        missingProducts: missing,
      },
      { status: 409 },
    );
  }

  const grossItems = items.reduce(
    (total, item) => total + item.unitPricePaise * item.quantity,
    0,
  );
  if (grossItems !== order.totalPaise) {
    return Response.json(
      {
        error:
          "Order total does not reconcile with its item lines. Resolve shipping or discount allocation before issuing the tax invoice.",
      },
      { status: 409 },
    );
  }

  const placeOfSupplyCode = stateCodeFor(address.state);
  if (!placeOfSupplyCode) {
    return Response.json(
      { error: `Map a valid GST state code for ${address.state}.` },
      { status: 409 },
    );
  }
  if (settings.gstin.slice(0, 2) !== settings.stateCode) {
    return Response.json(
      { error: "Supplier GSTIN state code does not match business settings." },
      { status: 409 },
    );
  }
  const buyerGstin = profile?.billingGstin || null;
  if (buyerGstin && buyerGstin.slice(0, 2) !== placeOfSupplyCode) {
    return Response.json(
      { error: "Buyer GSTIN state code does not match the place of supply." },
      { status: 409 },
    );
  }
  if (buyerGstin && settings.eInvoiceApplicable) {
    return Response.json(
      {
        error:
          "B2B e-invoicing is enabled. Connect an authorised GSP/IRP before issuing this invoice so an IRN and signed QR code are obtained.",
      },
      { status: 409 },
    );
  }

  const isInterState = settings.stateCode !== placeOfSupplyCode;
  const calculatedLines = items.map((item) => {
    const taxProfile = taxMap.get(item.productSlug)!;
    return {
      item,
      taxProfile,
      tax: calculateInclusiveTax(
        item.unitPricePaise * item.quantity,
        taxProfile.gstRateBps,
        taxProfile.cessRateBps,
        isInterState,
      ),
    };
  });
  const total = (key: keyof (typeof calculatedLines)[number]["tax"]) =>
    calculatedLines.reduce((sum, line) => sum + Number(line.tax[key]), 0);
  const now = Date.now();
  const financialYear = financialYearFor(now);
  let sequence = settings.nextInvoiceSequence;
  if (settings.invoiceFinancialYear !== financialYear) {
    sequence = 1;
    await db
      .update(businessTaxSettings)
      .set({ invoiceFinancialYear: financialYear, nextInvoiceSequence: 1 })
      .where(eq(businessTaxSettings.id, settings.id));
  }
  const invoiceNumber = `${settings.invoicePrefix}/${financialYear.slice(2)}/${String(sequence).padStart(5, "0")}`;
  if (invoiceNumber.length > 16) {
    return Response.json(
      { error: "Invoice number exceeds the 16-character GST limit. Shorten the prefix." },
      { status: 409 },
    );
  }
  const sellerAddress = [
    settings.addressLine1,
    settings.addressLine2,
    settings.city,
  ]
    .filter(Boolean)
    .join(", ");
  const buyerAddress = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  const invoiceStatement = env.DB.prepare(
    `INSERT INTO tax_invoices (
      order_id, user_id, invoice_number, financial_year, sequence_number,
      invoice_date, supply_type, reverse_charge, seller_legal_name,
      seller_trade_name, seller_gstin, seller_address, seller_state_name,
      seller_state_code, seller_postal_code, buyer_legal_name, buyer_gstin,
      buyer_address, place_of_supply_name, place_of_supply_code,
      taxable_value_paise, cgst_paise, sgst_paise, igst_paise, cess_paise,
      total_paise, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?)`,
  ).bind(
    order.id,
    order.userId,
    invoiceNumber,
    financialYear,
    sequence,
    now,
    isInterState ? "inter_state" : "intra_state",
    settings.legalName,
    settings.tradeName,
    settings.gstin,
    sellerAddress,
    settings.stateName,
    settings.stateCode,
    settings.postalCode,
    profile?.billingLegalName || address.recipientName,
    buyerGstin,
    buyerAddress,
    address.state,
    placeOfSupplyCode,
    total("taxableValuePaise"),
    total("cgstPaise"),
    total("sgstPaise"),
    total("igstPaise"),
    total("cessPaise"),
    total("totalPaise"),
    now,
    now,
  );
  const sequenceStatement = env.DB.prepare(
    `UPDATE business_tax_settings
     SET next_invoice_sequence = ?, invoice_financial_year = ?, updated_at = ?
     WHERE id = ? AND next_invoice_sequence = ?`,
  ).bind(sequence + 1, financialYear, now, settings.id, sequence);
  const lineStatements = calculatedLines.map(({ item, taxProfile, tax }) =>
    env.DB.prepare(
      `INSERT INTO tax_invoice_lines (
        invoice_id, product_slug, description, hsn_code, quantity, unit_code,
        gross_value_paise, taxable_value_paise, gst_rate_bps, cess_rate_bps,
        cgst_paise, sgst_paise, igst_paise, cess_paise, total_paise
      ) SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        FROM tax_invoices WHERE order_id = ?`,
    ).bind(
      item.productSlug,
      `${item.productName} · ${item.variantLabel}`,
      taxProfile.hsnCode,
      item.quantity,
      "NOS",
      tax.grossValuePaise,
      tax.taxableValuePaise,
      taxProfile.gstRateBps,
      taxProfile.cessRateBps,
      tax.cgstPaise,
      tax.sgstPaise,
      tax.igstPaise,
      tax.cessPaise,
      tax.totalPaise,
      order.id,
    ),
  );

  try {
    await env.DB.batch([invoiceStatement, sequenceStatement, ...lineStatements]);
  } catch (error) {
    const [raceWinner] = await db
      .select()
      .from(taxInvoices)
      .where(eq(taxInvoices.orderId, orderId))
      .limit(1);
    if (raceWinner)
      return Response.json({ invoice: raceWinner, alreadyIssued: true });
    return Response.json(
      {
        error:
          error instanceof Error
            ? `Invoice could not be issued: ${error.message}`
            : "Invoice could not be issued.",
      },
      { status: 500 },
    );
  }
  const [invoice] = await db
    .select()
    .from(taxInvoices)
    .where(eq(taxInvoices.orderId, orderId))
    .limit(1);
  return Response.json({ invoice }, { status: 201 });
}
