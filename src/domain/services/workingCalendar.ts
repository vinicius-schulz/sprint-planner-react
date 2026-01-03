import { dateRange, isWeekend, toDate, toISODate } from './dateUtils';
import type { DaySchedule, GlobalConfig, SprintState, WorkingPeriod } from '../types';
import { DEFAULT_CONFIG } from '../constants';

const timeToMinutes = (time: string): number => {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, hh, mm] = match;
  return Number(hh) * 60 + Number(mm);
};

const periodHours = (period: WorkingPeriod): number => {
  const start = timeToMinutes(period.start);
  const end = timeToMinutes(period.end);
  return Math.max(0, (end - start) / 60);
};

const normalizePeriods = (periods: WorkingPeriod[]): WorkingPeriod[] =>
  periods
    .map((p) => ({ start: p.start.trim(), end: p.end.trim() }))
    .filter((p) => p.start && p.end);

export const computeDayHours = (periods: WorkingPeriod[]): number =>
  normalizePeriods(periods).reduce((sum, p) => sum + periodHours(p), 0);

export const generateDefaultPeriods = (config: GlobalConfig): WorkingPeriod[] => {
  const periods = config.defaultWorkingPeriods?.length
    ? config.defaultWorkingPeriods
    : DEFAULT_CONFIG.defaultWorkingPeriods;
  return normalizePeriods(periods);
};

export const buildDaySchedules = (
  sprint: SprintState,
  config: GlobalConfig,
  existing?: DaySchedule[],
): DaySchedule[] => {
  const start = toDate(sprint.startDate);
  const end = toDate(sprint.endDate);
  if (!start || !end) return [];
  const defaults = generateDefaultPeriods(config);
  const existingMap = new Map<string, DaySchedule>((existing ?? []).map((d) => [d.date, d]));

  return dateRange(start, end).map((day) => {
    const iso = toISODate(day);
    const prev = existingMap.get(iso);
    const weekend = isWeekend(day);
    const basePeriods = prev?.periods?.length ? prev.periods : defaults;
    return {
      date: iso,
      isNonWorking: prev?.isNonWorking ?? weekend,
      periods: basePeriods,
    };
  });
};
