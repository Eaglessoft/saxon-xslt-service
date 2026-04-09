# Documentation

This directory contains the primary project documentation for `saxon-xslt-service`.

## Available Documents

- [`API.md`](API.md): HTTP API endpoints, request and response formats, and error model.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): contribution workflow, branching rules, and PR expectations.
- [`DEVELOPMENT.md`](DEVELOPMENT.md): local development setup, devcontainer usage, Maven commands, and verification flow.
- [`DEPLOYMENT.md`](DEPLOYMENT.md): Docker, Docker Compose, Kubernetes, and release image workflow guidance.
- [`EMBED_USAGE.md`](EMBED_USAGE.md): widget integration, API URL behavior, CSS loading, and legacy compatibility.
- [`TECHNICAL_OVERVIEW.md`](TECHNICAL_OVERVIEW.md): structure, runtime flow, and backend responsibilities.

## Quick Commands

```bash
mvn test
mvn spring-boot:run
docker build -t saxon-xslt-service -f Containerfile .
```

## Related Infrastructure

- Docker Compose example: [`../infra/docker-compose.yml`](../infra/docker-compose.yml)
- Kubernetes example: [`../infra/k8s-example.yaml`](../infra/k8s-example.yaml)
- Release image workflow: [`../.github/workflows/container-build.yml`](../.github/workflows/container-build.yml)
