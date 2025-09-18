import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/auth';
import type { AuthResponse } from '../services/auth';

interface AuthContextType {
    user: { username: string; token: string; roles?: string[] } | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
    isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<{ username: string; token: string; roles?: string[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = () => {
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                authService.initializeAuth();
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response: AuthResponse = await authService.login({ username, password });
            const userData = { 
                username: response.username, 
                token: response.token,
                roles: response.roles 
            };
            setUser(userData);
            localStorage.setItem('username', response.username);
            localStorage.setItem('roles', JSON.stringify(response.roles || []));
        } catch (error) {
            throw error;
        }
    };

    const register = async (username: string, password: string) => {
        try {
            await authService.register({ username, password });
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const isAdmin = () => {
        return user?.roles?.includes('ROLE_ADMIN') || false;
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
