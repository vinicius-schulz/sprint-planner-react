package com.sprintplanner.backend.domain;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskWorkDetail {
  private List<WorkingPeriod> periods;
  private int baseMinutes;
  private int eventMinutes;
  private int recurringMinutes;
  private int capacityMinutes;
  private double availabilityPercent;
  private double seniorityFactor;
  private double maturityFactor;
  private int usedBeforeMinutes;
  private List<TaskWorkEvent> events;
}
