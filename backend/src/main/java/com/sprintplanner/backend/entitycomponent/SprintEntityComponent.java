package com.sprintplanner.backend.entitycomponent;

import com.sprintplanner.backend.domain.SprintDocument;
import com.sprintplanner.backend.repository.SprintRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SprintEntityComponent {
  private final SprintRepository sprintRepository;

  public SprintEntityComponent(SprintRepository sprintRepository) {
    this.sprintRepository = sprintRepository;
  }

  public List<SprintDocument> findByProjectIdOrderByUpdatedAtDesc(String projectId) {
    return sprintRepository.findByProjectIdOrderByUpdatedAtDesc(projectId);
  }

  public SprintDocument getRequired(String id) {
    return sprintRepository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint não encontrada."));
  }

  public SprintDocument save(SprintDocument sprint) {
    return sprintRepository.save(sprint);
  }

  public void deleteById(String id) {
    sprintRepository.deleteById(id);
  }

  public void deleteByProjectId(String projectId) {
    sprintRepository.deleteByProjectId(projectId);
  }
}
