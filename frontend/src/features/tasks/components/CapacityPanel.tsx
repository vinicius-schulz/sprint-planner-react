import { Chip, Typography } from '@mui/material';
import styles from '../TasksTab.module.css';

interface CapacityItem {
  name: string;
  capacitySp: number;
  takenSp: number;
  remainingSp: number;
}

interface CapacityPanelProps {
  items: CapacityItem[];
}

export function CapacityPanel({ items }: CapacityPanelProps) {
  if (!items.length) return null;

  return (
    <div className={styles.capacityPanel}>
      <Typography variant="subtitle2" gutterBottom>Distribuição por membro (SP)</Typography>
      <div className={styles.capacityChips}>
        {items.map((m) => {
          let color: 'default' | 'success' | 'error' = 'default';
          if (m.takenSp > m.capacitySp) color = 'error';
          else if (m.remainingSp > 0) color = 'success';
          return (
            <Chip
              key={m.name}
              label={`${m.name}: ${m.takenSp}/${m.capacitySp} SP (livre ${m.remainingSp})`}
              color={color === 'default' ? 'default' : color}
              variant={color === 'default' ? 'outlined' : 'filled'}
              size="small"
            />
          );
        })}
      </div>
    </div>
  );
}
