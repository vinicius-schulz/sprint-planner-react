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
      state.items = state.items.filter((task) => task.id !== action.payload);
    },
    replaceTasks(state, action: PayloadAction<TaskItem[]>) {
      state.items = action.payload;
    },
    setComputedTasks(state, action: PayloadAction<TaskItem[]>) {
      state.items = action.payload;
    },
    resetTasks() {
      return initialState;
    },
  },
});

export const { addTask, removeTask, replaceTasks, setComputedTasks, resetTasks } = tasksSlice.actions;
export default tasksSlice.reducer;
