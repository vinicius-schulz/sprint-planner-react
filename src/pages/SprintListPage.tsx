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
import { createNewSprint, ensureActiveSprint, listSprintSummaries, removeSprint } from '../app/sprintLibrary';
import { useAppDispatch } from '../app/hooks';
import { hydrateStoreFromState } from '../app/sprintHydrator';

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

export function SprintListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [sprints, setSprints] = useState(() => listSprintSummaries());

  const hasSprints = useMemo(() => sprints.length > 0, [sprints]);

  const refresh = () => setSprints(listSprintSummaries());

  const handleCreate = () => {
    const suggested = `Sprint ${sprints.length + 1}`;
    const input = window.prompt('Nome da nova sprint', suggested);
    const title = (input ?? suggested).trim();
    const { id, state } = createNewSprint(title || suggested);
    hydrateStoreFromState(dispatch, state);
    ensureActiveSprint(id);
    refresh();
    navigate(`/plan/${id}`);
  };

  const handleOpen = (id: string) => {
    const { state } = ensureActiveSprint(id);
    hydrateStoreFromState(dispatch, state);
    navigate(`/plan/${id}`);
  };

  const handleDelete = (id: string) => {
    const sprint = sprints.find((s) => s.id === id);
    const name = sprint?.title || id;
    const confirmed = window.confirm(`Excluir ${name}? Essa ação remove apenas o rascunho local desta sprint.`);
    if (!confirmed) return;
    removeSprint(id);
    refresh();
  };

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0 }}>Sprints</Typography>
          <Typography variant="body2" color="text.secondary">Selecione ou crie uma sprint para planejar.</Typography>
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
                        variant="outlined"
                        size="small"
                        startIcon={<LaunchIcon />}
                        onClick={() => handleOpen(sprint.id)}
                      >
                        Abrir
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
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1">{sprint.title || 'Sprint sem título'}</Typography>
                          <Chip size="small" label={sprint.status === 'closed' ? 'Fechada' : 'Em edição'} color={sprint.status === 'closed' ? 'success' : 'warning'} />
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
