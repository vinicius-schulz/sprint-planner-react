package com.sprintplanner.backend.repository;

import com.sprintplanner.backend.domain.SprintDocument;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SprintRepository extends MongoRepository<SprintDocument, String> {
  List<SprintDocument> findByProjectIdOrderByUpdatedAtDesc(String projectId);

  void deleteByProjectId(String projectId);
}
