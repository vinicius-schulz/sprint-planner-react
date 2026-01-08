import { updateSprint } from './store/slices/sprintSlice';
import { replaceCalendar } from './store/slices/calendarSlice';
import { replaceEvents } from './store/slices/eventsSlice';
import { replaceMembers } from './store/slices/membersSlice';
import { replaceTasks } from './store/slices/tasksSlice';
import { updateConfig } from './store/slices/configSlice';
import { setPlanningLifecycleState } from './store/slices/planningLifecycleSlice';
import type { RootPersistedState } from '../domain/types';
import type { AppDispatch } from './store';
import { DEFAULT_CONFIG, EMPTY_SPRINT, INITIAL_PLANNING_LIFECYCLE_STATE } from '../domain/constants';
import { buildDaySchedules } from '../domain/services/workingCalendar';

export const normalizePersistedState = (state: RootPersistedState): RootPersistedState => {
    const sprint = {
        title: state.sprint?.title ?? EMPTY_SPRINT.title,
        startDate: state.sprint?.startDate ?? EMPTY_SPRINT.startDate,
        endDate: state.sprint?.endDate ?? EMPTY_SPRINT.endDate,
    };
    const configValue = { ...DEFAULT_CONFIG, ...(state.config?.value ?? {}) };
    const calendarBase = {
        nonWorkingDaysManual: state.calendar?.nonWorkingDaysManual ?? [],
        nonWorkingDaysRemoved: state.calendar?.nonWorkingDaysRemoved ?? [],
        daySchedules: state.calendar?.daySchedules ?? [],
    };
    const daySchedules = sprint.startDate && sprint.endDate
        ? buildDaySchedules(sprint, configValue, calendarBase.daySchedules)
        : calendarBase.daySchedules.map((day) => ({
            ...day,
            isNonWorking: Boolean(day.isNonWorking),
            periods: day.periods ?? [],
        }));
    const defaultStoryPoints = configValue.storyPointScale?.[0] ?? DEFAULT_CONFIG.storyPointScale[0] ?? 0;
    const tasks = (state.tasks?.items ?? []).map((task) => ({
        ...task,
        name: task.name ?? '',
        storyPoints: Number.isFinite(task.storyPoints) ? task.storyPoints : defaultStoryPoints,
        dependencies: task.dependencies ?? [],
    }));
    const members = (state.members?.items ?? []).map((member) => ({
        ...member,
        availabilityPercent: Number.isFinite(member.availabilityPercent) ? member.availabilityPercent : 100,
        availabilityEvents: member.availabilityEvents ?? [],
        useAdvancedAvailability: Boolean(member.useAdvancedAvailability),
    }));

    return {
        sprint,
        calendar: { ...calendarBase, daySchedules },
        events: { items: state.events?.items ?? [] },
        members: { items: members },
        tasks: { items: tasks },
        config: { value: configValue },
        planningLifecycle: {
            status: state.planningLifecycle?.status ?? INITIAL_PLANNING_LIFECYCLE_STATE.status,
            closedAt: state.planningLifecycle?.closedAt,
        },
    };
};

export const hydrateStoreFromState = (dispatch: AppDispatch, state: RootPersistedState) => {
    const normalized = normalizePersistedState(state);
    dispatch(updateSprint(normalized.sprint));
    dispatch(replaceCalendar(normalized.calendar));
    dispatch(replaceEvents(normalized.events.items));
    dispatch(replaceMembers(normalized.members.items));
    dispatch(replaceTasks(normalized.tasks.items));
    dispatch(updateConfig(normalized.config.value));
    dispatch(setPlanningLifecycleState(normalized.planningLifecycle));
};
