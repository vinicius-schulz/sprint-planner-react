import type { GlobalConfig, SprintState } from './types';

export const DEFAULT_CONFIG: GlobalConfig = {
  dailyWorkHours: 8,
  seniorityFactors: { 'Sênior': 1.0, Pleno: 0.8, 'Júnior': 0.6 },
  maturityFactors: { Plena: 1.0, Mediana: 0.8, Inicial: 0.6 },
  storyPointsPerHour: 0.33333333, // 1 SP = 3 hours
  countedMemberTypes: ['Desenvolvedor'],
  storyPointScale: [0, 1, 2, 3, 5, 8, 13],
  workloadWarningOver: 0.05,
  workloadErrorOver: 0.1,
  defaultWorkingPeriods: [
    { start: '08:00', end: '12:00' },
    { start: '13:00', end: '17:00' },
  ],
};

export const EMPTY_SPRINT: SprintState = {
  title: 'Sprint sem título',
  startDate: '',
  endDate: '',
};
