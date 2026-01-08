import { EMPTY_SPRINT } from '../../../domain/constants';
import type { SprintState } from '../../../domain/types';
import type { AppAction } from '../actionTypes';

const UPDATE_SPRINT = 'sprint/update';
const RESET_SPRINT = 'sprint/reset';

const initialState: SprintState = { ...EMPTY_SPRINT };

export const updateSprint = (payload: SprintState): AppAction<SprintState> => ({
  type: UPDATE_SPRINT,
  payload,
});

export const resetSprint = (): AppAction => ({
  type: RESET_SPRINT,
});

const sprintReducer = (state: SprintState = initialState, action: AppAction): SprintState => {
  switch (action.type) {
    case UPDATE_SPRINT: {
      const payload = action.payload as SprintState;
      return {
        ...state,
        title: payload.title,
        startDate: payload.startDate,
        endDate: payload.endDate,
      };
    }
    case RESET_SPRINT:
      return { ...initialState };
    default:
      return state;
  }
};

export default sprintReducer;
