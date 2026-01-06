import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
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
import { AppSnackbar } from '../../components/Toast';
import { closePlanning } from './planningLifecycleSlice';
import type { TaskItem } from '../../domain/types';

export type PlanningStepKey = 'sprint' | 'events' | 'team' | 'tasks' | 'review';

type ReviewTabProps = {
  onSaved: () => void;
  onEditStep?: (step: PlanningStepKey) => void;
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

export function ReviewTab({ onSaved, onEditStep }: ReviewTabProps) {
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

  const baseStoryPoints = (task: TaskItem): number => task.storyPoints;

  const effectiveStoryPoints = (task: TaskItem): number => {
    if (task.turboEnabled && Number.isFinite(task.turboStoryPoints)) {
      return Math.max(0, Number(task.turboStoryPoints));
    }
    return task.storyPoints;
  };

  const totalBaseStoryPoints = useMemo(() => tasks.reduce((sum, t) => sum + baseStoryPoints(t), 0), [tasks]);

  const totalBaseStoryPointsCounted = useMemo(() => {
    return tasks.reduce((sum, t) => {
      if (t.assigneeMemberName && !countedMemberNames.has(t.assigneeMemberName)) return sum;
      return sum + baseStoryPoints(t);
    }, 0);
  }, [tasks, countedMemberNames]);

  const totalEffectiveStoryPoints = useMemo(() => tasks.reduce((sum, t) => sum + effectiveStoryPoints(t), 0), [tasks]);

  const totalEffectiveStoryPointsCounted = useMemo(() => {
    return tasks.reduce((sum, t) => {
      if (t.assigneeMemberName && !countedMemberNames.has(t.assigneeMemberName)) return sum;
      return sum + effectiveStoryPoints(t);
    }, 0);
  }, [tasks, countedMemberNames]);

  const storyPointsByMemberBase = useMemo(() => {
    const acc = new Map<string, number>();
    tasks.forEach((t) => {
      if (!t.assigneeMemberName) return;
      const prev = acc.get(t.assigneeMemberName) ?? 0;
      acc.set(t.assigneeMemberName, prev + baseStoryPoints(t));
    });
    return acc;
  }, [tasks]);

  const storyPointsByMemberEffective = useMemo(() => {
    const acc = new Map<string, number>();
    tasks.forEach((t) => {
      if (!t.assigneeMemberName) return;
      const prev = acc.get(t.assigneeMemberName) ?? 0;
      acc.set(t.assigneeMemberName, prev + effectiveStoryPoints(t));
    });
    return acc;
  }, [tasks]);

  const capacityStoryPoints = teamCapacity.totalStoryPoints;
  const capacityRatio = capacityStoryPoints > 0 ? totalEffectiveStoryPointsCounted / capacityStoryPoints : Infinity;
  const warnLimit = 1 + config.workloadWarningOver;
  const errLimit = 1 + config.workloadErrorOver;
  const capacitySeverity = capacityStoryPoints <= 0 && totalEffectiveStoryPoints > 0
    ? 'error'
    : capacityRatio > errLimit
      ? 'error'
      : capacityRatio > warnLimit
        ? 'warning'
        : null;

  const overshootTasks = useMemo(() => tasks.filter((t) => isAfterSprint(t, sprint.endDate)), [tasks, sprint.endDate]);
  const closedAtLabel = planningLifecycle.closedAt ? formatDateTimeBr(planningLifecycle.closedAt) : null;

  const hasWorkingDay = calendar.daySchedules.some((d) => !d.isNonWorking);
  const sprintValid = Boolean(sprint.startDate && sprint.endDate && hasWorkingDay);
  const teamValid = members.some((m) => (m.availabilityPercent ?? 0) > 0);
  const tasksValid = tasks.length > 0 && tasks.every((t) => Boolean(t.assigneeMemberName));

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!sprintValid) errors.push('Defina a sprint com pelo menos um dia útil configurado.');
    if (!teamValid) errors.push('Inclua pelo menos um integrante do time com disponibilidade maior que 0%.');
    if (!tasksValid) errors.push('Cadastre pelo menos uma tarefa e atribua todas a um responsável.');
    return errors;
  }, [sprintValid, teamValid, tasksValid]);

  const hasValidationErrors = validationErrors.length > 0;
  const hasCriticalAlerts = hasValidationErrors
    || schedule.errors.length > 0
    || capacitySeverity === 'error'
    || overshootTasks.length > 0;

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCloseToast = () => setToast((prev) => ({ ...prev, open: false }));

  const handleSave = async () => {
    if (hasValidationErrors) {
      setToast({ open: true, message: 'Corrija as pendências de validação antes de salvar.', severity: 'error' });
      return;
    }
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
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Alertas</Typography>
            {onEditStep && (
              <Button variant="outlined" size="small" onClick={() => onEditStep('tasks')}>
                Ajustar tarefas
              </Button>
            )}
          </Stack>

          {schedule.errors.length > 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              Cronograma contém avisos/erros: {schedule.errors.join(' | ')}
            </Alert>
          )}

          {hasValidationErrors && (
            <Alert severity="error" sx={{ mb: 1 }}>
              Pendências de validação: {validationErrors.join(' | ')}
            </Alert>
          )}

          {capacitySeverity && (
            <Alert severity={capacitySeverity === 'error' ? 'error' : 'warning'} sx={{ mb: 1 }}>
              Story Points planejados (efetivos) ({totalEffectiveStoryPoints}) excedem a capacidade da sprint ({capacityStoryPoints}).
              Limites: aviso até {Math.round((warnLimit - 1) * 100)}% e erro acima de {Math.round((errLimit - 1) * 100)}% sobre a capacidade.
            </Alert>
          )}

          {overshootTasks.length > 0 && (
            <Alert severity="warning">
              Tarefas fora do fim da sprint: {overshootTasks.map((t) => `${t.id} (${t.name})`).join(', ')}.
            </Alert>
          )}

          {!hasCriticalAlerts && (
            <Alert severity="success">Nenhum alerta crítico encontrado.</Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Resumo do planejamento</Typography>
            {onEditStep && (
              <Button variant="outlined" size="small" onClick={() => onEditStep('sprint')}>
                Ajustar sprint
              </Button>
            )}
          </Stack>
          {!sprintValid && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Defina a sprint e garanta pelo menos um dia útil configurado.
            </Alert>
          )}
          <Stack spacing={2}>
            <Stack spacing={1}>
              <Typography variant="body2">Título da sprint: {sprint.title || '—'}</Typography>
              <Typography variant="body2">Período: {formatDateTimeBr(sprint.startDate)} → {formatDateTimeBr(sprint.endDate)}</Typography>
              <Typography variant="body2">Calendário: {calendar.daySchedules.length} dias configurados · Não úteis manuais: {calendar.nonWorkingDaysManual.length} · Fins de semana removidos: {calendar.nonWorkingDaysRemoved.length}</Typography>
            </Stack>
            <Divider />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
              <Box flex={1} minWidth={0}>
                <Typography variant="subtitle2" gutterBottom>Configuração</Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2">Horas/dia: {config.dailyWorkHours}</Typography>
                  <Typography variant="body2">SP/hora: {config.storyPointsPerHour}</Typography>
                  <Typography variant="body2">Estratégia: {config.schedulingStrategy ?? DEFAULT_CONFIG.schedulingStrategy}</Typography>
                  <Typography variant="body2">Escala SP: {config.storyPointScale.join(', ')}</Typography>
                  <Typography variant="body2">Limite aviso: +{Math.round(config.workloadWarningOver * 100)}% · Limite erro: +{Math.round(config.workloadErrorOver * 100)}%</Typography>
                  <Typography variant="body2">Períodos padrão: {config.defaultWorkingPeriods.map((p) => `${p.start}-${p.end}`).join('; ')}</Typography>
                  <Typography variant="body2">Tipos contabilizados: {config.countedMemberTypes.join(', ')}</Typography>
                </Stack>
              </Box>
              <Box flex={1} minWidth={0}>
                <Typography variant="subtitle2" gutterBottom>Capacidade</Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2">Membros contabilizados: {Array.from(countedMemberNames).length} / {members.length}</Typography>
                  <Typography variant="body2">Capacidade em SP: {capacityStoryPoints}</Typography>
                  <Typography variant="body2">SP planejados (base, todos): {totalBaseStoryPoints}</Typography>
                  <Typography variant="body2">SP planejados (base, papéis contados): {totalBaseStoryPointsCounted}</Typography>
                  <Typography variant="body2">SP efetivos (turbo, todos): {totalEffectiveStoryPoints}</Typography>
                  <Typography variant="body2">SP efetivos (turbo, papéis contados): {totalEffectiveStoryPointsCounted}</Typography>
                  <Typography variant="body2">Relação (efetivos contados / capacidade): {capacityStoryPoints > 0 ? capacityRatio.toFixed(2) : '—'}</Typography>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Calendário (dias da sprint)</Typography>
            {onEditStep && (
              <Button variant="outlined" size="small" onClick={() => onEditStep('sprint')}>
                Ajustar calendário
              </Button>
            )}
          </Stack>
          {!sprintValid && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Configure pelo menos um dia útil para a sprint.
            </Alert>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Períodos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calendar.daySchedules.length === 0 && (
                <TableRow><TableCell colSpan={3}>Nenhum dia configurado. Use o passo Sprint para gerar a agenda.</TableCell></TableRow>
              )}
              {calendar.daySchedules.map((d) => (
                <TableRow key={d.date}>
                  <TableCell>{formatDateTimeBr(d.date)}</TableCell>
                  <TableCell>{d.isNonWorking ? 'Não útil' : 'Útil'}</TableCell>
                  <TableCell>{d.periods.length ? d.periods.map((p) => `${p.start}-${p.end}`).join('; ') : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Time</Typography>
            {onEditStep && (
              <Button variant="outlined" size="small" onClick={() => onEditStep('team')}>
                Ajustar time
              </Button>
            )}
          </Stack>
          {!teamValid && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Inclua ao menos um membro com disponibilidade maior que 0%.
            </Alert>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Função</TableCell>
                <TableCell>Senioridade</TableCell>
                <TableCell>Maturidade</TableCell>
                <TableCell>Disponibilidade</TableCell>
                <TableCell>SP planejado (base)</TableCell>
                <TableCell>SP efetivo (turbo)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.length === 0 && (
                <TableRow><TableCell colSpan={7}>Nenhum membro cadastrado.</TableCell></TableRow>
              )}
              {members.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.roleType}</TableCell>
                  <TableCell>{m.seniority}</TableCell>
                  <TableCell>{m.maturity}</TableCell>
                  <TableCell>{m.availabilityPercent}%</TableCell>
                  <TableCell>{storyPointsByMemberBase.get(m.name) ?? 0}</TableCell>
                  <TableCell>{storyPointsByMemberEffective.get(m.name) ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Eventos</Typography>
            {onEditStep && (
              <Button variant="outlined" size="small" onClick={() => onEditStep('events')}>
                Ajustar eventos
              </Button>
            )}
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Duração (min)</TableCell>
                <TableCell>Recorrente</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 && (
                <TableRow><TableCell colSpan={5}>Nenhum evento cadastrado.</TableCell></TableRow>
              )}
              {events.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell>{e.type}</TableCell>
                  <TableCell>{e.description || '—'}</TableCell>
                  <TableCell>{formatDateTimeBr(e.date)}</TableCell>
                  <TableCell>{e.minutes}</TableCell>
                  <TableCell>{e.recurringDaily ? 'Sim' : 'Não'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>



      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Tarefas (visão de revisão)</Typography>
            {onEditStep && (
              <Button variant="outlined" size="small" onClick={() => onEditStep('tasks')}>
                Ajustar tarefas
              </Button>
            )}
          </Stack>
          {!tasksValid && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Cadastre pelo menos uma tarefa e atribua todas a um responsável.
            </Alert>
          )}
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell>SP planejado</TableCell>
                <TableCell>Turbo</TableCell>
                <TableCell>SP efetivo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Concluída em</TableCell>
                <TableCell>Prazo</TableCell>
                <TableCell>Início</TableCell>
                <TableCell>Fim</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10}>Nenhuma tarefa cadastrada.</TableCell>
                </TableRow>
              )}
              {tasks.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.assigneeMemberName || '—'}</TableCell>
                  <TableCell>{t.storyPoints}</TableCell>
                  <TableCell>{t.turboEnabled ? t.turboStoryPoints ?? '—' : 'Desativado'}</TableCell>
                  <TableCell>{effectiveStoryPoints(t)}</TableCell>
                  <TableCell>{t.status ?? '—'}</TableCell>
                  <TableCell>{t.status === 'done' ? formatDateTimeBr(t.completedAt) : '—'}</TableCell>
                  <TableCell>{t.dueDate ? formatDateTimeBr(t.dueDate) : '—'}</TableCell>
                  <TableCell>{formatDateTimeBr(t.computedStartDate)}</TableCell>
                  <TableCell>{formatDateTimeBr(t.computedEndDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">Gantt</Typography>
          {onEditStep && (
            <Button variant="outlined" size="small" onClick={() => onEditStep('tasks')}>
              Ajustar tarefas
            </Button>
          )}
        </Stack>
        <GanttTimelineFrappe inline title="Revisão - Gantt" />
      </Stack>

      <AppSnackbar
        open={toast.open}
        autoHideDuration={3500}
        severity={toast.severity}
        message={toast.message}
        onClose={handleCloseToast}
      />
    </Stack>
  );
}
