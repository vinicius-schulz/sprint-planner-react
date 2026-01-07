import { configureStore } from '@reduxjs/toolkit';
import sprintReducer from './store/slices/sprintSlice';
import calendarReducer from './store/slices/calendarSlice';
import eventsReducer from './store/slices/eventsSlice';
import membersReducer from './store/slices/membersSlice';
import tasksReducer from './store/slices/tasksSlice';
import configReducer from './store/slices/configSlice';
import planningLifecycleReducer from './store/slices/planningLifecycleSlice';
import { saveActiveSprintState, getActiveSprintId } from './sprintLibrary';
import type { RootPersistedState } from '../domain/types';

export const createAppStore = (preloadedState?: RootPersistedState) => {
  const store = configureStore({
    reducer: {
      sprint: sprintReducer,
      calendar: calendarReducer,
      events: eventsReducer,
      members: membersReducer,
      tasks: tasksReducer,
      config: configReducer,
      planningLifecycle: planningLifecycleReducer,
    },
    preloadedState,
  });

  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  store.subscribe(() => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const state = store.getState() as RootPersistedState;
      if (getActiveSprintId()) {
        void saveActiveSprintState(state);
      }
    }, 300);
  });

  return store;
};

export type RootState = ReturnType<ReturnType<typeof createAppStore>['getState']>;
export type AppDispatch = ReturnType<typeof createAppStore>['dispatch'];
