package com.sprintplanner.backend.controller;

import com.sprintplanner.backend.dto.ErrorResponseDto;
import com.sprintplanner.backend.util.DateTimeUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ErrorResponseDto> handleResponseStatus(
    ResponseStatusException ex,
    HttpServletRequest request
  ) {
    HttpStatus status = resolveStatus(ex.getStatusCode());
    String message = resolveResponseStatusMessage(ex, status);
    return buildResponse(status, message, request.getRequestURI());
  }

  @ExceptionHandler({
    MethodArgumentNotValidException.class,
    BindException.class,
    ConstraintViolationException.class,
    HttpMessageNotReadableException.class,
    MethodArgumentTypeMismatchException.class
  })
  public ResponseEntity<ErrorResponseDto> handleBadRequest(Exception ex, HttpServletRequest request) {
    String message = resolveBadRequestMessage(ex);
    return buildResponse(HttpStatus.BAD_REQUEST, message, request.getRequestURI());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponseDto> handleUnexpected(Exception ex, HttpServletRequest request) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno.", request.getRequestURI());
  }

  private ResponseEntity<ErrorResponseDto> buildResponse(HttpStatus status, String message, String path) {
    ErrorResponseDto payload = ErrorResponseDto.builder()
      .timestamp(DateTimeUtil.nowIso())
      .status(status.value())
      .error(status.getReasonPhrase())
      .message(message)
      .path(path)
      .build();
    return ResponseEntity.status(status).body(payload);
  }

  private HttpStatus resolveStatus(HttpStatusCode statusCode) {
    HttpStatus status = HttpStatus.resolve(statusCode.value());
    return status == null ? HttpStatus.INTERNAL_SERVER_ERROR : status;
  }

  private String resolveResponseStatusMessage(ResponseStatusException ex, HttpStatus status) {
    String reason = ex.getReason();
    if (reason == null || reason.isBlank()) {
      return status.getReasonPhrase();
    }
    return reason;
  }

  private String resolveBadRequestMessage(Exception ex) {
    if (ex instanceof MethodArgumentNotValidException validationException) {
      FieldError fieldError = validationException.getBindingResult().getFieldError();
      if (fieldError != null && fieldError.getDefaultMessage() != null) {
        return fieldError.getDefaultMessage();
      }
    }
    if (ex instanceof BindException bindException) {
      FieldError fieldError = bindException.getBindingResult().getFieldError();
      if (fieldError != null && fieldError.getDefaultMessage() != null) {
        return fieldError.getDefaultMessage();
      }
    }
    if (ex instanceof ConstraintViolationException constraintException) {
      ConstraintViolation<?> violation = constraintException.getConstraintViolations().stream().findFirst().orElse(null);
      if (violation != null && violation.getMessage() != null) {
        return violation.getMessage();
      }
    }
    if (ex instanceof HttpMessageNotReadableException) {
      return "Corpo da requisicao invalido.";
    }
    if (ex instanceof MethodArgumentTypeMismatchException) {
      return "Parametro invalido.";
    }
    return "Requisicao invalida.";
  }
}
