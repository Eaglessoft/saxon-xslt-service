/**
 * Represents the JSON payload returned by the health endpoint.
 * It keeps health reporting explicit and aligned with the API contract.
 */
package com.eaglesoft.xslttransformationservice.dto;

public record HealthResponse(
    String status
) {
}

