import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { RootPersistedState, PlanningLifecycleState } from '../../domain/types';
import { buildWorkingCalendar, computeTeamCapacity, computeWorkingHours } from '../../domain/services/capacityService';
import { formatHoursToClock } from '../../domain/services/timeFormat';
import {
  getSprintState,
  listSprintSummaries,
} from '../../app/sprintLibrary';
import type { ProjectMeta, StoredSprintMeta } from '../../app/sprintLibrary';
import styles from './ProjectDashboard.module.css';

type ProjectDashboardProps = {
  projects: ProjectMeta[];
  selectedProjectId: 'all' | string;
  onSelectProject: (id: 'all' | string) => void;
};

type SprintWithState = {
  meta: StoredSprintMeta;
  state: RootPersistedState;
};

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '-');

const toLocalISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTime = (time?: string, fallback = '23:59:59') => {
  if (!time) return fallback;
  return time.length === 5 ? `${time}:00` : time;
};

const parseDueDate = (value: string) => {
  if (!value) return null;
  const trimmed = value.trim();

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s(\d{2}:\d{2})(?::\d{2})?)?/);
  if (brMatch) {
    const [, day, month, year, time] = brMatch;
    const normalized = `${year}-${month}-${day}T${normalizeTime(time)}`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2})(?::\d{2})?)?/);
  if (isoMatch) {
    const [, year, month, day, time] = isoMatch;
    const normalized = `${year}-${month}-${day}T${normalizeTime(time)}`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDueDate = (value?: string) => {
  if (!value) return '-';
  const parsed = parseDueDate(value);
  return parsed ? parsed.toLocaleDateString('pt-BR') : value;
};

const projectStatusLabel = (status: ProjectMeta['status']) => (
  status === 'archived' ? 'Arquivado' : status === 'draft' ? 'Rascunho' : 'Ativo'
);

const projectStatusColor = (status: ProjectMeta['status']) => (
  status === 'archived' ? 'default' : status === 'draft' ? 'warning' : 'success'
);

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  children?: ReactNode;
  valueColor?: 'text.primary' | 'error' | 'warning' | 'info' | 'success';
};

const MetricCard = ({ label, value, hint, children, valueColor = 'text.primary' }: MetricCardProps) => (
  <Paper elevation={1} className={styles.metricCard}>
    <Typography variant="subtitle2">{label}</Typography>
    <Typography variant="h5" color={valueColor}>{value}</Typography>
    {hint && <Typography variant="body2" color="text.secondary">{hint}</Typography>}
    {children}
  </Paper>
);

export function ProjectDashboard({
  projects,
  selectedProjectId,
  onSelectProject,
}: ProjectDashboardProps) {
  const isAllProjects = selectedProjectId === 'all';
  const selectedProject = isAllProjects ? undefined : projects.find((project) => project.id === selectedProjectId);
  const hasProjects = projects.length > 0;
  const resolvedProject = selectedProject ?? projects[0]!;

  const sprintSummaries = useMemo(
    () => {
      const sourceProjects = isAllProjects ? projects : projects.filter((project) => project.id === selectedProjectId);
      return sourceProjects
        .flatMap((project) => listSprintSummaries(project.id))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    [projects, selectedProjectId, isAllProjects],
  );

  const sprintsWithState = useMemo(() => (
    sprintSummaries
      .map((meta) => ({ meta, state: getSprintState(meta.id) }))
      .filter((entry): entry is SprintWithState => Boolean(entry.state))
  ), [sprintSummaries]);

  const statusCounts = useMemo(() => sprintSummaries.reduce(
    (acc, sprint) => {
      acc[sprint.status] += 1;
      return acc;
    },
    { editing: 0, followup: 0, closed: 0 } as Record<PlanningLifecycleState['status'], number>,
  ), [sprintSummaries]);

  const aggregates = useMemo(() => {
    const now = new Date();
    const todayISO = toLocalISODate(now);
    const memberNames = new Set<string>();
    let totalTasks = 0;
    let tasksDone = 0;
    let tasksDoing = 0;
    let tasksTodo = 0;
    let totalStoryPoints = 0;
    let doneStoryPoints = 0;
    let eventsCount = 0;
    let workingHoursTotal = 0;
    let workingDaysTotal = 0;
    let capacityStoryPoints = 0;
    let dueTodayCount = 0;
    let noDueDateCount = 0;
    let overdueStoryPoints = 0;
    const overdueTasks: Array<{ id: string; name: string; dueDate: string; assignee?: string }> = [];

    sprintsWithState.forEach(({ state }) => {
      state.members.items.forEach((member) => memberNames.add(member.name));
      eventsCount += state.events.items.length;

      const workingCalendar = buildWorkingCalendar(state.sprint, state.calendar);
      workingDaysTotal += workingCalendar.workingDays.length;
      const workingHours = computeWorkingHours(
        state.config.value,
        workingCalendar.workingDays,
        state.events.items,
        state.calendar,
      );
      workingHoursTotal += workingHours;

      const capacity = computeTeamCapacity(state.members.items, workingHours, state.config.value);
      capacityStoryPoints += capacity.totalStoryPoints;

      state.tasks.items.forEach((task) => {
        totalTasks += 1;
        const status = task.status ?? 'todo';
        if (status === 'done') tasksDone += 1;
        else if (status === 'doing') tasksDoing += 1;
        else tasksTodo += 1;

        const sp = task.storyPoints || 0;
        totalStoryPoints += sp;
        if (status === 'done') {
          doneStoryPoints += sp;
        }

        if (status !== 'done') {
          const dueReference = task.dueDate || task.computedEndDate;
          if (!dueReference) {
            noDueDateCount += 1;
          } else {
            const dueDateValue = parseDueDate(dueReference);
            if (!dueDateValue) {
              noDueDateCount += 1;
            } else if (dueDateValue.getTime() < now.getTime()) {
              overdueTasks.push({
                id: task.id,
                name: task.name,
                dueDate: dueReference,
                assignee: task.assigneeMemberName,
              });
              overdueStoryPoints += sp;
            } else if (toLocalISODate(dueDateValue) === todayISO) {
              dueTodayCount += 1;
            }
          }
        }
      });
    });

    overdueTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return {
      membersCount: memberNames.size,
      totalTasks,
      tasksDone,
      tasksDoing,
      tasksTodo,
      totalStoryPoints,
      doneStoryPoints,
      eventsCount,
      workingHoursTotal,
      workingDaysTotal,
      capacityStoryPoints,
      overdueTasks,
      overdueStoryPoints,
      dueTodayCount,
      noDueDateCount,
    };
  }, [sprintsWithState]);

  const projectStatusCounts = useMemo(() => projects.reduce(
    (acc, project) => {
      acc[project.status] += 1;
      return acc;
    },
    { active: 0, archived: 0, draft: 0 } as Record<ProjectMeta['status'], number>,
  ), [projects]);

  const lastUpdated = sprintSummaries[0]?.updatedAt ?? resolvedProject?.updatedAt;

  const taskProgress = aggregates.totalTasks
    ? Math.round((aggregates.tasksDone / aggregates.totalTasks) * 100)
    : 0;
  const storyProgress = aggregates.totalStoryPoints
    ? Math.round((aggregates.doneStoryPoints / aggregates.totalStoryPoints) * 100)
    : 0;
  const capacityUsage = aggregates.capacityStoryPoints
    ? Math.min(100, Math.round((aggregates.totalStoryPoints / aggregates.capacityStoryPoints) * 100))
    : 0;
  const overdueCount = aggregates.overdueTasks.length;
  const overdueRate = aggregates.totalTasks
    ? Math.round((overdueCount / aggregates.totalTasks) * 100)
    : 0;
  const overduePreview = aggregates.overdueTasks.slice(0, 3);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box className={styles.headerRow}>
            <Box>
              <Typography variant="h6">Dashboard do projeto</Typography>
              <Typography variant="body2" color="text.secondary">
                Selecione um projeto ou "Todos" para ver métricas e indicadores.
              </Typography>
            </Box>
            <FormControl size="small" className={styles.selector}>
              <InputLabel id="project-dashboard-select">Filtro de projeto</InputLabel>
              <Select
                labelId="project-dashboard-select"
                value={selectedProjectId}
                label="Filtro de projeto"
                onChange={(e) => onSelectProject(String(e.target.value))}
                disabled={!projects.length}
              >
                <MenuItem value="all">Todos</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" className={styles.helper}>
                Este filtro só muda o dashboard. Para acessar sprints, abra o projeto.
              </Typography>
            </FormControl>
          </Box>

          {!hasProjects && (
            <Typography variant="body2" color="text.secondary">
              Crie um projeto para exibir o dashboard.
            </Typography>
          )}

          {hasProjects && (
            <>
              <Paper variant="outlined" className={styles.hero}>
                <Stack spacing={1}>
                  {isAllProjects ? (
                    <>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle2">Todos os projetos</Typography>
                        <Chip size="small" label={`${projects.length} projetos`} color="primary" />
                      </Stack>
                      <div className={styles.heroRow}>
                        <Typography variant="h6">Visão consolidada</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Métricas unificadas de todas as sprints.
                        </Typography>
                      </div>
                      <div className={styles.statusRow}>
                        <Chip size="small" label={`Ativos ${projectStatusCounts.active}`} color="success" />
                        <Chip size="small" label={`Rascunho ${projectStatusCounts.draft}`} color="warning" />
                        <Chip size="small" label={`Arquivados ${projectStatusCounts.archived}`} color="default" />
                      </div>
                      <Typography variant="caption" color="text.secondary">
                        Atualizado em {formatDate(lastUpdated)}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle2">Projeto filtrado</Typography>
                        <Chip size="small" label={projectStatusLabel(resolvedProject.status)} color={projectStatusColor(resolvedProject.status)} />
                      </Stack>
                      <div className={styles.heroRow}>
                        <Typography variant="h6">{resolvedProject.name}</Typography>
                        {resolvedProject.startDate || resolvedProject.endDate ? (
                          <Typography variant="body2" color="text.secondary">
                            Período: {formatDate(resolvedProject.startDate)} {resolvedProject.startDate && '-'} {formatDate(resolvedProject.endDate)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">Período não definido</Typography>
                        )}
                      </div>
                      <Typography variant="caption" color="text.secondary">
                        Atualizado em {formatDate(lastUpdated)}
                      </Typography>
                    </>
                  )}
                </Stack>
              </Paper>

              <div className={styles.grid}>
                <MetricCard
                  label="Sprints"
                  value={`${sprintSummaries.length}`}
                  hint={`Última atualização: ${formatDate(sprintSummaries[0]?.updatedAt)}`}
                >
                  <div className={styles.statusRow}>
                    <Chip size="small" label={`Em edição ${statusCounts.editing}`} color="warning" />
                    <Chip size="small" label={`Acompanhamento ${statusCounts.followup}`} color="info" />
                    <Chip size="small" label={`Fechadas ${statusCounts.closed}`} color="success" />
                  </div>
                </MetricCard>

                <MetricCard
                  label="Tarefas"
                  value={`${aggregates.totalTasks}`}
                  hint={`${aggregates.tasksDone} concluídas · ${aggregates.tasksDoing} em progresso · ${aggregates.tasksTodo} a fazer`}
                >
                  <LinearProgress variant="determinate" value={taskProgress} className={styles.progress} />
                  <Typography variant="caption" color="text.secondary">
                    {taskProgress}% concluídas
                  </Typography>
                </MetricCard>

                <MetricCard
                  label="Tarefas atrasadas"
                  value={`${overdueCount}`}
                  hint={`Vencem hoje: ${aggregates.dueTodayCount} · Sem prazo: ${aggregates.noDueDateCount}`}
                  valueColor={overdueCount > 0 ? 'error' : 'text.primary'}
                >
                  {aggregates.totalTasks > 0 && (
                    <>
                      <LinearProgress
                        variant="determinate"
                        value={overdueRate}
                        color={overdueCount > 0 ? 'error' : 'primary'}
                        className={styles.progress}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {overdueRate}% do total
                      </Typography>
                    </>
                  )}
                  {overdueCount > 0 && (
                    <div className={styles.overdueList}>
                      {overduePreview.map((task) => (
                        <Typography key={task.id} variant="caption" color="text.secondary">
                          {task.name || 'Sem título'} · {formatDueDate(task.dueDate)}{task.assignee ? ` · ${task.assignee}` : ''}
                        </Typography>
                      ))}
                      {overdueCount > overduePreview.length && (
                        <Typography variant="caption" color="text.secondary">
                          +{overdueCount - overduePreview.length} outras atrasadas
                        </Typography>
                      )}
                    </div>
                  )}
                </MetricCard>

                <MetricCard
                  label="Story points"
                  value={`${aggregates.totalStoryPoints.toFixed(1)} SP`}
                  hint={`${aggregates.doneStoryPoints.toFixed(1)} SP concluídos`}
                >
                  <LinearProgress variant="determinate" value={storyProgress} className={styles.progress} />
                  <Typography variant="caption" color="text.secondary">
                    {storyProgress}% concluído
                  </Typography>
                </MetricCard>

                <MetricCard
                  label="Capacidade"
                  value={`${formatHoursToClock(aggregates.workingHoursTotal)} horas`}
                  hint={`${aggregates.capacityStoryPoints.toFixed(1)} SP potencial`}
                >
                  <LinearProgress variant="determinate" value={capacityUsage} className={styles.progress} />
                  <Typography variant="caption" color="text.secondary">
                    Planejado vs capacidade ({capacityUsage}%)
                  </Typography>
                </MetricCard>

                <MetricCard
                  label="Equipe e eventos"
                  value={`${aggregates.membersCount} membros`}
                  hint={`${aggregates.eventsCount} eventos · ${aggregates.workingDaysTotal} dias úteis`}
                />
              </div>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
