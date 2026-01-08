import type { RootState, AppDispatch } from './store';
import { useSprintStore } from './store';

export const useAppDispatch = (): AppDispatch => {
  const { dispatch } = useSprintStore();
  return dispatch;
};

export const useAppSelector = <T>(selector: (state: RootState) => T): T => {
  const { state } = useSprintStore();
  return selector(state);
};
