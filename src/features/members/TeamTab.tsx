import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addMember, removeMember } from './membersSlice';
import { validateMember } from '../../domain/services/validators';
import { computeMemberCapacity, selectWorkingHours } from '../../domain/services/capacityService';
import type { Member } from '../../domain/types';
import styles from './TeamTab.module.css';

const SENIORITIES: Member['seniority'][] = ['Sênior', 'Pleno', 'Júnior'];
const MATURITIES: Member['maturity'][] = ['Plena', 'Mediana', 'Inicial'];

export function TeamTab() {
  const dispatch = useAppDispatch();
  const members = useAppSelector((state) => state.members.items);
  const config = useAppSelector((state) => state.config.value);
  const workingHours = useAppSelector(selectWorkingHours);
  const [name, setName] = useState('');
  const [roleType, setRoleType] = useState('Desenvolvedor');
  const [seniority, setSeniority] = useState<Member['seniority']>('Pleno');
  const [maturity, setMaturity] = useState<Member['maturity']>('Plena');
  const [availabilityPercent, setAvailabilityPercent] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const base = { name, roleType, seniority, maturity, availabilityPercent } as Omit<Member, 'id'>;
    const validation = validateMember(base);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    dispatch(
      addMember({
        id: crypto.randomUUID(),
        ...base,
      }),
    );
    setName('');
    setAvailabilityPercent(100);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Time</Typography>
        <div className={styles.form}>
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Tipo" value={roleType} onChange={(e) => setRoleType(e.target.value)} />
          <TextField select label="Senioridade" value={seniority} onChange={(e) => setSeniority(e.target.value as Member['seniority'])}>
            {SENIORITIES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select label="Maturidade" value={maturity} onChange={(e) => setMaturity(e.target.value as Member['maturity'])}>
            {MATURITIES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
          <TextField
            label="Disponibilidade %"
            type="number"
            value={availabilityPercent}
            onChange={(e) => setAvailabilityPercent(Number(e.target.value))}
          />
          <Button variant="contained" onClick={handleAdd}>Adicionar Membro</Button>
        </div>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        <div className={styles.cards}>
          {members.length === 0 && <Typography variant="body2">Nenhum membro adicionado.</Typography>}
          {members.map((member) => {
            const capacity = computeMemberCapacity(member, workingHours, config);
            return (
              <Card key={member.id} variant="outlined">
                <CardHeader
                  title={member.name}
                  subheader={`${member.roleType} • ${member.seniority} • ${member.maturity}`}
                  action={
                    <IconButton aria-label="remover" onClick={() => dispatch(removeMember(member.id))}>
                      <DeleteIcon />
                    </IconButton>
                  }
                />
                <CardContent>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Stack spacing={0.5} minWidth={160}>
                      <Typography variant="body2">Disponibilidade</Typography>
                      <Typography variant="h6">{member.availabilityPercent}%</Typography>
                    </Stack>
                    <Stack spacing={0.5} minWidth={160}>
                      <Typography variant="body2">Capacidade (SP)</Typography>
                      <Typography variant="h6">{capacity.storyPoints.toFixed(2)}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
