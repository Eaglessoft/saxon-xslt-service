/**
 * Accepts XML and XSLT payloads over HTTP and delegates execution to the transformation service.
 * The controller stays thin so request handling and transformation orchestration remain separate.
 */
package com.eaglesoft.xslttransformationservice.controller;

import com.eaglesoft.xslttransformationservice.dto.TransformRequest;
import com.eaglesoft.xslttransformationservice.dto.TransformResponse;
import com.eaglesoft.xslttransformationservice.service.TransformationService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class TransformController {

  private final TransformationService transformationService;

  public TransformController(TransformationService transformationService) {
    this.transformationService = transformationService;
  }

  @PostMapping(path = "/transform", consumes = MediaType.APPLICATION_JSON_VALUE)
  public TransformResponse transform(@Valid @RequestBody TransformRequest request) {
    return transformationService.transform(request);
  }
}


