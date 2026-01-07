import {
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { DaySchedule } from '../../../domain/types';
import { formatHoursToClock } from '../../../domain/services/timeFormat';
import { computeDayHours } from '../../../domain/services/workingCalendar';

type SprintDayScheduleTableProps = {
  daySchedules: DaySchedule[];
  onToggleNonWorking: (day: DaySchedule, checked: boolean) => void;
  onPeriodChange: (day: DaySchedule, periodIndex: number, field: 'start' | 'end', value: string) => void;
  className?: string;
  periodCellClassName?: string;
  nonWorkingRowClassName?: string;
};

export function SprintDayScheduleTable({
  daySchedules,
  onToggleNonWorking,
  onPeriodChange,
  className,
  periodCellClassName,
  nonWorkingRowClassName,
}: SprintDayScheduleTableProps) {
  if (daySchedules.length === 0) return null;

  return (
    <div className={className}>
      <Typography variant="subtitle2" gutterBottom>Dias da Sprint</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Data</TableCell>
            <TableCell>Período 1 (início/fim)</TableCell>
            <TableCell>Período 2 (início/fim)</TableCell>
            <TableCell>Horas do dia</TableCell>
            <TableCell>Não útil</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {daySchedules.map((day) => {
            const [p1, p2] = day.periods;
            const hours = computeDayHours(day.periods);
            return (
              <TableRow key={day.date} className={day.isNonWorking ? nonWorkingRowClassName : undefined}>
                <TableCell>{day.date}</TableCell>
                <TableCell className={periodCellClassName}>
                  <TextField
                    type="time"
                    size="small"
                    value={p1?.start ?? ''}
                    onChange={(e) => onPeriodChange(day, 0, 'start', e.target.value)}
                    disabled={day.isNonWorking}
                    inputProps={{ 'aria-label': `Período 1 início ${day.date}` }}
                  />
                  <TextField
                    type="time"
                    size="small"
                    value={p1?.end ?? ''}
                    onChange={(e) => onPeriodChange(day, 0, 'end', e.target.value)}
                    disabled={day.isNonWorking}
                    inputProps={{ 'aria-label': `Período 1 fim ${day.date}` }}
                  />
                </TableCell>
                <TableCell className={periodCellClassName}>
                  <TextField
                    type="time"
                    size="small"
                    value={p2?.start ?? ''}
                    onChange={(e) => onPeriodChange(day, 1, 'start', e.target.value)}
                    disabled={day.isNonWorking}
                    inputProps={{ 'aria-label': `Período 2 início ${day.date}` }}
                  />
                  <TextField
                    type="time"
                    size="small"
                    value={p2?.end ?? ''}
                    onChange={(e) => onPeriodChange(day, 1, 'end', e.target.value)}
                    disabled={day.isNonWorking}
                    inputProps={{ 'aria-label': `Período 2 fim ${day.date}` }}
                  />
                </TableCell>
                <TableCell>{formatHoursToClock(hours)}</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={day.isNonWorking}
                        onChange={(e) => onToggleNonWorking(day, e.target.checked)}
                        size="small"
                        inputProps={{ 'aria-label': `Marcar ${day.date} como não útil` }}
                      />
                    )}
                    label=""
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
