/**
 * Carries timing and size metrics about a completed transformation request.
 * These values help clients understand execution cost without inspecting server internals.
 */
package com.eaglesoft.xslttransformationservice.dto;

public record TransformMetadata(
    long executionTimeMs,
    long inputSize,
    long outputSize,
    /**
     * The serialization method the result was written with: "html", "xhtml", "xml" or "text".
     * Clients use it to decide how to render the output rather than sniffing the string.
     */
    String outputMethod
) {
}
