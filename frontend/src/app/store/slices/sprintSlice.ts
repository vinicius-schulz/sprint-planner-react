import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { EMPTY_SPRINT } from '../../../domain/constants';
import type { SprintState } from '../../../domain/types';

const initialState: SprintState = { ...EMPTY_SPRINT };

const sprintSlice = createSlice({
  name: 'sprint',
  initialState,
  reducers: {
    updateSprint(state, action: PayloadAction<SprintState>) {
      state.title = action.payload.title;
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
    },
    resetSprint(state) {
      state.title = initialState.title;
      state.startDate = initialState.startDate;
      state.endDate = initialState.endDate;
    },
  },
});

export const { updateSprint, resetSprint } = sprintSlice.actions;
export default sprintSlice.reducer;
