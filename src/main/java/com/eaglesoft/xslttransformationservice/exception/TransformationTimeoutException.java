/**
 * Signals that a transformation exceeded the configured execution timeout.
 * The API converts this exception into a controlled timeout response instead of hanging indefinitely.
 */
package com.eaglesoft.xslttransformationservice.exception;

public class TransformationTimeoutException extends RuntimeException {

  private final String details;

  public TransformationTimeoutException(String message, String details, Throwable cause) {
    super(message, cause);
    this.details = details;
  }

  public String getDetails() {
    return details;
  }
}

