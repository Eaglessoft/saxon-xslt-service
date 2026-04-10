/**
 * Serves the main HTML shell with a runtime base href so the UI can run under custom context paths.
 * Static assets remain in the regular Spring Boot resource pipeline; only the HTML entry page is rendered dynamically.
 */
package com.eaglesoft.xslttransformationservice.controller;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class IndexController {

  private static final String INDEX_TEMPLATE_PATH = "ui/index.html";
  private static final String BASE_PLACEHOLDER = "__APP_BASE_HREF__";
  private static final MediaType HTML_UTF8 = new MediaType("text", "html", StandardCharsets.UTF_8);

  @GetMapping(value = {"/", "/index.html"}, produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> index(HttpServletRequest request) throws IOException {
    String html = loadTemplate().replace(BASE_PLACEHOLDER, normalizeBaseHref(request.getContextPath()));
    return ResponseEntity.ok()
        .contentType(HTML_UTF8)
        .body(html);
  }

  private static String normalizeBaseHref(String contextPath) {
    if (contextPath == null || contextPath.isBlank() || "/".equals(contextPath)) {
      return "/";
    }

    String normalized = contextPath.trim();
    if (!normalized.startsWith("/")) {
      normalized = "/" + normalized;
    }
    if (!normalized.endsWith("/")) {
      normalized = normalized + "/";
    }
    return normalized;
  }

  private static String loadTemplate() throws IOException {
    ClassPathResource resource = new ClassPathResource(INDEX_TEMPLATE_PATH);
    try (InputStream inputStream = resource.getInputStream()) {
      return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }
  }
}
