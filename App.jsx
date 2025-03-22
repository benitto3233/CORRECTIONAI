import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';

// Importation des pages
import Dashboard from './pages/Dashboard';
import NewPage from './pages/NewPage';
import CreateMaterial from './pages/CreateMaterial';
import Grading from './pages/Grading';
import Settings from './pages/Settings';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4361EE',
    },
    secondary: {
      main: '#7209B7',
    },
    background: {
      default: '#f5f7fb',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewPage />} />
          <Route path="/create" element={<CreateMaterial />} />
          <Route path="/grading" element={<Grading />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/activity" element={
            <Layout>
              <Box sx={{ p: 3 }}>
                <h1>Activité récente</h1>
                <p>Cette page affichera l'historique des activités récentes.</p>
              </Box>
            </Layout>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
