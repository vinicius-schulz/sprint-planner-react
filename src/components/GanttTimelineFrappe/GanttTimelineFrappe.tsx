import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Stack,
  Typography,
} from '@mui/material';
import Gantt from 'frappe-gantt';
import './frappe-gantt.css';
import { useEffect, useMemo, useRef } from 'react';
import { useAppSelector } from '../../app/hooks';
import { selectTaskSchedules } from '../../domain/services/capacityService';
import type { TaskItem } from '../../domain/types';
import styles from './GanttTimelineFrappe.module.css';

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

const formatISODate = (value: Date) => {
  const dd = String(value.getDate()).padStart(2, '0');
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const yyyy = value.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};

export function GanttTimelineFrappe() {
  const { tasks, errors } = useAppSelector(selectTaskSchedules);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const { ganttData, colorByAssignee, bounds, styleText } = useMemo(() => {
    if (!parsed.length) return { ganttData: [], colorByAssignee: new Map<string, string>(), bounds: null as null, styleText: '' };

    const byAssignee = new Map<string, ParsedTask[]>();
    parsed.forEach((t) => {
      const key = t.assigneeMemberName || 'Sem responsável';
      if (!byAssignee.has(key)) byAssignee.set(key, []);
      byAssignee.get(key)!.push(t);
    });

    const colorByAssignee = new Map<string, string>();
    const assigneeIndex = new Map<string, number>();
    [...byAssignee.keys()].forEach((assignee, idx) => {
      colorByAssignee.set(assignee, palette[idx % palette.length]);
      assigneeIndex.set(assignee, idx);
    });

    const ganttData = parsed.map((task) => {
      const assignee = task.assigneeMemberName || 'Sem responsável';
      const colorClass = `assignee-${assigneeIndex.get(assignee) ?? 0}`;
      return {
        id: task.id,
        name: `${task.id} · ${task.name}`,
        start: task.start.toISOString().slice(0, 10),
        end: task.end.toISOString().slice(0, 10),
        progress: 100,
        dependencies: (task.dependencies || []).join(',') || undefined,
        custom_class: colorClass,
        meta: task,
      };
    });

    const minStart = parsed.reduce((min, t) => (t.start < min ? t.start : min), parsed[0].start);
    const maxEnd = parsed.reduce((max, t) => (t.end > max ? t.end : max), parsed[0].end);

    const styleText = [...colorByAssignee.entries()]
      .map(([, color], idx) => (
        [
          `.assignee-${idx} .bar { fill: ${color}; stroke: ${color}; }`,
          `.assignee-${idx} .bar-progress { fill: ${color}; stroke: ${color}; }`,
          `.assignee-${idx} .bar-label { fill: #fff; }`,
        ].join('\n')
      ))
      .join('\n');

    return { ganttData, colorByAssignee, bounds: { minStart, maxEnd }, styleText };
  }, [parsed, palette]);

  const todayIso = useMemo(() => formatISODate(new Date()), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    if (!ganttData.length) return;

    const styleEl = document.createElement('style');
    styleEl.textContent = styleText;
    container.appendChild(styleEl);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gantt: any = new (Gantt as any)(container, ganttData, {
        view_mode: 'Day',
        scroll_to: todayIso,
        language: 'pt-br',
        column_width: 90,
        custom_popup_html: (task: { meta: ParsedTask }) => {
          const deps = (task.meta.dependencies || []).join(', ') || 'Sem dependências';
          const owner = task.meta.assigneeMemberName || 'Sem responsável';
          const start = task.meta.start ? formatShort(task.meta.start) : '-';
          const end = task.meta.end ? formatShort(task.meta.end) : '-';
          const duration = task.meta.start && task.meta.end
            ? Math.max(1, Math.round((task.meta.end.getTime() - task.meta.start.getTime()) / 86_400_000))
            : null;
          return `
            <div class="gantt-task-details">
              <strong>${task.meta.id} · ${task.meta.name}</strong>
              <div>Responsável: ${owner}</div>
              <div>Início: ${start}</div>
              <div>Fim: ${end}</div>
              <div>Duração: ${duration ?? '-'} dias</div>
              <div>Deps: ${deps}</div>
              <div>SP: ${task.meta.storyPoints}</div>
            </div>
          `;
        },
      });

      return () => {
        if (container) container.innerHTML = '';
        if (gantt && typeof gantt.refresh === 'function') {
          gantt.refresh([]);
        }
      };
    } catch (err) {
      console.error('Erro ao renderizar Frappe Gantt', err);
      container.innerHTML = '<div style="padding:8px; color:#b00020;">Erro ao renderizar gráfico.</div>';
      return () => { container.innerHTML = ''; };
    }
  }, [ganttData, styleText, todayIso]);

  return (
    <Accordion defaultExpanded={false} sx={{ mt: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">Cronograma (Frappe Gantt)</Typography>
          <Typography variant="body2" color="text.secondary">Com linhas de dependência</Typography>
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
            {[...colorByAssignee.entries()].map(([assignee, color], idx) => (
              <span key={assignee} className={styles.legendItem}>
                <span className={styles.legendSwatch} style={{ background: color }} />
                {assignee} ({idx + 1})
              </span>
            ))}
          </div>
          <div className={styles.timeline}>
            {ganttData.length === 0 ? (
              <div className={styles.empty}>Nenhuma tarefa computada para a sprint.</div>
            ) : (
              <div ref={containerRef} />
            )}
          </div>
        </div>
      </AccordionDetails>
    </Accordion>
  );
}
