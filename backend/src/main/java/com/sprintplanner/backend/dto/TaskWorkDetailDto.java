package com.sprintplanner.backend.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskWorkDetailDto {
  private List<WorkingPeriodDto> periods;
  private int baseMinutes;
  private int eventMinutes;
  private int recurringMinutes;
  private int capacityMinutes;
  private double availabilityPercent;
  private double seniorityFactor;
  private double maturityFactor;
  private int usedBeforeMinutes;
  private List<TaskWorkEventDto> events;
}
