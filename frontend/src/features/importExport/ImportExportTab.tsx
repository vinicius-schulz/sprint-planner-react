import { useMemo, useState } from 'react';
import { Alert, Button, Card, CardContent, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateSprint } from '../../app/store/slices/sprintSlice';
import { replaceCalendar } from '../../app/store/slices/calendarSlice';
import { replaceEvents } from '../../app/store/slices/eventsSlice';
import { replaceMembers } from '../../app/store/slices/membersSlice';
import { replaceTasks } from '../../app/store/slices/tasksSlice';
import { updateConfig } from '../../app/store/slices/configSlice';
import type { RootPersistedState } from '../../domain/types';
import styles from './ImportExportTab.module.css';

type ImportPayload = {
  version?: string;
  sprint?: RootPersistedState['sprint'];
  nonWorkingDaysManual?: string[];
  nonWorkingDaysRemoved?: string[];
  daySchedules?: RootPersistedState['calendar']['daySchedules'];
  events?: RootPersistedState['events']['items'] | { items: RootPersistedState['events']['items'] };
  members?: RootPersistedState['members']['items'];
  tasks?: RootPersistedState['tasks']['items'];
  globalConfig?: RootPersistedState['config']['value'];
};

const VERSION = 'SprintPulse – v1.0';

export function ImportExportTab() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((root) => root) as RootPersistedState;
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const exportPayload = useMemo(() => ({
    version: VERSION,
    sprint: state.sprint,
    nonWorkingDaysManual: state.calendar.nonWorkingDaysManual,
    nonWorkingDaysRemoved: state.calendar.nonWorkingDaysRemoved,
    daySchedules: state.calendar.daySchedules,
    events: state.events.items,
    members: state.members.items,
    tasks: state.tasks.items,
    globalConfig: state.config.value,
  }), [state]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sprintpulse.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Selecione um arquivo para importar.');
      return;
    }
    try {
      const content = await file.text();
      const data = JSON.parse(content) as ImportPayload;
      if (!data.sprint || !data.globalConfig) {
        setError('Arquivo inválido ou malformado.');
        return;
      }
      dispatch(updateSprint(data.sprint));
      dispatch(
        replaceCalendar({
          nonWorkingDaysManual: data.nonWorkingDaysManual ?? [],
          nonWorkingDaysRemoved: data.nonWorkingDaysRemoved ?? [],
          daySchedules: data.daySchedules ?? [],
        }),
      );
      if (Array.isArray(data.events)) {
        dispatch(replaceEvents(data.events));
      } else if (data.events?.items) {
        dispatch(replaceEvents(data.events.items));
      }
      if (Array.isArray(data.members)) {
        dispatch(replaceMembers(data.members));
      }
      if (Array.isArray(data.tasks)) {
        dispatch(replaceTasks(data.tasks));
      }
      dispatch(updateConfig(data.globalConfig));
      setError(null);
      setInfo('Importação concluída. Estado atualizado.');
    } catch (err) {
      setError('Erro ao importar arquivo. Verifique o JSON.');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Exportar / Importar</Typography>
        <div className={styles.actions}>
          <Button variant="contained" onClick={handleExport}>Exportar JSON</Button>
          <input type="file" accept="application/json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button variant="outlined" onClick={handleImport}>Importar</Button>
        </div>
        <Typography variant="body2" sx={{ mt: 1 }}>Versão do arquivo: {VERSION}</Typography>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mt: 1 }}>{info}</Alert>}
      </CardContent>
    </Card>
  );
}
