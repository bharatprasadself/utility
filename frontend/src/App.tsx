import { ThemeProvider, CssBaseline, Box, Container } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import BlogList from './components/BlogList';
import Navigation from './components/Navigation';
import { AuthProvider } from './contexts/AuthContext';
import Articles from './components/articles/Articles';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <Router>
            <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
              <Navigation />
              <Box sx={{ pt: '84px' }}> {/* Add padding to account for fixed navbar */}
                <Container maxWidth="lg">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/blogs" element={<BlogList />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/articles/*" element={<Articles />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Container>
              </Box>
            </Box>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App
