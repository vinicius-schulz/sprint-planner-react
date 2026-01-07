package com.sprintplanner.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintMetaDto {
  private String id;
  private String title;
  private String startDate;
  private String endDate;
  private String updatedAt;
  private String status;
  private String projectId;
}
