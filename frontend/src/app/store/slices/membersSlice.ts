import type { Member } from '../../../domain/types';
import type { AppAction } from '../actionTypes';

const ADD_MEMBER = 'members/add';
const UPDATE_MEMBER = 'members/update';
const REMOVE_MEMBER = 'members/remove';
const REPLACE_MEMBERS = 'members/replace';
const RESET_MEMBERS = 'members/reset';

interface MembersState {
  items: Member[];
}

const initialState: MembersState = {
  items: [],
};

export const addMember = (payload: Member): AppAction<Member> => ({
  type: ADD_MEMBER,
  payload,
});

export const updateMember = (payload: Member): AppAction<Member> => ({
  type: UPDATE_MEMBER,
  payload,
});

export const removeMember = (payload: string): AppAction<string> => ({
  type: REMOVE_MEMBER,
  payload,
});

export const replaceMembers = (payload: Member[]): AppAction<Member[]> => ({
  type: REPLACE_MEMBERS,
  payload,
});

export const resetMembers = (): AppAction => ({
  type: RESET_MEMBERS,
});

const membersReducer = (state: MembersState = initialState, action: AppAction): MembersState => {
  switch (action.type) {
    case ADD_MEMBER:
      return { ...state, items: [...state.items, action.payload as Member] };
    case UPDATE_MEMBER: {
      const updated = action.payload as Member;
      const idx = state.items.findIndex((m) => m.id === updated.id);
      if (idx === -1) return state;
      const nextItems = state.items.slice();
      nextItems[idx] = updated;
      return { ...state, items: nextItems };
    }
    case REMOVE_MEMBER: {
      const id = action.payload as string;
      return { ...state, items: state.items.filter((member) => member.id !== id) };
    }
    case REPLACE_MEMBERS:
      return { items: action.payload as Member[] };
    case RESET_MEMBERS:
      return { ...initialState };
    default:
      return state;
  }
};

export default membersReducer;
