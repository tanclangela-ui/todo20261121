// ===== To-Do Tracker =====
// Everything is saved in this browser's localStorage. Use "Export backup" to keep a copy.

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };
const STATUS_LABELS = { todo: 'To do', progress: 'In progress', waiting: 'Waiting', done: 'Done' };
const REPEAT_LABELS = { daily: 'Repeats daily', weekly: 'Repeats weekly', monthly: 'Repeats monthly' };

const $ = id => document.getElementById(id);
const form = $('item-form');
const submitBtn = $('submit-btn');
const cancelBtn = $('cancel-btn');

// Demo mode (open index.html?demo, used by mockup.html): shows sample items and saves
// nothing, so it never touches your real list. Add &theme=dark or &theme=light to pick a theme.
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
if (DEMO && ['dark', 'light'].includes(params.get('theme'))) {
  document.documentElement.dataset.theme = params.get('theme');
}
if (DEMO) document.documentElement.classList.add('demo'); // hides scrollbars, like a phone

let items = load();
let editId = null;           // id of the item being edited, or null when adding
let sortBy = readPref('sortBy', 'manual');
let personFilter = 'all';

// ---------- Saving and loading ----------
// If storage is blocked (e.g. some private windows), the app still works but won't remember items.
function readPref(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
}
function writePref(key, value) {
  if (DEMO) return;
  try { localStorage.setItem(key, value); } catch (e) {}
}
function load() {
  if (DEMO) return upgrade(demoItems());
  let raw = [];
  try { raw = JSON.parse(localStorage.getItem('items') || '[]'); } catch (e) {}
  return upgrade(raw);
}
function save() {
  if (DEMO) return;
  try { localStorage.setItem('items', JSON.stringify(items)); } catch (e) {}
}

// Sample list for demo mode. Deadlines are relative to today so the colours always show.
function demoItems() {
  const inDays = n => { const d = todayDate(); d.setDate(d.getDate() + n); return toISODate(d); };
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  return [
    { item: 'Send quarterly report', priority: 'High', deadline: inDays(-2), requestedBy: 'Alex',
      status: 'progress', notes: 'Include Q3 numbers, CC finance' },
    { item: 'Prepare client slides', priority: 'High', deadline: inDays(0), requestedBy: 'Priya' },
    { item: 'Weekly team update', priority: 'Medium', deadline: inDays(1), requestedBy: 'Jo', repeat: 'weekly' },
    { item: 'Book venue for offsite', priority: 'Medium', deadline: inDays(6), requestedBy: 'Sam',
      status: 'waiting', notes: 'Waiting on headcount' },
    { item: 'Order printer ink', priority: 'Low', deadline: inDays(18), requestedBy: 'Alex' },
    { item: 'Renew software licences', priority: 'Low', deadline: inDays(-1), requestedBy: 'Priya',
      status: 'done', doneAt: yesterday }
  ];
}

// Brings items from older versions of the app (or an imported file) up to the current shape.
function upgrade(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(it => it && typeof it.item === 'string').map((it, i) => ({
    id: it.id || newId(),
    item: it.item,
    priority: PRIORITY_RANK[it.priority] !== undefined ? it.priority : 'Medium',
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(it.deadline || '') ? it.deadline : '',
    requestedBy: it.requestedBy || '',
    notes: it.notes || '',
    repeat: REPEAT_LABELS[it.repeat] ? it.repeat : '',
    status: STATUS_LABELS[it.status] ? it.status : (it.done ? 'done' : 'todo'),
    doneAt: it.doneAt || (it.done ? new Date().toISOString() : null),
    createdAt: it.createdAt || new Date().toISOString(),
    order: typeof it.order === 'number' ? it.order : i,
    nextId: it.nextId || null
  }));
}
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function nextOrder() {
  return items.reduce((max, it) => Math.max(max, it.order), -1) + 1;
}

// ---------- Dates ----------
function todayDate() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function toISODate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function daysFromToday(s) { return Math.round((parseDate(s) - todayDate()) / 86400000); }
function shortDate(d) {
  const opts = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString(undefined, opts);
}
function dueHint(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days < 0) return `${-days} days overdue`;
  if (days < 7) return `In ${days} days`;
  return '';
}
// Next deadline for a repeating item: one step after its deadline (or today), never in the past.
function nextDeadline(it) {
  const d = it.deadline ? parseDate(it.deadline) : todayDate();
  const today = todayDate();
  do {
    if (it.repeat === 'daily') d.setDate(d.getDate() + 1);
    else if (it.repeat === 'weekly') d.setDate(d.getDate() + 7);
    else {
      const day = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, lastDay)); // e.g. 31 Jan -> 28 Feb
    }
  } while (d < today);
  return toISODate(d);
}

// ---------- Pop-up message (with optional Undo) ----------
let messageTimer;
function showMessage(text, action) {
  const box = $('message');
  box.replaceChildren(el('span', '', text));
  if (action) {
    box.appendChild(button(action.label, '', null, () => { hideMessage(); action.run(); }));
  }
  box.classList.add('show');
  clearTimeout(messageTimer);
  messageTimer = setTimeout(hideMessage, action ? 7000 : 4000);
}
function hideMessage() { $('message').classList.remove('show'); }

// ---------- Actions on items ----------
function markDone(it) {
  it.status = 'done';
  it.doneAt = new Date().toISOString();
  let msg = `"${it.item}" is done!`;
  if (it.repeat) {
    // Repeating item: add the next one to the list straight away.
    const next = {
      ...it, id: newId(), status: 'todo', doneAt: null, nextId: null,
      deadline: nextDeadline(it), createdAt: new Date().toISOString(), order: nextOrder()
    };
    items.push(next);
    it.nextId = next.id;
    msg += ` Next one due ${shortDate(parseDate(next.deadline))}.`;
  }
  save();
  render();
  showMessage(msg);
}

function reopen(it) {
  // If marking done created the next repeat and it hasn't been started, take it away again.
  const next = it.nextId && items.find(x => x.id === it.nextId);
  if (next && next.status === 'todo') items = items.filter(x => x !== next);
  it.nextId = null;
  it.doneAt = null;
  it.status = 'todo';
}

function setStatus(it, status) {
  if (status === it.status) return;
  if (status === 'done') return markDone(it);
  if (it.status === 'done') reopen(it);
  it.status = status;
  save();
  render();
}

function deleteItem(it) {
  items = items.filter(x => x !== it);
  if (editId === it.id) resetForm();
  save();
  render();
  showMessage(`Deleted "${it.item}".`, {
    label: 'Undo',
    run: () => { items.push(it); save(); render(); showMessage(`"${it.item}" is back.`); }
  });
}

function startEdit(it) {
  $('item').value = it.item;
  $('priority').value = it.priority;
  $('deadline').value = it.deadline;
  $('requested-by').value = it.requestedBy;
  $('repeat').value = it.repeat;
  $('notes').value = it.notes;
  editId = it.id;
  submitBtn.textContent = 'Save';
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'center' }); // so phones see the form
  $('item').focus({ preventScroll: true });
}

function resetForm() {
  form.reset();
  editId = null;
  submitBtn.textContent = 'Add';
  cancelBtn.hidden = true;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    item: $('item').value.trim(),
    priority: $('priority').value,
    deadline: $('deadline').value,
    requestedBy: $('requested-by').value.trim(),
    repeat: $('repeat').value,
    notes: $('notes').value.trim()
  };
  if (!data.item) return;
  const existing = editId && items.find(x => x.id === editId);
  if (existing) Object.assign(existing, data); // keeps status, dates and order
  else items.push({
    ...data, id: newId(), status: 'todo', doneAt: null, nextId: null,
    createdAt: new Date().toISOString(), order: nextOrder()
  });
  save();
  render();
  resetForm();
});
cancelBtn.addEventListener('click', resetForm);

// ---------- Sorting and filtering ----------
function byName(a, b) {
  // Alphabetical, ignoring case; items with no name go last.
  if (!a) return b ? 1 : 0;
  if (!b) return -1;
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}
function compare(a, b) {
  const byDeadline = () => (a.deadline || '9999').localeCompare(b.deadline || '9999');
  const byPriority = () => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  switch (sortBy) {
    case 'priority': return byPriority() || byDeadline();
    case 'deadline': return byDeadline() || byPriority();
    case 'person': return byName(a.requestedBy, b.requestedBy) || byDeadline();
    case 'newest': return b.createdAt.localeCompare(a.createdAt);
    default: return a.order - b.order; // "My order" (drag to change)
  }
}
// Open items in the chosen order, then done items (most recently finished first).
function visibleItems() {
  const list = items.filter(it => personFilter === 'all' || it.requestedBy === personFilter);
  const open = list.filter(it => it.status !== 'done').sort(compare);
  const done = list.filter(it => it.status === 'done')
    .sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
  return { open, done };
}

$('sort-by').value = sortBy;
if (!$('sort-by').value) { sortBy = 'manual'; $('sort-by').value = sortBy; }
$('sort-by').addEventListener('change', e => {
  sortBy = e.target.value;
  writePref('sortBy', sortBy);
  render();
});
$('person-filter').addEventListener('change', e => {
  personFilter = e.target.value;
  render();
});

// Fills the "Requested by" suggestions and the "Show" filter with names used so far.
function refreshPeople() {
  const names = [...new Set(items.map(it => it.requestedBy).filter(Boolean))].sort(byName);
  $('requesters').replaceChildren(...names.map(n => { const o = el('option'); o.value = n; return o; }));
  if (personFilter !== 'all' && !names.includes(personFilter)) personFilter = 'all';
  const sel = $('person-filter');
  sel.replaceChildren(new Option('Everyone', 'all'), ...names.map(n => new Option(n, n)));
  sel.value = personFilter;
}

// ---------- Drawing the list ----------
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text; // textContent avoids HTML injection
  return e;
}
// `tip` is shown on hover and read by screen readers (used for the icon buttons).
function button(label, className, tip, onClick) {
  const b = el('button', className, label);
  b.type = 'button';
  if (tip) { b.title = tip; b.setAttribute('aria-label', tip); }
  b.addEventListener('click', onClick);
  return b;
}
function cell(className, label) {
  const td = el('td', className);
  if (label) td.dataset.label = label; // shown as a small label on phones
  return td;
}

function renderCounter(open, done) {
  const overdue = open.filter(it => it.deadline && daysFromToday(it.deadline) < 0).length;
  const parts = [
    [open.length, 'open', ''],
    [overdue, 'overdue', 'overdue'],
    [open.filter(it => it.status === 'progress').length, 'in progress', ''],
    [open.filter(it => it.status === 'waiting').length, 'waiting', ''],
    [done.length, 'done', '']
  ];
  const counter = $('counter');
  counter.replaceChildren();
  parts.forEach(([n, label, cls], i) => {
    if (i > 0 && n === 0) return; // always show "open", hide other zero counts
    const span = el('span', 'count ' + cls);
    span.append(el('b', '', String(n)), ' ' + label);
    counter.appendChild(span);
  });
}

function buildRow(it) {
  const isDone = it.status === 'done';
  const row = el('tr', isDone ? 'done' : '');
  row.dataset.id = it.id;

  // Drag handle
  const handleCell = cell('handle-cell');
  if (!isDone) {
    const handle = el('span', 'handle', '⠿');
    handle.title = 'Drag to reorder';
    handle.addEventListener('pointerdown', e => startDrag(e, row, handle));
    handleCell.appendChild(handle);
  }
  row.appendChild(handleCell);

  // Item name, notes, and repeat / done-date info
  const titleCell = cell('title');
  titleCell.appendChild(el('div', 'item-name', it.item));
  if (it.notes) titleCell.appendChild(el('div', 'notes', it.notes));
  const meta = [];
  if (it.repeat) meta.push('🔁 ' + REPEAT_LABELS[it.repeat]);
  if (isDone && it.doneAt) meta.push('✔ Done ' + shortDate(new Date(it.doneAt)));
  if (meta.length) titleCell.appendChild(el('div', 'meta', meta.join(' · ')));
  row.appendChild(titleCell);

  // Priority pill
  const priorityCell = cell('', 'Priority');
  priorityCell.appendChild(el('span', 'badge ' + it.priority.toLowerCase(), it.priority));
  row.appendChild(priorityCell);

  // Status picker
  const statusCell = cell('', 'Status');
  const status = el('select', 'status-select st-' + it.status);
  status.setAttribute('aria-label', 'Status');
  for (const [value, label] of Object.entries(STATUS_LABELS)) status.appendChild(new Option(label, value));
  status.value = it.status;
  status.addEventListener('change', () => setStatus(it, status.value));
  statusCell.appendChild(status);
  row.appendChild(statusCell);

  // Deadline, coloured when close or overdue
  const deadlineCell = cell('deadline-cell', 'Deadline');
  if (it.deadline) {
    const days = daysFromToday(it.deadline);
    const due = el('span', 'due');
    if (!isDone && days < 0) due.classList.add('overdue');
    else if (!isDone && days <= 1) due.classList.add('soon');
    due.appendChild(el('span', '', shortDate(parseDate(it.deadline))));
    const hint = isDone ? '' : dueHint(days);
    if (hint) due.appendChild(el('small', '', hint));
    deadlineCell.appendChild(due);
  } else {
    deadlineCell.classList.add('blank');
  }
  row.appendChild(deadlineCell);

  // Requested by
  const requestedCell = cell('req', 'Requested by');
  requestedCell.textContent = it.requestedBy;
  if (!it.requestedBy) requestedCell.classList.add('blank');
  row.appendChild(requestedCell);

  // Buttons
  const actions = cell('actions');
  actions.appendChild(button(isDone ? 'Undo' : 'Done', 'done-btn', null, () => {
    if (!isDone) return markDone(it);
    reopen(it);
    save();
    render();
    showMessage(`"${it.item}" is back on the list.`);
  }));
  actions.appendChild(button('✏️', '', 'Edit', () => startEdit(it)));
  actions.appendChild(button('🗑️', '', 'Delete', () => deleteItem(it)));
  row.appendChild(actions);

  return row;
}

function render() {
  refreshPeople();
  const { open, done } = visibleItems();
  renderCounter(open, done);
  $('item-table').classList.toggle('no-drag', sortBy !== 'manual');

  const list = $('item-list');
  list.replaceChildren();
  if (!open.length && !done.length) {
    const td = el('td', 'empty', 'Nothing to do yet. Add your first item above.');
    td.colSpan = 7;
    const tr = el('tr');
    tr.appendChild(td);
    list.appendChild(tr);
    return;
  }
  [...open, ...done].forEach(it => list.appendChild(buildRow(it)));
}

// ---------- Drag to reorder (mouse and touch) ----------
function startDrag(e, row, handle) {
  if (sortBy !== 'manual') return;
  e.preventDefault();
  row.classList.add('dragging');
  // Listen on the whole page: moving the row in the page makes the browser drop
  // events aimed at the handle itself, which would stop the drag halfway.

  const move = ev => {
    const others = [...$('item-list').querySelectorAll('tr[data-id]:not(.done):not(.dragging)')];
    const before = others.find(r => {
      const box = r.getBoundingClientRect();
      return ev.clientY < box.top + box.height / 2;
    });
    if (before) before.before(row);
    else if (others.length) others[others.length - 1].after(row);
  };
  const end = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', end);
    document.removeEventListener('pointercancel', end);
    row.classList.remove('dragging');
    // Give the dragged items their new positions, reusing their existing order numbers.
    const moved = [...$('item-list').querySelectorAll('tr[data-id]:not(.done)')]
      .map(r => items.find(x => x.id === r.dataset.id));
    const slots = moved.map(x => x.order).sort((a, b) => a - b);
    moved.forEach((x, i) => { x.order = slots[i]; });
    save();
    render();
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
}

// ---------- Backup: export / import / CSV ----------
function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = el('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('export-json').addEventListener('click', () => {
  download(`todo-backup-${toISODate(new Date())}.json`, JSON.stringify(items, null, 2), 'application/json');
  showMessage(`Backup saved (${items.length} item${items.length === 1 ? '' : 's'}).`);
});

function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheets treating text as a formula
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
$('export-csv').addEventListener('click', () => {
  const header = ['Item', 'Priority', 'Status', 'Deadline', 'Requested by', 'Repeat', 'Notes', 'Created', 'Done on'];
  const rows = items.map(it => [
    it.item, it.priority, STATUS_LABELS[it.status], it.deadline, it.requestedBy,
    it.repeat, it.notes, toISODate(new Date(it.createdAt)), it.doneAt ? toISODate(new Date(it.doneAt)) : ''
  ]);
  const csv = [header, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
  download(`todo-list-${toISODate(new Date())}.csv`, '﻿' + csv, 'text/csv'); // ﻿ helps Excel read accents
});

$('import-btn').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  let data;
  try { data = JSON.parse(await file.text()); } catch (err) {
    showMessage("That file isn't a To-Do Tracker backup.");
    return;
  }
  const imported = upgrade(data);
  if (!imported.length) { showMessage('No items found in that file.'); return; }
  const count = n => `${n} item${n === 1 ? '' : 's'}`;
  if (!confirm(`Replace your current list (${count(items.length)}) with ${count(imported.length)} from the backup?`)) return;
  const previous = items;
  items = imported;
  resetForm();
  save();
  render();
  showMessage(`Imported ${count(imported.length)}.`, {
    label: 'Undo',
    run: () => { items = previous; save(); render(); }
  });
});

// ---------- Light / dark mode toggle ----------
// Follows the device setting until the user taps the toggle; their choice is then remembered.
const themeBtn = $('theme-toggle');
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function isDark() {
  const chosen = document.documentElement.dataset.theme;
  return chosen ? chosen === 'dark' : darkQuery.matches;
}
function updateThemeButton() {
  const dark = isDark();
  themeBtn.textContent = dark ? '☀️' : '🌙';
  const tip = dark ? 'Switch to light mode' : 'Switch to dark mode';
  themeBtn.title = tip;
  themeBtn.setAttribute('aria-label', tip);
}
themeBtn.addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  writePref('theme', next);
  updateThemeButton();
});
darkQuery.addEventListener('change', updateThemeButton);

updateThemeButton();
render();
// Demo mode with &view=list starts scrolled down to the list instead of the form.
// (window.scrollTo rather than scrollIntoView, so the mockup page around it doesn't scroll too.)
if (DEMO && params.get('view') === 'list') {
  window.scrollTo(0, document.querySelector('.toolbar').getBoundingClientRect().top + window.scrollY - 8);
}
