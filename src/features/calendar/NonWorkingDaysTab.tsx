import { useState } from 'react';
import { Button, Card, CardContent, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, TextField, Typography, Alert, Chip, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  addManualNonWorkingDay,
  removeManualNonWorkingDay,
  addRemovedWeekend,
} from './calendarSlice';
import { selectWorkingCalendar } from '../../domain/services/capacityService';
import { validateManualDay } from '../../domain/services/validators';
import { isWeekend, toDate } from '../../domain/services/dateUtils';
import styles from './NonWorkingDaysTab.module.css';

export function NonWorkingDaysTab() {
  const dispatch = useAppDispatch();
  const calendar = useAppSelector((state) => state.calendar);
  const calendarResult = useAppSelector(selectWorkingCalendar);
  const [manualDate, setManualDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const validation = validateManualDay(manualDate, calendar);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    dispatch(addManualNonWorkingDay(manualDate));
    setManualDate('');
  };

  const handleRemove = (date: string) => {
    if (calendar.nonWorkingDaysManual.includes(date)) {
      dispatch(removeManualNonWorkingDay(date));
      return;
    }
    dispatch(addRemovedWeekend(date));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Dias Não Úteis</Typography>
        <div className={styles.row}>
          <TextField
            label="Adicionar data (não útil)"
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={handleAdd}>
            Adicionar
          </Button>
        </div>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        <div className={styles.list}>
          <Typography variant="subtitle1">Lista de dias não úteis</Typography>
          <List dense>
            {calendarResult.nonWorkingDays.length === 0 && (
              <ListItem>
                <ListItemText primary="Nenhum dia não útil no período." />
              </ListItem>
            )}
            {calendarResult.nonWorkingDays.map((date) => {
              const dateObj = toDate(date);
              const weekend = dateObj ? isWeekend(dateObj) : false;
              const isManual = calendar.nonWorkingDaysManual.includes(date);
              return (
                <ListItem key={date} divider>
                  <ListItemText
                    primary={date}
                    secondary={isManual ? 'Adicionado manualmente' : weekend ? 'Fim de semana' : ''}
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {calendar.nonWorkingDaysRemoved.includes(date) && (
                        <Chip label="Removido" color="success" size="small" />
                      )}
                      <IconButton edge="end" aria-label="remover" onClick={() => handleRemove(date)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </div>
      </CardContent>
    </Card>
  );
}
