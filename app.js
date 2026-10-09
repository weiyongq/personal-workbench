/* ==========================================================
   个人工作台 - 交互逻辑
   数据全部保存在 localStorage，纯本地运行
   ========================================================== */

const $ = (sel) => document.querySelector(sel);
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("workbench_" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, val) {
    localStorage.setItem("workbench_" + key, JSON.stringify(val));
  },
};

/* ---------- 主题切换 ---------- */
const themeToggle = $("#themeToggle");
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  store.set("theme", theme);
}
applyTheme(store.get("theme", "light"));
themeToggle.addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme");
  applyTheme(cur === "dark" ? "light" : "dark");
});

/* ---------- 时钟与问候 ---------- */
const WEEKS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
function pad(n) { return String(n).padStart(2, "0"); }
function tickClock() {
  const now = new Date();
  $("#clock").textContent = pad(now.getHours()) + ":" + pad(now.getMinutes());
  $("#seconds").textContent = pad(now.getSeconds());
  $("#dateText").textContent = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`;
  $("#weekText").textContent = WEEKS[now.getDay()];
  const h = now.getHours();
  $("#greeting").textContent =
    h < 6 ? "夜深了，注意休息" : h < 12 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
}
tickClock();
setInterval(tickClock, 1000);

/* ---------- 每日一句 ---------- */
const MOTTOS = [
  "今天也要元气满满 ✨",
  "种一棵树最好的时间是十年前，其次是现在 🌱",
  "把大目标拆成小步骤，一步步来 🚀",
  "专注当下，一次只做一件事 🎯",
  "休息也是生产力的一部分 ☕",
  "日拱一卒，功不唐捐 ♟️",
];
$("#motto").textContent = MOTTOS[Math.floor(Math.random() * MOTTOS.length)];

/* ---------- 待办清单 ---------- */
let todos = store.get("todos", []); // { id, text, done }
let todoFilter = "all";

const todoList = $("#todoList");
function saveTodos() { store.set("todos", todos); }
function renderTodos() {
  const shown = todos.filter((t) =>
    todoFilter === "all" ? true : todoFilter === "done" ? t.done : !t.done
  );
  const activeCount = todos.filter((t) => !t.done).length;
  $("#todoCount").textContent = `${activeCount} 项未完成`;

  if (shown.length === 0) {
    todoList.innerHTML = `<li class="todo-empty">${
      todos.length === 0 ? "还没有待办事项，添加一条吧～" : "当前筛选下没有事项"
    }</li>`;
    return;
  }
  todoList.innerHTML = shown
    .map(
      (t) => `
      <li class="todo-item ${t.done ? "done" : ""}" data-id="${t.id}">
        <input type="checkbox" ${t.done ? "checked" : ""} />
        <span class="todo-text">${escapeHtml(t.text)}</span>
        <button class="todo-del" title="删除">✕</button>
      </li>`
    )
    .join("");
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

$("#todoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#todoInput");
  const text = input.value.trim();
  if (!text) return;
  todos.unshift({ id: Date.now(), text, done: false });
  input.value = "";
  saveTodos();
  renderTodos();
});

todoList.addEventListener("click", (e) => {
  const li = e.target.closest(".todo-item");
  if (!li) return;
  const id = Number(li.dataset.id);
  if (e.target.type === "checkbox") {
    const t = todos.find((t) => t.id === id);
    if (t) { t.done = !t.done; saveTodos(); renderTodos(); }
  } else if (e.target.classList.contains("todo-del")) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    renderTodos();
  }
});

document.querySelectorAll("[data-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    todoFilter = btn.dataset.filter;
    renderTodos();
  });
});

$("#clearDone").addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  saveTodos();
  renderTodos();
});
renderTodos();

/* ---------- 番茄钟 ---------- */
const POMO_MODES = { work: 25 * 60, break: 5 * 60 };
let pomoMode = "work";
let pomoLeft = POMO_MODES.work;
let pomoTimer = null;
let pomoRound = 1;

function renderPomo() {
  $("#pomoTime").textContent = `${pad(Math.floor(pomoLeft / 60))}:${pad(pomoLeft % 60)}`;
  $("#pomoRound").textContent = `第 ${pomoRound} 轮`;
  $("#pomoStart").textContent = pomoTimer ? "暂停" : "开始";
}
function stopPomo() { clearInterval(pomoTimer); pomoTimer = null; }

$("#pomoStart").addEventListener("click", () => {
  if (pomoTimer) { stopPomo(); renderPomo(); return; }
  pomoTimer = setInterval(() => {
    pomoLeft--;
    if (pomoLeft <= 0) {
      stopPomo();
      if (pomoMode === "work") { pomoRound++; pomoMode = "break"; }
      else { pomoMode = "work"; }
      pomoLeft = POMO_MODES[pomoMode];
      document.querySelectorAll("[data-mode]").forEach((b) =>
        b.classList.toggle("active", b.dataset.mode === pomoMode)
      );
      alert(pomoMode === "break" ? "专注完成！休息 5 分钟 🍵" : "休息结束，继续加油 💪");
    }
    renderPomo();
  }, 1000);
  renderPomo();
});
$("#pomoReset").addEventListener("click", () => {
  stopPomo();
  pomoLeft = POMO_MODES[pomoMode];
  renderPomo();
});
document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    stopPomo();
    pomoMode = btn.dataset.mode;
    pomoLeft = POMO_MODES[pomoMode];
    document.querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderPomo();
  });
});
renderPomo();

/* ---------- 快捷链接 ---------- */
let links = store.get("links", [
  { name: "百度", url: "https://www.baidu.com", emoji: "🔍" },
  { name: "GitHub", url: "https://github.com", emoji: "🐙" },
  { name: "腾讯文档", url: "https://docs.qq.com", emoji: "📄" },
  { name: "哔哩哔哩", url: "https://www.bilibili.com", emoji: "📺" },
]);
function saveLinks() { store.set("links", links); }
function normalizeUrl(u) {
  if (!/^https?:\/\//i.test(u)) return "https://" + u;
  return u;
}
function renderLinks() {
  const grid = $("#linksGrid");
  if (links.length === 0) {
    grid.innerHTML = `<div class="links-empty">点击右上角 ＋ 添加常用网站</div>`;
    return;
  }
  grid.innerHTML = links
    .map(
      (l, i) => `
      <a class="link-card" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">
        <span class="link-emoji">${escapeHtml(l.emoji || "🔗")}</span>
        <span>${escapeHtml(l.name)}</span>
        <button class="link-del" data-index="${i}" title="删除">✕</button>
      </a>`
    )
    .join("");
}
$("#addLinkBtn").addEventListener("click", () => {
  const name = prompt("网站名称：");
  if (name === null) return;
  const url = prompt("网址（如 example.com）：");
  if (url === null || !url.trim()) return;
  const emoji = prompt("图标 emoji（可留空，默认 🔗）：") || "🔗";
  links.push({ name: name.trim() || url.trim(), url: normalizeUrl(url.trim()), emoji });
  saveLinks();
  renderLinks();
});
$("#linksGrid").addEventListener("click", (e) => {
  if (e.target.classList.contains("link-del")) {
    e.preventDefault();
    e.stopPropagation();
    links.splice(Number(e.target.dataset.index), 1);
    saveLinks();
    renderLinks();
  }
});
renderLinks();

/* ---------- 随手记（自动保存） ---------- */
const noteArea = $("#noteArea");
noteArea.value = store.get("note", "");
let noteTimer = null;
noteArea.addEventListener("input", () => {
  $("#noteSaved").textContent = "保存中…";
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    store.set("note", noteArea.value);
    $("#noteSaved").textContent = "已自动保存";
  }, 500);
});
