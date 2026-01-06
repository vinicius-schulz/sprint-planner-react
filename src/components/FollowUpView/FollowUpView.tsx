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
import { formatMinutesToClock } from '../../domain/services/timeFormat';
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

const pad2 = (v: number) => String(v).padStart(2, '0');

const formatISOLocalDateTime = (value: Date) => {
  const yyyy = value.getFullYear();
  const mm = pad2(value.getMonth() + 1);
  const dd = pad2(value.getDate());
  const hh = pad2(value.getHours());
  const min = pad2(value.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const toDateTimeLocalValue = (value?: string): string => {
  if (!value) return '';
  const cleaned = value.replace('Z', '').trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(cleaned)) return cleaned;
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return `${cleaned}T00:00`;
  const isoSpace = cleaned.match(/^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2})/);
  if (isoSpace) return `${isoSpace[1]}T${isoSpace[2]}`;
  const br = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s(\d{2}:\d{2}))?/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}T${br[4] ?? '00:00'}`;
  return '';
};

export function FollowUpView() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.items);
  const members = useAppSelector((state) => state.members.items);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'doing' | 'done'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const [manageTask, setManageTask] = useState<TaskItem | null>(null);

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
  const nowLocalIso = useMemo(() => formatISOLocalDateTime(new Date()), []);

  const handleStatusChange = (task: TaskItem, nextStatus: 'todo' | 'doing' | 'done') => {
    const updates: Partial<Pick<TaskItem, 'status' | 'completedAt'>> = { status: nextStatus };
    if (nextStatus === 'done' && !task.completedAt) {
      updates.completedAt = formatISOLocalDateTime(new Date());
    }
    dispatch(updateTask({ id: task.id, updates }));
  };

  const handleCompletedAtChange = (task: TaskItem, nextDateTime: string) => {
    dispatch(updateTask({ id: task.id, updates: { completedAt: nextDateTime || undefined } }));
  };

  const manageTaskFromStore = useMemo(() => {
    if (!manageTask) return null;
    return tasks.find((t) => t.id === manageTask.id) ?? manageTask;
  }, [tasks, manageTask]);

  const manageTimelineFromStore = manageTaskFromStore?.computedTimeline ?? [];

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
                          type="datetime-local"
                          size="small"
                          variant="standard"
                          value={toDateTimeLocalValue(task.completedAt) || `${todayIso}T00:00`}
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
        <DialogTitle>Detalhes da tarefa</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={1}>
            {!manageTask && <Typography variant="body2">Nenhuma tarefa selecionada.</Typography>}
            {manageTaskFromStore && (
              <>
                <Typography variant="subtitle1" gutterBottom>{manageTaskFromStore.name}</Typography>
                <Typography variant="body2">ID: {manageTaskFromStore.id}</Typography>
                <Typography variant="body2">Responsável: {manageTaskFromStore.assigneeMemberName || '—'}</Typography>
                <Typography variant="body2">Prazo: {manageTaskFromStore.dueDate ?? '—'}</Typography>
                <Typography variant="body2">Início: {formatDateTimeBr(manageTaskFromStore.computedStartDate)}</Typography>
                <Typography variant="body2" gutterBottom>Fim: {formatDateTimeBr(manageTaskFromStore.computedEndDate)}</Typography>
                <Typography variant="body2">Story Points: {manageTaskFromStore.storyPoints}</Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                  <Box sx={{ minWidth: 220 }}>
                    <TextField
                      label="Status"
                      select
                      size="small"
                      fullWidth
                      value={(manageTaskFromStore.status ?? 'todo')}
                      onChange={(e) => handleStatusChange(manageTaskFromStore, e.target.value as 'todo' | 'doing' | 'done')}
                    >
                      {statusOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Box sx={{ minWidth: 260 }}>
                    {(manageTaskFromStore.status ?? 'todo') === 'done' ? (
                      <TextField
                        label="Concluída em"
                        type="datetime-local"
                        size="small"
                        fullWidth
                        value={
                          toDateTimeLocalValue(manageTaskFromStore.completedAt) || nowLocalIso
                        }
                        onChange={(e) => handleCompletedAtChange(manageTaskFromStore, e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <TextField
                        label="Concluída em"
                        size="small"
                        fullWidth
                        value="—"
                        disabled
                      />
                    )}
                  </Box>
                </Stack>

                <Typography variant="body2">Turbo: {manageTaskFromStore.turboEnabled ? manageTaskFromStore.turboStoryPoints : 'Desativado'}</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Plano por dia</Typography>
                {!manageTimelineFromStore.length && (
                  <Typography variant="body2" color="text.secondary">
                    Calcule as datas no planejamento para ver o cronograma detalhado.
                  </Typography>
                )}
                {manageTimelineFromStore.length ? (
                  <List dense>
                    {manageTimelineFromStore.map((seg, idx) => (
                      <div key={`${seg.date}-${seg.startTime}-${seg.endTime}-${idx}`}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={`${formatDateTimeBr(`${seg.date} ${seg.startTime}`)} - ${seg.endTime} (${formatMinutesToClock(seg.minutes)})`}
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                              seg.detail ? (
                                <div>
                                  <Typography component="div" variant="body2">
                                    Nesta tarefa: {formatMinutesToClock(seg.minutes)} · Capacidade do dia: {formatMinutesToClock(seg.detail.capacityMinutes)}
                                  </Typography>
                                  <Typography component="div" variant="body2">
                                    Eventos/recorrentes no dia: {formatMinutesToClock(seg.detail.eventMinutes + seg.detail.recurringMinutes)} · Períodos: {seg.detail.periods.map((p) => `${p.start}-${p.end}`).join(', ')}
                                  </Typography>
                                </div>
                              ) : undefined
                            }
                          />
                        </ListItem>
                        {idx < manageTimelineFromStore.length - 1 && <Divider component="li" />}
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
