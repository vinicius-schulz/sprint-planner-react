import { Fragment, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import { useNavigate } from 'react-router-dom';
import { createProject, getActiveProjectId, listProjects, removeProject, setActiveProjectId } from '../app/sprintLibrary';

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

export function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(() => listProjects());
  const activeProjectId = getActiveProjectId();

  const hasProjects = useMemo(() => projects.length > 0, [projects]);
  const refresh = () => setProjects(listProjects());

  const handleCreate = () => {
    const suggested = `Projeto ${projects.length + 1}`;
    const input = window.prompt('Nome do novo projeto', suggested) ?? '';
    const name = input.trim() || suggested;
    const project = createProject(name);
    refresh();
    navigate(`/projects/${project.id}/sprints`);
  };

  const handleOpen = (id: string) => {
    setActiveProjectId(id);
    navigate(`/projects/${id}/sprints`);
  };

  const handleDelete = (id: string) => {
    const project = projects.find((p) => p.id === id);
    const name = project?.name || id;
    const confirmed = window.confirm(`Excluir ${name}? As sprints ligadas a este projeto também serão removidas.`);
    if (!confirmed) return;
    removeProject(id);
    refresh();
  };

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0 }}>Projetos</Typography>
          <Typography variant="body2" color="text.secondary">Organize sprints por projeto.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Novo projeto
        </Button>
      </Box>

      <Card>
        <CardContent>
          {hasProjects ? (
            <List>
              {projects.map((project, idx) => (
                <Fragment key={project.id}>
                  <ListItem alignItems="flex-start" secondaryAction={(
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<LaunchIcon />}
                        onClick={() => handleOpen(project.id)}
                      >
                        Sprints
                      </Button>
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => handleDelete(project.id)}
                      >
                        Excluir
                      </Button>
                    </Stack>
                  )}>
                    <ListItemText
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1">{project.name}</Typography>
                          {activeProjectId === project.id && (
                            <Chip size="small" color="primary" label="Selecionado" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            Período: {formatDate(project.startDate)} {project.startDate && '—'} {formatDate(project.endDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Atualizado em {formatDate(project.updatedAt)}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                  {idx < projects.length - 1 && <Divider component="li" />}
                </Fragment>
              ))}
            </List>
          ) : (
            <Stack spacing={1} alignItems="flex-start">
              <Typography variant="body2" color="text.secondary">Nenhum projeto cadastrado.</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                Criar primeiro projeto
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
