package com.sprintplanner.backend.util;

import java.time.OffsetDateTime;

public final class DateTimeUtil {
  private DateTimeUtil() {
  }

  public static String nowIso() {
    return OffsetDateTime.now().toString();
  }
}
