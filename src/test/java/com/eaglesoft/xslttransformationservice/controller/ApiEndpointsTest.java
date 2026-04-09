/**
 * Exercises the main HTTP endpoints for healthy, successful, and failing request paths.
 * These tests protect the public API contract from accidental regressions.
 */
package com.eaglesoft.xslttransformationservice.controller;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ApiEndpointsTest {

  @Autowired
  private MockMvc mockMvc;

  // Verifies that the health endpoint reports the service as available.
  @Test
  void healthReturnsUp() throws Exception {
    mockMvc.perform(get("/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"));
  }

  // Verifies that embeddable clients can complete the browser CORS preflight for /transform.
  @Test
  void transformSupportsCorsPreflight() throws Exception {
    mockMvc.perform(options("/transform")
            .header("Origin", "https://example.com")
            .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "*"))
        .andExpect(header().string("Access-Control-Allow-Methods", containsString("POST")));
  }

  // Verifies that a valid transform request returns result data with metadata.
  @Test
  void transformReturnsResult() throws Exception {
    String requestBody = """
        {
          \"xslt\": \"<xsl:stylesheet version=\\\"3.0\\\" xmlns:xsl=\\\"http://www.w3.org/1999/XSL/Transform\\\"><xsl:template match=\\\"/\\\"><result><xsl:value-of select=\\\"/root/item\\\"/></result></xsl:template></xsl:stylesheet>\",
          \"xml\": \"<root><item>Hello</item></root>\"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.result").value("<result>Hello</result>"))
        .andExpect(jsonPath("$.metadata.executionTimeMs").isNumber())
        .andExpect(jsonPath("$.metadata.inputSize").isNumber())
        .andExpect(jsonPath("$.metadata.outputSize").value(22));
  }

  // Verifies that malformed XML is surfaced through the standard runtime error envelope.
  @Test
  void transformRejectsMalformedXml() throws Exception {
    String requestBody = """
        {
          \"xslt\": \"<xsl:stylesheet version=\\\"3.0\\\" xmlns:xsl=\\\"http://www.w3.org/1999/XSL/Transform\\\"><xsl:template match=\\\"/\\\"><result><xsl:value-of select=\\\"/root/item\\\"/></result></xsl:template></xsl:stylesheet>\",
          \"xml\": \"<root><item>Hello</root>\"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.error.code").value("XSLT_RUNTIME_ERROR"))
        .andExpect(jsonPath("$.error.message").value("XSLT execution failed"))
        .andExpect(jsonPath("$.error.details", containsString("XML parser")));
  }

  // Verifies that invalid XSLT is rejected with the compilation error contract.
  @Test
  void transformRejectsInvalidXslt() throws Exception {
    String requestBody = """
        {
          \"xslt\": \"<xsl:stylesheet version=\\\"3.0\\\"><xsl:template match=\\\"/\\\"><result>Hello</result></xsl:template></xsl:stylesheet>\",
          \"xml\": \"<root><item>Hello</item></root>\"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("XSLT_COMPILATION_ERROR"))
        .andExpect(jsonPath("$.error.message").value("XSLT compilation failed"))
        .andExpect(jsonPath("$.error.details").isNotEmpty());
  }

  // Verifies that stylesheets cannot pull in external resources through the public API.
  @Test
  void transformRejectsExternalResources() throws Exception {
    String requestBody = """
        {
          \"xslt\": \"<xsl:stylesheet version=\\\"3.0\\\" xmlns:xsl=\\\"http://www.w3.org/1999/XSL/Transform\\\"><xsl:include href=\\\"https://example.com/external.xsl\\\"/></xsl:stylesheet>\",
          \"xml\": \"<root><item>Hello</item></root>\"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("XSLT_COMPILATION_ERROR"))
        .andExpect(jsonPath("$.error.message").value("XSLT compilation failed"))
        .andExpect(jsonPath("$.error.details", containsString("External resource access is disabled")));
  }

  // Verifies that runtime failures are returned through the standard API error envelope.
  @Test
  void transformReportsRuntimeFailure() throws Exception {
    String requestBody = """
        {
          \"xslt\": \"<xsl:stylesheet version=\\\"3.0\\\" xmlns:xsl=\\\"http://www.w3.org/1999/XSL/Transform\\\"><xsl:template match=\\\"/\\\"><xsl:message terminate=\\\"yes\\\">Forced runtime failure</xsl:message></xsl:template></xsl:stylesheet>\",
          \"xml\": \"<root><item>Hello</item></root>\"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.error.code").value("XSLT_RUNTIME_ERROR"))
        .andExpect(jsonPath("$.error.message").value("XSLT execution failed"))
        .andExpect(jsonPath("$.error.details").isNotEmpty());
  }

  // Verifies that requests missing XML are rejected by API validation.
  @Test
  void transformRejectsMissingXml() throws Exception {
    String requestBody = """
        {
          \"xslt\": \"<xsl:stylesheet version=\\\"3.0\\\"/>\"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.error.message").value("Request validation failed"))
        .andExpect(jsonPath("$.error.details").value("xml: xml must be provided"));
  }

  // Verifies that blank XSLT input is rejected before transformation begins.
  @Test
  void transformRejectsBlankXslt() throws Exception {
    String requestBody = """
        {
          \"xslt\": \"   \",
          \"xml\": \"<root/>\"
        }
        """;

    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.error.message").value("Request validation failed"))
        .andExpect(jsonPath("$.error.details").value("xslt: xslt must be provided"));
  }

  // Verifies that malformed JSON still returns the standardized error response.
  @Test
  void transformRejectsMalformedJson() throws Exception {
    mockMvc.perform(post("/transform")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{invalid-json}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("MALFORMED_REQUEST"))
        .andExpect(jsonPath("$.error.message").value("Request body is invalid JSON"));
  }
}
