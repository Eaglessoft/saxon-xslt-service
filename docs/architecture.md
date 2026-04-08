# Architecture Overview

## Current Structure

The service currently follows a simple layered layout:

- `controller`: HTTP endpoints and request handling
- `service`: orchestration and request validation flow
- `engine`: Saxon-backed XSLT execution
- `dto`: API request and response models
- `config`: application configuration and properties binding
- `exception`: global error handling and custom exceptions

## Request Flow

1. A client sends a request to `POST /transform`.
2. The controller receives the JSON payload.
3. Bean validation checks required fields.
4. Request size validation runs in the service layer.
5. The Saxon-backed engine performs the transformation.
6. The service returns a transformation response.
7. Exceptions are translated into the standard JSON error envelope.

## Configuration

Application settings are defined in `application.yml` and bound through `XsltTransformationProperties`.

Current configurable values:

- `timeout`
- `max-xml-size`
- `max-xslt-size`
- `max-output-size`

## Error Handling

All API errors are normalized through `GlobalExceptionHandler`.

Current handled categories:

- request validation errors
- malformed JSON requests
- XSLT compilation failures
- XSLT runtime failures
- timeout violations
- input size violations
- output size violations
- unexpected server errors

## UI Layer

A lightweight static UI is served from `src/main/resources/static`.

Current UI responsibilities:

- collect XML input
- collect XSLT input
- allow local file upload for both inputs
- submit a transformation request
- show formatted JSON results
- expose embeddable assets for third-party sites

## Deployment Notes

The repository is ready to be published as an open source project without hardcoding a production domain.

Current docs intentionally use placeholder values such as `https://your-domain.example` for embed examples. The final deployed domain can be added later without changing the internal application structure or endpoint paths.
