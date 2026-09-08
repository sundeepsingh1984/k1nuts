import { and, desc, gte, inArray, lt, ne } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  adminProducts,
  businessTaxSettings,
  orderReturns,
  productTaxProfiles,
  taxInvoiceLines,
  taxInvoices,
} from "../../../../db/schema";
import { getAdminUser } from "../../../admin-auth";
import {
  currentTaxPeriod,
  defaultTaxSettings,
  periodBounds,
} from "../../../gst";
import { products } from "../../../store-data";

export const dynamic = "force-dynamic";

function paise(value: number) {
  return (Number(value || 0) / 100).toFixed(2);
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

async function reportFor(period: string) {
  const { start, end } = periodBounds(period);
  const db = getDb();
  const [settingsRows, taxProfiles, customProducts, invoices, returns] =
    await Promise.all([
      db.select().from(businessTaxSettings).limit(1),
      db.select().from(productTaxProfiles).orderBy(productTaxProfiles.productSlug),
      db.select().from(adminProducts),
      db
        .select()
        .from(taxInvoices)
        .where(
          and(
            gte(taxInvoices.invoiceDate, start),
            lt(taxInvoices.invoiceDate, end),
          ),
        )
        .orderBy(desc(taxInvoices.invoiceDate)),
      db
        .select()
        .from(orderReturns)
        .where(
          and(
            gte(orderReturns.createdAt, start),
            lt(orderReturns.createdAt, end),
            ne(orderReturns.status, "rejected"),
          ),
        )
        .orderBy(desc(orderReturns.createdAt)),
    ]);
  const lines = invoices.length
    ? await db
        .select()
        .from(taxInvoiceLines)
        .where(
          inArray(
            taxInvoiceLines.invoiceId,
            invoices.map((invoice) => invoice.id),
          ),
        )
    : [];
  const issued = invoices.filter((invoice) => invoice.status === "issued");
  const issuedIds = new Set(issued.map((invoice) => invoice.id));
  const issuedLines = lines.filter((line) => issuedIds.has(line.invoiceId));
  const returnInvoices = returns.length
    ? await db
        .select({ orderId: taxInvoices.orderId })
        .from(taxInvoices)
        .where(
          inArray(
            taxInvoices.orderId,
            returns.map((item) => item.orderId),
          ),
        )
    : [];
  const issuedOrderIds = new Set(returnInvoices.map((invoice) => invoice.orderId));
  const unadjustedReturns = returns.filter((item) =>
    issuedOrderIds.has(item.orderId),
  );
  const sum = (field: keyof typeof taxInvoices.$inferSelect) =>
    issued.reduce((total, invoice) => total + Number(invoice[field] || 0), 0);
  const hsnMap = new Map<
    string,
    {
      hsnCode: string;
      gstRateBps: number;
      unitCode: string;
      quantity: number;
      taxableValuePaise: number;
      cgstPaise: number;
      sgstPaise: number;
      igstPaise: number;
      cessPaise: number;
    }
  >();
  for (const line of issuedLines) {
    const key = `${line.hsnCode}:${line.gstRateBps}:${line.unitCode}`;
    const row = hsnMap.get(key) || {
      hsnCode: line.hsnCode,
      gstRateBps: line.gstRateBps,
      unitCode: line.unitCode,
      quantity: 0,
      taxableValuePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      cessPaise: 0,
    };
    row.quantity += line.quantity;
    row.taxableValuePaise += line.taxableValuePaise;
    row.cgstPaise += line.cgstPaise;
    row.sgstPaise += line.sgstPaise;
    row.igstPaise += line.igstPaise;
    row.cessPaise += line.cessPaise;
    hsnMap.set(key, row);
  }
  const configuredSlugs = new Set(
    taxProfiles.map((profile) => profile.productSlug),
  );
  const catalogueSlugs = [
    ...products.map((product) => product.slug),
    ...customProducts.map((product) => product.slug),
  ];
  const b2b = issued.filter((invoice) => Boolean(invoice.buyerGstin));
  const b2cl = issued.filter(
    (invoice) =>
      !invoice.buyerGstin &&
      invoice.supplyType === "inter_state" &&
      invoice.totalPaise > 10000000,
  );
  const b2cs = issued.filter(
    (invoice) => !invoice.buyerGstin && !b2cl.includes(invoice),
  );
  const invoiceMap = new Map(issued.map((invoice) => [invoice.id, invoice]));
  const aggregateInvoiceRateRows = (
    selectedInvoices: typeof issued,
  ) => {
    const selectedIds = new Set(selectedInvoices.map((invoice) => invoice.id));
    const rows = new Map<
      string,
      {
        invoiceId: number;
        invoiceNumber: string;
        invoiceDate: number;
        buyerGstin: string | null;
        placeOfSupplyCode: string;
        supplyType: string;
        gstRateBps: number;
        cessRateBps: number;
        taxableValuePaise: number;
        cgstPaise: number;
        sgstPaise: number;
        igstPaise: number;
        cessPaise: number;
      }
    >();
    for (const line of issuedLines) {
      if (!selectedIds.has(line.invoiceId)) continue;
      const invoice = invoiceMap.get(line.invoiceId)!;
      const key = `${line.invoiceId}:${line.gstRateBps}:${line.cessRateBps}`;
      const row = rows.get(key) || {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        buyerGstin: invoice.buyerGstin,
        placeOfSupplyCode: invoice.placeOfSupplyCode,
        supplyType: invoice.supplyType,
        gstRateBps: line.gstRateBps,
        cessRateBps: line.cessRateBps,
        taxableValuePaise: 0,
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise: 0,
        cessPaise: 0,
      };
      row.taxableValuePaise += line.taxableValuePaise;
      row.cgstPaise += line.cgstPaise;
      row.sgstPaise += line.sgstPaise;
      row.igstPaise += line.igstPaise;
      row.cessPaise += line.cessPaise;
      rows.set(key, row);
    }
    return [...rows.values()];
  };
  const b2csMap = new Map<
    string,
    {
      placeOfSupplyCode: string;
      supplyType: string;
      gstRateBps: number;
      cessRateBps: number;
      taxableValuePaise: number;
      cgstPaise: number;
      sgstPaise: number;
      igstPaise: number;
      cessPaise: number;
    }
  >();
  const b2csIds = new Set(b2cs.map((invoice) => invoice.id));
  for (const line of issuedLines) {
    if (!b2csIds.has(line.invoiceId)) continue;
    const invoice = invoiceMap.get(line.invoiceId)!;
    const key = `${invoice.placeOfSupplyCode}:${invoice.supplyType}:${line.gstRateBps}:${line.cessRateBps}`;
    const row = b2csMap.get(key) || {
      placeOfSupplyCode: invoice.placeOfSupplyCode,
      supplyType: invoice.supplyType,
      gstRateBps: line.gstRateBps,
      cessRateBps: line.cessRateBps,
      taxableValuePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      cessPaise: 0,
    };
    row.taxableValuePaise += line.taxableValuePaise;
    row.cgstPaise += line.cgstPaise;
    row.sgstPaise += line.sgstPaise;
    row.igstPaise += line.igstPaise;
    row.cessPaise += line.cessPaise;
    b2csMap.set(key, row);
  }
  const taxableLines = issuedLines.filter(
    (line) => line.gstRateBps > 0 || line.cessRateBps > 0,
  );
  const nilRatedLines = issuedLines.filter(
    (line) => line.gstRateBps === 0 && line.cessRateBps === 0,
  );
  const lineSum = (
    selectedLines: typeof issuedLines,
    field:
      | "taxableValuePaise"
      | "cgstPaise"
      | "sgstPaise"
      | "igstPaise"
      | "cessPaise",
  ) => selectedLines.reduce((total, line) => total + line[field], 0);
  return {
    period,
    settings: settingsRows[0] || defaultTaxSettings,
    taxProfiles,
    invoices,
    lines: issuedLines,
    missingTaxProfiles: [...new Set(catalogueSlugs)].filter(
      (slug) => !configuredSlugs.has(slug),
    ),
    summary: {
      issuedInvoices: issued.length,
      taxableValuePaise: sum("taxableValuePaise"),
      cgstPaise: sum("cgstPaise"),
      sgstPaise: sum("sgstPaise"),
      igstPaise: sum("igstPaise"),
      cessPaise: sum("cessPaise"),
      grossTaxPaise:
        sum("cgstPaise") +
        sum("sgstPaise") +
        sum("igstPaise") +
        sum("cessPaise"),
      invoiceValuePaise: sum("totalPaise"),
      unadjustedReturns: unadjustedReturns.length,
      unadjustedReturnValuePaise: unadjustedReturns.reduce(
        (total, item) => total + item.amountPaise,
        0,
      ),
    },
    gstr1: {
      b2bInvoices: b2b.length,
      b2clInvoices: b2cl.length,
      b2csInvoices: b2cs.length,
      hsnRows: [...hsnMap.values()],
      documentsIssued: issued.length,
      b2bRows: aggregateInvoiceRateRows(b2b),
      b2clRows: aggregateInvoiceRateRows(b2cl),
      b2csRows: [...b2csMap.values()],
    },
    gstr3b: {
      table31a: {
        taxableValuePaise: lineSum(taxableLines, "taxableValuePaise"),
        integratedTaxPaise: lineSum(taxableLines, "igstPaise"),
        centralTaxPaise: lineSum(taxableLines, "cgstPaise"),
        stateTaxPaise: lineSum(taxableLines, "sgstPaise"),
        cessPaise: lineSum(taxableLines, "cessPaise"),
      },
      table31c: {
        outwardValuePaise: lineSum(nilRatedLines, "taxableValuePaise"),
      },
    },
    reconciliation: {
      unadjustedReturns: unadjustedReturns.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        status: item.status,
        amountPaise: item.amountPaise,
        createdAt: item.createdAt,
      })),
      note:
        "Returns are not netted from GST until a line-level credit note is issued and reconciled against the original tax invoice.",
    },
  };
}

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user)
    return Response.json({ error: "Admin access required." }, { status: 401 });
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || currentTaxPeriod();
  try {
    const report = await reportFor(period);
    const download = url.searchParams.get("download");
    if (download === "csv") {
      const header = [
        "Invoice Number",
        "Invoice Date",
        "Buyer GSTIN",
        "Buyer Name",
        "Place of Supply Code",
        "Supply Type",
        "HSN",
        "Description",
        "Quantity",
        "UQC",
        "Taxable Value",
        "GST Rate %",
        "CGST",
        "SGST",
        "IGST",
        "Cess",
        "Invoice Value",
      ];
      const rows = report.lines.map((line) => {
        const invoice = report.invoices.find((item) => item.id === line.invoiceId);
        return [
          invoice?.invoiceNumber,
          invoice ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN") : "",
          invoice?.buyerGstin,
          invoice?.buyerLegalName,
          invoice?.placeOfSupplyCode,
          invoice?.supplyType,
          line.hsnCode,
          line.description,
          line.quantity,
          line.unitCode,
          paise(line.taxableValuePaise),
          (line.gstRateBps / 100).toFixed(2),
          paise(line.cgstPaise),
          paise(line.sgstPaise),
          paise(line.igstPaise),
          paise(line.cessPaise),
          paise(line.totalPaise),
        ].map(csvCell).join(",");
      });
      const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");
      return new Response(`\ufeff${csv}`, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="k1-gst-working-${period}.csv"`,
          "cache-control": "private, no-store",
        },
      });
    }
    if (download === "json") {
      return new Response(JSON.stringify(report, null, 2), {
        headers: {
          "content-type": "application/json",
          "content-disposition": `attachment; filename="k1-gst-working-${period}.json"`,
          "cache-control": "private, no-store",
        },
      });
    }
    return Response.json(report, {
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "GST report unavailable." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await getAdminUser();
  if (!user)
    return Response.json({ error: "Admin access required." }, { status: 401 });
  const body = (await request.json()) as Partial<typeof defaultTaxSettings>;
  const gstin = body.gstin?.trim().toUpperCase() || "";
  const legalName = body.legalName?.trim().slice(0, 120) || "";
  const prefix = body.invoicePrefix?.trim().toUpperCase().slice(0, 4) || "K1";
  if (body.enabled && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    return Response.json(
      { error: "A valid GSTIN is required before GST invoicing is enabled." },
      { status: 400 },
    );
  }
  if (body.enabled && !legalName) {
    return Response.json(
      { error: "The GST-registered legal name is required." },
      { status: 400 },
    );
  }
  if (!/^[A-Z0-9]{1,4}$/.test(prefix)) {
    return Response.json(
      { error: "Invoice prefix must be 1–4 letters or numbers." },
      { status: 400 },
    );
  }
  const now = Date.now();
  const values = {
    id: 1,
    enabled: Boolean(body.enabled),
    legalName,
    tradeName: body.tradeName?.trim().slice(0, 120) || "K1 Nuts",
    gstin,
    pan: body.pan?.trim().toUpperCase().slice(0, 10) || null,
    addressLine1: body.addressLine1?.trim().slice(0, 160) || "Aluchi Bagh",
    addressLine2: body.addressLine2?.trim().slice(0, 160) || null,
    city: body.city?.trim().slice(0, 80) || "Srinagar",
    stateName: body.stateName?.trim().slice(0, 80) || "Jammu & Kashmir",
    stateCode: body.stateCode?.trim().slice(0, 2) || "01",
    postalCode: body.postalCode?.trim().slice(0, 10) || "190008",
    invoicePrefix: prefix,
    eInvoiceApplicable: Boolean(body.eInvoiceApplicable),
    updatedAt: now,
  };
  const db = getDb();
  await db
    .insert(businessTaxSettings)
    .values(values)
    .onConflictDoUpdate({
      target: businessTaxSettings.id,
      set: values,
    });
  return Response.json({ settings: values });
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user)
    return Response.json({ error: "Admin access required." }, { status: 401 });
  const body = (await request.json()) as {
    productSlug?: string;
    productSlugs?: string[];
    hsnCode?: string;
    gstRate?: number;
    cessRate?: number;
    unitCode?: string;
    classificationNote?: string;
  };
  const productSlugs = [
    ...new Set(
      (body.productSlugs?.length ? body.productSlugs : [body.productSlug || ""])
        .map((slug) => slug.trim().slice(0, 100))
        .filter(Boolean),
    ),
  ].slice(0, 100);
  const hsnCode = body.hsnCode?.trim().slice(0, 8);
  const gstRate = Number(body.gstRate);
  const cessRate = Number(body.cessRate || 0);
  if (!productSlugs.length || !hsnCode || !/^\d{4,8}$/.test(hsnCode)) {
    return Response.json(
      { error: "Select a product and enter a 4–8 digit HSN code." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 40) {
    return Response.json({ error: "GST rate must be 0–40%." }, { status: 400 });
  }
  if (!Number.isFinite(cessRate) || cessRate < 0 || cessRate > 100) {
    return Response.json({ error: "Cess rate must be 0–100%." }, { status: 400 });
  }
  const sharedValues = {
    hsnCode,
    gstRateBps: Math.round(gstRate * 100),
    cessRateBps: Math.round(cessRate * 100),
    unitCode: "NOS",
    classificationNote: body.classificationNote?.trim().slice(0, 300) || null,
    verifiedAt: Date.now(),
    updatedAt: Date.now(),
  };
  const db = getDb();
  await db
    .insert(productTaxProfiles)
    .values(
      productSlugs.map((productSlug) => ({ productSlug, ...sharedValues })),
    )
    .onConflictDoUpdate({
      target: productTaxProfiles.productSlug,
      set: sharedValues,
    });
  return Response.json({ updatedProducts: productSlugs.length });
}
