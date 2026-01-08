import type { TaskItem } from '../../../domain/types';
import type { AppAction } from '../actionTypes';

const ADD_TASK = 'tasks/add';
const REMOVE_TASK = 'tasks/remove';
const UPDATE_TASK = 'tasks/update';
const REPLACE_TASKS = 'tasks/replace';
const RENAME_ASSIGNEE = 'tasks/renameAssignee';
const RESET_FOLLOW_UP_DATA = 'tasks/resetFollowUpData';
const SET_COMPUTED_TASKS = 'tasks/setComputed';
const RESET_TASKS = 'tasks/reset';

interface TasksState {
  items: TaskItem[];
}

const initialState: TasksState = {
  items: [],
};

export const addTask = (payload: TaskItem): AppAction<TaskItem> => ({
  type: ADD_TASK,
  payload,
});

export const removeTask = (payload: string): AppAction<string> => ({
  type: REMOVE_TASK,
  payload,
});

export const updateTask = (
  payload: {
    id: string;
    updates: Partial<Pick<
      TaskItem,
      'name' | 'assigneeMemberName' | 'storyPoints' | 'dependencies' | 'turboStoryPoints' | 'turboEnabled' | 'dueDate' | 'status' | 'completedAt'
    >>;
  },
): AppAction<typeof payload> => ({
  type: UPDATE_TASK,
  payload,
});

export const replaceTasks = (payload: TaskItem[]): AppAction<TaskItem[]> => ({
  type: REPLACE_TASKS,
  payload,
});

export const renameAssignee = (payload: { oldName: string; newName: string }): AppAction<typeof payload> => ({
  type: RENAME_ASSIGNEE,
  payload,
});

export const resetFollowUpData = (): AppAction => ({
  type: RESET_FOLLOW_UP_DATA,
});

export const setComputedTasks = (payload: TaskItem[]): AppAction<TaskItem[]> => ({
  type: SET_COMPUTED_TASKS,
  payload,
});

export const resetTasks = (): AppAction => ({
  type: RESET_TASKS,
});

const tasksReducer = (state: TasksState = initialState, action: AppAction): TasksState => {
  switch (action.type) {
    case ADD_TASK:
      return { ...state, items: [...state.items, action.payload as TaskItem] };
    case REMOVE_TASK: {
      const removedId = action.payload as string;
      const filtered = state.items.filter((task) => task.id !== removedId);
      const cleaned = filtered.map((task) => ({
        ...task,
        dependencies: (task.dependencies ?? []).filter((depId) => depId !== removedId),
      }));
      return { ...state, items: cleaned };
    }
    case UPDATE_TASK: {
      const { id, updates } = action.payload as {
        id: string;
        updates: Partial<Pick<
          TaskItem,
          'name' | 'assigneeMemberName' | 'storyPoints' | 'dependencies' | 'turboStoryPoints' | 'turboEnabled' | 'dueDate' | 'status' | 'completedAt'
        >>;
      };
      const idx = state.items.findIndex((task) => task.id === id);
      if (idx === -1) return state;
      const current = state.items[idx];
      const affectsScheduling =
        Object.prototype.hasOwnProperty.call(updates, 'name') ||
        Object.prototype.hasOwnProperty.call(updates, 'assigneeMemberName') ||
        Object.prototype.hasOwnProperty.call(updates, 'storyPoints') ||
        Object.prototype.hasOwnProperty.call(updates, 'dependencies') ||
        Object.prototype.hasOwnProperty.call(updates, 'turboStoryPoints') ||
        Object.prototype.hasOwnProperty.call(updates, 'turboEnabled') ||
        Object.prototype.hasOwnProperty.call(updates, 'dueDate');

      const nextItems = state.items.slice();
      nextItems[idx] = {
        ...current,
        ...updates,
        computedStartDate: affectsScheduling ? undefined : current.computedStartDate,
        computedEndDate: affectsScheduling ? undefined : current.computedEndDate,
        computedTimeline: affectsScheduling ? undefined : current.computedTimeline,
      };
      return { ...state, items: nextItems };
    }
    case REPLACE_TASKS:
      return { ...state, items: action.payload as TaskItem[] };
    case RENAME_ASSIGNEE: {
      const { oldName, newName } = action.payload as { oldName: string; newName: string };
      return {
        ...state,
        items: state.items.map((task) =>
          task.assigneeMemberName === oldName ? { ...task, assigneeMemberName: newName } : task,
        ),
      };
    }
    case RESET_FOLLOW_UP_DATA:
      return {
        ...state,
        items: state.items.map((task) => ({
          ...task,
          status: undefined,
          completedAt: undefined,
        })),
      };
    case SET_COMPUTED_TASKS: {
      const computedItems = action.payload as TaskItem[];
      const byId = new Map(computedItems.map((t) => [t.id, t] as const));
      return {
        ...state,
        items: state.items.map((task) => {
          const computed = byId.get(task.id);
          if (!computed) {
            return {
              ...task,
              computedStartDate: undefined,
              computedEndDate: undefined,
              computedTimeline: undefined,
            };
          }
          return {
            ...task,
            computedStartDate: computed.computedStartDate,
            computedEndDate: computed.computedEndDate,
            computedTimeline: computed.computedTimeline,
          };
        }),
      };
    }
    case RESET_TASKS:
      return { ...initialState };
    default:
      return state;
  }
};

export default tasksReducer;
