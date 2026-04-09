# Contributing Guide

This document defines the expected development workflow for this repository.

## Contribution Flow

1. Open or pick a GitHub Issue.
2. Create a branch from the latest target branch.
3. Implement only the scoped change.
4. Run tests and checks locally.
5. Open a Pull Request (PR) and request review.

## Issue Reporting (GitHub)

Use GitHub Issues for bugs, enhancements, and technical tasks.

### Bug Report Requirements

Include:

- Clear title and short summary
- Reproduction steps
- Expected behavior
- Actual behavior
- Environment details (OS, Java version, Maven version, Docker version if relevant)
- Application version or commit SHA
- Logs and stack traces (remove sensitive data)
- Screenshot/video for UI or embed issues when relevant

### Feature Request Requirements

Include:

- Problem statement
- Proposed solution
- Alternative options considered
- API/UI/embed impact
- Backward compatibility impact

## Branching Rules

Use one branch per issue.

Branch naming:

- `feature/<issue-id>-short-description`
- `fix/<issue-id>-short-description`
- `chore/<issue-id>-short-description`

Examples:

- `feature/977-add-release-workflow`
- `fix/977-remove-hardcoded-sample-port`

## Pull Request Conditions (GitHub)

A PR is ready for review only if all conditions below are met.

### 1. Traceability

- PR links a GitHub Issue: `Fixes #<id>` or `Refs #<id>`.
- PR scope matches the linked issue.

### 2. Build and Test

Run before opening a PR:

```bash
mvn -q test
```

For container-related changes, also run:

```bash
docker build -t saxon-xslt-service -f Containerfile .
```

### 3. Code Quality

- No unrelated refactors
- No dead code
- No breaking API/interface changes unless the issue explicitly requires it
- Logging and error responses remain production-appropriate

### 4. Documentation

Update docs if behavior, configuration, embed usage, or runtime flow changes.

Typical files:

- `README.md`
- `docs/DEVELOPMENT.md`
- `docs/EMBED_USAGE.md`

### 5. Security

- Do not commit secrets, private keys, or tokens
- Do not expose sensitive data in logs, screenshots, or examples
- Keep external resource access disabled in transformation flows unless explicitly approved

### 6. PR Description Must Include

- Summary
- Linked issue(s)
- What changed
- How to test
- Compatibility impact
- Screenshots (if UI or embed behavior changed)

## Review and Merge Policy

- At least one reviewer approval is required
- All review comments must be addressed
- CI checks must pass when configured
- Squash merge is preferred unless maintainers request otherwise

## Commit Message Guidance

Use short imperative messages.

Examples:

- `feat: add release docker workflow`
- `fix: remove missing .mvn copy from container build`
- `docs: align project documentation with repository standard`
