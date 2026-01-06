import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { resetCalendar } from '../../features/calendar/calendarSlice';
import { resetEvents } from '../../features/events/eventsSlice';
import { resetMembers } from '../../features/members/membersSlice';
import { resetConfig } from '../../features/config/configSlice';
import { replaceTasks, resetTasks } from '../../features/tasks/tasksSlice';
import { resetSprint } from '../../features/sprint/sprintSlice';
import { resetPlanningLifecycle } from '../../features/review/planningLifecycleSlice';
import { AppSnackbar } from '../Toast';
import styles from './NewSchedulePanel.module.css';

type NewSchedulePanelProps = {
  renderTrigger?: (open: () => void) => ReactNode;
  openExternal?: boolean;
  onCloseExternal?: () => void;
  onContinue?: () => void;
};

export function NewSchedulePanel({ renderTrigger, openExternal, onCloseExternal, onContinue }: NewSchedulePanelProps) {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.items);

  const [open, setOpen] = useState(false);
  const [keepTeam, setKeepTeam] = useState(true);
  const [keepTasks, setKeepTasks] = useState(false);
  const [keepEvents, setKeepEvents] = useState(false);
  const [keepConfig, setKeepConfig] = useState(true);

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>(
    { open: false, message: '', severity: 'success' },
  );

  const showToast = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => setToast((prev) => ({ ...prev, open: false }));

  const handleNewSchedule = () => {
    dispatch(resetPlanningLifecycle());
    dispatch(resetSprint());
    dispatch(resetCalendar());

    if (!keepConfig) {
      dispatch(resetConfig());
    }

    if (!keepEvents) {
      dispatch(resetEvents());
    }

    if (!keepTeam) {
      dispatch(resetMembers());
    }

    if (keepTasks) {
      const sanitized = tasks.map((t) => ({
        ...t,
        computedStartDate: undefined,
        computedEndDate: undefined,
        computedTimeline: undefined,
      }));
      dispatch(replaceTasks(sanitized));
    } else {
      dispatch(resetTasks());
    }

    const kept = [
      keepTeam ? 'time' : null,
      keepTasks ? 'tarefas' : null,
      keepEvents ? 'eventos' : null,
      keepConfig ? 'configurações' : null,
    ].filter(Boolean);

    showToast(`Novo cronograma criado. Mantido: ${kept.length ? kept.join(', ') : 'nada'}.`, 'info');
  };

  const trigger = renderTrigger
    ? renderTrigger(() => setOpen(true))
    : (
      <Button variant="outlined" onClick={() => setOpen(true)} sx={{ mb: 2 }}>
        Dados & Cronograma
      </Button>
    );

  useEffect(() => {
    if (typeof openExternal === 'boolean') {
      setOpen(openExternal);
    }
  }, [openExternal]);

  const handleClose = () => {
    setOpen(false);
    onCloseExternal?.();
  };

  return (
    <>
      {trigger}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Dados & Cronograma</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Gerencie rapidamente o que manter ou limpar ao iniciar um novo cronograma.
          </Typography>
          <Stack spacing={2} className={styles.section}>
            <Typography variant="subtitle1">Novo cronograma</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <FormControlLabel
                control={<Checkbox checked={keepTeam} onChange={(e) => setKeepTeam(e.target.checked)} />}
                label="Manter time"
              />
              <FormControlLabel
                control={<Checkbox checked={keepTasks} onChange={(e) => setKeepTasks(e.target.checked)} />}
                label="Manter tarefas (sem datas)"
              />
              <FormControlLabel
                control={<Checkbox checked={keepEvents} onChange={(e) => setKeepEvents(e.target.checked)} />}
                label="Manter eventos"
              />
              <FormControlLabel
                control={<Checkbox checked={keepConfig} onChange={(e) => setKeepConfig(e.target.checked)} />}
                label="Manter configurações"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Fechar</Button>
          {onContinue && (
            <Button
              variant="contained"
              onClick={() => {
                handleNewSchedule();
                handleClose();
                onContinue();
              }}
            >
              Continuar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <AppSnackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleCloseToast}
        severity={toast.severity}
        message={toast.message}
      />
    </>
  );
}
