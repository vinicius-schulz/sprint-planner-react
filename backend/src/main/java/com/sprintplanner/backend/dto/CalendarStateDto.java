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
public class CalendarStateDto {
  private List<String> nonWorkingDaysManual;
  private List<String> nonWorkingDaysRemoved;
  private List<DayScheduleDto> daySchedules;
}
