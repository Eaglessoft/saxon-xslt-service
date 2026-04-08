/**
 * Enforces request size limits before the transformation engine is invoked.
 * This keeps operational guardrails out of controllers and close to the service workflow.
 */
package com.eaglesoft.xslttransformationservice.service;

import com.eaglesoft.xslttransformationservice.config.XsltTransformationProperties;
import com.eaglesoft.xslttransformationservice.dto.TransformRequest;
import com.eaglesoft.xslttransformationservice.exception.RequestValidationException;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Component;

@Component
public class TransformRequestValidator {

  private final XsltTransformationProperties properties;

  public TransformRequestValidator(XsltTransformationProperties properties) {
    this.properties = properties;
  }

  public void validate(TransformRequest request) {
    // Centralize size checks so every transformation path uses the same limits.
    validateMaxSize("xml", request.xml(), properties.getMaxXmlSize().toBytes());
    validateMaxSize("xslt", request.xslt(), properties.getMaxXsltSize().toBytes());
  }

  private void validateMaxSize(String fieldName, String value, long maxSizeInBytes) {
    if (value == null) {
      return;
    }

    long actualSize = value.getBytes(StandardCharsets.UTF_8).length;
    if (actualSize > maxSizeInBytes) {
      throw new RequestValidationException(
          "INPUT_SIZE_EXCEEDED",
          fieldName + " exceeds the maximum allowed size",
          fieldName + " size is " + actualSize + " bytes but limit is " + maxSizeInBytes + " bytes"
      );
    }
  }
}

