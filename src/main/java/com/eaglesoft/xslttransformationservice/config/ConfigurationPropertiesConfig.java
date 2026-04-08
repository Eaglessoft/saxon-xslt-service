/**
 * Registers typed configuration and infrastructure beans used across the service.
 * This keeps operational wiring separate from controllers, services, and engine logic.
 */
package com.eaglesoft.xslttransformationservice.config;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(XsltTransformationProperties.class)
public class ConfigurationPropertiesConfig {

  @Bean(destroyMethod = "close")
  ExecutorService transformationExecutor() {
    return Executors.newVirtualThreadPerTaskExecutor();
  }
}

