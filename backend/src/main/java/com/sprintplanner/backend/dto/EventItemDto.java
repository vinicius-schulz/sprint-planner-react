package com.sprintplanner.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventItemDto {
  private String id;
  private String type;
  private String description;
  private String date;
  private int minutes;
  private boolean recurringDaily;
}
