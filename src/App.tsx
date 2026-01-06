import { useEffect } from 'react';
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import logo from './assets/logo.svg';
import { FollowUpPage } from './pages/FollowUpPage';
import { PlanningPage } from './pages/PlanningPage';

const taskManageEventName = 'task-manage-open';
const navigateToPlanningEventName = 'navigate-to-planning';

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onNavigateToPlanning = (event: Event) => {
      const custom = event as CustomEvent<{ taskId?: string }>;
      const taskId = custom.detail?.taskId;
      navigate('/plan', { state: taskId ? { taskId } : undefined });
      window.setTimeout(() => {
        if (taskId) {
          window.dispatchEvent(new CustomEvent(taskManageEventName, { detail: { taskId } }));
        }
      }, 0);
    };

    window.addEventListener(navigateToPlanningEventName, onNavigateToPlanning as EventListener);
    return () => window.removeEventListener(navigateToPlanningEventName, onNavigateToPlanning as EventListener);
  }, [navigate]);

  const isPlan = location.pathname.startsWith('/plan');
  const isAcomp = location.pathname.startsWith('/acomp');

  return (
    <>
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{ width: 40, height: 40, borderRadius: 2, boxShadow: 1, bgcolor: 'background.paper' }}
            />
            <Typography variant="h6" sx={{ mb: 0 }}>
              Calculadora de Capacidade Scrum
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              component={NavLink}
              to="/plan"
              variant={isPlan ? 'contained' : 'text'}
              color="primary"
            >
              Planejamento
            </Button>
            <Button
              component={NavLink}
              to="/acomp"
              variant={isAcomp ? 'contained' : 'text'}
              color="primary"
            >
              Acompanhamento
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Container className="appContainer" maxWidth="lg" sx={{ pt: 2 }}>
        <Outlet />
      </Container>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/plan" replace />} />
          <Route path="plan" element={<PlanningPage />} />
          <Route path="acomp" element={<FollowUpPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
