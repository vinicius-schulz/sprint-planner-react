import { Paper, Typography } from '@mui/material';
import { useAppSelector } from '../../app/hooks';
import { selectWorkingHours, selectTeamCapacity, selectWorkingCalendar } from '../../domain/services/capacityService';
import { formatHoursToClock } from '../../domain/services/timeFormat';
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
  const tasksTotalSp = useAppSelector((state) =>
    state.tasks.items.reduce((sum, t) => {
      const sp = t.turboEnabled && Number.isFinite(t.turboStoryPoints) ? Number(t.turboStoryPoints) : t.storyPoints;
      return sum + (sp || 0);
    }, 0),
  );

  return (
    <div className={styles.grid}>
      <Metric label="Dias úteis" value={String(calendar.workingDays.length)} hint="Considera fins de semana removidos e feriados" />
      <Metric label="Horas úteis" value={formatHoursToClock(workingHours)} hint="Descontando eventos" />
      <Metric label="Capacidade total" value={`${capacity.totalStoryPoints.toFixed(2)} SP`} hint="Com fatores e disponibilidade" />
      <Metric label="Membros" value={String(capacity.members.length)} />
      <Metric label="SP das tarefas" value={`${tasksTotalSp.toFixed(2)} SP`} hint="Total planejado na sprint" />
    </div>
  );
}
