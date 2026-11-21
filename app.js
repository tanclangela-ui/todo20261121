// index.html?demo shows sample tasks and never touches your saved tasks (used by mockup.html)
const DEMO = new URLSearchParams(location.search).has("demo");
let tasks = DEMO ? demoTasks() : JSON.parse(localStorage.getItem("tasks") || "[]");
let filter = "all";
if (DEMO) document.documentElement.classList.add("demo");
let editingId = null;

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };
const $ = id => document.getElementById(id);

// Tasks saved by the first draft have no id/done/created fields
tasks = tasks.map((t, i) => ({ id: t.id || Date.now() + i, done: false, created: Date.now() + i, ...t }));

function save() {
  if (DEMO) return;
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function demoTasks() {
  const day = offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };
  return [
    { id: 1, created: 1, done: true, item: "Book team offsite venue", priority: "Low", deadline: day(19), requestedBy: "Jordan" },
    { id: 2, created: 2, done: false, item: "Update onboarding docs", priority: "Medium", deadline: "", requestedBy: "Priya" },
    { id: 3, created: 3, done: false, item: "Review design mockups", priority: "Medium", deadline: day(1), requestedBy: "Alex" },
    { id: 4, created: 4, done: false, item: "Send quarterly report", priority: "High", deadline: day(-2), requestedBy: "Maria" }
  ];
}

function todayString() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function deadlineInfo(task) {
  if (!task.deadline) return null;
  const days = Math.round((new Date(task.deadline) - new Date(todayString())) / 86400000);
  const label = new Date(task.deadline + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (task.done) return { text: label, cls: "" };
  if (days < 0) return { text: `Overdue · ${label}`, cls: "overdue" };
  if (days === 0) return { text: "Due today", cls: "soon" };
  if (days === 1) return { text: "Due tomorrow", cls: "soon" };
  return { text: label, cls: days <= 3 ? "soon" : "" };
}

function visibleTasks() {
  const query = $("search").value.trim().toLowerCase();
  const sort = $("sort").value;
  return tasks
    .filter(t => filter === "all" || (filter === "done" ? t.done : !t.done))
    .filter(t => !query || t.item.toLowerCase().includes(query) || (t.requestedBy || "").toLowerCase().includes(query))
    .sort((a, b) => {
      if (sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sort === "deadline") return (a.deadline || "9999").localeCompare(b.deadline || "9999");
      if (sort === "requestedBy") return (a.requestedBy || "~").localeCompare(b.requestedBy || "~");
      return b.created - a.created;
    });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderTask(task) {
  const li = el("li", `card task priority-${task.priority}${task.done ? " done" : ""}`);
  li.dataset.id = task.id;

  const check = el("input", "check");
  check.type = "checkbox";
  check.checked = task.done;
  check.title = task.done ? "Mark as not done" : "Mark as done";
  check.onchange = () => toggleDone(task.id);

  const body = el("div", "task-body");
  body.appendChild(el("div", "task-title", task.item));
  const meta = el("div", "meta");
  meta.appendChild(el("span", `badge ${task.priority}`, task.priority));
  const due = deadlineInfo(task);
  if (due) meta.appendChild(el("span", `badge ${due.cls}`, "📅 " + due.text));
  if (task.requestedBy) {
    const who = el("span", "badge");
    who.appendChild(el("span", "avatar", task.requestedBy[0].toUpperCase()));
    who.appendChild(document.createTextNode(task.requestedBy));
    meta.appendChild(who);
  }
  body.appendChild(meta);

  const actions = el("div", "actions");
  const editBtn = el("button", "icon-btn", "✎");
  editBtn.title = "Edit";
  editBtn.onclick = () => startEdit(task.id);
  const deleteBtn = el("button", "icon-btn delete", "✕");
  deleteBtn.title = "Delete";
  deleteBtn.onclick = () => deleteTask(task.id, li);
  actions.append(editBtn, deleteBtn);

  li.append(check, body, actions);
  return li;
}

function render() {
  const list = $("taskList");
  list.innerHTML = "";
  const shown = visibleTasks();
  shown.forEach(t => list.appendChild(renderTask(t)));
  $("empty").hidden = shown.length > 0;

  const done = tasks.filter(t => t.done).length;
  $("statActive").textContent = tasks.length - done;
  $("statDone").textContent = done;
  $("statOverdue").textContent = tasks.filter(t => !t.done && t.deadline && t.deadline < todayString()).length;
  $("progressBar").style.width = tasks.length ? `${(done / tasks.length) * 100}%` : "0";
}

function toggleDone(id) {
  const task = tasks.find(t => t.id === id);
  task.done = !task.done;
  save();
  render();
}

function deleteTask(id, li) {
  if (!confirm("Delete this task?")) return;
  li.classList.add("removing");
  setTimeout(() => {
    tasks = tasks.filter(t => t.id !== id);
    if (editingId === id) stopEdit();
    save();
    render();
  }, 200);
}

function startEdit(id) {
  const task = tasks.find(t => t.id === id);
  editingId = id;
  $("item").value = task.item;
  $("priority").value = task.priority;
  $("deadline").value = task.deadline;
  $("requestedBy").value = task.requestedBy;
  $("submitBtn").textContent = "Save changes";
  $("cancelEdit").hidden = false;
  $("taskForm").classList.add("editing");
  $("taskForm").scrollIntoView({ behavior: "smooth", block: "start" });
  $("item").focus();
}

function stopEdit() {
  editingId = null;
  $("taskForm").reset();
  $("deadline").value = todayString();
  $("submitBtn").textContent = "Add task";
  $("cancelEdit").hidden = true;
  $("taskForm").classList.remove("editing");
}

$("taskForm").addEventListener("submit", event => {
  event.preventDefault();
  const values = {
    item: $("item").value.trim(),
    priority: $("priority").value,
    deadline: $("deadline").value,
    requestedBy: $("requestedBy").value.trim()
  };
  if (!values.item) return;
  if (editingId) {
    Object.assign(tasks.find(t => t.id === editingId), values);
  } else {
    tasks.push({ id: Date.now(), done: false, created: Date.now(), ...values });
  }
  save();
  stopEdit();
  render();
  $("item").focus();
});

$("cancelEdit").onclick = stopEdit;

$("filters").addEventListener("click", event => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  filter = chip.dataset.filter;
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c === chip));
  render();
});

$("search").addEventListener("input", render);
$("sort").addEventListener("change", render);

$("today").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
$("deadline").value = todayString();
render();
