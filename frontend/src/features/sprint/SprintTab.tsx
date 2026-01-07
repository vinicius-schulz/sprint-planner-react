import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateSprint } from '../../app/store/slices/sprintSlice';
import { validateSprint } from '../../domain/services/validators';
import { selectWorkingCalendar, selectWorkingHours } from '../../domain/services/capacityService';
import { buildDaySchedules } from '../../domain/services/workingCalendar';
import { setDaySchedules, updateDaySchedule } from '../../app/store/slices/calendarSlice';
import {
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import type { DaySchedule } from '../../domain/types';
import styles from './SprintTab.module.css';
import { SprintForm } from './components/SprintForm';
import { SprintMetrics } from './components/SprintMetrics';
import { SprintDayScheduleTable } from './components/SprintDayScheduleTable';

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
    setTitle(sprint.title);
    setStartDate(sprint.startDate);
    setEndDate(sprint.endDate);
  }, [sprint.title, sprint.startDate, sprint.endDate]);

  const dateRangeError = useMemo(() => {
    if (!startDate || !endDate) return null;
    if (endDate < startDate) return 'A data fim deve ser igual ou posterior à data início.';
    return null;
  }, [startDate, endDate]);

  useEffect(() => {
    if (!startDate || !endDate) {
      setError(null);
      return;
    }
    if (dateRangeError) {
      setError(dateRangeError);
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
  }, [startDate, endDate, title, config, dispatch, dateRangeError]);

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

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sprint
        </Typography>
        <SprintForm
          title={title}
          startDate={startDate}
          endDate={endDate}
          dateRangeError={dateRangeError}
          error={error}
          onTitleChange={setTitle}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          className={styles.formRow}
          errorClassName={styles.error}
        />
        <SprintMetrics
          workingHours={workingHours}
          workingDays={calendarResult.workingDays.length}
          daySchedules={daySchedules}
          className={styles.metrics}
        />
        <SprintDayScheduleTable
          daySchedules={daySchedules}
          onToggleNonWorking={handleToggleNonWorking}
          onPeriodChange={handlePeriodChange}
          className={styles.dayTable}
          periodCellClassName={styles.periodCell}
          nonWorkingRowClassName={styles.nonWorkingRow}
        />
      </CardContent>
    </Card>
  );
}
