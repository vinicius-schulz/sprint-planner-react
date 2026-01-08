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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { createNewSprint, ensureActiveSprint, getProjectMeta, listSprintSummaries, removeSprint } from '../app/sprintLibrary';
import type { StoredSprintMeta } from '../domain/types';
import { useAppDispatch } from '../app/hooks';
import { hydrateStoreFromState } from '../app/sprintHydrator';

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

export function SprintListPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useAppDispatch();
  const [sprints, setSprints] = useState<StoredSprintMeta[]>([]);
  const [projectName, setProjectName] = useState<string | undefined>(undefined);

  const hasSprints = useMemo(() => sprints.length > 0, [sprints]);

  const refresh = async () => {
    const next = await listSprintSummaries(projectId);
    setSprints(next);
    return next;
  };

  useEffect(() => {
    if (!projectId) {
      setSprints([]);
      setProjectName(undefined);
      return;
    }
    let isActive = true;
    const loadData = async () => {
      const [summaries, project] = await Promise.all([
        listSprintSummaries(projectId),
        getProjectMeta(projectId),
      ]);
      if (!isActive) return;
      setSprints(summaries);
      setProjectName(project?.name);
    };
    void loadData();
    return () => {
      isActive = false;
    };
  }, [projectId]);

  const handleCreate = async () => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
    const suggested = `Sprint ${sprints.length + 1}`;
    const input = window.prompt('Nome da nova sprint', suggested);
    const title = (input ?? suggested).trim();
    const { id, state } = await createNewSprint(title || suggested, projectId);
    hydrateStoreFromState(dispatch, state);
    await ensureActiveSprint(id);
    await refresh();
    navigate(`/plan/${id}`);
  };

  const openSprintContext = async (id: string) => {
    const { state } = await ensureActiveSprint(id);
    hydrateStoreFromState(dispatch, state);
  };

  const handlePlan = async (id: string) => {
    await openSprintContext(id);
    navigate(`/plan/${id}`);
  };

  const handleFollowUp = async (id: string) => {
    await openSprintContext(id);
    navigate(`/acomp/${id}`);
  };

  const handleDelete = async (id: string) => {
    const sprint = sprints.find((s) => s.id === id);
    const name = sprint?.title || id;
    const confirmed = window.confirm(`Excluir ${name}? Essa ação remove a sprint do servidor.`);
    if (!confirmed) return;
    await removeSprint(id);
    await refresh();
  };

  if (!projectId) {
    navigate('/projects');
    return null;
  }

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0 }}>
            Sprints {projectName ? `· ${projectName}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">Selecione uma sprint para planejar ou acompanhar.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Nova sprint
        </Button>
      </Box>

      <Card>
        <CardContent>
          {hasSprints ? (
            <List>
              {sprints.map((sprint, idx) => (
                <Fragment key={sprint.id}>
                  <ListItem alignItems="flex-start" secondaryAction={(
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<LaunchIcon />}
                        onClick={() => handlePlan(sprint.id)}
                      >
                        Planejar
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityOutlinedIcon />}
                        onClick={() => handleFollowUp(sprint.id)}
                        disabled={sprint.status === 'editing'}
                        color="secondary"
                      >
                        Acompanhar
                      </Button>
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => handleDelete(sprint.id)}
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
                          <Typography variant="subtitle1">{sprint.title || 'Sprint sem título'}</Typography>
                          <Chip
                            size="small"
                            label={sprint.status === 'closed' ? 'Fechada' : sprint.status === 'followup' ? 'Em acompanhamento' : 'Em edição'}
                            color={sprint.status === 'closed' ? 'success' : sprint.status === 'followup' ? 'info' : 'warning'}
                          />
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            Período: {formatDate(sprint.startDate)} {sprint.startDate && '—'} {formatDate(sprint.endDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Atualizado em {formatDate(sprint.updatedAt)}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                  {idx < sprints.length - 1 && <Divider component="li" />}
                </Fragment>
              ))}
            </List>
          ) : (
            <Stack spacing={1} alignItems="flex-start">
              <Typography variant="body2" color="text.secondary">Nenhuma sprint salva ainda.</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                Criar primeira sprint
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
