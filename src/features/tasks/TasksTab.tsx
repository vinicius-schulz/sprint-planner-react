import { useMemo, useState, useEffect } from 'react';
import type { DragEvent, ReactNode } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addTask, removeTask, replaceTasks, setComputedTasks, updateTask } from './tasksSlice';
import { validateTask } from '../../domain/services/validators';
import { computeTaskSchedules, selectTeamCapacity } from '../../domain/services/capacityService';
import type { TaskItem } from '../../domain/types';
import { DEFAULT_CONFIG } from '../../domain/constants';
import { TaskInfoDialog } from './TaskInfoDialog';
import styles from './TasksTab.module.css';

const generateTaskId = () => Math.random().toString(36).slice(2, 6).toUpperCase();

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

export function TasksTab() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.items);
  const members = useAppSelector((state) => state.members.items);
  const events = useAppSelector((state) => state.events.items);
  const sprint = useAppSelector((state) => state.sprint);
  const calendar = useAppSelector((state) => state.calendar);
  const config = useAppSelector((state) => state.config.value);
  const teamCapacity = useAppSelector(selectTeamCapacity);

  const storyPointScale = config.storyPointScale?.length ? config.storyPointScale : DEFAULT_CONFIG.storyPointScale;

  const [name, setName] = useState('');
  const [assigneeMemberName, setAssigneeMemberName] = useState('');
  const [storyPoints, setStoryPoints] = useState(storyPointScale[0] ?? 1);
  const [dependenciesIds, setDependenciesIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [calcErrors, setCalcErrors] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | 'end' | null>(null);
  const [infoTask, setInfoTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    setStoryPoints(storyPointScale[0] ?? 1);
  }, [storyPointScale]);

  const handleAdd = () => {
    const dependencies = dependenciesIds.filter((d, idx, arr) => arr.indexOf(d) === idx);
    const base: Omit<TaskItem, 'computedEndDate' | 'computedStartDate'> = {
      id: generateTaskId(),
      name,
      assigneeMemberName: assigneeMemberName || undefined,
      storyPoints: Number(storyPoints),
      dependencies,
    };
    const validation = validateTask(base, tasks);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    dispatch(addTask({ ...base }));
    setName('');
    setAssigneeMemberName('');
    setStoryPoints(storyPointScale[0] ?? 1);
    setDependenciesIds([]);
  };

  const handleTaskUpdate = (
    id: string,
    updates: Partial<Pick<TaskItem, 'name' | 'assigneeMemberName' | 'storyPoints' | 'dependencies'>>,
  ) => {
    dispatch(updateTask({ id, updates }));
  };

  const handleDependenciesUpdate = (id: string, value: string[]) => {
    const filtered = value.filter((d, idx, arr) => arr.indexOf(d) === idx && d !== id);
    handleTaskUpdate(id, { dependencies: filtered });
  };

  const handleDragStart = (taskId: string, event: DragEvent<HTMLButtonElement>) => {
    setDraggingId(taskId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (targetId: string, event: DragEvent<HTMLTableRowElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverId(targetId);
  };

  const handleDrop = (targetId: string, event: DragEvent<HTMLTableRowElement>) => {
    event.preventDefault();
    const sourceId = draggingId ?? event.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    const sourceIndex = tasks.findIndex((t) => t.id === sourceId);
    const targetIndex = targetId === 'end' ? tasks.length : tasks.findIndex((t) => t.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const updated = [...tasks];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);
    dispatch(replaceTasks(updated));
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const dependencyOptions = useMemo(
    () => tasks.map((t) => ({ label: `${t.id} - ${t.name}`, value: t.id })),
    [tasks],
  );

  const handleOpenInfo = (task: TaskItem) => setInfoTask(task);
  const handleCloseInfo = () => setInfoTask(null);

  const capacityByMember = useMemo(() => {
    const map = new Map<string, number>();
    teamCapacity.members.forEach((mc) => map.set(mc.member.name, mc.storyPoints));
    return map;
  }, [teamCapacity]);

  const schedulesEqual = (current: TaskItem[], next: TaskItem[]) => {
    if (current.length !== next.length) return false;
    const byId = new Map(current.map((t) => [t.id, t]));
    return next.every((t) => {
      const prev = byId.get(t.id);
      if (!prev) return false;
      const sameStart = prev.computedStartDate === t.computedStartDate;
      const sameEnd = prev.computedEndDate === t.computedEndDate;
      const prevTimeline = JSON.stringify(prev.computedTimeline ?? []);
      const nextTimeline = JSON.stringify(t.computedTimeline ?? []);
      return sameStart && sameEnd && prevTimeline === nextTimeline;
    });
  };

  useEffect(() => {
    const result = computeTaskSchedules(tasks, sprint, calendar, config, members, events);
    setCalcErrors(result.errors);
    if (result.errors.length > 0) return;
    if (!schedulesEqual(tasks, result.tasks)) {
      dispatch(setComputedTasks(result.tasks));
    }
  }, [tasks, sprint, calendar, config, members, events, dispatch]);

  const isAfterSprint = (task: TaskItem) => {
    if (!sprint.endDate) return false;
    const endDate = task.computedTimeline?.[task.computedTimeline.length - 1]?.date;
    if (endDate) return endDate > sprint.endDate;
    const match = task.computedEndDate?.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      const iso = `${match[3]}-${match[2]}-${match[1]}`;
      return iso > sprint.endDate;
    }
    return false;
  };

  const overshootFromErrors = useMemo(() => {
    const ids = new Set<string>();
    calcErrors.forEach((msg) => {
      if (!/ultrapassa/i.test(msg)) return;
      const m = msg.match(/Tarefa\s+(\w+)/i);
      if (m?.[1]) ids.add(m[1]);
    });
    return ids;
  }, [calcErrors]);

  const totalStoryPoints = useMemo(() => tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0), [tasks]);
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

  const overshootTasks = useMemo(() => tasks.filter((t) => isAfterSprint(t)), [tasks, sprint.endDate]);

  const getRowClass = (task: TaskItem, runningTotals: Map<string, number>) => {
    if (isAfterSprint(task) || overshootFromErrors.has(task.id)) return styles.statusRed;
    const memberName = task.assigneeMemberName;
    if (!memberName) return styles.statusGreen;
    const capacity = capacityByMember.get(memberName) ?? 0;
    const currentTotal = (runningTotals.get(memberName) ?? 0) + task.storyPoints;
    runningTotals.set(memberName, currentTotal);
    if (capacity <= 0 && currentTotal > 0) return styles.statusRed;
    const ratio = currentTotal / capacity;
    if (ratio <= 1) return styles.statusGreen;
    const warnLimit = 1 + config.workloadWarningOver;
    const errLimit = 1 + config.workloadErrorOver;
    const threshold = Math.max(warnLimit, errLimit);
    if (ratio <= warnLimit) return styles.statusYellow;
    if (ratio <= threshold) return styles.statusRed;
    return styles.statusRed;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Tarefas</Typography>
        <div className={styles.form}>
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            select
            label="Responsável"
            value={assigneeMemberName}
            onChange={(e) => setAssigneeMemberName(e.target.value)}
          >
            <MenuItem value="">-- Sem responsável --</MenuItem>
            {members.map((m) => (
              <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Story Points"
            value={storyPoints}
            onChange={(e) => setStoryPoints(Number(e.target.value))}
          >
            {storyPointScale.map((sp) => (
              <MenuItem key={sp} value={sp}>{sp}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Dependências"
            value=""
            sx={{ display: 'none' }}
            aria-hidden
          />
          <Autocomplete
            multiple
            options={dependencyOptions}
            getOptionLabel={(o) => o.label}
            value={dependencyOptions.filter((o) => dependenciesIds.includes(o.value))}
            onChange={(_, newValue) => setDependenciesIds(newValue.map((o) => o.value))}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option.value} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Dependências" placeholder="Selecionar" />
            )}
            filterSelectedOptions
            disableCloseOnSelect
            clearOnBlur
            blurOnSelect={false}
            ListboxProps={{ style: { maxHeight: 240 } }}
          />
          <Button variant="contained" onClick={handleAdd}>Adicionar Tarefa</Button>
        </div>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        {capacitySeverity && (
          <Alert severity={capacitySeverity === 'error' ? 'error' : 'warning'} sx={{ mt: 1 }}>
            Story Points planejados ({totalStoryPoints}) excedem a capacidade da sprint ({capacityStoryPoints}).
            Limites: aviso até {(warnLimit - 1) * 100}% e erro acima de {(errLimit - 1) * 100}% sobre a capacidade.
          </Alert>
        )}
        {overshootTasks.length + overshootFromErrors.size > 0 && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Tarefas fora do fim da sprint: {
              [...new Set([...
                overshootTasks.map((t) => `${t.id} (${t.name})`),
                ...[...overshootFromErrors].map((id) => id),
              ])].join(', ')
            }. Considere repriorizar ou ajustar capacidade.
          </Alert>
        )}
        {calcErrors.map((err) => (
          <Alert key={err} severity="error" sx={{ mt: 1 }}>{err}</Alert>
        ))}
        <div className={styles.list}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={40}></TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>SP</TableCell>
                <TableCell>Início</TableCell>
                <TableCell>Fim</TableCell>
                <TableCell>Dependências</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell width={40}></TableCell>
                <TableCell width={40}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10}>Nenhuma tarefa cadastrada.</TableCell>
                </TableRow>
              )}
              {(() => {
                const runningTotals = new Map<string, number>();
                const rows: ReactNode[] = [];

                tasks.forEach((task) => {
                  const rowClass = getRowClass(task, runningTotals);

                  if (draggingId && dragOverId === task.id) {
                    rows.push(
                      <TableRow
                        key={`${task.id}-indicator`}
                        className={styles.dropIndicatorRow}
                        onDragOver={(event) => handleDragOver(task.id, event)}
                        onDrop={(event) => handleDrop(task.id, event)}
                      >
                        <TableCell colSpan={10} className={styles.dropIndicatorCell}>
                          <div className={styles.dropIndicatorLine} />
                        </TableCell>
                      </TableRow>,
                    );
                  }

                  rows.push(
                    <TableRow
                      key={task.id}
                      hover
                      className={rowClass}
                      onDragOver={(event) => handleDragOver(task.id, event)}
                      onDrop={(event) => handleDrop(task.id, event)}
                      onDragEnd={handleDragEnd}
                    >
                      <TableCell className={styles.dragHandleCell}>
                        <IconButton
                          aria-label="mover"
                          size="small"
                          draggable
                          onDragStart={(event) => handleDragStart(task.id, event)}
                          onDragEnd={handleDragEnd}
                        >
                          <DragIndicatorIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell>{task.id}</TableCell>
                      <TableCell>
                        <TextField
                          variant="standard"
                          value={task.name}
                          onChange={(e) => handleTaskUpdate(task.id, { name: e.target.value })}
                          fullWidth
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          variant="standard"
                          value={task.storyPoints}
                          onChange={(e) => handleTaskUpdate(task.id, { storyPoints: Number(e.target.value) })}
                          fullWidth
                          size="small"
                        >
                          {storyPointScale.map((sp) => (
                            <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>{formatDateTimeBr(task.computedStartDate)}</TableCell>
                      <TableCell>{formatDateTimeBr(task.computedEndDate)}</TableCell>
                      <TableCell>
                        <Autocomplete
                          multiple
                          options={dependencyOptions.filter((o) => o.value !== task.id)}
                          getOptionLabel={(o) => o.label}
                          value={dependencyOptions.filter((o) => task.dependencies.includes(o.value))}
                          onChange={(_, newValue) => handleDependenciesUpdate(task.id, newValue.map((o) => o.value))}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip label={option.value} size="small" {...getTagProps({ index })} />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder="Dep. IDs"
                              fullWidth
                              size="small"
                            />
                          )}
                          filterSelectedOptions
                          disableCloseOnSelect
                          clearOnBlur
                          blurOnSelect={false}
                          ListboxProps={{ style: { maxHeight: 240 } }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          variant="standard"
                          value={task.assigneeMemberName || ''}
                          onChange={(e) => handleTaskUpdate(task.id, { assigneeMemberName: e.target.value || undefined })}
                          fullWidth
                          size="small"
                        >
                          <MenuItem value="">-- Sem responsável --</MenuItem>
                          {members.map((m) => (
                            <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton aria-label="remover" onClick={() => dispatch(removeTask(task.id))}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <IconButton aria-label="detalhes" onClick={() => handleOpenInfo(task)}>
                          <InfoOutlinedIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>,
                  );
                });

                if (draggingId) {
                  rows.push(
                    <TableRow
                      key="drop-end-indicator"
                      className={dragOverId === 'end' ? styles.dropIndicatorRow : undefined}
                      onDragOver={(event) => handleDragOver('end', event)}
                      onDrop={(event) => handleDrop('end', event)}
                      onDragEnd={handleDragEnd}
                    >
                      <TableCell colSpan={10} className={styles.dropIndicatorCell}>
                        <div className={styles.dropIndicatorLine} />
                      </TableCell>
                    </TableRow>,
                  );
                }

                return rows;
              })()}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <TaskInfoDialog
        open={!!infoTask}
        task={infoTask}
        onClose={handleCloseInfo}
        formatDateTime={formatDateTimeBr}
        storyPointsPerHour={config.storyPointsPerHour}
      />
    </Card>
  );
}
