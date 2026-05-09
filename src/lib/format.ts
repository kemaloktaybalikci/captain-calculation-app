const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatTL(amount: number): string {
  return formatter.format(Math.round(amount * 100) / 100);
}

export function formatNumber(n: number, digits = 2): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
