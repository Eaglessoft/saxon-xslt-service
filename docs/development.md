# Development Guide

## Local Requirements

- Java 21
- Maven 3.9+
- Docker Desktop for container workflows
- Visual Studio Code for devcontainer usage

## Primary Maven Commands

Run the application locally:

```bash
mvn spring-boot:run
```

If port `8080` is busy:

```bash
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

Run the current unit and web-layer tests:

```bash
mvn test
```

## Local Access

By default, the application starts on `http://localhost:8080`.

When you run inside a VS Code dev container, the service may listen on `8080` in the container while VS Code forwards it to another local port such as `http://localhost:8081`.

Use whichever local base URL is active in your environment and append the paths below.

## Built-In UI And API

Built-in UI:

- `/`
- `/embed/sample.html`

API endpoints:

- `GET /health`
- `POST /transform`

Examples on the default port:

- `http://localhost:8080/`
- `http://localhost:8080/health`
- `http://localhost:8080/embed/sample.html`

## Embeddable Widget Assets

The project also exposes reusable frontend assets for third-party pages:

- `/embed/xslt-widget.css`
- `/embed/xslt-widget.js`

These assets use the same `POST /transform` endpoint as the built-in UI.

Minimal same-origin example:

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

When the widget is hosted on a different domain than the page using it, pass absolute URLs instead:

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

The production domain is not fixed in the repository yet. Keep example values such as `https://your-domain.example` as placeholders and replace them after deployment.

## Docker Workflow

Build the image:

```bash
docker build -f Containerfile -t xslt-transformation-service .
```

Run the container:

```bash
docker run --rm -p 80:8080 xslt-transformation-service
```

With that mapping, the service is reachable from the host at:

- `http://localhost/`
- `http://localhost/health`
- `http://localhost/embed/sample.html`

## Devcontainer Workflow

The project includes `.devcontainer/devcontainer.json` and `.devcontainer/Containerfile` for VS Code.

Typical flow:

1. Open the project in VS Code.
2. Run `Dev Containers: Reopen in Container`.
3. Wait for the post-create command to finish.
4. Run or test the project from the container terminal.

## Current Notes

- The backend uses Saxon-HE for XML and XSLT transformations.
- Transformation limits are configured through `application.yml`.
- The built-in page and the embeddable widget both talk to the same `/transform` API.
- The fastest verification flow during development is usually `mvn test`, then `mvn spring-boot:run`, then checking `/`, `/health`, and `/embed/sample.html`.
