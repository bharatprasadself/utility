import axios from 'axios';

export const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://utility-nrd7.onrender.com'
  : 'http://localhost:8080';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Important for CORS
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
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
        if (error.response) {
            // Handle 401 Unauthorized
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
