package com.sprintplanner.backend.controller;

import com.sprintplanner.backend.dto.SprintCreateRequestDto;
import com.sprintplanner.backend.dto.SprintMetaDto;
import com.sprintplanner.backend.dto.SprintStateResponseDto;
import com.sprintplanner.backend.dto.SprintUpdateStateRequestDto;
import com.sprintplanner.backend.service.SprintService;
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
@RequestMapping
@CrossOrigin(origins = "*")
public class SprintController {
  private final SprintService sprintService;

  public SprintController(SprintService sprintService) {
    this.sprintService = sprintService;
  }

  @GetMapping("/projects/{projectId}/sprints")
  public List<SprintMetaDto> listSprintSummaries(@PathVariable String projectId) {
    return sprintService.listSprintSummaries(projectId);
  }

  @PostMapping("/projects/{projectId}/sprints")
  @ResponseStatus(HttpStatus.CREATED)
  public SprintStateResponseDto createSprint(
    @PathVariable String projectId,
    @RequestBody(required = false) SprintCreateRequestDto request
  ) {
    String title = request == null ? null : request.getTitle();
    return sprintService.createSprint(projectId, title);
  }

  @GetMapping("/sprints/{id}")
  public SprintStateResponseDto getSprint(@PathVariable String id) {
    return sprintService.getSprint(id);
  }

  @PutMapping("/sprints/{id}/state")
  public SprintStateResponseDto updateSprintState(
    @PathVariable String id,
    @RequestBody SprintUpdateStateRequestDto request
  ) {
    return sprintService.updateSprintState(id, request.getState());
  }

  @DeleteMapping("/sprints/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteSprint(@PathVariable String id) {
    sprintService.deleteSprint(id);
  }
}
