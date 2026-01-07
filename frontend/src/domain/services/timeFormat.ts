export const formatMinutesToClock = (minutes?: number): string => {
  if (minutes == null || Number.isNaN(minutes)) return '-';
  const total = Math.max(0, Math.round(minutes));
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export const formatHoursToClock = (hours?: number): string => {
  if (hours == null || Number.isNaN(hours)) return '-';
  return formatMinutesToClock(hours * 60);
};
