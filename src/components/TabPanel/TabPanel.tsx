import Box from '@mui/material/Box';
import type { ReactNode } from 'react';
import styles from './TabPanel.module.css';

interface TabPanelProps {
  children?: ReactNode;
  value: number;
  index: number;
}

export function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return (
    <Box className={styles.panel}>
      {children}
    </Box>
  );
}
