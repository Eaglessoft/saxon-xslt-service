/*
 * Upgrades the two input textareas AND the result pane into CodeMirror 6.
 *
 * WHY IT IS SHAPED THIS WAY
 *
 * app.js is untouched. It still reads and writes `#xmlInput.value` and
 * `#xsltInput.value`, still toggles `.is-hidden` on them, still writes the
 * result as a <pre> into `#resultOutput`, and knows nothing about this file.
 * Each input editor mirrors its content back into its textarea on every change,
 * and the result editor is mounted by watching the DOM rather than by asking
 * app.js to call anything. So the transform request, the upload handler and the
 * error rendering all keep working exactly as before.
 *
 * This is progressive enhancement, not a replacement: if the CDN is blocked,
 * the import map is unsupported, or any module fails, nothing here runs and the
 * page keeps the textareas and the <pre> it was served with. A broken editor
 * must never mean an unusable tool.
 *
 * Dependencies are pinned in the import map in index.html, and every specifier
 * below is bare so that map is what resolves them. That matters more than it
 * looks: CodeMirror carries instance-identity checks, and two copies of
 * @codemirror/state - which is exactly what unpinned CDN builds produce - make
 * every extension fail with "Unrecognized extension value".
 */
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  highlightSpecialChars,
} from "@codemirror/view";
import {
  foldGutter,
  foldKeymap,
  codeFolding,
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
  HighlightStyle,
  indentUnit,
} from "@codemirror/language";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  searchKeymap,
  highlightSelectionMatches,
  search,
  openSearchPanel,
} from "@codemirror/search";
import { xml } from "@codemirror/lang-xml";
import { tags } from "@lezer/highlight";

/* Colours come from the stylesheet, not from here: CodeMirror themes want
   values, and ours live on CSS custom properties that flip with the theme. So
   the theme below assigns var(...) everywhere and the actual palette stays in
   app.css, which means a theme switch needs no editor rebuild. */
const cssVar = (name) => `var(${name})`;

const docnautTheme = EditorView.theme({
  "&": {
    height: "100%",
    color: cssVar("--x-text"),
    backgroundColor: cssVar("--ws-code-bg"),
    fontSize: "0.88rem",
  },
  ".cm-scroller": {
    fontFamily: cssVar("--font-mono"),
    lineHeight: "1.55",
    overflow: "auto",
  },
  ".cm-content": { padding: "8px 0" },
  ".cm-gutters": {
    backgroundColor: cssVar("--ws-code-bg"),
    color: cssVar("--muted2"),
    border: "none",
    borderRight: `1px solid ${cssVar("--line2")}`,
  },
  ".cm-activeLineGutter": {
    backgroundColor: cssVar("--ws-gutter-active"),
    color: cssVar("--fg"),
  },
  ".cm-activeLine": { backgroundColor: cssVar("--ws-line-active") },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: cssVar("--fg") },
  "&.cm-focused": { outline: "none" },
  /* Selection needs the doubled selector: CodeMirror sets its own with high
     specificity and a single one loses. */
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    { backgroundColor: cssVar("--ws-select") },
  ".cm-selectionMatch": { backgroundColor: cssVar("--ws-select-match") },
  ".cm-foldPlaceholder": {
    backgroundColor: cssVar("--ws-chip"),
    color: cssVar("--muted"),
    border: `1px solid ${cssVar("--line2")}`,
    borderRadius: "4px",
    margin: "0 2px",
    padding: "0 6px",
  },
  ".cm-panels": {
    backgroundColor: cssVar("--card"),
    color: cssVar("--fg"),
    borderTop: `1px solid ${cssVar("--line2")}`,
  },
  ".cm-panel.cm-search": {
    padding: "10px 12px",
    fontFamily: cssVar("--font"),
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
  },
  ".cm-panel.cm-search input, .cm-panel.cm-search button, .cm-panel.cm-search label":
    { fontFamily: "inherit", fontSize: "0.82rem" },

  /* .cm-textfield, NOT input[type=text]: CodeMirror sets no type attribute, so
     the attribute selector never matches and the field stays white. */
  ".cm-panel.cm-search .cm-textfield": {
    backgroundColor: cssVar("--ws-code-bg"),
    color: cssVar("--fg"),
    border: `1px solid ${cssVar("--line2")}`,
    borderRadius: cssVar("--radius-sm"),
    padding: "5px 9px",
    minWidth: "13rem",
  },
  ".cm-panel.cm-search .cm-textfield::placeholder": { color: cssVar("--muted2") },
  ".cm-panel.cm-search .cm-textfield:focus-visible": {
    outline: `3px solid ${cssVar("--accent")}`,
    outlineOffset: "1px",
    borderColor: cssVar("--accent"),
  },

  /* CodeMirror's buttons are a background-image gradient; backgroundColor alone
     leaves the grey showing through. */
  ".cm-panel.cm-search .cm-button": {
    backgroundImage: "none",
    backgroundColor: cssVar("--ws-soft"),
    color: cssVar("--fg"),
    border: `1px solid ${cssVar("--line2")}`,
    borderRadius: cssVar("--radius-sm"),
    padding: "5px 12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color .18s ease, border-color .18s ease",
  },
  ".cm-panel.cm-search .cm-button:hover": {
    backgroundColor: cssVar("--ws-soft-hi"),
    borderColor: cssVar("--accent"),
  },
  ".cm-panel.cm-search .cm-button:active": { backgroundColor: cssVar("--ws-chip") },
  ".cm-panel.cm-search .cm-button:focus-visible": {
    outline: `3px solid ${cssVar("--accent")}`,
    outlineOffset: "2px",
  },

  /* accent-color themes a native checkbox without replacing it, which would
     cost its keyboard and screen-reader behaviour. */
  ".cm-panel.cm-search label": {
    color: cssVar("--muted"),
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    userSelect: "none",
  },
  ".cm-panel.cm-search input[type=checkbox]": {
    accentColor: cssVar("--accent"),
    width: "14px",
    height: "14px",
    margin: "0",
    cursor: "pointer",
  },
  ".cm-panel.cm-search input[type=checkbox]:focus-visible": {
    outline: `3px solid ${cssVar("--accent")}`,
    outlineOffset: "2px",
  },

  ".cm-panel.cm-search button[name=close]": {
    color: cssVar("--muted"),
    fontSize: "1.1rem",
    lineHeight: "1",
    padding: "2px 6px",
    borderRadius: cssVar("--radius-sm"),
    cursor: "pointer",
  },
  ".cm-panel.cm-search button[name=close]:hover": { color: cssVar("--fg") },
  ".cm-panel.cm-search button[name=close]:focus-visible": {
    outline: `3px solid ${cssVar("--accent")}`,
    outlineOffset: "2px",
  },
  ".cm-searchMatch": { backgroundColor: cssVar("--ws-select-match") },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: cssVar("--ws-select"),
  },
});

/* Element content gets its own colour rather than sharing the body one: in a
   document where every tag name is blue, blue-tinted content blurs into the
   markup, and telling the data from the tags is the main act of reading here. */
const docnautHighlight = HighlightStyle.define([
  { tag: tags.tagName, color: cssVar("--x-tag") },
  { tag: tags.attributeName, color: cssVar("--x-attr") },
  { tag: tags.attributeValue, color: cssVar("--x-val") },
  { tag: tags.string, color: cssVar("--x-val") },
  { tag: tags.comment, color: cssVar("--x-comment"), fontStyle: "italic" },
  { tag: tags.processingInstruction, color: cssVar("--x-meta") },
  { tag: tags.meta, color: cssVar("--x-meta") },
  { tag: tags.angleBracket, color: cssVar("--x-punc") },
  { tag: tags.definitionOperator, color: cssVar("--x-punc") },
  { tag: tags.content, color: cssVar("--x-text") },
]);

/* One list, both sides. The result pane is meant to have the same reading
   affordances as the input - line numbers, folding, search - and the only
   difference is that you cannot type into it. */
function extensions({ readOnly }) {
  const base = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    highlightSpecialChars(),
    codeFolding(),
    foldGutter(),
    drawSelection(),
    indentUnit.of("  "),
    search({ top: true }),
    highlightSelectionMatches(),
    xml(),
    syntaxHighlighting(docnautHighlight),
    docnautTheme,
    EditorView.lineWrapping,
  ];

  if (readOnly) {
    return base.concat([
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      keymap.of([...searchKeymap, ...foldKeymap]),
    ]);
  }

  return base.concat([
    history(),
    rectangularSelection(),
    crosshairCursor(),
    indentOnInput(),
    bracketMatching(),
    keymap.of([
      ...searchKeymap,
      ...foldKeymap,
      ...historyKeymap,
      ...defaultKeymap,
      indentWithTab,
    ]),
  ]);
}

/* ---------------------------------------------------------------- inputs */

const hosts = new Map();
const views = new Map();

function mountInput(textarea) {
  const host = document.createElement("div");
  host.className = "cm-host";
  textarea.parentNode.insertBefore(host, textarea);
  hosts.set(textarea.id, host);

  /* The textarea stays in the DOM and stays the source of truth for app.js.
     It is hidden rather than removed so that `.is-hidden` toggling, the id
     lookups and the form value all keep behaving. */
  textarea.classList.add("cm-backing");

  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: textarea.value,
      extensions: extensions({ readOnly: false }).concat([
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            textarea.value = update.state.doc.toString();
          }
        }),
      ]),
    }),
  });

  /* Uploading a file assigns straight to textarea.value, which fires no event.
     Intercepting the property is what keeps the editor in step without app.js
     having to know this file exists. The guard stops the update listener above
     from bouncing straight back into a dispatch. */
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value"
  );
  Object.defineProperty(textarea, "value", {
    configurable: true,
    get() {
      return descriptor.get.call(this);
    },
    set(next) {
      descriptor.set.call(this, next);
      if (next !== view.state.doc.toString()) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: next },
        });
      }
    },
  });

  return view;
}

document.querySelectorAll("textarea.editor-textarea").forEach((textarea) => {
  views.set(textarea.id, mountInput(textarea));
});

/* The panes are switched by toggling .is-hidden on the textarea, so the editor
   that just became visible has to be told to measure itself - it was sized
   while its container had no layout. */
function syncVisibility() {
  views.forEach((view, id) => {
    const textarea = document.getElementById(id);
    const host = hosts.get(id);
    if (!textarea || !host) {
      return;
    }
    const hidden = textarea.classList.contains("is-hidden");
    host.classList.toggle("is-hidden", hidden);
    if (!hidden) {
      view.requestMeasure();
    }
  });
}

const visibilityObserver = new MutationObserver(syncVisibility);

document.querySelectorAll("textarea.editor-textarea").forEach((textarea) => {
  visibilityObserver.observe(textarea, {
    attributes: true,
    attributeFilter: ["class"],
  });
});

syncVisibility();

/* ---------------------------------------------------------------- result */

const resultOutput = document.getElementById("resultOutput");
let resultView = null;
let resultRaw = "";
let resultFormatted = false;

/* app.js replaces resultOutput.innerHTML wholesale on every run, so the mount
   is driven by watching for the <pre> to appear rather than by a callback.
   Only successful output is taken over: the error pane carries compiler
   diagnostics and a stack trace, which are not XML and would be mis-coloured
   by an XML grammar. */
/* The result pane's search button is only meaningful once a result view exists.
   This function is the one place that knows. */
function markResultSearchable(on) {
  const surface = resultOutput && resultOutput.closest(".result-surface");
  if (surface) {
    surface.classList.toggle("has-result-editor", on);
  }
}

function mountResult() {
  if (!resultOutput) {
    return;
  }

  const pre = resultOutput.querySelector("pre.response-code:not(.is-error)");

  if (!pre) {
    markResultSearchable(false);
    if (resultView) {
      resultView.destroy();
      resultView = null;
      resultRaw = "";
      resultFormatted = false;
      syncFormatButtons();
    }
    return;
  }

  if (pre.dataset.cmMounted === "1") {
    return;
  }
  pre.dataset.cmMounted = "1";

  if (resultView) {
    resultView.destroy();
    resultView = null;
  }

  pre.classList.add("cm-backing");

  const host = document.createElement("div");
  host.className = "cm-host cm-result";
  pre.parentNode.insertBefore(host, pre);

  resultRaw = pre.textContent;
  resultFormatted = false;

  resultView = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: resultRaw,
      extensions: extensions({ readOnly: true }),
    }),
  });

  markResultSearchable(true);
  /* After the view is assigned: syncFormatButtons() reads resultView. */
  syncFormatButtons();
}

/* Indents a copy of the output FOR READING ONLY.
 *
 * The transform result is never rewritten: Copy still hands back exactly what
 * Saxon produced, because whitespace in XML can be significant and a tool whose
 * output you cannot trust byte-for-byte is not much use. Indentation belongs to
 * the stylesheet - <xsl:output indent="yes"/> - and this is only for reading
 * someone else's stylesheet's output without editing it first.
 *
 * Anything that does not parse as XML (method="text" or "html" output, or a
 * fragment) is left exactly as it is rather than guessed at.
 */
function prettyPrintXml(source) {
  const parsed = new DOMParser().parseFromString(source, "application/xml");
  if (parsed.getElementsByTagName("parsererror").length) {
    return null;
  }

  const lines = [];
  const INDENT = "  ";

  function walk(node, depth) {
    const pad = INDENT.repeat(depth);

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue.trim();
        if (text) {
          lines.push(pad + INDENT + text);
        }
        return;
      }
      if (child.nodeType === Node.COMMENT_NODE) {
        lines.push(pad + INDENT + "<!--" + child.nodeValue + "-->");
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      emit(child, depth + 1);
    });
  }

  function attrs(el) {
    return [...el.attributes]
      .map((a) => ' ' + a.name + '="' + a.value.replace(/"/g, "&quot;") + '"')
      .join("");
  }

  function emit(el, depth) {
    const pad = INDENT.repeat(depth);
    const open = "<" + el.nodeName + attrs(el);
    const elementChildren = [...el.childNodes].filter(
      (c) => c.nodeType === Node.ELEMENT_NODE || c.nodeType === Node.COMMENT_NODE
    );
    const text = [...el.childNodes]
      .filter((c) => c.nodeType === Node.TEXT_NODE)
      .map((c) => c.nodeValue.trim())
      .join("");

    if (!elementChildren.length && !text) {
      lines.push(pad + open + "/>");
      return;
    }
    if (!elementChildren.length) {
      lines.push(pad + open + ">" + text + "</" + el.nodeName + ">");
      return;
    }

    lines.push(pad + open + ">");
    elementChildren.forEach((child) => {
      if (child.nodeType === Node.COMMENT_NODE) {
        lines.push(INDENT.repeat(depth + 1) + "<!--" + child.nodeValue + "-->");
      } else {
        emit(child, depth + 1);
      }
    });
    lines.push(pad + "</" + el.nodeName + ">");
  }

  const declaration = source.match(/^\s*<\?xml[^>]*\?>/);
  if (declaration) {
    lines.push(declaration[0].trim());
  }
  emit(parsed.documentElement, 0);
  return lines.join("\n");
}

const FORMAT_DEFAULT_TITLE = "Format for reading (does not change the result)";
const FORMAT_PREVIEW_TITLE = "Switch to the Result tab to format the markup";
const FORMAT_UNAVAILABLE_TITLE =
  "Nothing to do - this output is already indented";

/* The format button rewrites the code view, so it does nothing visible while
   the preview is showing. app.js announces the switch on dn:result-view. */
let previewingResult = false;

function syncFormatButtons() {
  document.querySelectorAll("[data-format-result]").forEach((button) => {
    button.setAttribute("aria-pressed", String(resultFormatted));
    button.classList.toggle("is-active", resultFormatted);
    button.disabled = !resultView || previewingResult;
    button.title = previewingResult ? FORMAT_PREVIEW_TITLE : FORMAT_DEFAULT_TITLE;
  });
}

document.addEventListener("dn:result-view", (event) => {
  previewingResult = Boolean(event.detail && event.detail.preview);
  syncFormatButtons();
});

document.querySelectorAll("[data-format-result]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!resultView) {
      return;
    }

    let next;
    if (resultFormatted) {
      next = resultRaw;
      resultFormatted = false;
    } else {
      const pretty = prettyPrintXml(resultRaw);
      /* Not XML we can parse, or already indented (the norm for method="html").
         Either way the click would be silent, so disable instead. */
      if (pretty === null || pretty === resultRaw) {
        button.disabled = true;
        button.title = FORMAT_UNAVAILABLE_TITLE;
        return;
      }
      next = pretty;
      resultFormatted = true;
    }

    resultView.dispatch({
      changes: { from: 0, to: resultView.state.doc.length, insert: next },
    });
    syncFormatButtons();
  });
});

/* Otherwise the button keeps its markup state for the whole first visit. */
syncFormatButtons();

if (resultOutput) {
  new MutationObserver(mountResult).observe(resultOutput, {
    childList: true,
    subtree: true,
  });
  mountResult();
}

/* ---------------------------------------------------------------- search */

/* A visible affordance: the keymap alone is undiscoverable. `data-editor-search
   ="result"` targets the output pane, anything else the input that is in front. */
document.querySelectorAll("[data-editor-search]").forEach((button) => {
  button.addEventListener("click", () => {
    let target = null;

    if (button.dataset.editorSearch === "result") {
      target = resultView;
    } else {
      const entry = [...views.entries()].find(([id]) => {
        const textarea = document.getElementById(id);
        return textarea && !textarea.classList.contains("is-hidden");
      });
      target = entry ? entry[1] : null;
    }

    if (target) {
      target.focus();
      openSearchPanel(target);
    }
  });
});

document.documentElement.classList.add("cm-ready");
