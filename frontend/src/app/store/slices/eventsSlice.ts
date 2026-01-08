import type { EventItem } from '../../../domain/types';
import type { AppAction } from '../actionTypes';

const ADD_EVENT = 'events/add';
const REMOVE_EVENT = 'events/remove';
const REPLACE_EVENTS = 'events/replace';
const RESET_EVENTS = 'events/reset';

interface EventsState {
  items: EventItem[];
}

const initialState: EventsState = {
  items: [],
};

export const addEvent = (payload: EventItem): AppAction<EventItem> => ({
  type: ADD_EVENT,
  payload,
});

export const removeEvent = (payload: string): AppAction<string> => ({
  type: REMOVE_EVENT,
  payload,
});

export const replaceEvents = (payload: EventItem[]): AppAction<EventItem[]> => ({
  type: REPLACE_EVENTS,
  payload,
});

export const resetEvents = (): AppAction => ({
  type: RESET_EVENTS,
});

const eventsReducer = (state: EventsState = initialState, action: AppAction): EventsState => {
  switch (action.type) {
    case ADD_EVENT:
      return { ...state, items: [...state.items, action.payload as EventItem] };
    case REMOVE_EVENT: {
      const id = action.payload as string;
      return { ...state, items: state.items.filter((e) => e.id !== id) };
    }
    case REPLACE_EVENTS:
      return { items: action.payload as EventItem[] };
    case RESET_EVENTS:
      return { ...initialState };
    default:
      return state;
  }
};

export default eventsReducer;
