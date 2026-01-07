package com.sprintplanner.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RootPersistedStateDto {
  private SprintStateDto sprint;
  private CalendarStateDto calendar;
  private EventsStateDto events;
  private MembersStateDto members;
  private TasksStateDto tasks;
  private ConfigStateDto config;
  private PlanningLifecycleStateDto planningLifecycle;
}
