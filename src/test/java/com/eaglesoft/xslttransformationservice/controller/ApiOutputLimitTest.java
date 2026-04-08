/**
 * Verifies that oversized transformation output is surfaced as a controlled API error.
 * The test ensures output protection remains visible through the HTTP contract.
 */
package com.eaglesoft.xslttransformationservice.controller;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "xslt.transformation.max-output-size=10B")
@AutoConfigureMockMvc
class ApiOutputLimitTest {

  @Autowired
  private MockMvc mockMvc;

  // Verifies that output larger than the configured limit is rejected cleanly.
  @Test
  void transformRejectsOversizedOutput() throws Exception {
    String requestBody = """
        {
          \"xslt\": \"<xsl:stylesheet version=\\\"3.0\\\" xmlns:xsl=\\\"http://www.w3.org/1999/XSL/Transform\\\"><xsl:template match=\\\"/\\\"><result><xsl:value-of select=\\\"/root/item\\\"/></result></xsl:template></xsl:stylesheet>\",
          \"xml\": \"<root><item>Hello</item></root>\"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("OUTPUT_SIZE_EXCEEDED"))
        .andExpect(jsonPath("$.error.message").value("Transformation output exceeds the maximum allowed size"))
        .andExpect(jsonPath("$.error.details", containsString("limit is 10 bytes")));
  }
}

