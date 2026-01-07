import { useMemo } from 'react';
import { Stack, Typography } from '@mui/material';
import { formatHoursToClock } from '../../../domain/services/timeFormat';
import { computeDayHours } from '../../../domain/services/workingCalendar';
import type { DaySchedule } from '../../../domain/types';

type SprintMetricsProps = {
  workingHours: number;
  workingDays: number;
  daySchedules: DaySchedule[];
  className?: string;
};

export function SprintMetrics({ workingHours, workingDays, daySchedules, className }: SprintMetricsProps) {
  const totalHoursPreview = useMemo(
    () => daySchedules.filter((d) => !d.isNonWorking).reduce((sum, day) => sum + computeDayHours(day.periods), 0),
    [daySchedules],
  );

  return (
    <div className={className}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Horas Úteis Calculadas</Typography>
        <Typography variant="h5">{formatHoursToClock(workingHours)}</Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Dias Úteis</Typography>
        <Typography variant="h5">{workingDays}</Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Horas planeadas (por dia)</Typography>
        <Typography variant="h5">{formatHoursToClock(totalHoursPreview)}</Typography>
      </Stack>
    </div>
  );
}
