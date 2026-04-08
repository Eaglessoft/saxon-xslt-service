/**
 * Boots the Spring Boot application and exposes the HTTP API entry point.
 * Keeps startup wiring in one place so the rest of the code stays framework-agnostic.
 */
package com.eaglesoft.xslttransformationservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class XsltTransformationServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(XsltTransformationServiceApplication.class, args);
  }
}

