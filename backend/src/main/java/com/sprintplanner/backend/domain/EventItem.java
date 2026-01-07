package com.sprintplanner.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventItem {
  private String id;
  private String type;
  private String description;
  private String date;
  private int minutes;
  private boolean recurringDaily;
}
