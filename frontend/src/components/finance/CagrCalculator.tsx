import { Card, CardContent, TextField, Button, Stack } from '@mui/material';
import { useState } from 'react';
import { calcCAGR } from '@/utils/finance';
import ResultCard from '@/components/finance/ResultCard';
import FinanceToolLayout from '@/components/finance/FinanceToolLayout';

export default function CagrCalculator() {
  const [begin, setBegin] = useState<string>('10000');
  const [end, setEnd] = useState<string>('20000');
  const [years, setYears] = useState<string>('3');
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const b = parseFloat(begin);
    const e = parseFloat(end);
    const y = parseFloat(years);
    const r = calcCAGR(b, e, y);
    setResult(isFinite(r) ? r : NaN);
  };

  return (
    <FinanceToolLayout
      title="CAGR Calculator"
      icon="📈"
      subtitle="Annualized growth rate between a beginning and ending value over a period."
      description="The Compound Annual Growth Rate (CAGR) Calculator helps you measure how much your investment has grown on average each year over a specific period. It smooths out the effects of market fluctuations and shows your investment’s true annual growth rate. Simply enter your beginning value, ending value, and time period to instantly see your yearly return percentage."
      sidebar={<ResultCard
        title="CAGR"
        emoji="📈"
        value={result}
        format="percent"
        decimals={2}
  description="Result: effective average yearly growth percentage."
        errorText="Invalid input values. Ensure all numbers are positive."
        series={result !== null && isFinite(result) ? [0, result / 2, result * 0.75, result] : undefined}
        sparklineColor="success.main"
      />}
    >
      <Card>
        <CardContent>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <TextField label="Beginning Value" type="number" value={begin} onChange={(e) => setBegin(e.target.value)} fullWidth />
            <TextField label="Ending Value" type="number" value={end} onChange={(e) => setEnd(e.target.value)} fullWidth />
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
