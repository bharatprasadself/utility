import { Card, CardContent, TextField, Button, Stack } from '@mui/material';
import { useState } from 'react';
import { futureValueSip } from '@/utils/finance';
import ResultCard from '@/components/finance/ResultCard';
import FinanceToolLayout from '@/components/finance/FinanceToolLayout';

export default function SipCalculator() {
  const [monthly, setMonthly] = useState<string>('1000');
  const [rate, setRate] = useState<string>('12');
  const [years, setYears] = useState<string>('10');
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const m = parseFloat(monthly);
    const r = parseFloat(rate) / 100;
    const y = parseFloat(years);
    const fv = futureValueSip(m, r, y);
    setResult(isFinite(fv) ? fv : NaN);
  };

  return (
    <FinanceToolLayout
      title="SIP Calculator"
      icon="💰"
      subtitle="Future value of recurring monthly investments at a fixed annual return."
      description="The SIP Calculator helps you estimate the future value of your monthly investments based on a fixed annual return. It’s an easy way to plan long-term goals like retirement, education, or wealth creation by showing how your regular investments grow over time through the power of compounding."
      sidebar={<ResultCard
        title="Future Value"
        emoji="💰"
        value={result}
        format="number"
        decimals={2}
  description="Projected total accumulation at the specified annual rate."
        errorText="Invalid input values. Monthly investment and years must be positive numbers."
        series={(() => {
          if (result === null || !isFinite(result)) return undefined;
          return [result * 0.25, result * 0.5, result * 0.75, result];
        })()}
        sparklineColor="warning.main"
      />}
    >
      <Card>
        <CardContent>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <TextField label="Monthly Investment" type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} fullWidth />
            <TextField label="Expected Return (p.a. %)" type="number" value={rate} onChange={(e) => setRate(e.target.value)} fullWidth />
            <TextField label="Years" type="number" value={years} onChange={(e) => setYears(e.target.value)} fullWidth />
            <Button
              variant="contained"
              size="large"
              onClick={handleCalculate}
              sx={{ width: { xs: '100%', sm: 180 } }}
            >
              Calculate
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </FinanceToolLayout>
  );
}
