import { updateSprint } from './store/slices/sprintSlice';
import { replaceCalendar } from './store/slices/calendarSlice';
import { replaceEvents } from './store/slices/eventsSlice';
import { replaceMembers } from './store/slices/membersSlice';
import { replaceTasks } from './store/slices/tasksSlice';
import { updateConfig } from './store/slices/configSlice';
import { setPlanningLifecycleState } from './store/slices/planningLifecycleSlice';
import type { RootPersistedState } from '../domain/types';
import type { AppDispatch } from './store';

export const hydrateStoreFromState = (dispatch: AppDispatch, state: RootPersistedState) => {
    dispatch(updateSprint(state.sprint));
    dispatch(replaceCalendar(state.calendar));
    dispatch(replaceEvents(state.events.items));
    dispatch(replaceMembers(state.members.items));
    dispatch(replaceTasks(state.tasks.items));
    dispatch(updateConfig(state.config.value));
    dispatch(setPlanningLifecycleState(state.planningLifecycle));
};
