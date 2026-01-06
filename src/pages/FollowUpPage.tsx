import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { ReportExportButton } from '../components/ReportExport';
import { FollowUpView } from '../components/FollowUpView';
import { useEnsureActiveSprint } from '../app/useEnsureActiveSprint';
import { finalizePlanning, reopenFollowUp } from '../features/review/planningLifecycleSlice';

export function FollowUpPage() {
  useEnsureActiveSprint();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { sprintId } = useParams<{ sprintId: string }>();
  const planningStatus = useAppSelector((state) => state.planningLifecycle.status);

  if (planningStatus === 'editing') {
    return (
      <>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
              Acompanhamento
            </Typography>
            <Typography variant="body2" color="text.secondary">Finalize a revisão para liberar o acompanhamento.</Typography>
          </Box>
        </Box>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Alert severity="info">O acompanhamento só fica disponível após o fechamento do planejamento.</Alert>
              <Button
                variant="contained"
                disabled={!sprintId}
                onClick={() => sprintId && navigate(`/plan/${sprintId}?step=review`)}
              >
                Ir para revisão e fechar planejamento
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </>
    );
  }

  const locked = planningStatus === 'closed';

  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            Acompanhamento
          </Typography>
          <Typography variant="body2" color="text.secondary">Visão diária com Gantt aberto e tarefas em leitura.</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {planningStatus === 'followup' && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => dispatch(finalizePlanning())}
            >
              Finalizar acompanhamento
            </Button>
          )}
          {planningStatus === 'closed' && (
            <Button
              variant="outlined"
              onClick={() => dispatch(reopenFollowUp())}
            >
              Reabrir acompanhamento
            </Button>
          )}
          <ReportExportButton />
        </Stack>
      </Box>
      {planningStatus === 'closed' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Sprint finalizada. Dados permanecem somente leitura; reabra o acompanhamento para registrar novo status ou ajustes visuais.
        </Alert>
      )}
      <Box sx={{ opacity: locked ? 0.6 : 1, pointerEvents: locked ? 'none' : 'auto', userSelect: locked ? 'none' : 'auto' }}>
        <FollowUpView />
      </Box>
    </>
  );
}
