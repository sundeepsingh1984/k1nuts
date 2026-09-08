import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "../../../db";
import {
  customerOrders,
  taxInvoiceLines,
  taxInvoices,
} from "../../../db/schema";
import { isAdminEmail } from "../../admin-auth";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { PrintInvoiceButton } from "./print-button";

export const dynamic = "force-dynamic";

function money(paise: number) {
  return (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function underThousand(value: number) {
  const words: string[] = [];
  if (value >= 100) {
    words.push(`${ones[Math.floor(value / 100)]} Hundred`);
    value %= 100;
  }
  if (value >= 20) {
    words.push(tens[Math.floor(value / 10)]);
    value %= 10;
  }
  if (value) words.push(ones[value]);
  return words.join(" ");
}

function amountInWords(paise: number) {
  let rupees = Math.floor(paise / 100);
  const parts: string[] = [];
  const groups: Array<[number, string]> = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
  ];
  for (const [size, label] of groups) {
    if (rupees >= size) {
      parts.push(`${underThousand(Math.floor(rupees / size))} ${label}`);
      rupees %= size;
    }
  }
  if (rupees) parts.push(underThousand(rupees));
  const paisa = paise % 100;
  return `Rupees ${parts.join(" ") || "Zero"}${paisa ? ` and ${underThousand(paisa)} Paise` : ""} Only`;
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireChatGPTUser("/account?tab=orders");
  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isInteger(invoiceId)) notFound();
  const db = getDb();
  const [[invoice], lines] = await Promise.all([
    db.select().from(taxInvoices).where(eq(taxInvoices.id, invoiceId)).limit(1),
    db
      .select()
      .from(taxInvoiceLines)
      .where(eq(taxInvoiceLines.invoiceId, invoiceId)),
  ]);
  if (!invoice || (invoice.userId !== user.userId && !isAdminEmail(user.email))) {
    notFound();
  }
  const [order] = await db
    .select()
    .from(customerOrders)
    .where(eq(customerOrders.id, invoice.orderId))
    .limit(1);

  return (
    <main className="invoicePage">
      <div className="invoiceActions noPrint">
        <Link href={invoice.userId === user.userId ? "/account?tab=orders" : "/admin"}>
          ← BACK
        </Link>
        <PrintInvoiceButton />
      </div>
      <article className="taxInvoice">
        <header className="invoiceTitle">
          <div>
            <img src="/k1-logo.jpeg" alt="K1 Nuts" />
            <span>
              <b>{invoice.sellerTradeName}</b>
              <small>DELICACY FROM THE HIMALAYAS</small>
            </span>
          </div>
          <div>
            <small>ORIGINAL FOR RECIPIENT</small>
            <h1>TAX INVOICE</h1>
          </div>
        </header>
        <section className="invoiceIdentityGrid">
          <div>
            <small>SUPPLIER</small>
            <h2>{invoice.sellerLegalName}</h2>
            <p>{invoice.sellerAddress}</p>
            <p>
              {invoice.sellerStateName} · {invoice.sellerPostalCode}
            </p>
            <b>GSTIN: {invoice.sellerGstin}</b>
          </div>
          <dl>
            <dt>Invoice number</dt>
            <dd>{invoice.invoiceNumber}</dd>
            <dt>Invoice date</dt>
            <dd>
              {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </dd>
            <dt>Order reference</dt>
            <dd>{order?.orderNumber || `#${invoice.orderId}`}</dd>
            <dt>Reverse charge</dt>
            <dd>{invoice.reverseCharge ? "Yes" : "No"}</dd>
          </dl>
        </section>
        <section className="invoiceBuyer">
          <div>
            <small>BILL TO / SHIP TO</small>
            <h3>{invoice.buyerLegalName}</h3>
            <p>{invoice.buyerAddress}</p>
            {invoice.buyerGstin && <b>GSTIN: {invoice.buyerGstin}</b>}
          </div>
          <div>
            <small>PLACE OF SUPPLY</small>
            <h3>
              {invoice.placeOfSupplyName} ({invoice.placeOfSupplyCode})
            </h3>
            <p>
              {invoice.supplyType === "inter_state"
                ? "Inter-state supply · IGST"
                : "Intra-state supply · CGST + SGST"}
            </p>
          </div>
        </section>
        <div className="invoiceLineTable">
          <div className="invoiceLineHead">
            <b>#</b>
            <b>DESCRIPTION</b>
            <b>HSN</b>
            <b>QTY / UQC</b>
            <b>TAXABLE</b>
            <b>GST</b>
            <b>TAX</b>
            <b>TOTAL</b>
          </div>
          {lines.map((line, index) => (
            <div className="invoiceLineRow" key={line.id}>
              <span>{index + 1}</span>
              <span>{line.description}</span>
              <span>{line.hsnCode}</span>
              <span>
                {line.quantity} {line.unitCode}
              </span>
              <span>₹{money(line.taxableValuePaise)}</span>
              <span>{(line.gstRateBps / 100).toFixed(2)}%</span>
              <span>
                {line.igstPaise > 0
                  ? `IGST ₹${money(line.igstPaise)}`
                  : `CGST ₹${money(line.cgstPaise)} · SGST ₹${money(line.sgstPaise)}`}
                {line.cessPaise > 0 && ` · Cess ₹${money(line.cessPaise)}`}
              </span>
              <b>₹{money(line.totalPaise)}</b>
            </div>
          ))}
        </div>
        <section className="invoiceTotals">
          <div>
            <small>TAX AMOUNT IN WORDS</small>
            <p>
              {amountInWords(
                invoice.cgstPaise +
                  invoice.sgstPaise +
                  invoice.igstPaise +
                  invoice.cessPaise,
              )}
            </p>
            <small>INVOICE VALUE IN WORDS</small>
            <p>{amountInWords(invoice.totalPaise)}</p>
          </div>
          <dl>
            <dt>Taxable value</dt>
            <dd>₹{money(invoice.taxableValuePaise)}</dd>
            <dt>CGST</dt>
            <dd>₹{money(invoice.cgstPaise)}</dd>
            <dt>SGST</dt>
            <dd>₹{money(invoice.sgstPaise)}</dd>
            <dt>IGST</dt>
            <dd>₹{money(invoice.igstPaise)}</dd>
            <dt>Cess</dt>
            <dd>₹{money(invoice.cessPaise)}</dd>
            <dt className="invoiceGrand">Invoice total</dt>
            <dd className="invoiceGrand">₹{money(invoice.totalPaise)}</dd>
          </dl>
        </section>
        {(invoice.irn || invoice.signedQrCode) && (
          <section className="invoiceIrn">
            <b>IRN: {invoice.irn}</b>
            <span>Ack: {invoice.acknowledgementNumber}</span>
          </section>
        )}
        <footer className="invoiceFooter">
          <p>
            We declare that this invoice shows the actual price of the goods
            described and that all particulars are true and correct.
          </p>
          <div>
            <b>For {invoice.sellerLegalName}</b>
            <span>Authorised signatory</span>
          </div>
        </footer>
      </article>
    </main>
  );
}
