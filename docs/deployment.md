# Deployment Guide

## Overview

The service is packaged as a containerized Spring Boot application and can be deployed with plain Docker, Docker Compose, or Kubernetes.

The application listens on port `8080` inside the container.

## Build The Container Image

Build the image from the repository root:

```bash
docker build -f Containerfile -t saxon-xslt-service .
```

## Run With Docker

Run the container directly:

```bash
docker run --rm -p 80:8080 saxon-xslt-service
```

With this mapping, the service is reachable on the host at:

- `http://localhost/`
- `http://localhost/health`
- `http://localhost/embed/sample.html`

## Run With Docker Compose

An example Docker Compose definition is provided at `infra/docker-compose.yml`.

Start the service with:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Stop it with:

```bash
docker compose -f infra/docker-compose.yml down
```

The example Compose file maps host port `80` to container port `8080`.

## Deploy To Kubernetes

An example Kubernetes manifest is provided at `infra/k8s-example.yaml`.

Apply it with:

```bash
kubectl apply -f infra/k8s-example.yaml
```

The example manifest includes:

- a `Deployment` with 2 replicas
- a `Service` exposing port `80`
- readiness and liveness probes using `GET /health`

## Runtime Endpoints

After deployment, the main paths to verify are:

- `/`
- `/health`
- `/transform`
- `/embed/sample.html`
- `/embed/xslt-widget.js`
- `/embed/xslt-widget.css`

## Deployment Notes

- The final public domain is not hardcoded in the application.
- Embed examples can be updated after deployment with the real domain.
- The repository currently provides deployment artifacts and examples, but registry publishing and CI/CD workflow setup can be added separately if needed.
