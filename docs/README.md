# Documentation

Project documentation for the current repository layout lives in this directory.

Available documents:

- `api.md`: HTTP API, local URLs, widget asset endpoints, and error format
- `development.md`: local run, test, debug, Docker, and devcontainer workflows
- `deployment.md`: Docker, Docker Compose, and Kubernetes deployment options
- `architecture.md`: current application structure and request flow

Important current commands:

```bash
mvn test
mvn spring-boot:run
```

Local access points are based on the port where the application is running, typically `http://localhost:8080` unless another port is configured or forwarded by the development environment.
