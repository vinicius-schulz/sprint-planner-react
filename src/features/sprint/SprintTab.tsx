import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateSprint } from './sprintSlice';
import { validateSprint } from '../../domain/services/validators';
import { selectWorkingCalendar, selectWorkingHours } from '../../domain/services/capacityService';
import { buildDaySchedules, computeDayHours } from '../../domain/services/workingCalendar';
import { setDaySchedules, updateDaySchedule } from '../calendar/calendarSlice';
import { formatHoursToClock } from '../../domain/services/timeFormat';
import {
  TextField,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
} from '@mui/material';
import type { DaySchedule } from '../../domain/types';
import styles from './SprintTab.module.css';

export function SprintTab() {
  const sprint = useAppSelector((state) => state.sprint);
  const calendar = useAppSelector((state) => state.calendar);
  const config = useAppSelector((state) => state.config.value);
  const workingHours = useAppSelector(selectWorkingHours);
  const calendarResult = useAppSelector(selectWorkingCalendar);
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState(sprint.title);
  const [startDate, setStartDate] = useState(sprint.startDate);
  const [endDate, setEndDate] = useState(sprint.endDate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) {
      setError(null);
      return;
    }
    const candidate = { title: title || 'Sprint sem título', startDate, endDate };
    const validation = validateSprint(candidate);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    dispatch(updateSprint(candidate));
    const generated = buildDaySchedules(candidate, config, calendar.daySchedules ?? []);
    dispatch(setDaySchedules(generated));
    // calendar.daySchedules intentionally read inside to preserve edits without re-triggering endlessly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, title, config, dispatch]);

  const handleToggleNonWorking = (day: DaySchedule, checked: boolean) => {
    dispatch(updateDaySchedule({ ...day, isNonWorking: checked }));
  };

  const handlePeriodChange = (day: DaySchedule, periodIndex: number, field: 'start' | 'end', value: string) => {
    const periods = [...day.periods];
    if (!periods[periodIndex]) {
      periods[periodIndex] = { start: '', end: '' };
    }
    periods[periodIndex] = { ...periods[periodIndex], [field]: value };
    dispatch(updateDaySchedule({ ...day, periods }));
  };

  const daySchedules = calendar.daySchedules ?? [];

  const totalHoursPreview = useMemo(
    () => daySchedules.filter((d) => !d.isNonWorking).reduce((sum, day) => sum + computeDayHours(day.periods), 0),
    [daySchedules],
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sprint
        </Typography>
        <div className={styles.formRow}>
          <TextField
            label="Título"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Data início"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Data fim"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </div>
        {error && <Alert severity="error" className={styles.error}>{error}</Alert>}
        <div className={styles.metrics}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Horas Úteis Calculadas</Typography>
            <Typography variant="h5">{formatHoursToClock(workingHours)}</Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Dias Úteis</Typography>
            <Typography variant="h5">{calendarResult.workingDays.length}</Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Horas planeadas (por dia)</Typography>
            <Typography variant="h5">{formatHoursToClock(totalHoursPreview)}</Typography>
          </Stack>
        </div>
        {daySchedules.length > 0 && (
          <div className={styles.dayTable}>
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
                    <TableRow key={day.date} className={day.isNonWorking ? styles.nonWorkingRow : undefined}>
                      <TableCell>{day.date}</TableCell>
                      <TableCell className={styles.periodCell}>
                        <TextField
                          type="time"
                          size="small"
                          value={p1?.start ?? ''}
                          onChange={(e) => handlePeriodChange(day, 0, 'start', e.target.value)}
                          disabled={day.isNonWorking}
                        />
                        <TextField
                          type="time"
                          size="small"
                          value={p1?.end ?? ''}
                          onChange={(e) => handlePeriodChange(day, 0, 'end', e.target.value)}
                          disabled={day.isNonWorking}
                        />
                      </TableCell>
                      <TableCell className={styles.periodCell}>
                        <TextField
                          type="time"
                          size="small"
                          value={p2?.start ?? ''}
                          onChange={(e) => handlePeriodChange(day, 1, 'start', e.target.value)}
                          disabled={day.isNonWorking}
                        />
                        <TextField
                          type="time"
                          size="small"
                          value={p2?.end ?? ''}
                          onChange={(e) => handlePeriodChange(day, 1, 'end', e.target.value)}
                          disabled={day.isNonWorking}
                        />
                      </TableCell>
                      <TableCell>{formatHoursToClock(hours)}</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={(
                            <Switch
                              checked={day.isNonWorking}
                              onChange={(e) => handleToggleNonWorking(day, e.target.checked)}
                              size="small"
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
        )}
      </CardContent>
    </Card>
  );
}
