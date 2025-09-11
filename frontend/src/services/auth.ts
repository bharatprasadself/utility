import axiosInstance from './axiosConfig';

export interface AuthResponse {
    token: string;
    type: string;
    username: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest extends LoginRequest {
    email?: string;
}

const setAuthToken = (token: string) => {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
};

const authService = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await axiosInstance.post('/api/auth/signin', data);
        if (response.data.token) {
            setAuthToken(response.data.token);
        }
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<any> => {
        return await axiosInstance.post('/api/auth/signup', data);
    },

    logout: () => {
        setAuthToken('');
    },

    getCurrentUser: (): { username: string; token: string } | null => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        return token && username ? { username, token } : null;
    },

    // Initialize auth state from localStorage
    initializeAuth: () => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
        }
    }
};

export default authService;
