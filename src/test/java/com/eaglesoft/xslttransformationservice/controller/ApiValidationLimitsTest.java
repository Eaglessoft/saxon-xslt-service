/**
 * Verifies that oversized XML or XSLT inputs are rejected at the API boundary.
 * This keeps request-limit behavior covered without needing a full manual run.
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

@SpringBootTest(properties = {"xslt.transformation.max-xml-size=5B", "xslt.transformation.max-xslt-size=5B"})
@AutoConfigureMockMvc
class ApiValidationLimitsTest {

  @Autowired
  private MockMvc mockMvc;

  // Verifies that oversized XSLT payloads are rejected before compilation starts.
  @Test
  void transformRejectsOversizedXslt() throws Exception {
    String requestBody = """
        {
          "xslt": "<xsl/>",
          "xml": "<x/>"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("INPUT_SIZE_EXCEEDED"))
        .andExpect(jsonPath("$.error.message").value("xslt exceeds the maximum allowed size"))
        .andExpect(jsonPath("$.error.details").value("xslt size is 6 bytes but limit is 5 bytes"));
  }

  // Verifies that oversized XML payloads are rejected at the API boundary.
  @Test
  void transformRejectsOversizedXml() throws Exception {
    String requestBody = """
        {
          \"xslt\": \"<x/>\",
          \"xml\": \"<root/>\"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("INPUT_SIZE_EXCEEDED"))
        .andExpect(jsonPath("$.error.message").value("xml exceeds the maximum allowed size"))
        .andExpect(jsonPath("$.error.details").value("xml size is 7 bytes but limit is 5 bytes"));
  }
}

