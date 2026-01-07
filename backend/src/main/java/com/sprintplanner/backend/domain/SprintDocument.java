package com.sprintplanner.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sprints")
public class SprintDocument {
  @Id
  private String id;
  private String projectId;
  private String title;
  private String startDate;
  private String endDate;
  private String status;
  private String updatedAt;
  private RootPersistedState state;
}
