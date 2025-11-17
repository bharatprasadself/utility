import { Card, CardContent, Stack, Typography, Box, Alert } from '@mui/material';

export type ResultCardFormat = 'percent' | 'number' | 'currency';

interface ResultCardProps {
  title: string;
  value: number | null;
  format?: ResultCardFormat;
  decimals?: number;
  description?: string;
  emoji?: string; // e.g., 📈, 💰, 📊
  currency?: string; // when format = 'currency'
  errorText?: string | false;
  // sparkline options
  series?: number[];
  sparklineHeight?: number;
  sparklineColor?: string; // e.g., 'primary.main'
}

function formatValue(value: number, format: ResultCardFormat, decimals: number, currency?: string): string {
  if (!isFinite(value)) return '—';
  switch (format) {
    case 'percent':
      return `${(value * 100).toFixed(decimals)}%`;
    case 'currency': {
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: decimals }).format(value);
      } catch {
        return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
      }
    }
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
  }
}

function buildSparklinePath(values: number[], width = 100, height = 40): string {
  if (!values || values.length < 2) return '';
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  return `M ${points[0]} L ${points.slice(1).join(' ')}`;
}

export default function ResultCard({ title, value, format = 'number', decimals = 2, description, emoji, currency, errorText, series, sparklineHeight = 40, sparklineColor = 'primary.main' }: ResultCardProps) {
  const hasResult = value !== null;
  const isInvalid = hasResult && !isFinite(value as number);

  if (!hasResult && !errorText) return null;

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {emoji && (
              <Box component="span" aria-hidden sx={{ fontSize: 20 }}>{emoji}</Box>
            )}
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {title}
            </Typography>
          </Box>
          {isInvalid ? (
            <Alert severity="warning">{errorText || 'Invalid input values.'}</Alert>
          ) : (
            hasResult && (
              <Typography variant="h4" fontWeight={800} color="primary.main">
                {formatValue(value as number, format, decimals, currency)}
              </Typography>
            )
          )}
          {!!series?.length && !isInvalid && (
            <Box sx={{ mt: 0.5, color: sparklineColor }}>
              <svg viewBox={`0 0 100 ${sparklineHeight}`} width="100%" height={sparklineHeight} preserveAspectRatio="none" role="img" aria-label="trend">
                <path d={buildSparklinePath(series, 100, sparklineHeight)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </Box>
          )}
          {description && (
            <Typography variant="body2" color="text.secondary">{description}</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
