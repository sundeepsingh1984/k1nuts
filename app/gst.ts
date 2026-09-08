export const INDIA_STATE_CODES: Record<string, string> = {
  "jammu & kashmir": "01",
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  punjab: "03",
  chandigarh: "04",
  uttarakhand: "05",
  haryana: "06",
  delhi: "07",
  rajasthan: "08",
  "uttar pradesh": "09",
  bihar: "10",
  sikkim: "11",
  "arunachal pradesh": "12",
  nagaland: "13",
  manipur: "14",
  mizoram: "15",
  tripura: "16",
  meghalaya: "17",
  assam: "18",
  "west bengal": "19",
  jharkhand: "20",
  odisha: "21",
  chhattisgarh: "22",
  "madhya pradesh": "23",
  gujarat: "24",
  "dadra and nagar haveli and daman and diu": "26",
  maharashtra: "27",
  karnataka: "29",
  goa: "30",
  lakshadweep: "31",
  kerala: "32",
  "tamil nadu": "33",
  puducherry: "34",
  "andaman and nicobar islands": "35",
  telangana: "36",
  "andhra pradesh": "37",
  ladakh: "38",
};

export function stateCodeFor(stateName: string) {
  return INDIA_STATE_CODES[
    stateName
      .trim()
      .toLowerCase()
      .replaceAll("&", "and")
      .replace(/\s+/g, " ")
  ] || (stateName.toLowerCase().includes("jammu") ? "01" : null);
}

export function financialYearFor(timestamp: number) {
  const indiaDate = new Date(timestamp + 330 * 60 * 1000);
  const year = indiaDate.getUTCFullYear();
  const month = indiaDate.getUTCMonth() + 1;
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

export function periodBounds(period: string) {
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error("Tax period must use YYYY-MM.");
  }
  const [year, month] = period.split("-").map(Number);
  if (month < 1 || month > 12) throw new Error("Tax period is invalid.");
  const start = Date.parse(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:30`,
  );
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = Date.parse(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+05:30`,
  );
  return { start, end };
}

export function currentTaxPeriod() {
  const indiaDate = new Date(Date.now() + 330 * 60 * 1000);
  return `${indiaDate.getUTCFullYear()}-${String(
    indiaDate.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}

export function calculateInclusiveTax(
  grossValuePaise: number,
  gstRateBps: number,
  cessRateBps: number,
  isInterState: boolean,
) {
  const gross = Math.max(0, Math.round(grossValuePaise));
  const totalRate = Math.max(0, gstRateBps) + Math.max(0, cessRateBps);
  const taxableValuePaise = totalRate
    ? Math.round((gross * 10000) / (10000 + totalRate))
    : gross;
  const gstPaise = Math.round((taxableValuePaise * gstRateBps) / 10000);
  const cessPaise = Math.max(0, gross - taxableValuePaise - gstPaise);
  const cgstPaise = isInterState ? 0 : Math.floor(gstPaise / 2);
  const sgstPaise = isInterState ? 0 : gstPaise - cgstPaise;
  const igstPaise = isInterState ? gstPaise : 0;
  return {
    grossValuePaise: gross,
    taxableValuePaise,
    gstPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    cessPaise,
    totalPaise:
      taxableValuePaise + cgstPaise + sgstPaise + igstPaise + cessPaise,
  };
}

export const defaultTaxSettings = {
  id: 1,
  enabled: false,
  legalName: "",
  tradeName: "K1 Nuts",
  gstin: "",
  pan: "",
  addressLine1: "Aluchi Bagh",
  addressLine2: "",
  city: "Srinagar",
  stateName: "Jammu & Kashmir",
  stateCode: "01",
  postalCode: "190008",
  invoicePrefix: "K1",
  invoiceFinancialYear: null as string | null,
  nextInvoiceSequence: 1,
  eInvoiceApplicable: false,
  updatedAt: 0,
};
