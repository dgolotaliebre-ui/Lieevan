// app.js - parte 1/3
// Reescrito modularmente. Une partes 1..N para crear app.js completo.

/* ---------- CONFIG ---------- */
const GAPS_URL = 'https://script.google.com/macros/s/AKfycbwEyozAk98y_r4Y3MZDYk5f6S-IguJSzMsUC2B069WTgJZKKg7AmJeTVob7c0NDKIZrtg/exec'; // Cambia por tu endpoint

/* ---------- ESTADO GLOBAL ---------- */
let authToken = null;
let vehicles = [];               // [{matricula, marca, vin, ...}]
let vanHistoryDataStore = {};    // { matricula: [entries] }
let stockDataStore = [];         // [{nombre, cantidad}]
let pendingStockDeductions = {}; // { matricula: [nombreItem,...] }

const placeholderImg = 'https://placehold.co/400x300/374151/E5E7EB?text=Sin+Imagen';

/* ---------- SELECTORES ---------- */
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const loginStatus = document.getElementById('login-status');

const appContainer = document.getElementById('app-container');
const pageContents = document.querySelectorAll('.page-content');
const navLinks = document.querySelectorAll('.nav-link');

const vanListContainer = document.getElementById('van-list-container');
const searchInput = document.getElementById('search-van');

const vorVehicleList = document.getElementById('vor-vehicle-list');

const guanteraListContainer = document.getElementById('guantera-van-list-container');
const guanteraDetailPage = document.getElementById('guantera-detail-page');
const guanteraDetailTitle = document.getElementById('guantera-detail-title');
const guanteraDetailContent = document.getElementById('guantera-detail-content');
const guanteraListPage = document.getElementById('guantera-list-page');
const btnBackToGuanteraList = document.getElementById('btn-back-to-guantera-list');

const stockListContainer = document.getElementById('stock-list-container');
const stockForm = document.getElementById('stock-form');
const stockNameInput = document.getElementById('stock-name');
const stockQuantityInput = document.getElementById('stock-quantity');
const stockSaveBtn = document.getElementById('stock-save-btn');
const searchStockInput = document.getElementById('search-stock');

const vansChoiceMenu = document.getElementById('vans-choice-menu');
const btnShowVanUpload = document.getElementById('btn-show-van-upload');
const btnShowVanGallery = document.getElementById('btn-show-van-gallery');
const btnShowStock = document.getElementById('btn-show-stock');

const vansSubpageUpload = document.getElementById('vans-subpage-upload');
const vansSubpageGallery = document.getElementById('vans-subpage-gallery');
const vansSubpageStock = document.getElementById('vans-subpage-stock');

const vanHistoryListContainer = document.getElementById('van-history-list-container');

/* ---------- UTILIDADES ---------- */
function capitalize(s) { if (!s) return ''; return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

function formatPlate(raw) {
  if (!raw) return '---';
  const s = raw.replace(/\s+/g, '');
  if (s.length === 7) return s.slice(0,4) + ' ' + s.slice(4);
  return raw;
}

function savePendingDeductionsToStorage() {
  try { localStorage.setItem('pendingStockDeductions', JSON.stringify(pendingStockDeductions || {})); } catch(e){}
}

function loadPendingDeductionsFromStorage() {
  try {
    const raw = localStorage.getItem('pendingStockDeductions');
    pendingStockDeductions = raw ? JSON.parse(raw) : {};
  } catch (e) { pendingStockDeductions = {}; }
}

function showLoginStatus(message, type = 'info') {
  if (!loginStatus) return;
  loginStatus.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600');
  loginStatus.textContent = message;
  if (type === 'success') loginStatus.classList.add('bg-green-600');
  else if (type === 'error') loginStatus.classList.add('bg-red-600');
  else if (type === 'loading') loginStatus.classList.add('bg-blue-600');
}

/* ---------- FETCH SEGURO (INCLUYE TOKEN) ---------- */
async function fetchSeguro(payload) {
  if (!authToken && payload.action !== 'login') {
    throw new Error('No autorizado. Inicia sesión.');
  }
  const full = { ...payload, authToken };
  const res = await fetch(GAPS_URL, {
    method: 'POST', mode: 'cors', redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(full)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message || 'Error servidor');
  return json;
}

/* ---------- CARGAS INICIALES ---------- */
async function loadVehicles() {
  const res = await fetchSeguro({ action: 'getVehicles' });
  vehicles = res.data || [];
  // inicializar arrays de deducciones
  vehicles.forEach(v => {
    if (!pendingStockDeductions[v.matricula]) pendingStockDeductions[v.matricula] = [];
  });
  savePendingDeductionsToStorage();
}

async function loadStock(silent = false) {
  try {
    const res = await fetchSeguro({ action: 'getStock' });
    stockDataStore = res.data || [];
    renderStockList(stockDataStore);
  } catch (e) {
    console.error('Error carga stock', e);
    if (!silent && stockListContainer) stockListContainer.innerHTML = `<div class="text-red-400">Error al cargar stock: ${e.message}</div>`;
  }
}

/* ---------- RENDER: VOR / GUANTERA ---------- */
function renderVorList() {
  if (!vorVehicleList) return;
  vorVehicleList.innerHTML = '';
  vehicles.forEach(v => {
    const el = document.createElement('div');
    el.className = 'van-card clickable';
    el.dataset.matricula = v.matricula;
    el.innerHTML = `\n      <div>\n        <div class="font-bold text-lg">${formatPlate(v.matricula)}</div>\n        <div class="text-sm text-muted">${capitalize(v.marca)}</div>\n      </div>\n      <div class="mt-3">\n        <div class="text-sm text-muted">ITV: ${v.itv || '---'}</div>\n      </div>\n    `;
    el.addEventListener('click', () => {
      navigateToPage('page-guantera');
      showGuanteraDetail(v.matricula);
    });
    vorVehicleList.appendChild(el);
  });
}

function renderGuanteraList() {
  if (!guanteraListContainer) return;
  guanteraListContainer.innerHTML = '';
  vehicles.forEach(v => {
    const card = document.createElement('div');
    card.className = 'guantera-card clickable';
    card.dataset.matricula = v.matricula;
    card.innerHTML = `\n      <div class="font-semibold">${formatPlate(v.matricula)}</div>\n      <div class="text-sm text-muted">${capitalize(v.marca)}</div>\n      <div class="mt-2 text-sm">Vin: ${v.vin || '---'}</div>\n    `;
    card.addEventListener('click', () => { navigateToPage('page-guantera'); showGuanteraDetail(v.matricula); });
    guanteraListContainer.appendChild(card);
  });
}

/* ---------- mostrar detalle guantera ---------- */
function showGuanteraDetail(matricula) {
  if (!guanteraDetailContent || !guanteraDetailTitle) return;
  guanteraListPage && guanteraListPage.classList.add('hidden');
  guanteraDetailPage && guanteraDetailPage.classList.remove('hidden');
  btnBackToGuanteraList && btnBackToGuanteraList.classList.remove('hidden');

  const van = vehicles.find(x => x.matricula === matricula) || {};
  guanteraDetailTitle.textContent = `Guantera - ${formatPlate(matricula)}`;

  const infoHTML = `\n    <div class="van-card">\n      <div class="grid grid-cols-2 gap-4">\n        <div>\n          <div class="text-sm text-muted">Marca</div>\n          <div class="font-medium">${capitalize(van.marca) || '---'}</div>\n        </div>\n        <div>\n          <div class="text-sm text-muted">Renting</div>\n          <div class="font-medium">${capitalize(van.renting) || '---'}</div>\n        </div>\n        <div>\n          <div class="text-sm text-muted">Nº Póliza</div>\n          <div class="font-medium">${van.poliza || '---'}</div>\n        </div>\n        <div>\n          <div class="text-sm text-muted">VIN</div>\n          <div class="font-medium">${van.vin || '---'}</div>\n        </div>\n      </div>\n    </div>\n  `;

  const tareas = (vanHistoryDataStore[matricula] || []).slice(0,20);
  let tareasHTML = `<div class="van-card"><h4 class="font-semibold mb-2">Historial de Tareas</h4>`;
  if (!tareas.length) tareasHTML += `<div class="text-muted">No hay tareas registradas.</div>`;
  else {
    tareas.forEach(t => {
      tareasHTML += `<div class="history-entry-card mb-2 p-2 border rounded">\n        <div class="flex justify-between">\n          <div><strong>${t.timestamp}</strong> <span class="text-sm text-muted"> ${t.nota ? '- ' + t.nota : ''}</span></div>\n          <div class="flex gap-2">\n            ${t.estado && t.estado.toLowerCase() === 'completado' ? '<span class="badge-ok">Completado</span>' : `<button data-timestamp="${t.timestamp}" class="complete-btn px-2 py-1 rounded bg-green-600 text-white">Completar</button>`}\n            <button data-timestamp="${t.timestamp}" class="delete-btn px-2 py-1 rounded bg-red-600 text-white">Borrar</button>\n          </div>\n        </div>\n      </div>`;
    });
  }
  tareasHTML += `</div>`;

  guanteraDetailContent.innerHTML = infoHTML + tareasHTML;

  // añadir listeners a botones dentro del detalle
  guanteraDetailContent.querySelectorAll('.complete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const timestamp = e.currentTarget.dataset.timestamp;
      await handleCompleteHistoryEntry(timestamp);
      await loadVanHistory();
      showGuanteraDetail(matricula);
      await loadStock(true);
    });
  });

  guanteraDetailContent.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const ts = e.currentTarget.dataset.timestamp;
      if (!confirm('¿Borrar entrada?')) return;
      try {
        await fetchSeguro({ action: 'deleteHistoryEntry', sheetName: 'Notas', timestamp: ts });
        await loadVanHistory();
        showGuanteraDetail(matricula);
      } catch (err) {
        alert('Error al borrar: ' + err.message);
      }
    });
  });
}

/* ---------- FIN PARTE 1 ---------- */
// app.js - parte 2/3

/* ---------- RENDER: STOCK ---------- */
function renderStockList(list) {
  if (!stockListContainer) return;
  stockListContainer.innerHTML = '';
  if (!list || list.length === 0) {
    stockListContainer.innerHTML = '<div class="text-muted">No hay recambios en stock.</div>';
    return;
  }

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'stock-item-card';
    const lowClass = item.cantidad <= 1 ? 'badge-low' : (item.cantidad === 2 ? 'badge-warning' : 'badge-ok');
    card.innerHTML = `
      <div class="font-semibold">${item.nombre}</div>
      <div class="text-muted">Cantidad: <span class="${lowClass}">${item.cantidad}</span></div>
      <div class="mt-2 flex gap-2">
        <button data-name="${item.nombre}" class="btn stock-edit px-2 py-1 rounded bg-blue-600 text-white">Editar</button>
        <button data-name="${item.nombre}" class="btn stock-delete px-2 py-1 rounded bg-red-600 text-white">Borrar</button>
      </div>
    `;
    stockListContainer.appendChild(card);
  });

  // listeners
  stockListContainer.querySelectorAll('.stock-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const nombre = e.currentTarget.dataset.name;
      const item = stockDataStore.find(s => s.nombre === nombre);
      if (item) {
        stockNameInput.value = item.nombre;
        stockQuantityInput.value = item.cantidad;
        stockSaveBtn.textContent = 'Actualizar';
        navigateToPage('page-seleccion-vans');
        showSubpage('stock');
      }
    });
  });

  stockListContainer.querySelectorAll('.stock-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const nombre = e.currentTarget.dataset.name;
      if (!confirm(`Borrar ${nombre}?`)) return;
      try {
        await fetchSeguro({ action: 'deleteStockItem', nombre });
        await loadStock();
      } catch (err) {
        alert('Error al borrar: ' + err.message);
      }
    });
  });
}

/* ---------- RENDER: VAN SELECTION (Crear tareas) ---------- */
function renderVanSelection() {
  if (!vanListContainer) return;
  vanListContainer.innerHTML = '';
  vehicles.forEach(v => {
    const mat = v.matricula;
    const card = document.createElement('div');
    card.className = 'van-card van-selection-card';
    card.dataset.matricula = mat;
    card.innerHTML = `
      <div class="font-semibold">${formatPlate(mat)}</div>
      <div class="text-sm text-muted">${capitalize(v.marca)}</div>
      <div class="mt-3">
        <label class="text-sm text-muted block mb-1">Nota:</label>
        <textarea id="note-${mat}" rows="2" class="w-full p-2 rounded bg-slate-800/60" placeholder="Nota..."></textarea>
        <label class="text-sm text-muted block mt-2 mb-1">Recambios (enter para autocompletar):</label>
        <input id="recambios-${mat}" data-matricula="${mat}" class="w-full p-2 rounded bg-slate-800/60 recambios-input" placeholder="Escribe recambio...">
        <div id="deduction-tags-${mat}" class="mt-2 flex gap-2"></div>
        <div class="mt-3 flex gap-2">
          <button data-matricula="${mat}" class="btn save-van-data-btn px-3 py-2 rounded bg-green-600 text-white">Guardar Tarea</button>
          <button data-matricula="${mat}" class="btn open-guantera-btn px-3 py-2 rounded bg-blue-600 text-white">Abrir Guantera</button>
        </div>
      </div>
    `;
    vanListContainer.appendChild(card);

    // render pending tags if exist
    if (pendingStockDeductions[mat] && pendingStockDeductions[mat].length) renderDeductionTags(mat);
  });

  // listeners
  document.querySelectorAll('.save-van-data-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const m = e.currentTarget.dataset.matricula;
      await handleVanDataSave(m);
    });
  });

  document.querySelectorAll('.open-guantera-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const m = e.currentTarget.dataset.matricula;
      navigateToPage('page-guantera');
      showGuanteraDetail(m);
    });
  });

  // autocompletado (enter)
  document.querySelectorAll('.recambios-input').forEach(input => {
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const m = input.dataset.matricula;
        const val = input.value.trim();
        if (!val) return;
        const match = stockDataStore.find(s => s.nombre.toLowerCase() === val.toLowerCase());
        if (match && match.cantidad > 0) {
          addStockDeductionForVehicle(m, match.nombre);
          renderDeductionTags(m);
          input.value = '';
        } else {
          alert('Recambio no encontrado o sin stock.');
        }
      }
    });
  });
}

/* ---------- DEDUCCIONES (tags) ---------- */
function renderDeductionTags(matricula) {
  const container = document.getElementById(`deduction-tags-${matricula}`);
  if (!container) return;
  container.innerHTML = '';
  const arr = pendingStockDeductions[matricula] || [];
  arr.forEach((it, idx) => {
    const span = document.createElement('span');
    span.className = 'badge-warning';
    span.innerHTML = `${it} (-1) <button data-idx="${idx}" data-matricula="${matricula}" class="remove-deduction ml-2">×</button>`;
    container.appendChild(span);
  });
  container.querySelectorAll('.remove-deduction').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      const mat = e.currentTarget.dataset.matricula;
      pendingStockDeductions[mat].splice(idx,1);
      savePendingDeductionsToStorage();
      renderDeductionTags(mat);
    });
  });
}

function addStockDeductionForVehicle(matricula, itemName) {
  if (!pendingStockDeductions[matricula]) pendingStockDeductions[matricula] = [];
  pendingStockDeductions[matricula].push(itemName);
  savePendingDeductionsToStorage();
}

/* ---------- GUARDAR TAREA (saveVanNote) ---------- */
async function handleVanDataSave(matricula) {
  try {
    const noteEl = document.getElementById(`note-${matricula}`);
    const recEl = document.getElementById(`recambios-${matricula}`);
    const note = noteEl ? noteEl.value : '';
    const recambios = recEl ? recEl.value : '';
    const usedStock = pendingStockDeductions[matricula] || [];

    if (!note || note.trim().length < 1) return alert('La nota es obligatoria.');

    const payload = {
      action: 'saveVanNote',
      matricula,
      note,
      recambios,
      items_stock: JSON.stringify(usedStock)
    };

    const res = await fetchSeguro(payload);
    alert(res.message || 'Nota guardada. Los recambios se restarán cuando completes la tarea.');

    // limpiar UI local (opcional mantener en storage)
    pendingStockDeductions[matricula] = [];
    savePendingDeductionsToStorage();
    renderDeductionTags(matricula);
    if (noteEl) noteEl.value = '';
    if (recEl) recEl.value = '';

    await loadVanHistory();
  } catch (e) {
    alert('Error guardando nota: ' + e.message);
  }
}

/* ---------- HISTORIAL (NOTAS) ---------- */
async function loadVanHistory() {
  try {
    const res = await fetchSeguro({ action: 'getVanNotesHistory' });
    const arr = res.data || [];
    vanHistoryDataStore = {};
    arr.forEach(entry => {
      if (!vanHistoryDataStore[entry.matricula]) vanHistoryDataStore[entry.matricula] = [];
      vanHistoryDataStore[entry.matricula].push(entry);
    });
    renderVanHistorySummaries();
  } catch (e) {
    console.error('Error historial:', e);
    if (vanHistoryListContainer) vanHistoryListContainer.innerHTML = `<div class="text-red-400">Error al cargar historial: ${e.message}</div>`;
  }
}

function renderVanHistorySummaries() {
  if (!vanHistoryListContainer) return;
  vanHistoryListContainer.innerHTML = '';
  for (const mat of Object.keys(vanHistoryDataStore)) {
    const entries = vanHistoryDataStore[mat];
    const pendingCount = entries.filter(x => !x.estado || x.estado.toLowerCase() === 'pendiente').length;
    const el = document.createElement('div');
    el.className = 'van-card';
    el.dataset.matricula = mat;
    el.innerHTML = `
      <div class="flex justify-between">
        <div><strong>${formatPlate(mat)}</strong> <div class="text-sm text-muted">${entries.length} entrada(s)</div></div>
        <div>${pendingCount ? `<span class="badge-warning">${pendingCount} pendientes</span>` : ''}</div>
      </div>
      <div class="mt-2"><button class="btn view-history px-3 py-1 rounded bg-blue-600 text-white" data-matricula="${mat}">Ver historial</button></div>
    `;
    vanHistoryListContainer.appendChild(el);
  }

  vanHistoryListContainer.querySelectorAll('.view-history').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mat = e.currentTarget.dataset.matricula;
      navigateToPage('page-guantera');
      showGuanteraDetail(mat);
    });
  });
}

/* ---------- COMPLETAR ENTRADA (updateNoteStatus con usedStockItems) ---------- */
async function handleCompleteHistoryEntry(timestamp) {
  try {
    const all = Object.values(vanHistoryDataStore).flat();
    const entry = all.find(e => e.timestamp === timestamp);
    let usedStockItems = [];

    if (entry) {
      if (entry.items_stock) {
        try { const parsed = JSON.parse(entry.items_stock); if (Array.isArray(parsed)) usedStockItems = parsed; }
        catch (e) { if (typeof entry.items_stock === 'string') usedStockItems = entry.items_stock.split(',').map(x=>x.trim()).filter(Boolean); }
      }
    }

    const payload = { action: 'updateNoteStatus', timestamp, newStatus: 'Completado', usedStockItems };
    const res = await fetchSeguro(payload);
    alert(res.message || 'Tarea completada');
    await loadVanHistory();
    await loadStock(true);
  } catch (e) {
    alert('Error completando entrada: ' + e.message);
  }
}

/* ---------- FIN PARTE 2 ---------- */
// app.js - parte 3/3

/* ---------- BORRAR ENTRADA ---------- */
async function handleDeleteHistoryEntry(timestamp) {
  if (!confirm('¿Seguro que deseas borrar esta entrada?')) return;
  try {
    const res = await fetchSeguro({ action: 'deleteHistoryEntry', timestamp });
    alert(res.message || 'Entrada eliminada.');
    await loadVanHistory();
  } catch (e) {
    alert('Error al borrar: ' + e.message);
  }
}

/* ---------- BUSCADOR DE STOCK ---------- */
if (searchStockInput) {
  searchStockInput.addEventListener('input', () => {
    const val = searchStockInput.value.toLowerCase();
    const filtered = stockDataStore.filter(s => s.nombre.toLowerCase().includes(val));
    renderStockList(filtered);
  });
}

/* ---------- BUSCADOR DE FURGONETAS ---------- */
if (searchInput) {
  searchInput.addEventListener('input', () => {
    const val = searchInput.value.toLowerCase();
    const filtered = vehicles.filter(v =>
      v.matricula.toLowerCase().includes(val) || (v.marca || '').toLowerCase().includes(val)
    );
    renderFilteredVanList(filtered);
  });
}

function renderFilteredVanList(list) {
  if (!vanListContainer) return;
  vanListContainer.innerHTML = '';
  list.forEach(v => {
    const mat = v.matricula;
    const card = document.createElement('div');
    card.className = 'van-card van-selection-card';
    card.dataset.matricula = mat;
    card.innerHTML = `
      <div class="font-semibold">${formatPlate(mat)}</div>
      <div class="text-sm text-muted">${capitalize(v.marca)}</div>
    `;
    vanListContainer.appendChild(card);
  });
}

/* ---------- LOGIN ---------- */
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = passwordInput.value.trim();
    if (!pass) return;

    showLoginStatus('Comprobando...', 'loading');
    loginButton.disabled = true;

    try {
      const res = await fetchSeguro({ action: 'login', password: pass });
      authToken = res.token;
      showLoginStatus('Acceso permitido', 'success');
      loginModal.classList.add('hidden');
      appContainer.classList.remove('hidden');

      await initializeApp();

    } catch (err) {
      showLoginStatus('Contraseña incorrecta', 'error');
      loginButton.disabled = false;
    }
  });
}

/* ---------- NAVEGACIÓN ---------- */
function navigateToPage(id) {
  pageContents.forEach(p => p.classList.add('hidden'));
  const page = document.getElementById(id);
  if (page) page.classList.remove('hidden');

  navLinks.forEach(link => link.classList.remove('border-blue-500', 'text-white'));
  const activeLink = document.querySelector(`.nav-link[data-page="${id}"]`);
  if (activeLink) {
    activeLink.classList.add('border-blue-500', 'text-white');
    activeLink.classList.remove('text-gray-400');
  }

  if (id === 'page-seleccion-vans') showSubpage('main');
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = link.dataset.page;
    navigateToPage(target);
  });
});

/* ---------- SUBPÁGINAS DE SELECCIÓN ---------- */
function showSubpage(name) {
  vansChoiceMenu.classList.add('hidden');
  vansSubpageUpload.classList.add('hidden');
  vansSubpageGallery.classList.add('hidden');
  vansSubpageStock.classList.add('hidden');

  if (name === 'main') vansChoiceMenu.classList.remove('hidden');
  if (name === 'upload') vansSubpageUpload.classList.remove('hidden');
  if (name === 'gallery') vansSubpageGallery.classList.remove('hidden');
  if (name === 'stock') vansSubpageStock.classList.remove('hidden');
}

document.querySelectorAll('.btn-back-to-vans-choice').forEach(btn => {
  btn.addEventListener('click', () => showSubpage('main'));
});

if (btnShowVanUpload) btnShowVanUpload.addEventListener('click', () => showSubpage('upload'));
if (btnShowVanGallery) btnShowVanGallery.addEventListener('click', () => showSubpage('gallery'));
if (btnShowStock) btnShowStock.addEventListener('click', () => showSubpage('stock'));

/* ---------- CARGA TOTAL DE LA APP ---------- */
async function initializeApp() {
  try {
    loadPendingDeductionsFromStorage();
    await loadVehicles();
    await loadVanHistory();
    await loadStock();

    renderVorList();
    renderGuanteraList();
    renderVanSelection();

    const visitRes = await fetchSeguro({ action: 'getVisitCounter' }).catch(()=>null);
    if (visitRes && visitRes.counter && document.getElementById('global-visit-counter'))
      document.getElementById('global-visit-counter').textContent = `Visitas: ${visitRes.counter}`;

  } catch (e) {
    console.error('Error inicializando app:', e);
    alert('Error iniciando aplicación: ' + e.message);
  }
}

/* ---------- QR ---------- */
function renderQRList() {
  const container = document.getElementById('qr-van-list-container');
  if (!container) return;
  container.innerHTML = '';
  vehicles.forEach(v => {
    const card = document.createElement('div');
    card.className = 'qr-van-card van-card';
    card.innerHTML = `
      <div class="font-semibold mb-2">${formatPlate(v.matricula)}</div>
      <canvas id="qr-${v.matricula}"></canvas>
    `;
    container.appendChild(card);
    const canvas = document.getElementById(`qr-${v.matricula}`);
    if (canvas) QRCode.toCanvas(canvas, v.vin || '---');
  });
}

document.getElementById('nav-link-page-qr-vans')?.addEventListener('click', renderQRList);

/* ---------- DEBUG ---------- */
window.__APP_DEBUG__ = {
  vehicles: () => vehicles,
  stock: () => stockDataStore,
  history: () => vanHistoryDataStore,
  pending: () => pendingStockDeductions
};

/* ---------- FIN PARTE 3 ---------- */

