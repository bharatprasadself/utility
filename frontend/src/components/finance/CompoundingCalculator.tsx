import { Card, CardContent, TextField, Button, Stack, MenuItem } from '@mui/material';
import { useMemo, useState } from 'react';
import { futureValueCompound } from '@/utils/finance';
import ResultCard from '@/components/finance/ResultCard';
import FinanceToolLayout from '@/components/finance/FinanceToolLayout';

const frequencies = [
  { label: 'Annually', value: 1 },
  { label: 'Semi-Annually', value: 2 },
  { label: 'Quarterly', value: 4 },
  { label: 'Monthly', value: 12 },
  { label: 'Weekly', value: 52 },
  { label: 'Daily', value: 365 },
];

export default function CompoundingCalculator() {
  const [principal, setPrincipal] = useState<string>('10000');
  const [rate, setRate] = useState<string>('8');
  const [years, setYears] = useState<string>('10');
  const [freq, setFreq] = useState<number>(12);
  const [perPeriodContribution, setPerPeriodContribution] = useState<string>('0');
  const [fv, setFv] = useState<number | null>(null);

  const handleCalculate = () => {
    const P = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseFloat(years);
    const n = Number(freq);
    const c = parseFloat(perPeriodContribution || '0');
    const result = futureValueCompound(P, r, t, n, c);
    setFv(isFinite(result) ? result : NaN);
  };

  // Build a simple series for the sparkline using yearly checkpoints
  const series = useMemo(() => {
    const P = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = Math.max(0, parseFloat(years));
    const n = Number(freq);
    const c = parseFloat(perPeriodContribution || '0');
    if (![P, r, t, n, c].every((v) => isFinite(v)) || n <= 0) return undefined;
    const points = 8;
    const arr: number[] = [];
    for (let i = 1; i <= points; i++) {
      const ti = (t * i) / points;
      const val = futureValueCompound(P, r, ti, n, c);
      if (!isFinite(val)) return undefined;
      arr.push(val);
    }
    return arr;
  }, [principal, rate, years, freq, perPeriodContribution]);

  const totalContributions = useMemo(() => {
    const c = parseFloat(perPeriodContribution || '0');
    const t = parseFloat(years);
    const n = Number(freq);
    if (!isFinite(c) || !isFinite(t) || !isFinite(n) || n <= 0 || t < 0) return 0;
    return c * Math.round(n * t);
  }, [perPeriodContribution, years, freq]);

  const principalValue = useMemo(() => parseFloat(principal) || 0, [principal]);
  const interestEarned = useMemo(() => {
    if (fv === null || !isFinite(fv)) return 0;
    return fv - principalValue - totalContributions;
  }, [fv, principalValue, totalContributions]);

  return (
    <FinanceToolLayout
      title="Compounding Calculator"
      icon="🔁"
      subtitle="Future value with custom compounding frequency and optional per-period contributions."
      description="Estimate the future value of a lump-sum investment with custom compounding (annual, quarterly, monthly, etc.) and optional equal contributions every period. Great for comparing growth scenarios and understanding the power of compounding."
      sidebar={
        <Stack spacing={2}>
          <ResultCard
            title="Future Value"
            emoji="🔁"
            value={fv}
            format="number"
            decimals={2}
            description="Projected total value at the end of the period."
            errorText="Invalid input values. Please check principal, rate, years, and frequency."
            series={fv !== null && isFinite(fv) ? series : undefined}
            sparklineColor="info.main"
          />
          {fv !== null && isFinite(fv) && (
            <>
              <ResultCard
                title="Total Contributions"
                value={totalContributions}
                format="number"
                decimals={2}
                description="Sum of all per-period additions."
              />
              <ResultCard
                title="Interest Earned"
                value={interestEarned}
                format="number"
                decimals={2}
                description="Growth beyond principal and contributions."
              />
            </>
          )}
        </Stack>
      }
    >
      <Card>
        <CardContent>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <TextField label="Principal" type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} fullWidth />
            <TextField label="Annual Rate (%)" type="number" value={rate} onChange={(e) => setRate(e.target.value)} fullWidth />
          </Stack>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 2 }}>
            <TextField label="Years" type="number" value={years} onChange={(e) => setYears(e.target.value)} fullWidth />
            <TextField
              select
              label="Compounding Frequency"
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              fullWidth
            >
              {frequencies.map((f) => (
                <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 2 }}>
            <TextField label="Per-Period Contribution" type="number" value={perPeriodContribution} onChange={(e) => setPerPeriodContribution(e.target.value)} fullWidth />
            <Button
              variant="contained"
              size="large"
              onClick={handleCalculate}
              sx={{ width: { xs: '100%', sm: 220 } }}
            >
              Calculate
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </FinanceToolLayout>
  );
}
