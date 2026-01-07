package com.sprintplanner.backend.component;

import com.sprintplanner.backend.domain.EventItem;
import com.sprintplanner.backend.domain.Member;
import com.sprintplanner.backend.domain.MemberEvent;
import com.sprintplanner.backend.domain.RootPersistedState;
import com.sprintplanner.backend.domain.SprintState;
import com.sprintplanner.backend.domain.TaskItem;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class SprintStateValidator {
  public String validate(RootPersistedState state) {
    if (state == null) {
      return "Estado da sprint é obrigatório.";
    }

    String sprintError = validateSprint(state.getSprint());
    if (sprintError != null) {
      return sprintError;
    }

    List<EventItem> events = safeList(state.getEvents() == null ? null : state.getEvents().getItems());
    for (EventItem event : events) {
      String error = validateEvent(event);
      if (error != null) {
        return error;
      }
    }

    List<Member> members = safeList(state.getMembers() == null ? null : state.getMembers().getItems());
    for (Member member : members) {
      String error = validateMember(member);
      if (error != null) {
        return error;
      }
    }

    List<TaskItem> tasks = safeList(state.getTasks() == null ? null : state.getTasks().getItems());
    Set<String> ids = new HashSet<>();
    for (TaskItem task : tasks) {
      String error = validateTask(task, ids);
      if (error != null) {
        return error;
      }
    }

    return null;
  }

  private String validateSprint(SprintState sprint) {
    if (sprint == null) {
      return "Sprint é obrigatória.";
    }
    String startDate = sprint.getStartDate();
    String endDate = sprint.getEndDate();
    boolean startBlank = startDate == null || startDate.isBlank();
    boolean endBlank = endDate == null || endDate.isBlank();
    if (startBlank && endBlank) {
      return null;
    }
    if (startBlank || endBlank) {
      return "Datas de início e fim são obrigatórias.";
    }
    try {
      LocalDate start = LocalDate.parse(startDate);
      LocalDate end = LocalDate.parse(endDate);
      if (start.isAfter(end)) {
        return "Data de início não pode ser posterior à data de fim.";
      }
    } catch (DateTimeParseException ex) {
      return "Datas de início e fim devem estar no formato ISO (YYYY-MM-DD).";
    }
    return null;
  }

  private String validateEvent(EventItem event) {
    if (event == null) {
      return "Evento é obrigatório.";
    }
    if (event.getDate() == null || event.getDate().isBlank()) {
      return "Data do evento é obrigatória.";
    }
    if (event.getMinutes() <= 0) {
      return "Minutos do evento devem ser numéricos e maiores que zero.";
    }
    return null;
  }

  private String validateMember(Member member) {
    if (member == null) {
      return "Membro é obrigatório.";
    }
    if (member.getName() == null || member.getName().isBlank()) {
      return "Nome do membro é obrigatório.";
    }
    if (member.getRoleType() == null || member.getRoleType().isBlank()) {
      return "Tipo do membro é obrigatório.";
    }
    double availability = member.getAvailabilityPercent();
    if (Double.isNaN(availability) || availability < 0 || availability > 100) {
      return "Disponibilidade deve estar entre 0 e 100.";
    }
    if (Boolean.TRUE.equals(member.getUseAdvancedAvailability())) {
      List<MemberEvent> events = safeList(member.getAvailabilityEvents());
      if (events.isEmpty()) {
        return "Adicione pelo menos um evento de disponibilidade ou desative o modo avançado.";
      }
      for (MemberEvent event : events) {
        if (event == null || event.getMinutes() <= 0) {
          return "Duração do evento deve ser maior que zero (minutos).";
        }
      }
    }
    return null;
  }

  private String validateTask(TaskItem task, Set<String> existingIds) {
    if (task == null) {
      return "Tarefa é obrigatória.";
    }
    if (task.getId() == null || task.getId().isBlank()) {
      return "ID da tarefa é obrigatório.";
    }
    if (task.getName() == null || task.getName().isBlank()) {
      return "Nome da tarefa é obrigatório.";
    }
    if (Double.isNaN(task.getStoryPoints())) {
      return "Story points devem ser numéricos.";
    }
    if (existingIds.contains(task.getId())) {
      return "ID da tarefa já existe.";
    }
    existingIds.add(task.getId());
    List<String> dependencies = safeList(task.getDependencies());
    if (dependencies.contains(task.getId())) {
      return "Uma tarefa não pode depender de si mesma.";
    }
    return null;
  }

  private <T> List<T> safeList(List<T> list) {
    return list == null ? List.of() : list;
  }
}
