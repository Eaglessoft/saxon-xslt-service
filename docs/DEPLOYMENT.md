# Deployment Guide

This guide explains how to package and deploy `saxon-xslt-service` with Docker, Docker Compose, Kubernetes, and the release image workflow.

## Overview

The service is packaged as a containerized Spring Boot application and listens on port `8080` inside the container.

## Build the Container Image

Build the image from the repository root:

```bash
docker build -t saxon-xslt-service -f Containerfile .
```

## Run with Docker

Run the container directly:

```bash
docker run --rm -p 8080:8080 saxon-xslt-service
```

The service is then reachable at:

- `http://localhost:8080/`
- `http://localhost:8080/health`
- `http://localhost:8080/embed/sample.html`

## Run with Docker Compose

An example Docker Compose definition is provided at `infra/docker-compose.yml`.

Start the service with:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Stop it with:

```bash
docker compose -f infra/docker-compose.yml down
```

The example Compose file uses image `eaglessoftbv/saxon-xslt-service:latest` and maps host port `80` to container port `8080`.

## Deploy to Kubernetes

An example Kubernetes manifest is provided at `infra/k8s-example.yaml`.

Apply it with:

```bash
kubectl apply -f infra/k8s-example.yaml
```

The example manifest includes:

- A `Deployment` with 2 replicas
- A `Service` exposing port `80`
- Readiness and liveness probes using `GET /health`

## Release Image Workflow

A GitHub Actions workflow is provided at `.github/workflows/container-build.yml`.

Behavior:

1. Triggered when a GitHub Release is published
2. Builds the Docker image from `Containerfile`
3. Pushes image tags to Docker Hub
4. Attempts to sync `README.md` to the Docker Hub repository description

Expected Docker Hub tags:

- release tag name
- `sha-<short-commit-sha>`
- `latest`

Required GitHub secrets:

- `EAGLESSOFT_REPOSITORY_USERNAME`
- `EAGLESSOFT_REPOSITORY_SECRET`

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
- Run `mvn test` before publishing a release because container image build currently uses `-DskipTests`.
