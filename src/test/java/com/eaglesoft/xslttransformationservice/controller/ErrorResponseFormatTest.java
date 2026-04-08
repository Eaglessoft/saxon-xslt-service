/**
 * Verifies that malformed requests still return the standard JSON error envelope.
 * This keeps the API error shape stable even when request parsing fails early.
 */
package com.eaglesoft.xslttransformationservice.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ErrorResponseFormatTest {

  @Autowired
  private MockMvc mockMvc;

  // Verifies that malformed requests still follow the shared API error envelope.
  @Test
  void errorFollowsStandardEnvelope() throws Exception {
    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{invalid-json}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").exists())
        .andExpect(jsonPath("$.error.code").value("MALFORMED_REQUEST"))
        .andExpect(jsonPath("$.error.message").value("Request body is invalid JSON"))
        .andExpect(jsonPath("$.error.details").isString());
  }
}

