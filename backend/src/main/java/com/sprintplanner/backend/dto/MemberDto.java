package com.sprintplanner.backend.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberDto {
  private String id;
  private String name;
  private String roleType;
  private String seniority;
  private String maturity;
  private double availabilityPercent;
  private Boolean useAdvancedAvailability;
  private List<MemberEventDto> availabilityEvents;
}
