import { useEffect, useMemo, useState } from 'react';
import {
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
import { useNavigate } from 'react-router-dom';
import { SprintTab } from '../features/sprint/SprintTab';
import { EventsTab } from '../features/events/EventsTab';
import { TeamTab } from '../features/members/TeamTab';
import { TasksTab } from '../features/tasks/TasksTab';
import { SummaryBoard } from '../components/SummaryBoard';
import { NewSchedulePanel } from '../components/NewSchedulePanel';
import { ReportExportButton } from '../components/ReportExport';
import { ConfigTab } from '../features/config/ConfigTab';
import { ImportExportTab } from '../features/importExport/ImportExportTab';
import { ReviewTab } from '../features/review/ReviewTab';

const taskManageEventName = 'task-manage-open';
const navigateToPlanningEventName = 'navigate-to-planning';

export function PlanningPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const navigate = useNavigate();

  const steps = useMemo(
    () => [
      { label: 'Sprint', element: <SprintTab /> },
      { label: 'Eventos', element: <EventsTab /> },
      { label: 'Time', element: <TeamTab /> },
      { label: 'Tarefas', element: <TasksTab /> },
      {
        label: 'Revisão',
        element: <ReviewTab onSaved={() => navigate('/acomp')} />,
      },
    ],
    [navigate],
  );

  const goToStep = (index: number) => {
    setActiveStep(Math.max(0, Math.min(index, steps.length - 1)));
  };

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
          <Button variant="outlined" onClick={() => setConfigOpen(true)}>Configurações</Button>
          <Button variant="outlined" onClick={() => setImportOpen(true)}>Exportar / Importar</Button>
          <ReportExportButton
            renderTrigger={(onExport) => (
              <Button variant="contained" startIcon={<PictureAsPdfOutlinedIcon />} onClick={onExport}>
                Exportar PDF
              </Button>
            )}
          />
          <Button variant="contained" onClick={startConfiguration}>
            Iniciar configuração
          </Button>
        </Stack>
      </Box>
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
      <Box sx={{ mt: 2 }}>
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
