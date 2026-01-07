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
public class TaskItem {
  private String id;
  private String name;
  private String assigneeMemberName;
  private double storyPoints;
  private String dueDate;
  private Double turboStoryPoints;
  private Boolean turboEnabled;
  private List<String> dependencies;
  private String status;
  private String completedAt;
  private String computedStartDate;
  private String computedEndDate;
  private List<TaskWorkSegment> computedTimeline;
}
