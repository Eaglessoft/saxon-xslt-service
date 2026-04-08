/**
 * Maps internal exceptions to the public JSON error contract returned by the API.
 * Centralizing this logic keeps controllers simple and makes failure handling consistent.
 */
package com.eaglesoft.xslttransformationservice.exception;

import com.eaglesoft.xslttransformationservice.dto.ErrorDetail;
import com.eaglesoft.xslttransformationservice.dto.ErrorResponse;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  // Converts bean-validation field errors into the standard API validation response.
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
    String details = exception.getBindingResult().getFieldErrors().stream()
        .map(this::formatFieldError)
        .distinct()
        .collect(Collectors.joining("; "));

    return ResponseEntity.badRequest().body(errorResponse(
        "VALIDATION_ERROR",
        "Request validation failed",
        details
    ));
  }

  // Converts malformed JSON payloads into the shared malformed-request response.
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException exception) {
    return ResponseEntity.badRequest().body(errorResponse(
        "MALFORMED_REQUEST",
        "Request body is invalid JSON",
        exception.getMostSpecificCause().getMessage()
    ));
  }

  // Returns request-level validation failures using the public error contract.
  @ExceptionHandler(RequestValidationException.class)
  public ResponseEntity<ErrorResponse> handleRequestValidation(RequestValidationException exception) {
    return ResponseEntity.badRequest().body(errorResponse(
        exception.getCode(),
        exception.getMessage(),
        exception.getDetails()
    ));
  }

  // Maps output-size violations to a controlled client-facing API error.
  @ExceptionHandler(OutputSizeExceededException.class)
  public ResponseEntity<ErrorResponse> handleOutputSizeExceeded(OutputSizeExceededException exception) {
    return ResponseEntity.badRequest().body(errorResponse(
        "OUTPUT_SIZE_EXCEEDED",
        exception.getMessage(),
        exception.getDetails()
    ));
  }

  // Maps XSLT compilation failures to the documented bad-request response.
  @ExceptionHandler(XsltCompilationException.class)
  public ResponseEntity<ErrorResponse> handleXsltCompilation(XsltCompilationException exception) {
    return ResponseEntity.badRequest().body(errorResponse(
        "XSLT_COMPILATION_ERROR",
        exception.getMessage(),
        exception.getDetails()
    ));
  }

  // Maps timed-out transformations to the API timeout response.
  @ExceptionHandler(TransformationTimeoutException.class)
  public ResponseEntity<ErrorResponse> handleTransformationTimeout(TransformationTimeoutException exception) {
    return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT).body(errorResponse(
        "TIMEOUT_EXCEEDED",
        exception.getMessage(),
        exception.getDetails()
    ));
  }

  // Maps runtime transformation failures to the internal-error API response.
  @ExceptionHandler(XsltRuntimeException.class)
  public ResponseEntity<ErrorResponse> handleXsltRuntime(XsltRuntimeException exception) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse(
        "XSLT_RUNTIME_ERROR",
        exception.getMessage(),
        exception.getDetails()
    ));
  }

  // Catches unexpected failures and returns the fallback internal server error response.
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGeneric(Exception exception) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse(
        "INTERNAL_SERVER_ERROR",
        "An unexpected error occurred",
        null
    ));
  }

  // Formats a single field validation error into the API details string.
  private String formatFieldError(FieldError fieldError) {
    return fieldError.getField() + ": " + fieldError.getDefaultMessage();
  }

  // Builds the shared error response payload used by every handler branch.
  private ErrorResponse errorResponse(String code, String message, String details) {
    return new ErrorResponse(new ErrorDetail(code, message, details));
  }
}

