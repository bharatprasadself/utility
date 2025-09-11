import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import api from '../services/api';
import type { CurrencyConversion } from '../services/api';

export default function CurrencyConverter() {
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [amount, setAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<CurrencyConversion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const data = await api.getCurrencies();
        setCurrencies(data);
        if (data.length > 0 && !data.includes(fromCurrency)) {
          setFromCurrency(data[0]);
        }
      } catch (err) {
        setError('Failed to load currencies');
      }
    };

    loadCurrencies();
  }, [fromCurrency]);

  const handleConvert = async () => {
    setError('');
    setLoading(true);
    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError('Please enter a valid positive number');
        return;
      }
      const data = await api.convertCurrency({
        amount: amountNum,
        from: fromCurrency,
        to: toCurrency
      });
      setResult(data);
    } catch (err) {
      setError('Conversion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ width: '100%', maxWidth: '600px' }}>
      <Paper elevation={3} sx={{ p: 3, mt: 3, minHeight: '400px' }}>
        <Typography variant="h5" gutterBottom>
          Currency Converter
        </Typography>

        <Stack spacing={3}>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />

          <Select
            value={fromCurrency}
            onChange={(e: SelectChangeEvent) => setFromCurrency(e.target.value)}
            fullWidth
            label="From Currency"
          >
            {currencies.map((currency) => (
              <MenuItem key={currency} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </Select>

          <Select
            value={toCurrency}
            onChange={(e: SelectChangeEvent) => setToCurrency(e.target.value)}
            fullWidth
            label="To Currency"
          >
            {currencies.map((currency) => (
              <MenuItem key={currency} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </Select>

          <Button
            variant="contained"
            onClick={handleConvert}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Convert'}
          </Button>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {result && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Result:
              </Typography>
              <Typography>
                {amount} {result.from} = {result.result.toFixed(2)} {result.to}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Exchange Rate: 1 {result.from} = {result.rate.toFixed(6)} {result.to}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
