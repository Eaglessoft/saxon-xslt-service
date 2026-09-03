/*
 * Drag-to-resize for the two workspace panels.
 *
 * Deliberately a plain script rather than a module: the split has to keep
 * working where editor.js does not load. It touches nothing app.js owns - it
 * only writes two custom properties on the shell, so the layout stays
 * declarative and the keyboard path runs the same code as the pointer one.
 *
 * The chosen split is remembered per browser. That is a per-viewer
 * convenience, not shared state, which is exactly what localStorage is for -
 * and a failure to read it (private window, blocked storage) must not stop the
 * page rendering, hence the try/catch on both ends.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'dn-xslt-split';
    var MIN = 20;
    var MAX = 80;

    var shell = document.querySelector('.workspace-shell');
    var handle = document.querySelector('.pane-resizer');
    if (!shell || !handle) {
        return;
    }

    function clamp(value) {
        return Math.min(MAX, Math.max(MIN, value));
    }

    function apply(percent) {
        var left = clamp(percent);
        shell.style.setProperty('--pane-left', left + 'fr');
        shell.style.setProperty('--pane-right', (100 - left) + 'fr');
        handle.setAttribute('aria-valuenow', String(Math.round(left)));
        return left;
    }

    var current = 50;
    try {
        var stored = parseFloat(window.localStorage.getItem(STORAGE_KEY));
        if (!isNaN(stored)) {
            current = stored;
        }
    } catch (e) { /* storage unavailable; the default split is fine */ }
    current = apply(current);

    function remember(value) {
        try {
            window.localStorage.setItem(STORAGE_KEY, String(Math.round(value)));
        } catch (e) { /* ignored, see above */ }
    }

    function fromPointer(event) {
        var box = shell.getBoundingClientRect();
        if (!box.width) {
            return current;
        }
        return ((event.clientX - box.left) / box.width) * 100;
    }

    handle.addEventListener('pointerdown', function (event) {
        // Capture so the drag survives the pointer crossing an editor, which
        // would otherwise swallow the move events.
        handle.setPointerCapture(event.pointerId);
        handle.classList.add('is-dragging');
        document.body.classList.add('is-resizing');
        event.preventDefault();
    });

    handle.addEventListener('pointermove', function (event) {
        if (!handle.hasPointerCapture(event.pointerId)) {
            return;
        }
        current = apply(fromPointer(event));
    });

    function endDrag(event) {
        if (!handle.hasPointerCapture(event.pointerId)) {
            return;
        }
        handle.releasePointerCapture(event.pointerId);
        handle.classList.remove('is-dragging');
        document.body.classList.remove('is-resizing');
        remember(current);
    }

    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);

    // Double-click resets, which is the usual escape hatch when a pane has been
    // dragged somewhere useless.
    handle.addEventListener('dblclick', function () {
        current = apply(50);
        remember(current);
    });

    handle.addEventListener('keydown', function (event) {
        var step = event.shiftKey ? 10 : 2;
        var next = null;

        if (event.key === 'ArrowLeft') {
            next = current - step;
        } else if (event.key === 'ArrowRight') {
            next = current + step;
        } else if (event.key === 'Home') {
            next = MIN;
        } else if (event.key === 'End') {
            next = MAX;
        } else if (event.key === 'Enter' || event.key === ' ') {
            next = 50;
        }

        if (next === null) {
            return;
        }

        event.preventDefault();
        current = apply(next);
        remember(current);
    });
})();
