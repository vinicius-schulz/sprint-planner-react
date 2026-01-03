import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CalendarState, DateString } from '../../domain/types';

const initialState: CalendarState = {
  nonWorkingDaysManual: [],
  nonWorkingDaysRemoved: [],
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    addManualNonWorkingDay(state, action: PayloadAction<DateString>) {
      if (!state.nonWorkingDaysManual.includes(action.payload)) {
        state.nonWorkingDaysManual.push(action.payload);
      }
    },
    removeManualNonWorkingDay(state, action: PayloadAction<DateString>) {
      state.nonWorkingDaysManual = state.nonWorkingDaysManual.filter((d) => d !== action.payload);
    },
    addRemovedWeekend(state, action: PayloadAction<DateString>) {
      if (!state.nonWorkingDaysRemoved.includes(action.payload)) {
        state.nonWorkingDaysRemoved.push(action.payload);
      }
    },
    removeRemovedWeekend(state, action: PayloadAction<DateString>) {
      state.nonWorkingDaysRemoved = state.nonWorkingDaysRemoved.filter((d) => d !== action.payload);
    },
    replaceCalendar(_, action: PayloadAction<CalendarState>) {
      return action.payload;
    },
    resetCalendar() {
      return initialState;
    },
  },
});

export const {
  addManualNonWorkingDay,
  removeManualNonWorkingDay,
  addRemovedWeekend,
  removeRemovedWeekend,
  replaceCalendar,
  resetCalendar,
} = calendarSlice.actions;

export default calendarSlice.reducer;
