import { Container, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import '../App.css';

export function Content() {
  return (
    <>
      <Toolbar />
      <Container className="appContainer" maxWidth="lg" sx={{ pt: 2 }}>
        <Outlet />
      </Container>
    </>
  );
}
