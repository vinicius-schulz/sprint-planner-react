package com.sprintplanner.backend.controller;

import com.sprintplanner.backend.dto.ProjectInputDto;
import com.sprintplanner.backend.dto.ProjectMetaDto;
import com.sprintplanner.backend.service.ProjectService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/projects")
@CrossOrigin(origins = "*")
public class ProjectController {
  private final ProjectService projectService;

  public ProjectController(ProjectService projectService) {
    this.projectService = projectService;
  }

  @GetMapping
  public List<ProjectMetaDto> listProjects() {
    return projectService.listProjects();
  }

  @GetMapping("/{id}")
  public ProjectMetaDto getProject(@PathVariable String id) {
    return projectService.getProject(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ProjectMetaDto createProject(@RequestBody ProjectInputDto input) {
    return projectService.createProject(input);
  }

  @PutMapping("/{id}")
  public ProjectMetaDto updateProject(@PathVariable String id, @RequestBody ProjectMetaDto input) {
    return projectService.updateProject(id, input);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteProject(@PathVariable String id) {
    projectService.deleteProject(id);
  }
}
