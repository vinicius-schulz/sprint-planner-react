import type { CalendarState, DateString, DaySchedule } from '../../../domain/types';
import type { AppAction } from '../actionTypes';

const ADD_MANUAL_NON_WORKING_DAY = 'calendar/addManualNonWorkingDay';
const REMOVE_MANUAL_NON_WORKING_DAY = 'calendar/removeManualNonWorkingDay';
const ADD_REMOVED_WEEKEND = 'calendar/addRemovedWeekend';
const REMOVE_REMOVED_WEEKEND = 'calendar/removeRemovedWeekend';
const REPLACE_CALENDAR = 'calendar/replace';
const SET_DAY_SCHEDULES = 'calendar/setDaySchedules';
const UPDATE_DAY_SCHEDULE = 'calendar/updateDaySchedule';
const RESET_CALENDAR = 'calendar/reset';

const initialState: CalendarState = {
  nonWorkingDaysManual: [],
  nonWorkingDaysRemoved: [],
  daySchedules: [],
};

export const addManualNonWorkingDay = (payload: DateString): AppAction<DateString> => ({
  type: ADD_MANUAL_NON_WORKING_DAY,
  payload,
});

export const removeManualNonWorkingDay = (payload: DateString): AppAction<DateString> => ({
  type: REMOVE_MANUAL_NON_WORKING_DAY,
  payload,
});

export const addRemovedWeekend = (payload: DateString): AppAction<DateString> => ({
  type: ADD_REMOVED_WEEKEND,
  payload,
});

export const removeRemovedWeekend = (payload: DateString): AppAction<DateString> => ({
  type: REMOVE_REMOVED_WEEKEND,
  payload,
});

export const replaceCalendar = (payload: CalendarState): AppAction<CalendarState> => ({
  type: REPLACE_CALENDAR,
  payload,
});

export const setDaySchedules = (payload: DaySchedule[]): AppAction<DaySchedule[]> => ({
  type: SET_DAY_SCHEDULES,
  payload,
});

export const updateDaySchedule = (payload: DaySchedule): AppAction<DaySchedule> => ({
  type: UPDATE_DAY_SCHEDULE,
  payload,
});

export const resetCalendar = (): AppAction => ({
  type: RESET_CALENDAR,
});

const calendarReducer = (state: CalendarState = initialState, action: AppAction): CalendarState => {
  switch (action.type) {
    case ADD_MANUAL_NON_WORKING_DAY: {
      const date = action.payload as DateString;
      if (state.nonWorkingDaysManual.includes(date)) {
        return state;
      }
      return {
        ...state,
        nonWorkingDaysManual: [...state.nonWorkingDaysManual, date],
      };
    }
    case REMOVE_MANUAL_NON_WORKING_DAY: {
      const date = action.payload as DateString;
      return {
        ...state,
        nonWorkingDaysManual: state.nonWorkingDaysManual.filter((d) => d !== date),
      };
    }
    case ADD_REMOVED_WEEKEND: {
      const date = action.payload as DateString;
      if (state.nonWorkingDaysRemoved.includes(date)) {
        return state;
      }
      return {
        ...state,
        nonWorkingDaysRemoved: [...state.nonWorkingDaysRemoved, date],
      };
    }
    case REMOVE_REMOVED_WEEKEND: {
      const date = action.payload as DateString;
      return {
        ...state,
        nonWorkingDaysRemoved: state.nonWorkingDaysRemoved.filter((d) => d !== date),
      };
    }
    case REPLACE_CALENDAR:
      return action.payload as CalendarState;
    case SET_DAY_SCHEDULES:
      return { ...state, daySchedules: action.payload as DaySchedule[] };
    case UPDATE_DAY_SCHEDULE: {
      const updated = action.payload as DaySchedule;
      const idx = state.daySchedules.findIndex((d) => d.date === updated.date);
      if (idx === -1) return state;
      const nextSchedules = state.daySchedules.slice();
      nextSchedules[idx] = updated;
      return { ...state, daySchedules: nextSchedules };
    }
    case RESET_CALENDAR:
      return { ...initialState };
    default:
      return state;
  }
};

export default calendarReducer;
