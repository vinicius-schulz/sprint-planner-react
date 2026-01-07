import { apiClient } from './apiClient';
import type { ProjectInput, ProjectMeta } from '../../domain/types';

export const fetchProjects = async () => {
  const { data } = await apiClient.get<ProjectMeta[]>('/projects');
  return data;
};

export const fetchProject = async (id: string) => {
  const { data } = await apiClient.get<ProjectMeta>(`/projects/${id}`);
  return data;
};

export const createProject = async (payload: ProjectInput) => {
  const { data } = await apiClient.post<ProjectMeta>('/projects', payload);
  return data;
};

export const updateProject = async (project: ProjectMeta) => {
  const { data } = await apiClient.put<ProjectMeta>(`/projects/${project.id}`, project);
  return data;
};

export const deleteProject = async (id: string) => {
  await apiClient.delete(`/projects/${id}`);
};
