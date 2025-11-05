import { Stack, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(username, password);
            navigate('/login');
        } catch (err: any) {
            const serverMessage = err?.message || err?.response?.data?.message;
            setError(serverMessage || 'Registration failed. Please try a different username.');
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 2 }}>
            <Typography variant="h4" gutterBottom>
                Register
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                    />
                    <Button type="submit" variant="contained" color="primary">
                        Register
                    </Button>
                    <Button onClick={() => navigate('/login')} color="secondary">
                        Already have an account? Login
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}
