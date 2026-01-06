import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Button,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateTask } from '../../features/tasks/tasksSlice';
import type { TaskItem } from '../../domain/types';
import { GanttTimelineFrappe } from '../GanttTimelineFrappe';
import styles from './FollowUpView.module.css';

const formatDateTimeBr = (value?: string) => {
  if (!value) return '-';
  const cleaned = value.replace('T', ' ').replace('Z', '').trim();

  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s(\d{2}:\d{2}))?/);
  if (isoMatch) {
    const [, y, m, d, t] = isoMatch;
    return `${d}/${m}/${y} ${t ?? '00:00'}`;
  }

  const brMatch = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s(\d{2}:\d{2}))?/);
  if (brMatch) {
    const [, d, m, y, t] = brMatch;
    return `${d}/${m}/${y} ${t ?? '00:00'}`;
  }

  return `${cleaned} 00:00`;
};

const statusOptions: Array<{ value: 'todo' | 'doing' | 'done'; label: string }> = [
  { value: 'todo', label: 'A Fazer' },
  { value: 'doing', label: 'Em Progresso' },
  { value: 'done', label: 'Concluída' },
];

const taskManageEventName = 'task-manage-open';
const navigateToPlanningEventName = 'navigate-to-planning';

const formatISODate = (value: Date) => {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export function FollowUpView() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.items);
  const members = useAppSelector((state) => state.members.items);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'doing' | 'done'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const [manageTask, setManageTask] = useState<TaskItem | null>(null);
  const manageTimeline = manageTask?.computedTimeline ?? [];

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && (t.status ?? 'todo') !== statusFilter) return false;
      if (assigneeFilter !== 'all' && (t.assigneeMemberName ?? '') !== assigneeFilter) return false;
      if (!term) return true;
      return `${t.id} ${t.name}`.toLowerCase().includes(term);
    });
  }, [tasks, search, statusFilter, assigneeFilter]);

  const handleOpenManage = useCallback((task: TaskItem) => {
    setManageTask(task);
  }, []);

  const handleCloseManage = () => {
    setManageTask(null);
  };

  useEffect(() => {
    const onOpenManage = (event: Event) => {
      const custom = event as CustomEvent<{ taskId?: string }>;
      const taskId = custom.detail?.taskId;
      if (!taskId) return;
      const task = tasks.find((t) => t.id === taskId);
      if (task) handleOpenManage(task);
    };

    window.addEventListener(taskManageEventName, onOpenManage as EventListener);
    return () => window.removeEventListener(taskManageEventName, onOpenManage as EventListener);
  }, [tasks, handleOpenManage]);

  const dispatchNavigateToPlanning = (taskId: string) => {
    window.dispatchEvent(new CustomEvent(navigateToPlanningEventName, { detail: { taskId } }));
  };

  const todayIso = useMemo(() => formatISODate(new Date()), []);

  const handleStatusChange = (task: TaskItem, nextStatus: 'todo' | 'doing' | 'done') => {
    const updates: Partial<Pick<TaskItem, 'status' | 'completedAt'>> = { status: nextStatus };
    if (nextStatus === 'done' && !task.completedAt) {
      updates.completedAt = todayIso;
    }
    dispatch(updateTask({ id: task.id, updates }));
  };

  const handleCompletedAtChange = (task: TaskItem, nextDate: string) => {
    dispatch(updateTask({ id: task.id, updates: { completedAt: nextDate || undefined } }));
  };

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6">Acompanhamento</Typography>
              <Typography variant="body2" color="text.secondary">Atualize status e conclusão. Para editar planejamento, use Planejamento.</Typography>
            </Box>
            <Box className={styles.filters}>
              <TextField
                label="Busca (ID ou nome)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
              />
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                size="small"
              >
                <MenuItem value="all">Todos</MenuItem>
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Responsável"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="all">Todos</MenuItem>
                {members.map((m) => (
                  <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <GanttTimelineFrappe inline title="Acompanhamento - Gantt" uniformDoneColor />

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Lista de tarefas</Typography>
          <div className={styles.tableWrap}>
            <Table size="small" className={styles.table}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Responsável</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Prazo</TableCell>
                  <TableCell>Concluída em</TableCell>
                  <TableCell>Início</TableCell>
                  <TableCell>Fim</TableCell>
                  <TableCell>SP</TableCell>
                  <TableCell width={80}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10}>Nenhuma tarefa encontrada com os filtros.</TableCell>
                  </TableRow>
                )}
                {filteredTasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>{task.id}</TableCell>
                    <TableCell>{task.name}</TableCell>
                    <TableCell>{task.assigneeMemberName || '—'}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        variant="standard"
                        value={(task.status ?? 'todo')}
                        onChange={(e) => handleStatusChange(task, e.target.value as 'todo' | 'doing' | 'done')}
                      >
                        {statusOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>{task.dueDate ? formatDateTimeBr(task.dueDate) : '—'}</TableCell>
                    <TableCell>
                      {(task.status ?? 'todo') === 'done' ? (
                        <TextField
                          type="date"
                          size="small"
                          variant="standard"
                          value={task.completedAt ?? todayIso}
                          onChange={(e) => handleCompletedAtChange(task, e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{formatDateTimeBr(task.computedStartDate)}</TableCell>
                    <TableCell>{formatDateTimeBr(task.computedEndDate)}</TableCell>
                    <TableCell>{task.storyPoints}</TableCell>
                    <TableCell>
                      <IconButton aria-label="detalhes" onClick={() => handleOpenManage(task)} size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!manageTask} onClose={handleCloseManage} maxWidth="md" fullWidth>
        <DialogTitle>Detalhes da tarefa (somente leitura)</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={1}>
            {!manageTask && <Typography variant="body2">Nenhuma tarefa selecionada.</Typography>}
            {manageTask && (
              <>
                <Typography variant="subtitle1" gutterBottom>{manageTask.name}</Typography>
                <Typography variant="body2">ID: {manageTask.id}</Typography>
                <Typography variant="body2">Responsável: {manageTask.assigneeMemberName || '—'}</Typography>
                <Typography variant="body2">Prazo: {manageTask.dueDate ?? '—'}</Typography>
                <Typography variant="body2">Início: {formatDateTimeBr(manageTask.computedStartDate)}</Typography>
                <Typography variant="body2" gutterBottom>Fim: {formatDateTimeBr(manageTask.computedEndDate)}</Typography>
                <Typography variant="body2">Story Points: {manageTask.storyPoints}</Typography>
                <Typography variant="body2">Status: {statusOptions.find((o) => o.value === (manageTask.status ?? 'todo'))?.label ?? 'A Fazer'}</Typography>
                <Typography variant="body2">Concluída em: {manageTask.completedAt ? formatDateTimeBr(manageTask.completedAt) : '—'}</Typography>
                <Typography variant="body2">Turbo: {manageTask.turboEnabled ? manageTask.turboStoryPoints : 'Desativado'}</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Plano por dia</Typography>
                {!manageTimeline.length && (
                  <Typography variant="body2" color="text.secondary">
                    Calcule as datas no planejamento para ver o cronograma detalhado.
                  </Typography>
                )}
                {manageTimeline.length ? (
                  <List dense>
                    {manageTimeline.map((seg, idx) => (
                      <div key={`${seg.date}-${seg.startTime}-${seg.endTime}-${idx}`}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={`${formatDateTimeBr(`${seg.date} ${seg.startTime}`)} - ${seg.endTime} (${seg.minutes} min)`}
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                              seg.detail ? (
                                <>
                                  <Typography component="div" variant="body2">Períodos do dia: {seg.detail.periods.map((p) => `${p.start}-${p.end}`).join(', ')}</Typography>
                                  <Typography component="div" variant="body2">
                                    Capacidade do dia: {seg.detail.capacityMinutes} min (base {seg.detail.baseMinutes} - eventos {seg.detail.eventMinutes} - recorrentes {seg.detail.recurringMinutes})
                                  </Typography>
                                  <Typography component="div" variant="body2">
                                    Disponibilidade/fatores: {seg.detail.availabilityPercent}% × sen {seg.detail.seniorityFactor} × mat {seg.detail.maturityFactor}
                                  </Typography>
                                  <Typography component="div" variant="body2">
                                    Uso antes desta tarefa: {seg.detail.usedBeforeMinutes} min
                                  </Typography>
                                  <Typography component="div" variant="body2">
                                    Eventos: {seg.detail.events.length ? seg.detail.events.map((e) => `${e.label} (${e.minutes}m)`).join(', ') : 'Nenhum'}
                                  </Typography>
                                </>
                              ) : undefined
                            }
                          />
                        </ListItem>
                        {idx < manageTimeline.length - 1 && <Divider component="li" />}
                      </div>
                    ))}
                  </List>
                ) : null}
              </>
            )}
          </Box>
        </DialogContent>
        {manageTask && (
          <Stack direction="row" spacing={1} sx={{ px: 3, py: 2, justifyContent: 'flex-end' }}>
            <Button color="secondary" onClick={() => dispatchNavigateToPlanning(manageTask.id)}>
              Abrir no planejamento
            </Button>
            <Button onClick={handleCloseManage}>Fechar</Button>
          </Stack>
        )}
      </Dialog>
    </div>
  );
}
