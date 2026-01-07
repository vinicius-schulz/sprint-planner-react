package com.sprintplanner.backend.component;

import com.sprintplanner.backend.domain.CalendarState;
import com.sprintplanner.backend.domain.ConfigState;
import com.sprintplanner.backend.domain.EventsState;
import com.sprintplanner.backend.domain.GlobalConfig;
import com.sprintplanner.backend.domain.MembersState;
import com.sprintplanner.backend.domain.PlanningLifecycleState;
import com.sprintplanner.backend.domain.RootPersistedState;
import com.sprintplanner.backend.domain.SprintState;
import com.sprintplanner.backend.domain.TasksState;
import com.sprintplanner.backend.domain.WorkingPeriod;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class DefaultStateFactory {
  public RootPersistedState buildDefaultState(String title) {
    String resolvedTitle = title == null || title.isBlank() ? "Sprint sem título" : title;
    SprintState sprintState = SprintState.builder()
      .title(resolvedTitle)
      .startDate("")
      .endDate("")
      .build();

    CalendarState calendarState = CalendarState.builder()
      .nonWorkingDaysManual(new ArrayList<>())
      .nonWorkingDaysRemoved(new ArrayList<>())
      .daySchedules(new ArrayList<>())
      .build();

    EventsState eventsState = EventsState.builder()
      .items(new ArrayList<>())
      .build();

    MembersState membersState = MembersState.builder()
      .items(new ArrayList<>())
      .build();

    TasksState tasksState = TasksState.builder()
      .items(new ArrayList<>())
      .build();

    GlobalConfig config = GlobalConfig.builder()
      .dailyWorkHours(8)
      .seniorityFactors(Map.of("Sênior", 1.0, "Pleno", 0.8, "Júnior", 0.6))
      .maturityFactors(Map.of("Plena", 1.0, "Mediana", 0.8, "Inicial", 0.6))
      .storyPointsPerHour(0.33)
      .countedMemberTypes(List.of("Desenvolvedor"))
      .storyPointScale(List.of(0, 1, 2, 3, 5, 8, 13))
      .workloadWarningOver(0.05)
      .workloadErrorOver(0.1)
      .defaultWorkingPeriods(List.of(
        WorkingPeriod.builder().start("08:00").end("12:00").build(),
        WorkingPeriod.builder().start("13:00").end("17:00").build()
      ))
      .schedulingStrategy("EDD")
      .build();

    ConfigState configState = ConfigState.builder()
      .value(config)
      .build();

    PlanningLifecycleState planningLifecycleState = PlanningLifecycleState.builder()
      .status("editing")
      .closedAt(null)
      .build();

    return RootPersistedState.builder()
      .sprint(sprintState)
      .calendar(calendarState)
      .events(eventsState)
      .members(membersState)
      .tasks(tasksState)
      .config(configState)
      .planningLifecycle(planningLifecycleState)
      .build();
  }
}
