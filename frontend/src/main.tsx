import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import './index.css';
import App from './App.tsx';
import { SprintStoreProvider } from './app/store';

const theme = createTheme({
  palette: {
    background: {
      default: '#f5f7fb',
      paper: '#ffffff',
    },
    primary: {
      main: '#1d4ed8',
    },
    secondary: {
      main: '#0ea5e9',
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SprintStoreProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </SprintStoreProvider>
  </StrictMode>,
);
