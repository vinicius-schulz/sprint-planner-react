import { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addTask, removeTask, setComputedTasks } from './tasksSlice';
import { validateTask } from '../../domain/services/validators';
import { computeTaskSchedules, buildWorkingCalendar, selectTeamCapacity } from '../../domain/services/capacityService';
import type { TaskItem } from '../../domain/types';
import { DEFAULT_CONFIG } from '../../domain/constants';
import styles from './TasksTab.module.css';

const generateTaskId = () => Math.random().toString(36).slice(2, 6).toUpperCase();

export function TasksTab() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.items);
  const members = useAppSelector((state) => state.members.items);
  const sprint = useAppSelector((state) => state.sprint);
  const calendar = useAppSelector((state) => state.calendar);
  const config = useAppSelector((state) => state.config.value);
  const teamCapacity = useAppSelector(selectTeamCapacity);

  const storyPointScale = config.storyPointScale?.length ? config.storyPointScale : DEFAULT_CONFIG.storyPointScale;

  const [name, setName] = useState('');
  const [assigneeMemberName, setAssigneeMemberName] = useState('');
  const [storyPoints, setStoryPoints] = useState(storyPointScale[0] ?? 1);
  const [dependenciesText, setDependenciesText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [calcErrors, setCalcErrors] = useState<string[]>([]);

  const workingCalendar = useMemo(() => buildWorkingCalendar(sprint, calendar), [sprint, calendar]);

  useEffect(() => {
    setStoryPoints(storyPointScale[0] ?? 1);
  }, [storyPointScale]);

  const handleAdd = () => {
    const dependencies = dependenciesText
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    const base: Omit<TaskItem, 'computedEndDate' | 'computedStartDate'> = {
      id: generateTaskId(),
      name,
      assigneeMemberName: assigneeMemberName || undefined,
      storyPoints: Number(storyPoints),
      dependencies,
    };
    const validation = validateTask(base, tasks);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    dispatch(addTask({ ...base }));
    setName('');
    setAssigneeMemberName('');
    setStoryPoints(storyPointScale[0] ?? 1);
    setDependenciesText('');
  };

  const handleCalculate = () => {
    const result = computeTaskSchedules(tasks, sprint, workingCalendar.workingDays, config);
    setCalcErrors(result.errors);
    if (result.errors.length === 0) {
      dispatch(setComputedTasks(result.tasks));
    }
  };

  const capacityByMember = useMemo(() => {
    const map = new Map<string, number>();
    teamCapacity.members.forEach((mc) => map.set(mc.member.name, mc.storyPoints));
    return map;
  }, [teamCapacity]);

  const getRowClass = (task: TaskItem, runningTotals: Map<string, number>) => {
    const memberName = task.assigneeMemberName;
    if (!memberName) return styles.statusGreen;
    const capacity = capacityByMember.get(memberName) ?? 0;
    const currentTotal = (runningTotals.get(memberName) ?? 0) + task.storyPoints;
    runningTotals.set(memberName, currentTotal);
    if (capacity <= 0 && currentTotal > 0) return styles.statusRed;
    const ratio = currentTotal / capacity;
    if (ratio <= 1) return styles.statusGreen;
    const warnLimit = 1 + config.workloadWarningOver;
    const errLimit = 1 + config.workloadErrorOver;
    const threshold = Math.max(warnLimit, errLimit);
    if (ratio <= warnLimit) return styles.statusYellow;
    if (ratio <= threshold) return styles.statusRed;
    return styles.statusRed;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Tarefas</Typography>
        <div className={styles.form}>
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            select
            label="Responsável"
            value={assigneeMemberName}
            onChange={(e) => setAssigneeMemberName(e.target.value)}
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
            onChange={(e) => setStoryPoints(Number(e.target.value))}
          >
            {storyPointScale.map((sp) => (
              <MenuItem key={sp} value={sp}>{sp}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Dependências (IDs, separado por vírgula)"
            value={dependenciesText}
            onChange={(e) => setDependenciesText(e.target.value)}
          />
          <Button variant="contained" onClick={handleAdd}>Adicionar Tarefa</Button>
          <Button variant="outlined" onClick={handleCalculate}>Calcular Datas</Button>
        </div>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        {calcErrors.map((err) => (
          <Alert key={err} severity="error" sx={{ mt: 1 }}>{err}</Alert>
        ))}
        <div className={styles.list}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>SP</TableCell>
                <TableCell>Início</TableCell>
                <TableCell>Fim</TableCell>
                <TableCell>Dependências</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>Nenhuma tarefa cadastrada.</TableCell>
                </TableRow>
              )}
              {(() => {
                const runningTotals = new Map<string, number>();
                return tasks.map((task) => {
                  const rowClass = getRowClass(task, runningTotals);
                  return (
                    <TableRow key={task.id} hover className={rowClass}>
                      <TableCell>{task.id}</TableCell>
                      <TableCell>{task.name}</TableCell>
                      <TableCell>{task.storyPoints}</TableCell>
                      <TableCell>{task.computedStartDate || '-'}</TableCell>
                      <TableCell>{task.computedEndDate || '-'}</TableCell>
                      <TableCell>{task.dependencies.join(', ') || '-'}</TableCell>
                      <TableCell>{task.assigneeMemberName || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton aria-label="remover" onClick={() => dispatch(removeTask(task.id))}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
