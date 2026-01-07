import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@mui/material';
import { useAppSelector } from '../../app/hooks';
import { selectWorkingCalendar } from '../../domain/services/capacityService';
import { formatMinutesToClock } from '../../domain/services/timeFormat';
import type { TaskItem } from '../../domain/types';
import { AppSnackbar } from '../Toast';
import styles from './ReportExportButton.module.css';

export type ReportExportButtonProps = {
  renderTrigger?: (exportReport: () => void) => ReactNode;
};

const formatDate = (iso?: string) => {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return iso;
};

const formatDateTimeBr = (value?: string) => {
  if (!value) return '-';
  const cleaned = value.replace('T', ' ').replace('Z', '').trim();
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s(\d{2}:\d{2}))?/);
  if (isoMatch) {
    const [, y, m, d, t] = isoMatch;
    return `${d}/${m}/${y} ${t ?? '00:00'}`;
  }
  return cleaned;
};

const formatMinutesToHours = (minutes?: number) => formatMinutesToClock(minutes);

export function ReportExportButton({ renderTrigger }: ReportExportButtonProps) {
  const sprint = useAppSelector((state) => state.sprint);
  const tasks = useAppSelector((state) => state.tasks.items);
  const members = useAppSelector((state) => state.members.items);
  const events = useAppSelector((state) => state.events.items);
  const config = useAppSelector((state) => state.config.value);
  const calendar = useAppSelector((state) => state.calendar);
  const calendarResult = useAppSelector(selectWorkingCalendar);

  const capacitySummary = useMemo(() => {
    const totalSP = tasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
    const byAssignee = new Map<string, number>();
    tasks.forEach((t) => {
      if (!t.assigneeMemberName) return;
      byAssignee.set(t.assigneeMemberName, (byAssignee.get(t.assigneeMemberName) ?? 0) + (t.storyPoints || 0));
    });
    return { totalSP, byAssignee };
  }, [tasks]);

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({ open: false, message: '', severity: 'info' });

  const tasksSorted = useMemo(() => {
    return [...tasks].sort((a, b) => (a.computedStartDate || '').localeCompare(b.computedStartDate || ''));
  }, [tasks]);

  const openToast = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setToast({ open: true, message, severity });
  };

  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  const buildHtml = () => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('pt-BR');
    const rows = tasksSorted.map((t: TaskItem) => {
      const deps = (t.dependencies || []).join(', ');
      const timeline = (t.computedTimeline || [])
        .map((seg) => `${formatDate(seg.date)} ${seg.startTime}-${seg.endTime} (${formatMinutesToHours(seg.minutes)})`) || [];
      return `<tr>
        <td>${t.id}</td>
        <td>${t.name}</td>
        <td>${t.assigneeMemberName || '—'}</td>
        <td>${t.storyPoints}</td>
        <td>${deps || '—'}</td>
        <td>${formatDateTimeBr(t.computedStartDate)}</td>
        <td>${formatDateTimeBr(t.computedEndDate)}</td>
        <td>${timeline.length ? timeline.join('<br/>') : '—'}</td>
      </tr>`;
    }).join('');

    const memberRows = members.map((m) => `<li>${m.name} — ${m.roleType} • ${m.seniority} • ${m.maturity} (${m.availabilityPercent}%)</li>`).join('');
    const eventRows = events.map((ev) => `<li>${ev.type} — ${formatDate(ev.date)} — ${formatMinutesToHours(ev.minutes)}${ev.recurringDaily ? ' (diário)' : ''}${ev.description ? ` • ${ev.description}` : ''}</li>`).join('');

    const workingDays = calendarResult.workingDays.length;
    const nonWorkingDays = calendarResult.nonWorkingDays.length;
    const manualNonWorking = calendar.nonWorkingDaysManual.length;
    const removedWeekend = calendar.nonWorkingDaysRemoved.length;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Relatório da Sprint</title>
<style>
  body { font-family: Arial, sans-serif; padding: 16px; color: #222; }
  h1, h2, h3 { margin: 0 0 8px; }
  .meta { margin-bottom: 12px; }
  .section { margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; vertical-align: top; }
  th { background: #f3f3f3; text-align: left; }
  ul { padding-left: 18px; margin: 4px 0; }
  .badge { display: inline-block; padding: 4px 8px; background: #e0f2f1; border-radius: 6px; font-size: 12px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; }
  .pill { display: inline-block; padding: 4px 8px; background: #eef2ff; border-radius: 999px; margin: 2px; font-size: 12px; }
</style>
</head>
<body>
  <h1>Relatório da Sprint</h1>
  <div class="meta">Gerado em ${todayStr}</div>
  <div class="grid">
    <div><strong>Título:</strong> ${sprint.title || '—'}</div>
    <div><strong>Início:</strong> ${formatDate(sprint.startDate)}</div>
    <div><strong>Fim:</strong> ${formatDate(sprint.endDate)}</div>
    <div><strong>Dias úteis:</strong> ${workingDays}</div>
    <div><strong>Dias não úteis:</strong> ${nonWorkingDays} (manuais: ${manualNonWorking}, removidos: ${removedWeekend})</div>
    <div><strong>Horas diárias:</strong> ${config.dailyWorkHours}</div>
    <div><strong>SP/hora:</strong> ${config.storyPointsPerHour}</div>
  </div>

  <div class="section">
    <h2>Time</h2>
    ${memberRows ? `<ul>${memberRows}</ul>` : '<div class="badge">Sem membros</div>'}
  </div>

  <div class="section">
    <h2>Capacidade x Carga</h2>
    <div class="grid">
      <div><strong>Story Points totais:</strong> ${capacitySummary.totalSP}</div>
      <div><strong>Responsáveis com carga:</strong><br/>${[...capacitySummary.byAssignee.entries()].map(([k, v]) => `<span class="pill">${k}: ${v} SP</span>`).join('') || '—'}</div>
    </div>
  </div>

  <div class="section">
    <h2>Eventos</h2>
    ${eventRows ? `<ul>${eventRows}</ul>` : '<div class="badge">Sem eventos</div>'}
  </div>

  <div class="section">
    <h2>Tarefas e Cronograma</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Responsável</th>
          <th>SP</th>
          <th>Dependências</th>
          <th>Início</th>
          <th>Fim</th>
          <th>Timeline</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="8" style="text-align:center;">Sem tarefas</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  };

  const handleExport = () => {
    try {
      const html = buildHtml();
      const printWindow = window.open('', '_blank', 'width=1024,height=768');
      if (!printWindow) {
        openToast('Não foi possível abrir nova janela para exportar.', 'error');
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // Give the browser a tick to render before printing
      setTimeout(() => {
        printWindow.print();
      }, 200);
      openToast('Relatório aberto. Use salvar como PDF no diálogo de impressão.', 'success');
    } catch (err) {
      console.error(err);
      openToast('Erro ao gerar relatório.', 'error');
    }
  };

  const trigger = renderTrigger
    ? renderTrigger(handleExport)
    : (
      <Button variant="outlined" onClick={handleExport} className={styles.button}>
        Exportar relatório (PDF)
      </Button>
    );

  return (
    <>
      {trigger}
      <AppSnackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={closeToast}
        severity={toast.severity}
        message={toast.message}
      />
    </>
  );
}
