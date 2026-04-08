/**
 * Represents failures that occur while an already compiled stylesheet is executing.
 * This keeps runtime transformation errors distinct from validation and compilation problems.
 */
package com.eaglesoft.xslttransformationservice.exception;

public class XsltRuntimeException extends RuntimeException {

  private final String details;

  public XsltRuntimeException(String message, String details, Throwable cause) {
    super(message, cause);
    this.details = details;
  }

  public String getDetails() {
    return details;
  }
}

