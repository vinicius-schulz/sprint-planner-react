package com.sprintplanner.backend.service;

import com.sprintplanner.backend.component.ProjectValidator;
import com.sprintplanner.backend.domain.Project;
import com.sprintplanner.backend.dto.ProjectInputDto;
import com.sprintplanner.backend.dto.ProjectMetaDto;
import com.sprintplanner.backend.parser.ProjectParser;
import com.sprintplanner.backend.repository.ProjectRepository;
import com.sprintplanner.backend.repository.SprintRepository;
import com.sprintplanner.backend.util.DateTimeUtil;
import com.sprintplanner.backend.util.IdGenerator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProjectService {
  private final ProjectRepository projectRepository;
  private final SprintRepository sprintRepository;
  private final ProjectParser projectParser;
  private final ProjectValidator projectValidator;

  public ProjectService(
    ProjectRepository projectRepository,
    SprintRepository sprintRepository,
    ProjectParser projectParser,
    ProjectValidator projectValidator
  ) {
    this.projectRepository = projectRepository;
    this.sprintRepository = sprintRepository;
    this.projectParser = projectParser;
    this.projectValidator = projectValidator;
  }

  public List<ProjectMetaDto> listProjects() {
    return projectRepository.findAllByOrderByUpdatedAtDesc().stream()
      .map(projectParser::toDto)
      .toList();
  }

  public ProjectMetaDto getProject(String id) {
    Project project = projectRepository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto não encontrado."));
    return projectParser.toDto(project);
  }

  public ProjectMetaDto createProject(ProjectInputDto input) {
    Project project = projectParser.toDomain(input);
    String validation = projectValidator.validate(project);
    if (validation != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validation);
    }
    if (project.getName() == null || project.getName().isBlank()) {
      project.setName("Projeto sem título");
    }
    if (project.getStatus() == null || project.getStatus().isBlank()) {
      project.setStatus("active");
    }
    project.setId(IdGenerator.newProjectId());
    project.setUpdatedAt(DateTimeUtil.nowIso());
    Project saved = projectRepository.save(project);
    return projectParser.toDto(saved);
  }

  public ProjectMetaDto updateProject(String id, ProjectMetaDto input) {
    Project existing = projectRepository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto não encontrado."));
    Project project = projectParser.toDomain(input);
    project.setId(id);
    String validation = projectValidator.validate(project);
    if (validation != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validation);
    }
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
    Project saved = projectRepository.save(project);
    return projectParser.toDto(saved);
  }

  public void deleteProject(String id) {
    if (!projectRepository.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto não encontrado.");
    }
    sprintRepository.deleteByProjectId(id);
    projectRepository.deleteById(id);
  }
}
