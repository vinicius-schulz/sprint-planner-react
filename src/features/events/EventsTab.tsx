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
  const [type, setType] = useState<EventType>('Planning');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [minutes, setMinutes] = useState(60);
  const [recurringDaily, setRecurringDaily] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const base = { type, description, date, minutes: Number(minutes), recurringDaily } as const;
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
    setMinutes(60);
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
            label="Minutos"
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
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
                secondary={`${ev.minutes} min${ev.recurringDaily ? ' (diário)' : ''}${ev.description ? ` • ${ev.description}` : ''}`}
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
