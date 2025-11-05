import axiosInstance from './axiosConfig';

export interface AuthResponse {
    token: string;
    type: string;
    username: string;
    roles: string[];
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
        try {
            const response = await axiosInstance.post('/api/auth/signin', data);
            console.log('Login response:', response.data); // Debug log
            if (response.data.token) {
                setAuthToken(response.data.token);
                localStorage.setItem('username', response.data.username);
                localStorage.setItem('roles', JSON.stringify(response.data.roles || []));
                console.log('Stored roles:', response.data.roles); // Debug log
                return response.data;
            } else {
                console.error('Response missing token:', response.data); // Debug log
                throw new Error('Server response missing authentication token');
            }
        } catch (error: any) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('roles');
            console.error('Login error:', error); // Debug log
            if (error?.response) {
                const data = error.response.data;
                const payload = typeof data === 'string' ? { message: data } : data;
                const message = payload?.message || (error.response.status === 401 ? 'Invalid username or password' : undefined);
                const code = payload?.code;
                // Throw a structured error object
                throw { message: message || 'Failed to login. Please try again later.', code };
            }
            throw { message: error?.message || 'Failed to login. Please try again later.' };
        }
    },

    register: async (data: RegisterRequest): Promise<any> => {
        try {
            return await axiosInstance.post('/api/auth/signup', data);
        } catch (error: any) {
            const payload = error?.response?.data;
            const message = (typeof payload === 'string' ? payload : payload?.message) || error?.message || 'Registration failed.';
            const code = typeof payload === 'object' ? payload?.code : undefined;
            throw { message, code };
        }
    },

    logout: () => {
        setAuthToken('');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('roles');
    },

    getCurrentUser: (): { username: string; token: string; roles?: string[] } | null => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const rolesString = localStorage.getItem('roles');
        
        // Debug logs to help troubleshoot
        console.log('Auth - getCurrentUser:', { token, username, rolesString });
        
        // Debug logging
        console.log('Token from storage:', token);
        console.log('Username from storage:', username);
        console.log('Roles string from storage:', rolesString);
        
        let roles: string[] = [];
        try {
            if (rolesString) {
                roles = JSON.parse(rolesString);
                console.log('Successfully parsed roles:', roles);
            }
        } catch (error) {
            console.error('Error parsing roles:', error);
            roles = [];
        }
        
        const user = token && username ? { username, token, roles } : null;
        console.log('Returning user object:', user);
        return user;
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
