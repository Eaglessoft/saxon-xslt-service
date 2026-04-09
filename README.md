# XSLT Transformation Service

Stateless Java service for executing XSLT 3.0 transformations over HTTP.

## Overview

The service accepts raw XML and XSLT inputs, runs a single transformation, and returns the result in a JSON response. It also exposes:

- a built-in web UI for local testing
- embeddable widget assets for third-party websites
- structured JSON error responses

## Current Scope

- `POST /transform` endpoint for XML + XSLT input
- `GET /health` endpoint
- Built-in UI at `/`
- Embed demo page at `/embed/sample.html`
- Embeddable widget assets at `/embed/xslt-widget.js` and `/embed/xslt-widget.css`
- Structured JSON success and error responses
- Container and VS Code devcontainer bootstrap
- Test-first backend workflow

## Run Locally

```bash
mvn spring-boot:run
```

The application starts on `http://localhost:8080` by default.

If `8080` is already in use, run on a different port:

```bash
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

If you are using VS Code dev containers, the service may still run on `8080` inside the container while VS Code forwards it to a different local port such as `http://localhost:8081`.

## Run Tests

Run the current unit and web-layer test suite with:

```bash
mvn test
```

The repository currently includes tests for:

- controller and API behavior
- validation and limit handling
- timeout and output limit behavior
- transformation service flow
- Saxon transformation engine behavior

## Local URLs

When the application is running locally, check these paths under your active base URL:

- `/`
- `/health`
- `/transform`
- `/embed/sample.html`
- `/embed/xslt-widget.js`
- `/embed/xslt-widget.css`

Examples when the default port is free:

- `http://localhost:8080/`
- `http://localhost:8080/health`
- `http://localhost:8080/embed/sample.html`

If the application is started on another port, replace `8080` with that port.

## Run With Docker

```bash
docker build -f Containerfile -t saxon-xslt-service .
docker run --rm -p 80:8080 saxon-xslt-service
```

## Embeddable Widget

Third-party pages can reuse the same transformation UI by loading the widget CSS and JS from this service and mounting it into any container element.

Same-origin example:

```html
<link rel="stylesheet" href="/embed/xslt-widget.css">
<div id="xslt-widget"></div>
<script src="/embed/xslt-widget.js"></script>
<script>
  window.XsltTransformationWidget.mount({
    target: "#xslt-widget",
    endpoint: "/transform"
  });
</script>
```

Cross-origin or production example:

```html
<link rel="stylesheet" href="https://your-domain.example/embed/xslt-widget.css">
<div id="xslt-widget"></div>
<script src="https://your-domain.example/embed/xslt-widget.js"></script>
<script>
  window.XsltTransformationWidget.mount({
    target: "#xslt-widget",
    endpoint: "https://your-domain.example/transform"
  });
</script>
```

`your-domain.example` is a placeholder. The final public domain can be added after deployment without changing the widget integration pattern.

## Documentation

Project documentation lives under the [`docs`](./docs) directory.

- API reference: [`docs/api.md`](./docs/api.md)
- Development guide: [`docs/development.md`](./docs/development.md)
- Deployment guide: [`docs/deployment.md`](./docs/deployment.md)
- Architecture overview: [`docs/architecture.md`](./docs/architecture.md)
- Documentation index: [`docs/README.md`](./docs/README.md)
