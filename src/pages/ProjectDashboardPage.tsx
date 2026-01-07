import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ProjectDashboard } from '../components/ProjectDashboard';
import {
  getActiveProjectId,
  getActiveSprintId,
  listProjects,
  setActiveProjectId,
} from '../app/sprintLibrary';

export function ProjectDashboardPage() {
  const navigate = useNavigate();
  const [projects] = useState(() => listProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(() => getActiveProjectId());
  const activeSprintId = getActiveSprintId();

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId(undefined);
      return;
    }
    const active = getActiveProjectId();
    const candidate = selectedProjectId ?? active;
    const fallback = projects.find((p) => p.id === candidate)?.id ?? projects[0].id;
    if (fallback !== selectedProjectId) {
      setSelectedProjectId(fallback);
    }
    if (fallback && fallback !== active) {
      setActiveProjectId(fallback);
    }
  }, [projects, selectedProjectId]);

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setActiveProjectId(id);
  };

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0 }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Indicadores gerais do projeto selecionado.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/projects')}>
          Gerenciar projetos
        </Button>
      </Box>

      <ProjectDashboard
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        activeSprintId={activeSprintId}
      />

      {!projects.length && (
        <Button variant="contained" onClick={() => navigate('/projects')}>
          Criar primeiro projeto
        </Button>
      )}
    </Stack>
  );
}
