import axios from 'axios';

const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'http://utilityzone.in/api'
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

const api = {
    // Currency endpoints
    getCurrencies: () => 
        axios.get(`${API_BASE_URL}/currencies`).then(response => response.data.currencies),
    
    convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) =>
        axios.get<CurrencyConversion>(`${API_BASE_URL}/convert`, {
            params: { amount, fromCurrency, toCurrency }
        }).then(response => response.data),

    // Timezone endpoints
    getTimezones: () =>
        axios.get(`${API_BASE_URL}/timezones`).then(response => response.data.timezones),
    
    getCurrentTime: (timezone: string) =>
        axios.get<TimeZoneInfo>(`${API_BASE_URL}/timezone/current`, {
            params: { timezone }
        }).then(response => response.data),
    
    convertTime: (fromTimezone: string, toTimezone: string, dateTime?: string) =>
        axios.get<TimeZoneConversion>(`${API_BASE_URL}/timezone/convert`, {
            params: { fromTimezone, toTimezone, dateTime }
        }).then(response => response.data),
};

export default api;
