import { Stack, TextField, Button, Typography, Box, Alert, LinearProgress } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [pwdScore, setPwdScore] = useState(0); // 0-5
    const [pwdMsg, setPwdMsg] = useState<string>('');
    const [usernameMsg, setUsernameMsg] = useState<string>('');

    const evaluatePassword = (pwd: string) => {
        let score = 0;
        // Length criterion (>=8 per updated requirement)
        if (pwd.length >= 8) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        setPwdScore(score);
        if (!pwd) setPwdMsg('');
        else if (pwd.length < 8) setPwdMsg('Too short: need at least 8 characters');
        else if (score <= 2) setPwdMsg('Weak: add upper, lower, number & symbol');
        else if (score === 3) setPwdMsg('Fair: add missing character types for strength');
        else if (score === 4) setPwdMsg('Good: consider adding remaining type for max strength');
        else setPwdMsg('Strong password');
        return score;
    };
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const uname = username.trim();
            const validChars = /^[A-Za-z0-9._-]+$/;
            if (uname.length < 6 || uname.length > 20 || !validChars.test(uname)) {
                setUsernameMsg('Username must be 6-20 chars (letters, digits, . _ -)');
                return;
            }
            const emailTrim = email.trim();
            if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
                setError('Please enter a valid email address.');
                return;
            }
            // Enforce client-side policy before calling server
            const score = evaluatePassword(password);
            // Require length >=8 and at least 4 of 5 criteria (len, lower, upper, digit, symbol)
            if (password.length < 8 || score < 4) {
                setError('Password too weak. Use ≥8 chars including upper, lower, number & symbol.');
                return;
            }
            await register(username, password, emailTrim);
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
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        type="email"
                        fullWidth
                    />
                    <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => {
                            const v = e.target.value;
                            setUsername(v);
                            const validChars = /^[A-Za-z0-9._-]+$/;
                            if (!v) setUsernameMsg('');
                            else if (v.trim().length < 6) setUsernameMsg('Minimum 6 characters');
                            else if (v.trim().length > 20) setUsernameMsg('Maximum 20 characters');
                            else if (!validChars.test(v.trim())) setUsernameMsg('Only letters, digits, . _ -');
                            else setUsernameMsg('');
                        }}
                        required
                        fullWidth
                        helperText={usernameMsg}
                        error={!!usernameMsg}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => {
                            const v = e.target.value;
                            setPassword(v);
                            evaluatePassword(v);
                        }}
                        required
                        fullWidth
                    />
                    {password && (
                        <Box sx={{ mt: -1 }}>
                            <LinearProgress variant="determinate" value={(pwdScore/5)*100} sx={{ height: 6, borderRadius: 1, mb: 0.5 }} />
                            <Typography variant="caption" color={pwdScore >= 4 ? 'success.main' : 'warning.main'}>
                                {pwdMsg}
                            </Typography>
                        </Box>
                    )}
                    <Button type="submit" variant="contained" color="primary" disabled={password.length < 8 || pwdScore < 4}>
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
