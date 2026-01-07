package com.sprintplanner.backend.dto;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalConfigDto {
  private int dailyWorkHours;
  private Map<String, Double> seniorityFactors;
  private Map<String, Double> maturityFactors;
  private double storyPointsPerHour;
  private List<String> countedMemberTypes;
  private List<Integer> storyPointScale;
  private double workloadWarningOver;
  private double workloadErrorOver;
  private List<WorkingPeriodDto> defaultWorkingPeriods;
  private String schedulingStrategy;
}
