import { DEFAULT_CONFIG, EMPTY_SPRINT, INITIAL_PLANNING_LIFECYCLE_STATE } from '../domain/constants';
import type { ProjectInput, ProjectMeta, RootPersistedState, StoredSprintMeta } from '../domain/types';
import { isApiEnabled } from '../config/integration';
import * as projectApi from '../services/api/projects';
import * as sprintApi from '../services/api/sprints';

const LIBRARY_KEY = 'scrum-capacity-library-v1';
const LEGACY_KEY = 'scrum-capacity-state-v1';
const DEFAULT_SPRINT_PREFIX = 'sprint';
const DEFAULT_PROJECT_PREFIX = 'project';

interface StoredSprintRecord {
  id: string;
  meta: StoredSprintMeta;
  state: RootPersistedState;
}

interface SprintLibraryPayload {
  activeSprintId?: string;
  activeProjectId?: string;
  projects: Record<string, ProjectMeta>;
  sprints: Record<string, StoredSprintRecord>;
}

let activeSprintIdMemo: string | undefined;

const buildEmptyState = (): RootPersistedState => ({
  sprint: { ...EMPTY_SPRINT },
  calendar: { nonWorkingDaysManual: [], nonWorkingDaysRemoved: [], daySchedules: [] },
  events: { items: [] },
  members: { items: [] },
  tasks: { items: [] },
  config: { value: { ...DEFAULT_CONFIG } },
  planningLifecycle: { ...INITIAL_PLANNING_LIFECYCLE_STATE },
});

const cloneState = (state: RootPersistedState): RootPersistedState => JSON.parse(JSON.stringify(state));

const safeParse = (value: string | null): SprintLibraryPayload | undefined => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as SprintLibraryPayload;
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const writeLibrary = (payload: SprintLibraryPayload) => {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Falha ao salvar biblioteca de sprints', err);
  }
};

const migrateLegacyState = (): SprintLibraryPayload => {
  const legacy = safeParse(localStorage.getItem(LEGACY_KEY));
  if (!legacy || (legacy as unknown as RootPersistedState).sprint === undefined) {
    const projectId = `${DEFAULT_PROJECT_PREFIX}-1`;
    return { projects: {}, sprints: {}, activeProjectId: projectId } as SprintLibraryPayload;
  }
  const legacyState = legacy as unknown as RootPersistedState;
  const projectId = `${DEFAULT_PROJECT_PREFIX}-1`;
  const projectMeta: ProjectMeta = {
    id: projectId,
    name: 'Projeto Padrão',
    status: 'active',
    updatedAt: new Date().toISOString(),
    startDate: legacyState.sprint.startDate,
    endDate: legacyState.sprint.endDate,
  };
  const id = `${DEFAULT_SPRINT_PREFIX}-1`;
  const meta: StoredSprintMeta = {
    id,
    title: legacyState.sprint.title,
    startDate: legacyState.sprint.startDate,
    endDate: legacyState.sprint.endDate,
    status: legacyState.planningLifecycle.status,
    projectId,
    updatedAt: new Date().toISOString(),
  };
  const migrated: SprintLibraryPayload = {
    activeProjectId: projectId,
    activeSprintId: id,
    projects: {
      [projectId]: projectMeta,
    },
    sprints: {
      [id]: {
        id,
        meta,
        state: legacyState,
      },
    },
  };
  writeLibrary(migrated);
  return migrated;
};

const readLibrary = (): SprintLibraryPayload => {
  const fromStorage = safeParse(localStorage.getItem(LIBRARY_KEY));
  if (fromStorage) {
    // ensure projects map exists for older payloads
    const projects = Object.fromEntries(
      Object.entries(fromStorage.projects ?? {}).map(([key, value]) => [
        key,
        {
          ...value,
          status: value.status ?? 'active',
        },
      ]),
    );
    return {
      ...fromStorage,
      projects,
    } as SprintLibraryPayload;
  }
  return migrateLegacyState();
};

const touchMeta = (state: RootPersistedState, id: string, projectId: string): StoredSprintMeta => ({
  id,
  title: state.sprint.title,
  startDate: state.sprint.startDate,
  endDate: state.sprint.endDate,
  status: state.planningLifecycle.status,
  projectId,
  updatedAt: new Date().toISOString(),
});

const randomId = () => `${DEFAULT_SPRINT_PREFIX}-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2, 10)}`;
const randomProjectId = () => `${DEFAULT_PROJECT_PREFIX}-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2, 10)}`;

export const getActiveSprintId = () => activeSprintIdMemo ?? readLibrary().activeSprintId;
export const getActiveProjectId = () => readLibrary().activeProjectId;

export const setActiveSprintId = (id: string) => {
  activeSprintIdMemo = id;
  const current = readLibrary();
  const updated: SprintLibraryPayload = { ...current, activeSprintId: id };
  writeLibrary(updated);
};

export const setActiveProjectId = (id: string) => {
  const current = readLibrary();
  const updated: SprintLibraryPayload = { ...current, activeProjectId: id };
  writeLibrary(updated);
};

const ensureProjectExists = (library: SprintLibraryPayload, projectId?: string) => {
  if (!projectId) {
    return { library, projectId: undefined } as const;
  }
  if (library.projects[projectId]) return { library, projectId } as const;
  const project: ProjectMeta = {
    id: projectId,
    name: 'Projeto sem título',
    status: 'active',
    updatedAt: new Date().toISOString(),
  };
  return {
    library: {
      ...library,
      projects: { ...library.projects, [projectId]: project },
      activeProjectId: library.activeProjectId ?? projectId,
    },
    projectId,
  } as const;
};

export const ensureActiveSprint = async (requestedId?: string) => {
  if (isApiEnabled) {
    const activeId = requestedId || getActiveSprintId();
    if (!activeId) {
      return { state: buildEmptyState(), activeSprintId: undefined };
    }
    try {
      const sprint = await sprintApi.fetchSprint(activeId);
      activeSprintIdMemo = sprint.id;
      setActiveSprintId(sprint.id);
      return { state: cloneState(sprint.state), activeSprintId: sprint.id };
    } catch (err) {
      console.error('Falha ao carregar sprint via API', err);
      return { state: buildEmptyState(), activeSprintId: undefined };
    }
  }

  let library = readLibrary();
  let activeId = requestedId || library.activeSprintId;

  if (!activeId) {
    const firstId = Object.keys(library.sprints)[0];
    activeId = firstId;
  }

  if (!activeId) {
    return { state: buildEmptyState(), activeSprintId: undefined };
  }

  if (!library.sprints[activeId]) {
    // do not auto-create sprint without project context
    return { state: buildEmptyState(), activeSprintId: undefined };
  }

  activeSprintIdMemo = activeId;
  writeLibrary({ ...library, activeSprintId: activeId });

  const record = library.sprints[activeId];
  return { state: cloneState(record.state), activeSprintId: activeId };
};

export const saveActiveSprintState = async (state: RootPersistedState) => {
  const activeId = getActiveSprintId();
  if (!activeId) return;
  if (isApiEnabled) {
    try {
      await sprintApi.updateSprintState(activeId, state);
    } catch (err) {
      console.error('Falha ao salvar sprint via API', err);
    }
    return;
  }
  const library = readLibrary();
  const projectId = library.sprints[activeId]?.meta.projectId ?? library.activeProjectId;
  if (!projectId) return;
  const meta = touchMeta(state, activeId, projectId);
  const { library: withProject } = ensureProjectExists(library, projectId);
  const updated: SprintLibraryPayload = {
    activeSprintId: activeId,
    activeProjectId: withProject.activeProjectId,
    projects: withProject.projects,
    sprints: {
      ...withProject.sprints,
      [activeId]: {
        id: activeId,
        meta,
        state,
      },
    },
  };
  writeLibrary(updated);
};

export const listSprintSummaries = async (projectId?: string): Promise<StoredSprintMeta[]> => {
  if (!projectId) return [];
  if (isApiEnabled) {
    return sprintApi.fetchSprintSummaries(projectId);
  }
  const library = readLibrary();
  return Object.values(library.sprints)
    .filter((s) => s.meta.projectId === projectId)
    .map((s) => s.meta)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const removeSprint = async (id: string) => {
  if (isApiEnabled) {
    try {
      await sprintApi.deleteSprint(id);
    } catch (err) {
      console.error('Falha ao remover sprint via API', err);
    }
    if (getActiveSprintId() === id) {
      activeSprintIdMemo = undefined;
      const current = readLibrary();
      writeLibrary({ ...current, activeSprintId: undefined });
    }
    return { nextActiveId: getActiveSprintId() };
  }
  const library = readLibrary();
  const { [id]: removed, ...rest } = library.sprints;
  if (!removed) return { nextActiveId: library.activeSprintId };
  const remainingIds = Object.keys(rest);
  const nextActiveId = library.activeSprintId === id ? remainingIds[0] : library.activeSprintId;
  const updated: SprintLibraryPayload = {
    ...library,
    activeSprintId: nextActiveId,
    sprints: rest,
  };
  writeLibrary(updated);
  activeSprintIdMemo = nextActiveId;
  return { nextActiveId };
};

export const createNewSprint = async (title?: string, projectId?: string) => {
  if (!projectId) {
    throw new Error('projectId is required to create a sprint');
  }
  if (isApiEnabled) {
    const sprint = await sprintApi.createSprint({ title, projectId });
    activeSprintIdMemo = sprint.id;
    setActiveSprintId(sprint.id);
    return { id: sprint.id, state: cloneState(sprint.state) };
  }
  const id = randomId();
  const state = buildEmptyState();
  if (title) {
    state.sprint.title = title;
  }
  let library = readLibrary();
  const { library: withProject, projectId: finalProjectId } = ensureProjectExists(library, projectId);
  library = withProject;
  const meta = touchMeta(state, id, finalProjectId as string);
  const updated: SprintLibraryPayload = {
    activeSprintId: id,
    activeProjectId: finalProjectId,
    projects: library.projects,
    sprints: {
      ...library.sprints,
      [id]: { id, meta, state },
    },
  };
  writeLibrary(updated);
  activeSprintIdMemo = id;
  return { id, state };
};

export const getSprintState = async (id: string) => {
  if (isApiEnabled) {
    try {
      const sprint = await sprintApi.fetchSprint(id);
      return cloneState(sprint.state);
    } catch (err) {
      console.error('Falha ao carregar estado da sprint via API', err);
      return undefined;
    }
  }
  const library = readLibrary();
  const state = library.sprints[id]?.state;
  return state ? cloneState(state) : undefined;
};

export const getSprintMeta = async (id: string) => {
  if (isApiEnabled) {
    try {
      const sprint = await sprintApi.fetchSprint(id);
      return sprint.meta;
    } catch (err) {
      console.error('Falha ao carregar sprint via API', err);
      return undefined;
    }
  }
  const library = readLibrary();
  return library.sprints[id]?.meta;
};

export const listProjects = async (): Promise<ProjectMeta[]> => {
  if (isApiEnabled) {
    return projectApi.fetchProjects();
  }
  const library = readLibrary();
  return Object.values(library.projects).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getProjectMeta = async (id?: string) => {
  if (!id) return undefined;
  if (isApiEnabled) {
    try {
      return await projectApi.fetchProject(id);
    } catch (err) {
      console.error('Falha ao carregar projeto via API', err);
      return undefined;
    }
  }
  const library = readLibrary();
  return library.projects[id];
};

export const createProject = async ({ name, startDate, endDate, description, status }: ProjectInput) => {
  if (isApiEnabled) {
    const project = await projectApi.createProject({ name, startDate, endDate, description, status });
    setActiveProjectId(project.id);
    return project;
  }
  const library = readLibrary();
  const id = randomProjectId();
  const project: ProjectMeta = {
    id,
    name: name || 'Projeto sem título',
    startDate,
    endDate,
    description,
    status: status ?? 'active',
    updatedAt: new Date().toISOString(),
  };
  const updated: SprintLibraryPayload = {
    ...library,
    activeProjectId: id,
    projects: { ...library.projects, [id]: project },
  };
  writeLibrary(updated);
  return project;
};

export const updateProject = async (project: ProjectMeta) => {
  if (isApiEnabled) {
    await projectApi.updateProject(project);
    return;
  }
  const library = readLibrary();
  if (!library.projects[project.id]) return;
  const updated: SprintLibraryPayload = {
    ...library,
    projects: {
      ...library.projects,
      [project.id]: {
        ...library.projects[project.id],
        ...project,
        status: project.status ?? library.projects[project.id].status ?? 'active',
        updatedAt: new Date().toISOString(),
      },
    },
  };
  writeLibrary(updated);
};

export const removeProject = async (id: string) => {
  if (isApiEnabled) {
    await projectApi.deleteProject(id);
    return;
  }
  const library = readLibrary();
  const { [id]: removed, ...rest } = library.projects;
  if (!removed) return;
  // Remove sprints tied to project
  const remainingSprints = Object.fromEntries(
    Object.entries(library.sprints).filter(([, s]) => s.meta.projectId !== id),
  );
  const updated: SprintLibraryPayload = {
    ...library,
    projects: rest,
    sprints: remainingSprints,
  };
  if (!rest[library.activeProjectId ?? '']) {
    updated.activeProjectId = Object.keys(rest)[0];
  }
  if (!remainingSprints[library.activeSprintId ?? '']) {
    updated.activeSprintId = Object.keys(remainingSprints)[0];
    activeSprintIdMemo = updated.activeSprintId;
  }
  writeLibrary(updated);
};
