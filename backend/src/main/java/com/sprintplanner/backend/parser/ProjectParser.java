package com.sprintplanner.backend.parser;

import com.sprintplanner.backend.domain.Project;
import com.sprintplanner.backend.dto.ProjectInputDto;
import com.sprintplanner.backend.dto.ProjectMetaDto;
import org.springframework.stereotype.Component;

@Component
public class ProjectParser {
  public Project toDomain(ProjectInputDto input) {
    if (input == null) {
      return null;
    }
    return Project.builder()
      .name(input.getName())
      .startDate(input.getStartDate())
      .endDate(input.getEndDate())
      .description(input.getDescription())
      .status(input.getStatus())
      .build();
  }

  public Project toDomain(ProjectMetaDto input) {
    if (input == null) {
      return null;
    }
    return Project.builder()
      .id(input.getId())
      .name(input.getName())
      .startDate(input.getStartDate())
      .endDate(input.getEndDate())
      .description(input.getDescription())
      .status(input.getStatus())
      .updatedAt(input.getUpdatedAt())
      .build();
  }

  public ProjectMetaDto toDto(Project project) {
    if (project == null) {
      return null;
    }
    return ProjectMetaDto.builder()
      .id(project.getId())
      .name(project.getName())
      .startDate(project.getStartDate())
      .endDate(project.getEndDate())
      .description(project.getDescription())
      .status(project.getStatus())
      .updatedAt(project.getUpdatedAt())
      .build();
  }
}
