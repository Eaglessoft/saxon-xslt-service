/*
 * Exposes a reusable embeddable widget for the XSLT transformation service.
 * Supports custom-element usage and optional automatic CSS loading.
 */
(function attachXsltTransformationWidget(globalScope) {
  'use strict';

  const ROOT_CLASS = 'xslt-widget';
  const REQUEST_TIMEOUT_MS = 15000;
  const DEFAULT_TITLE = 'XSLT Transformation Service';
  const DEFAULT_SUBTITLE = 'Transform XML documents with user-provided XSLT 3.0 through a simple web interface';
  const DEFAULT_WORKSPACE_TITLE = 'Upload and Transform Content';
  const DEFAULT_WORKSPACE_COPY = 'Provide XML and XSLT content directly or load them from local files.';
  const DEFAULT_BUTTON_LABEL = 'Run Transformation';
  const DEFAULT_BRAND = 'Eaglessoft';
  const DEFAULT_FOOTER_TEXT = 'Powered by Saxon-HE (Saxonica) | Source: <a href="https://github.com/Saxonica/Saxon-HE/" target="_blank" rel="noopener noreferrer" class="xslt-widget__footer-link">GitHub</a>';
  const DEFAULT_XML = [
    '<root>',
    '  <item>Hello</item>',
    '</root>'
  ].join('\n');
  const DEFAULT_XSLT = [
    '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
    '  <xsl:template match="/">',
    '    <result>',
    '      <xsl:value-of select="/root/item"/>',
    '    </result>',
    '  </xsl:template>',
    '</xsl:stylesheet>'
  ].join('\n');

  function getCurrentScript() {
    return document.currentScript || (function getFallbackScript() {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();
  }

  function normalizeUrl(url) {
    if (!url || typeof url !== 'string') {
      return '';
    }

    const trimmed = url.trim();
    if (!trimmed) {
      return '';
    }

    return trimmed.replace(/\/+$/, '');
  }

  function resolveScriptBaseUrl() {
    try {
      const script = getCurrentScript();
      if (script?.src) {
        return new URL('.', script.src).toString();
      }
    } catch (_error) {
      // Fall through to the relative default below.
    }

    return '/embed/';
  }

  function resolveAssetUrl(relativePath) {
    try {
      return new URL(relativePath, resolveScriptBaseUrl()).toString();
    } catch (_error) {
      return relativePath;
    }
  }

  function resolveDefaultApiBaseUrl() {
    return normalizeUrl(resolveAssetUrl('..'));
  }

  function resolveDefaultTransformEndpoint() {
    return normalizeUrl(resolveAssetUrl('../transform'));
  }
  function resolveCssUrl() {
    const script = getCurrentScript();
    if (script) {
      const explicit = script.getAttribute('data-css-url');
      if (explicit && explicit.trim()) {
        return explicit.trim();
      }

      const src = script.getAttribute('src');
      if (src) {
        try {
          return new URL('xslt-widget.css', src).toString();
        } catch (_error) {
          // fallback below
        }
      }
    }

    return resolveAssetUrl('xslt-widget.css');
  }

  function toBoolean(value, fallback) {
    if (value == null) {
      return fallback;
    }

    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'no'].includes(normalized)) {
      return false;
    }
    return fallback;
  }

  function ensureCssLoaded(autoCssEnabled) {
    if (!autoCssEnabled) {
      return;
    }

    const existingManaged = document.querySelector('link[data-xslt-widget-css="true"]');
    if (existingManaged) {
      return;
    }

    const hasAnyWidgetCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .some((link) => (link.getAttribute('href') || '').includes('xslt-widget.css'));
    if (hasAnyWidgetCss) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = resolveCssUrl();
    link.setAttribute('data-xslt-widget-css', 'true');
    (document.head || document.documentElement).appendChild(link);
  }

  function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
  }

  function resolveTarget(target) {
    if (target instanceof Element) {
      return target;
    }

    if (typeof target === 'string' && target.trim()) {
      const resolved = document.querySelector(target);
      if (resolved) {
        return resolved;
      }
    }

    throw new Error('XsltTransformationWidget.mount requires a valid target element or selector.');
  }

  function requestJson(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    return fetch(url, { ...(options || {}), signal: controller.signal })
        .then(async (response) => {
          const text = await response.text();
          let data = {};

          if (text) {
            try {
              data = JSON.parse(text);
            } catch (_error) {
              data = {
                error: {
                  code: 'INVALID_JSON_RESPONSE',
                  message: 'The service returned a non-JSON response.',
                  details: text
                }
              };
            }
          }

          return { ok: response.ok, data };
        })
        .catch((error) => {
          if (error && error.name === 'AbortError') {
            throw new Error('Request timed out');
          }
          throw error;
        })
        .finally(() => clearTimeout(timeoutId));
  }

  function formatXml(xmlText) {
    const tokens = xmlText
        .replace(/>\s*</g, '><')
        .replace(/</g, '~::~<')
        .split('~::~')
        .filter(Boolean);

    let formatted = '';
    let indentLevel = 0;

    for (const token of tokens) {
      const line = token.trim();
      if (!line) {
        continue;
      }

      if (/^<\//.test(line)) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }

      formatted += '  '.repeat(indentLevel) + line + '\n';

      if (/^<[^!?/][^>]*>$/.test(line) && !/\/>$/.test(line) && !/^<[^>]+>.*<\/[^>]+>$/.test(line)) {
        indentLevel += 1;
      }
    }

    return formatted.trim();
  }

  function formatStructuredText(value) {
    const text = String(value ?? '').trim();
    if (!text) {
      return '';
    }

    if (text.startsWith('<')) {
      return formatXml(text);
    }

    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(text), null, 2);
      } catch (_error) {
        return text;
      }
    }

    return text;
  }

  function populateFromFile(fileInput, targetTextarea) {
    const file = fileInput.files?.[0];
    if (!file) {
      return Promise.resolve();
    }

    return file.text().then((text) => {
      targetTextarea.value = text;
    });
  }

  function setResultState(resultPanel, resultBadge, state, badgeText) {
    resultPanel.className = 'xslt-widget__result-card';
    resultBadge.className = 'xslt-widget__badge';
    resultBadge.textContent = badgeText;

    if (state === 'success') {
      resultBadge.classList.add('is-success');
    }

    if (state === 'error') {
      resultBadge.classList.add('is-error');
    }
  }

  function renderPlaceholder(resultOutput) {
    resultOutput.innerHTML = [
      '<div class="xslt-widget__placeholder">',
      '  <p class="xslt-widget__placeholder-title">No response yet</p>',
      '  <p class="xslt-widget__placeholder-copy">Run a transformation to see the formatted response here.</p>',
      '</div>'
    ].join('\n');
  }

  function renderSuccess(resultOutput, responseBody) {
    const formattedResult = formatStructuredText(responseBody.result) || 'No result was returned.';

    resultOutput.innerHTML = [
      '<div class="xslt-widget__response-shell">',
      '  <div class="xslt-widget__metadata">',
      '    <div class="xslt-widget__metric">',
      '      <p class="xslt-widget__metric-label">Execution Time</p>',
      '      <p class="xslt-widget__metric-value">' + escapeHtml(responseBody.metadata?.executionTimeMs ?? '-') + ' ms</p>',
      '    </div>',
      '    <div class="xslt-widget__metric">',
      '      <p class="xslt-widget__metric-label">Input Size</p>',
      '      <p class="xslt-widget__metric-value">' + escapeHtml(responseBody.metadata?.inputSize ?? '-') + ' bytes</p>',
      '    </div>',
      '    <div class="xslt-widget__metric">',
      '      <p class="xslt-widget__metric-label">Output Size</p>',
      '      <p class="xslt-widget__metric-value">' + escapeHtml(responseBody.metadata?.outputSize ?? '-') + ' bytes</p>',
      '    </div>',
      '  </div>',
      '  <section class="xslt-widget__section">',
      '    <p class="xslt-widget__section-title">Transformed Result</p>',
      '    <pre class="xslt-widget__code">' + escapeHtml(formattedResult) + '</pre>',
      '  </section>',
      '</div>'
    ].join('\n');
  }

  function renderError(resultOutput, responseBody) {
    const error = responseBody?.error ?? {};
    const details = error.details ? String(error.details) : 'No additional details were returned.';

    resultOutput.innerHTML = [
      '<div class="xslt-widget__response-shell">',
      '  <dl class="xslt-widget__error-grid">',
      '    <dt>Code</dt>',
      '    <dd>' + escapeHtml(error.code || 'UNKNOWN_ERROR') + '</dd>',
      '    <dt>Message</dt>',
      '    <dd>' + escapeHtml(error.message || 'The service returned an unspecified error.') + '</dd>',
      '  </dl>',
      '  <section class="xslt-widget__section">',
      '    <p class="xslt-widget__section-title">Details</p>',
      '    <pre class="xslt-widget__code">' + escapeHtml(details) + '</pre>',
      '  </section>',
      '</div>'
    ].join('\n');
  }

  function buildEndpoint(apiBaseUrl, endpoint) {
    if (endpoint && typeof endpoint === 'string' && endpoint.trim()) {
      return endpoint.trim();
    }

    const normalizedBase = normalizeUrl(apiBaseUrl);
    if (normalizedBase) {
      return normalizedBase + '/transform';
    }

    return resolveDefaultTransformEndpoint();
  }

  function renderWidget(config) {
    const footerHtml = config.showFooter ? [
      '  <footer class="xslt-widget__footer">',
      '    <p class="xslt-widget__footer-brand">' + escapeHtml(config.brand) + '</p>',
      '    <p class="xslt-widget__footer-tech">' + config.footerText + '</p>',
      '  </footer>'
    ].join('\n') : '';

    return [
      '<div class="xslt-widget__shell">',
      '  <header class="xslt-widget__header">',
      '    <h2 class="xslt-widget__title">' + escapeHtml(config.title) + '</h2>',
      '    <p class="xslt-widget__subtitle">' + escapeHtml(config.subtitle) + '</p>',
      '  </header>',
      '  <section class="xslt-widget__card">',
      '    <div class="xslt-widget__workspace-head">',
      '      <h3 class="xslt-widget__workspace-title">' + escapeHtml(config.workspaceTitle) + '</h3>',
      '      <p class="xslt-widget__workspace-copy">' + escapeHtml(config.workspaceCopy) + '</p>',
      '    </div>',
      '    <div class="xslt-widget__grid">',
      '      <section class="xslt-widget__panel">',
      '        <div class="xslt-widget__panel-header">',
      '          <div>',
      '            <h4 class="xslt-widget__panel-title">XML Input</h4>',
      '            <p class="xslt-widget__panel-copy">Paste XML content or load it from a local file.</p>',
      '          </div>',
      '          <label class="xslt-widget__file-button">',
      '            <span>Upload XML</span>',
      '            <input type="file" accept=".xml,text/xml" data-role="xml-file">',
      '          </label>',
      '        </div>',
      '        <textarea class="xslt-widget__textarea" spellcheck="false" data-role="xml-input">' + escapeHtml(config.xml) + '</textarea>',
      '      </section>',
      '      <section class="xslt-widget__panel">',
      '        <div class="xslt-widget__panel-header">',
      '          <div>',
      '            <h4 class="xslt-widget__panel-title">XSLT Input</h4>',
      '            <p class="xslt-widget__panel-copy">Paste the stylesheet or load it from a local file.</p>',
      '          </div>',
      '          <label class="xslt-widget__file-button">',
      '            <span>Upload XSLT</span>',
      '            <input type="file" accept=".xsl,.xslt,text/xml" data-role="xslt-file">',
      '          </label>',
      '        </div>',
      '        <textarea class="xslt-widget__textarea" spellcheck="false" data-role="xslt-input">' + escapeHtml(config.xslt) + '</textarea>',
      '      </section>',
      '    </div>',
      '    <div class="xslt-widget__actions">',
      '      <button class="xslt-widget__button" type="button" data-role="transform-button">' + escapeHtml(config.buttonLabel) + '</button>',
      '      <p class="xslt-widget__status" data-role="request-status" aria-live="polite"></p>',
      '    </div>',
      '  </section>',
      '  <section class="xslt-widget__result-section">',
      '    <div class="xslt-widget__result-card" data-role="result-panel">',
      '      <div class="xslt-widget__result-header">',
      '        <div>',
      '          <h3 class="xslt-widget__result-title">Result</h3>',
      '          <p class="xslt-widget__result-copy">Successful and failed requests are summarized below.</p>',
      '        </div>',
      '        <span class="xslt-widget__badge" data-role="result-badge">Awaiting Request</span>',
      '      </div>',
      '      <div class="xslt-widget__output" data-role="result-output"></div>',
      '    </div>',
      '  </section>',
      footerHtml,
      '</div>'
    ].join('\n');
  }

  class XsltWidgetApp {
    constructor(rootContainer, options) {
      this.root = rootContainer;
      this.config = options;
    }

    mount() {
      this.root.classList.add(ROOT_CLASS);
      this.root.innerHTML = renderWidget(this.config);
      this.collectRefs();
      this.bindEvents();
      renderPlaceholder(this.refs.resultOutput);
    }

    collectRefs() {
      this.refs = {
        xmlInput: this.root.querySelector('[data-role="xml-input"]'),
        xsltInput: this.root.querySelector('[data-role="xslt-input"]'),
        xmlFile: this.root.querySelector('[data-role="xml-file"]'),
        xsltFile: this.root.querySelector('[data-role="xslt-file"]'),
        transformButton: this.root.querySelector('[data-role="transform-button"]'),
        requestStatus: this.root.querySelector('[data-role="request-status"]'),
        resultPanel: this.root.querySelector('[data-role="result-panel"]'),
        resultBadge: this.root.querySelector('[data-role="result-badge"]'),
        resultOutput: this.root.querySelector('[data-role="result-output"]')
      };
    }

    bindEvents() {
      this.refs.xmlFile.addEventListener('change', () => populateFromFile(this.refs.xmlFile, this.refs.xmlInput));
      this.refs.xsltFile.addEventListener('change', () => populateFromFile(this.refs.xsltFile, this.refs.xsltInput));
      this.refs.transformButton.addEventListener('click', () => this.handleTransform());
    }

    async handleTransform() {
      this.refs.transformButton.disabled = true;
      this.refs.requestStatus.textContent = 'Running transformation request...';
      this.refs.requestStatus.className = 'xslt-widget__status';
      setResultState(this.refs.resultPanel, this.refs.resultBadge, 'pending', 'Processing Request');

      try {
        const response = await requestJson(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            xml: this.refs.xmlInput.value,
            xslt: this.refs.xsltInput.value
          })
        });

        if (response.ok) {
          renderSuccess(this.refs.resultOutput, response.data);
          this.refs.requestStatus.textContent = 'Transformation request completed.';
          this.refs.requestStatus.className = 'xslt-widget__status is-success';
          setResultState(this.refs.resultPanel, this.refs.resultBadge, 'success', 'Transformation Result');
        } else {
          renderError(this.refs.resultOutput, response.data);
          this.refs.requestStatus.textContent = 'Request failed. Review the error details below.';
          this.refs.requestStatus.className = 'xslt-widget__status is-error';
          setResultState(this.refs.resultPanel, this.refs.resultBadge, 'error', 'Error Response');
        }
      } catch (error) {
        renderError(this.refs.resultOutput, {
          error: {
            code: 'NETWORK_ERROR',
            message: 'Request could not be completed',
            details: error.message
          }
        });
        this.refs.requestStatus.textContent = 'Request failed before reaching the API.';
        this.refs.requestStatus.className = 'xslt-widget__status is-error';
        setResultState(this.refs.resultPanel, this.refs.resultBadge, 'error', 'Error Response');
      } finally {
        this.refs.transformButton.disabled = false;
      }
    }

    setValue(nextValues = {}) {
      if (typeof nextValues.xml === 'string') {
        this.refs.xmlInput.value = nextValues.xml;
      }
      if (typeof nextValues.xslt === 'string') {
        this.refs.xsltInput.value = nextValues.xslt;
      }
    }

    getValue() {
      return {
        xml: this.refs.xmlInput.value,
        xslt: this.refs.xsltInput.value
      };
    }
  }

  function normalizeOptions(options = {}) {
    const target = resolveTarget(options.target);
    const apiBaseUrl = normalizeUrl(options.apiUrl || options.apiBaseUrl || options.baseUrl || resolveDefaultApiBaseUrl());
    const endpoint = buildEndpoint(apiBaseUrl, options.endpoint);

    return {
      target,
      apiBaseUrl,
      endpoint,
      autoCss: toBoolean(options.autoCss, true),
      title: typeof options.title === 'string' && options.title.trim() ? options.title.trim() : DEFAULT_TITLE,
      subtitle: typeof options.subtitle === 'string' && options.subtitle.trim() ? options.subtitle.trim() : DEFAULT_SUBTITLE,
      workspaceTitle: typeof options.workspaceTitle === 'string' && options.workspaceTitle.trim() ? options.workspaceTitle.trim() : DEFAULT_WORKSPACE_TITLE,
      workspaceCopy: typeof options.workspaceCopy === 'string' && options.workspaceCopy.trim() ? options.workspaceCopy.trim() : DEFAULT_WORKSPACE_COPY,
      buttonLabel: typeof options.buttonLabel === 'string' && options.buttonLabel.trim() ? options.buttonLabel.trim() : DEFAULT_BUTTON_LABEL,
      brand: typeof options.brand === 'string' && options.brand.trim() ? options.brand.trim() : DEFAULT_BRAND,
      footerText: typeof options.footerText === 'string' && options.footerText.trim() ? options.footerText.trim() : DEFAULT_FOOTER_TEXT,
      showFooter: toBoolean(options.showFooter, true),
      xml: typeof options.xml === 'string' ? options.xml : DEFAULT_XML,
      xslt: typeof options.xslt === 'string' ? options.xslt : DEFAULT_XSLT
    };
  }

  function mount(options) {
    const config = normalizeOptions(options);
    ensureCssLoaded(config.autoCss);

    const app = new XsltWidgetApp(config.target, config);
    app.mount();
    config.target.__xsltWidgetMounted = true;

    return {
      target: config.target,
      apiBaseUrl: config.apiBaseUrl,
      endpoint: config.endpoint,
      getValue: () => app.getValue(),
      setValue: (nextValues) => app.setValue(nextValues),
      destroy() {
        config.target.innerHTML = '';
        config.target.classList.remove(ROOT_CLASS);
        delete config.target.__xsltWidgetMounted;
      }
    };
  }

  class XsltTransformationWidgetElement extends HTMLElement {
    connectedCallback() {
      if (this.__xsltWidgetMounted) {
        return;
      }

      const componentApiUrl = normalizeUrl(this.getAttribute('api-url'));
      const autoCss = toBoolean(this.getAttribute('auto-css'), true);

      this.__xsltWidgetApi = mount({
        target: this,
        apiUrl: componentApiUrl || resolveDefaultApiBaseUrl(),
        endpoint: this.getAttribute('endpoint') || '',
        autoCss,
        title: this.getAttribute('title') || DEFAULT_TITLE,
        subtitle: this.getAttribute('subtitle') || DEFAULT_SUBTITLE,
        workspaceTitle: this.getAttribute('workspace-title') || DEFAULT_WORKSPACE_TITLE,
        workspaceCopy: this.getAttribute('workspace-copy') || DEFAULT_WORKSPACE_COPY,
        buttonLabel: this.getAttribute('button-label') || DEFAULT_BUTTON_LABEL,
        brand: this.getAttribute('brand') || DEFAULT_BRAND,
        footerText: this.getAttribute('footer-text') || DEFAULT_FOOTER_TEXT,
        showFooter: toBoolean(this.getAttribute('show-footer'), true),
        xml: this.getAttribute('xml') || DEFAULT_XML,
        xslt: this.getAttribute('xslt') || DEFAULT_XSLT
      });
    }
  }

  function bootstrap() {
    if (!customElements.get('xslt-transformation-widget')) {
      customElements.define('xslt-transformation-widget', XsltTransformationWidgetElement);
    }
  }

  globalScope.XsltTransformationWidget = {
    mount
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})(window);
