# API Reference

## Base URL

The service paths below are relative to the active host and port.

Typical local examples:

- `http://localhost:8080` when running directly on the host
- `http://localhost:8081` when a dev environment forwards container port `8080` to local port `8081`

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

## Local UI And Embed Paths

The repository also serves static frontend assets from the same application:

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

## Widget Usage Note

The embeddable widget assets at `/embed/xslt-widget.css` and `/embed/xslt-widget.js` call the same `POST /transform` endpoint described here.


When publishing the project publicly, replace placeholder domains such as `https://your-domain.example` with the real deployed domain. This can be decided later and does not require changing the API contract.
