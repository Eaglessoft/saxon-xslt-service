/**
 * Represents the successful API response returned after a completed transformation.
 * It bundles the serialized result together with execution metadata for callers.
 */
package com.eaglesoft.xslttransformationservice.dto;

public record TransformResponse(
    String result,
    TransformMetadata metadata
) {
}

