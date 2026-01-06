import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import './index.css';
import App from './App.tsx';
import { createAppStore } from './app/store';
import { ensureActiveSprint } from './app/sprintLibrary';

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

const pathMatch = window.location.pathname.match(/^\/(?:plan|acomp)\/([^/]+)/);
const requestedSprintId = pathMatch?.[1];
const { state: preloadedState } = ensureActiveSprint(requestedSprintId);
const store = createAppStore(preloadedState);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
