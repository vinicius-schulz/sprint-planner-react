import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ProjectDashboard } from '../components/ProjectDashboard';
import {
  listProjects,
} from '../app/sprintLibrary';

export function ProjectDashboardPage() {
  const navigate = useNavigate();
  const [projects] = useState(() => listProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<'all' | string>('all');

  useEffect(() => {
    if (selectedProjectId === 'all') return;
    if (!projects.find((project) => project.id === selectedProjectId)) {
      setSelectedProjectId('all');
    }
  }, [projects, selectedProjectId]);

  const handleSelectProject = (id: 'all' | string) => {
    setSelectedProjectId(id);
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
      />

      {!projects.length && (
        <Button variant="contained" onClick={() => navigate('/projects')}>
          Criar primeiro projeto
        </Button>
      )}
    </Stack>
  );
}
