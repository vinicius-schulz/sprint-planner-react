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

interface StatusOption {
    value: 'todo' | 'doing' | 'done';
    label: string;
}

interface TasksTableProps {
    variant?: 'planning' | 'followUp';
    tasks: TaskItem[];
    members: { id: string; name: string }[];
    storyPointScale?: number[];
    dependencyOptions?: DependencyOption[];
    draggingId?: string | null;
    dragOverId?: string | 'end' | null;
    onDragStart?: (taskId: string, event: DragEvent<HTMLButtonElement>) => void;
    onDragOver?: (taskId: string, event: DragEvent<HTMLTableRowElement>) => void;
    onDrop?: (taskId: string, event: DragEvent<HTMLTableRowElement>) => void;
    onDragEnd?: () => void;
    onTaskUpdate?: (id: string, updates: Partial<TaskItem>) => void;
    onRemove?: (task: TaskItem) => void;
    onOpenManage: (task: TaskItem) => void;
    handleDependenciesUpdate?: (id: string, deps: string[]) => void;
    getRowClass?: (task: TaskItem, runningTotals: Map<string, number>) => string;
    formatDateTime: (value?: string) => string;
    statusOptions?: StatusOption[];
    onStatusChange?: (task: TaskItem, status: StatusOption['value']) => void;
    onCompletedAtChange?: (task: TaskItem, nextDateTime: string) => void;
    toDateTimeLocalValue?: (value?: string) => string;
    todayIso?: string;
}

export function TasksTable({
    variant = 'planning',
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
    statusOptions,
    onStatusChange,
    onCompletedAtChange,
    toDateTimeLocalValue,
    todayIso,
}: TasksTableProps) {
    const effectiveStoryPointScale = storyPointScale ?? [];
    const effectiveDependencyOptions = dependencyOptions ?? [];
    const onDragStartFn = onDragStart ?? (() => { });
    const onDragOverFn = onDragOver ?? (() => { });
    const onDropFn = onDrop ?? (() => { });
    const onDragEndFn = onDragEnd ?? (() => { });
    const onTaskUpdateFn = onTaskUpdate ?? (() => { });
    const onRemoveFn = onRemove ?? (() => { });
    const onDependenciesUpdateFn = handleDependenciesUpdate ?? (() => { });
    const getRowClassFn = getRowClass ?? (() => '');
    if (variant === 'followUp') {
        return (
            <div className={styles.list}>
                <Table size="small" className={styles.table}>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Nome</TableCell>
                            <TableCell>Responsável</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Prazo</TableCell>
                            <TableCell>Concluída em</TableCell>
                            <TableCell>Início</TableCell>
                            <TableCell>Fim</TableCell>
                            <TableCell>SP</TableCell>
                            <TableCell width={80}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tasks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10}>Nenhuma tarefa encontrada com os filtros.</TableCell>
                            </TableRow>
                        )}
                        {tasks.map((task) => (
                            <TableRow key={task.id} hover>
                                <TableCell>{task.id}</TableCell>
                                <TableCell>{task.name}</TableCell>
                                <TableCell>{task.assigneeMemberName || '—'}</TableCell>
                                <TableCell>
                                    {statusOptions && onStatusChange ? (
                                        <TextField
                                            select
                                            size="small"
                                            variant="standard"
                                            value={(task.status ?? 'todo')}
                                            onChange={(e) => onStatusChange(task, e.target.value as StatusOption['value'])}
                                        >
                                            {statusOptions.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                            ))}
                                        </TextField>
                                    ) : (
                                        task.status ?? 'todo'
                                    )}
                                </TableCell>
                                <TableCell>{task.dueDate ? formatDateTime(task.dueDate) : '—'}</TableCell>
                                <TableCell>
                                    {onCompletedAtChange && toDateTimeLocalValue ? (
                                        (task.status ?? 'todo') === 'done' ? (
                                            <TextField
                                                type="datetime-local"
                                                size="small"
                                                variant="standard"
                                                value={toDateTimeLocalValue(task.completedAt) || `${todayIso ?? ''}T00:00`}
                                                onChange={(e) => onCompletedAtChange(task, e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        ) : (
                                            '—'
                                        )
                                    ) : (
                                        task.completedAt ? formatDateTime(task.completedAt) : '—'
                                    )}
                                </TableCell>
                                <TableCell>{formatDateTime(task.computedStartDate)}</TableCell>
                                <TableCell>{formatDateTime(task.computedEndDate)}</TableCell>
                                <TableCell>{task.storyPoints}</TableCell>
                                <TableCell>
                                    <div className={styles.actionsGroup}>
                                        <IconButton aria-label="detalhes" onClick={() => onOpenManage(task)} size="small">
                                            <InfoOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

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
                            const rowClass = getRowClassFn(task, runningTotals);

                            if (draggingId && dragOverId === task.id) {
                                rows.push(
                                    <TableRow
                                        key={`${task.id}-indicator`}
                                        className={styles.dropIndicatorRow}
                                        onDragOver={(event) => onDragOverFn(task.id, event)}
                                        onDrop={(event) => onDropFn(task.id, event)}
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
                                    onDragOver={(event) => onDragOverFn(task.id, event)}
                                    onDrop={(event) => onDropFn(task.id, event)}
                                    onDragEnd={onDragEndFn}
                                >
                                    <TableCell className={styles.dragHandleCell}>
                                        <IconButton
                                            aria-label="mover"
                                            size="small"
                                            draggable
                                            onDragStart={(event) => onDragStartFn(task.id, event)}
                                            onDragEnd={onDragEndFn}
                                        >
                                            <DragIndicatorIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>{task.id}</TableCell>
                                    <TableCell>
                                        <TextField
                                            variant="standard"
                                            value={task.name}
                                            onChange={(e) => onTaskUpdateFn(task.id, { name: e.target.value })}
                                            fullWidth
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            select
                                            variant="standard"
                                            value={task.storyPoints}
                                            onChange={(e) => onTaskUpdateFn(task.id, { storyPoints: Number(e.target.value) })}
                                            fullWidth
                                            size="small"
                                        >
                                            {effectiveStoryPointScale.map((sp) => (
                                                <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                                            ))}
                                        </TextField>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            variant="standard"
                                            type="date"
                                            value={task.dueDate ?? ''}
                                            onChange={(e) => onTaskUpdateFn(task.id, { dueDate: e.target.value || undefined })}
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
                                            options={effectiveDependencyOptions.filter((o) => o.value !== task.id)}
                                            getOptionLabel={(o) => o.label}
                                            value={effectiveDependencyOptions.filter((o) => task.dependencies.includes(o.value))}
                                            onChange={(_, newValue) => onDependenciesUpdateFn(task.id, newValue.map((o) => o.value))}
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
                                            onChange={(e) => onTaskUpdateFn(task.id, { assigneeMemberName: e.target.value || undefined })}
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
                                            {onRemove && (
                                                <IconButton aria-label="remover" onClick={() => onRemoveFn(task)} size="small">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
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
                                    onDragOver={(event) => onDragOverFn('end', event)}
                                    onDrop={(event) => onDropFn('end', event)}
                                    onDragEnd={onDragEndFn}
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
