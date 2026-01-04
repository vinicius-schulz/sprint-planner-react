import { createSelector } from '@reduxjs/toolkit';
import { dateRange, isWeekend, toDate, toISODate } from './dateUtils';
import { computeDayHours, generateDefaultPeriods } from './workingCalendar';
import type {
  CalendarState,
  DaySchedule,
  EventItem,
  GlobalConfig,
  Member,
  RootPersistedState,
  SprintState,
  TaskItem,
  TaskWorkDetail,
  TaskWorkSegment,
  WorkingPeriod,
} from '../types';

export interface WorkingCalendarResult {
  workingDays: string[];
  nonWorkingDays: string[];
}

export const buildWorkingCalendar = (
  sprint: SprintState,
  calendar: CalendarState,
): WorkingCalendarResult => {
  if (calendar.daySchedules?.length) {
    const workingDays = calendar.daySchedules
      .filter((d) => !d.isNonWorking && computeDayHours(d.periods) > 0)
      .map((d) => d.date);
    const nonWorkingDays = calendar.daySchedules
      .filter((d) => d.isNonWorking || computeDayHours(d.periods) === 0)
      .map((d) => d.date);
    return { workingDays, nonWorkingDays };
  }

  const { startDate, endDate } = sprint;
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return { workingDays: [], nonWorkingDays: [] };

  const manualSet = new Set(calendar.nonWorkingDaysManual);
  const removedSet = new Set(calendar.nonWorkingDaysRemoved);

  const nonWorking: string[] = [];
  const working: string[] = [];
  dateRange(start, end).forEach((day) => {
    const iso = toISODate(day);
    const weekend = isWeekend(day);
    if (manualSet.has(iso)) {
      nonWorking.push(iso);
      return;
    }
    if (weekend && !removedSet.has(iso)) {
      nonWorking.push(iso);
      return;
    }
    working.push(iso);
  });

  return { workingDays: working, nonWorkingDays: nonWorking };
};

export const computeEventDeductionHours = (
  events: EventItem[],
  workingDays: string[],
): number => {
  if (!workingDays.length) return 0;
  const workingSet = new Set(workingDays);
  return events.reduce((acc, event) => {
    if (event.recurringDaily) {
      return acc + (event.minutes / 60) * workingDays.length;
    }
    if (workingSet.has(event.date)) {
      return acc + event.minutes / 60;
    }
    return acc;
  }, 0);
};

export const computeWorkingHours = (
  config: GlobalConfig,
  workingDays: string[],
  events: EventItem[],
  calendar: CalendarState,
): number => {
  if (!workingDays.length) return 0;
  const baseHours = calendar.daySchedules?.length
    ? calendar.daySchedules
        .filter((d) => workingDays.includes(d.date))
        .reduce((sum, d) => sum + computeDayHours(d.periods), 0)
    : workingDays.length * config.dailyWorkHours;
  const deduction = computeEventDeductionHours(events, workingDays);
  return Math.max(0, baseHours - deduction);
};

export interface MemberCapacity {
  member: Member;
  hours: number;
  storyPoints: number;
}

export const computeMemberCapacity = (
  member: Member,
  workingHours: number,
  config: GlobalConfig,
): MemberCapacity => {
  const isCounted = config.countedMemberTypes.includes(member.roleType);
  if (!isCounted) {
    return { member, hours: 0, storyPoints: 0 };
  }
  const seniorityFactor = config.seniorityFactors[member.seniority] ?? 1;
  const maturityFactor = config.maturityFactors[member.maturity] ?? 1;
  const hours = workingHours * (member.availabilityPercent / 100) * seniorityFactor * maturityFactor;
  const storyPoints = hours * config.storyPointsPerHour;
  return { member, hours, storyPoints };
};

export interface TeamCapacityResult {
  members: MemberCapacity[];
  totalStoryPoints: number;
}

export const computeTeamCapacity = (
  members: Member[],
  workingHours: number,
  config: GlobalConfig,
): TeamCapacityResult => {
  const membersCap = members.map((member) => computeMemberCapacity(member, workingHours, config));
  const totalStoryPoints = membersCap.reduce((acc, curr) => acc + curr.storyPoints, 0);
  return { members: membersCap, totalStoryPoints };
};

export interface TaskScheduleResult {
  tasks: TaskItem[];
  errors: string[];
}

const formatDate = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

const formatDateTime = (isoDate: string, clock: string): string => `${formatDate(isoDate)} ${clock}`;

export const computeTaskSchedules = (
  tasks: TaskItem[],
  sprint: SprintState,
  calendar: CalendarState,
  config: GlobalConfig,
  members: Member[],
  events: EventItem[],
): TaskScheduleResult => {
  const errors: string[] = [];
  const sprintStart = toDate(sprint.startDate);
  const sprintEnd = toDate(sprint.endDate);
  if (!sprintStart || !sprintEnd) return { tasks, errors: ['Data de início e fim da Sprint são obrigatórias.'] };

  const idSet = new Set(tasks.map((t) => t.id));
  const cleanedTasks = tasks.map((t) => ({
    ...t,
    dependencies: (t.dependencies ?? []).filter((depId) => depId !== t.id && idSet.has(depId)),
  }));
  const originalIndex = new Map<string, number>();
  cleanedTasks.forEach((t, idx) => originalIndex.set(t.id, idx));

  const withinSprint = (day: DaySchedule) => {
    const d = toDate(day.date);
    if (!d) return false;
    return d >= sprintStart && d <= sprintEnd;
  };

  const resolvePeriods = (day: DaySchedule): WorkingPeriod[] =>
    day.periods?.length ? day.periods : generateDefaultPeriods(config);

  const workingDaySchedules = (calendar.daySchedules ?? [])
    .filter((d) => !d.isNonWorking && computeDayHours(resolvePeriods(d)) > 0)
    .filter(withinSprint)
    .map((d) => ({ ...d, periods: resolvePeriods(d) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  if (!workingDaySchedules.length) return { tasks, errors: ['Não há dias úteis na Sprint para agendar tarefas.'] };

  const recurringDailyMinutes = events
    .filter((e) => e.recurringDaily)
    .reduce((sum, ev) => sum + ev.minutes, 0);

  const eventsByDate = events
    .filter((e) => !e.recurringDaily)
    .reduce((map, ev) => {
      map.set(ev.date, (map.get(ev.date) ?? 0) + ev.minutes);
      return map;
    }, new Map<string, number>());

  const memberByName = new Map<string, Member>(members.map((m) => [m.name, m]));

  const eventsDetailByDate = new Map<string, { label: string; minutes: number }[]>();
  events.forEach((ev) => {
    if (ev.recurringDaily) return;
    const label = ev.description?.trim() || ev.type;
    const list = eventsDetailByDate.get(ev.date) ?? [];
    list.push({ label, minutes: ev.minutes });
    eventsDetailByDate.set(ev.date, list);
  });

  const timeToMinutes = (time: string): number => {
    const match = time?.match(/^(\d{2}):(\d{2})$/);
    if (!match) return 0;
    return Number(match[1]) * 60 + Number(match[2]);
  };

  const periodsMinutes = (periods: WorkingPeriod[]) =>
    periods.reduce((acc, period) => acc + Math.max(0, timeToMinutes(period.end) - timeToMinutes(period.start)), 0);

  const offsetToClock = (periods: WorkingPeriod[], offsetMinutes: number): string => {
    let remaining = offsetMinutes;
    for (const period of periods) {
      const start = timeToMinutes(period.start);
      const end = timeToMinutes(period.end);
      const len = Math.max(0, end - start);
      if (remaining <= len) {
        const mins = start + remaining;
        const hh = String(Math.floor(mins / 60)).padStart(2, '0');
        const mm = String(mins % 60).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      remaining -= len;
    }
    const lastEnd = timeToMinutes(periods[periods.length - 1]?.end ?? '00:00');
    const hh = String(Math.floor(lastEnd / 60)).padStart(2, '0');
    const mm = String(lastEnd % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const dayCapacityForAssignee = (day: DaySchedule, assignee?: Member): number => {
    const baseMinutes = Math.max(0, periodsMinutes(day.periods) - (eventsByDate.get(day.date) ?? 0) - recurringDailyMinutes);
    if (!assignee) return baseMinutes;
    const availability = assignee.availabilityPercent / 100;
    const seniorityFactor = config.seniorityFactors[assignee.seniority] ?? 1;
    const maturityFactor = config.maturityFactors[assignee.maturity] ?? 1;
    return Math.max(0, Math.floor(baseMinutes * availability * seniorityFactor * maturityFactor));
  };

  const usageByAssigneeDay = new Map<string, Map<number, number>>();
  const getUsage = (assigneeKey: string, dayIndex: number) => usageByAssigneeDay.get(assigneeKey)?.get(dayIndex) ?? 0;
  const setUsage = (assigneeKey: string, dayIndex: number, startOffset: number, minutes: number) => {
    if (!usageByAssigneeDay.has(assigneeKey)) usageByAssigneeDay.set(assigneeKey, new Map());
    const map = usageByAssigneeDay.get(assigneeKey)!;
    const current = map.get(dayIndex) ?? 0;
    const newUsage = Math.max(current, startOffset) + minutes;
    map.set(dayIndex, newUsage);
  };

  const durationMinutesForTask = (task: TaskItem) => {
    if (config.storyPointsPerHour <= 0) return 0;
    return Math.max(0, Math.ceil((task.storyPoints / config.storyPointsPerHour) * 60));
  };

  const completed = new Map<string, { dayIndex: number; minuteOffset: number }>();
  const lastEndByAssignee = new Map<string, { dayIndex: number; minuteOffset: number }>();
  const taskMap = new Map(cleanedTasks.map((t) => [t.id, t]));

  // Topological order to ensure dependencies are scheduled before dependents
  const indegree = new Map<string, number>();
  cleanedTasks.forEach((t) => indegree.set(t.id, 0));
  cleanedTasks.forEach((t) => {
    (t.dependencies || []).forEach((depId) => {
      if (!taskMap.has(depId)) return;
      indegree.set(t.id, (indegree.get(t.id) ?? 0) + 1);
    });
  });

  const priority = (task: TaskItem) => originalIndex.get(task.id) ?? Number.MAX_SAFE_INTEGER;
  const queue: TaskItem[] = [];
  cleanedTasks.forEach((t) => {
    if ((indegree.get(t.id) ?? 0) === 0) queue.push(t);
  });
  queue.sort((a, b) => priority(a) - priority(b));

  const ordered: TaskItem[] = [];
  while (queue.length) {
    const current = queue.shift()!;
    ordered.push(current);
    cleanedTasks.forEach((t) => {
      if (!t.dependencies?.includes(current.id)) return;
      const val = (indegree.get(t.id) ?? 0) - 1;
      indegree.set(t.id, val);
      if (val === 0) {
        queue.push(t);
        queue.sort((a, b) => priority(a) - priority(b));
      }
    });
  }

  if (ordered.length !== cleanedTasks.length) {
    const cyclic = cleanedTasks.filter((t) => !ordered.includes(t)).map((t) => t.id).join(', ');
    errors.push(`Dependências cíclicas ou inválidas entre: ${cyclic || 'tarefas'}.`);
  }
  const resultTasks: TaskItem[] = [];

  ordered.forEach((task) => {
    const deps = task.dependencies || [];
    const durationMin = durationMinutesForTask(task);
    const timeline: TaskWorkSegment[] = [];
    if (durationMin === 0) {
      const formatted = formatDateTime(sprint.startDate, '00:00');
      resultTasks.push({ ...task, computedStartDate: formatted, computedEndDate: formatted, computedTimeline: timeline });
      return;
    }

    if (deps.includes(task.id)) {
      errors.push(`Tarefa ${task.id} não pode depender de si mesma.`);
      return;
    }

    let earliestPointer = { dayIndex: 0, minuteOffset: 0 };

    deps.forEach((depId) => {
      const dep = completed.get(depId);
      if (!dep) return; // already reported missing or cycle; skip shift
      if (dep.dayIndex > earliestPointer.dayIndex || (dep.dayIndex === earliestPointer.dayIndex && dep.minuteOffset > earliestPointer.minuteOffset)) {
        earliestPointer = { ...dep };
      }
    });

    const assignee = task.assigneeMemberName ? memberByName.get(task.assigneeMemberName) : undefined;
    const assigneeLast = task.assigneeMemberName ? lastEndByAssignee.get(task.assigneeMemberName) : undefined;
    if (assigneeLast) {
      if (assigneeLast.dayIndex > earliestPointer.dayIndex || (assigneeLast.dayIndex === earliestPointer.dayIndex && assigneeLast.minuteOffset > earliestPointer.minuteOffset)) {
        earliestPointer = { ...assigneeLast };
      }
    }

    let remaining = durationMin;
    let currentDay = earliestPointer.dayIndex;
    let startStamp: { dayIndex: number; minuteOffset: number } | null = null;
    let endStamp: { dayIndex: number; minuteOffset: number } | null = null;
    const assigneeKey = task.assigneeMemberName || 'UNASSIGNED';

    while (remaining > 0 && currentDay < workingDaySchedules.length) {
      const day = workingDaySchedules[currentDay];
      const capacity = dayCapacityForAssignee(day, assignee);
      let used = getUsage(assigneeKey, currentDay);
      if (currentDay === earliestPointer.dayIndex && earliestPointer.minuteOffset > used) {
        used = earliestPointer.minuteOffset;
      }
      const available = Math.max(0, capacity - used);
      if (available <= 0) {
        currentDay += 1;
        continue;
      }
      const take = Math.min(available, remaining);
      const startOffset = used;
      const endOffset = used + take;
      if (!startStamp) {
        startStamp = { dayIndex: currentDay, minuteOffset: startOffset };
      }
      endStamp = { dayIndex: currentDay, minuteOffset: endOffset };
      const startClockChunk = offsetToClock(day.periods, startOffset);
      const endClockChunk = offsetToClock(day.periods, endOffset);
      const baseMinutesRaw = periodsMinutes(day.periods);
      const eventMinutes = eventsByDate.get(day.date) ?? 0;
      const detail: TaskWorkDetail = {
        periods: day.periods,
        baseMinutes: Math.max(0, baseMinutesRaw),
        eventMinutes,
        recurringMinutes: recurringDailyMinutes,
        capacityMinutes: capacity,
        availabilityPercent: assignee?.availabilityPercent ?? 100,
        seniorityFactor: assignee ? config.seniorityFactors[assignee.seniority] ?? 1 : 1,
        maturityFactor: assignee ? config.maturityFactors[assignee.maturity] ?? 1 : 1,
        usedBeforeMinutes: used,
        events: [
          ...(eventsDetailByDate.get(day.date) ?? []),
          ...(recurringDailyMinutes ? [{ label: 'Recorrente diário', minutes: recurringDailyMinutes }] : []),
        ],
      };
      timeline.push({ date: day.date, startTime: startClockChunk, endTime: endClockChunk, minutes: take, detail });
      setUsage(assigneeKey, currentDay, startOffset, take);
      remaining -= take;
      if (remaining > 0) currentDay += 1;
    }

    if (remaining > 0 || !startStamp || !endStamp) {
      errors.push(
        `Tarefa ${task.id} ultrapassa o fim da sprint (${formatDate(sprint.endDate)}). Ajuste ordem, dependências ou capacidade.`,
      );
      return;
    }

    const startDay = workingDaySchedules[startStamp.dayIndex];
    const endDay = workingDaySchedules[endStamp.dayIndex];
    const startClock = offsetToClock(startDay.periods, startStamp.minuteOffset);
    const endClock = offsetToClock(endDay.periods, endStamp.minuteOffset);

    completed.set(task.id, endStamp);
    if (task.assigneeMemberName) {
      lastEndByAssignee.set(task.assigneeMemberName, endStamp);
    }

    resultTasks.push({
      ...task,
      computedStartDate: formatDateTime(startDay.date, startClock),
      computedEndDate: formatDateTime(endDay.date, endClock),
      computedTimeline: timeline,
    });
  });

  return { tasks: resultTasks, errors };
};

// Selectors helpers
export const selectWorkingCalendar = createSelector(
  [(state: RootPersistedState) => state.sprint, (state: RootPersistedState) => state.calendar],
  (sprint, calendar) => buildWorkingCalendar(sprint, calendar),
);

export const selectWorkingHours = createSelector(
  [
    selectWorkingCalendar,
    (state: RootPersistedState) => state.config.value,
    (state: RootPersistedState) => state.events.items,
    (state: RootPersistedState) => state.calendar,
  ],
  (calendarResult, config, events, calendar) =>
    computeWorkingHours(config, calendarResult.workingDays, events, calendar),
);

export const selectTeamCapacity = createSelector(
  [
    (state: RootPersistedState) => state.members.items,
    selectWorkingHours,
    (state: RootPersistedState) => state.config.value,
  ],
  (members, workingHours, config) => computeTeamCapacity(members, workingHours, config),
);

export const selectTaskSchedules = createSelector(
  [
    (state: RootPersistedState) => state.tasks.items,
    (state: RootPersistedState) => state.sprint,
    (state: RootPersistedState) => state.calendar,
    (state: RootPersistedState) => state.config.value,
    (state: RootPersistedState) => state.members.items,
    (state: RootPersistedState) => state.events.items,
  ],
  (tasks, sprint, calendarState, config, members, events) =>
    computeTaskSchedules(tasks, sprint, calendarState, config, members, events),
);
