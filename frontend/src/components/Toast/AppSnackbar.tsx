import { Alert, Snackbar, type AlertColor, type SnackbarCloseReason } from '@mui/material';

export type AppSnackbarProps = {
  open: boolean;
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
  onClose?: (event?: Event | React.SyntheticEvent<Element, Event>, reason?: SnackbarCloseReason) => void;
};

// Centralized snackbar positioned top-right under the header bar
export function AppSnackbar({
  open,
  message,
  severity = 'info',
  autoHideDuration = 3500,
  onClose,
}: AppSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ '&.MuiSnackbar-anchorOriginTopRight': { top: (theme) => theme.spacing(8) } }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
