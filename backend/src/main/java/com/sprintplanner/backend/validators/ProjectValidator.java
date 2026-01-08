package com.sprintplanner.backend.validators;

import com.sprintplanner.backend.domain.Project;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ProjectValidator {
  private static final Set<String> VALID_STATUS = Set.of("draft", "active", "archived");

  public String validate(Project project) {
    if (project == null) {
      return "Projeto é obrigatório.";
    }
    if (project.getStatus() != null && !VALID_STATUS.contains(project.getStatus())) {
      return "Status do projeto é inválido.";
    }
    return null;
  }

  public void validateOrThrow(Project project) {
    String validation = validate(project);
    if (validation != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validation);
    }
  }
}
