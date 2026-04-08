/**
 * Signals that a transformation tried to produce more output than the configured limit allows.
 * This protects the service from oversized responses and excessive memory consumption.
 */
package com.eaglesoft.xslttransformationservice.exception;

public class OutputSizeExceededException extends RuntimeException {

  private final String details;

  public OutputSizeExceededException(String message, String details, Throwable cause) {
    super(message, cause);
    this.details = details;
  }

  public String getDetails() {
    return details;
  }
}

