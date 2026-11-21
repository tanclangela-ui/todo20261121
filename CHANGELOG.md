# Changelog

## 2026-11-21

### Changed
- `styles.css`: the "To-Do Tracker" heading is now brick red, set through a new `--heading` colour variable (`#b33a2b` in light mode, a lighter `#e0705f` in dark mode so it stays readable). Requested by the user.
- `styles.css`: the header is now a centred column. The title and date sit centred on top, with the Active/Overdue/Done stats centred below. Before, the title sat on the left with the stats on the right, so it couldn't be truly centred.

- `index.html`, `styles.css`: the add-task form is now two compact lines so the task list starts higher up the screen. Line 1 holds the task text with the Add/Cancel buttons beside it (they used to sit on their own row underneath). Line 2 holds Priority, Deadline and Requested by. Inputs are smaller, and the labels sit beside them instead of above. On phones (≤600px) the label text is hidden visually but kept for screen readers, so all three fields fit on one line. Label text is now wrapped in `<span class="label-text">`. All element IDs are unchanged.

### Added
- `.claude/launch.json`: a copy of the `todo-app` preview server config from the parent folder's `.claude/launch.json`, so the desktop app's browser pane can start the server when the session opens in `todo-app/`. It points to `serve.ps1` in an old session scratchpad, which may get cleared later.

- Git: the project is now a git repository on branch `main`, pushed to https://github.com/tanclangela-ui/todo20261121 at the user's request. The commit author (name and email) is set in this repository only, not globally.
- `.gitignore`: added. It excludes `.claude/`, which only holds the machine-specific launch config pointing to a temporary folder.

### Not verified
- The heading and the form were checked in the browser pane in light mode at desktop width and at 360px wide, and adding a task works. Not checked: dark mode, `mockup.html` itself, or editing an existing task (when the Cancel button also shows on line 1).
