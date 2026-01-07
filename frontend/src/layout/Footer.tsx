import { Box, Typography } from '@mui/material';

export function Footer() {
  return (
    <Box component="footer" sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
      <Typography variant="caption">Calculadora de Capacidade Scrum</Typography>
    </Box>
  );
}
