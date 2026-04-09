/**
 * Verifies that long-running transformations produce the configured timeout response.
 * This protects the timeout contract at the same layer clients will observe it.
 */
package com.eaglesoft.xslttransformationservice.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "xslt.transformation.timeout=0ms")
@AutoConfigureMockMvc
class ApiTimeoutTest {

  @Autowired
  private MockMvc mockMvc;

  // Verifies that requests exceeding the configured timeout return a timeout error.
  @Test
  void transformRejectsTimeout() throws Exception {
    String requestBody = """
        {
          \"xslt\": \"<xsl:stylesheet version=\\\"3.0\\\" xmlns:xsl=\\\"http://www.w3.org/1999/XSL/Transform\\\"><xsl:template match=\\\"/\\\"><result><xsl:value-of select=\\\"/root/item\\\"/></result></xsl:template></xsl:stylesheet>\",
          \"xml\": \"<root><item>Hello</item></root>\"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isRequestTimeout())
        .andExpect(jsonPath("$.error.code").value("TIMEOUT_EXCEEDED"))
        .andExpect(jsonPath("$.error.message").value("Transformation timed out"))
        .andExpect(jsonPath("$.error.details").value("execution exceeded configured timeout of PT0S"));
  }
}

