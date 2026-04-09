# Embed Integration Guide

You can embed the transformation widget with one script and one HTML tag.

## Quick Start

Use this form when the widget is loaded from a different origin than the API or when you want the request target to be explicit.

```html
<script src="https://cdn.jsdelivr.net/gh/eaglessoft/saxon-xslt-service@main/embed/xslt-widget.js"></script>
<xslt-transformation-widget api-url="https://your-domain.com"></xslt-transformation-widget>
```

`xslt-widget.js` automatically loads `xslt-widget.css` from the same path by default.

## Correct Usage

### 1) Widget and API on the same origin

If the widget files are served by the same application that exposes `/transform`, `api-url` is optional.

```html
<script src="https://your-domain.com/embed/xslt-widget.js"></script>
<xslt-transformation-widget></xslt-transformation-widget>
```

### 2) Widget and API on different origins

If the widget script is served from a CDN or any origin different from the API, set `api-url` explicitly.

```html
<script src="https://cdn.jsdelivr.net/gh/eaglessoft/saxon-xslt-service@main/embed/xslt-widget.js"></script>
<xslt-transformation-widget api-url="https://your-domain.com"></xslt-transformation-widget>
```

### 3) Full endpoint override

If you want full control over the request target, use `endpoint`.

```html
<xslt-transformation-widget endpoint="https://your-domain.com/transform"></xslt-transformation-widget>
```

## API URL Behavior

API target resolution works in this order:

1. `endpoint` attribute on `<xslt-transformation-widget>`
2. `api-url` attribute on `<xslt-transformation-widget>` + `/transform`
3. Built-in default derived from the widget script location

## CORS Requirement

Third-party embedding requires CORS support on the API origin.

If the host page origin is different from the API origin, allow that origin through the service configuration. The default configuration allows all origins:

```bash
XSLT_TRANSFORMATION_ALLOWED_ORIGINS="*"
```

To restrict access to specific sites, provide a comma-separated list:

```bash
XSLT_TRANSFORMATION_ALLOWED_ORIGINS="https://site-a.example,https://site-b.example"
```

## CSS Loading Options

### Default (auto CSS enabled)

No extra step is required. JS injects `xslt-widget.css` automatically.

### Manual CSS (disable auto CSS)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/eaglessoft/saxon-xslt-service@main/embed/xslt-widget.css">
<script src="https://cdn.jsdelivr.net/gh/eaglessoft/saxon-xslt-service@main/embed/xslt-widget.js"></script>
<xslt-transformation-widget api-url="https://your-domain.com" auto-css="false"></xslt-transformation-widget>
```

### Custom CSS URL for auto load

```html
<script src="https://cdn.jsdelivr.net/gh/eaglessoft/saxon-xslt-service@main/embed/xslt-widget.js" data-css-url="https://cdn.example.com/custom/xslt-widget.css"></script>
<xslt-transformation-widget api-url="https://your-domain.com"></xslt-transformation-widget>
```

## CSS Customization (Quick)

You can style the widget by overriding the existing class names in your page CSS.

Example:

```css
.xslt-widget .xslt-widget__button {
  background: #0f766e;
}

.xslt-widget .xslt-widget__title {
  font-size: 1.8rem;
}
```

Recommended approach:

1. Include default `xslt-widget.css` first.
2. Add your override CSS after it.
3. Keep selectors scoped under `.xslt-widget`.

### CSS Variables (Recommended)

`xslt-widget.css` exposes theme variables on `.xslt-widget`.
You can override them directly:

```css
.xslt-widget {
  --widget-primary: #0f766e;
  --widget-primary-strong: #115e59;
  --widget-text: #0f172a;
  --widget-text-soft: #475569;
  --widget-surface: #ffffff;
  --widget-border: #cbd5e1;
  --widget-radius: 10px;
  --widget-shadow: 0 8px 20px rgba(15, 118, 110, 0.2);
}
```

Main variables:

- `--widget-primary`
- `--widget-primary-strong`
- `--widget-link`
- `--widget-link-hover`
- `--widget-success`
- `--widget-success-ink`
- `--widget-error`
- `--widget-error-ink`
- `--widget-surface`
- `--widget-surface-soft`
- `--widget-text`
- `--widget-text-soft`
- `--widget-border`
- `--widget-border-strong`
- `--widget-code-bg`
- `--widget-code-ink`
- `--widget-shadow`
- `--widget-shadow-hover`
- `--widget-radius`

## Endpoints Used

- `POST {api-base}/transform`

## Sample File

- Source files: `embed/`
- Example HTML page: `embed/sample.html`
- Served sample URL: `/embed/sample.html`
- Runtime packaging: Maven includes the root `embed/` directory under `static/embed`, so the public asset URLs remain `/embed/*`.
