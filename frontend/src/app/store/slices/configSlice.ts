import { DEFAULT_CONFIG } from '../../../domain/constants';
import type { GlobalConfig } from '../../../domain/types';
import type { AppAction } from '../actionTypes';

const UPDATE_CONFIG = 'config/update';
const RESET_CONFIG = 'config/reset';

interface ConfigState {
  value: GlobalConfig;
}

const initialState: ConfigState = {
  value: DEFAULT_CONFIG,
};

export const updateConfig = (payload: GlobalConfig): AppAction<GlobalConfig> => ({
  type: UPDATE_CONFIG,
  payload,
});

export const resetConfig = (): AppAction => ({
  type: RESET_CONFIG,
});

const configReducer = (state: ConfigState = initialState, action: AppAction): ConfigState => {
  switch (action.type) {
    case UPDATE_CONFIG:
      return { ...state, value: action.payload as GlobalConfig };
    case RESET_CONFIG:
      return { ...initialState };
    default:
      return state;
  }
};

export default configReducer;
