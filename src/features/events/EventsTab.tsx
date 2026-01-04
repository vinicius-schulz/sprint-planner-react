import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addEvent, removeEvent } from './eventsSlice';
import { validateEvent } from '../../domain/services/validators';
import type { EventType } from '../../domain/types';
import styles from './EventsTab.module.css';

const EVENT_TYPES: EventType[] = ['Planning', 'Refinamento', 'Review', 'Retrospectiva', 'Daily', 'Outros'];

export function EventsTab() {
  const dispatch = useAppDispatch();
  const events = useAppSelector((state) => state.events.items);
  const config = useAppSelector((state) => state.config.value);
  const [type, setType] = useState<EventType>('Planning');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [durationValue, setDurationValue] = useState(60);
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
  const [recurringDaily, setRecurringDaily] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toMinutes = (value: number, unit: 'minutes' | 'hours' | 'days'): number => {
    if (!Number.isFinite(value) || value <= 0) return 0;
    if (unit === 'minutes') return Math.round(value);
    if (unit === 'hours') return Math.round(value * 60);
    return Math.round(value * config.dailyWorkHours * 60);
  };

  const formatDurationLabel = (minutes: number): string => {
    const dayMinutes = Math.round(config.dailyWorkHours * 60);
    if (minutes % dayMinutes === 0) return `${minutes / dayMinutes} dia(s)`;
    if (minutes % 60 === 0) return `${minutes / 60} h`;
    return `${minutes} min`;
  };

  const handleAdd = () => {
    const minutes = toMinutes(durationValue, durationUnit);
    const base = { type, description, date, minutes, recurringDaily } as const;
    const validation = validateEvent(base);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    dispatch(
      addEvent({
        id: crypto.randomUUID(),
        ...base,
      }),
    );
    setDescription('');
    setDate('');
    setDurationValue(60);
    setDurationUnit('minutes');
    setRecurringDaily(false);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Eventos</Typography>
        <div className={styles.form}>
          <TextField select label="Tipo" value={type} onChange={(e) => setType(e.target.value as EventType)}>
            {EVENT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Duração"
            type="number"
            value={durationValue}
            onChange={(e) => setDurationValue(Number(e.target.value))}
            InputProps={{ inputProps: { min: 0 } }}
          />
          <TextField
            select
            label="Unidade"
            value={durationUnit}
            onChange={(e) => setDurationUnit(e.target.value as typeof durationUnit)}
          >
            <MenuItem value="minutes">Minutos</MenuItem>
            <MenuItem value="hours">Horas</MenuItem>
            <MenuItem value="days">Dias</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                checked={recurringDaily}
                onChange={(e) => setRecurringDaily(e.target.checked)}
              />
            }
            label="Recorrente diariamente"
          />
          <Button variant="contained" onClick={handleAdd}>
            Adicionar Evento
          </Button>
        </div>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        <List dense sx={{ mt: 2 }}>
          {events.length === 0 && (
            <ListItem>
              <ListItemText primary="Nenhum evento adicionado." />
            </ListItem>
          )}
          {events.map((ev) => (
            <ListItem key={ev.id} divider>
              <ListItemText
                primary={`${ev.type} - ${ev.date}`}
                secondary={`${formatDurationLabel(ev.minutes)}${ev.recurringDaily ? ' (diário)' : ''}${ev.description ? ` • ${ev.description}` : ''}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="remover" onClick={() => dispatch(removeEvent(ev.id))}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
