// Reusable finance utilities

export function calcCAGR(begin: number, end: number, years: number): number {
  if (!isFinite(begin) || !isFinite(end) || !isFinite(years)) return NaN;
  if (begin <= 0 || end <= 0 || years <= 0) return NaN;
  return Math.pow(end / begin, 1 / years) - 1;
}

export function futureValueSip(monthly: number, annualRate: number, years: number): number {
  if (!isFinite(monthly) || !isFinite(annualRate) || !isFinite(years)) return NaN;
  if (monthly < 0 || years < 0) return NaN;
  const n = Math.round(years * 12);
  const r = annualRate / 12; // decimal rate per month
  if (n === 0) return 0;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

export function calcROI(gain: number, cost: number): number {
  if (!isFinite(gain) || !isFinite(cost)) return NaN;
  if (cost === 0) return NaN;
  return (gain - cost) / cost;
}

export function totalAnnualDividends(holdings: Array<{ shares: number; dividendPerShare: number }>): number {
  return holdings.reduce((sum, h) => sum + (h?.shares || 0) * (h?.dividendPerShare || 0), 0);
}
