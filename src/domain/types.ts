export type DateString = string;

export type EventType =
  | 'Planning'
  | 'Refinamento'
  | 'Review'
  | 'Retrospectiva'
  | 'Daily'
  | 'Outros';

export interface MemberEvent {
  id: string;
  minutes: number; // duração do evento de indisponibilidade
  description?: string;
}

export interface Sprint {
  title: string;
  startDate: DateString;
  endDate: DateString;
}

export type PlanningStatus = 'editing' | 'followup' | 'closed';

export interface PlanningLifecycleState {
  status: PlanningStatus;
  closedAt?: DateString;
}

export interface CalendarState {
  nonWorkingDaysManual: DateString[];
  nonWorkingDaysRemoved: DateString[];
  daySchedules: DaySchedule[];
}

export interface SprintState extends Sprint { }

export interface EventItem {
  id: string;
  type: EventType;
  description?: string;
  date: DateString;
  minutes: number;
  recurringDaily: boolean;
}

export interface Member {
  id: string;
  name: string;
  roleType: string;
  seniority: 'Sênior' | 'Pleno' | 'Júnior';
  maturity: 'Plena' | 'Mediana' | 'Inicial';
  availabilityPercent: number;
  useAdvancedAvailability?: boolean;
  availabilityEvents?: MemberEvent[];
}

export interface TaskItem {
  id: string;
  name: string;
  assigneeMemberName?: string;
  storyPoints: number;
  dueDate?: DateString;
  turboStoryPoints?: number;
  turboEnabled?: boolean;
  dependencies: string[];
  status?: 'todo' | 'doing' | 'done';
  completedAt?: DateString;
  computedStartDate?: DateString;
  computedEndDate?: DateString;
  computedTimeline?: TaskWorkSegment[];
}

export interface TaskWorkSegment {
  date: DateString;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  minutes: number;
  detail?: TaskWorkDetail;
}

export interface TaskWorkDetail {
  periods: WorkingPeriod[];
  baseMinutes: number;
  eventMinutes: number;
  recurringMinutes: number;
  capacityMinutes: number;
  availabilityPercent: number;
  seniorityFactor: number;
  maturityFactor: number;
  usedBeforeMinutes: number;
  events: { label: string; minutes: number }[];
}

export type SchedulingStrategy = 'EDD' | 'SPT' | 'BLOCKERS' | 'HYBRID';

export interface GlobalConfig {
  dailyWorkHours: number;
  seniorityFactors: Record<string, number>;
  maturityFactors: Record<string, number>;
  storyPointsPerHour: number;
  countedMemberTypes: string[];
  storyPointScale: number[];
  workloadWarningOver: number; // fraction over 1.0 (e.g., 0.1 => 10%)
  workloadErrorOver: number;   // fraction over 1.0 for red threshold
  defaultWorkingPeriods: WorkingPeriod[];
  schedulingStrategy?: SchedulingStrategy;
}

export interface WorkingPeriod {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface DaySchedule {
  date: DateString;
  isNonWorking: boolean;
  periods: WorkingPeriod[];
}

export interface RootPersistedState {
  sprint: SprintState;
  calendar: CalendarState;
  events: { items: EventItem[] };
  members: { items: Member[] };
  tasks: { items: TaskItem[] };
  config: { value: GlobalConfig };
  planningLifecycle: PlanningLifecycleState;
}
