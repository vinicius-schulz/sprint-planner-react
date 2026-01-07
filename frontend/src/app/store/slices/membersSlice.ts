import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Member } from '../../../domain/types';

interface MembersState {
  items: Member[];
}

const initialState: MembersState = {
  items: [],
};

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    addMember(state, action: PayloadAction<Member>) {
      state.items.push(action.payload);
    },
    updateMember(state, action: PayloadAction<Member>) {
      const idx = state.items.findIndex((m) => m.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    removeMember(state, action: PayloadAction<string>) {
      state.items = state.items.filter((member) => member.id !== action.payload);
    },
    replaceMembers(_, action: PayloadAction<Member[]>) {
      return { items: action.payload };
    },
    resetMembers() {
      return initialState;
    },
  },
});

export const { addMember, updateMember, removeMember, replaceMembers, resetMembers } = membersSlice.actions;
export default membersSlice.reducer;
