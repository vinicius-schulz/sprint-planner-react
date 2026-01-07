package com.sprintplanner.backend.service;

import com.sprintplanner.backend.component.DefaultStateFactory;
import com.sprintplanner.backend.component.ProjectValidator;
import com.sprintplanner.backend.component.SprintStateValidator;
import com.sprintplanner.backend.domain.Project;
import com.sprintplanner.backend.domain.RootPersistedState;
import com.sprintplanner.backend.domain.SprintDocument;
import com.sprintplanner.backend.dto.RootPersistedStateDto;
import com.sprintplanner.backend.dto.SprintMetaDto;
import com.sprintplanner.backend.dto.SprintStateResponseDto;
import com.sprintplanner.backend.parser.SprintParser;
import com.sprintplanner.backend.parser.StateParser;
import com.sprintplanner.backend.repository.ProjectRepository;
import com.sprintplanner.backend.repository.SprintRepository;
import com.sprintplanner.backend.util.DateTimeUtil;
import com.sprintplanner.backend.util.IdGenerator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SprintService {
  private final SprintRepository sprintRepository;
  private final ProjectRepository projectRepository;
  private final SprintParser sprintParser;
  private final StateParser stateParser;
  private final DefaultStateFactory defaultStateFactory;
  private final SprintStateValidator sprintStateValidator;
  private final ProjectValidator projectValidator;

  public SprintService(
    SprintRepository sprintRepository,
    ProjectRepository projectRepository,
    SprintParser sprintParser,
    StateParser stateParser,
    DefaultStateFactory defaultStateFactory,
    SprintStateValidator sprintStateValidator,
    ProjectValidator projectValidator
  ) {
    this.sprintRepository = sprintRepository;
    this.projectRepository = projectRepository;
    this.sprintParser = sprintParser;
    this.stateParser = stateParser;
    this.defaultStateFactory = defaultStateFactory;
    this.sprintStateValidator = sprintStateValidator;
    this.projectValidator = projectValidator;
  }

  public List<SprintMetaDto> listSprintSummaries(String projectId) {
    return sprintRepository.findByProjectIdOrderByUpdatedAtDesc(projectId).stream()
      .map(sprintParser::toMetaDto)
      .toList();
  }

  public SprintStateResponseDto getSprint(String id) {
    SprintDocument sprint = sprintRepository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint não encontrada."));
    return sprintParser.toStateResponseDto(sprint);
  }

  public SprintStateResponseDto createSprint(String projectId, String title) {
    if (projectId == null || projectId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId é obrigatório para criar uma sprint.");
    }
    ensureProjectExists(projectId);

    RootPersistedState state = defaultStateFactory.buildDefaultState(title);
    String validation = sprintStateValidator.validate(state);
    if (validation != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validation);
    }

    SprintDocument sprint = SprintDocument.builder()
      .id(IdGenerator.newSprintId())
      .projectId(projectId)
      .title(state.getSprint().getTitle())
      .startDate(state.getSprint().getStartDate())
      .endDate(state.getSprint().getEndDate())
      .status(state.getPlanningLifecycle().getStatus())
      .updatedAt(DateTimeUtil.nowIso())
      .state(state)
      .build();
    SprintDocument saved = sprintRepository.save(sprint);
    return sprintParser.toStateResponseDto(saved);
  }

  public SprintStateResponseDto updateSprintState(String id, RootPersistedStateDto stateDto) {
    SprintDocument existing = sprintRepository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint não encontrada."));
    if (stateDto == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado da sprint é obrigatório.");
    }
    RootPersistedState state = stateParser.toDomain(stateDto);
    String validation = sprintStateValidator.validate(state);
    if (validation != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validation);
    }
    existing.setState(state);
    existing.setTitle(state.getSprint().getTitle());
    existing.setStartDate(state.getSprint().getStartDate());
    existing.setEndDate(state.getSprint().getEndDate());
    existing.setStatus(state.getPlanningLifecycle().getStatus());
    existing.setUpdatedAt(DateTimeUtil.nowIso());
    SprintDocument saved = sprintRepository.save(existing);
    return sprintParser.toStateResponseDto(saved);
  }

  public void deleteSprint(String id) {
    if (!sprintRepository.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint não encontrada.");
    }
    sprintRepository.deleteById(id);
  }

  private void ensureProjectExists(String projectId) {
    if (projectRepository.existsById(projectId)) {
      return;
    }
    Project project = Project.builder()
      .id(projectId)
      .name("Projeto sem título")
      .status("active")
      .updatedAt(DateTimeUtil.nowIso())
      .build();
    String validation = projectValidator.validate(project);
    if (validation != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validation);
    }
    projectRepository.save(project);
  }
}
