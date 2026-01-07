import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Step,
  StepButton,
  Stepper,
  Typography,
} from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useEnsureActiveSprint } from '../app/useEnsureActiveSprint';
import { getActiveProjectId } from '../app/sprintLibrary';
import { SprintTab } from '../features/sprint/SprintTab';
import { EventsTab } from '../features/events/EventsTab';
import { TeamTab } from '../features/members/TeamTab';
import { TasksTab } from '../features/tasks/TasksTab';
import { SummaryBoard } from '../components/SummaryBoard';
import { NewSchedulePanel } from '../components/NewSchedulePanel';
import { ReportExportButton } from '../components/ReportExport';
import { ConfigTab } from '../features/config/ConfigTab';
import { ImportExportTab } from '../features/importExport/ImportExportTab';
import { reopenPlanning } from '../app/store/slices/planningLifecycleSlice';
import { resetFollowUpData } from '../app/store/slices/tasksSlice';
import { ReviewTab, type PlanningStepKey } from '../features/review/ReviewTab';

const taskManageEventName = 'task-manage-open';
const navigateToPlanningEventName = 'navigate-to-planning';

export function PlanningPage() {
  useEnsureActiveSprint();
  const dispatch = useAppDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { sprintId } = useParams<{ sprintId: string }>();
  const projectId = getActiveProjectId();
  const planningStatus = useAppSelector((state) => state.planningLifecycle.status);
  const planningLocked = planningStatus !== 'editing';

  function goToStep(index: number) {
    setActiveStep(Math.max(0, Math.min(index, steps.length - 1)));
  }

  function goToStepKey(step: PlanningStepKey) {
    switch (step) {
      case 'sprint':
        goToStep(0);
        break;
      case 'events':
        goToStep(1);
        break;
      case 'team':
        goToStep(2);
        break;
      case 'tasks':
        goToStep(3);
        break;
      case 'review':
      default:
        goToStep(4);
        break;
    }
  }

  const steps = [
    { label: 'Sprint', element: <SprintTab /> },
    { label: 'Eventos', element: <EventsTab /> },
    { label: 'Time', element: <TeamTab /> },
    { label: 'Tarefas', element: <TasksTab /> },
    {
      label: 'Revisão',
      element: <ReviewTab onSaved={() => (sprintId ? navigate(`/acomp/${sprintId}`) : navigate(projectId ? `/projects/${projectId}/sprints` : '/projects'))} onEditStep={goToStepKey} />,
    },
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stepParam = params.get('step');
    const taskIdParam = params.get('taskId');
    if (stepParam === 'tasks') {
      goToStep(3);
    } else if (stepParam === 'review') {
      goToStep(steps.length - 1);
    }
    if (taskIdParam) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(taskManageEventName, { detail: { taskId: taskIdParam } }));
      }, 0);
    }
  }, [location.search]);

  useEffect(() => {
    const onNavigateToPlanning = (event: Event) => {
      const custom = event as CustomEvent<{ taskId?: string }>;
      const taskId = custom.detail?.taskId;
      // Tasks step is index 3
      goToStep(3);
      if (taskId) {
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent(taskManageEventName, { detail: { taskId } }));
        }, 0);
      }
    };

    window.addEventListener(navigateToPlanningEventName, onNavigateToPlanning as EventListener);
    return () => window.removeEventListener(navigateToPlanningEventName, onNavigateToPlanning as EventListener);
  }, [steps.length]);

  const startConfiguration = () => {
    setScheduleOpen(true);
  };

  const handleReopenPlanning = () => {
    const confirmed = window.confirm('Reabrir o planejamento apagará os dados do acompanhamento (status e conclusão das tarefas). Deseja continuar?');
    if (!confirmed) return;
    dispatch(reopenPlanning());
    dispatch(resetFollowUpData());
  };

  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            Planejamento de sprint
          </Typography>
          <Typography variant="body2" color="text.secondary">Configure, edite e priorize tarefas.</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" onClick={() => setConfigOpen(true)} disabled={planningLocked}>Configurações</Button>
          <Button variant="outlined" onClick={() => setImportOpen(true)} disabled={planningLocked}>Exportar / Importar</Button>
          <ReportExportButton
            renderTrigger={(onExport) => (
              <Button variant="contained" startIcon={<PictureAsPdfOutlinedIcon />} onClick={onExport}>
                Exportar PDF
              </Button>
            )}
          />
          <Button variant="contained" onClick={startConfiguration} disabled={planningLocked}>
            Resetar
          </Button>
        </Stack>
      </Box>
      {planningLocked && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Planejamento bloqueado para edição. O acompanhamento está liberado; reabra o planejamento para fazer ajustes (dados do acompanhamento serão limpos ao reabrir).
        </Alert>
      )}
  <Box sx={{ mb: 2 }}>
    <SummaryBoard />
  </Box>
  <Box sx={{ mt: 2, mb: 2 }}>
    <Stepper activeStep={activeStep} nonLinear alternativeLabel>
      {steps.map((step, index) => (
        <Step key={step.label} completed={activeStep > index}>
          <StepButton color="inherit" onClick={() => goToStep(index)}>
            {step.label}
          </StepButton>
        </Step>
      ))}
    </Stepper>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
      <Button variant="outlined" onClick={() => goToStep(activeStep - 1)} disabled={activeStep === 0}>
        Anterior
      </Button>
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          onClick={() => goToStep(activeStep + 1)}
          disabled={activeStep === steps.length - 1}
        >
          Próximo
        </Button>
      </Stack>
    </Box>
  </Box>
  {planningLocked && (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, gap: 2, flexWrap: 'wrap' }}>
      <Typography variant="body2" color="text.secondary">
        Planejamento bloqueado para edição. Reabra o planejamento para modificar dados.
      </Typography>
      <Button variant="contained" onClick={handleReopenPlanning} color="secondary" size="small">
        Reabrir planejamento
      </Button>
    </Box>
  )}
  <Box
    sx={{
      mt: 2,
      opacity: planningLocked ? 0.55 : 1,
      pointerEvents: planningLocked ? 'none' : 'auto',
      userSelect: planningLocked ? 'none' : 'auto',
    }}
  >
    {steps[activeStep]?.element}
  </Box>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
    <Button variant="outlined" onClick={() => goToStep(activeStep - 1)} disabled={activeStep === 0}>
      Anterior
    </Button>
    <Stack direction="row" spacing={1}>
      <Button
        variant="contained"
        onClick={() => goToStep(activeStep + 1)}
        disabled={activeStep === steps.length - 1}
      >
        Próximo
      </Button>
    </Stack>
  </Box>

      <Dialog open={configOpen} onClose={() => setConfigOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configurações (global)</DialogTitle>
        <DialogContent dividers>
          <ConfigTab />
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Exportar / Importar</DialogTitle>
        <DialogContent dividers>
          <ImportExportTab />
        </DialogContent>
      </Dialog>

      <NewSchedulePanel
        renderTrigger={() => null}
        openExternal={scheduleOpen}
        onCloseExternal={() => setScheduleOpen(false)}
        onContinue={() => {
          setScheduleOpen(false);
          goToStep(0);
        }}
      />
    </>
  );
}
