import { createSelector } from '@reduxjs/toolkit';
import { dateRange, isWeekend, toDate, toISODate } from './dateUtils';
import { computeDayHours, generateDefaultPeriods } from './workingCalendar';
import type {
  CalendarState,
  DaySchedule,
  EventItem,
  GlobalConfig,
  DateString,
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
  const storyPoints = Math.round(hours * config.storyPointsPerHour);
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

  const withinSprint = (day: DaySchedule) => {
    const d = toDate(day.date);
    if (!d) return false;
    return d >= sprintStart && d <= sprintEnd;
  };

  const resolvePeriods = (day: DaySchedule): WorkingPeriod[] =>
    day.periods?.length ? day.periods : generateDefaultPeriods(config);

  let workingDaySchedules = (calendar.daySchedules ?? [])
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

  const effectiveStoryPoints = (task: TaskItem) =>
    task.turboEnabled && Number.isFinite(task.turboStoryPoints)
      ? Math.max(0, task.turboStoryPoints || 0)
      : task.storyPoints;

  const durationMinutesForTask = (task: TaskItem) => {
    if (config.storyPointsPerHour <= 0) return 0;
    const sp = effectiveStoryPoints(task);
    return Math.max(0, Math.ceil((sp / config.storyPointsPerHour) * 60));
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

  const dependentsCount = new Map<string, number>();
  cleanedTasks.forEach((t) => dependentsCount.set(t.id, 0));
  cleanedTasks.forEach((t) => {
    (t.dependencies || []).forEach((depId) => {
      if (!taskMap.has(depId)) return;
      dependentsCount.set(depId, (dependentsCount.get(depId) ?? 0) + 1);
    });
  });

  const dueRank = (date?: DateString) => {
    const d = toDate(date ?? sprint.endDate);
    return d ? d.getTime() : Number.MAX_SAFE_INTEGER;
  };

  const hybridScore = (task: TaskItem) => {
    const deps = dependentsCount.get(task.id) ?? 0;
    const due = toDate(task.dueDate ?? sprint.endDate);
    const daysToDue = due && sprintStart ? Math.max(0, (due.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) : Number.POSITIVE_INFINITY;
    const dueScore = 1 / (1 + daysToDue); // nearer deadlines score higher
    const duration = Math.max(1, durationMinutesForTask(task));
    const durationScore = 1 / (1 + duration); // shorter tasks score higher
    return deps + (2 * dueScore) + durationScore;
  };

  const strategy = config.schedulingStrategy ?? 'EDD';

  const compareTask = (a: TaskItem, b: TaskItem) => {
    if (strategy === 'EDD') {
      const da = dueRank(a.dueDate);
      const db = dueRank(b.dueDate);
      if (da !== db) return da - db;
      const dura = durationMinutesForTask(a);
      const durb = durationMinutesForTask(b);
      if (dura !== durb) return dura - durb;
      const depa = dependentsCount.get(a.id) ?? 0;
      const depb = dependentsCount.get(b.id) ?? 0;
      if (depa !== depb) return depb - depa;
    } else if (strategy === 'SPT') {
      const dura = durationMinutesForTask(a);
      const durb = durationMinutesForTask(b);
      if (dura !== durb) return dura - durb;
    } else if (strategy === 'BLOCKERS') {
      const depa = dependentsCount.get(a.id) ?? 0;
      const depb = dependentsCount.get(b.id) ?? 0;
      if (depa !== depb) return depb - depa;
    } else if (strategy === 'HYBRID') {
      const scoreA = hybridScore(a);
      const scoreB = hybridScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      const da = dueRank(a.dueDate);
      const db = dueRank(b.dueDate);
      if (da !== db) return da - db;
      const dura = durationMinutesForTask(a);
      const durb = durationMinutesForTask(b);
      if (dura !== durb) return dura - durb;
      const depa = dependentsCount.get(a.id) ?? 0;
      const depb = dependentsCount.get(b.id) ?? 0;
      if (depa !== depb) return depb - depa;
    }
    return a.id.localeCompare(b.id);
  };

  const computeEarliestPointer = (task: TaskItem) => {
    const deps = task.dependencies || [];
    let earliestPointer = { dayIndex: 0, minuteOffset: 0 };

    deps.forEach((depId) => {
      const dep = completed.get(depId);
      if (!dep) return;
      if (dep.dayIndex > earliestPointer.dayIndex || (dep.dayIndex === earliestPointer.dayIndex && dep.minuteOffset > earliestPointer.minuteOffset)) {
        earliestPointer = { ...dep };
      }
    });

    const assigneeLast = task.assigneeMemberName ? lastEndByAssignee.get(task.assigneeMemberName) : undefined;
    if (assigneeLast) {
      if (assigneeLast.dayIndex > earliestPointer.dayIndex || (assigneeLast.dayIndex === earliestPointer.dayIndex && assigneeLast.minuteOffset > earliestPointer.minuteOffset)) {
        earliestPointer = { ...assigneeLast };
      }
    }

    return earliestPointer;
  };

  const stampValue = (stamp: { dayIndex: number; minuteOffset: number }) => stamp.dayIndex * 1_000_000 + stamp.minuteOffset;

  const depsPointerOnly = (task: TaskItem) => {
    const deps = task.dependencies || [];
    let pointer = { dayIndex: 0, minuteOffset: 0 };
    deps.forEach((depId) => {
      const dep = completed.get(depId);
      if (!dep) return;
      if (stampValue(dep) > stampValue(pointer)) pointer = { ...dep };
    });
    return pointer;
  };

  const simulateSchedule = (task: TaskItem) => {
    const durationMin = durationMinutesForTask(task);
    if (durationMin <= 0) {
      const zero = { dayIndex: 0, minuteOffset: 0 };
      return { startStamp: zero, endStamp: zero };
    }

    const depsPointer = depsPointerOnly(task);
    const earliestPointer = computeEarliestPointer(task);
    const assignee = task.assigneeMemberName ? memberByName.get(task.assigneeMemberName) : undefined;
    const assigneeKey = task.assigneeMemberName || `UNASSIGNED-${task.id}`;

    // local copies to avoid mutating global schedule during evaluation
    const localUsage = new Map<number, number>();
    const globalMap = usageByAssigneeDay.get(assigneeKey);
    globalMap?.forEach((v, k) => localUsage.set(k, v));

    const localWorking = [...workingDaySchedules];
    const appendLocalNextWorkingDay = () => {
      if (!localWorking.length) return false;
      const lastDate = toDate(localWorking[localWorking.length - 1].date);
      if (!lastDate) return false;
      const cursor = new Date(lastDate);
      const limit = 365;
      for (let i = 0; i < limit; i += 1) {
        cursor.setDate(cursor.getDate() + 1);
        if (isWeekend(cursor)) continue;
        const iso = toISODate(cursor);
        localWorking.push({ date: iso, isNonWorking: false, periods: generateDefaultPeriods(config) });
        return true;
      }
      return false;
    };

    let remaining = durationMin;
    let currentDay = earliestPointer.dayIndex;
    let startStamp: { dayIndex: number; minuteOffset: number } | null = null;
    let endStamp: { dayIndex: number; minuteOffset: number } | null = null;

    while (remaining > 0) {
      if (currentDay >= localWorking.length) {
        const added = appendLocalNextWorkingDay();
        if (!added) break;
      }
      const day = localWorking[currentDay];
      const capacity = dayCapacityForAssignee(day, assignee);
      let used = localUsage.get(currentDay) ?? 0;
      if (currentDay === earliestPointer.dayIndex && earliestPointer.minuteOffset > used) used = earliestPointer.minuteOffset;
      const available = Math.max(0, capacity - used);
      if (available <= 0) {
        currentDay += 1;
        continue;
      }
      const take = Math.min(available, remaining);
      const startOffset = used;
      const endOffset = used + take;
      if (!startStamp) startStamp = { dayIndex: currentDay, minuteOffset: startOffset };
      endStamp = { dayIndex: currentDay, minuteOffset: endOffset };
      localUsage.set(currentDay, endOffset);
      remaining -= take;
      if (remaining > 0) currentDay += 1;
    }

    if (remaining > 0 || !startStamp || !endStamp) return null;
    return { startStamp, endStamp, depsPointer };
  };
  const dependentsByDep = new Map<string, TaskItem[]>();
  cleanedTasks.forEach((t) => {
    (t.dependencies ?? []).forEach((depId) => {
      if (!taskMap.has(depId)) return;
      const list = dependentsByDep.get(depId) ?? [];
      list.push(t);
      dependentsByDep.set(depId, list);
    });
  });

  const ready: TaskItem[] = [];
  cleanedTasks.forEach((t) => {
    if ((indegree.get(t.id) ?? 0) === 0) ready.push(t);
  });

  let lastCompletedTaskId: string | undefined;
  const resultTasks: TaskItem[] = [];
  const scheduledIds = new Set<string>();

  const currentMakespan = () => {
    let max = 0;
    lastEndByAssignee.forEach((stamp) => { max = Math.max(max, stampValue(stamp)); });
    return max;
  };

  while (ready.length) {
    const baselineMakespan = currentMakespan();

    let bestIndex = -1;
    let bestTask: TaskItem | null = null;
    let bestProjectedMakespan = Number.POSITIVE_INFINITY;
    let bestGapToDeps = Number.POSITIVE_INFINITY;
    let bestStart = Number.POSITIVE_INFINITY;
    let bestEnd = Number.POSITIVE_INFINITY;

    for (let i = 0; i < ready.length; i += 1) {
      const candidate = ready[i];
      if (scheduledIds.has(candidate.id)) continue;

      const sim = simulateSchedule(candidate);
      if (!sim) continue;

      const startV = stampValue(sim.startStamp);
      const endV = stampValue(sim.endStamp);

      const unlockedByLast = lastCompletedTaskId ? (candidate.dependencies ?? []).includes(lastCompletedTaskId) : false;
      const hasDeps = (candidate.dependencies?.length ?? 0) > 0;

      // Prefer newly-unlocked dependents and blocked tasks to reduce waiting after blockers.
      // We encode this as a "virtual" improvement by strongly reducing the gap score.
      const depsPointer = sim.depsPointer ?? { dayIndex: 0, minuteOffset: 0 };
      const depsV = stampValue(depsPointer);
      let gapToDeps = hasDeps ? Math.max(0, startV - depsV) : Number.POSITIVE_INFINITY;
      if (unlockedByLast && hasDeps) gapToDeps = Math.max(0, gapToDeps - 1000);

      // Projected makespan if we schedule this task now.
      const assigneeName = candidate.assigneeMemberName;
      const currentAssigneeEnd = assigneeName ? stampValue(lastEndByAssignee.get(assigneeName) ?? { dayIndex: 0, minuteOffset: 0 }) : 0;
      const projectedAssigneeEnd = Math.max(currentAssigneeEnd, endV);
      const projectedMakespan = Math.max(baselineMakespan, projectedAssigneeEnd);

      const pick = () => {
        bestIndex = i;
        bestTask = candidate;
        bestProjectedMakespan = projectedMakespan;
        bestGapToDeps = gapToDeps;
        bestStart = startV;
        bestEnd = endV;
      };

      if (!bestTask) {
        pick();
        continue;
      }

      if (projectedMakespan !== bestProjectedMakespan) {
        if (projectedMakespan < bestProjectedMakespan) pick();
        continue;
      }
      if (gapToDeps !== bestGapToDeps) {
        if (gapToDeps < bestGapToDeps) pick();
        continue;
      }
      if (bestEnd !== endV) {
        if (endV < bestEnd) pick();
        continue;
      }
      if (bestStart !== startV) {
        if (startV < bestStart) pick();
        continue;
      }

      const byStrategy = compareTask(candidate, bestTask);
      if (byStrategy < 0) pick();
    }

    const task = bestTask ?? ready[0];
    if (bestIndex >= 0) ready.splice(bestIndex, 1);
    else ready.shift();

    if (scheduledIds.has(task.id)) continue;

    const deps = task.dependencies || [];
    const durationMin = durationMinutesForTask(task);
    const timeline: TaskWorkSegment[] = [];
    if (durationMin === 0) {
      const formatted = formatDateTime(sprint.startDate, '00:00');
      resultTasks.push({ ...task, computedStartDate: formatted, computedEndDate: formatted, computedTimeline: timeline });
      completed.set(task.id, { dayIndex: 0, minuteOffset: 0 });
      scheduledIds.add(task.id);
      lastCompletedTaskId = task.id;

      const dependents = dependentsByDep.get(task.id) ?? [];
      dependents.forEach((dep) => {
        const val = (indegree.get(dep.id) ?? 0) - 1;
        indegree.set(dep.id, val);
        if (val === 0) ready.push(dep);
      });
      continue;
    }

    if (deps.includes(task.id)) {
      errors.push(`Tarefa ${task.id} não pode depender de si mesma.`);
      continue;
    }

    let earliestPointer = computeEarliestPointer(task);

    const assignee = task.assigneeMemberName ? memberByName.get(task.assigneeMemberName) : undefined;

    let remaining = durationMin;
    let currentDay = earliestPointer.dayIndex;
    let startStamp: { dayIndex: number; minuteOffset: number } | null = null;
    let endStamp: { dayIndex: number; minuteOffset: number } | null = null;
    const assigneeKey = task.assigneeMemberName || `UNASSIGNED-${task.id}`; // unassigned tasks shouldn't chain each other

    const appendNextWorkingDay = () => {
      if (!workingDaySchedules.length) return false;
      const lastDate = toDate(workingDaySchedules[workingDaySchedules.length - 1].date);
      if (!lastDate) return false;
      const cursor = new Date(lastDate);
      const limit = 365; // avoid infinite loop
      for (let i = 0; i < limit; i += 1) {
        cursor.setDate(cursor.getDate() + 1);
        if (isWeekend(cursor)) continue;
        const iso = toISODate(cursor);
        workingDaySchedules = [...workingDaySchedules, { date: iso, isNonWorking: false, periods: generateDefaultPeriods(config) }];
        return true;
      }
      return false;
    };

    while (remaining > 0) {
      if (currentDay >= workingDaySchedules.length) {
        const added = appendNextWorkingDay();
        if (!added) break;
      }
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

    if (remaining > 0 || !startStamp || !endStamp) continue;

    const startDay = workingDaySchedules[startStamp.dayIndex];
    const endDay = workingDaySchedules[endStamp.dayIndex];
    const startClock = offsetToClock(startDay.periods, startStamp.minuteOffset);
    const endClock = offsetToClock(endDay.periods, endStamp.minuteOffset);

    completed.set(task.id, endStamp);
    scheduledIds.add(task.id);
    if (task.assigneeMemberName) {
      lastEndByAssignee.set(task.assigneeMemberName, endStamp);
    }

    lastCompletedTaskId = task.id;

    const dependents = dependentsByDep.get(task.id) ?? [];
    dependents.forEach((dep) => {
      const val = (indegree.get(dep.id) ?? 0) - 1;
      indegree.set(dep.id, val);
      if (val === 0) ready.push(dep);
    });

    resultTasks.push({
      ...task,
      computedStartDate: formatDateTime(startDay.date, startClock),
      computedEndDate: formatDateTime(endDay.date, endClock),
      computedTimeline: timeline,
    });
  }

  if (scheduledIds.size !== cleanedTasks.length) {
    const cyclic = cleanedTasks.filter((t) => !scheduledIds.has(t.id)).map((t) => t.id).join(', ');
    errors.push(`Dependências cíclicas ou inválidas entre: ${cyclic || 'tarefas'}.`);
  }

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
