import { updateSprint } from '../features/sprint/sprintSlice';
import { replaceCalendar } from '../features/calendar/calendarSlice';
import { replaceEvents } from '../features/events/eventsSlice';
import { replaceMembers } from '../features/members/membersSlice';
import { replaceTasks } from '../features/tasks/tasksSlice';
import { updateConfig } from '../features/config/configSlice';
import { setPlanningLifecycleState } from '../features/review/planningLifecycleSlice';
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
