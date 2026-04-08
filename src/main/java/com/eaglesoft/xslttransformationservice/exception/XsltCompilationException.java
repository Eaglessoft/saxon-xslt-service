/**
 * Represents failures that happen while compiling an incoming XSLT stylesheet.
 * It separates bad stylesheet input from runtime execution failures and generic server errors.
 */
package com.eaglesoft.xslttransformationservice.exception;

public class XsltCompilationException extends RuntimeException {

  private final String details;

  public XsltCompilationException(String message, String details, Throwable cause) {
    super(message, cause);
    this.details = details;
  }

  public String getDetails() {
    return details;
  }
}

