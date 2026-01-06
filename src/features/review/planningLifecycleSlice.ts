import { createSlice } from '@reduxjs/toolkit';
import { INITIAL_PLANNING_LIFECYCLE_STATE } from '../../domain/constants';
import type { PlanningLifecycleState } from '../../domain/types';

const initialState: PlanningLifecycleState = { ...INITIAL_PLANNING_LIFECYCLE_STATE };

const planningLifecycleSlice = createSlice({
  name: 'planningLifecycle',
  initialState,
  reducers: {
    closePlanning(state) {
      state.status = 'closed';
      state.closedAt = new Date().toISOString();
    },
    reopenPlanning(state) {
      state.status = 'editing';
      state.closedAt = undefined;
    },
    resetPlanningLifecycle() {
      return { ...INITIAL_PLANNING_LIFECYCLE_STATE };
    },
  },
});

export const { closePlanning, reopenPlanning, resetPlanningLifecycle } = planningLifecycleSlice.actions;
export default planningLifecycleSlice.reducer;
