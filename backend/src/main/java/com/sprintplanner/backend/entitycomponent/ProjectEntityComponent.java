package com.sprintplanner.backend.entitycomponent;

import com.sprintplanner.backend.domain.Project;
import com.sprintplanner.backend.repository.ProjectRepository;
import com.sprintplanner.backend.util.DateTimeUtil;
import com.sprintplanner.backend.validators.ProjectValidator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ProjectEntityComponent {
  private final ProjectRepository projectRepository;
  private final ProjectValidator projectValidator;

  public ProjectEntityComponent(ProjectRepository projectRepository, ProjectValidator projectValidator) {
    this.projectRepository = projectRepository;
    this.projectValidator = projectValidator;
  }

  public List<Project> findAllByUpdatedAtDesc() {
    return projectRepository.findAllByOrderByUpdatedAtDesc();
  }

  public Project getRequired(String id) {
    return projectRepository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto não encontrado."));
  }

  public Project save(Project project) {
    return projectRepository.save(project);
  }

  public void deleteById(String id) {
    projectRepository.deleteById(id);
  }

  public void ensureExists(String projectId) {
    if (projectRepository.existsById(projectId)) {
      return;
    }
    Project project = Project.builder()
      .id(projectId)
      .name("Projeto sem título")
      .status("active")
      .updatedAt(DateTimeUtil.nowIso())
      .build();
    projectValidator.validateOrThrow(project);
    save(project);
  }
}
