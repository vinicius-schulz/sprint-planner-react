import type { RootPersistedState } from '../domain/types';

const STORAGE_KEY = 'scrum-capacity-state-v1';

export const loadState = (): RootPersistedState | undefined => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return undefined;
    return JSON.parse(serialized) as RootPersistedState;
  } catch (err) {
    console.error('Falha ao carregar estado', err);
    return undefined;
  }
};

export const saveState = (state: RootPersistedState) => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Falha ao salvar estado', err);
  }
};
