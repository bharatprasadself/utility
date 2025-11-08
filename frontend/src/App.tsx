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
import ReactArticles from './components/articles/ReactArticles';
import SpringBootArticles from './components/articles/SpringBootArticles';
import PostgreSQLArticles from './components/articles/PostgreSQLArticles';
import DockerArticles from './components/articles/DockerArticles';
import JavaArticles from './components/articles/JavaArticles';
import MicroservicesArticles from './components/articles/MicroservicesArticles';
import FallingBall from './components/FallingBall';
import DinoRunner from './components/DinoRunner';
import Ebooks from '@/components/Ebooks';
import theme from './theme';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';

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
                    <Route path="/ebooks" element={<Ebooks />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/articles/spring-boot/*" element={<SpringBootArticles />} />
                    <Route path="/articles/react/*" element={<ReactArticles />} />
                    <Route path="/articles/postgresql/*" element={<PostgreSQLArticles />} />
                    <Route path="/articles/docker/*" element={<DockerArticles />} />
                    <Route path="/articles/microservices/*" element={<MicroservicesArticles />} />
                    <Route path="/articles/java/*" element={<JavaArticles />} />
                    <Route path="/games/falling-ball" element={<FallingBall />} />
                    <Route path="/games/dino-runner" element={<DinoRunner />} />
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
