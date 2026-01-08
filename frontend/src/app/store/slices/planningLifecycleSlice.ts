import { INITIAL_PLANNING_LIFECYCLE_STATE } from '../../../domain/constants';
import type { PlanningLifecycleState } from '../../../domain/types';
import type { AppAction } from '../actionTypes';

const CLOSE_PLANNING = 'planningLifecycle/close';
const FINALIZE_PLANNING = 'planningLifecycle/finalize';
const REOPEN_FOLLOWUP = 'planningLifecycle/reopenFollowup';
const REOPEN_PLANNING = 'planningLifecycle/reopenPlanning';
const SET_PLANNING_LIFECYCLE_STATE = 'planningLifecycle/set';
const RESET_PLANNING_LIFECYCLE = 'planningLifecycle/reset';

const initialState: PlanningLifecycleState = { ...INITIAL_PLANNING_LIFECYCLE_STATE };

export const closePlanning = (): AppAction => ({
  type: CLOSE_PLANNING,
});

export const finalizePlanning = (): AppAction => ({
  type: FINALIZE_PLANNING,
});

export const reopenFollowUp = (): AppAction => ({
  type: REOPEN_FOLLOWUP,
});

export const reopenPlanning = (): AppAction => ({
  type: REOPEN_PLANNING,
});

export const setPlanningLifecycleState = (payload: PlanningLifecycleState): AppAction<PlanningLifecycleState> => ({
  type: SET_PLANNING_LIFECYCLE_STATE,
  payload,
});

export const resetPlanningLifecycle = (): AppAction => ({
  type: RESET_PLANNING_LIFECYCLE,
});

const planningLifecycleReducer = (
  state: PlanningLifecycleState = initialState,
  action: AppAction,
): PlanningLifecycleState => {
  switch (action.type) {
    case CLOSE_PLANNING:
      return { status: 'followup', closedAt: new Date().toISOString() };
    case FINALIZE_PLANNING:
      return { status: 'closed', closedAt: new Date().toISOString() };
    case REOPEN_FOLLOWUP:
      return { status: 'followup', closedAt: new Date().toISOString() };
    case REOPEN_PLANNING:
      return { status: 'editing', closedAt: undefined };
    case SET_PLANNING_LIFECYCLE_STATE:
      return action.payload as PlanningLifecycleState;
    case RESET_PLANNING_LIFECYCLE:
      return { ...INITIAL_PLANNING_LIFECYCLE_STATE };
    default:
      return state;
  }
};

export default planningLifecycleReducer;
