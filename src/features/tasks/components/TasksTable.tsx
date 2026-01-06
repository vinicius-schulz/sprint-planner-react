import type { DragEvent, ReactNode } from 'react';
import {
  Autocomplete,
  Chip,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { TaskItem } from '../../../domain/types';
import styles from '../TasksTab.module.css';

interface DependencyOption {
  label: string;
  value: string;
}

interface TasksTableProps {
  tasks: TaskItem[];
  members: { id: string; name: string }[];
  storyPointScale: number[];
  dependencyOptions: DependencyOption[];
  draggingId: string | null;
  dragOverId: string | 'end' | null;
  onDragStart: (taskId: string, event: DragEvent<HTMLButtonElement>) => void;
  onDragOver: (taskId: string, event: DragEvent<HTMLTableRowElement>) => void;
  onDrop: (taskId: string, event: DragEvent<HTMLTableRowElement>) => void;
  onDragEnd: () => void;
  onTaskUpdate: (id: string, updates: Partial<TaskItem>) => void;
  onRemove: (task: TaskItem) => void;
  onOpenManage: (task: TaskItem) => void;
  handleDependenciesUpdate: (id: string, deps: string[]) => void;
  getRowClass: (task: TaskItem, runningTotals: Map<string, number>) => string;
  formatDateTime: (value?: string) => string;
}

export function TasksTable({
  tasks,
  members,
  storyPointScale,
  dependencyOptions,
  draggingId,
  dragOverId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onTaskUpdate,
  onRemove,
  onOpenManage,
  handleDependenciesUpdate,
  getRowClass,
  formatDateTime,
}: TasksTableProps) {
  return (
    <div className={styles.list}>
      <Table size="small" className={styles.table}>
        <TableHead>
          <TableRow>
            <TableCell width={40}></TableCell>
            <TableCell>ID</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>SP</TableCell>
            <TableCell>Prazo</TableCell>
            <TableCell>Início</TableCell>
            <TableCell>Fim</TableCell>
            <TableCell>Dependências</TableCell>
            <TableCell>Responsável</TableCell>
            <TableCell width={140}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={10}>Nenhuma tarefa cadastrada.</TableCell>
            </TableRow>
          )}
          {(() => {
            const runningTotals = new Map<string, number>();
            const rows: ReactNode[] = [];

            tasks.forEach((task) => {
              const rowClass = getRowClass(task, runningTotals);

              if (draggingId && dragOverId === task.id) {
                rows.push(
                  <TableRow
                    key={`${task.id}-indicator`}
                    className={styles.dropIndicatorRow}
                    onDragOver={(event) => onDragOver(task.id, event)}
                    onDrop={(event) => onDrop(task.id, event)}
                  >
                    <TableCell colSpan={10} className={styles.dropIndicatorCell}>
                      <div className={styles.dropIndicatorLine} />
                    </TableCell>
                  </TableRow>,
                );
              }

              rows.push(
                <TableRow
                  key={task.id}
                  hover
                  className={[rowClass, task.turboEnabled ? styles.turboRow : ''].filter(Boolean).join(' ')}
                  onDragOver={(event) => onDragOver(task.id, event)}
                  onDrop={(event) => onDrop(task.id, event)}
                  onDragEnd={onDragEnd}
                >
                  <TableCell className={styles.dragHandleCell}>
                    <IconButton
                      aria-label="mover"
                      size="small"
                      draggable
                      onDragStart={(event) => onDragStart(task.id, event)}
                      onDragEnd={onDragEnd}
                    >
                      <DragIndicatorIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell>{task.id}</TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      value={task.name}
                      onChange={(e) => onTaskUpdate(task.id, { name: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      variant="standard"
                      value={task.storyPoints}
                      onChange={(e) => onTaskUpdate(task.id, { storyPoints: Number(e.target.value) })}
                      fullWidth
                      size="small"
                    >
                      {storyPointScale.map((sp) => (
                        <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      type="date"
                      value={task.dueDate ?? ''}
                      onChange={(e) => onTaskUpdate(task.id, { dueDate: e.target.value || undefined })}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(task.computedStartDate)}</TableCell>
                  <TableCell>{formatDateTime(task.computedEndDate)}</TableCell>
                  <TableCell>
                    <Autocomplete
                      multiple
                      options={dependencyOptions.filter((o) => o.value !== task.id)}
                      getOptionLabel={(o) => o.label}
                      value={dependencyOptions.filter((o) => task.dependencies.includes(o.value))}
                      onChange={(_, newValue) => handleDependenciesUpdate(task.id, newValue.map((o) => o.value))}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          (() => {
                            const { key, ...chipProps } = getTagProps({ index });
                            return <Chip key={key} label={option.value} size="small" {...chipProps} />;
                          })()
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder="Dep. IDs"
                          fullWidth
                          size="small"
                        />
                      )}
                      filterSelectedOptions
                      disableCloseOnSelect
                      clearOnBlur
                      blurOnSelect={false}
                      ListboxProps={{ style: { maxHeight: 240 } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      variant="standard"
                      value={task.assigneeMemberName || ''}
                      onChange={(e) => onTaskUpdate(task.id, { assigneeMemberName: e.target.value || undefined })}
                      fullWidth
                      size="small"
                    >
                      <MenuItem value="">-- Sem responsável --</MenuItem>
                      {members.map((m) => (
                        <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <div className={styles.actionsGroup}>
                      <IconButton aria-label="remover" onClick={() => onRemove(task)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="detalhes e edição" onClick={() => onOpenManage(task)} size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>,
              );
            });

            if (draggingId) {
              rows.push(
                <TableRow
                  key="drop-end-indicator"
                  className={dragOverId === 'end' ? styles.dropIndicatorRow : undefined}
                  onDragOver={(event) => onDragOver('end', event)}
                  onDrop={(event) => onDrop('end', event)}
                  onDragEnd={onDragEnd}
                >
                  <TableCell colSpan={10} className={styles.dropIndicatorCell}>
                    <div className={styles.dropIndicatorLine} />
                  </TableCell>
                </TableRow>,
              );
            }

            return rows;
          })()}
        </TableBody>
      </Table>
    </div>
  );
}
