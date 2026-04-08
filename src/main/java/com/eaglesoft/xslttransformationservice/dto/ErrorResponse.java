/**
 * Wraps API failures in the single JSON error envelope defined by the contract.
 * Keeping a stable top-level shape makes client-side error handling predictable.
 */
package com.eaglesoft.xslttransformationservice.dto;

public record ErrorResponse(
    ErrorDetail error
) {
}

