package com.sprintplanner.backend.validators;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SprintRequestValidator {
  public String validateProjectId(String projectId) {
    if (projectId == null || projectId.isBlank()) {
      return "projectId é obrigatório para criar uma sprint.";
    }
    return null;
  }

  public void validateCreateOrThrow(String projectId) {
    String validation = validateProjectId(projectId);
    if (validation != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validation);
    }
  }
}
