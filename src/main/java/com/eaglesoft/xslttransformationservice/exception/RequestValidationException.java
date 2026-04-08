/**
 * Represents request-level validation failures detected outside bean validation.
 * It carries a stable error code and details so limit violations can be reported cleanly.
 */
package com.eaglesoft.xslttransformationservice.exception;

public class RequestValidationException extends RuntimeException {

  private final String code;
  private final String details;

  public RequestValidationException(String code, String message, String details) {
    super(message);
    this.code = code;
    this.details = details;
  }

  public String getCode() {
    return code;
  }

  public String getDetails() {
    return details;
  }
}

