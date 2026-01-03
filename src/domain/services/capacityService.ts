import { createSelector } from '@reduxjs/toolkit';
import { addWorkingDays, dateRange, firstWorkingDayOnOrAfter, isWeekend, nextWorkingDay, toDate, toISODate } from './dateUtils';
import { computeDayHours } from './workingCalendar';
import type {
  CalendarState,
  EventItem,
  GlobalConfig,
  Member,
  RootPersistedState,
  SprintState,
  TaskItem,
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

export const computeTaskSchedules = (
  tasks: TaskItem[],
  sprint: SprintState,
  workingDays: string[],
  config: GlobalConfig,
): TaskScheduleResult => {
  const errors: string[] = [];
  const start = toDate(sprint.startDate);
  if (!start) return { tasks, errors: ['Data de início da Sprint é obrigatória para calcular tarefas.'] };
  if (!workingDays.length) return { tasks, errors: ['Não há dias úteis na Sprint para agendar tarefas.'] };

  const workingSet = new Set(workingDays);
  const ordered = [...tasks];
  const completed = new Map<string, { start: string; end: string }>();
  const lastEndByAssignee = new Map<string, string>();

  const firstWorking = firstWorkingDayOnOrAfter(start, workingSet);
  if (!firstWorking) return { tasks, errors: ['Não foi possível encontrar dia útil para início da Sprint.'] };

  const resultTasks: TaskItem[] = [];

  ordered.forEach((task) => {
    const deps = task.dependencies || [];
    let startDate = new Date(firstWorking);

    const assigneeEnd = task.assigneeMemberName ? lastEndByAssignee.get(task.assigneeMemberName) : null;
    if (assigneeEnd) {
      const afterAssignee = nextWorkingDay(toDate(assigneeEnd)!, workingSet);
      if (afterAssignee && afterAssignee > startDate) {
        startDate = afterAssignee;
      }
    }

    if (deps.includes(task.id)) {
      errors.push(`Tarefa ${task.id} não pode depender de si mesma.`);
      return;
    }

    deps.forEach((depId) => {
      const dep = completed.get(depId);
      if (!dep) {
        errors.push(`Dependência ${depId} não encontrada para tarefa ${task.id}.`);
        return;
      }
      const depEnd = toDate(dep.end);
      if (depEnd) {
        const next = nextWorkingDay(depEnd, workingSet);
        if (next && next > startDate) {
          startDate = next;
        }
      }
    });

    if (!workingSet.has(toISODate(startDate))) {
      const adjusted = firstWorkingDayOnOrAfter(startDate, workingSet);
      if (adjusted) {
        startDate = adjusted;
      }
    }

    const durationHours = config.storyPointsPerHour > 0 ? task.storyPoints / config.storyPointsPerHour : 0;
    const durationDays = Math.max(1, Math.ceil(durationHours / config.dailyWorkHours));
    const endDate = addWorkingDays(startDate, durationDays, workingDays);

    if (!endDate) {
      errors.push(`Não foi possível calcular data final para tarefa ${task.id}.`);
      return;
    }

    const startIso = toISODate(startDate);
    const endIso = toISODate(endDate);
    completed.set(task.id, { start: startIso, end: endIso });
    if (task.assigneeMemberName) {
      lastEndByAssignee.set(task.assigneeMemberName, endIso);
    }
    resultTasks.push({ ...task, computedStartDate: startIso, computedEndDate: endIso });
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
    selectWorkingCalendar,
    (state: RootPersistedState) => state.config.value,
  ],
  (tasks, sprint, calendarResult, config) =>
    computeTaskSchedules(tasks, sprint, calendarResult.workingDays, config),
);
