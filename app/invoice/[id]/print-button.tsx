"use client";

export function PrintInvoiceButton() {
  return (
    <button type="button" className="invoicePrintButton" onClick={() => window.print()}>
      PRINT / SAVE PDF
    </button>
  );
}
