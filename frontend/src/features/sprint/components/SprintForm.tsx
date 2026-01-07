import {
  Alert,
  TextField,
} from '@mui/material';

type SprintFormProps = {
  title: string;
  startDate: string;
  endDate: string;
  dateRangeError: string | null;
  error: string | null;
  onTitleChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  className?: string;
  errorClassName?: string;
};

export function SprintForm({
  title,
  startDate,
  endDate,
  dateRangeError,
  error,
  onTitleChange,
  onStartDateChange,
  onEndDateChange,
  className,
  errorClassName,
}: SprintFormProps) {
  return (
    <>
      <div className={className}>
        <TextField
          label="Título"
          fullWidth
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <TextField
          label="Data início"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: endDate || undefined }}
          error={Boolean(dateRangeError)}
          helperText={dateRangeError ?? ' '}
        />
        <TextField
          label="Data fim"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: startDate || undefined }}
          error={Boolean(dateRangeError)}
          helperText={dateRangeError ?? ' '}
        />
      </div>
      {error && <Alert severity="error" className={errorClassName}>{error}</Alert>}
    </>
  );
}
