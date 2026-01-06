import {
    Autocomplete,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
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

interface TaskManageDialogProps {
    open: boolean;
    task: TaskItem | null;
    manageDraft?: {
        name: string;
        storyPoints: number;
        dueDate?: string;
        assigneeMemberName?: string;
        dependencies: string[];
    } | null;
    manageTurboValue?: number;
    manageTab?: 'resumo' | 'editar';
    onTabChange?: (tab: 'resumo' | 'editar') => void;
    onClose: () => void;
    onSave?: () => void;
    onDraftChange?: (draft: TaskManageDialogProps['manageDraft']) => void;
    onTurboChange?: (value: number) => void;
    dependencyOptions?: DependencyOption[];
    members?: { id: string; name: string }[];
    storyPointScale?: number[];
    formatDateTime: (value?: string) => string;
    formatMinutesToClock: (minutes?: number) => string;
    statusOptions?: StatusOption[];
    onStatusChange?: (task: TaskItem, status: StatusOption['value']) => void;
    onCompletedAtChange?: (task: TaskItem, nextDateTime: string) => void;
    toDateTimeLocalValue?: (value?: string) => string;
    nowLocalIso?: string;
    onNavigateToPlanning?: (taskId: string) => void;
}

export function TaskManageDialog({
    open,
    task,
    manageDraft = null,
    manageTurboValue = 0,
    manageTab = 'resumo',
    onTabChange,
    onClose,
    onSave,
    onDraftChange,
    onTurboChange,
    dependencyOptions = [],
    members = [],
    storyPointScale = [],
    formatDateTime,
    formatMinutesToClock,
    statusOptions,
    onStatusChange,
    onCompletedAtChange,
    toDateTimeLocalValue,
    nowLocalIso,
    onNavigateToPlanning,
}: TaskManageDialogProps) {
    const manageTimeline = task?.computedTimeline ?? [];
    const showEditTab = Boolean(manageDraft && storyPointScale.length);
    const currentTab = showEditTab ? manageTab : 'resumo';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Detalhes e edição da tarefa</DialogTitle>
            <DialogContent dividers>
                {showEditTab && (
                    <Tabs value={currentTab} onChange={(_, val) => onTabChange?.(val)} sx={{ mb: 2 }}>
                        <Tab label="Resumo" value="resumo" />
                        <Tab label="Editar" value="editar" />
                    </Tabs>
                )}
                {currentTab === 'resumo' && (
                    <Box display="flex" flexDirection="column" gap={1}>
                        {!task && <Typography variant="body2">Nenhuma tarefa selecionada.</Typography>}
                        {task && (
                            <>
                                <Typography variant="subtitle1" gutterBottom>{task.name}</Typography>
                                <Typography variant="body2">ID: {task.id}</Typography>
                                <Typography variant="body2">Responsável: {task.assigneeMemberName || '—'}</Typography>
                                <Typography variant="body2">Prazo: {task.dueDate ?? '—'}</Typography>
                                <Typography variant="body2">Início: {formatDateTime(task.computedStartDate)}</Typography>
                                <Typography variant="body2" gutterBottom>Fim: {formatDateTime(task.computedEndDate)}</Typography>
                                <Typography variant="body2">Story Points: {task.storyPoints}</Typography>
                                <Typography variant="body2">Turbo: {task.turboEnabled ? task.turboStoryPoints : 'Desativado'}</Typography>
                                {statusOptions && onStatusChange && (
                                    <Box sx={{ mt: 1, display: 'grid', gap: 1 }}>
                                        <TextField
                                            label="Status"
                                            select
                                            size="small"
                                            value={(task.status ?? 'todo')}
                                            onChange={(e) => onStatusChange(task, e.target.value as StatusOption['value'])}
                                        >
                                            {statusOptions.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                            ))}
                                        </TextField>
                                        {onCompletedAtChange && toDateTimeLocalValue && (
                                            (task.status ?? 'todo') === 'done' ? (
                                                <TextField
                                                    label="Concluída em"
                                                    type="datetime-local"
                                                    size="small"
                                                    value={toDateTimeLocalValue(task.completedAt) || nowLocalIso || ''}
                                                    onChange={(e) => onCompletedAtChange(task, e.target.value)}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            ) : (
                                                <TextField
                                                    label="Concluída em"
                                                    size="small"
                                                    value="—"
                                                    disabled
                                                />
                                            )
                                        )}
                                    </Box>
                                )}
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" gutterBottom>Plano por dia</Typography>
                                {!manageTimeline.length && (
                                    <Typography variant="body2" color="text.secondary">
                                        Calcule as datas para ver o cronograma detalhado.
                                    </Typography>
                                )}
                                {manageTimeline.length ? (
                                    <List dense>
                                        {manageTimeline.map((seg, idx) => (
                                            <div key={`${seg.date}-${seg.startTime}-${seg.endTime}-${idx}`}>
                                                <ListItem alignItems="flex-start">
                                                    <ListItemText
                                                        primary={`${formatDateTime(`${seg.date} ${seg.startTime}`)} - ${seg.endTime} (${formatMinutesToClock(seg.minutes)})`}
                                                        secondaryTypographyProps={{ component: 'div' }}
                                                        secondary={
                                                            seg.detail ? (
                                                                <div className={styles.infoDetailBlock}>
                                                                    <Typography component="div" variant="body2">
                                                                        Nesta tarefa: {formatMinutesToClock(seg.minutes)} · Capacidade do dia: {formatMinutesToClock(seg.detail.capacityMinutes)}
                                                                    </Typography>
                                                                    <Typography component="div" variant="body2">
                                                                        Eventos/recorrentes no dia: {formatMinutesToClock(seg.detail.eventMinutes + seg.detail.recurringMinutes)} · Períodos: {seg.detail.periods.map((p) => `${p.start}-${p.end}`).join(', ')}
                                                                    </Typography>
                                                                </div>
                                                            ) : undefined
                                                        }
                                                    />
                                                </ListItem>
                                                {idx < manageTimeline.length - 1 && <Divider component="li" />}
                                            </div>
                                        ))}
                                    </List>
                                ) : null}
                            </>
                        )}
                    </Box>
                )}
                {currentTab === 'editar' && manageDraft && (
                    <Box display="grid" gap={2}>
                        <TextField
                            label="Nome"
                            fullWidth
                            value={manageDraft?.name ?? ''}
                            onChange={(e) => onDraftChange?.(manageDraft ? { ...manageDraft, name: e.target.value } : manageDraft)}
                        />
                        <TextField
                            select
                            label="Story Points"
                            value={manageDraft?.storyPoints ?? storyPointScale[0]}
                            onChange={(e) => onDraftChange?.(manageDraft ? { ...manageDraft, storyPoints: Number(e.target.value) } : manageDraft)}
                        >
                            {storyPointScale.map((sp) => (
                                <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label="Turbo (SP)"
                            helperText="Escolha valor menor que o SP original para ativar o turbo"
                            value={manageTurboValue}
                            onChange={(e) => onTurboChange?.(Number(e.target.value))}
                        >
                            {storyPointScale
                                .filter((sp) => manageDraft ? sp <= manageDraft.storyPoints : true)
                                .map((sp) => (
                                    <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                                ))}
                        </TextField>
                        <TextField
                            label="Prazo"
                            type="date"
                            value={manageDraft?.dueDate ?? ''}
                            onChange={(e) => onDraftChange?.(manageDraft ? { ...manageDraft, dueDate: e.target.value || undefined } : manageDraft)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            select
                            label="Responsável"
                            value={manageDraft?.assigneeMemberName ?? ''}
                            onChange={(e) => onDraftChange?.(manageDraft ? { ...manageDraft, assigneeMemberName: e.target.value || undefined } : manageDraft)}
                        >
                            <MenuItem value="">-- Sem responsável --</MenuItem>
                            {members.map((m) => (
                                <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                            ))}
                        </TextField>
                        <Autocomplete
                            multiple
                            options={dependencyOptions.filter((o) => o.value !== task?.id)}
                            getOptionLabel={(o) => o.label}
                            value={dependencyOptions.filter((o) => (manageDraft?.dependencies ?? []).includes(o.value))}
                            onChange={(_, newValue) => onDraftChange?.(manageDraft ? { ...manageDraft, dependencies: newValue.map((o) => o.value) } : manageDraft)}
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
                                    label="Dependências"
                                    placeholder="IDs"
                                />
                            )}
                            filterSelectedOptions
                            disableCloseOnSelect
                            clearOnBlur
                            blurOnSelect={false}
                            ListboxProps={{ style: { maxHeight: 240 } }}
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {onNavigateToPlanning && task && (
                    <Button color="secondary" onClick={() => onNavigateToPlanning(task.id)}>
                        Abrir no planejamento
                    </Button>
                )}
                <Button onClick={onClose}>{onSave ? 'Cancelar' : 'Fechar'}</Button>
                {onSave && manageDraft && (
                    <Button variant="contained" onClick={onSave} disabled={!manageDraft}>Atualizar</Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
