import { describe, it, expect } from 'vitest';
import { calcCAGR, futureValueSip, calcROI, totalAnnualDividends, futureValueCompound } from './finance';

describe('finance utils', () => {
  it('calcCAGR basic case', () => {
    // From 10,000 to 20,000 in 3 years → ~26% CAGR
    const r = calcCAGR(10000, 20000, 3);
    expect(r).toBeGreaterThan(0.25);
    expect(r).toBeLessThan(0.27);
  });

  it('calcCAGR invalid inputs', () => {
    expect(isNaN(calcCAGR(-1, 200, 3))).toBe(true);
    expect(isNaN(calcCAGR(100, 0, 3))).toBe(true);
    expect(isNaN(calcCAGR(100, 200, 0))).toBe(true);
  });

  it('futureValueSip zero rate', () => {
    // 100 per month for 12 months at 0% = 1200
    expect(futureValueSip(100, 0, 1)).toBe(1200);
  });

  it('futureValueSip positive rate', () => {
    const fv = futureValueSip(1000, 0.12, 10); // 12% annual, 10 years
    expect(fv).toBeGreaterThan(200000); // sanity check
  });

  it('calcROI works', () => {
    expect(calcROI(1200, 1000)).toBeCloseTo(0.2, 5);
  });

  it('calcROI invalid', () => {
    expect(isNaN(calcROI(1200, 0))).toBe(true);
  });

  it('totalAnnualDividends sums', () => {
    const total = totalAnnualDividends([
      { shares: 10, dividendPerShare: 2 },
      { shares: 5, dividendPerShare: 1.5 },
    ]);
    expect(total).toBe(10 * 2 + 5 * 1.5);
  });
  
  it('futureValueCompound annual simple case no contributions', () => {
    // 1000 principal, 10% annual, 2 years compounded annually => 1000*(1.1)^2 = 1210
    const fv = futureValueCompound(1000, 0.10, 2, 1, 0);
    expect(fv).toBeCloseTo(1210, 2);
  });

  it('futureValueCompound monthly with contributions', () => {
    // Rough sanity: principal 0, $100 monthly, 12% annual ~ grows above simple sum
    const fv = futureValueCompound(0, 0.12, 1, 12, 100); // 1 year
    expect(fv).toBeGreaterThan(1200); // contributions sum
  });

  it('futureValueCompound invalid frequency', () => {
    expect(isNaN(futureValueCompound(1000, 0.1, 2, 0, 0))).toBe(true);
  });
});
