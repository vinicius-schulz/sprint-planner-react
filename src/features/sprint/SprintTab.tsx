import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateSprint } from './sprintSlice';
import { validateSprint } from '../../domain/services/validators';
import { selectWorkingCalendar, selectWorkingHours } from '../../domain/services/capacityService';
import { TextField, Button, Card, CardContent, Typography, Stack, Alert } from '@mui/material';
import styles from './SprintTab.module.css';

export function SprintTab() {
  const sprint = useAppSelector((state) => state.sprint);
  const workingHours = useAppSelector(selectWorkingHours);
  const calendarResult = useAppSelector(selectWorkingCalendar);
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState(sprint.title);
  const [startDate, setStartDate] = useState(sprint.startDate);
  const [endDate, setEndDate] = useState(sprint.endDate);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = () => {
    const candidate = { title: title || 'Sprint sem título', startDate, endDate };
    const validation = validateSprint(candidate);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    dispatch(updateSprint(candidate));
  };

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
          <Button variant="contained" onClick={handleUpdate}>
            Atualizar Sprint
          </Button>
        </div>
        {error && <Alert severity="error" className={styles.error}>{error}</Alert>}
        <div className={styles.metrics}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Horas Úteis Calculadas</Typography>
            <Typography variant="h5">{workingHours.toFixed(2)} h</Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Dias Úteis</Typography>
            <Typography variant="h5">{calendarResult.workingDays.length}</Typography>
          </Stack>
        </div>
      </CardContent>
    </Card>
  );
}
