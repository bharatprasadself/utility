import { Box, Typography, TextField, Stack, Button, Alert } from '@mui/material';
import { useState } from 'react';
import authService from '../services/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailTrim = email.trim();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(emailTrim);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Request failed. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" gutterBottom>Forgot Password</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Enter your account email. If it exists, you'll receive a reset link.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {submitted ? (
        <Alert severity="success">If the account exists, a reset email has been sent.</Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={loading || !email.trim()}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </Stack>
        </form>
      )}
    </Box>
  );
}