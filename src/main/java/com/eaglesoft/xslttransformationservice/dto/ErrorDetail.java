/**
 * Carries the machine-readable code and human-readable details for an API error.
 * The handler layer fills this record so every failure follows the same structure.
 */
package com.eaglesoft.xslttransformationservice.dto;

public record ErrorDetail(
    String code,
    String message,
    String details
) {
}

