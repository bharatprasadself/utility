import { Stack, TextField, Button, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            const errorMessage = err instanceof Error 
                ? err.message 
                : 'Failed to login. Please check your credentials.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 2 }}>
            <Typography variant="h4" gutterBottom>
                Login
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                    <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        fullWidth
                        disabled={isLoading}
                        autoComplete="username"
                        inputProps={{ 
                            'aria-label': 'Username'
                        }}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                        disabled={isLoading}
                        autoComplete="current-password"
                        inputProps={{ 
                            'aria-label': 'Password'
                        }}
                    />
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        disabled={isLoading || !username || !password}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>
                    <Button 
                        onClick={() => navigate('/register')} 
                        color="secondary"
                        disabled={isLoading}
                    >
                        Don't have an account? Register
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}
