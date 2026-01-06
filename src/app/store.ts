import { configureStore } from '@reduxjs/toolkit';
import sprintReducer from '../features/sprint/sprintSlice';
import calendarReducer from '../features/calendar/calendarSlice';
import eventsReducer from '../features/events/eventsSlice';
import membersReducer from '../features/members/membersSlice';
import tasksReducer from '../features/tasks/tasksSlice';
import configReducer from '../features/config/configSlice';
import planningLifecycleReducer from '../features/review/planningLifecycleSlice';
import { loadState, saveState } from './persistence';
import type { RootPersistedState } from '../domain/types';

const preloadedState = loadState();

export const store = configureStore({
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
    saveState(state);
  }, 300);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
