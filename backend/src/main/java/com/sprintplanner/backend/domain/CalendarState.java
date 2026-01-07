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
public class CalendarState {
  private List<String> nonWorkingDaysManual;
  private List<String> nonWorkingDaysRemoved;
  private List<DaySchedule> daySchedules;
}
