import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.svg';

interface HeaderProps {
  active: 'plan' | 'acomp';
  followUpEnabled?: boolean;
}

export function Header({ active, followUpEnabled = true }: HeaderProps) {
  return (
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
            variant={active === 'plan' ? 'contained' : 'text'}
            color="primary"
          >
            Planejamento
          </Button>
          <Button
            component={NavLink}
            to="/acomp"
            variant={active === 'acomp' ? 'contained' : 'text'}
            color="primary"
            disabled={!followUpEnabled}
            onClick={(e) => {
              if (!followUpEnabled) {
                e.preventDefault();
              }
            }}
          >
            Acompanhamento
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
