package com.sprintplanner.backend.service;

import com.sprintplanner.backend.component.DefaultStateFactory;
import com.sprintplanner.backend.entitycomponent.ProjectEntityComponent;
import com.sprintplanner.backend.entitycomponent.SprintEntityComponent;
import com.sprintplanner.backend.domain.RootPersistedState;
import com.sprintplanner.backend.domain.SprintDocument;
import com.sprintplanner.backend.dto.RootPersistedStateDto;
import com.sprintplanner.backend.dto.SprintMetaDto;
import com.sprintplanner.backend.dto.SprintStateResponseDto;
import com.sprintplanner.backend.parser.SprintParser;
import com.sprintplanner.backend.parser.StateParser;
import com.sprintplanner.backend.util.DateTimeUtil;
import com.sprintplanner.backend.util.IdGenerator;
import com.sprintplanner.backend.validators.SprintRequestValidator;
import com.sprintplanner.backend.validators.SprintStateValidator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SprintService {
  private final SprintEntityComponent sprintEntityComponent;
  private final ProjectEntityComponent projectEntityComponent;
  private final SprintParser sprintParser;
  private final StateParser stateParser;
  private final DefaultStateFactory defaultStateFactory;
  private final SprintStateValidator sprintStateValidator;
  private final SprintRequestValidator sprintRequestValidator;

  public SprintService(
    SprintEntityComponent sprintEntityComponent,
    ProjectEntityComponent projectEntityComponent,
    SprintParser sprintParser,
    StateParser stateParser,
    DefaultStateFactory defaultStateFactory,
    SprintStateValidator sprintStateValidator,
    SprintRequestValidator sprintRequestValidator
  ) {
    this.sprintEntityComponent = sprintEntityComponent;
    this.projectEntityComponent = projectEntityComponent;
    this.sprintParser = sprintParser;
    this.stateParser = stateParser;
    this.defaultStateFactory = defaultStateFactory;
    this.sprintStateValidator = sprintStateValidator;
    this.sprintRequestValidator = sprintRequestValidator;
  }

  public List<SprintMetaDto> listSprintSummaries(String projectId) {
    return sprintEntityComponent.findByProjectIdOrderByUpdatedAtDesc(projectId).stream()
      .map(sprintParser::toMetaDto)
      .toList();
  }

  public SprintStateResponseDto getSprint(String id) {
    SprintDocument sprint = sprintEntityComponent.getRequired(id);
    return sprintParser.toStateResponseDto(sprint);
  }

  public SprintStateResponseDto createSprint(String projectId, String title) {
    sprintRequestValidator.validateCreateOrThrow(projectId);
    projectEntityComponent.ensureExists(projectId);

    RootPersistedState state = defaultStateFactory.buildDefaultState(title);
    sprintStateValidator.validateOrThrow(state);

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
    SprintDocument saved = sprintEntityComponent.save(sprint);
    return sprintParser.toStateResponseDto(saved);
  }

  public SprintStateResponseDto updateSprintState(String id, RootPersistedStateDto stateDto) {
    SprintDocument existing = sprintEntityComponent.getRequired(id);
    RootPersistedState state = stateParser.toDomain(stateDto);
    sprintStateValidator.validateOrThrow(state);
    existing.setState(state);
    existing.setTitle(state.getSprint().getTitle());
    existing.setStartDate(state.getSprint().getStartDate());
    existing.setEndDate(state.getSprint().getEndDate());
    existing.setStatus(state.getPlanningLifecycle().getStatus());
    existing.setUpdatedAt(DateTimeUtil.nowIso());
    SprintDocument saved = sprintEntityComponent.save(existing);
    return sprintParser.toStateResponseDto(saved);
  }

  public void deleteSprint(String id) {
    sprintEntityComponent.getRequired(id);
    sprintEntityComponent.deleteById(id);
  }
}
