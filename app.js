/* ---------------------------------------------------
   LIEBREEXPRESS – APP.JS
   Versión limpia, corregida y compatible con GitHub Pages
---------------------------------------------------- */

/* -----------------------------
   CONFIG GLOBAL + API ENDPOINT
------------------------------*/

const API_URL =
  "https://script.google.com/macros/s/AKfycbwRLQVPVPbG6sDNGeXpTD0uh2RAyWBzKYnT-HHfUPsh7FgKyMvWDwwYOwYm70CXxEsY/exec";

let AUTH_TOKEN = null;

/* -----------------------------
   HELPERS BÁSICOS
------------------------------*/
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

/* -----------------------------
   FETCH UNIVERSAL A TU BACKEND
------------------------------*/
async function apiRequest(action, payload = {}) {
  const body = {
    action,
    ...payload,
    authToken: AUTH_TOKEN,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return await response.json();
  } catch (err) {
    console.error("❌ Error en fetch:", err);
    showGlobalAlert("Error de conexión con el servidor.");
    return { status: "error" };
  }
}

/* -----------------------------
   GLOBAL ALERT (MODAL)
------------------------------*/
function showGlobalAlert(message, destructive = false) {
  const overlay = qs("#global-alert-overlay");
  const msg = qs("#global-alert-message");
  const btn = qs("#global-alert-btn-confirm");

  msg.textContent = message;
  btn.classList.toggle("btn-destructive", destructive);
  overlay.classList.remove("hidden");

  return new Promise((resolve) => {
    btn.onclick = () => {
      overlay.classList.add("hidden");
      resolve(true);
    };
  });
}

/* -----------------------------
   LOGIN + AUTOLOGIN
------------------------------*/

async function tryLogin(password) {
  const res = await apiRequest("login", { password });

  if (res.status === "success") {
    AUTH_TOKEN = res.authToken;
    localStorage.setItem("authToken", AUTH_TOKEN);

    goToPage("main-menu");
    loadAllInitialData();
  } else {
    showGlobalAlert("Contraseña incorrecta.");
  }
}

// botón "Entrar"
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn =
    qs("#login-btn") ||
    qs("#login-button") ||
    qs("#login-form button") ||
    null;

  const passwordInput =
    qs("#login-password") ||
    qs("#password-input") ||
    qs("input[name='password']");

  if (loginBtn && passwordInput) {
    loginBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const pass = passwordInput.value.trim();
      if (!pass) return showGlobalAlert("Introduce una contraseña.");
      tryLogin(pass);
    });
  }
});

// AUTOLOGIN al entrar
window.addEventListener("load", async () => {
  const saved = localStorage.getItem("authToken");
  if (!saved) return;

  AUTH_TOKEN = saved;
  const res = await apiRequest("getVisitCount");

  if (res.status === "success") {
    goToPage("main-menu");
    loadAllInitialData();
  }
});

/* -----------------------------
   NAVEGACIÓN ENTRE PÁGINAS
------------------------------*/
function goToPage(pageId) {
  qsa(".page-content").forEach((p) => p.classList.add("hidden"));

  const page = qs(`#page-${pageId}`);
  if (page) page.classList.remove("hidden");
}

/* Botones del menú principal */
document.addEventListener("DOMContentLoaded", () => {
  const links = {
    "#btn-operativas": "operativas",
    "#btn-vor": "operativa-vor",
    "#btn-stock": "stock",
    "#btn-gestion-flota": "gestionar-flota",
    "#btn-historial": "historial",
    "#btn-sugerencias": "sugerencias",
  };

  for (const sel in links) {
    const el = qs(sel);
    if (el) el.onclick = () => goToPage(links[sel]);
  }
});

/* -----------------------------
   CARGA INICIAL COMPLETA
------------------------------*/
async function loadAllInitialData() {
  await loadFleet();
  await loadNotesHistory();
  await loadTireHistory();
  await loadRentalHistory();
  await loadAccidentHistory();
  await loadStock();
}

/* ---------------------------------------------------
   FIN DE LA PARTE 1
---------------------------------------------------- */
/* ---------------------------------------------------
   PARTE 2 — CARGA DE DATOS, RENDERIZADO Y GUANTERA
---------------------------------------------------- */

/* Estado local */
let VEHICLES = [];
let VAN_NOTES = {};       
let STOCK = [];           
let PENDING_ITEMS = {};   

/* Helpers extra */
function up(s) { return s ? s.toString().toUpperCase() : ""; }
function formatPlate(raw) {
  if (!raw) return "—";
  const t = raw.replace(/\s+/g, "");
  return t.length === 7 ? t.slice(0, 4) + " " + t.slice(4) : raw;
}

/* ---------------------------------------------------
   CARGA DE FLOTAS
---------------------------------------------------- */
async function loadFleet() {
  const res = await apiRequest("getVehicles");

  if (res.status === "success" && Array.isArray(res.data)) {
    VEHICLES = res.data;
    renderOperativas();
    renderVOR();
    renderVehicleSelection();
    renderGuanteraList();
  }
}

/* ---------------------------------------------------
   CARGA DE NOTAS
---------------------------------------------------- */
async function loadNotesHistory() {
  const res = await apiRequest("getVanNotesHistory");
  if (res.status !== "success" || !Array.isArray(res.data)) return;

  VAN_NOTES = {};

  res.data.forEach((entry) => {
    const mat = up(entry.matricula || "UNKNOWN");
    if (!VAN_NOTES[mat]) VAN_NOTES[mat] = [];
    VAN_NOTES[mat].push(entry);
  });

  renderHistorialResumen();
}

/* ---------------------------------------------------
   CARGA DE STOCK
---------------------------------------------------- */
async function loadStock() {
  const res = await apiRequest("getStock");
  if (res.status === "success" && Array.isArray(res.data)) {
    STOCK = res.data;
    renderStock();
  }
}

/* ---------------------------------------------------
   OPERATIVAS — LISTA PRINCIPAL
---------------------------------------------------- */
function renderOperativas() {
  const container = qs("#operativas-list");
  if (!container) return;
  container.innerHTML = "";

  VEHICLES.forEach((v) => {
    const div = document.createElement("div");
    div.className = "van-card van-card-operativa clickable-card";
    div.dataset.matricula = v.matricula;

    div.innerHTML = `
      <div class="font-bold">${formatPlate(v.matricula)}</div>
      <div class="text-sm text-muted">${v.marca || ""}</div>
      <div class="text-xs mt-1">VIN: ${v.vin || "—"}</div>
    `;

    div.onclick = () => {
      goToPage("guantera");
      openGuantera(v.matricula);
    };

    container.appendChild(div);
  });
}

/* ---------------------------------------------------
   VOR — LISTA
---------------------------------------------------- */
function renderVOR() {
  const container = qs("#vor-vehicle-list");
  if (!container) return;

  container.innerHTML = "";

  VEHICLES.filter((v) => up(v.estado) === "VOR").forEach((v) => {
    const div = document.createElement("div");
    div.className = "van-card vor-van-card clickable-card vor-highlight";
    div.dataset.matricula = v.matricula;

    div.innerHTML = `
      <div class="font-bold">${formatPlate(v.matricula)}</div>
      <div class="text-sm text-muted">${v.marca || ""}</div>
      <div class="text-xs mt-1">VIN: ${v.vin || "—"}</div>
    `;

    div.onclick = () => {
      goToPage("guantera");
      openGuantera(v.matricula);
    };

    container.appendChild(div);
  });
}

/* ---------------------------------------------------
   SELECCIÓN DE VEHÍCULO (CREAR TAREAS)
---------------------------------------------------- */
function renderVehicleSelection() {
  const container = qs("#van-list-container");
  if (!container) return;

  container.innerHTML = "";

  VEHICLES.forEach((v) => {
    const m = v.matricula;

    const card = document.createElement("div");
    card.className = "van-card van-selection-card";
    card.dataset.matricula = m;

    card.innerHTML = `
      <div class="font-bold">${formatPlate(m)}</div>
      <div class="text-sm text-muted mb-2">${v.marca || ""}</div>

      <label class="text-sm">Nota:</label>
      <textarea class="w-full p-2 rounded bg-slate-800/70" id="note-${m}" rows="2"></textarea>

      <label class="text-sm mt-2 block">Recambios (ENTER para añadir):</label>
      <input class="w-full recambios-input p-2 rounded bg-slate-800/70"
             data-matricula="${m}" id="recambios-${m}" placeholder="Escribe recambio...">

      <div class="flex gap-2 mt-2" id="tags-${m}"></div>

      <div class="flex gap-2 mt-3">
        <button class="btn save-note" data-m="${m}">Guardar</button>
        <button class="btn open-guantera" data-m="${m}">Guantera</button>
      </div>
    `;

    // restaurar items pendientes
    if (!PENDING_ITEMS[m]) PENDING_ITEMS[m] = [];
    refreshTags(m);

    container.appendChild(card);
  });

  // Guardar tarea
  qsa(".save-note").forEach((btn) => {
    btn.onclick = async () => {
      const m = btn.dataset.m;
      await saveNote(m);
    };
  });

  // Entrar a guantera
  qsa(".open-guantera").forEach((btn) => {
    btn.onclick = () => {
      const m = btn.dataset.m;
      goToPage("guantera");
      openGuantera(m);
    };
  });

  // Autocompletar recambios con ENTER
  qsa(".recambios-input").forEach((input) => {
    input.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      ev.preventDefault();

      const m = input.dataset.matricula;
      const val = input.value.trim().toLowerCase();

      const match = STOCK.find((s) => s.nombre.toLowerCase() === val);

      if (!match) return showGlobalAlert("Recambio no encontrado.");
      if (parseInt(match.cantidad) <= 0)
        return showGlobalAlert("Sin stock disponible.");

      PENDING_ITEMS[m].push(match.nombre);
      input.value = "";
      refreshTags(m);
      savePending();
    });
  });
}

/* ---------------------------------------------------
   TAGS DE RECAMBIOS A DESCONTAR
---------------------------------------------------- */
function refreshTags(m) {
  const container = qs(`#tags-${m}`);
  if (!container) return;
  container.innerHTML = "";

  (PENDING_ITEMS[m] || []).forEach((name, index) => {
    const tag = document.createElement("span");
    tag.className = "badge-warning";
    tag.innerHTML = `${name} (-1) <button class="remove-tag" data-m="${m}" data-i="${index}">×</button>`;
    container.appendChild(tag);
  });

  qsa(`#tags-${m} .remove-tag`).forEach((btn) => {
    btn.onclick = () => {
      const mat = btn.dataset.m;
      const idx = btn.dataset.i;
      PENDING_ITEMS[mat].splice(idx, 1);
      savePending();
      refreshTags(mat);
    };
  });
}

function savePending() {
  localStorage.setItem("pendingItems", JSON.stringify(PENDING_ITEMS));
}

function loadPending() {
  try {
    PENDING_ITEMS = JSON.parse(localStorage.getItem("pendingItems")) || {};
  } catch {
    PENDING_ITEMS = {};
  }
}
loadPending();

/* ---------------------------------------------------
   GUARDAR NOTA
---------------------------------------------------- */
async function saveNote(matricula) {
  const note = qs(`#note-${matricula}`).value.trim();
  const recambios = qs(`#recambios-${matricula}`).value.trim();
  const usedStock = PENDING_ITEMS[matricula] || [];

  if (!note) return showGlobalAlert("La nota es obligatoria.");

  const res = await apiRequest("saveVanNote", {
    matricula,
    note,
    recambios,
    usedStockItems: usedStock,
  });

  if (res.status === "success") {
    showGlobalAlert("Tarea guardada.");
    PENDING_ITEMS[matricula] = [];
    savePending();
    refreshTags(matricula);
    await loadNotesHistory();
  }
}

/* ---------------------------------------------------
   GUANTERA → HISTORIAL del vehículo
---------------------------------------------------- */
function renderGuanteraList() {
  const container = qs("#guantera-van-list-container");
  if (!container) return;
  container.innerHTML = "";

  VEHICLES.forEach((v) => {
    const card = document.createElement("div");
    card.className = "guantera-card guantera-clickable-card";
    card.dataset.matricula = v.matricula;

    card.innerHTML = `
      <div class="font-semibold">${formatPlate(v.matricula)}</div>
      <div class="text-sm text-muted">${v.marca}</div>
    `;

    card.onclick = () => {
      goToPage("guantera");
      openGuantera(v.matricula);
    };

    container.appendChild(card);
  });
}

function openGuantera(matricula) {
  qs("#guantera-detail-title").textContent =
    "Guantera - " + formatPlate(matricula);

  const detail = qs("#guantera-detail-content");
  detail.innerHTML = "";

  const list = VAN_NOTES[up(matricula)] || [];

  if (!list.length) {
    detail.innerHTML = `<div class="text-muted">No hay tareas registradas.</div>`;
    return;
  }

  list.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "history-entry-card p-2 rounded border mt-2 flex justify-between items-center";
    const completed =
      (entry.estado || "").toLowerCase() === "completado";

    card.innerHTML = `
      <div class="mr-3">
        <div class="font-semibold">${entry.timestamp}</div>
        <div class="text-sm text-muted">${entry.nota || ""}</div>
      </div>

      <div class="flex gap-2">
        ${
          completed
            ? `<span class="badge-ok">Completado</span>`
            : `<button class="btn-history-complete" data-ts="${entry.timestamp}" data-m="${matricula}">Completar</button>`
        }
        <button class="btn-history-delete" data-ts="${entry.timestamp}" data-m="${matricula}">Borrar</button>
      </div>
    `;

    detail.appendChild(card);
  });

  // Completar
  qsa(".btn-history-complete").forEach((btn) => {
    btn.onclick = async () => {
      const ts = btn.dataset.ts;
      const mat = btn.dataset.m;
      await apiRequest("updateNoteStatus", {
        timestamp: ts,
        newStatus: "Completado",
      });

      await loadNotesHistory();
      await loadStock();
      openGuantera(mat);
    };
  });

  // Borrar
  qsa(".btn-history-delete").forEach((btn) => {
    btn.onclick = async () => {
      const ts = btn.dataset.ts;
      const mat = btn.dataset.m;

      if (!confirm("¿Eliminar entrada?")) return;

      await apiRequest("deleteHistoryEntry", {
        sheetName: "Notas",
        timestamp: ts,
        matricula: mat,
      });

      await loadNotesHistory();
      openGuantera(mat);
    };
  });
}

/* ---------------------------------------------------
   FIN DE LA PARTE 2
---------------------------------------------------- */
