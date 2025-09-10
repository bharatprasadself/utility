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
      
      const data = await api.convertTime(fromTimezone, toTimezone, dateStr);
      setResult(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Conversion failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Timezone Converter
        </Typography>

        {initialLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Select Date & Time"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
              />
            </LocalizationProvider>

            <Select
              value={fromTimezone}
              onChange={(e: SelectChangeEvent) => setFromTimezone(e.target.value)}
              fullWidth
              label="From Timezone"
            >
              {timezones.map((timezone) => (
                <MenuItem key={timezone} value={timezone}>
                  {timezone}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={toTimezone}
              onChange={(e: SelectChangeEvent) => setToTimezone(e.target.value)}
              fullWidth
              label="To Timezone"
            >
              {timezones.map((timezone) => (
                <MenuItem key={timezone} value={timezone}>
                  {timezone}
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
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {result && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Result:
                </Typography>
                <Typography>
                  {result.sourceTime}
                </Typography>
                <Typography>
                  ⟶ {result.convertedTime}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Time Difference: {Math.abs(result.hoursDifference)} hours
                  {result.hoursDifference > 0 ? ' ahead' : ' behind'}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}