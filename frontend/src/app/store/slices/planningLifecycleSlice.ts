import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { INITIAL_PLANNING_LIFECYCLE_STATE } from '../../../domain/constants';
import type { PlanningLifecycleState } from '../../../domain/types';

const initialState: PlanningLifecycleState = { ...INITIAL_PLANNING_LIFECYCLE_STATE };

const planningLifecycleSlice = createSlice({
  name: 'planningLifecycle',
  initialState,
  reducers: {
    closePlanning(state) {
      state.status = 'followup';
      state.closedAt = new Date().toISOString();
    },
    finalizePlanning(state) {
      state.status = 'closed';
      state.closedAt = new Date().toISOString();
    },
    reopenFollowUp(state) {
      state.status = 'followup';
      state.closedAt = new Date().toISOString();
    },
    reopenPlanning(state) {
      state.status = 'editing';
      state.closedAt = undefined;
    },
    setPlanningLifecycleState(_, action: PayloadAction<PlanningLifecycleState>) {
      return action.payload;
    },
    resetPlanningLifecycle() {
      return { ...INITIAL_PLANNING_LIFECYCLE_STATE };
    },
  },
});

export const { closePlanning, finalizePlanning, reopenFollowUp, reopenPlanning, setPlanningLifecycleState, resetPlanningLifecycle } = planningLifecycleSlice.actions;
export default planningLifecycleSlice.reducer;
