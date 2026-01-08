import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import type { RootPersistedState } from '../domain/types';
import { buildEmptyState, saveActiveSprintState } from './sprintLibrary';
import calendarReducer from './store/slices/calendarSlice';
import configReducer from './store/slices/configSlice';
import eventsReducer from './store/slices/eventsSlice';
import membersReducer from './store/slices/membersSlice';
import planningLifecycleReducer from './store/slices/planningLifecycleSlice';
import sprintReducer from './store/slices/sprintSlice';
import tasksReducer from './store/slices/tasksSlice';
import type { AppAction } from './store/actionTypes';

export type RootState = RootPersistedState;
export type AppDispatch = (action: AppAction) => void;

const REPLACE_STATE = 'app/replaceState';

export const replaceState = (
  payload: RootPersistedState,
  options?: { persist?: boolean },
): AppAction<RootPersistedState> => ({
  type: REPLACE_STATE,
  payload,
  persist: options?.persist,
});

const rootReducer = (state: RootState, action: AppAction): RootState => {
  if (action.type === REPLACE_STATE) {
    return action.payload as RootPersistedState;
  }

  const sprint = sprintReducer(state.sprint, action);
  const calendar = calendarReducer(state.calendar, action);
  const events = eventsReducer(state.events, action);
  const members = membersReducer(state.members, action);
  const tasks = tasksReducer(state.tasks, action);
  const config = configReducer(state.config, action);
  const planningLifecycle = planningLifecycleReducer(state.planningLifecycle, action);

  if (
    sprint === state.sprint &&
    calendar === state.calendar &&
    events === state.events &&
    members === state.members &&
    tasks === state.tasks &&
    config === state.config &&
    planningLifecycle === state.planningLifecycle
  ) {
    return state;
  }

  return {
    sprint,
    calendar,
    events,
    members,
    tasks,
    config,
    planningLifecycle,
  };
};

type StoreContextValue = {
  state: RootState;
  dispatch: AppDispatch;
};

const SprintStoreContext = createContext<StoreContextValue | undefined>(undefined);

export function SprintStoreProvider({ children }: { children: ReactNode }) {
  const [state, baseDispatch] = useReducer(rootReducer, buildEmptyState());
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(false);

  const dispatch = useCallback<AppDispatch>((action) => {
    if (action.type === REPLACE_STATE && action.persist === false) {
      skipNextSave.current = true;
    }
    baseDispatch(action);
  }, [baseDispatch]);

  useEffect(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveTimeout.current = setTimeout(() => {
      void saveActiveSprintState(state);
    }, 300);
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <SprintStoreContext.Provider value={value}>{children}</SprintStoreContext.Provider>;
}

export const useSprintStore = () => {
  const ctx = useContext(SprintStoreContext);
  if (!ctx) {
    throw new Error('SprintStoreProvider is missing');
  }
  return ctx;
};
