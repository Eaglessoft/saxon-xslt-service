/**
 * Serves the main HTML shell with a runtime base href so the UI can run under custom context paths.
 * Static assets remain in the regular Spring Boot resource pipeline; only the HTML entry page is rendered dynamically.
 */
package com.eaglesoft.xslttransformationservice.controller;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.zip.CRC32;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class IndexController {

  private static final String INDEX_TEMPLATE_PATH = "ui/index.html";
  private static final String BASE_PLACEHOLDER = "__APP_BASE_HREF__";
  private static final String ASSET_PLACEHOLDER = "__ASSET_V__";

  /** The assets the stamp covers - every file the page requests with ?v=. */
  private static final List<String> VERSIONED_ASSETS =
      List.of("static/app.css", "static/app.js", "static/panes.js", "static/editor.js");

  /**
   * One stamp for every asset URL on the page, derived from the assets themselves.
   *
   * It used to be a hand-written "?v=4.0" in the markup, which meant remembering to raise it
   * on every CSS or JS change - and forgetting served the new document against cached assets,
   * so the page came up half old with no error anywhere.
   *
   * The content is hashed rather than the jar's version read, which was the first attempt and
   * is wrong here: the manifest carries the Maven version, which stays 0.0.1-SNAPSHOT across
   * every build until someone releases, so the stamp would not have moved when the assets did.
   * Hashing changes the stamp exactly when a file changes and not otherwise, so a restart of
   * the same build keeps returning visitors' caches warm. CRC32 is enough - this identifies a
   * revision, it does not defend against one.
   */
  private static final String ASSET_VERSION = resolveAssetVersion();
  private static final MediaType HTML_UTF8 = new MediaType("text", "html", StandardCharsets.UTF_8);

  @GetMapping(value = {"/", "/index.html"}, produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> index(HttpServletRequest request) throws IOException {
    String html = loadTemplate()
        .replace(BASE_PLACEHOLDER, normalizeBaseHref(request.getContextPath()))
        .replace(ASSET_PLACEHOLDER, ASSET_VERSION);
    // The ?v= query strings keep the browser honest about CSS and JS, but nothing
    // was protecting the document that references them: with no Cache-Control the
    // browser caches this page heuristically, so after a deploy a returning
    // visitor gets the new stylesheet against the old markup. Revalidate every
    // time - the page is small and it is rendered per request anyway.
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noCache().mustRevalidate())
        .contentType(HTML_UTF8)
        .body(html);
  }

  private static String resolveAssetVersion() {
    CRC32 digest = new CRC32();
    for (String assetPath : VERSIONED_ASSETS) {
      try (InputStream stream = new ClassPathResource(assetPath).getInputStream()) {
        digest.update(stream.readAllBytes());
      } catch (IOException exception) {
        /* An asset that cannot be read cannot be hashed, and a stamp that quietly skipped it
           would go stale precisely when that file changed. Start time is cache-cold but never
           stale, which is the right way round to fail. */
        return Long.toString(Instant.now().getEpochSecond());
      }
    }
    return Long.toHexString(digest.getValue());
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
