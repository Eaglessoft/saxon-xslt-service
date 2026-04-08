/**
 * Exposes the lightweight health endpoint used for runtime checks and smoke tests.
 * It returns a minimal JSON payload so callers can verify the service is alive.
 */
package com.eaglesoft.xslttransformationservice.controller;

import com.eaglesoft.xslttransformationservice.dto.HealthResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class HealthController {

  @GetMapping("/health")
  public HealthResponse health() {
    return new HealthResponse("UP");
  }
}

