package com.sprintplanner.backend.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sprintplanner.backend.domain.RootPersistedState;
import com.sprintplanner.backend.dto.RootPersistedStateDto;
import org.springframework.stereotype.Component;

@Component
public class StateParser {
  private final ObjectMapper objectMapper;

  public StateParser(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public RootPersistedState toDomain(RootPersistedStateDto dto) {
    if (dto == null) {
      return null;
    }
    return objectMapper.convertValue(dto, RootPersistedState.class);
  }

  public RootPersistedStateDto toDto(RootPersistedState state) {
    if (state == null) {
      return null;
    }
    return objectMapper.convertValue(state, RootPersistedStateDto.class);
  }
}
