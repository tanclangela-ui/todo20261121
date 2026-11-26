# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A to-do tracker written as a plain static web page: `index.html` (markup plus all CSS inline) and `app.js` (all behaviour). No frameworks, no build step, no package manager, no tests. The user wants it to stay vanilla HTML/CSS/JS.

`mockup.html` shows the app inside two Galaxy S25-sized phone frames (light and dark) by embedding `index.html?demo...` in iframes. `mockup-preview.jpg` is a screenshot of it.

## Running and testing

There is no Python or Node on this machine. To test, serve the folder over HTTP (opening the files via `file://` blocks the mockup's iframes, and the desktop app's static preview pane blocks `localStorage` and doesn't load `app.js`). A minimal PowerShell `System.Net.HttpListener` static server on `http://localhost:8765/` works; keep it in the session scratchpad, not the project. Then use the browser pane, with viewport emulation (mobile preset is 375×812) for the phone layout.

Testing is manual in the browser. Clear the test `localStorage` keys afterwards so the user's real list isn't polluted.

Demo mode, used by the mockup and handy for checking visuals without touching saved data:
- `index.html?demo` loads six sample items with deadlines relative to today and never writes to storage.
- `&theme=dark|light` forces a theme; `&view=list` starts scrolled to the list.

## Architecture (app.js)

- **State**: a single `items` array, persisted to `localStorage` as JSON. Every storage access is wrapped in try/catch; `save()` and `writePref()` are no-ops in demo mode. Preferences (theme, sort) are stored under separate keys.
- **Items are addressed by `id`, never by array index.** Sorting, filtering, drag, undo and repeat links all depend on this. Item shape: `{id, item, priority, deadline, requestedBy, notes, repeat, status, doneAt, createdAt, order, nextId}`.
- **`upgrade(list)` migrates older saved data** (e.g. the old `done: true` flag becomes `status: 'done'`). Any new field must get a default there, and import runs through it too.
- **Render is full re-render**: mutate `items`, call `save()`, then `render()`. `render()` → `visibleItems()` (filter by person, split open/done, sort with `compare`; done items always last, newest `doneAt` first) → `buildRow(it)` per item, plus `renderCounter` and `refreshPeople` (datalist + filter menu).
- **Status vs done**: status is `todo | progress | waiting | done`. `markDone`/`reopen` handle the done transition; for repeating items `markDone` creates the next occurrence (`nextDeadline`, never in the past, monthly clamps to month end) and links it via `nextId`, and `reopen` removes that copy if it's still `todo`.
- **Editing** keeps the item's status, dates and order (`Object.assign` onto the existing item). `editId` tracks the item being edited.
- **Drag to reorder** works only in "My order" sort. Pointer listeners go on `document`, not the row (moving the row in the DOM otherwise drops pointer capture). On drop, the existing `order` values are reassigned in the new DOM order.
- **Toasts**: `showMessage(text, action)` shows the bottom toast; with an action (Undo) it stays longer. Delete has no confirm, only Undo.
- **Export/import**: JSON backup, and CSV with a BOM and `'`-prefixing of values starting with `= + - @` (formula-injection guard). Import validates, confirms, replaces the list, and offers Undo.

## Styling (index.html)

- Colours are CSS custom properties on `:root`. Dark mode is defined twice and both must stay in sync: under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and under `:root[data-theme="dark"]`. A small script in `<head>` applies the saved theme before first paint.
- Under 640px the table becomes cards (`display: block` rows, labels from `td[data-label]::before`). Keep inputs at 16px (stops iOS zoom), tap targets ≥ 44px, and the `env(safe-area-inset-*)` padding.

## Project conventions

- Record every change in `CHANGELOG.md` (dated `## YYYY-MM-DD` sections, newest first; Added / Changed / Fixed / Removed with file and reason; plus "Not verified" and "Known limitations").
- Known limitations already listed there (data only in this browser, import replaces rather than merges, no auto-scroll while dragging, hints not refreshed at midnight) are deliberate for now.
