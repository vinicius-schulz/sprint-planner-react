import { useMemo, useState, useEffect } from 'react';
import type { DragEvent, ReactNode } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Tabs,
  Tab,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addTask, removeTask, replaceTasks, setComputedTasks, updateTask } from './tasksSlice';
import { validateTask } from '../../domain/services/validators';
import { computeTaskSchedules, selectTeamCapacity } from '../../domain/services/capacityService';
import type { TaskItem } from '../../domain/types';
import type { SchedulingStrategy } from '../../domain/types';
import { DEFAULT_CONFIG } from '../../domain/constants';
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
  const [manageTask, setManageTask] = useState<TaskItem | null>(null);
  const [manageDraft, setManageDraft] = useState<{
    name: string;
    storyPoints: number;
    dueDate?: string;
    assigneeMemberName?: string;
    dependencies: string[];
  } | null>(null);
  const [manageTurboValue, setManageTurboValue] = useState<number>(0);
  const [manageTab, setManageTab] = useState<'resumo' | 'editar'>('resumo');
  const manageTimeline = manageTask?.computedTimeline ?? [];

  useEffect(() => {
    setStoryPoints(storyPointScale[0] ?? 1);
  }, [storyPointScale]);

  useEffect(() => {
    setStrategy(config.schedulingStrategy ?? DEFAULT_CONFIG.schedulingStrategy ?? 'EDD');
  }, [config.schedulingStrategy]);

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
    updates: Partial<Pick<TaskItem, 'name' | 'assigneeMemberName' | 'storyPoints' | 'dependencies' | 'dueDate'>>,
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

  const handleOpenManage = (task: TaskItem) => {
    setManageTask(task);
    setManageTab('resumo');
    const baseTurbo = task.turboEnabled && Number.isFinite(task.turboStoryPoints)
      ? Number(task.turboStoryPoints)
      : task.storyPoints;
    setManageTurboValue(baseTurbo);
    setManageDraft({
      name: task.name,
      storyPoints: task.storyPoints,
      dueDate: task.dueDate,
      assigneeMemberName: task.assigneeMemberName,
      dependencies: task.dependencies || [],
    });
  };

  const handleCloseManage = () => {
    setManageTask(null);
    setManageDraft(null);
  };

  const handleRemoveTask = (task: TaskItem) => {
    const confirmed = window.confirm(`Remover tarefa ${task.id} - ${task.name}?`);
    if (!confirmed) return;
    dispatch(removeTask(task.id));
  };

  const handleManageSave = () => {
    if (!manageTask || !manageDraft) return;
    const filteredDeps = manageDraft.dependencies.filter((d, idx, arr) => d !== manageTask.id && arr.indexOf(d) === idx);
    const turboSp = Math.min(Number(manageTurboValue) || 0, manageDraft.storyPoints);
    const turboEnabled = turboSp < manageDraft.storyPoints;
    dispatch(updateTask({
      id: manageTask.id,
      updates: {
        name: manageDraft.name,
        storyPoints: Number(manageDraft.storyPoints),
        dueDate: manageDraft.dueDate || undefined,
        assigneeMemberName: manageDraft.assigneeMemberName || undefined,
        dependencies: filteredDeps,
        turboEnabled,
        turboStoryPoints: turboEnabled ? turboSp : manageDraft.storyPoints,
      },
    }));
    handleCloseManage();
  };

  const [strategy, setStrategy] = useState(config.schedulingStrategy ?? DEFAULT_CONFIG.schedulingStrategy ?? 'EDD');

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

  const capacityByMember = useMemo(() => {
    const map = new Map<string, number>();
    teamCapacity.members
      .filter((mc) => countedMemberNames.has(mc.member.name))
      .forEach((mc) => map.set(mc.member.name, mc.storyPoints));
    return map;
  }, [teamCapacity, countedMemberNames]);

  const memberLoad = useMemo(() => {
    const usage = new Map<string, number>();
    tasks.forEach((t) => {
      if (!t.assigneeMemberName) return;
      if (!countedMemberNames.has(t.assigneeMemberName)) return;
      usage.set(t.assigneeMemberName, (usage.get(t.assigneeMemberName) ?? 0) + effectiveStoryPoints(t));
    });

    const list = teamCapacity.members
      .filter((mc) => countedMemberNames.has(mc.member.name))
      .map((mc) => {
        const taken = usage.get(mc.member.name) ?? 0;
        const remaining = Math.max(0, mc.storyPoints - taken);
        return {
          name: mc.member.name,
          capacitySp: mc.storyPoints,
          takenSp: taken,
          remainingSp: remaining,
        };
      });

    return list.sort((a, b) => b.remainingSp - a.remainingSp);
  }, [tasks, teamCapacity]);

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
    const result = computeTaskSchedules(tasks, sprint, calendar, { ...config, schedulingStrategy: strategy }, members, events);
    setCalcErrors(result.errors);
    if (result.errors.length > 0) return;
    if (!schedulesEqual(tasks, result.tasks)) {
      dispatch(setComputedTasks(result.tasks));
    }
  }, [tasks, sprint, calendar, config, strategy, members, events, dispatch]);

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

  const overshootTasks = useMemo(() => tasks.filter((t) => isAfterSprint(t)), [tasks, sprint.endDate]);

  const getRowClass = (task: TaskItem, runningTotals: Map<string, number>) => {
    if (isAfterSprint(task) || overshootFromErrors.has(task.id)) return styles.statusRed;
    const memberName = task.assigneeMemberName;
    if (!memberName) return styles.statusGreen;

    const isCounted = countedMemberNames.has(memberName);
    if (!isCounted) return styles.statusGreen;

    const capacity = capacityByMember.get(memberName) ?? 0;
    const currentTotal = (runningTotals.get(memberName) ?? 0) + effectiveStoryPoints(task);
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
          <TextField
            select
            label="Estratégia de agendamento"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as SchedulingStrategy)}
            InputProps={{ startAdornment: <ScheduleIcon fontSize="small" /> }}
          >
            <MenuItem value="EDD">EDD (prazo mais cedo)</MenuItem>
            <MenuItem value="SPT">SPT (tarefas mais curtas primeiro)</MenuItem>
            <MenuItem value="BLOCKERS">Blockers (mais dependentes)</MenuItem>
            <MenuItem value="HYBRID">Combinação (bloqueios + prazo + 1/duração)</MenuItem>
          </TextField>
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
          <Autocomplete
            multiple
            options={dependencyOptions}
            getOptionLabel={(o) => o.label}
            value={dependencyOptions.filter((o) => dependenciesIds.includes(o.value))}
            onChange={(_, newValue) => setDependenciesIds(newValue.map((o) => o.value))}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                (() => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return <Chip key={key} label={option.value} {...chipProps} />;
                })()
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
        {memberLoad.length > 0 && (
          <div className={styles.capacityPanel}>
            <Typography variant="subtitle2" gutterBottom>Distribuição por membro (SP)</Typography>
            <div className={styles.capacityChips}>
              {memberLoad.map((m) => (
                (() => {
                  let color: 'default' | 'success' | 'error' = 'default';
                  if (m.takenSp > m.capacitySp) color = 'error';
                  else if (m.remainingSp > 0) color = 'success';
                  return (
                <Chip
                  key={m.name}
                  label={`${m.name}: ${m.takenSp}/${m.capacitySp} SP (livre ${m.remainingSp})`}
                    color={color === 'default' ? 'default' : color}
                    variant={color === 'default' ? 'outlined' : 'filled'}
                  size="small"
                  />
                  );
                })()
              ))}
            </div>
          </div>
        )}
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        {capacitySeverity && (
          <Alert severity={capacitySeverity === 'error' ? 'error' : 'warning'} sx={{ mt: 1 }}>
            Story Points planejados ({totalStoryPoints}) excedem a capacidade da sprint ({capacityStoryPoints}).
            Limites: aviso até {Math.round((warnLimit - 1) * 100)}% e erro acima de {Math.round((errLimit - 1) * 100)}% sobre a capacidade.
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
          <Table size="small" className={styles.table}>
            <TableHead>
              <TableRow>
                <TableCell width={40}></TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>SP</TableCell>
                <TableCell>Prazo</TableCell>
                <TableCell>Início</TableCell>
                <TableCell>Fim</TableCell>
                <TableCell>Dependências</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell width={140}>Ações</TableCell>
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
                      className={[rowClass, task.turboEnabled ? styles.turboRow : ''].filter(Boolean).join(' ')}
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
                      <TableCell>
                        <TextField
                          variant="standard"
                          type="date"
                          value={task.dueDate ?? ''}
                          onChange={(e) => handleTaskUpdate(task.id, { dueDate: e.target.value || undefined })}
                          fullWidth
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
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
                              (() => {
                                const { key, ...chipProps } = getTagProps({ index });
                                return <Chip key={key} label={option.value} size="small" {...chipProps} />;
                              })()
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
                      <TableCell>
                        <div className={styles.actionsGroup}>
                          <IconButton aria-label="remover" onClick={() => handleRemoveTask(task)} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton aria-label="detalhes e edição" onClick={() => handleOpenManage(task)} size="small">
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </div>
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
      <Dialog open={!!manageTask} onClose={handleCloseManage} maxWidth="md" fullWidth>
        <DialogTitle>Detalhes e edição da tarefa</DialogTitle>
        <DialogContent dividers>
          <Tabs value={manageTab} onChange={(_, val) => setManageTab(val)} sx={{ mb: 2 }}>
            <Tab label="Resumo" value="resumo" />
            <Tab label="Editar" value="editar" />
          </Tabs>
          {manageTab === 'resumo' && (
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
                  <Typography variant="body2">Turbo: {manageTask.turboEnabled ? manageTask.turboStoryPoints : 'Desativado'}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Plano por dia</Typography>
                  {!manageTimeline.length && (
                    <Typography variant="body2" color="text.secondary">
                      Calcule as datas para ver o cronograma detalhado.
                    </Typography>
                  )}
                  {manageTimeline.length ? (
                    <List dense>
                      {manageTimeline.map((seg, idx) => (
                        <div key={`${seg.date}-${seg.startTime}-${seg.endTime}-${idx}`}>
                          <ListItem alignItems="flex-start">
                            <ListItemText
                              primary={`${formatDateTimeBr(`${seg.date} ${seg.startTime}`)} - ${seg.endTime} (${seg.minutes} min)`}
                              secondary={
                                seg.detail ? (
                                  <div className={styles.infoDetailBlock}>
                                    <Typography variant="body2">Períodos do dia: {seg.detail.periods.map((p) => `${p.start}-${p.end}`).join(', ')}</Typography>
                                    <Typography variant="body2">
                                      Capacidade do dia: {seg.detail.capacityMinutes} min (base {seg.detail.baseMinutes} - eventos {seg.detail.eventMinutes} - recorrentes {seg.detail.recurringMinutes})
                                    </Typography>
                                    <Typography variant="body2">
                                      Disponibilidade/fatores: {seg.detail.availabilityPercent}% × sen {seg.detail.seniorityFactor} × mat {seg.detail.maturityFactor}
                                    </Typography>
                                    <Typography variant="body2">
                                      Uso antes desta tarefa: {seg.detail.usedBeforeMinutes} min
                                    </Typography>
                                    <Typography variant="body2">
                                      Eventos: {seg.detail.events.length ? seg.detail.events.map((e) => `${e.label} (${e.minutes}m)`).join(', ') : 'Nenhum'}
                                    </Typography>
                                  </div>
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
          )}
          {manageTab === 'editar' && (
            <Box display="grid" gap={2}>
              <TextField
                label="Nome"
                fullWidth
                value={manageDraft?.name ?? ''}
                onChange={(e) => setManageDraft((prev) => prev ? { ...prev, name: e.target.value } : prev)}
              />
              <TextField
                select
                label="Story Points"
                value={manageDraft?.storyPoints ?? storyPointScale[0]}
                onChange={(e) => setManageDraft((prev) => prev ? { ...prev, storyPoints: Number(e.target.value) } : prev)}
              >
                {storyPointScale.map((sp) => (
                  <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Turbo (SP)"
                helperText="Escolha valor menor que o SP original para ativar o turbo"
                value={manageTurboValue}
                onChange={(e) => setManageTurboValue(Math.min(Number(e.target.value), manageDraft?.storyPoints ?? Number(e.target.value)))}
              >
                {storyPointScale
                  .filter((sp) => manageDraft ? sp <= manageDraft.storyPoints : true)
                  .map((sp) => (
                    <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                  ))}
              </TextField>
              <TextField
                label="Prazo"
                type="date"
                value={manageDraft?.dueDate ?? ''}
                onChange={(e) => setManageDraft((prev) => prev ? { ...prev, dueDate: e.target.value || undefined } : prev)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Responsável"
                value={manageDraft?.assigneeMemberName ?? ''}
                onChange={(e) => setManageDraft((prev) => prev ? { ...prev, assigneeMemberName: e.target.value || undefined } : prev)}
              >
                <MenuItem value="">-- Sem responsável --</MenuItem>
                {members.map((m) => (
                  <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                ))}
              </TextField>
              <Autocomplete
                multiple
                options={dependencyOptions.filter((o) => o.value !== manageTask?.id)}
                getOptionLabel={(o) => o.label}
                value={dependencyOptions.filter((o) => (manageDraft?.dependencies ?? []).includes(o.value))}
                onChange={(_, newValue) => setManageDraft((prev) => prev ? { ...prev, dependencies: newValue.map((o) => o.value) } : prev)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    (() => {
                      const { key, ...chipProps } = getTagProps({ index });
                      return <Chip key={key} label={option.value} size="small" {...chipProps} />;
                    })()
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Dependências"
                    placeholder="IDs"
                  />
                )}
                filterSelectedOptions
                disableCloseOnSelect
                clearOnBlur
                blurOnSelect={false}
                ListboxProps={{ style: { maxHeight: 240 } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseManage}>Cancelar</Button>
          <Button variant="contained" onClick={handleManageSave} disabled={!manageDraft}>Atualizar</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
