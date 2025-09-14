import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
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
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import api from '../services/api';
import type { TimeZoneConversion } from '../services/api';

export default function TimezoneConverter() {
  const [timezones, setTimezones] = useState<string[]>([]);
  const [fromTimezone, setFromTimezone] = useState<string>('America/New_York');
  const [toTimezone, setToTimezone] = useState<string>('Asia/Tokyo');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [result, setResult] = useState<TimeZoneConversion | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadTimezones = async () => {
      try {
        const data = await api.getTimezones();
        setTimezones(data);
        if (data.length > 0) {
          if (!data.includes(fromTimezone)) setFromTimezone(data[0]);
          if (!data.includes(toTimezone)) setToTimezone(data[1]);
        }
      } catch (err) {
        setError('Failed to load timezones');
      } finally {
        setInitialLoading(false);
      }
    };

    loadTimezones();
  }, []);
  const handleConvert = async () => {
    setError('');
    setLoading(true);
    try {
      const dateStr = selectedDate 
        ? selectedDate.format('YYYY-MM-DD HH:mm:ss')
        : undefined;
      
      const data = await api.convertTime({
        fromTimezone,
        toTimezone,
        dateTime: dateStr
      });
      setResult(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Conversion failed. Please try again.';
      setError(errorMessage);
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
          Timezone Converter
        </Typography>

        {initialLoading ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="300px"
          >
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Select Date & Time"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'white'
                  }
                }}
              />
            </LocalizationProvider>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2,
              p: 2,
              bgcolor: 'white',
              borderRadius: 2,
              boxShadow: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: 'text.secondary',
                    width: '80px'
                  }}
                >
                  From:
                </Typography>
                <Select
                  value={fromTimezone}
                  onChange={(e: SelectChangeEvent) => setFromTimezone(e.target.value)}
                  fullWidth
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                >
                  {timezones.map((timezone) => (
                    <MenuItem key={timezone} value={timezone}>
                      {timezone.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  color: 'text.secondary'
                }}
              >
                ↓
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: 'text.secondary',
                    width: '80px'
                  }}
                >
                  To:
                </Typography>
                <Select
                  value={toTimezone}
                  onChange={(e: SelectChangeEvent) => setToTimezone(e.target.value)}
                  fullWidth
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                >
                  {timezones.map((timezone) => (
                    <MenuItem key={timezone} value={timezone}>
                      {timezone.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={handleConvert}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Convert Time'}
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
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#f0f7ff',
                  border: '1px solid',
                  borderColor: 'primary.light'
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {fromTimezone.replace('_', ' ')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      {result.sourceTime}
                    </Typography>
                  </Box>

                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      color: 'primary.main'
                    }}
                  >
                    ↓
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {toTimezone.replace('_', ' ')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      {result.convertedTime}
                    </Typography>
                  </Box>

                  <Box 
                    sx={{ 
                      mt: 1, 
                      pt: 1, 
                      borderTop: '1px solid',
                      borderColor: 'primary.light'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <span role="img" aria-label="clock">⏰</span>
                      Time Difference: {Math.abs(result.hoursDifference)} hours
                      {result.hoursDifference > 0 ? ' ahead' : ' behind'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}