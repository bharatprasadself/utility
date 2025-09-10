import { ThemeProvider, CssBaseline } from '@mui/material';
import Dashboard from './components/Dashboard';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dashboard />
    </ThemeProvider>
  );
}

export default App
