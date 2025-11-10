import { Box, Typography, TextField, Stack, Button, Alert, LinearProgress } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../services/auth';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwdScore, setPwdScore] = useState(0);
  const [pwdMsg, setPwdMsg] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing or invalid reset token.');
    }
  }, [token]);

  const evaluatePassword = (pwd: string) => {
    let score = 0;
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

  const passwordsMatch = useMemo(() => password && confirm && password === confirm, [password, confirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!token) {
      setError('Missing or invalid token.');
      return;
    }
    const score = evaluatePassword(password);
    if (password.length < 8 || score < 4) {
      setError('Password too weak. Use ≥8 chars including upper, lower, number & symbol.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authService.confirmPasswordReset({ token, newPassword: password });
      setSuccess('Password reset successful. You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err?.message || 'Reset failed. Try requesting a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" gutterBottom>Reset Password</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField 
            label="New Password" 
            type="password" 
            value={password}
            onChange={(e) => { const v = e.target.value; setPassword(v); evaluatePassword(v); }}
            required fullWidth disabled={loading}
          />
          {password && (
            <Box sx={{ mt: -1 }}>
              <LinearProgress variant="determinate" value={(pwdScore/5)*100} sx={{ height: 6, borderRadius: 1, mb: 0.5 }} />
              <Typography variant="caption" color={pwdScore >= 4 ? 'success.main' : 'warning.main'}>
                {pwdMsg}
              </Typography>
            </Box>
          )}
          <TextField 
            label="Confirm Password" 
            type="password" 
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required fullWidth disabled={loading}
            error={!!confirm && !passwordsMatch}
            helperText={!!confirm && !passwordsMatch ? 'Passwords must match' : ''}
          />
          <Button type="submit" variant="contained" disabled={loading || !token || password.length < 8 || pwdScore < 4 || !passwordsMatch}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
