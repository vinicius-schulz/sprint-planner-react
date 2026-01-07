package com.sprintplanner.backend.parser;

import com.sprintplanner.backend.domain.SprintDocument;
import com.sprintplanner.backend.dto.SprintMetaDto;
import com.sprintplanner.backend.dto.SprintStateResponseDto;
import org.springframework.stereotype.Component;

@Component
public class SprintParser {
  private final StateParser stateParser;

  public SprintParser(StateParser stateParser) {
    this.stateParser = stateParser;
  }

  public SprintMetaDto toMetaDto(SprintDocument document) {
    if (document == null) {
      return null;
    }
    return SprintMetaDto.builder()
      .id(document.getId())
      .title(document.getTitle())
      .startDate(document.getStartDate())
      .endDate(document.getEndDate())
      .updatedAt(document.getUpdatedAt())
      .status(document.getStatus())
      .projectId(document.getProjectId())
      .build();
  }

  public SprintStateResponseDto toStateResponseDto(SprintDocument document) {
    if (document == null) {
      return null;
    }
    return SprintStateResponseDto.builder()
      .id(document.getId())
      .state(stateParser.toDto(document.getState()))
      .meta(toMetaDto(document))
      .build();
  }
}
