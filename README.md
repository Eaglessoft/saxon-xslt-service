# Saxon XSLT Service

This project is developed by [Eaglessoft](https://eaglessoft.com/) and uses Saxon-HE (Saxonica) as the transformation engine for XSLT 3.0 transformations over XML.

## Features

- Transforms XML payloads with user-provided XSLT 3.0 stylesheets.
- Provides a web UI (`/`) and JSON API endpoints.
- Exposes reusable embed assets for third-party websites.
- Returns structured success and error responses.
- Supports runtime configuration for timeout, size limits, and embed CORS origins through Spring Boot properties and environment variables.
- Includes Docker, Docker Compose, Kubernetes, devcontainer, and release workflow examples.

## Requirements

- Java 25
- Maven 3.9+
- Docker

## Documentation

- This README is the primary entry point for project overview, local run, API usage, and deployment basics.
- Development setup and local run flow: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)
- Contribution rules (issues and PR conditions): [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)
- Technical structure summary: [`docs/TECHNICAL_OVERVIEW.md`](docs/TECHNICAL_OVERVIEW.md)
- Embed/Web Component integration: [`docs/EMBED_USAGE.md`](docs/EMBED_USAGE.md)
- Infrastructure examples:
  - Kubernetes: [`infra/k8s-example.yaml`](infra/k8s-example.yaml)
  - Docker Compose: [`infra/docker-compose.yml`](infra/docker-compose.yml)
- GitHub Actions release image workflow: [`.github/workflows/container-build.yml`](.github/workflows/container-build.yml)

## Repository Notes

- Built-in UI assets live under `src/main/resources/static`.
- Embed source assets are expected under the repository-root `embed/` folder and are packaged to `/embed/*` during the Maven build.

## Build the Container

```bash
docker build -t eaglessoftbv/saxon-xslt-service -f Containerfile .
```

Note: Maven tests are executed during the container build stage.

## Run the Container

### 1) Run on the default local port mapping

```bash
docker run --rm -p 8080:8080 eaglessoftbv/saxon-xslt-service
```

### 2) Run on a different host port

```bash
docker run --rm -p 8081:8080 eaglessoftbv/saxon-xslt-service
```

### 3) Run with custom transformation limits

```bash
docker run --rm -p 8080:80 \
  -e XSLT_TRANSFORMATION_TIMEOUT=45s \
  -e XSLT_TRANSFORMATION_MAX_OUTPUT_SIZE=5MB \
  eaglessoftbv/saxon-xslt-service
```

### 4) Run with embed origins restricted

```bash
docker run --rm -p 8080:80 \
  -e XSLT_TRANSFORMATION_ALLOWED_ORIGINS="https://site-a.example,https://site-b.example" \
  saxon-xslt-service
```

## Access URLs

Default local mapping (`8080:80`):

- UI: `http://localhost:8080/`
- Health: `http://localhost:8080/health`
- Transform endpoint: `http://localhost:8080/transform`
- Embed sample: `http://localhost:8080/embed/sample.html`
- Widget JS: `http://localhost:8080/embed/xslt-widget.js`
- Widget CSS: `http://localhost:8080/embed/xslt-widget.css`

Alternate host port example (`8081:80`):

- UI: `http://localhost:8081/`
- Health: `http://localhost:8081/health`
- Transform endpoint: `http://localhost:8081/transform`
- Embed sample: `http://localhost:8081/embed/sample.html`

## API Usage

### 1) Check service health

```bash
curl -s http://localhost:8080/health
```

### 2) Submit a transformation request

```bash
curl -s -X POST "http://localhost:8080/transform" \
  -H "Content-Type: application/json" \
  -d '{
    "xslt": "<xsl:stylesheet version=\"3.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"><xsl:template match=\"/\"><result><xsl:value-of select=\"/root/item\"/></result></xsl:template></xsl:stylesheet>",
    "xml": "<root><item>Hello</item></root>"
  }'
```

## Runtime Configuration

- `SERVER_PORT` (optional, default: `8080`)
  - Spring Boot HTTP port.
- `XSLT_TRANSFORMATION_TIMEOUT` (default: `30s`)
  - Maximum transformation execution time.
- `XSLT_TRANSFORMATION_MAX_XML_SIZE` (default: `10MB`)
  - Maximum accepted XML request size.
- `XSLT_TRANSFORMATION_MAX_XSLT_SIZE` (default: `2MB`)
  - Maximum accepted XSLT request size.
- `XSLT_TRANSFORMATION_ALLOWED_ORIGINS` (default: `*`)
  - Comma-separated list of origins allowed to call `POST /transform` from embedded third-party pages.
- `XSLT_TRANSFORMATION_MAX_OUTPUT_SIZE` (default: `10MB`)
  - Maximum response payload size.

## Example Runtime Configurations

### Default local run

```bash
mvn spring-boot:run
```

### Custom port + timeout

```bash
SERVER_PORT=8081 XSLT_TRANSFORMATION_TIMEOUT=45s mvn spring-boot:run
```

### Restricted embed origins

```bash
XSLT_TRANSFORMATION_ALLOWED_ORIGINS="https://site-a.example,https://site-b.example" mvn spring-boot:run
```

## Troubleshooting

- If the UI does not open, verify the host port mapping and use `/` as the entry URL.
- If the embed sample does not transform, make sure the widget is loaded from the same host/port as the API or provide `api-url` / `endpoint` explicitly.
- If the widget is embedded on a different origin, allow that origin through `XSLT_TRANSFORMATION_ALLOWED_ORIGINS`.
- If a Docker release workflow fails, verify Docker Hub secrets and repository names in `.github/workflows/container-build.yml`.
- If local runtime fails on port `8080`, use a different host port or set `SERVER_PORT`.
