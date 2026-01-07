package com.sprintplanner.backend.util;

import java.util.UUID;

public final class IdGenerator {
  private IdGenerator() {
  }

  public static String newProjectId() {
    return "project-" + UUID.randomUUID();
  }

  public static String newSprintId() {
    return "sprint-" + UUID.randomUUID();
  }
}
