package com.sprintplanner.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskWorkSegmentDto {
  private String date;
  private String startTime;
  private String endTime;
  private int minutes;
  private TaskWorkDetailDto detail;
}
