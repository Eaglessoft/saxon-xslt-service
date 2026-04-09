/*
 * Wires the local UI to the transform API, including file loading and result-state updates.
 * The script keeps browser-side behavior minimal so the API remains the main source of truth.
 */
const xmlInput = document.getElementById("xmlInput");
const xsltInput = document.getElementById("xsltInput");
const xmlFile = document.getElementById("xmlFile");
const xsltFile = document.getElementById("xsltFile");
const transformButton = document.getElementById("transformButton");
const resultOutput = document.getElementById("resultOutput");
const requestStatus = document.getElementById("requestStatus");
const resultPanel = document.getElementById("resultPanel");
const resultBadge = document.getElementById("resultBadge");

async function populateFromFile(fileInput, targetTextarea) {
  const file = fileInput.files?.[0];
  if (!file) {
    return;
  }

  targetTextarea.value = await file.text();
}

function escapeHtml(value) {
  return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
}

function setResultState(state, badgeText) {
  resultPanel.className = "result-panel card";
  resultBadge.className = "result-badge";
  resultBadge.textContent = badgeText;

  if (state === "success") {
    resultPanel.classList.add("is-success");
    resultBadge.classList.add("is-success");
  }

  if (state === "error") {
    resultPanel.classList.add("is-error");
    resultBadge.classList.add("is-error");
  }
}

function setLoadingState(isLoading) {
  transformButton.disabled = isLoading;
  transformButton.textContent = isLoading ? "Running Transformation..." : "Run Transformation";
}

function formatXml(xmlText) {
  const tokens = xmlText
      .replace(/>\s*</g, "><")
      .replace(/</g, "~::~<")
      .split("~::~")
      .filter(Boolean);

  let formatted = "";
  let indentLevel = 0;

  for (const token of tokens) {
    const line = token.trim();
    if (!line) {
      continue;
    }

    if (/^<\//.test(line)) {
      indentLevel = Math.max(indentLevel - 1, 0);
    }

    formatted += "  ".repeat(indentLevel) + line + "\n";

    if (/^<[^!?/][^>]*>$/.test(line) && !/\/>$/.test(line) && !/^<[^>]+>.*<\/[^>]+>$/.test(line)) {
      indentLevel += 1;
    }
  }

  return formatted.trim();
}

function formatStructuredText(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }

  if (text.startsWith("<")) {
    return formatXml(text);
  }

  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch (_error) {
      return text;
    }
  }

  return text;
}

function renderPlaceholder() {
  resultOutput.innerHTML = [
    '<div class="result-placeholder">',
    '  <p class="result-placeholder-title">No response yet</p>',
    '  <p class="result-placeholder-copy">Run a transformation to see the formatted response here.</p>',
    '</div>'
  ].join("\n");
}

function renderSuccess(responseBody) {
  const formattedResult = formatStructuredText(responseBody.result) || "No result was returned.";

  resultOutput.innerHTML = [
    '<div class="response-shell">',
    '  <div class="response-metadata">',
    '    <div class="response-metric">',
    '      <p class="response-metric-label">Execution Time</p>',
    '      <p class="response-metric-value">' + escapeHtml(responseBody.metadata?.executionTimeMs ?? "-") + ' ms</p>',
    '    </div>',
    '    <div class="response-metric">',
    '      <p class="response-metric-label">Input Size</p>',
    '      <p class="response-metric-value">' + escapeHtml(responseBody.metadata?.inputSize ?? "-") + ' bytes</p>',
    '    </div>',
    '    <div class="response-metric">',
    '      <p class="response-metric-label">Output Size</p>',
    '      <p class="response-metric-value">' + escapeHtml(responseBody.metadata?.outputSize ?? "-") + ' bytes</p>',
    '    </div>',
    '  </div>',
    '  <section class="response-section">',
    '    <p class="response-section-title">Transformed Result</p>',
    '    <pre class="response-code">' + escapeHtml(formattedResult) + '</pre>',
    '  </section>',
    '</div>'
  ].join("\n");
}

function renderError(responseBody) {
  const error = responseBody?.error ?? {};
  const details = error.details ? String(error.details) : "No additional details were returned.";

  resultOutput.innerHTML = [
    '<div class="response-shell">',
    '  <dl class="response-error-grid">',
    '    <dt>Code</dt>',
    '    <dd>' + escapeHtml(error.code || "UNKNOWN_ERROR") + '</dd>',
    '    <dt>Message</dt>',
    '    <dd>' + escapeHtml(error.message || "The service returned an unspecified error.") + '</dd>',
    '  </dl>',
    '  <section class="response-section">',
    '    <p class="response-section-title">Details</p>',
    '    <pre class="response-code">' + escapeHtml(details) + '</pre>',
    '  </section>',
    '</div>'
  ].join("\n");
}

xmlFile.addEventListener("change", () => populateFromFile(xmlFile, xmlInput));
xsltFile.addEventListener("change", () => populateFromFile(xsltFile, xsltInput));

transformButton.addEventListener("click", async () => {
  setLoadingState(true);
  requestStatus.textContent = "Running transformation request...";
  requestStatus.className = "status-text";
  setResultState("pending", "Processing Request");

  try {
    // Keep API calls relative so Spring Boot context paths work without custom frontend configuration.
    const response = await fetch("transform", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        xml: xmlInput.value,
        xslt: xsltInput.value
      })
    });

    const responseBody = await response.json();

    if (response.ok) {
      renderSuccess(responseBody);
      requestStatus.textContent = "Transformation request completed.";
      requestStatus.className = "status-text is-success";
      setResultState("success", "Transformation Result");
    } else {
      renderError(responseBody);
      requestStatus.textContent = "Request failed. Review the error details below.";
      requestStatus.className = "status-text is-error";
      setResultState("error", "Error Response");
    }
  } catch (error) {
    renderError({
      error: {
        code: "NETWORK_ERROR",
        message: "Request could not be completed",
        details: error.message
      }
    });
    requestStatus.textContent = "Request failed before reaching the API.";
    requestStatus.className = "status-text is-error";
    setResultState("error", "Error Response");
  } finally {
    setLoadingState(false);
  }
});

renderPlaceholder();
