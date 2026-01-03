import { useMemo, useState } from 'react';
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
import { computeTaskSchedules, buildWorkingCalendar } from '../../domain/services/capacityService';
import type { TaskItem } from '../../domain/types';
import styles from './TasksTab.module.css';

export function TasksTab() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.items);
  const members = useAppSelector((state) => state.members.items);
  const sprint = useAppSelector((state) => state.sprint);
  const calendar = useAppSelector((state) => state.calendar);
  const config = useAppSelector((state) => state.config.value);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [assigneeMemberName, setAssigneeMemberName] = useState('');
  const [storyPoints, setStoryPoints] = useState(1);
  const [dependenciesText, setDependenciesText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [calcErrors, setCalcErrors] = useState<string[]>([]);

  const workingCalendar = useMemo(() => buildWorkingCalendar(sprint, calendar), [sprint, calendar]);

  const handleAdd = () => {
    const dependencies = dependenciesText
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    const base: Omit<TaskItem, 'computedEndDate' | 'computedStartDate'> = {
      id,
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
    setId('');
    setName('');
    setAssigneeMemberName('');
    setStoryPoints(1);
    setDependenciesText('');
  };

  const handleCalculate = () => {
    const result = computeTaskSchedules(tasks, sprint, workingCalendar.workingDays, config);
    setCalcErrors(result.errors);
    if (result.errors.length === 0) {
      dispatch(setComputedTasks(result.tasks));
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Tarefas</Typography>
        <div className={styles.form}>
          <TextField label="ID" value={id} onChange={(e) => setId(e.target.value)} />
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
            label="Story Points"
            type="number"
            value={storyPoints}
            onChange={(e) => setStoryPoints(Number(e.target.value))}
          />
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
              {tasks.map((task) => (
                <TableRow key={task.id} hover>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
