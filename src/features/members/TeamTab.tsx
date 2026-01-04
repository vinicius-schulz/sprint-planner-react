import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addMember, removeMember, updateMember } from './membersSlice';
import { renameAssignee } from '../tasks/tasksSlice';
import { validateMember } from '../../domain/services/validators';
import { computeMemberCapacity, selectWorkingCalendar, selectWorkingHours } from '../../domain/services/capacityService';
import { computeDayHours } from '../../domain/services/workingCalendar';
import type { Member, MemberEvent } from '../../domain/types';
import styles from './TeamTab.module.css';

const SENIORITIES: Member['seniority'][] = ['Sênior', 'Pleno', 'Júnior'];
const MATURITIES: Member['maturity'][] = ['Plena', 'Mediana', 'Inicial'];

export function TeamTab() {
  const dispatch = useAppDispatch();
  const members = useAppSelector((state) => state.members.items);
  const config = useAppSelector((state) => state.config.value);
  const calendar = useAppSelector((state) => state.calendar);
  const workingCalendar = useAppSelector(selectWorkingCalendar);
  const workingHours = useAppSelector(selectWorkingHours);
  const [name, setName] = useState('');
  const [roleType, setRoleType] = useState('Desenvolvedor');
  const [seniority, setSeniority] = useState<Member['seniority']>('Pleno');
  const [maturity, setMaturity] = useState<Member['maturity']>('Plena');
  const [availabilityPercent, setAvailabilityPercent] = useState(100);
  const [useAdvancedAvailability, setUseAdvancedAvailability] = useState(false);
  const [memberEvents, setMemberEvents] = useState<MemberEvent[]>([]);
  const [eventDraft, setEventDraft] = useState<MemberEvent>({
    id: crypto.randomUUID(),
    minutes: 0,
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOriginalName, setEditingOriginalName] = useState<string>('');

  const createBlankEvent = (): MemberEvent => ({
    id: crypto.randomUUID(),
    minutes: 0,
    description: '',
  });

  const normalizedEvents = memberEvents.filter((ev) => Number.isFinite(ev.minutes) && ev.minutes > 0);

  const derivedAvailabilityPercent = useAdvancedAvailability
    ? (() => {
        const baseMinutes = Math.max(0, Math.round(workingHours * 60)); // workingHours já desconta eventos da sprint
        if (baseMinutes === 0) return 100;
        const blocked = normalizedEvents.reduce((acc, ev) => acc + (ev.minutes ?? 0), 0);
        const percent = ((baseMinutes - Math.min(blocked, baseMinutes)) / baseMinutes) * 100;
        return Math.max(0, Math.min(100, Math.round(percent)));
      })()
    : availabilityPercent;

  const handleToggleAdvanced = (checked: boolean) => {
    setUseAdvancedAvailability(checked);
    if (!checked) return;
    if (memberEvents.length === 0) {
      setMemberEvents([]);
    }
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setEditingOriginalName(member.name);
    setName(member.name);
    setRoleType(member.roleType);
    setSeniority(member.seniority);
    setMaturity(member.maturity);
    setAvailabilityPercent(member.availabilityPercent);
    const advanced = !!member.useAdvancedAvailability;
    setUseAdvancedAvailability(advanced);
    setMemberEvents(member.availabilityEvents ?? []);
    setEventDraft(createBlankEvent());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingOriginalName('');
    setName('');
    setRoleType('Desenvolvedor');
    setSeniority('Pleno');
    setMaturity('Plena');
    setAvailabilityPercent(100);
    setUseAdvancedAvailability(false);
    setMemberEvents([]);
    setEventDraft(createBlankEvent());
    setError(null);
  };

  const handleDraftChange = (field: keyof MemberEvent, value: string) => {
    setEventDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitDraft = () => {
    if (!Number.isFinite(eventDraft.minutes) || eventDraft.minutes <= 0) {
      setError('Informe a duração (minutos) maior que zero.');
      return;
    }
    setError(null);
    setMemberEvents((prev) => [...prev, { ...eventDraft, id: crypto.randomUUID() }]);
    setEventDraft(createBlankEvent());
  };

  const handleRemoveEventChip = (id: string) => {
    setMemberEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const toggleExpandedEvents = (memberId: string) => {
    setExpandedEvents((prev) => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const handleAdd = () => {
    const finalAvailabilityPercent = useAdvancedAvailability ? derivedAvailabilityPercent : availabilityPercent;
    const base: Omit<Member, 'id'> = {
      name,
      roleType,
      seniority,
      maturity,
      availabilityPercent: finalAvailabilityPercent,
      ...(useAdvancedAvailability ? { useAdvancedAvailability: true, availabilityEvents: normalizedEvents } : {}),
    };
    const validation = validateMember(base);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    if (editingId) {
      const oldName = editingOriginalName;
      const newName = name;
      dispatch(
        updateMember({
          id: editingId,
          ...base,
        }),
      );
      if (oldName && oldName !== newName) {
        dispatch(renameAssignee({ oldName, newName }));
      }
    } else {
      dispatch(
        addMember({
          id: crypto.randomUUID(),
          ...base,
        }),
      );
    }
    cancelEdit();
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
          <FormControlLabel
            control={<Switch checked={useAdvancedAvailability} onChange={(e) => handleToggleAdvanced(e.target.checked)} />}
            label="Disponibilidade avançada"
          />
          {!useAdvancedAvailability && (
            <TextField
              label="Disponibilidade %"
              type="number"
              value={availabilityPercent}
              onChange={(e) => setAvailabilityPercent(Number(e.target.value))}
            />
          )}
          {useAdvancedAvailability && (
            <div className={styles.advancedSection}>
              <div className={styles.advancedHeader}>
                <div>
                  <Typography variant="body2">Disponibilidade calculada</Typography>
                  <Typography variant="h6">{derivedAvailabilityPercent}%</Typography>
                </div>
              </div>
              <Divider />
              <div className={styles.eventInputRow}>
                <TextField
                  label="Duração (minutos)"
                  type="number"
                  value={eventDraft.minutes}
                  onChange={(e) => handleDraftChange('minutes', Number(e.target.value))}
                />
                <TextField
                  label="Descrição"
                  value={eventDraft.description ?? ''}
                  onChange={(e) => handleDraftChange('description', e.target.value)}
                />
                <Button variant="outlined" onClick={handleSubmitDraft}>Adicionar</Button>
              </div>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {memberEvents.map((ev) => (
                  <Chip
                    key={ev.id}
                    label={`${ev.minutes} min${ev.description ? ` • ${ev.description}` : ''}`}
                    onDelete={() => handleRemoveEventChip(ev.id)}
                  />
                ))}
                {memberEvents.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum evento adicionado. Preencha os campos e clique em Adicionar.
                  </Typography>
                )}
              </Stack>
            </div>
          )}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="contained" onClick={handleAdd}>{editingId ? 'Salvar alterações' : 'Adicionar Membro'}</Button>
            {editingId && (
              <Button variant="text" onClick={cancelEdit}>Cancelar</Button>
            )}
          </Stack>
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
                    <Stack direction="row" spacing={0.5}>
                      <IconButton aria-label="editar" onClick={() => startEdit(member)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton aria-label="remover" onClick={() => dispatch(removeMember(member.id))}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  }
                />
                <CardContent>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Stack spacing={0.5} minWidth={160}>
                      <Typography variant="body2">
                        {member.useAdvancedAvailability ? 'Disponibilidade (avançada)' : 'Disponibilidade'}
                      </Typography>
                      <Typography variant="h6">{member.availabilityPercent}%</Typography>
                      {member.useAdvancedAvailability && (
                        <Typography variant="caption" color="text.secondary">
                          {member.availabilityEvents?.length ?? 0} evento(s)
                        </Typography>
                      )}
                    </Stack>
                    <Stack spacing={0.5} minWidth={160}>
                      <Typography variant="body2">Capacidade (SP)</Typography>
                      <Typography variant="h6">{capacity.storyPoints.toFixed(2)}</Typography>
                    </Stack>
                  </Stack>
                  {member.useAdvancedAvailability && (member.availabilityEvents?.length ?? 0) > 0 && (
                    <div className={styles.cardEvents}>
                      <Button size="small" onClick={() => toggleExpandedEvents(member.id)}>
                        {expandedEvents[member.id] ? 'Ocultar eventos' : 'Ver eventos'}
                      </Button>
                      <Collapse in={expandedEvents[member.id]} timeout="auto" unmountOnExit>
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          {member.availabilityEvents?.map((ev) => (
                            <Typography key={ev.id} variant="body2" color="text.secondary">
                              {ev.minutes} min{ev.description ? ` • ${ev.description}` : ''}
                            </Typography>
                          ))}
                        </Stack>
                      </Collapse>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
