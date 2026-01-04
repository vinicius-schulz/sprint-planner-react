import { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Step,
  StepButton,
  Stepper,
  Toolbar,
  Typography,
} from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import './App.css';
import { SprintTab } from './features/sprint/SprintTab';
import { EventsTab } from './features/events/EventsTab';
import { TeamTab } from './features/members/TeamTab';
import { TasksTab } from './features/tasks/TasksTab';
import { SummaryBoard } from './components/SummaryBoard';
import { GanttTimelineFrappe } from './components/GanttTimelineFrappe';
import { NewSchedulePanel } from './components/NewSchedulePanel';
import { ReportExportButton } from './components/ReportExport';
import { ConfigTab } from './features/config/ConfigTab';
import { ImportExportTab } from './features/importExport/ImportExportTab';
import logo from './assets/logo.svg';

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const steps = useMemo(
    () => [
      { label: 'Sprint', element: <SprintTab /> },
      { label: 'Eventos', element: <EventsTab /> },
      { label: 'Time', element: <TeamTab /> },
      { label: 'Tarefas', element: <TasksTab /> },
    ],
    [],
  );

  const goToStep = (index: number) => {
    setActiveStep(Math.max(0, Math.min(index, steps.length - 1)));
  };

  const startConfiguration = () => {
    setScheduleOpen(true);
  };

  return (
    <>
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{ width: 40, height: 40, borderRadius: 2, boxShadow: 1, bgcolor: 'background.paper' }}
            />
            <Typography variant="h6" sx={{ mb: 0 }}>
              Calculadora de Capacidade Scrum
            </Typography>
          </Stack>
          <Button variant="text" color="inherit" onClick={() => setConfigOpen(true)}>
            Configurações
          </Button>
          <Button variant="text" color="inherit" onClick={() => setImportOpen(true)}>
            Exportar / Importar
          </Button>
          <ReportExportButton
            renderTrigger={(onExport) => (
              <Button variant="contained" startIcon={<PictureAsPdfOutlinedIcon />} onClick={onExport}>
                Exportar PDF
              </Button>
            )}
          />
        </Toolbar>
      </AppBar>

      <Toolbar />
      <Container className="appContainer" maxWidth="lg" sx={{ pt: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            Planejamento de sprint
          </Typography>
          <Button variant="contained" onClick={startConfiguration}>
            Iniciar configuração
          </Button>
        </Box>
        <Box sx={{ mb: 2 }}>
          <SummaryBoard />
        </Box>
        {/*<GanttTimeline />*/}
        <GanttTimelineFrappe />
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
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => goToStep(0)}>
              Reiniciar wizard
            </Button>
            <Button variant="text" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Voltar ao topo
            </Button>
          </Stack>
        </Box>
      </Container>

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

export default App;
