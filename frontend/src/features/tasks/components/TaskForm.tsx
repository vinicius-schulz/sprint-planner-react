import {
  Autocomplete,
  Button,
  Chip,
  MenuItem,
  TextField,
} from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import type { SchedulingStrategy } from '../../../domain/types';
import styles from '../TasksTab.module.css';

interface DependencyOption {
  label: string;
  value: string;
}

interface TaskFormProps {
  strategy: SchedulingStrategy;
  onStrategyChange: (strategy: SchedulingStrategy) => void;
  name: string;
  onNameChange: (value: string) => void;
  assigneeMemberName: string;
  onAssigneeChange: (value: string) => void;
  storyPoints: number;
  onStoryPointsChange: (value: number) => void;
  storyPointScale: number[];
  dependenciesIds: string[];
  onDependenciesChange: (values: string[]) => void;
  members: { id: string; name: string }[];
  dependencyOptions: DependencyOption[];
  onAdd: () => void;
}

export function TaskForm({
  strategy,
  onStrategyChange,
  name,
  onNameChange,
  assigneeMemberName,
  onAssigneeChange,
  storyPoints,
  onStoryPointsChange,
  storyPointScale,
  dependenciesIds,
  onDependenciesChange,
  members,
  dependencyOptions,
  onAdd,
}: TaskFormProps) {
  return (
    <div className={styles.form}>
      <TextField
        select
        label="Estratégia de agendamento"
        value={strategy}
        onChange={(e) => onStrategyChange(e.target.value as SchedulingStrategy)}
        InputProps={{ startAdornment: <ScheduleIcon fontSize="small" /> }}
      >
        <MenuItem value="EDD">EDD (prazo mais cedo)</MenuItem>
        <MenuItem value="SPT">SPT (tarefas mais curtas primeiro)</MenuItem>
        <MenuItem value="BLOCKERS">Blockers (mais dependentes)</MenuItem>
        <MenuItem value="HYBRID">Combinação (bloqueios + prazo + 1/duração)</MenuItem>
      </TextField>
      <TextField label="Nome" value={name} onChange={(e) => onNameChange(e.target.value)} />
      <TextField
        select
        label="Responsável"
        value={assigneeMemberName}
        onChange={(e) => onAssigneeChange(e.target.value)}
      >
        <MenuItem value="">-- Sem responsável --</MenuItem>
        {members.map((m) => (
          <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Story Points"
        value={storyPoints}
        onChange={(e) => onStoryPointsChange(Number(e.target.value))}
      >
        {storyPointScale.map((sp) => (
          <MenuItem key={sp} value={sp}>{sp}</MenuItem>
        ))}
      </TextField>
      <Autocomplete
        multiple
        options={dependencyOptions}
        getOptionLabel={(o) => o.label}
        value={dependencyOptions.filter((o) => dependenciesIds.includes(o.value))}
        onChange={(_, newValue) => onDependenciesChange(newValue.map((o) => o.value))}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            (() => {
              const { key, ...chipProps } = getTagProps({ index });
              return <Chip key={key} label={option.value} {...chipProps} />;
            })()
          ))
        }
        renderInput={(params) => (
          <TextField {...params} label="Dependências" placeholder="Selecionar" />
        )}
        filterSelectedOptions
        disableCloseOnSelect
        clearOnBlur
        blurOnSelect={false}
        ListboxProps={{ style: { maxHeight: 240 } }}
      />
      <Button variant="contained" onClick={onAdd}>Adicionar Tarefa</Button>
    </div>
  );
}
