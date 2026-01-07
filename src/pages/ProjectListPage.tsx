import { Fragment, useEffect, useMemo, useState } from 'react';
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
import { ProjectModal } from '../components/ProjectModal';
import type { ProjectModalData } from '../components/ProjectModal';
import { ProjectDashboard } from '../components/ProjectDashboard';
import {
  createProject,
  getActiveProjectId,
  getActiveSprintId,
  listProjects,
  removeProject,
  setActiveProjectId,
  updateProject,
} from '../app/sprintLibrary';

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

export function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(() => listProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(() => getActiveProjectId());
  const activeSprintId = getActiveSprintId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const editingProject = editingProjectId ? projects.find((p) => p.id === editingProjectId) : undefined;

  const hasProjects = useMemo(() => projects.length > 0, [projects]);
  const refresh = () => {
    const next = listProjects();
    setProjects(next);
    return next;
  };

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

  const handleOpenCreate = () => {
    setEditingProjectId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setEditingProjectId(id);
    setIsModalOpen(true);
  };

  const handleOpen = (id: string) => {
    setActiveProjectId(id);
    setSelectedProjectId(id);
    navigate(`/projects/${id}/sprints`);
  };

  const handleDelete = (id: string) => {
    const project = projects.find((p) => p.id === id);
    const name = project?.name || id;
    const confirmed = window.confirm(`Excluir ${name}? As sprints ligadas a este projeto também serão removidas.`);
    if (!confirmed) return;
    removeProject(id);
    const next = refresh();
    if (selectedProjectId === id) {
      const fallback = next[0]?.id;
      setSelectedProjectId(fallback);
      if (fallback) {
        setActiveProjectId(fallback);
      }
    }
  };

  const handleSave = (data: ProjectModalData) => {
    if (editingProjectId && editingProject) {
      updateProject({ ...editingProject, ...data });
    } else {
      const project = createProject(data);
      setActiveProjectId(project.id);
      setSelectedProjectId(project.id);
      navigate(`/projects/${project.id}/sprints`);
    }
    refresh();
    setIsModalOpen(false);
  };

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0 }}>Projetos</Typography>
          <Typography variant="body2" color="text.secondary">Organize sprints por projeto.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Novo projeto
        </Button>
      </Box>

      <ProjectDashboard
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        activeSprintId={activeSprintId}
      />

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
                        onClick={() => handleOpenEdit(project.id)}
                      >
                        Editar
                      </Button>
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
                          {selectedProjectId === project.id && (
                            <Chip size="small" color="primary" label="Selecionado" />
                          )}
                          <Chip
                            size="small"
                            label={
                              project.status === 'archived'
                                ? 'Arquivado'
                                : project.status === 'draft'
                                  ? 'Rascunho'
                                  : 'Ativo'
                            }
                            color={project.status === 'archived' ? 'default' : project.status === 'draft' ? 'warning' : 'success'}
                          />
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
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                Criar primeiro projeto
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      <ProjectModal
        open={isModalOpen}
        initialProject={editingProject}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </Stack>
  );
}
