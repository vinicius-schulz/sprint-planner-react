package com.sprintplanner.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RootPersistedState {
  private SprintState sprint;
  private CalendarState calendar;
  private EventsState events;
  private MembersState members;
  private TasksState tasks;
  private ConfigState config;
  private PlanningLifecycleState planningLifecycle;
}
