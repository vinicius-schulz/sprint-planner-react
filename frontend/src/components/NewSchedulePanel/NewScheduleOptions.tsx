import {
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';

type NewScheduleOptionsProps = {
  keepTeam: boolean;
  keepTasks: boolean;
  keepEvents: boolean;
  keepConfig: boolean;
  onKeepTeamChange: (value: boolean) => void;
  onKeepTasksChange: (value: boolean) => void;
  onKeepEventsChange: (value: boolean) => void;
  onKeepConfigChange: (value: boolean) => void;
  className?: string;
};

export function NewScheduleOptions({
  keepTeam,
  keepTasks,
  keepEvents,
  keepConfig,
  onKeepTeamChange,
  onKeepTasksChange,
  onKeepEventsChange,
  onKeepConfigChange,
  className,
}: NewScheduleOptionsProps) {
  return (
    <Stack spacing={2} className={className}>
      <Typography variant="subtitle1">Novo cronograma</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <FormControlLabel
          control={<Checkbox checked={keepTeam} onChange={(e) => onKeepTeamChange(e.target.checked)} />}
          label="Manter time"
        />
        <FormControlLabel
          control={<Checkbox checked={keepTasks} onChange={(e) => onKeepTasksChange(e.target.checked)} />}
          label="Manter tarefas (sem datas)"
        />
        <FormControlLabel
          control={<Checkbox checked={keepEvents} onChange={(e) => onKeepEventsChange(e.target.checked)} />}
          label="Manter eventos"
        />
        <FormControlLabel
          control={<Checkbox checked={keepConfig} onChange={(e) => onKeepConfigChange(e.target.checked)} />}
          label="Manter configurações"
        />
      </Stack>
    </Stack>
  );
}
