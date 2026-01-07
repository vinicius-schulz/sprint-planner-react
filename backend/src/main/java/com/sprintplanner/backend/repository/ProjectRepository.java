package com.sprintplanner.backend.repository;

import com.sprintplanner.backend.domain.Project;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProjectRepository extends MongoRepository<Project, String> {
  List<Project> findAllByOrderByUpdatedAtDesc();
}
