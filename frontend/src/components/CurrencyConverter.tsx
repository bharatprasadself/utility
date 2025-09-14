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
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mt: 3, 
          minHeight: '400px',
          background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
        }}
      >
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            textAlign: 'center',
            color: 'primary.main',
            fontWeight: 'bold',
            mb: 4
          }}
        >
          Currency Converter
        </Typography>

        <Stack spacing={3}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              sx={{ 
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                sx: { bgcolor: 'white' }
              }}
            />
            <Select
              value={fromCurrency}
              onChange={(e: SelectChangeEvent) => setFromCurrency(e.target.value)}
              sx={{ 
                width: '120px',
                bgcolor: 'white',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              label="From"
            >
              {currencies.map((currency) => (
                <MenuItem key={currency} value={currency}>
                  {currency}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              my: 1 
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 'bold'
              }}
            >
              ⟷
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              disabled
              value={result ? result.result.toFixed(2) : ''}
              sx={{ 
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: result ? '#f0f7ff' : 'white'
                }
              }}
              placeholder="Converted Amount"
            />
            <Select
              value={toCurrency}
              onChange={(e: SelectChangeEvent) => setToCurrency(e.target.value)}
              sx={{ 
                width: '120px',
                bgcolor: 'white',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              label="To"
            >
              {currencies.map((currency) => (
                <MenuItem key={currency} value={currency}>
                  {currency}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Button
            variant="contained"
            onClick={handleConvert}
            disabled={loading}
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Convert'}
          </Button>

          {error && (
            <Alert 
              severity="error"
              sx={{ 
                borderRadius: 2,
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              {error}
            </Alert>
          )}

          {result && (
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                mt: 2, 
                borderRadius: 2,
                bgcolor: '#f8f9fa'
              }}
            >
              <Stack spacing={1}>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Exchange Rate
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  1 {result.from} = {result.rate.toFixed(4)} {result.to}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Last updated: {new Date().toLocaleTimeString()}
                </Typography>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
