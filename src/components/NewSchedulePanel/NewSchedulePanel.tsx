import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { resetSprint } from '../../features/sprint/sprintSlice';
import { resetCalendar } from '../../features/calendar/calendarSlice';
import { resetEvents } from '../../features/events/eventsSlice';
import { resetMembers } from '../../features/members/membersSlice';
import { replaceTasks, resetTasks } from '../../features/tasks/tasksSlice';
import { resetConfig } from '../../features/config/configSlice';
import styles from './NewSchedulePanel.module.css';

type NewSchedulePanelProps = {
  renderTrigger?: (open: () => void) => ReactNode;
};

export function NewSchedulePanel({ renderTrigger }: NewSchedulePanelProps) {
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
    const ok = window.confirm('Criar novo cronograma e limpar dados conforme seleção?');
    if (!ok) return;
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

  const confirmAnd = (message: string, fn: () => void) => {
    if (window.confirm(message)) {
      fn();
      return true;
    }
    return false;
  };

  const handleClearSprint = () => confirmAnd('Limpar sprint atual?', () => { dispatch(resetSprint()); showToast('Sprint limpa.'); });
  const handleClearCalendar = () => confirmAnd('Limpar calendário?', () => { dispatch(resetCalendar()); showToast('Calendário limpo.'); });
  const handleClearEvents = () => confirmAnd('Limpar eventos?', () => { dispatch(resetEvents()); showToast('Eventos limpos.'); });
  const handleClearTeam = () => confirmAnd('Limpar time?', () => { dispatch(resetMembers()); showToast('Time limpo.'); });
  const handleClearTasks = () => confirmAnd('Limpar tarefas?', () => { dispatch(resetTasks()); showToast('Tarefas limpas.'); });
  const handleClearConfig = () => confirmAnd('Resetar configurações?', () => { dispatch(resetConfig()); showToast('Configurações resetadas.'); });

  const trigger = renderTrigger
    ? renderTrigger(() => setOpen(true))
    : (
      <Button variant="outlined" onClick={() => setOpen(true)} sx={{ mb: 2 }}>
        Dados & Cronograma
      </Button>
    );

  return (
    <>
      {trigger}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
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
            <Button variant="contained" onClick={handleNewSchedule} color="primary">
              Criar novo cronograma
            </Button>
          </Stack>

          <Divider className={styles.divider} />

          <Stack spacing={2} className={styles.section}>
            <Typography variant="subtitle1">Limpar por seção</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button variant="outlined" onClick={handleClearSprint}>Limpar Sprint</Button>
              <Button variant="outlined" onClick={handleClearCalendar}>Limpar Calendário</Button>
              <Button variant="outlined" onClick={handleClearEvents}>Limpar Eventos</Button>
              <Button variant="outlined" onClick={handleClearTeam}>Limpar Time</Button>
              <Button variant="outlined" onClick={handleClearTasks}>Limpar Tarefas</Button>
              <Button variant="outlined" onClick={handleClearConfig}>Resetar Configuração</Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
