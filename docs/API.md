# API Reference

This document defines the public HTTP surface of `saxon-xslt-service`.

## Base URL

The paths below are relative to the active host and port.

Typical local examples:

- `http://localhost:8080` when running directly on the host or via Docker port mapping
- `http://localhost:8081` when a development environment forwards container port `8080` to local port `8081`

## Endpoints

### `GET /health`

Returns the service health state.

Example response:

```json
{
  "status": "UP"
}
```

### `POST /transform`

Accepts raw XML and XSLT content and returns a single transformation result.

Example request:

```json
{
  "xslt": "<xsl:stylesheet version=\"3.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"><xsl:template match=\"/\"><result><xsl:value-of select=\"/root/item\"/></result></xsl:template></xsl:stylesheet>",
  "xml": "<root><item>Hello</item></root>"
}
```

Example success response:

```json
{
  "result": "<result>Hello</result>",
  "metadata": {
    "executionTimeMs": 12,
    "inputSize": 248,
    "outputSize": 22
  }
}
```

## Validation and Limits

The service requires both `xml` and `xslt` in every request.

Current defaults:

- XML max size: `10MB`
- XSLT max size: `2MB`
- Output max size: `10MB`
- Timeout: `30s`

These values can be changed through Spring Boot configuration.

## Local UI and Embed Paths

The same application also serves static frontend assets:

- `GET /`
- `GET /embed/sample.html`
- `GET /embed/xslt-widget.js`
- `GET /embed/xslt-widget.css`

Both the built-in UI and the embeddable widget call `POST /transform`.

## Error Format

All API errors follow the same JSON envelope.

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Description",
    "details": "Optional details"
  }
}
```

Common error codes:

- `VALIDATION_ERROR`
- `MALFORMED_REQUEST`
- `INPUT_SIZE_EXCEEDED`
- `OUTPUT_SIZE_EXCEEDED`
- `XSLT_COMPILATION_ERROR`
- `TIMEOUT_EXCEEDED`
- `XSLT_RUNTIME_ERROR`
- `INTERNAL_SERVER_ERROR`
