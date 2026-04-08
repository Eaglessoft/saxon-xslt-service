/**
 * Carries timing and size metrics about a completed transformation request.
 * These values help clients understand execution cost without inspecting server internals.
 */
package com.eaglesoft.xslttransformationservice.dto;

public record TransformMetadata(
    long executionTimeMs,
    long inputSize,
    long outputSize
) {
}

