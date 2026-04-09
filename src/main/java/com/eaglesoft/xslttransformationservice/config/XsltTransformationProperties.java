/**
 * Holds configurable timeout and size limits for transformation requests and responses.
 * These values are bound from application configuration so operational changes do not require code changes.
 */
package com.eaglesoft.xslttransformationservice.config;

import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.convert.DataSizeUnit;
import org.springframework.util.unit.DataSize;
import org.springframework.util.unit.DataUnit;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "xslt.transformation")
public class XsltTransformationProperties {

  @NotNull
  private Duration timeout = Duration.ofSeconds(30);

  @NotNull
  @DataSizeUnit(DataUnit.BYTES)
  private DataSize maxXmlSize = DataSize.ofMegabytes(10);

  @NotNull
  @DataSizeUnit(DataUnit.BYTES)
  private DataSize maxXsltSize = DataSize.ofMegabytes(2);

  @NotNull
  private List<String> allowedOrigins = List.of("*");

  @NotNull
  @DataSizeUnit(DataUnit.BYTES)
  private DataSize maxOutputSize = DataSize.ofMegabytes(10);

  public Duration getTimeout() {
    return timeout;
  }

  public void setTimeout(Duration timeout) {
    this.timeout = timeout;
  }

  public DataSize getMaxXmlSize() {
    return maxXmlSize;
  }

  public void setMaxXmlSize(DataSize maxXmlSize) {
    this.maxXmlSize = maxXmlSize;
  }

  public DataSize getMaxXsltSize() {
    return maxXsltSize;
  }

  public void setMaxXsltSize(DataSize maxXsltSize) {
    this.maxXsltSize = maxXsltSize;
  }

  public List<String> getAllowedOrigins() {
    return allowedOrigins;
  }

  public void setAllowedOrigins(List<String> allowedOrigins) {
    this.allowedOrigins = allowedOrigins;
  }

  public DataSize getMaxOutputSize() {
    return maxOutputSize;
  }

  public void setMaxOutputSize(DataSize maxOutputSize) {
    this.maxOutputSize = maxOutputSize;
  }
}
