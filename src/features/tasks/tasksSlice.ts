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
        updates: Partial<Pick<TaskItem, 'name' | 'assigneeMemberName' | 'storyPoints' | 'dependencies' | 'turboStoryPoints' | 'turboEnabled'>>;
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
      state.items = action.payload;
    },
    resetTasks() {
      return initialState;
    },
  },
});

export const { addTask, removeTask, updateTask, replaceTasks, renameAssignee, setComputedTasks, resetTasks } = tasksSlice.actions;
export default tasksSlice.reducer;
