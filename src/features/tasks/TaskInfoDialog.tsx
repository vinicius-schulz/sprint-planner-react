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
import styles from './TasksTab.module.css';

interface Props {
  open: boolean;
  task: TaskItem | null;
  onClose: () => void;
  formatDateTime: (value?: string) => string;
}

const formatPeriods = (periods: { start: string; end: string }[]) =>
  periods.map((p) => `${p.start}-${p.end}`).join(', ');

export function TaskInfoDialog({ open, task, onClose, formatDateTime }: Props) {
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
                        primary={`${formatDateTime(`${seg.date} ${seg.startTime}`)} - ${seg.endTime} (${seg.minutes} min)`}
                        secondary={
                          seg.detail ? (
                            <div className={styles.infoDetailBlock}>
                              <Typography variant="body2">Períodos do dia: {formatPeriods(seg.detail.periods)}</Typography>
                              <Typography variant="body2">
                                Capacidade do dia: {seg.detail.capacityMinutes} min (base {seg.detail.baseMinutes} - eventos {seg.detail.eventMinutes} - recorrentes {seg.detail.recurringMinutes})
                              </Typography>
                              <Typography variant="body2">
                                Disponibilidade/fatores: {seg.detail.availabilityPercent}% × sen {seg.detail.seniorityFactor} × mat {seg.detail.maturityFactor}
                              </Typography>
                              <Typography variant="body2">
                                Uso antes desta tarefa: {seg.detail.usedBeforeMinutes} min
                              </Typography>
                              <Typography variant="body2">
                                Eventos: {seg.detail.events.length ? seg.detail.events.map((e) => `${e.label} (${e.minutes}m)`).join(', ') : 'Nenhum'}
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
