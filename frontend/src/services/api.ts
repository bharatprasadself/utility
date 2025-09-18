import axiosInstance from './axiosConfig';

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

// API Response Types
interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface CurrencyInfo {
    code: string;
    description: string;
}

interface CurrenciesResponse {
    currencies: CurrencyInfo[];
}

interface TimezonesResponse {
    timezones: string[];
}

// Error handler
const handleApiError = (error: unknown): never => {
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
};

const api = {
    // Currency endpoints
    getCurrencies: async (): Promise<CurrencyInfo[]> => {
        try {
            const response = await axiosInstance.get<ApiResponse<CurrenciesResponse>>('/api/currency/currencies');
            return response.data.data.currencies;
        } catch (error) {
            throw handleApiError(error);
        }
    },
    
    convertCurrency: async ({ amount, from, to }: { amount: number; from: string; to: string }): Promise<CurrencyConversion> => {
        try {
            const response = await axiosInstance.get<ApiResponse<CurrencyConversion>>('/api/currency/convert', {
                params: { amount, from, to }
            });
            return response.data.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // Timezone endpoints
    getTimezones: async (): Promise<string[]> => {
        try {
            const response = await axiosInstance.get<ApiResponse<TimezonesResponse>>('/api/timezone/timezones');
            return response.data.data.timezones;
        } catch (error) {
            throw handleApiError(error);
        }
    },
    
    getCurrentTime: async (timezone: string): Promise<TimeZoneInfo> => {
        try {
            const response = await axiosInstance.get<ApiResponse<TimeZoneInfo>>('/api/timezone/current', {
                params: { timezone }
            });
            return response.data.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },
    
    convertTime: async ({ fromTimezone, toTimezone, dateTime }: { fromTimezone: string; toTimezone: string; dateTime?: string }): Promise<TimeZoneConversion> => {
        try {
            const response = await axiosInstance.get<ApiResponse<TimeZoneConversion>>('/api/timezone/convert', {
                params: { fromTimezone, toTimezone, dateTime }
            });
            return response.data.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },
};

export default api;
