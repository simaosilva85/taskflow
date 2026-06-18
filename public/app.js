const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const prioritySelect = document.getElementById("task-priority");
const list = document.getElementById("task-list");
const empty = document.getElementById("empty");
const stats = document.getElementById("stats");
const errorBox = document.getElementById("error");
const filters = document.querySelectorAll(".filter");
const counts = {
  all: document.querySelector('[data-count="all"]'),
  todo: document.querySelector('[data-count="todo"]'),
  done: document.querySelector('[data-count="done"]'),
};
const health = document.getElementById("health");
const healthLabel = health.querySelector(".health__label");

const PRIORITY_LABELS = { basse: "Basse", normale: "Normale", haute: "Haute" };

let allTasks = [];
let currentFilter = "all";

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  clearTimeout(showError._t);
  showError._t = setTimeout(() => (errorBox.hidden = true), 4000);
}

// Date relative en français, sans dépendance externe.
function relativeDate(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function visibleTasks() {
  if (currentFilter === "todo") return allTasks.filter((t) => !t.done);
  if (currentFilter === "done") return allTasks.filter((t) => t.done);
  return allTasks;
}

function render() {
  const tasks = visibleTasks();
  list.innerHTML = "";
  empty.hidden = tasks.length > 0;

  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = `task${task.done ? " task--done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task__check";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", task.done ? "Marquer à faire" : "Marquer comme faite");
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const body = document.createElement("div");
    body.className = "task__body";

    const title = document.createElement("span");
    title.className = "task__title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task__meta";
    const badge = document.createElement("span");
    badge.className = `badge badge--${task.priority}`;
    badge.innerHTML = `<span class="badge__dot"></span>${PRIORITY_LABELS[task.priority]}`;
    const date = document.createElement("span");
    date.textContent = relativeDate(task.created_at);
    meta.append(badge, document.createTextNode("·"), date);

    body.append(title, meta);

    const del = document.createElement("button");
    del.className = "task__delete";
    del.setAttribute("aria-label", "Supprimer la tâche");
    del.textContent = "🗑";
    del.addEventListener("click", () => deleteTask(task.id));

    li.append(checkbox, body, del);
    list.appendChild(li);
  }

  const total = allTasks.length;
  const done = allTasks.filter((t) => t.done).length;
  counts.all.textContent = total;
  counts.todo.textContent = total - done;
  counts.done.textContent = done;
  stats.textContent = total === 0 ? "Aucune tâche" : `${total} tâche(s) · ${total - done} à faire`;
}

async function load() {
  try {
    allTasks = await api("/api/tasks");
    render();
  } catch (err) {
    showError(err.message);
  }
}

async function addTask(title, priority) {
  try {
    await api("/api/tasks", { method: "POST", body: JSON.stringify({ title, priority }) });
    await load();
  } catch (err) {
    showError(err.message);
  }
}

async function toggleTask(id) {
  try {
    await api(`/api/tasks/${id}`, { method: "PATCH" });
    await load();
  } catch (err) {
    showError(err.message);
  }
}

async function deleteTask(id) {
  try {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    await load();
  } catch (err) {
    showError(err.message);
  }
}

// Indicateur de disponibilité : sonde /health (la même URL que la supervision).
async function checkHealth() {
  try {
    const res = await fetch("/health");
    const ok = res.ok;
    health.classList.toggle("is-up", ok);
    health.classList.toggle("is-down", !ok);
    healthLabel.textContent = ok ? "En ligne" : "Indisponible";
  } catch {
    health.classList.remove("is-up");
    health.classList.add("is-down");
    healthLabel.textContent = "Indisponible";
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  addTask(title, prioritySelect.value);
  titleInput.value = "";
  titleInput.focus();
});

filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

load();
checkHealth();
setInterval(checkHealth, 30000);
