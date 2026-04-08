/**
 * Verifies service-layer orchestration such as metadata calculation around a successful transform.
 * This test sits between controller and engine coverage so orchestration stays explicit.
 */
package com.eaglesoft.xslttransformationservice.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.eaglesoft.xslttransformationservice.config.XsltTransformationProperties;
import com.eaglesoft.xslttransformationservice.dto.TransformRequest;
import com.eaglesoft.xslttransformationservice.dto.TransformResponse;
import com.eaglesoft.xslttransformationservice.engine.SaxonTransformationEngine;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class TransformationServiceTest {

  private final XsltTransformationProperties properties = new XsltTransformationProperties();
  private final ExecutorService transformationExecutor = Executors.newVirtualThreadPerTaskExecutor();
  private final TransformationService transformationService = new TransformationService(
      new TransformRequestValidator(properties),
      new SaxonTransformationEngine(properties),
      properties,
      transformationExecutor
  );

  // Closes the dedicated executor so each test leaves no background tasks behind.
  @AfterEach
  void tearDown() {
    transformationExecutor.close();
  }

  // Verifies that the service returns transformed output together with response metadata.
  @Test
  void transformReturnsResultMetadata() {
    TransformRequest request = new TransformRequest(
        """
        <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:template match="/">
            <result>
              <xsl:value-of select="/root/item"/>
            </result>
          </xsl:template>
        </xsl:stylesheet>
        """,
        "<root><item>Hello</item></root>"
    );

    TransformResponse response = transformationService.transform(request);

    // Metadata should always be present so API clients can inspect execution details.
    assertThat(response.result()).isEqualTo("<result>Hello</result>");
    assertThat(response.metadata()).isNotNull();
    assertThat(response.metadata().executionTimeMs()).isGreaterThanOrEqualTo(0);
    assertThat(response.metadata().inputSize()).isGreaterThan(0);
    assertThat(response.metadata().outputSize()).isEqualTo(22);
  }
}


