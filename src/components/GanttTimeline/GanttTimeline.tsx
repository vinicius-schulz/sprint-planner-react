import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Stack,
  Typography,
} from '@mui/material';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import { useAppSelector } from '../../app/hooks';
import { selectTaskSchedules } from '../../domain/services/capacityService';
import type { TaskItem } from '../../domain/types';
import styles from './GanttTimeline.module.css';

type ParsedTask = TaskItem & {
  start: Date;
  end: Date;
};

const parseDateTime = (value?: string): Date | null => {
  if (!value) return null;
  const isoLike = value.replace('T', ' ').replace('Z', '').trim();
  const isoMatch = isoLike.match(/^(\d{4})-(\d{2})-(\d{2})\s?(\d{2}:\d{2})?/);
  if (isoMatch) {
    const [, y, m, d, t] = isoMatch;
    return new Date(`${y}-${m}-${d}T${t ?? '00:00'}:00`);
  }
  const brMatch = isoLike.match(/^(\d{2})\/(\d{2})\/(\d{4})\s?(\d{2}:\d{2})?/);
  if (brMatch) {
    const [, d, m, y, t] = brMatch;
    return new Date(`${y}-${m}-${d}T${t ?? '00:00'}:00`);
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const formatShort = (value: Date) => {
  const dd = String(value.getDate()).padStart(2, '0');
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const yyyy = value.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export function GanttTimeline() {
  const { tasks, errors } = useAppSelector(selectTaskSchedules);

  const palette = useMemo(
    () => ['#1976d2', '#9c27b0', '#ef6c00', '#2e7d32', '#d81b60', '#6d4c41', '#00838f', '#5e35b1', '#455a64', '#c2185b'],
    [],
  );

  const parsed = useMemo<ParsedTask[]>(() => {
    return tasks
      .map((t) => {
        const start = parseDateTime(t.computedStartDate);
        const end = parseDateTime(t.computedEndDate);
        if (!start || !end) return null;
        return { ...t, start, end };
      })
      .filter((t): t is ParsedTask => Boolean(t));
  }, [tasks]);

  const { series, colorByAssignee } = useMemo(() => {
    const byAssignee = new Map<string, typeof parsed>();
    parsed.forEach((t) => {
      const key = t.assigneeMemberName || 'Sem responsável';
      if (!byAssignee.has(key)) byAssignee.set(key, []);
      byAssignee.get(key)!.push(t);
    });

    const colorByAssignee = new Map<string, string>();
    [...byAssignee.keys()].forEach((assignee, idx) => {
      colorByAssignee.set(assignee, palette[idx % palette.length]);
    });

    const series = [...byAssignee.entries()].map(([assignee, list]) => ({
      name: assignee,
      data: list.map((task) => ({
        x: `${task.id} · ${task.name}`,
        y: [task.start.getTime(), task.end.getTime()],
        fillColor: colorByAssignee.get(assignee) || '#1976d2',
        task,
      })),
    }));

    return { series, colorByAssignee };
  }, [parsed, palette]);

  const bounds = useMemo(() => {
    if (!parsed.length) return null;
    const minStart = parsed.reduce((min, t) => (t.start < min ? t.start : min), parsed[0].start);
    const maxEnd = parsed.reduce((max, t) => (t.end > max ? t.end : max), parsed[0].end);
    return { minStart, maxEnd };
  }, [parsed]);

  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: 'rangeBar',
      toolbar: { show: true },
      animations: { enabled: true },
      zoom: { enabled: true },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        rangeBarGroupRows: true,
      },
    },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false },
    },
    dataLabels: {
      enabled: true,
      formatter: (_, opts) => {
        const task = (opts.w.config.series?.[opts.seriesIndex]?.data?.[opts.dataPointIndex] as { task: TaskItem } | undefined)?.task;
        return task ? `${task.id}` : '';
      },
      style: { colors: ['#fff'] },
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const point = w.config.series?.[seriesIndex]?.data?.[dataPointIndex] as { task: TaskItem } | undefined;
        if (!point?.task) return '';
        const deps = (point.task.dependencies || []).join(', ') || 'Sem dependências';
        const owner = point.task.assigneeMemberName || 'Sem responsável';
        return `
          <div class="gantt-task-details" style="padding:8px;">
            <strong>${point.task.id} · ${point.task.name}</strong>
            <div>Responsável: ${owner}</div>
            <div>Deps: ${deps}</div>
            <div>SP: ${point.task.storyPoints}</div>
          </div>
        `;
      },
    },
    legend: { show: false },
    grid: { borderColor: '#e0e0e0' },
    theme: { mode: 'light' },
  }), []);

  return (
    <Accordion defaultExpanded={false} sx={{ mt: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">Cronograma da Sprint (Gantt)</Typography>
          <Typography variant="body2" color="text.secondary">
            Visão por responsável, datas e dependências
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <div className={styles.wrapper}>
          {errors.length > 0 && (
            <Alert severity="warning">Cronograma contém avisos: {errors.join(' | ')}</Alert>
          )}
          {bounds && (
            <div className={styles.meta}>
              <span>Início: {formatShort(bounds.minStart)}</span>
              <span>Fim: {formatShort(bounds.maxEnd)}</span>
              <span>Total: {Math.round((bounds.maxEnd.getTime() - bounds.minStart.getTime()) / 86_400_000)} dias</span>
            </div>
          )}
          <div className={styles.legend}>
            {[...colorByAssignee.entries()].map(([assignee, color]) => (
              <span key={assignee} className={styles.legendItem}>
                <span className={styles.legendSwatch} style={{ background: color }} /> {assignee}
              </span>
            ))}
          </div>
          <div className={styles.timeline}>
            {series.length === 0 ? (
              <div className={styles.empty}>Nenhuma tarefa computada para a sprint.</div>
            ) : (
              <Chart
                options={options}
                series={series}
                type="rangeBar"
                height={360}
              />
            )}
          </div>
        </div>
      </AccordionDetails>
    </Accordion>
  );
}
