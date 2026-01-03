import { useState } from 'react';
import { Alert, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateConfig } from './configSlice';
import type { GlobalConfig } from '../../domain/types';
import styles from './ConfigTab.module.css';

export function ConfigTab() {
  const config = useAppSelector((state) => state.config.value);
  const dispatch = useAppDispatch();

  const [dailyWorkHours, setDailyWorkHours] = useState(config.dailyWorkHours);
  const [storyPointsPerHour, setStoryPointsPerHour] = useState(config.storyPointsPerHour);
  const [countedMemberTypes, setCountedMemberTypes] = useState(config.countedMemberTypes.join(', '));
  const [seniorityFactors, setSeniorityFactors] = useState(JSON.stringify(config.seniorityFactors));
  const [maturityFactors, setMaturityFactors] = useState(JSON.stringify(config.maturityFactors));
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = () => {
    try {
      const seniorityParsed = JSON.parse(seniorityFactors) as Record<string, number>;
      const maturityParsed = JSON.parse(maturityFactors) as Record<string, number>;
      const countedTypes = countedMemberTypes
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      if (Number.isNaN(Number(dailyWorkHours)) || Number(dailyWorkHours) <= 0) {
        setError('Horas diárias devem ser maiores que 0.');
        return;
      }
      if (Number.isNaN(Number(storyPointsPerHour)) || Number(storyPointsPerHour) <= 0) {
        setError('Story points por hora deve ser maior que 0.');
        return;
      }
      const newConfig: GlobalConfig = {
        dailyWorkHours: Number(dailyWorkHours),
        storyPointsPerHour: Number(storyPointsPerHour),
        countedMemberTypes: countedTypes,
        seniorityFactors: seniorityParsed,
        maturityFactors: maturityParsed,
      };
      dispatch(updateConfig(newConfig));
      setError(null);
    } catch (err) {
      setError('JSON inválido para fatores de senioridade/maturidade.');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Configurações</Typography>
        <div className={styles.form}>
          <TextField
            label="Horas diárias"
            type="number"
            value={dailyWorkHours}
            onChange={(e) => setDailyWorkHours(Number(e.target.value))}
          />
          <TextField
            label="Story points por hora"
            type="number"
            value={storyPointsPerHour}
            onChange={(e) => setStoryPointsPerHour(Number(e.target.value))}
          />
          <TextField
            label="Tipos contabilizados (vírgula)"
            value={countedMemberTypes}
            onChange={(e) => setCountedMemberTypes(e.target.value)}
          />
          <TextField
            className={styles.jsonArea}
            label="Fatores de senioridade (JSON)"
            value={seniorityFactors}
            onChange={(e) => setSeniorityFactors(e.target.value)}
            multiline
            minRows={3}
          />
          <TextField
            className={styles.jsonArea}
            label="Fatores de maturidade (JSON)"
            value={maturityFactors}
            onChange={(e) => setMaturityFactors(e.target.value)}
            multiline
            minRows={3}
          />
          <Button variant="contained" onClick={handleUpdate}>Atualizar Configurações</Button>
        </div>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </CardContent>
    </Card>
  );
}
