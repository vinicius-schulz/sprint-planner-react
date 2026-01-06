import { useMemo, useState, useEffect, useCallback } from 'react';
import type { DragEvent } from 'react';
import { Alert, Card, CardContent, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addTask, removeTask, replaceTasks, setComputedTasks, updateTask } from './tasksSlice';
import { validateTask } from '../../domain/services/validators';
import { computeTaskSchedules, selectTeamCapacity } from '../../domain/services/capacityService';
import type { TaskItem, SchedulingStrategy } from '../../domain/types';
import { DEFAULT_CONFIG } from '../../domain/constants';
import { formatMinutesToClock } from '../../domain/services/timeFormat';
import { GanttTimelineFrappe } from '../../components/GanttTimelineFrappe';
import { TaskForm } from './components/TaskForm';
import { CapacityPanel } from './components/CapacityPanel';
import { TasksTable } from './components/TasksTable';
import { TaskManageDialog } from './components/TaskManageDialog';
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

const taskManageEventName = 'task-manage-open';

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
    updates: Partial<TaskItem>,
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

  const handleOpenManage = useCallback((task: TaskItem) => {
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
  }, []);

  const handleCloseManage = () => {
    setManageTask(null);
    setManageDraft(null);
    setManageTab('resumo');
  };

  const handleManageTurboChange = (value: number) => {
    setManageTurboValue(Math.min(value, manageDraft?.storyPoints ?? value));
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

  const [strategy, setStrategy] = useState<SchedulingStrategy>(
    config.schedulingStrategy ?? DEFAULT_CONFIG.schedulingStrategy ?? 'EDD',
  );

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
        <TaskForm
          strategy={strategy}
          onStrategyChange={setStrategy}
          name={name}
          onNameChange={setName}
          assigneeMemberName={assigneeMemberName}
          onAssigneeChange={setAssigneeMemberName}
          storyPoints={storyPoints}
          onStoryPointsChange={setStoryPoints}
          storyPointScale={storyPointScale}
          dependenciesIds={dependenciesIds}
          onDependenciesChange={setDependenciesIds}
          members={members.map((m) => ({ id: m.id, name: m.name }))}
          dependencyOptions={dependencyOptions}
          onAdd={handleAdd}
        />
        <CapacityPanel items={memberLoad} />
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

        <TasksTable
          tasks={tasks}
          members={members.map((m) => ({ id: m.id, name: m.name }))}
          storyPointScale={storyPointScale}
          dependencyOptions={dependencyOptions}
          draggingId={draggingId}
          dragOverId={dragOverId}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onTaskUpdate={handleTaskUpdate}
          onRemove={handleRemoveTask}
          onOpenManage={handleOpenManage}
          handleDependenciesUpdate={handleDependenciesUpdate}
          getRowClass={getRowClass}
          formatDateTime={formatDateTimeBr}
        />
        <GanttTimelineFrappe inline title="Planejamento - Gantt" />
      </CardContent>
      <TaskManageDialog
        open={!!manageTask}
        task={manageTask}
        manageDraft={manageDraft}
        manageTurboValue={manageTurboValue}
        manageTab={manageTab}
        onTabChange={setManageTab}
        onClose={handleCloseManage}
        onSave={handleManageSave}
        onDraftChange={setManageDraft}
        onTurboChange={handleManageTurboChange}
        dependencyOptions={dependencyOptions}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        storyPointScale={storyPointScale}
        formatDateTime={formatDateTimeBr}
        formatMinutesToClock={formatMinutesToClock}
      />
    </Card>
  );
}
