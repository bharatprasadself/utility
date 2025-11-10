import { Card, CardContent, TextField, Button, Stack } from '@mui/material';
import { useState } from 'react';
import { calcROI } from '@/utils/finance';
import ResultCard from '@/components/finance/ResultCard';
import FinanceToolLayout from '@/components/finance/FinanceToolLayout';

export default function RoiCalculator() {
  const [gain, setGain] = useState<string>('1200');
  const [cost, setCost] = useState<string>('1000');
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const g = parseFloat(gain);
    const c = parseFloat(cost);
    const r = calcROI(g, c);
    setResult(isFinite(r) ? r : NaN);
  };

  return (
    <FinanceToolLayout
      title="ROI Calculator"
      icon="📊"
      subtitle="Return on Investment shows profit or loss as a percentage of cost."
      description="The Return on Investment (ROI) Calculator helps you measure the profitability of your investments by showing gain or loss as a percentage of cost. It’s a quick and simple way to compare different opportunities and determine which investments deliver the best returns."
      sidebar={<ResultCard
        title="ROI"
        emoji="📊"
        value={result}
        format="percent"
        decimals={2}
  description="(Gain − Cost) / Cost"
        errorText="Invalid input. Cost must be greater than 0."
        series={(() => {
          const g = parseFloat(gain);
          const c = parseFloat(cost);
          if (!isFinite(g) || !isFinite(c) || c <= 0) return undefined;
          return [c, g];
        })()}
        sparklineColor="secondary.main"
      />}
    >
      <Card>
        <CardContent>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <TextField label="Gain from Investment" type="number" value={gain} onChange={(e) => setGain(e.target.value)} fullWidth />
            <TextField label="Cost of Investment" type="number" value={cost} onChange={(e) => setCost(e.target.value)} fullWidth />
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
