/*
 * Wires the local UI to the transform API while keeping the frontend focused on layout, status, uploads,
 * and a compact two-panel result view.
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
const copyResultButton = document.getElementById("copyResultButton");
const copyTooltip = document.getElementById("copyTooltip");
const xmlTab = document.getElementById("xmlTab");
const xsltTab = document.getElementById("xsltTab");
const xmlUploadControl = document.getElementById("xmlUploadControl");
const xsltUploadControl = document.getElementById("xsltUploadControl");

const COPY_DEFAULT_LABEL = "Copy";
const COPY_SUCCESS_LABEL = "Copied";

let latestResultText = "";
let copyResetTimer;

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

function setActiveEditor(editor) {
  const isXml = editor === "xml";

  xmlTab.classList.toggle("is-active", isXml);
  xsltTab.classList.toggle("is-active", !isXml);
  xmlTab.setAttribute("aria-selected", String(isXml));
  xsltTab.setAttribute("aria-selected", String(!isXml));

  xmlInput.classList.toggle("is-hidden", !isXml);
  xsltInput.classList.toggle("is-hidden", isXml);
  xmlUploadControl.classList.toggle("is-hidden", !isXml);
  xsltUploadControl.classList.toggle("is-hidden", isXml);
}

function resetCopyFeedback(delay = 1600) {
  window.clearTimeout(copyResetTimer);
  copyResetTimer = window.setTimeout(() => {
    copyTooltip.textContent = COPY_DEFAULT_LABEL;
    copyResultButton.classList.remove("is-feedback");
  }, delay);
}

function setCopyButtonState(enabled) {
  copyResultButton.disabled = !enabled;
  copyTooltip.textContent = COPY_DEFAULT_LABEL;
  copyResultButton.classList.remove("is-feedback");
  window.clearTimeout(copyResetTimer);
}

function setResultState(state, badgeText) {
  resultPanel.className = "workspace-panel result-panel";
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
  transformButton.textContent = isLoading ? "Running..." : "Run Transformation";
}

function formatStructuredText(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
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
  latestResultText = "";
  setCopyButtonState(false);

  resultOutput.innerHTML = "";
}
function renderSuccess(responseBody) {
  const formattedResult = formatStructuredText(responseBody.result) || "No result was returned.";
  latestResultText = String(responseBody.result ?? formattedResult);
  setCopyButtonState(Boolean(latestResultText));

  resultOutput.innerHTML = [
    '<div class="response-shell">',
    '  <pre class="response-code">' + escapeHtml(formattedResult) + '</pre>',
    '</div>'
  ].join("\n");
}

function renderError(responseBody) {
  const error = responseBody?.error ?? {};
  const details = error.details ? String(error.details) : "No additional details were returned.";

  latestResultText = "";
  setCopyButtonState(false);

  resultOutput.innerHTML = [
    '<div class="response-shell">',
    '  <div class="response-error-card">',
    '    <p class="response-error-title">Transformation Error</p>',
    '    <p class="response-error-message">' + escapeHtml(error.message || "The service returned an unspecified error.") + '</p>',
    '    <p class="response-error-code">Code: ' + escapeHtml(error.code || "UNKNOWN_ERROR") + '</p>',
    '  </div>',
    '  <pre class="response-code is-error">' + escapeHtml(details) + '</pre>',
    '</div>'
  ].join("\n");
}

async function copyResult() {
  if (!latestResultText) {
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(latestResultText);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = latestResultText;
  helper.setAttribute("readonly", "readonly");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  document.body.removeChild(helper);
}

xmlTab.addEventListener("click", () => setActiveEditor("xml"));
xsltTab.addEventListener("click", () => setActiveEditor("xslt"));
xmlFile.addEventListener("change", () => populateFromFile(xmlFile, xmlInput));
xsltFile.addEventListener("change", () => populateFromFile(xsltFile, xsltInput));
copyResultButton.addEventListener("click", async () => {
  try {
    await copyResult();
    copyTooltip.textContent = COPY_SUCCESS_LABEL;
    copyResultButton.classList.add("is-feedback");
    resetCopyFeedback();
  } catch (_error) {
    copyTooltip.textContent = "Failed";
    copyResultButton.classList.add("is-feedback");
    resetCopyFeedback(2200);
  }
});

transformButton.addEventListener("click", async () => {
  setLoadingState(true);
  setCopyButtonState(false);
  requestStatus.textContent = "Running transformation request...";
  requestStatus.className = "status-text";
  setResultState("pending", "Processing Request");

  try {
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
      const executionTime = responseBody.metadata?.executionTimeMs;
      requestStatus.textContent = executionTime != null
          ? `Transformation completed in ${executionTime} ms.`
          : "Transformation completed.";
      requestStatus.className = "status-text is-success";
      setResultState("success", "Success");
    } else {
      renderError(responseBody);
      requestStatus.textContent = "Transformation failed.";
      requestStatus.className = "status-text is-error";
      setResultState("error", "Error");
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
    setResultState("error", "Error");
  } finally {
    setLoadingState(false);
  }
});

setActiveEditor("xml");
renderPlaceholder();
