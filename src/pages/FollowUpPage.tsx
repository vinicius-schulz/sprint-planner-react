import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { ReportExportButton } from '../components/ReportExport';
import { FollowUpView } from '../components/FollowUpView';

export function FollowUpPage() {
  const navigate = useNavigate();
  const planningClosed = useAppSelector((state) => state.planningLifecycle.status === 'closed');

  if (!planningClosed) {
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
                onClick={() => navigate('/plan?step=review')}
              >
                Ir para revisão e fechar planejamento
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            Acompanhamento
          </Typography>
          <Typography variant="body2" color="text.secondary">Visão diária com Gantt aberto e tarefas em leitura.</Typography>
        </Box>
        <ReportExportButton />
      </Box>
      <FollowUpView />
    </>
  );
}
