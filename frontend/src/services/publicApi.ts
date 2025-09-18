import axios from 'axios';
import { API_BASE_URL } from './axiosConfig';

// Create axios instance for public endpoints that don't require authentication
const publicApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 10000 // 10 second timeout
});

// Add response interceptor for consistent error handling with main axios instance
publicApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.code === 'ERR_NETWORK') {
            console.error('Network error:', error);
            return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection.'));
        }
        
        if (error.response) {
            switch (error.response.status) {
                case 404:
                    return Promise.reject(new Error('The requested resource was not found.'));
                case 500:
                    return Promise.reject(new Error('Internal server error. Please try again later.'));
                default:
                    return Promise.reject(new Error(error.response.data?.message || 'An unexpected error occurred.'));
            }
        }
        
        console.error('Axios error:', error);
        return Promise.reject(new Error('An unexpected error occurred. Please try again.'));
    }
);

export default publicApi;