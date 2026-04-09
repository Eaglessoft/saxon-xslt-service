# Development Guide

This guide explains how to run the project locally for development using VS Code (recommended), Dev Containers, Maven, and Docker.

## Recommended Setup

- IDE: Visual Studio Code
- Extension: `Dev Containers` (Microsoft)
- Java: 25
- Maven: 3.9+
- Docker: required for container verification

## Start Development Environment (VS Code + Dev Container)

1. Open the repository in VS Code.
2. Run: `Dev Containers: Reopen in Container`.
3. Wait until the container build/start is complete.
4. Verify tools inside the container:

```bash
java -version
mvn -version
```

Dev container configuration is located at:

- `.devcontainer/devcontainer.json`
- `.devcontainer/Containerfile`

## Project Run Flow (Maven)

### Main commands

- `mvn test`
  - Runs the unit and web-layer test suite.
- `mvn spring-boot:run`
  - Starts the application on `8080` by default.
- `mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"`
  - Starts the application on an alternate port.
- `docker build -t saxon-xslt-service -f Containerfile .`
  - Verifies the container image build.

## How to Run in VS Code

1. Open the repository.
2. If using Dev Containers, reopen the workspace in the container.
3. Start the application with `mvn spring-boot:run` from the integrated terminal.
4. Open the UI at `http://localhost:8080/`.
5. Stop the application with `Ctrl+C`.

## How to Run from Terminal

From the repository root:

```bash
mvn spring-boot:run
```

If `8080` is busy:

```bash
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

## Useful Endpoints During Development

- UI: `http://localhost:8080/`
- Health: `http://localhost:8080/health`
- Transform: `http://localhost:8080/transform`
- Embed sample: `http://localhost:8080/embed/sample.html`
- Widget JS: `http://localhost:8080/embed/xslt-widget.js`
- Widget CSS: `http://localhost:8080/embed/xslt-widget.css`

## Test and Verification

Run tests before opening a PR:

```bash
mvn -q test
```

Verify the container build when container-related files change:

```bash
docker build -t saxon-xslt-service -f Containerfile .
```

Optional smoke flow:

1. Run `mvn spring-boot:run`
2. Open `/`, `/health`, and `/embed/sample.html`
3. Submit a sample transformation through the UI or widget
4. If you test the widget from another origin, set `api-url` explicitly and allow that origin through `XSLT_TRANSFORMATION_ALLOWED_ORIGINS`

## Repository Notes

- The repository includes a committed `.devcontainer/` configuration for a ready-to-use VS Code environment.
- The repository does not depend on committed `.vscode/tasks.json` files; use Maven commands directly from the terminal.
- Keep development docs in sync with devcontainer, Docker, or Maven command changes.
