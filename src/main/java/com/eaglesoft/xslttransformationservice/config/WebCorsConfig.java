/**
 * Applies the embeddable widget CORS policy to the public transform endpoint.
 * Origins are driven by application properties so deployments can narrow access without code changes.
 */
package com.eaglesoft.xslttransformationservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

  private final XsltTransformationProperties properties;

  public WebCorsConfig(XsltTransformationProperties properties) {
    this.properties = properties;
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    // Keep CORS narrowly scoped to the embeddable API route instead of opening the whole service surface.
    registry.addMapping("/transform")
        .allowedOrigins(properties.getAllowedOrigins().toArray(String[]::new))
        .allowedMethods("POST", "OPTIONS")
        .allowedHeaders("Content-Type", "Accept", "Origin", "X-Requested-With")
        .maxAge(3600);
  }
}
