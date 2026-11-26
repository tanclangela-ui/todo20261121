# Changelog

## 2026-11-26

### Added
- `index.html`: first-draft to-do tracker page with a form (item, priority, deadline, requested by) and a table listing items. Minimal inline CSS. Kept deliberately simple as a first draft.
- `app.js`: plain JavaScript to add and delete items and save them in the browser's `localStorage`, so they persist across reloads.
- `app.js`: an Edit button on each row. It loads the item into the form, the Add button changes to Save, and saving replaces that item. Requested by the user.
- `app.js`, `index.html`: a Done button on each row. It marks the item done (struck through and greyed out) and changes to Undo. A green message says e.g. `"Buy milk" is done!` and hides after a few seconds. Requested by the user.
- `index.html`, `app.js`: a round light/dark mode button in the top-right corner, as requested. It shows 🌙 in light mode and ☀️ in dark mode. The app follows the phone or computer setting until you tap it, then remembers your choice. A small script in `<head>` applies the saved choice before the page draws, so there's no flash of the wrong colours.
- `index.html`, `app.js`: phone layout for iPhone and Android screens (640px wide or less), as requested. Each item becomes its own card with a bold title and small labels. Empty fields are hidden, and Done, ✏️ and 🗑️ sit along the bottom as large thumb-sized buttons (44px+). Form fields stack one per line with full-width buttons. Fields use a 16px font so iPhones don't zoom in when you tap them, and padding respects the iPhone notch and home bar. A theme colour is set for the browser bar.
- `app.js`: tapping ✏️ scrolls up to the form and focuses it, so on a phone you can see what you're editing.
- Feature batch requested by the user (suggestions 1, 2, 6, 7, 8, 9 and the "more useful tracking" group 10–15):
  - **Deadline highlighting** (`app.js`, `index.html`): dates show in a friendly form ("28 Nov", with the year only when it isn't this year) plus a hint like "Today", "Tomorrow", "In 3 days" or "6 days overdue". Items due today or tomorrow are amber, and overdue items are red. Done items aren't highlighted.
  - **Sort** (`app.js`, `index.html`): a Sort menu with My order / Priority / Deadline / Requested by / Newest first. Done items always go to the bottom, most recently finished first. The chosen sort is remembered.
  - **Counter** (`app.js`, `index.html`): pills above the list, e.g. "4 open · 1 overdue · 1 waiting · 1 done". Zero counts are hidden, and overdue is shown in red. The counts follow the person filter.
  - **Undo delete** (`app.js`, `index.html`): deleting no longer shows a confirm pop-up. A "Deleted 'X'. Undo" message appears for 7 seconds instead. All messages now float at the bottom of the screen, so they're visible however far down the list you are.
  - **Export / import backup** (`app.js`, `index.html`): "⬇️ Export backup" downloads the whole list as a `.json` file. "⬆️ Import backup" loads one back, after a confirmation, with an Undo. Invalid files are rejected with a message. A hint under the buttons reminds you the list lives in this browser only.
  - **Export to Excel (CSV)** (`app.js`, `index.html`): downloads a `.csv` with item, priority, status, deadline, requested by, repeat, notes, created date and done date. It includes a byte-order mark so Excel shows accents correctly. Values starting with `= + - @` are prefixed with `'` so spreadsheets don't run them as formulas.
  - **Notes** (`app.js`, `index.html`): an optional notes box in the form. Notes show in small grey text under the item name, keeping line breaks.
  - **Status** (`app.js`, `index.html`): each item has a colour-coded status picker: To do (grey), In progress (blue), Waiting (purple), Done (green). Choosing Done works the same as the Done button.
  - **Done date** (`app.js`): when an item is finished, the date is saved and shown as "✔ Done 26 Nov". It's included in the CSV.
  - **Requester shortcuts** (`app.js`, `index.html`): "Requested by" suggests names you've used before as you type, and a "Show" menu filters the list to one person.
  - **Repeating tasks** (`app.js`, `index.html`): a "Repeats daily / weekly / monthly" option. Marking a repeating item done adds the next one with the next deadline, which is never in the past ("Next one due 4 Dec"). Monthly items keep the same day where possible (31 Jan → 28 Feb). Undoing the done item removes the auto-created next one if it hasn't been started.
  - **Drag to reorder** (`app.js`, `index.html`): a ⠿ handle on each open item lets you drag it up or down with a mouse or finger when sorting by "My order". The handle is hidden for other sorts.
  - **Galaxy S25 mockup** (`mockup.html`, `mockup-preview.jpg`), requested by the user: two phone frames at the Galaxy S25's screen size (360 × 780 web pixels). They have flat sides, thin bezels, a centred punch-hole camera, side keys, an Android status bar, a browser address bar and a gesture bar. One shows light mode and the form; the other shows dark mode and the list. Each screen is the real app in an iframe, so it can be scrolled and tapped. `mockup-preview.jpg` is a screenshot of the page for sharing. The frame is a generic drawing in the S25's shape, with no Samsung logo.
  - **Demo mode** (`app.js`, `index.html`), added for the mockup: opening `index.html?demo` shows six sample items whose deadlines are relative to today, so the overdue, today and tomorrow colours always appear. Demo mode never saves, so it doesn't touch your real list. `&theme=dark|light` picks a theme, `&view=list` starts scrolled to the list, and scrollbars are hidden like on a phone.
  - **CLAUDE.md** (`CLAUDE.md`), requested via `/init`: notes for future Claude Code sessions covering how to serve and test the app locally, demo mode, how `app.js` is structured (id-based items, `upgrade()` migration, full re-render, repeat/done logic, drag), the two places dark-mode colours are defined, and the changelog convention.
  - **Git / GitHub**: this folder is now a git repository on `main`, pushed to https://github.com/tanclangela-ui/todo20261121 as requested. It's a normal new commit on top of the repo's existing history, not a force push. The commit author is set in this repository only, using a GitHub no-reply address so no personal email is published. `.gitignore` (excludes `.claude/`) was kept from the repo. The older 21 Nov changelog section from the repo is kept at the bottom of this file.
  - **Cancel while editing** (`app.js`, `index.html`): a Cancel button appears next to Save. This wasn't in the requested list, but it fixes the known issue of having no way out of editing.

### Changed
- `index.html`: modern restyle, as requested. It has an indigo-to-violet gradient title and Add button, white rounded cards with soft shadows, rounded inputs with a focus glow, and a styled table with row hover. Colours are defined once as CSS variables at the top of the style block.
- `app.js`: priority shows as a coloured pill (red High, amber Medium, green Low), and an empty list shows "Nothing to do yet".
- `app.js`: the Edit and Delete buttons show a pencil (✏️) and a dustbin (🗑️) instead of text, as requested. Each has a hover tooltip and a screen-reader label.
- `app.js`: rewritten around item ids instead of list positions, which is needed for sorting, filtering, drag and undo. Items saved by earlier versions are upgraded automatically when the page loads; the old "done" flag becomes the Done status. This was tested with old-format data.
- `index.html`: in dark mode the Done button, and the message's Undo button, keep a deeper green so the white text stays readable. This was found while testing.
- `app.js`: reading and saving `localStorage` is wrapped in try/catch, so the app still loads where browser storage is blocked (it just won't remember items there).

### Removed
- `styles.css`: removed from the GitHub repo. The repo held an earlier, separate version of the app (pushed 21 Nov from another folder) that used this file. The user chose to replace that version with this one, and this version keeps its CSS inline in `index.html`. The old version is still in the repo's commit history.

### Fixed
- `app.js`: drag-to-reorder stopped halfway and never saved, because moving the row made the browser drop the drag. It now listens for the drag on the whole page. This was found and fixed during testing; a real mouse drag now reorders the list and the new order survives a reload.

### Not verified
- Tested by serving the real files from a temporary local server in the Claude preview pane, at an emulated 375px phone size and at desktop width, in light and dark themes. These all worked:
  - old-data upgrade
  - adding items with notes and repeat, and the name suggestions
  - Done and Undo, including the weekly repeat creating and removing the next item
  - status changes
  - delete and Undo
  - edit, Cancel and Save (status kept)
  - each sort and the person filter
  - the counter and deadline colours
  - drag with a mouse, saved after reload
  - import, including Undo and rejecting a bad file
  - the contents of the CSV and JSON exports
- The test data was cleared afterwards.
- The mockup was checked through the local server at 1000px wide. Both phones load the app at a 360px width with the right theme and 6 sample items, and nothing is written to storage. Opening `mockup.html` by double-clicking it (a `file://` address) wasn't tested. Some browsers restrict iframes there, so if the screens come up blank, view it through a local server or hosting instead.
- Not tested:
  - real file downloads (export contents were captured in the page instead)
  - drag with a real finger on a touch screen
  - a real iPhone or Android device

### Known limitations
- Data is stored only in the current browser (no sync, lost if browser data is cleared). Use Export backup.
- Import replaces the whole list; it doesn't merge.
- While dragging, the page doesn't auto-scroll, so on a long list move items in a few steps.
- Deadline hints ("Today", "Tomorrow") update when the page is reloaded or changed, not at midnight if it's left open.
- Undoing a delete puts the item back but doesn't restore the form if you were editing it.

## 2026-11-21

### Changed
- `styles.css`: the "To-Do Tracker" heading is now brick red, set through a new `--heading` colour variable (`#b33a2b` in light mode, a lighter `#e0705f` in dark mode so it stays readable). Requested by the user.
- `styles.css`: the header is now a centred column. The title and date sit centred on top, with the Active/Overdue/Done stats centred below. Before, the title sat on the left with the stats on the right, so it couldn't be truly centred.

- `index.html`, `styles.css`: the add-task form is now two compact lines so the task list starts higher up the screen. Line 1 holds the task text with the Add/Cancel buttons beside it (they used to sit on their own row underneath). Line 2 holds Priority, Deadline and Requested by. Inputs are smaller, and the labels sit beside them instead of above. On phones (≤600px) the label text is hidden visually but kept for screen readers, so all three fields fit on one line. Label text is now wrapped in `<span class="label-text">`. All element IDs are unchanged.

### Added
- `.claude/launch.json`: a copy of the `todo-app` preview server config from the parent folder's `.claude/launch.json`, so the desktop app's browser pane can start the server when the session opens in `todo-app/`. It points to `serve.ps1` in an old session scratchpad, which may get cleared later.

- `styles.css`: the heading colour changed from brick red to green at the user's request. `--heading` is now `#2e7d32` in light mode and `#5fbf7a` in dark mode. This change comes after the first push and isn't on GitHub yet.
- Git: the project is now a git repository on branch `main`, pushed to https://github.com/tanclangela-ui/todo20261121 at the user's request. The commit author (name and email) is set in this repository only, not globally.
- `.gitignore`: added. It excludes `.claude/`, which only holds the machine-specific launch config pointing to a temporary folder.

### Not verified
- The heading and the form were checked in the browser pane in light mode at desktop width and at 360px wide, and adding a task works. Not checked: dark mode, `mockup.html` itself, or editing an existing task (when the Cancel button also shows on line 1).
