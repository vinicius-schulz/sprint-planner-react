package com.sprintplanner.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintStateResponseDto {
  private String id;
  private RootPersistedStateDto state;
  private SprintMetaDto meta;
}
