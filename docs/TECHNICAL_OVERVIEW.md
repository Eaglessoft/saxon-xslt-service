# Technical Overview

Short summary of project structure and runtime flow.

## Main Folders

- `src/main/java/com/eaglesoft/xslttransformationservice`
  - Backend Spring Boot application classes, controllers, services, engine, DTOs, config, and exception handling.
- `src/main/resources/static`
  - Built-in web UI assets served from `/`.
- `src/main/resources`
  - Application configuration (`application.yml`).
- `src/test/java/com/eaglesoft/xslttransformationservice`
  - Unit and web-layer tests.
- `.devcontainer`
  - Dev container definition for local development environment.
- `.github/workflows`
  - Release image workflow definition.
- `infra`
  - Docker Compose and Kubernetes deployment examples.
- `docs`
  - Project documentation.

## Backend Class Layout

- `XsltTransformationServiceApplication`
  - Spring Boot entry point.
- `TransformController`
  - Exposes `POST /transform`.
- `HealthController`
  - Exposes `GET /health`.
- `TransformationService`
  - Orchestrates validation, execution, timing, and response metadata.
- `TransformRequestValidator`
  - Enforces request presence and input size limits.
- `SaxonTransformationEngine`
  - Compiles and executes XSLT using Saxon-HE with runtime safeguards.
- `GlobalExceptionHandler`
  - Maps exceptions into the standard JSON error envelope.
- `XsltTransformationProperties`
  - Binds timeout, size, and embed CORS configuration from properties.
- `WebCorsConfig`
  - Applies the embeddable widget CORS policy to `POST /transform`.

## Runtime Flow (High Level)

1. Application starts in Spring Boot embedded Tomcat.
2. Static UI is served from `/` and embed assets are served from `/embed/*`.
3. Browser clients and embedded widgets submit XML and XSLT to `POST /transform`.
4. CORS policy is applied to `/transform` for embeddable third-party use.
5. Bean validation and request size validation run before execution.
6. Saxon compiles the stylesheet and performs the transformation.
7. Timeout, output-size, and external-resource restrictions are enforced.
8. JSON success or error response is returned to the client.

## Container Runtime Notes

- Container runs the packaged application from `/app/app.jar`.
- Default internal HTTP port is `80`.
- Health checks should target `/health`.
- The GitHub Actions release workflow builds and pushes the Docker image when a GitHub Release is published.
