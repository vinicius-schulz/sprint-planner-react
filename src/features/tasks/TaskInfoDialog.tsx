import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import type { TaskItem } from '../../domain/types';
import { formatHoursToClock, formatMinutesToClock } from '../../domain/services/timeFormat';
import styles from './TasksTab.module.css';

interface Props {
  open: boolean;
  task: TaskItem | null;
  onClose: () => void;
  formatDateTime: (value?: string) => string;
  storyPointsPerHour: number;
}

const formatPeriods = (periods: { start: string; end: string }[]) =>
  periods.map((p) => `${p.start}-${p.end}`).join(', ');

export function TaskInfoDialog({ open, task, onClose, formatDateTime, storyPointsPerHour }: Props) {
  const totalMinutes = task?.computedTimeline?.reduce((sum, seg) => sum + seg.minutes, 0) ?? 0;
  const sp = task?.storyPoints ?? 0;
  const storyHours = storyPointsPerHour > 0 ? sp / storyPointsPerHour : 0;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Detalhes da tarefa</DialogTitle>
      <DialogContent dividers>
        {!task && <Typography variant="body2">Nenhuma tarefa selecionada.</Typography>}
        {task && (
          <div className={styles.infoDialogContent}>
            <Typography variant="subtitle1" gutterBottom>{task.name}</Typography>
            <Typography variant="body2">ID: {task.id}</Typography>
            <Typography variant="body2">Responsável: {task.assigneeMemberName || '—'}</Typography>
            <Typography variant="body2">Início: {formatDateTime(task.computedStartDate)}</Typography>
            <Typography variant="body2" gutterBottom>Fim: {formatDateTime(task.computedEndDate)}</Typography>
            <Typography variant="body2">Story Points: {sp}</Typography>
            <Typography variant="body2" gutterBottom>
              Total planejado: {formatMinutesToClock(totalMinutes)} úteis — equivalente a {formatHoursToClock(storyHours)} pela taxa de SP ({storyPointsPerHour} SP/h)
            </Typography>

            <Typography variant="subtitle2" gutterBottom>Plano por dia</Typography>
            {!task.computedTimeline?.length && (
              <Typography variant="body2" color="text.secondary">
                Calcule as datas para ver o cronograma detalhado.
              </Typography>
            )}
            {task.computedTimeline?.length ? (
              <List dense>
                {task.computedTimeline.map((seg, idx) => (
                  <div key={`${seg.date}-${seg.startTime}-${seg.endTime}-${idx}`}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={`${formatDateTime(`${seg.date} ${seg.startTime}`)} - ${seg.endTime} (${formatMinutesToClock(seg.minutes)})`}
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          seg.detail ? (
                            <div className={styles.infoDetailBlock}>
                              <Typography component="div" variant="body2">
                                Nesta tarefa: {formatMinutesToClock(seg.minutes)} · Capacidade do dia: {formatMinutesToClock(seg.detail.capacityMinutes)}
                              </Typography>
                              <Typography component="div" variant="body2">
                                Eventos/recorrentes no dia: {formatMinutesToClock(seg.detail.eventMinutes + seg.detail.recurringMinutes)} · Períodos: {formatPeriods(seg.detail.periods)}
                              </Typography>
                            </div>
                          ) : undefined
                        }
                      />
                    </ListItem>
                    {idx < task.computedTimeline!.length - 1 && <Divider component="li" />}
                  </div>
                ))}
              </List>
            ) : null}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default TaskInfoDialog;
