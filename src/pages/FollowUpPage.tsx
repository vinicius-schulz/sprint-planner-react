import { Box, Typography } from '@mui/material';
import { ReportExportButton } from '../components/ReportExport';
import { FollowUpView } from '../components/FollowUpView';

export function FollowUpPage() {
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
