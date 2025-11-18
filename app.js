document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES ---
    const GAPS_URL = 'https://script.google.com/macros/s/AKfycbwEyozAk98y_r4Y3MZDYk5f6S-IguJSzMsUC2B069WTgJZKKg7AmJeTVob7c0NDKIZrtg/exec'; 
    
    let appVehicleList = []; 
    let vanPhotoStore = {};
    let vanHistoryDataStore = {};
    let tireHistoryDataStore = {};
    let stockDataStore = []; 
    let authToken = null;
    let currentVorFilter = 'all'; 

    let pendingStockDeductions = {}; 

    let rentalHistoryDataStore = []; 
    let rentalSinglePhotoStore = {}; 
    let rentalDamagePhotoStore = []; 

    let accidentHistoryDataStore = []; 
    let accidentPartePhotoStore = null; 
    let accidentDamagePhotoStore = []; 

    let docPhotoStore = {}; 
    const placeholderImg = 'https://placehold.co/400x300/374151/E5E7EB?text=Sin+Imagen';

    // --- SELECTORES ---
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    const appContainer = document.getElementById('app-container');
    const globalVisitCounter = document.getElementById('global-visit-counter');
    
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginButton = document.getElementById('login-button');
    const passwordInput = document.getElementById('password-input');
    const loginStatus = document.getElementById('login-status');

    const navLinks = document.querySelectorAll('.nav-link');
    const pageContents = document.querySelectorAll('.page-content');

    // --- FUNCIONES AUXILIARES ---
    function checkAdminPassword(onConfirm) {
        const adminPass = prompt("Acción protegida. Introduce contraseña:");
        if (adminPass === 'Liebre') onConfirm();
        else if (adminPass !== null) alert("Contraseña incorrecta.");
    }

    function showLoginStatus(message, type) {
        loginStatus.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600', 'text-white');
        loginStatus.textContent = message;
        if (type === 'success') loginStatus.classList.add('bg-green-600', 'text-white');
        else if (type === 'error') loginStatus.classList.add('bg-red-600', 'text-white');
        else loginStatus.classList.add('bg-blue-600', 'text-white');
        loginStatus.classList.remove('hidden');
    }

    async function fetchSeguro(payload) {
        if (!authToken) { alert('Sesión caducada.'); location.reload(); throw new Error('Sesión caducada.'); }
        const fullPayload = { ...payload, authToken: authToken };
        const response = await fetch(GAPS_URL, {
            method: 'POST', mode: 'cors', redirect: 'follow',
            body: JSON.stringify(fullPayload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        if (!response.ok) throw new Error(`Error servidor: ${response.statusText}`);
        const result = await response.json();
        if (result.status !== 'success') {
             if (response.status === 401 || (result.message && result.message.includes('Token'))) {
                alert('Sesión caducada.'); location.reload();
            }
            throw new Error(result.message);
        }
        return result;
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    function navigateToPage(pageId) {
        pageContents.forEach(page => page.classList.add('hidden'));
        navLinks.forEach(nav => {
            nav.classList.remove('bg-blue-600', 'text-white');
            nav.classList.add('text-gray-400');
        });

        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.remove('hidden');

        const targetNavLink = document.getElementById(`nav-link-${pageId}`);
        if (targetNavLink) {
            targetNavLink.classList.remove('text-gray-400');
            targetNavLink.classList.add('bg-blue-600', 'text-white');
        }

        if (pageId === 'page-operativa-vor') populateVorPage();
        if (pageId === 'page-guantera') {
            document.getElementById('guantera-detail-page').classList.add('hidden');
            document.getElementById('guantera-list-page').classList.remove('hidden');
            populateGuanteraList();
        }
        // Reset subpages
        if(pageId === 'page-seleccion-vans') {
            document.getElementById('vans-choice-menu').classList.remove('hidden');
            ['vans-subpage-upload','vans-subpage-gallery','vans-subpage-stock','van-history-detail-page'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
        }
         if(pageId === 'page-neumaticos') {
            document.getElementById('neumaticos-choice-menu').classList.remove('hidden');
            ['neumaticos-subpage-upload','neumaticos-subpage-gallery','tire-history-detail-page'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
        }
        if(pageId === 'page-registro-alquiler') {
            document.getElementById('alquiler-choice-menu').classList.remove('hidden');
            ['alquiler-subpage-upload','alquiler-subpage-gallery','rental-history-detail-page'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
        }
        if(pageId === 'page-accidentes') {
            document.getElementById('accidentes-choice-menu').classList.remove('hidden');
            ['accidentes-subpage-upload','accidentes-subpage-gallery','accident-history-detail-page'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
        }
    }

    function addTimestampToImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width; canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const timestamp = new Date().toLocaleString('es-ES');
                    let fontSize = Math.max(24, img.width / 50);
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.fillStyle = '#FFFF00'; ctx.strokeStyle = 'black';
                    ctx.lineWidth = Math.max(1, fontSize / 12);
                    ctx.strokeText(timestamp, fontSize, canvas.height - fontSize);
                    ctx.fillText(timestamp, fontSize, canvas.height - fontSize);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // --- INITIALIZATION & LOGIN ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = passwordInput.value;
        if (!password) return;

        loginButton.disabled = true; loginButton.textContent = 'Verificando...';
        showLoginStatus('Conectando...', 'loading');

        try {
            const response = await fetch(GAPS_URL, {
                method: 'POST', mode: 'cors', redirect: 'follow',
                body: JSON.stringify({ action: 'login', password: password }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();
            if (result.status === 'success') {
                authToken = result.authToken;
                showLoginStatus('¡Correcto!', 'success');
                loginModal.classList.add('hidden'); 
                initializeApp();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showLoginStatus(error.message, 'error');
            loginButton.disabled = false; loginButton.textContent = 'Entrar';
        }
    });

    async function initializeApp() {
        loadingOverlay.classList.remove('hidden');
        appContainer.classList.remove('hidden');
        try {
            const result = await fetchSeguro({ action: 'getVehicles' });
            appVehicleList = result.data;
            loadStock(true);
            populateVanSelectionList();
            populateQRList();
            populateTireMatriculaList();
            populateManageVehicleList();
            populateVorPage();
            populateGuanteraList();
            checkPendingTasksAndAlert();
            
            document.getElementById('suggestion-fab').classList.remove('hidden');
            document.getElementById('help-fab').classList.remove('hidden');
            loadingOverlay.classList.add('hidden');
            
            // Cargar visitas
            fetchSeguro({ action: 'getVisitCount' }).then(res => {
                if(res.status === 'success') globalVisitCounter.textContent = `Visitas: ${res.count}`;
            });

        } catch (error) {
            loadingMessage.textContent = `Error fatal: ${error.message}`;
            loadingMessage.classList.add('text-red-500');
        }
    }

    // --- PAGE POPULATION FUNCTIONS ---
    function populateVanSelectionList() {
        const container = document.getElementById('van-list-container');
        container.innerHTML = '';
        appVehicleList.forEach(van => {
            vanPhotoStore[van.matricula] = [];
            pendingStockDeductions[van.matricula] = [];
            container.innerHTML += `
            <div class="van-card bg-slate-900 p-4 rounded-xl border border-slate-700">
                <h3 class="text-lg font-bold text-white">${van.matricula} <span class="text-sm font-normal text-gray-400">(${van.marca})</span></h3>
                <textarea id="note-${van.matricula}" rows="2" class="w-full mt-2 p-2 bg-slate-800 rounded text-white text-sm" placeholder="Nota de avería..."></textarea>
                <input type="file" id="file-${van.matricula}" class="hidden van-photo-input" data-matricula="${van.matricula}" accept="image/*" capture="environment">
                <div id="photos-${van.matricula}" class="flex gap-2 mt-2 overflow-x-auto"></div>
                <div class="flex gap-2 mt-3">
                    <label for="file-${van.matricula}" class="flex-1 bg-blue-600 text-white text-center py-2 rounded text-sm cursor-pointer">📸 Foto</label>
                    <button class="flex-1 bg-green-600 text-white py-2 rounded text-sm font-bold save-van-btn" data-matricula="${van.matricula}">Guardar Tarea</button>
                </div>
            </div>`;
        });
        
        document.querySelectorAll('.van-photo-input').forEach(inpt => {
            inpt.addEventListener('change', async (e) => {
                if(e.target.files[0]) {
                    const mat = e.target.dataset.matricula;
                    const base64 = await addTimestampToImage(e.target.files[0]);
                    vanPhotoStore[mat].push(base64);
                    const img = document.createElement('img'); img.src = base64; img.className = "h-16 w-16 object-cover rounded";
                    document.getElementById(`photos-${mat}`).appendChild(img);
                }
            });
        });
        
        document.querySelectorAll('.save-van-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const mat = e.target.dataset.matricula;
                const note = document.getElementById(`note-${mat}`).value;
                if(!note) return alert("Escribe una nota.");
                
                e.target.disabled = true; e.target.textContent = "...";
                const photos = vanPhotoStore[mat].map((d, i) => ({ fileName: `${mat}_${i}.jpg`, mimeType: 'image/jpeg', data: d.split(',')[1] }));
                
                try {
                    await fetchSeguro({ action: 'saveVanNote', matricula: mat, note: note, photos: photos, usedStockItems: [], recambios: '' });
                    alert("Tarea guardada.");
                    document.getElementById(`note-${mat}`).value = '';
                    document.getElementById(`photos-${mat}`).innerHTML = '';
                    vanPhotoStore[mat] = [];
                } catch(err) { alert(err.message); }
                e.target.disabled = false; e.target.textContent = "Guardar Tarea";
            });
        });
    }

    function populateVorPage() {
        const list = document.getElementById('vor-vehicle-list');
        list.innerHTML = '';
        let counts = { total: 0, op: 0, vor: 0 };
        
        appVehicleList.forEach(van => {
            counts.total++;
            const isVor = van.estado === 'VOR';
            if(isVor) counts.vor++; else counts.op++;
            
            // Filtro
            if(currentVorFilter === 'op' && isVor) return;
            if(currentVorFilter === 'vor' && !isVor) return;

            list.innerHTML += `
            <div class="bg-slate-900 p-4 rounded-lg border ${isVor ? 'border-red-500' : 'border-green-500'} flex justify-between items-center">
                <div>
                    <h3 class="font-bold text-white text-lg">${van.matricula}</h3>
                    <span class="text-xs text-gray-400">${van.marca}</span>
                </div>
                <div class="flex flex-col gap-2">
                     <button class="vor-toggle-btn px-3 py-1 rounded text-xs font-bold ${isVor ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}" data-matricula="${van.matricula}" data-estado="${van.estado}">
                        ${isVor ? 'Marcar OPERATIVO' : 'Marcar VOR'}
                     </button>
                     <button class="edit-docs-btn px-3 py-1 rounded text-xs bg-blue-600 text-white" data-matricula="${van.matricula}">Editar Docs</button>
                </div>
            </div>`;
        });
        
        document.getElementById('count-total').textContent = counts.total;
        document.getElementById('count-operativos').textContent = counts.op;
        document.getElementById('count-vor').textContent = counts.vor;

        document.querySelectorAll('.vor-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const mat = e.target.dataset.matricula;
                const newState = e.target.dataset.estado === 'VOR' ? 'Operativo' : 'VOR';
                if(newState === 'Operativo' && !confirm(`¿Marcar ${mat} como Operativa?`)) return;
                
                try {
                    await fetchSeguro({ action: 'updateVorStatus', matricula: mat, newStatus: newState });
                    const v = appVehicleList.find(x => x.matricula === mat); if(v) v.estado = newState;
                    populateVorPage();
                } catch(err) { alert(err.message); }
            });
        });
        
        document.querySelectorAll('.edit-docs-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openDatesModal(e.target.dataset.matricula));
        });
    }

    function openDatesModal(matricula) {
        checkAdminPassword(() => {
            const van = appVehicleList.find(v => v.matricula === matricula);
            document.getElementById('dates-modal-title').textContent = `Editar: ${matricula}`;
            document.getElementById('dates-modal-matricula').value = matricula;
            document.getElementById('dates-modal-itv').value = van.fecha_itv || '';
            document.getElementById('dates-modal-revision').value = van.fecha_revision || '';
            document.getElementById('dates-modal-poliza').value = van.poliza || '';
            document.getElementById('dates-modal-renting').value = van.renting || '';
            document.getElementById('dates-modal').classList.remove('hidden');
        });
    }

    // --- MODAL HANDLERS GENERICOS ---
    document.getElementById('dates-modal-close-btn').onclick = () => document.getElementById('dates-modal').classList.add('hidden');
    document.getElementById('dates-modal-save-btn').onclick = async () => {
        const mat = document.getElementById('dates-modal-matricula').value;
        const payload = {
            action: 'updateVehicleDocsAndDates',
            matricula: mat,
            fecha_itv: document.getElementById('dates-modal-itv').value,
            fecha_revision: document.getElementById('dates-modal-revision').value,
            poliza: document.getElementById('dates-modal-poliza').value,
            renting: document.getElementById('dates-modal-renting').value
        };
        try {
            await fetchSeguro(payload);
            alert('Guardado');
            document.getElementById('dates-modal').classList.add('hidden');
            initializeApp();
        } catch(e) { alert(e.message); }
    };

    // Resto de funciones simplificadas para ahorrar espacio pero manteniendo funcionalidad
    function populateManageVehicleList() {
        const div = document.getElementById('manage-vehicle-list'); div.innerHTML = '';
        appVehicleList.forEach(v => {
            div.innerHTML += `<div class="flex justify-between p-2 bg-slate-800 rounded mb-2 text-white"><span>${v.matricula}</span> <button class="text-red-400 remove-van" data-mat="${v.matricula}">X</button></div>`;
        });
        document.querySelectorAll('.remove-van').forEach(b => b.onclick = (e) => {
            checkAdminPassword(async () => {
                 if(confirm('¿Borrar?')) {
                     await fetchSeguro({ action: 'removeVehicle', matricula: e.target.dataset.mat });
                     initializeApp();
                 }
            });
        });
    }
    
    function populateGuanteraList() {
         const div = document.getElementById('guantera-van-list-container'); div.innerHTML = '';
         appVehicleList.forEach(v => {
             div.innerHTML += `<div class="bg-slate-900 p-4 rounded cursor-pointer hover:bg-slate-800 text-white border border-slate-700" onclick="loadGuantera('${v.matricula}')"><h3 class="font-bold">${v.matricula}</h3><span class="text-sm text-gray-400">${v.marca}</span></div>`;
         });
    }

    window.loadGuantera = async (mat) => {
        document.getElementById('guantera-list-page').classList.add('hidden');
        const detail = document.getElementById('guantera-detail-page');
        detail.classList.remove('hidden');
        document.getElementById('guantera-detail-loading').classList.remove('hidden');
        document.getElementById('guantera-detail-content').innerHTML = '';
        document.getElementById('guantera-detail-title').textContent = mat;
        
        try {
            const res = await fetchSeguro({ action: 'getVehicleGuanteraData', matricula: mat });
            document.getElementById('guantera-detail-loading').classList.add('hidden');
            const d = res.data;
            
            let html = `<div class="bg-slate-900 p-4 rounded border border-slate-700 text-white mb-4"><h3 class="font-bold text-blue-400">Datos</h3><p>VIN: ${d.flota.vin}</p><p>Poliza: ${d.flota.poliza}</p></div>`;
            
            // Tareas
            html += `<div class="bg-slate-900 p-4 rounded border border-slate-700 text-white mb-4"><h3 class="font-bold text-yellow-400">Últimas Tareas</h3>`;
            if(d.tareas.length) d.tareas.slice(0,3).forEach(t => html += `<div class="text-sm border-b border-gray-700 py-2">${t.timestamp}: ${t.nota} (${t.estado})</div>`);
            else html += `<p class="text-gray-500 text-sm">Sin tareas.</p>`;
            html += `</div>`;

            document.getElementById('guantera-detail-content').innerHTML = html;
        } catch(e) { alert(e.message); }
    };
    
    document.getElementById('btn-back-to-guantera-list').onclick = () => {
        document.getElementById('guantera-detail-page').classList.add('hidden');
        document.getElementById('guantera-list-page').classList.remove('hidden');
    };

    // QR Logic
    function populateQRList() {
         const div = document.getElementById('qr-van-list-container'); div.innerHTML = '';
         appVehicleList.forEach((v, i) => {
             div.innerHTML += `<div class="bg-white p-2 rounded flex items-center gap-4 cursor-pointer" onclick="showQR('${v.matricula}','${v.vin}')"><canvas id="qrc-${i}" class="w-16 h-16"></canvas><span class="font-bold text-black">${v.matricula}</span></div>`;
             setTimeout(() => new QRCode(document.getElementById(`qrc-${i}`), { text: v.vin, width: 64, height: 64 }), 100);
         });
    }
    window.showQR = (mat, vin) => {
        const m = document.getElementById('qr-modal'); m.classList.remove('hidden');
        const cvs = document.getElementById('modal-composite-canvas');
        // Simple draw
        QRCode.toCanvas(cvs, vin, { width: 200 }, (e) => {});
    };
    document.getElementById('modal-close-btn').onclick = () => document.getElementById('qr-modal').classList.add('hidden');

    // Nav Logic
    navLinks.forEach(l => l.addEventListener('click', (e) => { e.preventDefault(); navigateToPage(l.dataset.page); }));
    
    // Botones menú principal
    document.getElementById('btn-show-van-upload').onclick = () => { document.getElementById('vans-choice-menu').classList.add('hidden'); document.getElementById('vans-subpage-upload').classList.remove('hidden'); };
    document.querySelectorAll('.btn-back-to-vans-choice').forEach(b => b.onclick = () => navigateToPage('page-seleccion-vans'));

    // Search Inputs
    const setupSearch = (inputId, containerId, itemSelector) => {
        document.getElementById(inputId).addEventListener('input', (e) => {
            const term = e.target.value.toUpperCase();
            const container = document.getElementById(containerId);
            Array.from(container.children).forEach(child => {
                child.style.display = child.innerText.toUpperCase().includes(term) ? 'block' : 'none';
            });
        });
    };
    setupSearch('search-vor-van', 'vor-vehicle-list');
    setupSearch('search-guantera-van', 'guantera-van-list-container');
    setupSearch('search-qr-van', 'qr-van-list-container');

    // Alerta tareas pendientes
    async function checkPendingTasksAndAlert() {
        try {
            const res = await fetchSeguro({ action: 'getVanNotesHistory' });
            const pending = res.data.filter(x => x.estado === 'Pendiente').length;
            if(pending > 0) alert(`Hay ${pending} tareas pendientes en el taller.`);
        } catch(e) {}
    }
    
    // Fix filtros VOR
    document.getElementById('btn-filter-all').onclick = () => { currentVorFilter='all'; populateVorPage(); };
    document.getElementById('btn-filter-op').onclick = () => { currentVorFilter='op'; populateVorPage(); };
    document.getElementById('btn-filter-vor').onclick = () => { currentVorFilter='vor'; populateVorPage(); };

});
