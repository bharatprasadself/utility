import { Box, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import authService from '../services/auth';

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [submittingPwd, setSubmittingPwd] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await authService.getProfile();
        setEmail(profile.email || '');
      } catch {/* ignore */}
    };
    if (user) load();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    setSubmittingEmail(true);
    try {
      await authService.updateEmail({ email });
      setEmailStatus({ type: 'success', message: 'Email updated successfully' });
      await refreshProfile();
    } catch (err: any) {
      setEmailStatus({ type: 'error', message: err?.message || 'Failed to update email' });
    } finally {
      setSubmittingEmail(false);
    }
  };

  const validatePassword = (pwd: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus(null);
    if (newPassword !== confirmPassword) {
      setPwdStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (!validatePassword(newPassword)) {
      setPwdStatus({ type: 'error', message: 'Password must include upper, lower, digit and symbol (min 8 chars)' });
      return;
    }
    setSubmittingPwd(true);
    try {
      await authService.updatePassword({ currentPassword, newPassword });
      setPwdStatus({ type: 'success', message: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdStatus({ type: 'error', message: err?.message || 'Failed to update password' });
    } finally {
      setSubmittingPwd(false);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
        {/* Update Email */}
        <Box component="form" onSubmit={handleEmailUpdate} sx={{ flex: 1, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom>Update Email</Typography>
          {emailStatus && <Alert severity={emailStatus.type} sx={{ mb: 2 }}>{emailStatus.message}</Alert>}
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" disabled={submittingEmail}>Save Email</Button>
        </Box>

        {/* Update Password */}
        <Box component="form" onSubmit={handlePasswordUpdate} sx={{ flex: 1, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom>Update Password</Typography>
          {pwdStatus && <Alert severity={pwdStatus.type} sx={{ mb: 2 }}>{pwdStatus.message}</Alert>}
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
            helperText="Must include upper, lower, digit and symbol (min 8 chars)"
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" disabled={submittingPwd}>Save Password</Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default Profile;
