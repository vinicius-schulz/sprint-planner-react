import { Paper, Typography } from '@mui/material';
import { useAppSelector } from '../../app/hooks';
import { selectWorkingHours, selectTeamCapacity, selectWorkingCalendar } from '../../domain/services/capacityService';
import styles from './SummaryBoard.module.css';

interface MetricProps {
  label: string;
  value: string;
  hint?: string;
}

const Metric = ({ label, value, hint }: MetricProps) => (
  <Paper elevation={1} sx={{ p: 2 }}>
    <Typography variant="subtitle2">{label}</Typography>
    <Typography variant="h5">{value}</Typography>
    {hint && <Typography variant="body2" color="text.secondary">{hint}</Typography>}
  </Paper>
);

export function SummaryBoard() {
  const workingHours = useAppSelector(selectWorkingHours);
  const calendar = useAppSelector(selectWorkingCalendar);
  const capacity = useAppSelector(selectTeamCapacity);

  return (
    <div className={styles.grid}>
      <Metric label="Dias úteis" value={String(calendar.workingDays.length)} hint="Considera fins de semana removidos e feriados" />
      <Metric label="Horas úteis" value={`${workingHours.toFixed(2)} h`} hint="Descontando eventos" />
      <Metric label="Capacidade total" value={`${capacity.totalStoryPoints.toFixed(2)} SP`} hint="Com fatores e disponibilidade" />
      <Metric label="Membros" value={String(capacity.members.length)} />
    </div>
  );
}
