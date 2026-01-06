import { DEFAULT_CONFIG, EMPTY_SPRINT, INITIAL_PLANNING_LIFECYCLE_STATE } from '../domain/constants';
import type { PlanningLifecycleState, RootPersistedState } from '../domain/types';

const LIBRARY_KEY = 'scrum-capacity-library-v1';
const LEGACY_KEY = 'scrum-capacity-state-v1';
const DEFAULT_SPRINT_PREFIX = 'sprint';

export interface StoredSprintMeta {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
  status: PlanningLifecycleState['status'];
}

interface StoredSprintRecord {
  id: string;
  meta: StoredSprintMeta;
  state: RootPersistedState;
}

interface SprintLibraryPayload {
  activeSprintId?: string;
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
    return { sprints: {} };
  }
  const legacyState = legacy as unknown as RootPersistedState;
  const id = `${DEFAULT_SPRINT_PREFIX}-1`;
  const meta: StoredSprintMeta = {
    id,
    title: legacyState.sprint.title,
    startDate: legacyState.sprint.startDate,
    endDate: legacyState.sprint.endDate,
    status: legacyState.planningLifecycle.status,
    updatedAt: new Date().toISOString(),
  };
  const migrated: SprintLibraryPayload = {
    activeSprintId: id,
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
  if (fromStorage) return fromStorage;
  return migrateLegacyState();
};

const touchMeta = (state: RootPersistedState, id: string): StoredSprintMeta => ({
  id,
  title: state.sprint.title,
  startDate: state.sprint.startDate,
  endDate: state.sprint.endDate,
  status: state.planningLifecycle.status,
  updatedAt: new Date().toISOString(),
});

const randomId = () => `${DEFAULT_SPRINT_PREFIX}-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2, 10)}`;

export const getActiveSprintId = () => activeSprintIdMemo ?? readLibrary().activeSprintId;

export const setActiveSprintId = (id: string) => {
  activeSprintIdMemo = id;
  const current = readLibrary();
  const updated: SprintLibraryPayload = { ...current, activeSprintId: id };
  writeLibrary(updated);
};

const ensureLibraryHasSprint = (library: SprintLibraryPayload, id: string): SprintLibraryPayload => {
  if (library.sprints[id]) return library;
  const emptyState = buildEmptyState();
  const meta = touchMeta(emptyState, id);
  return {
    ...library,
    sprints: {
      ...library.sprints,
      [id]: { id, meta, state: emptyState },
    },
  };
};

export const ensureActiveSprint = (requestedId?: string) => {
  let library = readLibrary();
  let activeId = requestedId || library.activeSprintId;

  if (!activeId) {
    const firstId = Object.keys(library.sprints)[0];
    activeId = firstId || randomId();
  }

  library = ensureLibraryHasSprint(library, activeId);
  activeSprintIdMemo = activeId;
  writeLibrary({ ...library, activeSprintId: activeId });

  const record = library.sprints[activeId];
  return { state: cloneState(record.state), activeSprintId: activeId };
};

export const saveActiveSprintState = (state: RootPersistedState) => {
  const activeId = getActiveSprintId();
  if (!activeId) return;
  const library = readLibrary();
  const meta = touchMeta(state, activeId);
  const updated: SprintLibraryPayload = {
    activeSprintId: activeId,
    sprints: {
      ...library.sprints,
      [activeId]: {
        id: activeId,
        meta,
        state,
      },
    },
  };
  writeLibrary(updated);
};

export const listSprintSummaries = (): StoredSprintMeta[] => {
  const library = readLibrary();
  return Object.values(library.sprints)
    .map((s) => s.meta)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const removeSprint = (id: string) => {
  const library = readLibrary();
  const { [id]: removed, ...rest } = library.sprints;
  if (!removed) return { nextActiveId: library.activeSprintId };
  const remainingIds = Object.keys(rest);
  const nextActiveId = library.activeSprintId === id ? remainingIds[0] : library.activeSprintId;
  const updated: SprintLibraryPayload = { activeSprintId: nextActiveId, sprints: rest };
  writeLibrary(updated);
  activeSprintIdMemo = nextActiveId;
  return { nextActiveId };
};

export const createNewSprint = (title?: string) => {
  const id = randomId();
  const state = buildEmptyState();
  if (title) {
    state.sprint.title = title;
  }
  const meta = touchMeta(state, id);
  const library = readLibrary();
  const updated: SprintLibraryPayload = {
    activeSprintId: id,
    sprints: {
      ...library.sprints,
      [id]: { id, meta, state },
    },
  };
  writeLibrary(updated);
  activeSprintIdMemo = id;
  return { id, state };
};

export const getSprintState = (id: string) => {
  const library = readLibrary();
  const state = library.sprints[id]?.state;
  return state ? cloneState(state) : undefined;
};
