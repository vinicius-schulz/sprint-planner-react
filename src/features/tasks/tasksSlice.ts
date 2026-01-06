import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TaskItem } from '../../domain/types';

interface TasksState {
  items: TaskItem[];
}

const initialState: TasksState = {
  items: [],
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask(state, action: PayloadAction<TaskItem>) {
      state.items.push(action.payload);
    },
    removeTask(state, action: PayloadAction<string>) {
      const removedId = action.payload;
      state.items = state.items.filter((task) => task.id !== removedId);
      state.items.forEach((task) => {
        task.dependencies = task.dependencies.filter((depId) => depId !== removedId);
      });
    },
    updateTask(
      state,
      action: PayloadAction<{
        id: string;
        updates: Partial<Pick<TaskItem, 'name' | 'assigneeMemberName' | 'storyPoints' | 'dependencies' | 'turboStoryPoints' | 'turboEnabled' | 'dueDate'>>;
      }>,
    ) {
      const { id, updates } = action.payload;
      const idx = state.items.findIndex((task) => task.id === id);
      if (idx === -1) return;
      const current = state.items[idx];
      state.items[idx] = {
        ...current,
        ...updates,
        computedStartDate: undefined,
        computedEndDate: undefined,
      };
    },
    replaceTasks(state, action: PayloadAction<TaskItem[]>) {
      state.items = action.payload;
    },
    renameAssignee(state, action: PayloadAction<{ oldName: string; newName: string }>) {
      const { oldName, newName } = action.payload;
      state.items = state.items.map((task) =>
        task.assigneeMemberName === oldName ? { ...task, assigneeMemberName: newName } : task,
      );
    },
    setComputedTasks(state, action: PayloadAction<TaskItem[]>) {
      const byId = new Map(action.payload.map((t) => [t.id, t] as const));
      state.items = state.items.map((t) => {
        const computed = byId.get(t.id);
        if (!computed) {
          return {
            ...t,
            computedStartDate: undefined,
            computedEndDate: undefined,
            computedTimeline: undefined,
          };
        }
        return {
          ...t,
          computedStartDate: computed.computedStartDate,
          computedEndDate: computed.computedEndDate,
          computedTimeline: computed.computedTimeline,
        };
      });
    },
    resetTasks() {
      return initialState;
    },
  },
});

export const { addTask, removeTask, updateTask, replaceTasks, renameAssignee, setComputedTasks, resetTasks } = tasksSlice.actions;
export default tasksSlice.reducer;
