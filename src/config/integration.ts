export type IntegrationMode = 'local' | 'api';

export const integrationConfig = {
  mode: (import.meta.env.VITE_INTEGRATION_MODE as IntegrationMode) ?? 'local',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
};

export const isApiEnabled = integrationConfig.mode === 'api';
