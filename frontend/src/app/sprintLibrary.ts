import { DEFAULT_CONFIG, EMPTY_SPRINT, INITIAL_PLANNING_LIFECYCLE_STATE } from '../domain/constants';
import type { ProjectInput, ProjectMeta, RootPersistedState, StoredSprintMeta } from '../domain/types';
import * as projectApi from '../services/api/projects';
import * as sprintApi from '../services/api/sprints';

let activeSprintIdMemo: string | undefined;
let activeProjectIdMemo: string | undefined;

export const buildEmptyState = (): RootPersistedState => ({
  sprint: { ...EMPTY_SPRINT },
  calendar: { nonWorkingDaysManual: [], nonWorkingDaysRemoved: [], daySchedules: [] },
  events: { items: [] },
  members: { items: [] },
  tasks: { items: [] },
  config: { value: { ...DEFAULT_CONFIG } },
  planningLifecycle: { ...INITIAL_PLANNING_LIFECYCLE_STATE },
});

const cloneState = (state: RootPersistedState): RootPersistedState => JSON.parse(JSON.stringify(state));

export const getActiveSprintId = () => activeSprintIdMemo;
export const getActiveProjectId = () => activeProjectIdMemo;

export const setActiveSprintId = (id: string) => {
  activeSprintIdMemo = id;
};

export const setActiveProjectId = (id: string) => {
  activeProjectIdMemo = id;
};

export const ensureActiveSprint = async (requestedId?: string) => {
  const activeId = requestedId || getActiveSprintId();
  if (!activeId) {
    activeSprintIdMemo = undefined;
    return { state: buildEmptyState(), activeSprintId: undefined };
  }
  try {
    const sprint = await sprintApi.fetchSprint(activeId);
    activeSprintIdMemo = sprint.id;
    activeProjectIdMemo = sprint.meta.projectId;
    return { state: cloneState(sprint.state), activeSprintId: sprint.id };
  } catch (err) {
    console.error('Falha ao carregar sprint via API', err);
    activeSprintIdMemo = undefined;
    activeProjectIdMemo = undefined;
    return { state: buildEmptyState(), activeSprintId: undefined };
  }
};

export const saveActiveSprintState = async (state: RootPersistedState) => {
  const activeId = getActiveSprintId();
  if (!activeId) return;
  try {
    await sprintApi.updateSprintState(activeId, state);
  } catch (err) {
    console.error('Falha ao salvar sprint via API', err);
  }
};

export const listSprintSummaries = async (projectId?: string): Promise<StoredSprintMeta[]> => {
  if (!projectId) return [];
  return sprintApi.fetchSprintSummaries(projectId);
};

export const removeSprint = async (id: string) => {
  try {
    await sprintApi.deleteSprint(id);
  } catch (err) {
    console.error('Falha ao remover sprint via API', err);
  }
  if (getActiveSprintId() === id) {
    activeSprintIdMemo = undefined;
  }
  return { nextActiveId: getActiveSprintId() };
};

export const createNewSprint = async (title?: string, projectId?: string) => {
  if (!projectId) {
    throw new Error('projectId is required to create a sprint');
  }
  const sprint = await sprintApi.createSprint({ title, projectId });
  activeSprintIdMemo = sprint.id;
  activeProjectIdMemo = projectId;
  return { id: sprint.id, state: cloneState(sprint.state) };
};

export const getSprintState = async (id: string) => {
  try {
    const sprint = await sprintApi.fetchSprint(id);
    return cloneState(sprint.state);
  } catch (err) {
    console.error('Falha ao carregar estado da sprint via API', err);
    return undefined;
  }
};

export const getSprintMeta = async (id: string) => {
  try {
    const sprint = await sprintApi.fetchSprint(id);
    return sprint.meta;
  } catch (err) {
    console.error('Falha ao carregar sprint via API', err);
    return undefined;
  }
};

export const listProjects = async (): Promise<ProjectMeta[]> => projectApi.fetchProjects();

export const getProjectMeta = async (id?: string) => {
  if (!id) return undefined;
  try {
    return await projectApi.fetchProject(id);
  } catch (err) {
    console.error('Falha ao carregar projeto via API', err);
    return undefined;
  }
};

export const createProject = async ({ name, startDate, endDate, description, status }: ProjectInput) => {
  const project = await projectApi.createProject({ name, startDate, endDate, description, status });
  activeProjectIdMemo = project.id;
  return project;
};

export const updateProject = async (project: ProjectMeta) => {
  await projectApi.updateProject(project);
};

export const removeProject = async (id: string) => {
  await projectApi.deleteProject(id);
  if (activeProjectIdMemo === id) {
    activeProjectIdMemo = undefined;
  }
  if (activeSprintIdMemo) {
    activeSprintIdMemo = undefined;
  }
};
