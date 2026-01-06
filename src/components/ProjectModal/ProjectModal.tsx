import type React from 'react';
import { useEffect, useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
} from '@mui/material';
import type { ProjectMeta } from '../../app/sprintLibrary';

const statusOptions: Array<{ value: ProjectMeta['status']; label: string }> = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'active', label: 'Ativo' },
    { value: 'archived', label: 'Arquivado' },
];

export type ProjectModalData = {
    name: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    status: ProjectMeta['status'];
};

interface ProjectModalProps {
    open: boolean;
    initialProject?: ProjectMeta;
    onClose: () => void;
    onSave: (data: ProjectModalData) => void;
}

export function ProjectModal({ open, initialProject, onClose, onSave }: ProjectModalProps) {
    const [form, setForm] = useState<ProjectModalData>({
        name: '',
        startDate: '',
        endDate: '',
        description: '',
        status: 'active',
    });

    useEffect(() => {
        if (initialProject) {
            setForm({
                name: initialProject.name || '',
                startDate: initialProject.startDate || '',
                endDate: initialProject.endDate || '',
                description: initialProject.description || '',
                status: initialProject.status ?? 'active',
            });
        } else {
            setForm({ name: '', startDate: '', endDate: '', description: '', status: 'active' });
        }
    }, [initialProject]);

    const handleChange = (field: keyof ProjectModalData) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSave = () => {
        if (!form.name.trim()) return;
        onSave({ ...form, name: form.name.trim() });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{initialProject ? 'Editar projeto' : 'Novo projeto'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                        label="Nome"
                        value={form.name}
                        onChange={handleChange('name')}
                        required
                        autoFocus
                        fullWidth
                    />
                    <TextField
                        label="Descrição"
                        value={form.description}
                        onChange={handleChange('description')}
                        fullWidth
                        multiline
                        minRows={2}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Início"
                            type="date"
                            value={form.startDate ?? ''}
                            onChange={handleChange('startDate')}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="Fim"
                            type="date"
                            value={form.endDate ?? ''}
                            onChange={handleChange('endDate')}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Stack>
                    <TextField
                        select
                        label="Status"
                        value={form.status}
                        onChange={handleChange('status')}
                        fullWidth
                    >
                        {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
                    Salvar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ProjectModal;
