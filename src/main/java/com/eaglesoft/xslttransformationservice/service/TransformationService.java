/**
 * Orchestrates request validation, timeout handling, transformation execution, and metadata creation.
 * It keeps controller code small while delegating engine-specific work to the transformation engine.
 */
package com.eaglesoft.xslttransformationservice.service;

import com.eaglesoft.xslttransformationservice.config.XsltTransformationProperties;
import com.eaglesoft.xslttransformationservice.dto.TransformMetadata;
import com.eaglesoft.xslttransformationservice.dto.TransformRequest;
import com.eaglesoft.xslttransformationservice.dto.TransformResponse;
import com.eaglesoft.xslttransformationservice.engine.SaxonTransformationEngine;
import com.eaglesoft.xslttransformationservice.exception.TransformationTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.springframework.stereotype.Service;

@Service
public class TransformationService {

  private final TransformRequestValidator requestValidator;
  private final SaxonTransformationEngine transformationEngine;
  private final XsltTransformationProperties properties;
  private final ExecutorService transformationExecutor;

  // Wires the validator, engine, configuration, and executor used by the service.
  public TransformationService(
      TransformRequestValidator requestValidator,
      SaxonTransformationEngine transformationEngine,
      XsltTransformationProperties properties,
      ExecutorService transformationExecutor
  ) {
    this.requestValidator = requestValidator;
    this.transformationEngine = transformationEngine;
    this.properties = properties;
    this.transformationExecutor = transformationExecutor;
  }

  // Validates the request, runs the transformation, and returns the result with metadata.
  public TransformResponse transform(TransformRequest request) {
    requestValidator.validate(request);

    long startedAt = System.nanoTime();
    String result = executeWithTimeout(request);
    long executionTimeMs = (System.nanoTime() - startedAt) / 1_000_000;
    long inputSize = sizeOf(request.xml()) + sizeOf(request.xslt());
    long outputSize = sizeOf(result);

    return new TransformResponse(
        result,
        new TransformMetadata(executionTimeMs, inputSize, outputSize)
    );
  }

  // Executes the transformation on the executor and enforces the configured timeout.
  private String executeWithTimeout(TransformRequest request) {
    // Run the transformation on a separate task so we can enforce the configured timeout.
    Future<String> transformationTask = transformationExecutor.submit(
        () -> transformationEngine.transform(request.xml(), request.xslt())
    );

    try {
      long timeoutInMillis = properties.getTimeout().toMillis();
      return transformationTask.get(timeoutInMillis, TimeUnit.MILLISECONDS);
    } catch (TimeoutException exception) {
      transformationTask.cancel(true);
      throw new TransformationTimeoutException(
          "Transformation timed out",
          "execution exceeded configured timeout of " + properties.getTimeout(),
          exception
      );
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Transformation execution was interrupted", exception);
    } catch (ExecutionException exception) {
      Throwable cause = exception.getCause();
      if (cause instanceof RuntimeException runtimeException) {
        throw runtimeException;
      }
      throw new IllegalStateException("Transformation execution failed", cause);
    }
  }

  // Calculates the UTF-8 byte size of a value for request and response metadata.
  private long sizeOf(String value) {
    if (value == null) {
      return 0;
    }

    return value.getBytes(StandardCharsets.UTF_8).length;
  }
}




