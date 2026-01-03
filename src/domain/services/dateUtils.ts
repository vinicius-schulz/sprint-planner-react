import type { DateString } from '../types';

export const toDate = (value: DateString): Date | null => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const toISODate = (date: Date): DateString => date.toISOString().slice(0, 10);

export const isSameDay = (a: Date, b: Date) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);

export const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const dateRange = (start: Date, end: Date): Date[] => {
  const result: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    result.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

export const nextWorkingDay = (date: Date, workingDays: Set<DateString>): Date | null => {
  const cursor = new Date(date);
  cursor.setDate(cursor.getDate() + 1);
  const limit = 366;
  for (let i = 0; i < limit; i += 1) {
    const iso = toISODate(cursor);
    if (workingDays.has(iso)) return cursor;
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
};

export const firstWorkingDayOnOrAfter = (start: Date, workingDays: Set<DateString>): Date | null => {
  const cursor = new Date(start);
  const limit = 366;
  for (let i = 0; i < limit; i += 1) {
    const iso = toISODate(cursor);
    if (workingDays.has(iso)) return cursor;
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
};

export const addWorkingDays = (start: Date, daysToAdd: number, workingDaysList: DateString[]): Date | null => {
  if (daysToAdd <= 0) return new Date(start);
  const workingSet = new Set(workingDaysList);
  let remaining = daysToAdd - 1; // start day counts as day 1
  let cursor = new Date(start);
  const limit = workingDaysList.length + 365;
  let iterations = 0;
  while (remaining > 0 && iterations < limit) {
    cursor.setDate(cursor.getDate() + 1);
    const iso = toISODate(cursor);
    if (workingSet.has(iso)) {
      remaining -= 1;
    }
    iterations += 1;
  }
  return iterations >= limit ? null : cursor;
};
