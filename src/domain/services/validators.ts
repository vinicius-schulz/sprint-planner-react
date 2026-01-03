import type { CalendarState, EventItem, Member, SprintState, TaskItem } from '../types';

export const validateSprint = (sprint: SprintState): string | null => {
  if (!sprint.startDate || !sprint.endDate) return 'Datas de início e fim são obrigatórias.';
  if (new Date(`${sprint.startDate}T00:00:00`) > new Date(`${sprint.endDate}T00:00:00`)) {
    return 'Data de início não pode ser posterior à data de fim.';
  }
  return null;
};

export const validateManualDay = (date: string, calendar: CalendarState): string | null => {
  if (!date) return 'Data é obrigatória.';
  if (calendar.nonWorkingDaysManual.includes(date)) return 'Data já está na lista de não úteis.';
  return null;
};

export const validateEvent = (event: Omit<EventItem, 'id'>): string | null => {
  if (!event.date) return 'Data do evento é obrigatória.';
  if (!Number.isFinite(event.minutes) || event.minutes <= 0) return 'Minutos do evento devem ser numéricos e maiores que zero.';
  return null;
};

export const validateMember = (member: Omit<Member, 'id'>): string | null => {
  if (!member.name) return 'Nome do membro é obrigatório.';
  if (!member.roleType) return 'Tipo do membro é obrigatório.';
  if (!Number.isFinite(member.availabilityPercent) || member.availabilityPercent < 0 || member.availabilityPercent > 100) {
    return 'Disponibilidade deve estar entre 0 e 100.';
  }
  return null;
};

export const validateTask = (task: Omit<TaskItem, 'computedEndDate' | 'computedStartDate'>, existing: TaskItem[]): string | null => {
  if (!task.id) return 'ID da tarefa é obrigatório.';
  if (!task.name) return 'Nome da tarefa é obrigatório.';
  if (!Number.isFinite(task.storyPoints)) return 'Story points devem ser numéricos.';
  if (existing.some((t) => t.id === task.id)) return 'ID da tarefa já existe.';
  if (task.dependencies.includes(task.id)) return 'Uma tarefa não pode depender de si mesma.';
  return null;
};
