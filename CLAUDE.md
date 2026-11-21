# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`todo-app/` is a to-do tracker built with plain HTML, CSS and JavaScript. It has no frameworks, no build step, no package manager and no tests. The user asked for it to stay simple and framework-free, so don't add dependencies or tooling unless they ask. Each task has four fields: item, priority (High/Medium/Low), deadline and requested by.

## Running it

- Double-click `todo-app/index.html` to open it in a browser, or `todo-app/mockup.html` for the phone mockup.
- The desktop app's browser pane can't use localStorage on `file://` pages, so it needs the app served over localhost. `.claude/launch.json` defines a `todo-app` server on port 8765, which runs a small PowerShell `HttpListener` script (`serve.ps1`).
  - That script lives in a session scratchpad directory, which may have been cleared. If it's missing, recreate it as a static file server rooted at `todo-app/`. It must send `text/javascript` for `.js` and `text/css` for `.css`, otherwise styles won't apply.
  - Don't count on Python being installed. `python` on this machine may be the Windows Store placeholder, which hangs.

## Architecture

- **`index.html`**: the static markup: header stats, progress bar, the add/edit form, the toolbar and an empty `<ul id="taskList">`. `app.js` finds elements by `id`, so keep IDs stable.
- **`app.js`**: one script that keeps all state in module-level variables (`tasks`, `filter`, `editingId`).
  - Every change follows the same pattern: update `tasks`, call `save()` to write it to localStorage under the key `"tasks"`, then call `render()`.
  - `render()` rebuilds the whole list from `visibleTasks()`, which applies the filter, search and sort, and also updates the stats and progress bar.
  - The add form also handles editing: `startEdit()` fills the form and sets `editingId`, and submitting either saves the edit or adds a new task.
  - When loading, tasks saved by the first draft get default `id`, `done` and `created` values, so keep this migration if you change the task shape.
  - Deadlines are `YYYY-MM-DD` strings compared against `todayString()`, which is local time, not UTC.
- **Demo mode**: opening `index.html?demo` loads sample tasks from `demoTasks()`, with deadlines relative to today. In this mode `save()` does nothing, so the user's real tasks are never touched. It also adds `class="demo"` to `<html>` so the CSS can hide the scrollbar.
- **`mockup.html`**: a phone frame styled like the Galaxy S25 that embeds `index.html?demo` in an iframe at 360×780 CSS px. Any change to the app's layout shows up here, so check the `@media (max-width: 600px)` rules in `styles.css` when changing layout. Keep the frame generic: no Samsung logo or branding.
- **`styles.css`**: colours are CSS variables on `:root`, with a dark-mode override under `prefers-color-scheme: dark`. A task's priority sets its colour through the classes `.task.priority-<P>` and `.badge.<P>`, which match the priority values exactly. If you rename a priority, update `PRIORITY_ORDER` in `app.js` as well.
