import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production'
    ? 'https://utility-nrd7.onrender.com'
    : '');  // Empty string to use relative URLs in development

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Accept': 'application/json'
    },
    withCredentials: true, // Important for CORS with credentials
    timeout: 10000 // 10 second timeout
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        // Get token from localStorage - it could be stored directly or within user data
        const token = localStorage.getItem('token') || 
                     (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') || '{}').token);
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.code === 'ERR_NETWORK') {
            // Handle network errors (server not running, no internet, etc.)
            console.error('Network error:', error);
            throw new Error('Unable to connect to the server. Please check your internet connection.');
        }
        
        if (error.response) {
            // Handle specific HTTP error codes
            switch (error.response.status) {
                case 401:
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    window.location.href = '/login';
                    throw new Error('Session expired. Please log in again.');
                case 403:
                    throw new Error('You do not have permission to perform this action.');
                case 404:
                    throw new Error('The requested resource was not found.');
                case 500:
                    throw new Error('Internal server error. Please try again later.');
                default:
                    throw new Error(error.response.data?.message || 'An unexpected error occurred.');
            }
        }

        // Handle other types of errors
        console.error('Axios error:', error);
        throw new Error('An unexpected error occurred. Please try again.');
    }
);

export default axiosInstance;
