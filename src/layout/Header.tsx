import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.svg';

interface HeaderProps {
  active: 'projects' | 'sprints' | 'plan' | 'acomp';
  followUpEnabled?: boolean;
  sprintId?: string;
  projectId?: string;
}

export function Header({ active, followUpEnabled = true, sprintId, projectId }: HeaderProps) {
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
            to="/projects"
            variant={active === 'projects' ? 'contained' : 'text'}
            color="primary"
          >
            Projetos
          </Button>
          <Button
            component={NavLink}
            to={projectId ? `/projects/${projectId}/sprints` : '/projects'}
            variant={active === 'sprints' ? 'contained' : 'text'}
            color="primary"
            disabled={!projectId}
          >
            Sprints
          </Button>
          <Button
            component={NavLink}
            to={sprintId ? `/plan/${sprintId}` : '/sprints'}
            variant={active === 'plan' ? 'contained' : 'text'}
            color="primary"
            disabled={!sprintId}
          >
            Planejamento
          </Button>
          <Button
            component={NavLink}
            to={sprintId ? `/acomp/${sprintId}` : '/sprints'}
            variant={active === 'acomp' ? 'contained' : 'text'}
            color="primary"
            disabled={!followUpEnabled || !sprintId}
            onClick={(e) => {
              if (!followUpEnabled || !sprintId) {
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
