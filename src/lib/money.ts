/** All money is stored as integer cents (ZAR). */
export function formatZAR(cents: number, opts: { symbol?: boolean } = {}): string {
  const { symbol = true } = opts;
  const neg = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const rands = Math.floor(abs / 100);
  const c = String(abs % 100).padStart(2, "0");
  const grouped = rands.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${neg ? "-" : ""}${symbol ? "R " : ""}${grouped}.${c}`;
}

/** Parse "1 250,50" / "1250.50" / "R1,250.50" into cents. */
export function parseZAR(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === "number") return Math.round(input * 100);
  let s = input.replace(/[R\s]/gi, "");
  if (!s) return 0;
  // If there's a comma and no dot, treat comma as decimal separator (SA style)
  if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export type LineInput = { quantity: number; unitPrice: number };

export function calcTotals(lines: LineInput[], discount: number, vatEnabled: boolean, vatRate: number) {
  const lineTotals = lines.map((l) => Math.round(l.quantity * l.unitPrice));
  const subtotal = lineTotals.reduce((a, b) => a + b, 0);
  const taxable = Math.max(0, subtotal - discount);
  const vatAmount = vatEnabled ? Math.round((taxable * vatRate) / 100) : 0;
  return { lineTotals, subtotal, vatAmount, total: taxable + vatAmount };
}
