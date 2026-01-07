package com.sprintplanner.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMetaDto {
  private String id;
  private String name;
  private String startDate;
  private String endDate;
  private String description;
  private String status;
  private String updatedAt;
}
