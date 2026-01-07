package com.sprintplanner.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskWorkSegment {
  private String date;
  private String startTime;
  private String endTime;
  private int minutes;
  private TaskWorkDetail detail;
}
