/**
 * Represents the incoming transform request body with raw XSLT and XML content.
 * Bean validation on this record enforces the required fields before processing starts.
 */
package com.eaglesoft.xslttransformationservice.dto;

import jakarta.validation.constraints.NotBlank;

public record TransformRequest(
    @NotBlank(message = "xslt must be provided") String xslt,
    @NotBlank(message = "xml must be provided") String xml
) {
}

