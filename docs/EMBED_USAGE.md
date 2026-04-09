# Embed Integration Guide

You can embed the transformation widget with one script and one HTML tag.

## Quick Start

```html
<script src="https://your-domain.example/embed/xslt-widget.js"></script>
<xslt-transformation-widget></xslt-transformation-widget>
```

`xslt-widget.js` automatically loads `xslt-widget.css` from the same path by default.

## API URL Behavior

API base URL is resolved in this order:

1. `api-url` attribute on `<xslt-transformation-widget>`
2. `data-api-url` on the script tag (legacy support and default override)
3. Built-in default derived from the widget script location

If `endpoint` is provided on the element, it overrides the computed `/transform` endpoint completely.

Examples:

```html
<xslt-transformation-widget api-url="https://your-domain.com"></xslt-transformation-widget>
```

```html
<xslt-transformation-widget endpoint="https://your-domain.com/transform"></xslt-transformation-widget>
```

## CSS Loading Options

### Default (auto CSS enabled)

No extra step is required. JS injects `xslt-widget.css` automatically.

### Manual CSS (disable auto CSS)

```html
<link rel="stylesheet" href="https://your-domain.example/embed/xslt-widget.css">
<script src="https://your-domain.example/embed/xslt-widget.js"></script>
<xslt-transformation-widget auto-css="false"></xslt-transformation-widget>
```

### Custom CSS URL for auto load

```html
<script src="https://your-domain.example/embed/xslt-widget.js" data-css-url="https://cdn.example.com/custom/xslt-widget.css"></script>
<xslt-transformation-widget></xslt-transformation-widget>
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

## Legacy Compatibility

Old integration still works:

```html
<div class="xslt-widget" data-api-url="https://your-api-url"></div>
<script src="https://your-domain.example/embed/xslt-widget.js"></script>
```

Legacy mode also supports `data-auto-css="false"` and `data-endpoint`.

## Endpoints Used

- `POST {api-base}/transform`

## Sample File

- Example HTML page: `src/main/resources/static/embed/sample.html`
- Served sample URL: `/embed/sample.html`
