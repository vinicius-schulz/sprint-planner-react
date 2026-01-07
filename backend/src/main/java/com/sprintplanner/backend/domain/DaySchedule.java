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
public class DaySchedule {
  private String date;
  private boolean isNonWorking;
  private List<WorkingPeriod> periods;
}
