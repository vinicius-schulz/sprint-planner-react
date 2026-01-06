import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateTask } from '../../features/tasks/tasksSlice';
import type { TaskItem } from '../../domain/types';
import { formatMinutesToClock } from '../../domain/services/timeFormat';
import { GanttTimelineFrappe } from '../GanttTimelineFrappe';
import { TasksTable } from '../../features/tasks/components/TasksTable';
import { TaskManageDialog } from '../../features/tasks/components/TaskManageDialog';
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
          <TasksTable
            variant="followUp"
            tasks={filteredTasks}
            members={members.map((m) => ({ id: m.id, name: m.name }))}
            formatDateTime={formatDateTimeBr}
            onOpenManage={handleOpenManage}
            statusOptions={statusOptions}
            onStatusChange={handleStatusChange}
            onCompletedAtChange={handleCompletedAtChange}
            toDateTimeLocalValue={toDateTimeLocalValue}
            todayIso={todayIso}
          />
        </CardContent>
      </Card>

      <TaskManageDialog
        open={!!manageTask}
        task={manageTaskFromStore}
        manageDraft={null}
        manageTurboValue={0}
        manageTab="resumo"
        onTabChange={() => {}}
        onClose={handleCloseManage}
        formatDateTime={formatDateTimeBr}
        formatMinutesToClock={formatMinutesToClock}
        statusOptions={statusOptions}
        onStatusChange={handleStatusChange}
        onCompletedAtChange={handleCompletedAtChange}
        toDateTimeLocalValue={toDateTimeLocalValue}
        nowLocalIso={nowLocalIso}
        onNavigateToPlanning={dispatchNavigateToPlanning}
      />
    </div>
  );
}
