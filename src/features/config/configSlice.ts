import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_CONFIG } from '../../domain/constants';
import type { GlobalConfig } from '../../domain/types';

interface ConfigState {
  value: GlobalConfig;
}

const initialState: ConfigState = {
  value: DEFAULT_CONFIG,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    updateConfig(state, action: PayloadAction<GlobalConfig>) {
      state.value = action.payload;
    },
    resetConfig() {
      return initialState;
    },
  },
});

export const { updateConfig, resetConfig } = configSlice.actions;
export default configSlice.reducer;
