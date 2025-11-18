// app.js - Reescrito y modularizado (modo PRO)
// Reemplaza GAPS_URL por tu endpoint real
const GAPS_URL = 'https://script.google.com/macros/s/AKfycb.../exec'; // <-- PON TU URL

// ----------------------
// Estado interno
// ----------------------
let authToken = null;
let vehicles = [];               // lista de vehículos desde servidor
let vanHistoryDataStore = {};    // { matricula: [entries] }
let stockDataStore = [];         // [{nombre,cantidad}]
let pendingStockDeductions = {}; // { matricula: [itemName,...] } - persistido a localStorage
const placeholderImg = 'https://placehold.co/400x300/374151/E5E7EB?text=Sin+Imagen';

// ----------------------
// Selectores globales
// ----------------------
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

// ----------------------
// Utilidades
// ----------------------
function showLoginStatus(message, type = 'info') {
  loginStatus.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600');
  loginStatus.textContent = message;
  if (type === 'success') loginStatus.classList.add('bg-green-600');
  else if (type === 'error') loginStatus.classList.add('bg-red-600');
  else if (type === 'loading') loginStatus.classList.add('bg-blue-600');
}

function savePendingDeductionsToStorage() {
  localStorage.setItem('pendingStockDeductions', JSON.stringify(pendingStockDeductions || {}));
}

function loadPendingDeductionsFromStorage() {
  try {
    const raw = localStorage.getItem('pendingStockDeductions');
    pendingStockDeductions = raw ? JSON.parse(raw) : {};
  } catch (e) {
    pendingStockDeductions = {};
  }
}

function capitalize(s) { if (!s) return ''; return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

async function fetchSeguro(payload) {
  if (!authToken && payload.action !== 'login') {
    throw new Error('No autorizado. Inicia sesión.');
  }
  const full = { ...payload, authToken };
  const res = await fetch(GAPS_URL, {
    method: 'POST', mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(full)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message || 'Error servidor');
  return json;
}

// ----------------------
// Inicialización
// ----------------------
async function initializeApp() {
  loadPendingDeductionsFromStorage();
  try {
    await loadVehicles();
    await loadStock(true);
    renderVorList();
    renderGuanteraList();
    setupEventDelegation();
    // Mostrar página principal
    navigateToPage('page-operativa-vor');
    document.getElementById('app-container').classList.remove('hidden');
  } catch (e) {
    console.error('Error init:', e);
    alert('Error al iniciar: ' + e.message);
  }
}

// ----------------------
// NAV
// ----------------------
function navigateToPage(pageId) {
  pageContents.forEach(p => p.classList.add('hidden'));
  navLinks.forEach(n => n.classList.remove('text-white', 'font-semibold', 'border-blue-500'));
  const target = document.getElementById(pageId);
  if (target) target.classList.remove('hidden');
  const link = document.getElementById(`nav-link-${pageId}`);
  if (link) link.classList.add('text-white', 'font-semibold', 'border-blue-500');

  // hide subpages back buttons / detail pages
  if (pageId === 'page-guantera') {
    guanteraListPage.classList.remove('hidden');
    guanteraDetailPage.classList.add('hidden');
  }
}

// ----------------------
// VEHÍCULOS
// ----------------------
async function loadVehicles() {
  const res = await fetchSeguro({ action: 'getVehicles' });
  vehicles = res.data || [];
  // init pending arrays
  vehicles.forEach(v => {
    if (!pendingStockDeductions[v.matricula]) pendingStockDeductions[v.matricula] = [];
  });
  savePendingDeductionsToStorage();
}

function renderVorList() {
  vorVehicleList.innerHTML = '';
  vehicles.forEach(v => {
    const el = document.createElement('div');
    el.className = 'van-card cursor-pointer';
    el.dataset.matricula = v.matricula;
    el.innerHTML = `
      <div>
        <div class="font-bold text-lg">${formatPlate(v.matricula)}</div>
        <div class="text-sm text-muted">${capitalize(v.marca)}</div>
      </div>
      <div class="mt-3">
        <div class="text-sm text-muted">ITV: ${v.itv || '---'}</div>
      </div>
    `;
    // click lleva a guantera y muestra detalles
    el.addEventListener('click', () => {
      navigateToPage('page-guantera');
      showGuanteraDetail(v.matricula);
    });
    vorVehicleList.appendChild(el);
  });
}

function renderGuanteraList() {
  guanteraListContainer.innerHTML = '';
  vehicles.forEach(v => {
    const card = document.createElement('div');
    card.className = 'guantera-card clickable';
    card.dataset.matricula = v.matricula;
    card.innerHTML = `
      <div class="font-semibold">${formatPlate(v.matricula)}</div>
      <div class="text-sm text-muted">${capitalize(v.marca)}</div>
      <div class="mt-2 text-sm">Vin: ${v.vin || '---'}</div>
    `;
    card.addEventListener('click', () => {
      navigateToPage('page-guantera');
      showGuanteraDetail(v.matricula);
    });
    guanteraListContainer.appendChild(card);
  });
}

function showGuanteraDetail(matricula) {
  guanteraListPage.classList.add('hidden');
  guanteraDetailPage.classList.remove('hidden');
  btnBackToGuanteraList.classList.remove('hidden');

  const van = vehicles.find(x => x.matricula === matricula) || {};
  guanteraDetailTitle.textContent = `Guantera - ${formatPlate(matricula)}`;

  // Mostrar info, documentos y tareas (si hay)
  const infoHTML = `
    <div class="van-card">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-sm text-muted">Marca</div>
          <div class="font-medium">${capitalize(van.marca) || '---'}</div>
        </div>
        <div>
          <div class="text-sm text-muted">Renting</div>
          <div class="font-medium">${capitalize(van.renting) || '---'}</div>
        </div>
        <div>
          <div class="text-sm text-muted">Nº Póliza</div>
          <div class="font-medium">${van.poliza || '---'}</div>
        </div>
        <div>
          <div class="text-sm text-muted">VIN</div>
          <div class="font-medium">${van.vin || '---'}</div>
        </div>
      </div>
    </div>
  `;

  // tareas del historial
  const tareas = (vanHistoryDataStore[matricula] || []).slice(0, 20);
  let tareasHTML = `<div class="van-card"><h4 class="font-semibold mb-2">Historial de Tareas</h4>`;
  if (!tareas.length) tareasHTML += `<div class="text-muted">No hay tareas registradas.</div>`;
  else {
    tareas.forEach(t => {
      tareasHTML += `<div class="history-entry-card mb-2 p-2 border rounded">
        <div class="flex justify-between">
          <div><strong>${t.timestamp}</strong> <span class="text-sm text-muted"> ${t.nota ? '- ' + t.nota : ''}</span></div>
          <div class="flex gap-2">
            ${t.estado && t.estado.toLowerCase() === 'completado' ? '<span class="badge-ok">Completado</span>' : `<button data-timestamp="${t.timestamp}" class="complete-btn px-2 py-1 rounded bg-green-600 text-white">Completar</button>`}
            <button data-timestamp="${t.timestamp}" class="delete-btn px-2 py-1 rounded bg-red-600 text-white">Borrar</button>
          </div>
        </div>
      </div>`;
    });
  }
  tareasHTML += `</div>`;

  guanteraDetailContent.innerHTML = infoHTML + tareasHTML;

  // listeners para completar/borrar en detalle
  guanteraDetailContent.querySelectorAll('.complete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const timestamp = e.currentTarget.dataset.timestamp;
      await handleCompleteHistoryEntry(timestamp);
      // refrescar
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

// ----------------------
// FORMATO
// ----------------------
function formatPlate(raw) {
  if (!raw) return '---';
  const s = raw.replace(/\s+/g, '');
  if (s.length === 7) return s.slice(0,4) + ' ' + s.slice(4);
  return raw;
}

// ----------------------
// STOCK
// ----------------------
async function loadStock(silent = false) {
  try {
    const res = await fetchSeguro({ action: 'getStock' });
    stockDataStore = res.data || [];
    renderStockList(stockDataStore);
  } catch (e) {
    console.error('Error carga stock', e);
    if (!silent) stockListContainer.innerHTML = `<div class="text-red-400">Error al cargar stock: ${e.message}</div>`;
  }
}

function renderStockList(list) {
  stockListContainer.innerHTML = '';
  if (!list.length) {
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

  // Delegation for edit/delete
  stockListContainer.querySelectorAll('.stock-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const nombre = e.currentTarget.dataset.name;
      const item = stockDataStore.find(s => s.nombre === nombre);
      if (item) {
        stockNameInput.value = item.nombre;
        stockQuantityInput.value = item.cantidad;
        stockSaveBtn.textContent = 'Actualizar';
        // focus
        stockQuantityInput.focus();
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

async function handleSaveStock(e) {
  e && e.preventDefault();
  const nombre = stockNameInput.value && stockNameInput.value.trim();
  const cantidad = Number(stockQuantityInput.value);
  if (!nombre || isNaN(cantidad)) return alert('Nombre y cantidad válidos');

  try {
    await fetchSeguro({ action: 'saveStockItem', nombre, cantidad });
    stockNameInput.value = '';
    stockQuantityInput.value = '';
    stockSaveBtn.textContent = 'Guardar';
    await loadStock();
    alert('Stock guardado/actualizado');
  } catch (err) {
    alert('Error guardando stock: ' + err.message);
  }
}

// ----------------------
// HISTORIAL (Notas)
 // ----------------------
async function loadVanHistory() {
  try {
    const res = await fetchSeguro({ action: 'getVanNotesHistory' });
    const arr = res.data || [];
    // organizar por matrícula
    vanHistoryDataStore = {};
    arr.forEach(entry => {
      if (!vanHistoryDataStore[entry.matricula]) vanHistoryDataStore[entry.matricula] = [];
      vanHistoryDataStore[entry.matricula].push(entry);
    });
    renderVanHistorySummaries();
  } catch (e) {
    console.error('Error historial:', e);
    vanHistoryListContainer.innerHTML = `<div class="text-red-400">Error al cargar historial: ${e.message}</div>`;
  }
}

function renderVanHistorySummaries() {
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

  // listeners
  vanHistoryListContainer.querySelectorAll('.view-history').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mat = e.currentTarget.dataset.matricula;
      // llevar a guantera -> detalle
      navigateToPage('page-guantera');
      showGuanteraDetail(mat);
    });
  });
}

/**
 * Complete history entry.
 * - Recupera items_stock de la entrada
 * - Envía usedStockItems al servidor para que descuente
 * - Actualiza frontend llamando a loadVanHistory() y loadStock()
 */
async function handleCompleteHistoryEntry(timestamp) {
  try {
    // buscar la entrada en vanHistoryDataStore
    const all = Object.values(vanHistoryDataStore).flat();
    const entry = all.find(e => e.timestamp === timestamp);
    let usedStockItems = [];

    if (entry) {
      // si hay campo items_stock y es JSON, usarlo
      if (entry.items_stock) {
        try {
          const parsed = JSON.parse(entry.items_stock);
          if (Array.isArray(parsed)) usedStockItems = parsed;
        } catch (e) {
          // fallback: si es csv
          if (typeof entry.items_stock === 'string') {
            usedStockItems = entry.items_stock.split(',').map(x => x.trim()).filter(Boolean);
          }
        }
      }
    }

    // Enviar petición que actualiza estado + items usados (el backend debe restar)
    const payload = { action: 'updateNoteStatus', timestamp, newStatus: 'Completado', usedStockItems };
    const res = await fetchSeguro(payload);

    alert(res.message || 'Tarea marcada como completada');
    await loadVanHistory();
    await loadStock(true);
  } catch (e) {
    alert('Error completando entrada: ' + e.message);
  }
}

// ----------------------
// AUTOCOMPLETADO + DEDUCCIONES (en formulario de guardado de nota)
// ----------------------
function addStockDeductionForVehicle(matricula, itemName) {
  if (!pendingStockDeductions[matricula]) pendingStockDeductions[matricula] = [];
  pendingStockDeductions[matricula].push(itemName);
  savePendingDeductionsToStorage();
}

// ----------------------
// SUBPAGES - helpers para mostrar sub-secciones dentro de Selección
// ----------------------
function showSubpage(name) {
  vansChoiceMenu.classList.add('hidden');
  vansSubpageUpload.classList.add('hidden');
  vansSubpageGallery.classList.add('hidden');
  vansSubpageStock.classList.add('hidden');

  if (name === 'upload') vansSubpageUpload.classList.remove('hidden');
  if (name === 'gallery') vansSubpageGallery.classList.remove('hidden');
  if (name === 'stock') vansSubpageStock.classList.remove('hidden');
}

// ----------------------
// EVENTOS y DELEGACIÓN
// ----------------------
function setupEventDelegation() {
  // nav links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateToPage(page);
    });
  });

  // login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = passwordInput.value;
    if (!pass) return;
    try {
      loginButton.disabled = true;
      showLoginStatus('Verificando...', 'loading');
      const res = await fetch(GAPS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', password: pass })
      });
      const json = await res.json();
      if (json.status === 'success' && json.authToken) {
        authToken = json.authToken;
        showLoginStatus('Acceso concedido', 'success');
        loginModal.style.display = 'none';
        await initializeApp();
      } else {
        showLoginStatus('Error: ' + (json.message || 'Credenciales'), 'error');
        loginButton.disabled = false;
      }
    } catch (err) {
      showLoginStatus('Error: ' + err.message, 'error');
      loginButton.disabled = false;
    }
  });

  // mostrar subpages de selección
  btnShowVanUpload.addEventListener('click', () => { navigateToPage('page-seleccion-vans'); showSubpage('upload'); renderVanSelection(); });
  btnShowVanGallery.addEventListener('click', () => { navigateToPage('page-seleccion-vans'); showSubpage('gallery'); loadVanHistory(); });
  btnShowStock.addEventListener('click', () => { navigateToPage('page-seleccion-vans'); showSubpage('stock'); loadStock(); });

  // stock form
  stockForm.addEventListener('submit', handleSaveStock);
  searchStockInput.addEventListener('input', () => {
    const q = searchStockInput.value.toLowerCase();
    renderStockList(stockDataStore.filter(s => s.nombre.toLowerCase().includes(q)));
  });

  // back guantera
  btnBackToGuanteraList.addEventListener('click', () => {
    guanteraDetailPage.classList.add('hidden');
    guanteraListPage.classList.remove('hidden');
    btnBackToGuanteraList.classList.add('hidden');
  });

  // search van in upload page
  searchInput && searchInput.addEventListener('input', () => {
    const q = searchInput.value.toUpperCase().replace(/\s/g, '');
    const cards = vanListContainer.querySelectorAll('.van-selection-card');
    let found = 0;
    cards.forEach(c => {
      const plate = c.dataset.matricula.replace(/\s/g, '').toUpperCase();
      if (plate.includes(q)) { c.classList.remove('hidden'); found++; } else c.classList.add('hidden');
    });
  });

  // inicial render simple
  renderVanSelection();
}

// ----------------------
// RENDER: Selección / Crear tarea
// ----------------------
function renderVanSelection() {
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
        <label class="text-sm text-muted block mt-2 mb-1">Recambios (autocompletar):</label>
        <input id="recambios-${mat}" data-matricula="${mat}" class="w-full p-2 rounded bg-slate-800/60 recambios-input" placeholder="Escribe recambio...">
        <div id="deduction-tags-${mat}" class="mt-2 flex gap-2"></div>
        <div class="mt-3 flex gap-2">
          <button data-matricula="${mat}" class="btn save-van-data-btn px-3 py-2 rounded bg-green-600 text-white">Guardar Tarea</button>
          <button data-matricula="${mat}" class="btn open-guantera-btn px-3 py-2 rounded bg-blue-600 text-white">Abrir Guantera</button>
        </div>
      </div>
    `;
    vanListContainer.appendChild(card);

    // restore pending tags for mat
    if (pendingStockDeductions[mat] && pendingStockDeductions[mat].length) {
      renderDeductionTags(mat);
    }
  });

  // listeners: delegación simple
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

  // autocompletado simple: usa stockDataStore
  document.querySelectorAll('.recambios-input').forEach(input => {
    input.addEventListener('keydown', (ev) => {
      // on enter, add the current value as deduction (if exists in stock)
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

function renderDeductionTags(matricula) {
  const container = document.getElementById(`deduction-tags-${matricula}`);
  container.innerHTML = '';
  const arr = pendingStockDeductions[matricula] || [];
  arr.forEach((it, idx) => {
    const span = document.createElement('span');
    span.className = 'badge-warning';
    span.innerHTML = `${it} (-1) <button data-idx="${idx}" data-matricula="${matricula}" class="remove-deduction ml-2">×</button>`;
    container.appendChild(span);
  });
  // attach remove handlers
  container.querySelectorAll('.remove-deduction').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      const mat = e.currentTarget.dataset.matricula;
      pendingStockDeductions[mat].splice(idx, 1);
      savePendingDeductionsToStorage();
      renderDeductionTags(mat);
    });
  });
}

// ----------------------
// Guardar Tarea -> envia usedStockItems pero no descuenta aquí (descuento al completar)
// Se guarda items_stock dentro de la entrada en el servidor para que luego
// en updateNoteStatus el backend pueda restar cuando se marque completado.
// ----------------------
async function handleVanDataSave(matricula) {
  try {
    const note = document.getElementById(`note-${matricula}`).value;
    const recambios = document.getElementById(`recambios-${matricula}`).value;
    const usedStock = pendingStockDeductions[matricula] || [];

    if (!note || note.trim().length < 1) return alert('La nota es obligatoria.');

    const payload = {
      action: 'saveVanNote',
      matricula,
      note,
      recambios,
      items_stock: JSON.stringify(usedStock)  // guardamos en registro
    };

    const res = await fetchSeguro(payload);
    alert(res.message || 'Nota guardada. Los recambios se restarán cuando completes la tarea.');

    // limpiar UI local (las deducciones se mantienen en localStorage si quieres)
    pendingStockDeductions[matricula] = [];
    savePendingDeductionsToStorage();
    renderDeductionTags(matricula);
    document.getElementById(`note-${matricula}`).value = '';
    document.getElementById(`recambios-${matricula}`).value = '';

    // actualizar historial local
    await loadVanHistory();
  } catch (e) {
    alert('Error guardando nota: ' + e.message);
  }
}

// ----------------------
// Inicial kickoff cuando el usuario inicia sesión
// ----------------------
(async function bootstrap() {
  // para desarrollo, si quieres saltarte login, comenta el return y asigna authToken manualmente
  // return;

  // Keep script as module: event listeners set in setupEventDelegation
})();

// Exponer algunas funciones para debug (opcional)
window._app = {
  initializeApp,
  loadVehicles,
  loadStock,
  loadVanHistory,
  pendingStockDeductions,
  addStockDeductionForVehicle
};

// Si te logeas desde la UI, initializeApp se llama tras login
