import type { GlobalConfig, SprintState } from './types';

export const DEFAULT_CONFIG: GlobalConfig = {
  dailyWorkHours: 8,
  seniorityFactors: { 'Sênior': 1.0, Pleno: 0.8, 'Júnior': 0.6 },
  maturityFactors: { Plena: 1.0, Mediana: 0.8, Inicial: 0.6 },
  storyPointsPerHour: 0.25,
  countedMemberTypes: ['Desenvolvedor', 'Tester'],
  storyPointScale: [0, 1, 3, 5, 8, 13, 21],
  workloadWarningOver: 0.1,
  workloadErrorOver: 0.2,
};

export const EMPTY_SPRINT: SprintState = {
  title: 'Sprint sem título',
  startDate: '',
  endDate: '',
};
