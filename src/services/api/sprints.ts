import { apiClient } from './apiClient';
import type { RootPersistedState, StoredSprintMeta } from '../../domain/types';

export type SprintCreateInput = {
  title?: string;
  projectId: string;
};

export type SprintStateResponse = {
  id: string;
  state: RootPersistedState;
  meta: StoredSprintMeta;
};

export const fetchSprintSummaries = async (projectId: string) => {
  const { data } = await apiClient.get<StoredSprintMeta[]>(`/projects/${projectId}/sprints`);
  return data;
};

export const fetchSprint = async (id: string) => {
  const { data } = await apiClient.get<SprintStateResponse>(`/sprints/${id}`);
  return data;
};

export const createSprint = async ({ title, projectId }: SprintCreateInput) => {
  const { data } = await apiClient.post<SprintStateResponse>(`/projects/${projectId}/sprints`, { title });
  return data;
};

export const updateSprintState = async (id: string, state: RootPersistedState) => {
  const { data } = await apiClient.put<SprintStateResponse>(`/sprints/${id}/state`, { state });
  return data;
};

export const deleteSprint = async (id: string) => {
  await apiClient.delete(`/sprints/${id}`);
};
