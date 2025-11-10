import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/auth';
import type { AuthResponse } from '../services/auth';

interface AuthContextType {
    user: { username: string; token: string; roles?: string[]; email?: string } | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, email: string) => Promise<void>;
    logout: () => void;
    deleteAccount: () => Promise<void>;
    loading: boolean;
    isAdmin: () => boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<{ username: string; token: string; roles?: string[]; email?: string } | null>(null);
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
            try { await refreshProfile(); } catch { /* ignore profile fetch errors */ }
            // Session-only persistence handled inside authService; removed duplicate localStorage writes
        } catch (error) {
            throw error;
        }
    };

    const register = async (username: string, password: string, email: string) => {
        try {
            await authService.register({ username, password, email });
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        authService.logout(); // clears sessionStorage and legacy localStorage keys
        setUser(null);
    };

    const deleteAccount = async () => {
        try {
            await authService.deleteAccount();
        } finally {
            logout();
        }
    };

    const isAdmin = () => {
        return user?.roles?.includes('ROLE_ADMIN') || false;
    };

    const refreshProfile = async () => {
        if (!user) return;
        try {
            const profile = await authService.getProfile();
            setUser({ ...user, email: profile.email, roles: profile.roles });
        } catch (e) {
            // swallow errors
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, deleteAccount, loading, isAdmin, refreshProfile }}>
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
