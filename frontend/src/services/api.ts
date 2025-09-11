import axios from 'axios';

const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://utility-nrd7.onrender.com'  // Render deployment URL
  : 'http://localhost:8080';

// Type definitions
export interface CurrencyConversion {
    from: string;
    to: string;
    amount: number;
    result: number;
    rate: number;
}

export interface TimeZoneInfo {
    timezone: string;
    currentTime: string;
    offset: string;
}

export interface TimeZoneConversion {
    fromTimezone: string;
    toTimezone: string;
    sourceTime: string;
    convertedTime: string;
    hoursDifference: number;
}

// Error handler
const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
            throw new Error('CORS Error: Unable to access the API. Please try again later.');
        }
        throw new Error(error.response?.data?.message || error.message);
    }
    throw error;
};

const api = {
    // Currency endpoints
    getCurrencies: () => 
        axios.get(`${API_BASE_URL}/currencies`)
            .then(response => response.data.currencies)
            .catch(handleApiError),
    
    convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) =>
        axios.get<CurrencyConversion>(`${API_BASE_URL}/convert`, {
            params: { amount, fromCurrency, toCurrency }
        })
            .then(response => response.data)
            .catch(handleApiError),

    // Timezone endpoints
    getTimezones: () =>
        axios.get(`${API_BASE_URL}/timezones`)
            .then(response => response.data.timezones)
            .catch(handleApiError),
    
    getCurrentTime: (timezone: string) =>
        axios.get<TimeZoneInfo>(`${API_BASE_URL}/timezone/current`, {
            params: { timezone }
        })
            .then(response => response.data)
            .catch(handleApiError),
    
    convertTime: (fromTimezone: string, toTimezone: string, dateTime?: string) =>
        axios.get<TimeZoneConversion>(`${API_BASE_URL}/timezone/convert`, {
            params: { fromTimezone, toTimezone, dateTime }
        })
            .then(response => response.data)
            .catch(handleApiError),
};

export default api;
