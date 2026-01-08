package com.sprintplanner.backend.service;

import com.sprintplanner.backend.entitycomponent.ProjectEntityComponent;
import com.sprintplanner.backend.entitycomponent.SprintEntityComponent;
import com.sprintplanner.backend.domain.Project;
import com.sprintplanner.backend.dto.ProjectInputDto;
import com.sprintplanner.backend.dto.ProjectMetaDto;
import com.sprintplanner.backend.parser.ProjectParser;
import com.sprintplanner.backend.util.DateTimeUtil;
import com.sprintplanner.backend.util.IdGenerator;
import com.sprintplanner.backend.validators.ProjectValidator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {
  private final ProjectEntityComponent projectEntityComponent;
  private final SprintEntityComponent sprintEntityComponent;
  private final ProjectParser projectParser;
  private final ProjectValidator projectValidator;

  public ProjectService(
    ProjectEntityComponent projectEntityComponent,
    SprintEntityComponent sprintEntityComponent,
    ProjectParser projectParser,
    ProjectValidator projectValidator
  ) {
    this.projectEntityComponent = projectEntityComponent;
    this.sprintEntityComponent = sprintEntityComponent;
    this.projectParser = projectParser;
    this.projectValidator = projectValidator;
  }

  public List<ProjectMetaDto> listProjects() {
    return projectEntityComponent.findAllByUpdatedAtDesc().stream()
      .map(projectParser::toDto)
      .toList();
  }

  public ProjectMetaDto getProject(String id) {
    Project project = projectEntityComponent.getRequired(id);
    return projectParser.toDto(project);
  }

  public ProjectMetaDto createProject(ProjectInputDto input) {
    Project project = projectParser.toDomain(input);
    projectValidator.validateOrThrow(project);
    if (project.getName() == null || project.getName().isBlank()) {
      project.setName("Projeto sem título");
    }
    if (project.getStatus() == null || project.getStatus().isBlank()) {
      project.setStatus("active");
    }
    project.setId(IdGenerator.newProjectId());
    project.setUpdatedAt(DateTimeUtil.nowIso());
    Project saved = projectEntityComponent.save(project);
    return projectParser.toDto(saved);
  }

  public ProjectMetaDto updateProject(String id, ProjectMetaDto input) {
    Project existing = projectEntityComponent.getRequired(id);
    Project project = projectParser.toDomain(input);
    projectValidator.validateOrThrow(project);
    project.setId(id);
    if (project.getName() == null || project.getName().isBlank()) {
      project.setName(existing.getName());
    }
    if (project.getDescription() == null) {
      project.setDescription(existing.getDescription());
    }
    if (project.getStartDate() == null) {
      project.setStartDate(existing.getStartDate());
    }
    if (project.getEndDate() == null) {
      project.setEndDate(existing.getEndDate());
    }
    if (project.getStatus() == null || project.getStatus().isBlank()) {
      project.setStatus(existing.getStatus() == null ? "active" : existing.getStatus());
    }
    project.setUpdatedAt(DateTimeUtil.nowIso());
    Project saved = projectEntityComponent.save(project);
    return projectParser.toDto(saved);
  }

  public void deleteProject(String id) {
    projectEntityComponent.getRequired(id);
    sprintEntityComponent.deleteByProjectId(id);
    projectEntityComponent.deleteById(id);
  }
}
