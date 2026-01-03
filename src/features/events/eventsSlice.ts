import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { EventItem } from '../../domain/types';

interface EventsState {
  items: EventItem[];
}

const initialState: EventsState = {
  items: [],
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    addEvent(state, action: PayloadAction<EventItem>) {
      state.items.push(action.payload);
    },
    removeEvent(state, action: PayloadAction<string>) {
      state.items = state.items.filter((e) => e.id !== action.payload);
    },
    replaceEvents(_, action: PayloadAction<EventItem[]>) {
      return { items: action.payload };
    },
    resetEvents() {
      return initialState;
    },
  },
});

export const { addEvent, removeEvent, replaceEvents, resetEvents } = eventsSlice.actions;
export default eventsSlice.reducer;
