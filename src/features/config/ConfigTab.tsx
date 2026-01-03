import { useState } from 'react';
import { Alert, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateConfig } from './configSlice';
import type { GlobalConfig } from '../../domain/types';
import { DEFAULT_CONFIG } from '../../domain/constants';
import styles from './ConfigTab.module.css';

export function ConfigTab() {
  const config = useAppSelector((state) => state.config.value);
  const dispatch = useAppDispatch();

  const storyPointScaleSource = config.storyPointScale?.length ? config.storyPointScale : DEFAULT_CONFIG.storyPointScale;
  const countedTypesSource = config.countedMemberTypes ?? DEFAULT_CONFIG.countedMemberTypes;

  const [dailyWorkHours, setDailyWorkHours] = useState(config.dailyWorkHours ?? DEFAULT_CONFIG.dailyWorkHours);
  const [storyPointsPerHour, setStoryPointsPerHour] = useState(config.storyPointsPerHour ?? DEFAULT_CONFIG.storyPointsPerHour);
  const [countedMemberTypes, setCountedMemberTypes] = useState(countedTypesSource.join(', '));
  const [seniorityFactors, setSeniorityFactors] = useState(JSON.stringify(config.seniorityFactors ?? DEFAULT_CONFIG.seniorityFactors));
  const [maturityFactors, setMaturityFactors] = useState(JSON.stringify(config.maturityFactors ?? DEFAULT_CONFIG.maturityFactors));
  const [storyPointScale, setStoryPointScale] = useState(storyPointScaleSource.join(', '));
  const [workloadWarningOver, setWorkloadWarningOver] = useState((config.workloadWarningOver ?? DEFAULT_CONFIG.workloadWarningOver) * 100);
  const [workloadErrorOver, setWorkloadErrorOver] = useState((config.workloadErrorOver ?? DEFAULT_CONFIG.workloadErrorOver) * 100);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = () => {
    try {
      const seniorityParsed = JSON.parse(seniorityFactors) as Record<string, number>;
      const maturityParsed = JSON.parse(maturityFactors) as Record<string, number>;
      const countedTypes = countedMemberTypes
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      const spScale = storyPointScale
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v >= 0);
      if (spScale.length === 0) {
        setError('Escala de Story Points não pode ser vazia.');
        return;
      }
      if (Number.isNaN(Number(dailyWorkHours)) || Number(dailyWorkHours) <= 0) {
        setError('Horas diárias devem ser maiores que 0.');
        return;
      }
      if (Number.isNaN(Number(storyPointsPerHour)) || Number(storyPointsPerHour) <= 0) {
        setError('Story points por hora deve ser maior que 0.');
        return;
      }
      const warnOver = Number(workloadWarningOver) / 100;
      const errOver = Number(workloadErrorOver) / 100;
      if (warnOver < 0 || errOver < 0) {
        setError('Limites de sobrecarga devem ser não negativos.');
        return;
      }
      const newConfig: GlobalConfig = {
        dailyWorkHours: Number(dailyWorkHours),
        storyPointsPerHour: Number(storyPointsPerHour),
        countedMemberTypes: countedTypes,
        seniorityFactors: seniorityParsed,
        maturityFactors: maturityParsed,
        storyPointScale: spScale,
        workloadWarningOver: warnOver,
        workloadErrorOver: errOver,
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
            label="Escala de Story Points (vírgula)"
            value={storyPointScale}
            onChange={(e) => setStoryPointScale(e.target.value)}
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
          <TextField
            label="Aviso de sobrecarga (%)"
            type="number"
            value={workloadWarningOver}
            onChange={(e) => setWorkloadWarningOver(Number(e.target.value))}
            helperText="Ex.: 10 significa até 10% acima fica amarelo"
          />
          <TextField
            label="Erro de sobrecarga (%)"
            type="number"
            value={workloadErrorOver}
            onChange={(e) => setWorkloadErrorOver(Number(e.target.value))}
            helperText="Acima deste limite fica vermelho"
          />
          <Button variant="contained" onClick={handleUpdate}>Atualizar Configurações</Button>
        </div>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </CardContent>
    </Card>
  );
}
