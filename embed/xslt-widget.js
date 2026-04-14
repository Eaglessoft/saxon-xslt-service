/*
 * Exposes a reusable embeddable widget for the XSLT transformation service.
 * Mirrors the main UI layout while keeping the existing embed endpoint and CSS-loading behavior.
 */
(function attachXsltTransformationWidget(globalScope) {
  'use strict';

  const ROOT_CLASS = 'xslt-widget';
  const REQUEST_TIMEOUT_MS = 15000;
  const DEFAULT_TITLE = 'XSLT Transformation Service';
  const DEFAULT_SUBTITLE = '';
  const DEFAULT_BUTTON_LABEL = 'Run Transformation';
  const DEFAULT_BRAND = 'Eaglessoft';
  const DEFAULT_FOOTER_TEXT = 'Powered by Saxon-HE (Saxonica) | Source: <a href="https://github.com/Saxonica/Saxon-HE/" target="_blank" rel="noopener noreferrer" class="xslt-widget__footer-link">GitHub</a>';
  const COPY_DEFAULT_LABEL = 'Copy';
  const COPY_SUCCESS_LABEL = 'Copied';
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
      if (script && script.src) {
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
          // Fall through.
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

  function formatStructuredText(value) {
    const text = String(value ?? '').trim();
    if (!text) {
      return '';
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
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      return Promise.resolve();
    }

    return file.text().then((text) => {
      targetTextarea.value = text;
    });
  }

  function setActiveEditor(refs, editor) {
    const isXml = editor === 'xml';

    refs.xmlTab.classList.toggle('is-active', isXml);
    refs.xsltTab.classList.toggle('is-active', !isXml);
    refs.xmlTab.setAttribute('aria-selected', String(isXml));
    refs.xsltTab.setAttribute('aria-selected', String(!isXml));

    refs.xmlInput.classList.toggle('is-hidden', !isXml);
    refs.xsltInput.classList.toggle('is-hidden', isXml);
    refs.xmlUploadControl.classList.toggle('is-hidden', !isXml);
    refs.xsltUploadControl.classList.toggle('is-hidden', isXml);
  }

  function setResultState(resultPanel, resultBadge, state, badgeText) {
    resultPanel.className = 'xslt-widget__workspace-panel xslt-widget__result-panel';
    resultBadge.className = 'xslt-widget__result-badge';
    resultBadge.textContent = badgeText;

    if (state === 'success') {
      resultPanel.classList.add('is-success');
      resultBadge.classList.add('is-success');
    }

    if (state === 'error') {
      resultPanel.classList.add('is-error');
      resultBadge.classList.add('is-error');
    }
  }

  function setLoadingState(refs, buttonLabel, isLoading) {
    refs.transformButton.disabled = isLoading;
    refs.transformButton.textContent = isLoading ? 'Running...' : buttonLabel;
  }

  function renderPlaceholder(app) {
    app.latestResultText = '';
    app.setCopyButtonState(false);
    app.refs.resultOutput.innerHTML = '';
  }

  function renderSuccess(app, responseBody) {
    const formattedResult = formatStructuredText(responseBody.result) || 'No result was returned.';
    app.latestResultText = String(responseBody.result ?? formattedResult);
    app.setCopyButtonState(Boolean(app.latestResultText));

    app.refs.resultOutput.innerHTML = [
      '<div class="xslt-widget__response-shell">',
      '  <pre class="xslt-widget__response-code">' + escapeHtml(formattedResult) + '</pre>',
      '</div>'
    ].join('\n');
  }

  function renderError(app, responseBody) {
    const error = responseBody && responseBody.error ? responseBody.error : {};
    const details = error.details ? String(error.details) : 'No additional details were returned.';

    app.latestResultText = '';
    app.setCopyButtonState(false);

    app.refs.resultOutput.innerHTML = [
      '<div class="xslt-widget__response-shell">',
      '  <div class="xslt-widget__response-error-card">',
      '    <p class="xslt-widget__response-error-title">Transformation Error</p>',
      '    <p class="xslt-widget__response-error-message">' + escapeHtml(error.message || 'The service returned an unspecified error.') + '</p>',
      '    <p class="xslt-widget__response-error-code">Code: ' + escapeHtml(error.code || 'UNKNOWN_ERROR') + '</p>',
      '  </div>',
      '  <pre class="xslt-widget__response-code is-error">' + escapeHtml(details) + '</pre>',
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
    const subtitleHtml = config.subtitle
        ? '        <p class="xslt-widget__page-subtitle">' + escapeHtml(config.subtitle) + '</p>'
        : '';

    const footerHtml = config.showFooter ? [
      '    <footer class="xslt-widget__footer">',
      '      <div class="xslt-widget__footer-content">',
      '        <p class="xslt-widget__footer-brand">' + escapeHtml(config.brand) + '</p>',
      '        <p class="xslt-widget__footer-tech">' + config.footerText + '</p>',
      '      </div>',
      '    </footer>'
    ].join('\n') : '';

    return [
      '<div class="xslt-widget__shell">',
      '  <div class="xslt-widget__container">',
      '    <header class="xslt-widget__page-header">',
      '      <div class="xslt-widget__header-content">',
      '        <h2 class="xslt-widget__page-title">' + escapeHtml(config.title) + '</h2>',
      subtitleHtml,
      '      </div>',
      '    </header>',
      '    <main class="xslt-widget__workspace-layout">',
      '      <div class="xslt-widget__workspace-shell">',
      '        <section class="xslt-widget__workspace-panel xslt-widget__editor-panel">',
      '          <div class="xslt-widget__panel-header xslt-widget__editor-header">',
      '            <div class="xslt-widget__tab-strip" role="tablist" aria-label="Editor mode">',
      '              <button type="button" class="xslt-widget__tab-button is-active" data-role="xml-tab" role="tab" aria-selected="true">XML Input</button>',
      '              <button type="button" class="xslt-widget__tab-button" data-role="xslt-tab" role="tab" aria-selected="false">XSL Stylesheet</button>',
      '            </div>',
      '            <div class="xslt-widget__panel-actions">',
      '              <label class="xslt-widget__upload-button" data-role="xml-upload-control">',
      '                <span>Upload XML</span>',
      '                <input type="file" accept=".xml,text/xml" data-role="xml-file">',
      '              </label>',
      '              <label class="xslt-widget__upload-button is-hidden" data-role="xslt-upload-control">',
      '                <span>Upload XSLT</span>',
      '                <input type="file" accept=".xsl,.xslt,text/xml" data-role="xslt-file">',
      '              </label>',
      '              <button type="button" class="xslt-widget__btn-primary" data-role="transform-button">' + escapeHtml(config.buttonLabel) + '</button>',
      '            </div>',
      '          </div>',
      '          <div class="xslt-widget__editor-stack">',
      '            <textarea class="xslt-widget__editor-textarea" spellcheck="false" data-role="xml-input">' + escapeHtml(config.xml) + '</textarea>',
      '            <textarea class="xslt-widget__editor-textarea is-hidden" spellcheck="false" data-role="xslt-input">' + escapeHtml(config.xslt) + '</textarea>',
      '          </div>',
      '        </section>',
      '        <section class="xslt-widget__workspace-panel xslt-widget__result-panel" data-role="result-panel">',
      '          <div class="xslt-widget__panel-header xslt-widget__result-header">',
      '            <div class="xslt-widget__result-title-row">',
      '              <span class="xslt-widget__panel-title">Result</span>',
      '              <span class="xslt-widget__result-badge" data-role="result-badge">Awaiting Request</span>',
      '              <span class="xslt-widget__status-text" data-role="request-status" aria-live="polite">Run a transformation to see the latest result.</span>',
      '            </div>',
      '            <button type="button" class="xslt-widget__copy-button" data-role="copy-result-button" disabled aria-label="Copy result">',
      '              <span class="xslt-widget__copy-icon" aria-hidden="true"></span>',
      '              <span class="xslt-widget__copy-tooltip" data-role="copy-tooltip">' + COPY_DEFAULT_LABEL + '</span>',
      '            </button>',
      '          </div>',
      '          <div class="xslt-widget__result-output" data-role="result-output"></div>',
      '        </section>',
      '      </div>',
      '    </main>',
      footerHtml,
      '  </div>',
      '</div>'
    ].filter(Boolean).join('\n');
  }

  class XsltWidgetApp {
    constructor(rootContainer, options) {
      this.root = rootContainer;
      this.config = options;
      this.latestResultText = '';
      this.copyResetTimer = null;
    }

    mount() {
      this.root.classList.add(ROOT_CLASS);
      this.root.innerHTML = renderWidget(this.config);
      this.collectRefs();
      this.bindEvents();
      setActiveEditor(this.refs, 'xml');
      setResultState(this.refs.resultPanel, this.refs.resultBadge, 'pending', 'Awaiting Request');
      renderPlaceholder(this);
    }

    collectRefs() {
      this.refs = {
        xmlInput: this.root.querySelector('[data-role="xml-input"]'),
        xsltInput: this.root.querySelector('[data-role="xslt-input"]'),
        xmlFile: this.root.querySelector('[data-role="xml-file"]'),
        xsltFile: this.root.querySelector('[data-role="xslt-file"]'),
        xmlTab: this.root.querySelector('[data-role="xml-tab"]'),
        xsltTab: this.root.querySelector('[data-role="xslt-tab"]'),
        xmlUploadControl: this.root.querySelector('[data-role="xml-upload-control"]'),
        xsltUploadControl: this.root.querySelector('[data-role="xslt-upload-control"]'),
        transformButton: this.root.querySelector('[data-role="transform-button"]'),
        requestStatus: this.root.querySelector('[data-role="request-status"]'),
        resultPanel: this.root.querySelector('[data-role="result-panel"]'),
        resultBadge: this.root.querySelector('[data-role="result-badge"]'),
        resultOutput: this.root.querySelector('[data-role="result-output"]'),
        copyResultButton: this.root.querySelector('[data-role="copy-result-button"]'),
        copyTooltip: this.root.querySelector('[data-role="copy-tooltip"]')
      };
    }

    bindEvents() {
      this.refs.xmlTab.addEventListener('click', () => setActiveEditor(this.refs, 'xml'));
      this.refs.xsltTab.addEventListener('click', () => setActiveEditor(this.refs, 'xslt'));
      this.refs.xmlFile.addEventListener('change', () => populateFromFile(this.refs.xmlFile, this.refs.xmlInput));
      this.refs.xsltFile.addEventListener('change', () => populateFromFile(this.refs.xsltFile, this.refs.xsltInput));
      this.refs.transformButton.addEventListener('click', () => this.handleTransform());
      this.refs.copyResultButton.addEventListener('click', () => this.handleCopy());
    }

    resetCopyFeedback(delay) {
      const effectiveDelay = typeof delay === 'number' ? delay : 1600;
      window.clearTimeout(this.copyResetTimer);
      this.copyResetTimer = window.setTimeout(() => {
        this.refs.copyTooltip.textContent = COPY_DEFAULT_LABEL;
        this.refs.copyResultButton.classList.remove('is-feedback');
      }, effectiveDelay);
    }

    setCopyButtonState(enabled) {
      this.refs.copyResultButton.disabled = !enabled;
      this.refs.copyTooltip.textContent = COPY_DEFAULT_LABEL;
      this.refs.copyResultButton.classList.remove('is-feedback');
      window.clearTimeout(this.copyResetTimer);
    }

    copyResult() {
      if (!this.latestResultText) {
        return Promise.resolve();
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(this.latestResultText);
      }

      const helper = document.createElement('textarea');
      helper.value = this.latestResultText;
      helper.setAttribute('readonly', 'readonly');
      helper.style.position = 'absolute';
      helper.style.left = '-9999px';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      document.body.removeChild(helper);
      return Promise.resolve();
    }

    handleCopy() {
      return this.copyResult()
          .then(() => {
            this.refs.copyTooltip.textContent = COPY_SUCCESS_LABEL;
            this.refs.copyResultButton.classList.add('is-feedback');
            this.resetCopyFeedback(1600);
          })
          .catch(() => {
            this.refs.copyTooltip.textContent = 'Failed';
            this.refs.copyResultButton.classList.add('is-feedback');
            this.resetCopyFeedback(2200);
          });
    }

    handleTransform() {
      setLoadingState(this.refs, this.config.buttonLabel, true);
      this.setCopyButtonState(false);
      this.refs.requestStatus.textContent = 'Running transformation request...';
      this.refs.requestStatus.className = 'xslt-widget__status-text';
      setResultState(this.refs.resultPanel, this.refs.resultBadge, 'pending', 'Processing Request');

      return requestJson(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          xml: this.refs.xmlInput.value,
          xslt: this.refs.xsltInput.value
        })
      })
          .then((response) => {
            if (response.ok) {
              renderSuccess(this, response.data);
              const executionTime = response.data.metadata && response.data.metadata.executionTimeMs;
              this.refs.requestStatus.textContent = executionTime != null
                  ? 'Transformation completed in ' + executionTime + ' ms.'
                  : 'Transformation completed.';
              this.refs.requestStatus.className = 'xslt-widget__status-text is-success';
              setResultState(this.refs.resultPanel, this.refs.resultBadge, 'success', 'Success');
            } else {
              renderError(this, response.data);
              this.refs.requestStatus.textContent = 'Transformation failed.';
              this.refs.requestStatus.className = 'xslt-widget__status-text is-error';
              setResultState(this.refs.resultPanel, this.refs.resultBadge, 'error', 'Error');
            }
          })
          .catch((error) => {
            renderError(this, {
              error: {
                code: 'NETWORK_ERROR',
                message: 'Request could not be completed',
                details: error.message
              }
            });
            this.refs.requestStatus.textContent = 'Request failed before reaching the API.';
            this.refs.requestStatus.className = 'xslt-widget__status-text is-error';
            setResultState(this.refs.resultPanel, this.refs.resultBadge, 'error', 'Error');
          })
          .finally(() => {
            setLoadingState(this.refs, this.config.buttonLabel, false);
          });
    }

    setValue(nextValues) {
      const values = nextValues || {};
      if (typeof values.xml === 'string') {
        this.refs.xmlInput.value = values.xml;
      }
      if (typeof values.xslt === 'string') {
        this.refs.xsltInput.value = values.xslt;
      }
    }

    getValue() {
      return {
        xml: this.refs.xmlInput.value,
        xslt: this.refs.xsltInput.value
      };
    }

    destroy() {
      window.clearTimeout(this.copyResetTimer);
      this.root.innerHTML = '';
      this.root.classList.remove(ROOT_CLASS);
    }
  }

  function normalizeOptions(options) {
    const normalizedOptions = options || {};
    const target = resolveTarget(normalizedOptions.target);
    const apiBaseUrl = normalizeUrl(normalizedOptions.apiUrl || normalizedOptions.apiBaseUrl || normalizedOptions.baseUrl || resolveDefaultApiBaseUrl());
    const endpoint = buildEndpoint(apiBaseUrl, normalizedOptions.endpoint);

    return {
      target: target,
      apiBaseUrl: apiBaseUrl,
      endpoint: endpoint,
      autoCss: toBoolean(normalizedOptions.autoCss, true),
      title: typeof normalizedOptions.title === 'string' && normalizedOptions.title.trim() ? normalizedOptions.title.trim() : DEFAULT_TITLE,
      subtitle: typeof normalizedOptions.subtitle === 'string' ? normalizedOptions.subtitle.trim() : DEFAULT_SUBTITLE,
      buttonLabel: typeof normalizedOptions.buttonLabel === 'string' && normalizedOptions.buttonLabel.trim() ? normalizedOptions.buttonLabel.trim() : DEFAULT_BUTTON_LABEL,
      brand: typeof normalizedOptions.brand === 'string' && normalizedOptions.brand.trim() ? normalizedOptions.brand.trim() : DEFAULT_BRAND,
      footerText: typeof normalizedOptions.footerText === 'string' && normalizedOptions.footerText.trim() ? normalizedOptions.footerText.trim() : DEFAULT_FOOTER_TEXT,
      showFooter: toBoolean(normalizedOptions.showFooter, false),
      xml: typeof normalizedOptions.xml === 'string' ? normalizedOptions.xml : DEFAULT_XML,
      xslt: typeof normalizedOptions.xslt === 'string' ? normalizedOptions.xslt : DEFAULT_XSLT
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
      getValue: function getValue() {
        return app.getValue();
      },
      setValue: function setValue(nextValues) {
        app.setValue(nextValues);
      },
      destroy: function destroy() {
        app.destroy();
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
        autoCss: autoCss,
        title: this.getAttribute('title') || DEFAULT_TITLE,
        subtitle: this.getAttribute('subtitle') || DEFAULT_SUBTITLE,
        buttonLabel: this.getAttribute('button-label') || DEFAULT_BUTTON_LABEL,
        brand: this.getAttribute('brand') || DEFAULT_BRAND,
        footerText: this.getAttribute('footer-text') || DEFAULT_FOOTER_TEXT,
        showFooter: toBoolean(this.getAttribute('show-footer'), false),
        xml: this.getAttribute('xml') || DEFAULT_XML,
        xslt: this.getAttribute('xslt') || DEFAULT_XSLT
      });
    }

    disconnectedCallback() {
      if (this.__xsltWidgetApi) {
        this.__xsltWidgetApi.destroy();
        this.__xsltWidgetApi = null;
      }
    }
  }

  function bootstrap() {
    if (!customElements.get('xslt-transformation-widget')) {
      customElements.define('xslt-transformation-widget', XsltTransformationWidgetElement);
    }
  }

  globalScope.XsltTransformationWidget = {
    mount: mount
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})(window);