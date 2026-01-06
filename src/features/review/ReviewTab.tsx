import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { DEFAULT_CONFIG } from '../../domain/constants';
import { selectTaskSchedules, selectTeamCapacity } from '../../domain/services/capacityService';
import { savePlanningToExternalApi } from '../../domain/services/externalApiMock';
import { GanttTimelineFrappe } from '../../components/GanttTimelineFrappe';
import { closePlanning } from './planningLifecycleSlice';
import type { TaskItem } from '../../domain/types';

type ReviewTabProps = {
  onSaved: () => void;
};

const formatDateTimeBr = (value?: string) => {
  if (!value) return '—';
  const cleaned = value.replace('T', ' ').replace('Z', '').trim();

  const isoMatch = cleaned.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})(?:\s([0-9]{2}:[0-9]{2}))?/);
  if (isoMatch) {
    const [, y, m, d, t] = isoMatch;
    return `${d}/${m}/${y}${t ? ` ${t}` : ''}`;
  }

  const brMatch = cleaned.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})(?:\s([0-9]{2}:[0-9]{2}))?/);
  if (brMatch) {
    const [, d, m, y, t] = brMatch;
    return `${d}/${m}/${y}${t ? ` ${t}` : ''}`;
  }

  return cleaned;
};

const isAfterSprint = (task: TaskItem, sprintEnd?: string) => {
  if (!sprintEnd) return false;
  const endDate = task.computedTimeline?.[task.computedTimeline.length - 1]?.date;
  if (endDate) return endDate > sprintEnd;
  const match = task.computedEndDate?.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const iso = `${match[3]}-${match[2]}-${match[1]}`;
    return iso > sprintEnd;
  }
  return false;
};

export function ReviewTab({ onSaved }: ReviewTabProps) {
  const dispatch = useAppDispatch();
  const sprint = useAppSelector((state) => state.sprint);
  const calendar = useAppSelector((state) => state.calendar);
  const config = useAppSelector((state) => state.config.value);
  const members = useAppSelector((state) => state.members.items);
  const events = useAppSelector((state) => state.events.items);
  const tasks = useAppSelector((state) => state.tasks.items);
  const planningLifecycle = useAppSelector((state) => state.planningLifecycle);
  const planningClosed = planningLifecycle.status === 'closed';

  const teamCapacity = useAppSelector(selectTeamCapacity);
  const schedule = useAppSelector(selectTaskSchedules);

  const countedMemberNames = useMemo(() => {
    const countedTypes = new Set(config.countedMemberTypes ?? DEFAULT_CONFIG.countedMemberTypes);
    const names = new Set<string>();
    members.forEach((m) => {
      if (countedTypes.has(m.roleType)) names.add(m.name);
    });
    return names;
  }, [members, config.countedMemberTypes]);

  const effectiveStoryPoints = (task: TaskItem): number => {
    if (task.turboEnabled && Number.isFinite(task.turboStoryPoints)) {
      return Math.max(0, Number(task.turboStoryPoints));
    }
    return task.storyPoints;
  };

  const totalStoryPoints = useMemo(() => {
    return tasks.reduce((sum, t) => {
      if (t.assigneeMemberName && !countedMemberNames.has(t.assigneeMemberName)) return sum;
      return sum + effectiveStoryPoints(t);
    }, 0);
  }, [tasks, countedMemberNames]);

  const capacityStoryPoints = teamCapacity.totalStoryPoints;
  const capacityRatio = capacityStoryPoints > 0 ? totalStoryPoints / capacityStoryPoints : Infinity;
  const warnLimit = 1 + config.workloadWarningOver;
  const errLimit = 1 + config.workloadErrorOver;
  const capacitySeverity = capacityStoryPoints <= 0 && totalStoryPoints > 0
    ? 'error'
    : capacityRatio > errLimit
      ? 'error'
      : capacityRatio > warnLimit
        ? 'warning'
        : null;

  const overshootTasks = useMemo(() => tasks.filter((t) => isAfterSprint(t, sprint.endDate)), [tasks, sprint.endDate]);
  const closedAtLabel = planningLifecycle.closedAt ? formatDateTimeBr(planningLifecycle.closedAt) : null;

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCloseToast = () => setToast((prev) => ({ ...prev, open: false }));

  const handleSave = async () => {
    const confirmed = window.confirm('Salvar planejamento na API externa (mock) e fechar edição? Após salvar, o planejamento ficará bloqueado até ser reaberto. Deseja continuar?');
    if (!confirmed) return;

    try {
      setSaving(true);
      const result = await savePlanningToExternalApi({
        sprint,
        calendar,
        config,
        members,
        events,
        tasks,
        computed: schedule,
      });
      setToast({ open: true, message: result.message, severity: result.ok ? 'success' : 'error' });
      if (result.ok) {
        dispatch(closePlanning());
        onSaved();
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Falha ao salvar na API externa (mock).', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box>
              <Typography variant="h6">Revisão</Typography>
              <Typography variant="body2" color="text.secondary">
                Revise o planejamento completo e confirme o planejamento.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || planningClosed}
            >
              {planningClosed ? 'Planejamento fechado' : saving ? 'Salvando…' : 'Salvar e fechar'}
            </Button>
          </Stack>
          <Alert severity={planningClosed ? 'info' : 'warning'} sx={{ mt: 2 }}>
            {planningClosed
              ? `Planejamento fechado${closedAtLabel ? ` em ${closedAtLabel}` : ''}. Para editar novamente, reabra o planejamento.`
              : 'Ao salvar, o planejamento será bloqueado para edição. Para editar novamente, será preciso reabrir o planejamento.'}
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Alertas</Typography>

          {schedule.errors.length > 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              Cronograma contém avisos/erros: {schedule.errors.join(' | ')}
            </Alert>
          )}

          {capacitySeverity && (
            <Alert severity={capacitySeverity === 'error' ? 'error' : 'warning'} sx={{ mb: 1 }}>
              Story Points planejados ({totalStoryPoints}) excedem a capacidade da sprint ({capacityStoryPoints}).
              Limites: aviso até {Math.round((warnLimit - 1) * 100)}% e erro acima de {Math.round((errLimit - 1) * 100)}% sobre a capacidade.
            </Alert>
          )}

          {overshootTasks.length > 0 && (
            <Alert severity="warning">
              Tarefas fora do fim da sprint: {overshootTasks.map((t) => `${t.id} (${t.name})`).join(', ')}.
            </Alert>
          )}

          {schedule.errors.length === 0 && !capacitySeverity && overshootTasks.length === 0 && (
            <Alert severity="success">Nenhum alerta encontrado.</Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Resumo do planejamento</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">Sprint: {formatDateTimeBr(sprint.startDate)} → {formatDateTimeBr(sprint.endDate)}</Typography>
            <Typography variant="body2">Membros: {members.length}</Typography>
            <Typography variant="body2">Eventos: {events.length}</Typography>
            <Typography variant="body2">Tarefas: {tasks.length}</Typography>
          </Stack>
        </CardContent>
      </Card>

      <GanttTimelineFrappe inline title="Revisão - Gantt" />

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Tarefas (visão de revisão)</Typography>
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell>SP</TableCell>
                <TableCell>Prazo</TableCell>
                <TableCell>Início</TableCell>
                <TableCell>Fim</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>Nenhuma tarefa cadastrada.</TableCell>
                </TableRow>
              )}
              {tasks.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.assigneeMemberName || '—'}</TableCell>
                  <TableCell>{t.storyPoints}</TableCell>
                  <TableCell>{t.dueDate ? formatDateTimeBr(t.dueDate) : '—'}</TableCell>
                  <TableCell>{formatDateTimeBr(t.computedStartDate)}</TableCell>
                  <TableCell>{formatDateTimeBr(t.computedEndDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Snackbar open={toast.open} autoHideDuration={3500} onClose={handleCloseToast}>
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
