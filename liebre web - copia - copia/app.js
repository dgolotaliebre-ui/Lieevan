document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES ---
    // !!! IMPORTANTE: Pega aquí tu URL de Google Apps Script !!!
    const GAPS_URL = 'https://script.google.com/macros/s/AKfycbwEyozAk98y_r4Y3MZDYk5f6S-IguJSzMsUC2B069WTgJZKKg7AmJeTVob7c0NDKIZrtg/exec'; 
    
    let appVehicleList = []; 
    let vanPhotoStore = {};
    let vanHistoryDataStore = {};
    let tireHistoryDataStore = {};
    let stockDataStore = []; 
    let authToken = null;
    let currentVorFilter = 'all'; 

    // Almacena los items seleccionados para restar stock por matrícula
    let pendingStockDeductions = {}; 

    let rentalHistoryDataStore = []; 
    let rentalSinglePhotoStore = {}; 
    let rentalDamagePhotoStore = []; 

    let accidentHistoryDataStore = []; 
    let accidentPartePhotoStore = null; 
    let accidentDamagePhotoStore = []; 

    let docPhotoStore = {}; 
    const placeholderImg = 'https://placehold.co/400x300/374151/E5E7EB?text=Sin+Imagen';


    // --- SELECTORES GLOBALES ---
    
    // App
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    const appContainer = document.getElementById('app-container');
    const globalVisitCounter = document.getElementById('global-visit-counter');
    
    // Login
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginButton = document.getElementById('login-button');
    const passwordInput = document.getElementById('password-input');
    const loginStatus = document.getElementById('login-status');

    // Navegación
    const navLinks = document.querySelectorAll('.nav-link');
    const pageContents = document.querySelectorAll('.page-content');

    // Página 1: Selección Vans
    const vanListContainer = document.getElementById('van-list-container');
    const searchInput = document.getElementById('search-van');
    const noResultsMessage = document.getElementById('no-results-message');
    const vansChoiceMenu = document.getElementById('vans-choice-menu');
    const vanUploadSection = document.getElementById('vans-subpage-upload');
    const vanGallerySection = document.getElementById('vans-subpage-gallery');
    const vanStockSection = document.getElementById('vans-subpage-stock'); 
    const btnShowVanUpload = document.getElementById('btn-show-van-upload');
    const btnShowVanGallery = document.getElementById('btn-show-van-gallery');
    const btnShowStock = document.getElementById('btn-show-stock'); 
    const btnsBackToVansChoice = document.querySelectorAll('.btn-back-to-vans-choice');

    // Página 1: Historial Vans
    const vanHistoryListContainer = document.getElementById('van-history-list-container');
    const vanHistoryDetailPage = document.getElementById('van-history-detail-page');
    const vanHistoryLoadingMessage = document.getElementById('history-loading-message');
    const vanHistoryNoResults = document.getElementById('van-history-no-results');
    const vanHistoryDetailContent = document.getElementById('van-history-detail-content');
    const vanHistoryDetailTitle = document.getElementById('van-history-detail-title');
    const btnBackToHistoryList = document.getElementById('btn-back-to-history-list');
    const searchVanHistoryInput = document.getElementById('search-van-history');
    
    // Página 1: Stock
    const stockListContainer = document.getElementById('stock-list-container');
    const stockForm = document.getElementById('stock-form');
    const stockNameInput = document.getElementById('stock-name');
    const stockQuantityInput = document.getElementById('stock-quantity');
    const stockSaveBtn = document.getElementById('stock-save-btn');
    const stockStatusMessage = document.getElementById('stock-status-message');
    const stockListLoading = document.getElementById('stock-list-loading');
    const searchStockInput = document.getElementById('search-stock');

    // Página 2: QR Vans
    const qrListContainer = document.getElementById('qr-van-list-container');
    const searchQrInput = document.getElementById('search-qr-van');
    const qrNoResultsMessage = document.getElementById('qr-no-results-message');
    const qrModal = document.getElementById('qr-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCompositeCanvas = document.getElementById('modal-composite-canvas');
    const modalShareBtn = document.getElementById('modal-share-btn');

    // Página 3: Neumáticos
    const neumaticosChoiceMenu = document.getElementById('neumaticos-choice-menu');
    const neumaticosUploadSubpage = document.getElementById('neumaticos-subpage-upload');
    const neumaticosGallerySubpage = document.getElementById('neumaticos-subpage-gallery');
    const btnShowUpload = document.getElementById('btn-show-upload');
    const btnShowGallery = document.getElementById('btn-show-gallery');
    const btnsBackToNeumaticosChoice = document.querySelectorAll('.btn-back-to-neumaticos-choice');
    const matriculaListContainer = document.getElementById('matricula-list-neumaticos');
    const matriculaHiddenInput = document.getElementById('matricula-hidden-neumaticos');
    const matriculaSearch = document.getElementById('search-matricula-neumaticos');
    const matriculaNoResults = document.getElementById('matricula-no-results-neumaticos');
    const tireUploadForm = document.getElementById('tire-upload-form');
    const tireSubmitButton = document.getElementById('submit-button-neumaticos');
    const tireStatusMessage = document.getElementById('status-message-neumaticos');
    let allMatriculaBtns = [];
    
    // Página 3: Historial Neumáticos
    const tireHistoryListContainer = document.getElementById('tire-history-list-container');
    const tireHistoryDetailPage = document.getElementById('tire-history-detail-page');
    const tireHistoryLoadingMessage = document.getElementById('tire-history-loading-message');
    const tireHistoryNoResults = document.getElementById('tire-history-no-results');
    const tireHistoryDetailContent = document.getElementById('tire-history-detail-content');
    const tireHistoryDetailTitle = document.getElementById('tire-history-detail-title');
    const btnBackToTireList = document.getElementById('btn-back-to-tire-list');
    const searchTireHistoryInput = document.getElementById('search-tire-history');

    // Página 5: Registro Alquiler
    const alquilerChoiceMenu = document.getElementById('alquiler-choice-menu');
    const alquilerUploadSubpage = document.getElementById('alquiler-subpage-upload');
    const alquilerGallerySubpage = document.getElementById('alquiler-subpage-gallery');
    const btnShowRentalUploadEntrega = document.getElementById('btn-show-rental-upload-entrega');
    const btnShowRentalUploadDevolucion = document.getElementById('btn-show-rental-upload-devolucion');
    const btnShowRentalGallery = document.getElementById('btn-show-rental-gallery');
    const btnsBackToAlquilerChoice = document.querySelectorAll('.btn-back-to-alquiler-choice');
    const rentalUploadForm = document.getElementById('rental-upload-form');
    const rentalUploadTitle = document.getElementById('rental-upload-title'); 
    const rentalTipoRegistro = document.getElementById('rental-tipo-registro'); 
    const rentalMatriculaInput = document.getElementById('rental-matricula');
    const rentalDamagePhotosContainer = document.getElementById('rental-damage-photos-container');
    const rentalDamagePhotoInput = document.getElementById('file-rental-damage');
    const rentalDescripcionDanos = document.getElementById('rental-descripcion-danos');
    const rentalStatusMessage = document.getElementById('status-message-alquiler');
    const rentalSubmitButton = document.getElementById('submit-button-alquiler');
    // Historial Alquiler
    const rentalHistoryListContainer = document.getElementById('rental-history-list-container');
    const rentalHistoryDetailPage = document.getElementById('rental-history-detail-page');
    const rentalHistoryLoadingMessage = document.getElementById('rental-history-loading-message');
    const rentalHistoryNoResults = document.getElementById('rental-history-no-results');
    const rentalHistoryDetailContent = document.getElementById('rental-history-detail-content');
    const rentalHistoryDetailTitle = document.getElementById('rental-history-detail-title');
    const btnBackToRentalList = document.getElementById('btn-back-to-rental-list');
    const searchRentalHistoryInput = document.getElementById('search-rental-history');

    // Página 7: Accidentes
    const accidentesChoiceMenu = document.getElementById('accidentes-choice-menu');
    const accidentesUploadSubpage = document.getElementById('accidentes-subpage-upload');
    const accidentesGallerySubpage = document.getElementById('accidentes-subpage-gallery');
    const btnShowAccidentUpload = document.getElementById('btn-show-accident-upload');
    const btnShowAccidentGallery = document.getElementById('btn-show-accident-gallery');
    const btnsBackToAccidentesChoice = document.querySelectorAll('.btn-back-to-accidentes-choice');
    const accidentUploadForm = document.getElementById('accident-upload-form');
    const accidentMatriculaInput = document.getElementById('accident-matricula');
    const accidentConductorInput = document.getElementById('accident-conductor');
    const accidentPartePhotoInput = document.getElementById('file-accident-parte');
    const accidentPartePreview = document.getElementById('preview-accident-parte');
    const accidentDamagePhotosContainer = document.getElementById('accident-damage-photos-container');
    const accidentDamagePhotoInput = document.getElementById('file-accident-damage');
    const accidentDescripcion = document.getElementById('accident-descripcion');
    const accidentStatusMessage = document.getElementById('status-message-accidentes');
    const accidentSubmitButton = document.getElementById('submit-button-accidentes');
    // Historial Accidentes
    const accidentHistoryListContainer = document.getElementById('accident-history-list-container');
    const accidentHistoryDetailPage = document.getElementById('accident-history-detail-page');
    const accidentHistoryLoadingMessage = document.getElementById('accident-history-loading-message');
    const accidentHistoryNoResults = document.getElementById('accident-history-no-results');
    const accidentHistoryDetailContent = document.getElementById('accident-history-detail-content');
    const accidentHistoryDetailTitle = document.getElementById('accident-history-detail-title');
    const btnBackToAccidentList = document.getElementById('btn-back-to-accident-list');
    const searchAccidentHistoryInput = document.getElementById('search-accident-history');

    // Página 6: Gestionar Flota
    const addVehicleForm = document.getElementById('add-vehicle-form');
    const addVehicleButton = document.getElementById('add-vehicle-button');
    const addVehicleStatus = document.getElementById('add-vehicle-status');
    const manageVehicleList = document.getElementById('manage-vehicle-list');
    const searchManageInput = document.getElementById('search-manage-van');
    const manageNoResults = document.getElementById('manage-no-results-message');

    // Página 1: VOR
    const vorVehicleList = document.getElementById('vor-vehicle-list');
    const countTotal = document.getElementById('count-total');
    const countOperativos = document.getElementById('count-operativos');
    const countVor = document.getElementById('count-vor');
    const searchVorInput = document.getElementById('search-vor-van');
    const vorNoResultsMessage = document.getElementById('vor-no-results-message');
    const btnFilterAll = document.getElementById('btn-filter-all');
    const btnFilterOp = document.getElementById('btn-filter-op');
    const btnFilterVor = document.getElementById('btn-filter-vor');

    // Página Guantera
    const guanteraListPage = document.getElementById('guantera-list-page');
    const guanteraDetailPage = document.getElementById('guantera-detail-page');
    const searchGuanteraInput = document.getElementById('search-guantera-van');
    const guanteraVanListContainer = document.getElementById('guantera-van-list-container');
    const guanteraNoResults = document.getElementById('guantera-no-results');
    const btnBackToGuanteraList = document.getElementById('btn-back-to-guantera-list');
    const guanteraDetailTitle = document.getElementById('guantera-detail-title');
    const guanteraDetailLoading = document.getElementById('guantera-detail-loading');
    const guanteraDetailContent = document.getElementById('guantera-detail-content');

    // Modal Edición Tareas
    const editModal = document.getElementById('edit-modal');
    const editModalCloseBtn = document.getElementById('edit-modal-close-btn');
    const editModalSaveBtn = document.getElementById('edit-modal-save-btn');
    const editModalNote = document.getElementById('edit-modal-note');
    const editModalRecambios = document.getElementById('edit-modal-recambios');
    const editModalTimestamp = document.getElementById('edit-modal-timestamp');
    const editModalStatus = document.getElementById('edit-modal-status');
    
    // Modal Edición Fechas
    const datesModal = document.getElementById('dates-modal');
    const datesModalTitle = document.getElementById('dates-modal-title');
    const datesModalCloseBtn = document.getElementById('dates-modal-close-btn');
    const datesModalSaveBtn = document.getElementById('dates-modal-save-btn');
    const datesModalItv = document.getElementById('dates-modal-itv');
    const datesModalRevision = document.getElementById('dates-modal-revision');
    const datesModalMatricula = document.getElementById('dates-modal-matricula');
    const datesModalStatus = document.getElementById('dates-modal-status');
    const previewDatesPermiso = document.getElementById('preview-dates-permiso');
    const previewDatesFicha = document.getElementById('preview-dates-ficha');
    const fileDatesPermiso = document.getElementById('file-dates-permiso');
    const fileDatesFicha = document.getElementById('file-dates-ficha');
    const datesModalPoliza = document.getElementById('dates-modal-poliza');
    const datesModalRenting = document.getElementById('dates-modal-renting');

    // Modal Sugerencias
    const suggestionFab = document.getElementById('suggestion-fab');
    const suggestionModal = document.getElementById('suggestion-modal');
    const suggestionModalCloseBtn = document.getElementById('suggestion-modal-close-btn');
    const suggestionForm = document.getElementById('suggestion-form');
    const suggestionModalName = document.getElementById('suggestion-modal-name');
    const suggestionModalIdea = document.getElementById('suggestion-modal-idea');
    const suggestionModalSaveBtn = document.getElementById('suggestion-modal-save-btn');
    const suggestionModalStatus = document.getElementById('suggestion-modal-status');
    const suggestionLoading = document.getElementById('suggestion-loading');
    const suggestionListContainer = document.getElementById('suggestion-list-container');
    const suggestionVisitCounter = document.getElementById('suggestion-visit-counter');

    // Modal Ayuda
    const helpFab = document.getElementById('help-fab');
    const helpModal = document.getElementById('help-modal');
    const helpModalCloseBtn = document.getElementById('help-modal-close-btn');


    // --- FUNCIONES AUXILIARES ---
    
    function checkAdminPassword(onConfirm) {
        const adminPass = prompt("Acción de administrador. Por favor, introduce la contraseña:");
        if (adminPass === null) return;
        if (adminPass === 'Liebre') {
            onConfirm();
        } else {
            alert("Contraseña incorrecta. Acción cancelada.");
        }
    }

    function showLoginStatus(message, type) {
        loginStatus.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600', 'text-white');
        loginStatus.textContent = message;
        if (type === 'success') loginStatus.classList.add('bg-green-600', 'text-white');
        else if (type === 'error') loginStatus.classList.add('bg-red-600', 'text-white');
        else if (type === 'loading') loginStatus.classList.add('bg-blue-600', 'text-white');
        loginStatus.classList.remove('hidden');
    }

    async function fetchSeguro(payload) {
        if (!authToken) {
            alert('Sesión caducada. Por favor, recarga la página.');
            location.reload();
            throw new Error('Sesión caducada.');
        }
        const fullPayload = { ...payload, authToken: authToken };
        const response = await fetch(GAPS_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            body: JSON.stringify(fullPayload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        if (!response.ok) throw new Error(`Error del servidor: ${response.statusText}`);
        const result = await response.json();
        if (result.status !== 'success') {
             if (response.status === 401 || (result.message && result.message.includes('Token'))) {
                alert('Tu sesión ha caducado. Por favor, inicia sesión de nuevo.');
                location.reload();
            }
            throw new Error(result.message);
        }
        return result;
    }

    function capitalize(str) {
        if (!str) return 'No especificada';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    function navigateToPage(pageId) {
        pageContents.forEach(page => { page.classList.add('hidden'); });
        navLinks.forEach(nav => {
            nav.classList.remove('text-white', 'font-semibold', 'border-blue-500');
            nav.classList.add('text-gray-400', 'font-medium', 'border-transparent', 'hover:border-blue-400');
        });

        const targetPage = document.getElementById(pageId);
        if (targetPage) { targetPage.classList.remove('hidden'); }

        const targetNavLink = document.getElementById(`nav-link-${pageId}`);
        if (targetNavLink) {
            targetNavLink.classList.remove('text-gray-400', 'font-medium', 'border-transparent', 'hover:border-blue-400');
            targetNavLink.classList.add('text-white', 'font-semibold', 'border-blue-500');
        }

        if (pageId === 'page-operativa-vor') {
            populateVorPage(); 
        }
        
        if (pageId === 'page-guantera') {
            guanteraDetailPage.classList.add('hidden');
            guanteraListPage.classList.remove('hidden');
            populateGuanteraList();
        }

        if (pageId === 'page-seleccion-vans') {
            vanUploadSection.classList.add('hidden');
            vanGallerySection.classList.add('hidden');
            vanHistoryDetailPage.classList.add('hidden');
            vanStockSection.classList.add('hidden'); 
            vansChoiceMenu.classList.remove('hidden');
        }
        
        if (pageId === 'page-neumaticos') {
            neumaticosUploadSubpage.classList.add('hidden');
            neumaticosGallerySubpage.classList.add('hidden');
            tireHistoryDetailPage.classList.add('hidden');
            neumaticosChoiceMenu.classList.remove('hidden');
        }

        if (pageId === 'page-registro-alquiler') {
            alquilerUploadSubpage.classList.add('hidden');
            alquilerGallerySubpage.classList.add('hidden');
            rentalHistoryDetailPage.classList.add('hidden');
            alquilerChoiceMenu.classList.remove('hidden');
        }
        
        if (pageId === 'page-accidentes') {
             accidentesUploadSubpage.classList.add('hidden');
             accidentesGallerySubpage.classList.add('hidden');
             accidentHistoryDetailPage.classList.add('hidden');
             accidentesChoiceMenu.classList.remove('hidden');
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
                    const timestamp = new Date().toLocaleString('es-ES', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });
                    let fontSize = Math.max(24, img.width / 50);
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.fillStyle = '#FFFF00'; ctx.strokeStyle = 'black';
                    ctx.lineWidth = Math.max(1, fontSize / 12);
                    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                    const padding = fontSize;
                    ctx.strokeText(timestamp, padding, canvas.height - padding);
                    ctx.fillText(timestamp, padding, canvas.height - padding);
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                };
                img.onerror = (err) => reject(err);
                img.src = event.target.result;
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    function checkDateStatus(dateString) {
        if (!dateString || dateString.toLowerCase() === 'dd/mm/aaaa' || dateString.trim() === '') {
            return { text: 'Sin fecha', color: 'text-gray-500' };
        }
        try {
            const parts = dateString.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
            if (!parts) return { text: dateString, color: 'text-red-400' }; 
            const day = parseInt(parts[1], 10);
            const month = parseInt(parts[2], 10) - 1; 
            const year = parseInt(parts[3], 10);
            const date = new Date(year, month, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            const timeDiff = date.getTime() - today.getTime();
            const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            let color = 'text-green-400'; 
            if (dayDiff < 0) color = 'text-red-400'; 
            else if (dayDiff <= 30) color = 'text-yellow-400'; 
            return { text: dateString, color: color };
        } catch (e) {
            return { text: dateString, color: 'text-red-400' }; 
        }
    }


    // --- FUNCIONES DE LA APP ---

    function populateVanSelectionList() {
        vanListContainer.innerHTML = '';
        appVehicleList.forEach(van => {
            let plateRaw = van.matricula;
            let plateFormatted = `${plateRaw.slice(0, 4)} ${plateRaw.slice(4)}`;
            let brand = van.marca;
            vanPhotoStore[plateRaw] = [];
            pendingStockDeductions[plateRaw] = []; 

            const vanCardHTML = `
            <div class="van-card bg-slate-800/50 p-4 md:p-5 rounded-xl border border-slate-700 shadow-lg" data-matricula-raw="${plateRaw}" data-matricula-formatted="${plateFormatted}">
                <div> <h3 class="van-plate text-xl font-bold text-white">${plateFormatted}</h3> <p class="text-sm font-medium text-blue-400 mb-2">${capitalize(brand)}</p> </div>
                <div class="mt-4 space-y-4">
                    <div>
                        <label for="note-${plateRaw}" class="block text-sm font-medium text-gray-300 mb-1">Notas (Tarea Pendiente):</label>
                        <textarea id="note-${plateRaw}" rows="2" class="w-full text-sm px-3 py-2 bg-slate-700/70 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Añadir nota (ej: golpe en la puerta...)"></textarea>
                    </div>
                    
                    <div class="relative">
                        <label for="recambios-${plateRaw}" class="block text-sm font-medium text-gray-300 mb-1">Recambios:</label>
                        <textarea id="recambios-${plateRaw}" rows="2" class="recambios-input w-full text-sm px-3 py-2 bg-slate-700/70 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Escribe para buscar recambios..." data-matricula="${plateRaw}" autocomplete="off"></textarea>
                        
                        <ul id="suggestions-${plateRaw}" class="absolute z-20 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-40 overflow-y-auto hidden mt-1"></ul>
                        
                        <div id="deduction-tags-${plateRaw}" class="flex flex-wrap gap-2 mt-2 min-h-[1.5rem]"></div>
                    </div>

                    <div id="photos-container-${plateRaw}" class="grid grid-cols-3 gap-2"></div>
                    <input type="file" id="file-input-${plateRaw}" class="van-photo-input hidden" accept="image/*" capture="environment" data-matricula-raw="${plateRaw}">
                    <label for="file-input-${plateRaw}" class="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md font-semibold cursor-pointer transition-all hover:bg-blue-700"> 📸 Añadir Foto </label>
                    <div id="status-van-${plateRaw}" class="van-status-message hidden mt-2 p-3 rounded-lg text-center text-sm font-medium"></div>
                    <button class="save-van-data-btn w-full text-md font-bold py-3 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-xl transition duration-300" data-matricula-raw="${plateRaw}"> Guardar Tarea Pendiente </button>
                </div>
            </div>`;
            vanListContainer.innerHTML += vanCardHTML;
        });
        assignVanCardListeners();
    }

    function assignVanCardListeners() {
        document.querySelectorAll('.van-photo-input').forEach(input => {
            input.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) return;
                const matricula = event.target.dataset.matriculaRaw;
                const timestampedDataUrl = await addTimestampToImage(file);
                vanPhotoStore[matricula].push(timestampedDataUrl);
                const photoContainer = document.getElementById(`photos-container-${matricula}`);
                const previewImg = document.createElement('img');
                previewImg.src = timestampedDataUrl;
                previewImg.className = 'w-full h-24 object-cover rounded-md';
                photoContainer.appendChild(previewImg);
                event.target.value = null;
            });
        });

        // Listener para Autocompletado
        document.querySelectorAll('.recambios-input').forEach(input => {
            input.addEventListener('input', (event) => {
                const matricula = event.target.dataset.matricula;
                const val = event.target.value;
                const lastWord = val.split(/,\s*|\s+/).pop(); 
                const suggestionsList = document.getElementById(`suggestions-${matricula}`);
                
                suggestionsList.innerHTML = '';
                
                if (lastWord.length < 2 || stockDataStore.length === 0) {
                    suggestionsList.classList.add('hidden');
                    return;
                }

                const matches = stockDataStore.filter(item => 
                    item.nombre.toLowerCase().includes(lastWord.toLowerCase()) && item.cantidad > 0
                );

                if (matches.length > 0) {
                    suggestionsList.classList.remove('hidden');
                    matches.forEach(match => {
                        const li = document.createElement('li');
                        li.className = "px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-gray-200 flex justify-between";
                        li.innerHTML = `<span>${match.nombre}</span> <span class="text-amber-400 text-xs font-bold">Stock: ${match.cantidad}</span>`;
                        
                        li.addEventListener('click', () => {
                            // Añadir texto al textarea
                            const currentText = input.value;
                            const newText = currentText.substring(0, currentText.lastIndexOf(lastWord)) + match.nombre + ", ";
                            input.value = newText;
                            
                            // Añadir a lista de deducción
                            addStockDeduction(matricula, match.nombre);
                            
                            suggestionsList.classList.add('hidden');
                            input.focus();
                        });
                        suggestionsList.appendChild(li);
                    });
                } else {
                    suggestionsList.classList.add('hidden');
                }
            });

            // Ocultar lista si se hace clic fuera
            input.addEventListener('blur', () => {
                setTimeout(() => { 
                    const suggestionsList = document.getElementById(`suggestions-${input.dataset.matricula}`);
                    if(suggestionsList) suggestionsList.classList.add('hidden');
                }, 200);
            });
        });

        document.querySelectorAll('.save-van-data-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const matricula = event.target.dataset.matriculaRaw;
                handleVanDataSave(matricula, event.target);
            });
        });
    }

    function addStockDeduction(matricula, itemName) {
        pendingStockDeductions[matricula].push(itemName);
        renderDeductionTags(matricula);
    }

    function removeStockDeduction(matricula, index) {
        pendingStockDeductions[matricula].splice(index, 1);
        renderDeductionTags(matricula);
    }

    function renderDeductionTags(matricula) {
        const container = document.getElementById(`deduction-tags-${matricula}`);
        container.innerHTML = '';
        
        pendingStockDeductions[matricula].forEach((item, index) => {
            const tag = document.createElement('span');
            tag.className = "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-900/50 text-amber-200 border border-amber-700/50";
            tag.innerHTML = `
                ${item} (-1)
                <button type="button" class="ml-1 text-amber-400 hover:text-white focus:outline-none" aria-label="Quitar">
                    &times;
                </button>
            `;
            tag.querySelector('button').addEventListener('click', () => {
                removeStockDeduction(matricula, index);
            });
            container.appendChild(tag);
        });
    }

    async function handleVanDataSave(matricula, buttonElement) {
        const note = document.getElementById(`note-${matricula}`).value;
        const recambios = document.getElementById(`recambios-${matricula}`).value;
        const dataUrls = vanPhotoStore[matricula];
        const stockToDeduct = pendingStockDeductions[matricula] || [];

        if (!note) {
            showVanCardStatus(matricula, 'La nota es obligatoria.', 'error');
            setTimeout(() => document.getElementById(`status-van-${matricula}`).classList.add('hidden'), 3000);
            return;
        }

        showVanCardStatus(matricula, 'Guardando tarea...', 'loading');
        buttonElement.disabled = true;

        try {
            const photoPayloads = dataUrls.map((dataUrl, index) => {
                return {
                    fileName: `${matricula}_nota_${index + 1}.jpg`,
                    mimeType: 'image/jpeg',
                    data: dataUrl.split(',')[1]
                };
            });
            
            const payload = {
                action: 'saveVanNote', 
                matricula: matricula, 
                note: note, 
                recambios: recambios, 
                photos: photoPayloads,
                usedStockItems: stockToDeduct // Enviar items a restar
            };
            
            const result = await fetchSeguro(payload);

            if (result.status === 'success') {
                showVanCardStatus(matricula, '¡Tarea guardada! Stock se restará al completar.', 'success');
                
                // Limpiar todo
                vanPhotoStore[matricula] = [];
                pendingStockDeductions[matricula] = [];
                document.getElementById(`photos-container-${matricula}`).innerHTML = '';
                document.getElementById(`deduction-tags-${matricula}`).innerHTML = '';
                document.getElementById(`note-${matricula}`).value = '';
                document.getElementById(`recambios-${matricula}`).value = '';
                
            } else {
                showVanCardStatus(matricula, `Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showVanCardStatus(matricula, `Error: ${error.message}`, 'error');
        } finally {
            buttonElement.disabled = false;
            setTimeout(() => document.getElementById(`status-van-${matricula}`).classList.add('hidden'), 3000);
        }
    }

    function showVanCardStatus(matricula, message, type) {
        const statusEl = document.getElementById(`status-van-${matricula}`);
        statusEl.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600', 'text-white');
        statusEl.textContent = message;
        if (type === 'success') statusEl.classList.add('bg-green-600', 'text-white');
        else if (type === 'error') statusEl.classList.add('bg-red-600', 'text-white');
        else if (type === 'loading') statusEl.classList.add('bg-blue-600', 'text-white');
        statusEl.classList.remove('hidden');
    }

    async function loadVanHistory() {
        vanHistoryListContainer.innerHTML = '';
        vanHistoryDetailPage.classList.add('hidden');
        document.getElementById('van-history-list-page').classList.remove('hidden');
        vanHistoryLoadingMessage.classList.remove('hidden');
        vanHistoryNoResults.classList.add('hidden');

        vanHistoryDataStore = {};

        try {
            const result = await fetchSeguro({ action: 'getVanNotesHistory' });
            vanHistoryLoadingMessage.classList.add('hidden');
            if (result.status !== 'success') { throw new Error(result.message); }

            result.data.forEach(entry => {
                if (!vanHistoryDataStore[entry.matricula]) {
                    vanHistoryDataStore[entry.matricula] = [];
                }
                vanHistoryDataStore[entry.matricula].push(entry);
            });

            if (Object.keys(vanHistoryDataStore).length === 0) {
                vanHistoryNoResults.classList.remove('hidden');
                vanHistoryNoResults.textContent = 'No hay entradas en el historial.';
                return;
            }

            for (const matricula in vanHistoryDataStore) {
                const entries = vanHistoryDataStore[matricula];
                const latestEntry = entries[0];
                const entryCount = entries.length;

                const pendingCount = entries.filter(e => !e.estado || e.estado.toLowerCase() === 'pendiente').length;
                
                let pendingHtml = '';
                if (pendingCount > 0) {
                    pendingHtml = `<span class="ml-2 px-2 py-0.5 text-xs font-bold text-black bg-amber-400 rounded-full">${pendingCount} PENDIENTE${pendingCount > 1 ? 'S' : ''}</span>`;
                }


                const summaryCardHTML = `
                <div class="van-history-summary-card bg-slate-800/50 p-4 rounded-xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-all" data-matricula="${matricula}">
                    <div class="flex justify-between items-center mb-2">
                        <div>
                            <span class="font-bold text-lg text-blue-300">${matricula}</span>
                            ${pendingHtml}
                        </div>
                        <div class="text-right">
                            <span class="text-sm font-medium text-gray-300">${entryCount} ${entryCount > 1 ? 'entradas' : 'entrada'}</span>
                            <span class="block text-blue-400 text-sm">Ver historial &rarr;</span>
                        </div>
                    </div>
                     <span class="block text-xs text-gray-400">Última act.: ${latestEntry.timestamp}</span>
                </div>
                `;
                vanHistoryListContainer.innerHTML += summaryCardHTML;
            }

            document.querySelectorAll('.van-history-summary-card').forEach(card => {
                card.addEventListener('click', () => {
                    showVanHistoryDetail(card.dataset.matricula);
                });
            });
            
            const searchVanHistoryInput = document.getElementById('search-van-history');
            const allVanHistoryCards = document.querySelectorAll('#van-history-list-container .van-history-summary-card');

            searchVanHistoryInput.addEventListener('input', () => {
                const searchTerm = searchVanHistoryInput.value.toUpperCase().replace(/\s/g, '');
                let resultsFound = 0;
                allVanHistoryCards.forEach(card => {
                    const plateText = card.dataset.matricula.toUpperCase().replace(/\s/g, '');
                    if (plateText.includes(searchTerm)) {
                        card.classList.remove('hidden'); resultsFound++;
                    } else {
                        card.classList.add('hidden');
                    }
                });
                vanHistoryNoResults.classList.toggle('hidden', resultsFound > 0);
                vanHistoryNoResults.textContent = 'No se encontraron historiales con esa matrícula.';
            });

        } catch (error) {
            vanHistoryLoadingMessage.classList.add('hidden');
            vanHistoryNoResults.classList.remove('hidden');
            vanHistoryNoResults.innerHTML = `<p class="text-center text-red-400">Error al cargar el historial: ${error.message}</p>`;
        }
    }

    function showVanHistoryDetail(matricula) {
        document.getElementById('van-history-list-page').classList.add('hidden');
        vanHistoryDetailPage.classList.remove('hidden');
        vanHistoryDetailTitle.textContent = `Historial de: ${matricula}`;
        vanHistoryDetailContent.innerHTML = '';

        const entries = vanHistoryDataStore[matricula];
        if (!entries) {
            vanHistoryDetailContent.innerHTML = '<p class="text-gray-400 text-center">No se encontraron entradas para esta matrícula.</p>';
            return;
        }

        const pendingEntries = entries.filter(e => !e.estado || e.estado.toLowerCase() === 'pendiente');
        const completedEntries = entries.filter(e => e.estado && e.estado.toLowerCase() !== 'pendiente');

        
        const createCardHTML = (entry) => {
            const isPending = !entry.estado || entry.estado.toLowerCase() === 'pendiente';
            
            let fotosHTML = '';
            if (entry.fotosurls && entry.fotosurls.trim() !== '') {
                const urls = entry.fotosurls.split(/[\s,]+/); 
                fotosHTML = '<div class="flex flex-wrap gap-2 mt-2">';
                urls.forEach(thumbnailUrl => {
                    if (thumbnailUrl.startsWith('http')) {
                        let fullSizeUrl = thumbnailUrl;
                        let fileId = '';

                        if (thumbnailUrl.includes('thumbnail?id=')) {
                            fileId = thumbnailUrl.split('id=')[1];
                        } else if (thumbnailUrl.includes('/d/')) {
                            const fileIdMatch = thumbnailUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                            if (fileIdMatch && fileIdMatch[1]) {
                                fileId = fileIdMatch[1];
                            }
                        }

                        if (fileId) {
                            fullSizeUrl = `https://drive.google.com/file/d/${fileId}/view`;
                        }
                        
                        fotosHTML += `<a href="${fullSizeUrl}" target="_blank" rel="noopener noreferrer">
                                        <img src="${thumbnailUrl}" class="w-20 h-20 object-cover rounded-md border border-slate-600 hover:opacity-80">
                                      </a>`;
                    }
                });
                fotosHTML += '</div>';
            }

            // ★★★ NUEVO: Mostrar etiquetas de stock usado en el historial ★★★
            let stockTagsHTML = '';
            if (entry.items_stock && entry.items_stock.trim() !== '') {
                 try {
                     const stockItems = JSON.parse(entry.items_stock);
                     if (stockItems.length > 0) {
                         stockTagsHTML = '<div class="flex flex-wrap gap-2 mt-2">';
                         stockItems.forEach(item => {
                             stockTagsHTML += `<span class="text-xs font-medium bg-amber-900/40 text-amber-200 px-2 py-1 rounded border border-amber-700/30">${item} (-1)</span>`;
                         });
                         stockTagsHTML += '</div>';
                     }
                 } catch (e) {
                     console.error("Error parseando items_stock en historial:", e);
                 }
            }
            // --------------------------------------------------------------

            let statusBadge = '';
            let buttonGroup = '';

            if (isPending) {
                buttonGroup = `
                <div class="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <button class="complete-van-history-btn btn-history-complete" 
                            data-timestamp="${entry.timestamp}">
                        ✅ Completar
                    </button>
                    <button class="edit-van-history-btn btn-history-edit" 
                            data-timestamp="${entry.timestamp}" 
                            data-note="${entry.nota}" 
                            data-recambios="${entry.recambios}">
                        Editar
                    </button>
                    <button class="delete-van-history-btn btn-history-delete" 
                            data-timestamp="${entry.timestamp}" 
                            data-matricula="${entry.matricula}">
                        Borrar
                    </button>
                </div>
                `;
            } else {
                statusBadge = `<span class="text-xs font-medium text-green-400 bg-green-900/50 px-2 py-1 rounded-full">${entry.estado}</span>`;
                buttonGroup = `
                <div class="flex space-x-2">
                    <button class="edit-van-history-btn btn-history-edit" 
                            data-timestamp="${entry.timestamp}" 
                            data-note="${entry.nota}" 
                            data-recambios="${entry.recambios}">
                        Editar
                    </button>
                    <button class="delete-van-history-btn btn-history-delete" 
                            data-timestamp="${entry.timestamp}" 
                            data-matricula="${entry.matricula}">
                        Borrar
                    </button>
                </div>
                `;
            }

            return `
            <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700 history-entry-card">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="font-bold text-lg text-blue-300">${entry.matricula}</span>
                        <span class="block text-xs text-gray-400">${entry.timestamp}</span>
                    </div>
                    ${statusBadge}
                </div>
                <div class="space-y-2 mb-4">
                    <p><strong class="text-gray-300">Nota:</strong> <span class="data-note">${entry.nota || '---'}</span></p>
                    <p><strong class="text-gray-300">Recambios:</strong> <span class="data-recambios">${entry.recambios || '---'}</span></p>
                    ${stockTagsHTML} 
                    ${fotosHTML}
                </div>
                <div class="flex justify-end">
                    ${buttonGroup}
                </div>
            </div>
            `;
        };

        let pendingHTML = '<h3 class="text-2xl font-semibold text-amber-400 mb-4 border-b border-amber-500/30 pb-2">Tareas Pendientes</h3>';
        if (pendingEntries.length === 0) {
            pendingHTML += '<p class="text-gray-400 text-center py-4">¡No hay tareas pendientes para esta furgoneta!</p>';
        } else {
            pendingEntries.forEach(entry => {
                pendingHTML += createCardHTML(entry);
            });
        }
        vanHistoryDetailContent.innerHTML += pendingHTML;


        let completedHTML = '<h3 class="text-2xl font-semibold text-green-400 mt-10 mb-4 border-b border-green-500/30 pb-2">Historial de Tareas Completadas</h3>';
        if (completedEntries.length === 0) {
            completedHTML += '<p class="text-gray-400 text-center py-4">No hay tareas completadas en el historial.</p>';
        } else {
            completedEntries.forEach(entry => {
                completedHTML += createCardHTML(entry);
            });
        }
        vanHistoryDetailContent.innerHTML += completedHTML;

        addHistoryActionListeners();
    }

    function populateQRList() {
        qrListContainer.innerHTML = '';
        appVehicleList.forEach((van, index) => {
            const plateFormatted = `${van.matricula.slice(0, 4)} ${van.matricula.slice(4)}`;
            const canvasId = `qr-canvas-${index}`;
            const brand = van.marca;
            const brandHtml = brand ? `<p class="text-sm font-medium text-blue-400 mb-1">${capitalize(brand)}</p>` : '';
            const vanCardHTML = `
            <div class="qr-van-card bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-lg grid grid-cols-3 gap-4 items-center cursor-pointer transition-all hover:border-blue-500"
                 data-plate="${plateFormatted}" data-vin="${van.vin}" data-brand="${capitalize(brand)}">
                <div class="flex justify-center items-center p-2 bg-white rounded-lg aspect-square"> <canvas id="${canvasId}"></canvas> </div>
                <div class="col-span-2"> <h3 class="qr-van-plate-text text-xl font-bold text-white">${plateFormatted}</h3> ${brandHtml} <p class="qr-van-vin-text text-xs font-mono text-gray-400 break-all mt-2">${van.vin || 'VIN no especificado'}</p> </div>
            </div>`;
            qrListContainer.innerHTML += vanCardHTML;
        });
        appVehicleList.forEach((van, index) => {
            const canvas = document.getElementById(`qr-canvas-${index}`);
            if (canvas && van.vin) {
                QRCode.toCanvas(canvas, van.vin, { margin: 1 }, function (error) { if (error) console.error(error); });
            }
        });
        assignQRCardListeners();
    }
    
    function assignQRCardListeners() {
        document.querySelectorAll('.qr-van-card').forEach(card => {
            card.addEventListener('click', async () => {
                const plate = card.dataset.plate;
                const vin = card.dataset.vin;
                const brand = card.dataset.brand;
                const ctx = modalCompositeCanvas.getContext('2d');
                modalCompositeCanvas.dataset.plate = plate;
                const qrTempCanvas = document.createElement('canvas');
                try {
                    await QRCode.toCanvas(qrTempCanvas, vin, { width: 250, margin: 1 });
                } catch (err) { console.error(err); return; }
                ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 300, 400);
                ctx.fillStyle = '#1e3a8a'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(plate, 150, 45);
                ctx.fillStyle = '#374151'; ctx.font = '20px sans-serif'; ctx.fillText(brand, 150, 75);
                ctx.drawImage(qrTempCanvas, 25, 95);
                ctx.fillStyle = 'black'; ctx.font = '12px sans-serif'; ctx.fillText(vin, 150, 370);
                qrModal.classList.remove('hidden');
            });
        });
    }

    function closeModal() {
        qrModal.classList.add('hidden');
        const ctx = modalCompositeCanvas.getContext('2d');
        ctx.clearRect(0, 0, modalCompositeCanvas.width, modalCompositeCanvas.height);
    }
    
    function populateTireMatriculaList() {
        matriculaListContainer.innerHTML = '';
        appVehicleList.forEach(van => {
            const plateFormatted = `${van.matricula.slice(0, 4)} ${van.matricula.slice(4)}`;
            const brand = van.marca;
            const buttonHTML = `
            <button type="button"
                    class="matricula-select-btn w-full text-left px-4 py-2 rounded-md border border-slate-600 hover:bg-blue-500 hover:text-white transition-all"
                    data-matricula-raw="${van.matricula}">
                <span class="font-semibold">${plateFormatted}</span>
                <span class="text-sm text-gray-400">${brand ? ' - ' + capitalize(brand) : ''}</span>
            </button>`;
            matriculaListContainer.innerHTML += buttonHTML;
        });
        assignTireMatriculaListeners();
    }
    
    function assignTireMatriculaListeners() {
        allMatriculaBtns = document.querySelectorAll('#matricula-list-neumaticos .matricula-select-btn');
        allMatriculaBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                allMatriculaBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                matriculaHiddenInput.value = btn.dataset.matriculaRaw;
            });
        });
    }

    async function handleTireUpload(event) {
        event.preventDefault();
        const matricula = matriculaHiddenInput.value;
        if (!matricula) {
            showTireStatus('Error: Debes seleccionar una matrícula.', 'error');
            return;
        }
        const photoPayloads = [];
        Object.keys(tirePhotoStore).forEach(key => {
            photoPayloads.push({
                fileName: `${matricula}_${key.toUpperCase()}.jpg`,
                mimeType: 'image/jpeg',
                data: tirePhotoStore[key].split(',')[1]
            });
        });
        if (photoPayloads.length === 0) {
             showTireStatus('Aviso: No hay fotos para guardar.', 'error');
             setTimeout(resetTireForm, 2000);
             return;
        }
        showTireStatus('Guardando imágenes...', 'loading');
        tireSubmitButton.disabled = true;
        tireSubmitButton.textContent = 'Guardando...';
        try {
            const payload = {
                action: 'saveTires', matricula: matricula, photos: photoPayloads
            };
            const result = await fetchSeguro(payload);

            if(result.status === 'success') {
                showTireStatus('¡Fotos guardadas con éxito!', 'success');
                setTimeout(() => { resetTireForm(); }, 2000);
            } else {
                showTireStatus(`Error al guardar: ${result.message}`, 'error');
            }
        } catch (error) {
            showTireStatus(`Error de conexión: ${error.message}`, 'error');
        } finally {
            tireSubmitButton.disabled = false;
            tireSubmitButton.textContent = 'Guardar Datos';
        }
    }

    function showTireStatus(message, type) {
        tireStatusMessage.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600', 'text-white');
        tireStatusMessage.textContent = message;
        if (type === 'success') tireStatusMessage.classList.add('bg-green-600', 'text-white');
        else if (type === 'error') tireStatusMessage.classList.add('bg-red-600', 'text-white');
        else if (type === 'loading') tireStatusMessage.classList.add('bg-blue-600', 'text-white');
    }

    function resetTireForm() {
        tireUploadForm.reset();
        ['preview-fd', 'preview-fi', 'preview-tr', 'preview-ti'].forEach(id => {
            document.getElementById(id).src = placeholderImg;
        });
        allMatriculaBtns.forEach(b => b.classList.remove('active'));
        matriculaHiddenInput.value = '';
        matriculaSearch.value = '';
        allMatriculaBtns.forEach(btn => btn.classList.remove('hidden'));
        matriculaNoResults.classList.add('hidden');
        tirePhotoStore = {};
        tireSubmitButton.disabled = false;
        tireSubmitButton.textContent = 'Guardar Datos';
        tireStatusMessage.classList.add('hidden');
    }

    async function loadTireHistory() {
        tireHistoryListContainer.innerHTML = '';
        tireHistoryDetailPage.classList.add('hidden');
        document.getElementById('tire-history-list-page').classList.remove('hidden');
        tireHistoryLoadingMessage.classList.remove('hidden');
        tireHistoryNoResults.classList.add('hidden');
        tireHistoryDataStore = {};

        try {
            const result = await fetchSeguro({ action: 'getTireHistory' });
            tireHistoryLoadingMessage.classList.add('hidden');
            if (result.status !== 'success') { throw new Error(result.message); }

            result.data.forEach(entry => {
                if (!tireHistoryDataStore[entry.matricula]) {
                    tireHistoryDataStore[entry.matricula] = [];
                }
                tireHistoryDataStore[entry.matricula].push(entry);
            });

            if (Object.keys(tireHistoryDataStore).length === 0) {
                tireHistoryNoResults.classList.remove('hidden');
                tireHistoryNoResults.textContent = 'No se ha subido ningún estado de neumáticos.';
                return;
            }

            for (const matricula in tireHistoryDataStore) {
                const entries = tireHistoryDataStore[matricula];
                const latestEntry = entries[0];
                const entryCount = entries.length;
                const summaryCardHTML = `
                <div class="tire-history-summary-card bg-slate-800/50 p-4 rounded-xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-all" data-matricula="${matricula}">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="font-bold text-lg text-blue-300">${matricula}</span>
                            <span class="block text-xs text-gray-400">Última act.: ${latestEntry.timestamp}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-sm font-medium text-gray-300">${entryCount} ${entryCount > 1 ? 'entradas' : 'entrada'}</span>
                            <span class="block text-blue-400 text-sm">Ver historial &rarr;</span>
                        </div>
                    </div>
                </div>
                `;
                tireHistoryListContainer.innerHTML += summaryCardHTML;
            }

            document.querySelectorAll('.tire-history-summary-card').forEach(card => {
                card.addEventListener('click', () => {
                    showTireHistoryDetail(card.dataset.matricula);
                });
            });

            const searchTireHistoryInput = document.getElementById('search-tire-history');
            const allTireHistoryCards = document.querySelectorAll('#tire-history-list-container .tire-history-summary-card');

            searchTireHistoryInput.addEventListener('input', () => {
                const searchTerm = searchTireHistoryInput.value.toUpperCase().replace(/\s/g, '');
                let resultsFound = 0;
                allTireHistoryCards.forEach(card => {
                    const plateText = card.dataset.matricula.toUpperCase().replace(/\s/g, '');
                    if (plateText.includes(searchTerm)) {
                        card.classList.remove('hidden'); resultsFound++;
                    } else {
                        card.classList.add('hidden');
                    }
                });
                tireHistoryNoResults.classList.toggle('hidden', resultsFound > 0);
                tireHistoryNoResults.textContent = 'No se encontraron historiales con esa matrícula.';
            });

        } catch (error) {
            tireHistoryLoadingMessage.classList.add('hidden');
            tireHistoryNoResults.classList.remove('hidden');
            tireHistoryNoResults.innerHTML = `<p class="text-center text-red-400">Error al cargar el historial: ${error.message}</p>`;
        }
    }

    function showTireHistoryDetail(matricula) {
        document.getElementById('tire-history-list-page').classList.add('hidden');
        tireHistoryDetailPage.classList.remove('hidden');
        tireHistoryDetailTitle.textContent = `Historial de: ${matricula}`;
        tireHistoryDetailContent.innerHTML = '';

        const entries = tireHistoryDataStore[matricula];
        if (!entries) {
            tireHistoryDetailContent.innerHTML = '<p class="text-gray-400 text-center">No se encontraron entradas para esta matrícula.</p>';
            return;
        }

        const renderPhoto = (thumbnailUrl, label) => {
            if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
                let fullSizeUrl = thumbnailUrl;
                let fileId = '';
                if (thumbnailUrl.includes('thumbnail?id=')) {
                    fileId = thumbnailUrl.split('id=')[1];
                } else if (thumbnailUrl.includes('/d/')) {
                    const fileIdMatch = thumbnailUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (fileIdMatch && fileIdMatch[1]) {
                        fileId = fileIdMatch[1];
                    }
                }
                if (fileId) {
                    fullSizeUrl = `https://drive.google.com/file/d/${fileId}/view`;
                }
                return `<a href="${fullSizeUrl}" target="_blank" rel="noopener noreferrer" class="flex-1 min-w-[120px]">
                            <p class="text-sm text-gray-300 mb-1">${label}</p>
                            <img src="${thumbnailUrl}" class="w-full h-24 object-cover rounded-md border border-slate-600 hover:opacity-80">
                        </a>`;
            } else {
                return `<div class="flex-1 min-w-[120px]">
                            <p class="text-sm text-gray-400 mb-1">${label}</p>
                            <div class="w-full h-24 rounded-md border border-slate-700 bg-slate-800/50 flex items-center justify-center text-xs text-gray-500">Sin foto</div>
                        </div>`;
            }
        };

        entries.forEach(entry => {
            let fotosHTML = '<div class="flex flex-wrap gap-2 mt-2">';
            fotosHTML += renderPhoto(entry.url_fd, 'Del. Derecha');
            fotosHTML += renderPhoto(entry.url_fi, 'Del. Izquierda');
            fotosHTML += renderPhoto(entry.url_tr, 'Tras. Derecha');
            fotosHTML += renderPhoto(entry.url_ti, 'Tras. Izquierda');
            fotosHTML += '</div>';

            const cardHTML = `
            <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700 history-entry-card">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="font-bold text-lg text-blue-300">${entry.matricula}</span>
                        <span class="block text-xs text-gray-400">${entry.timestamp}</span>
                    </div>
                    <div class="flex space-x-2">
                        <button class="delete-tire-history-btn btn-history-delete" 
                                data-timestamp="${entry.timestamp}" 
                                data-matricula="${entry.matricula}">
                            Borrar
                        </button>
                    </div>
                </div>
                ${fotosHTML}
            </div>
            `;
            tireHistoryDetailContent.innerHTML += cardHTML;
        });
        
        addHistoryActionListeners();
    }
    
    function resetRentalForm() {
        rentalUploadForm.reset();
        
        rentalSinglePhotoStore = {};
        rentalDamagePhotoStore = [];

        document.querySelectorAll('.rental-photo-input-single').forEach(input => {
            const key = input.dataset.key;
            const previewImg = document.getElementById(`preview-rental-${key}`);
            if (previewImg) {
                previewImg.src = placeholderImg;
            }
        });

        rentalDamagePhotosContainer.innerHTML = '';
        rentalStatusMessage.classList.add('hidden');
        rentalStatusMessage.textContent = '';
        rentalSubmitButton.disabled = false;
        rentalSubmitButton.textContent = 'Guardar Registro';
        rentalTipoRegistro.value = ''; 
    }

    function showRentalStatus(message, type) {
        rentalStatusMessage.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600', 'text-white');
        rentalStatusMessage.textContent = message;
        if (type === 'success') rentalStatusMessage.classList.add('bg-green-600', 'text-white');
        else if (type === 'error') rentalStatusMessage.classList.add('bg-red-600', 'text-white');
        else if (type === 'loading') rentalStatusMessage.classList.add('bg-blue-600', 'text-white');
    }

    function renderRentalDamagePreviews() {
        rentalDamagePhotosContainer.innerHTML = '';
        rentalDamagePhotoStore.forEach((dataUrl, index) => {
            const img = document.createElement('img');
            img.src = dataUrl;
            img.className = 'w-full h-20 object-cover rounded-md border border-slate-600';
            img.dataset.index = index;
            rentalDamagePhotosContainer.appendChild(img);
        });
    }

    async function handleRentalUpload(event) {
        event.preventDefault();

        const matricula = rentalMatriculaInput.value.toUpperCase();
        const tipoRegistro = rentalTipoRegistro.value;

        if (!matricula || matricula.length !== 7) {
            showRentalStatus('Error: Debes introducir una matrícula válida (0000XXX).', 'error');
            return;
        }
        if (!tipoRegistro) {
            showRentalStatus('Error: Tipo de registro no definido. Vuelve al menú y selecciona "Entrega" o "Devolución".', 'error');
            return;
        }

        const equipamiento = {};
        document.querySelectorAll('#rental-equipamiento-container input[type="checkbox"]').forEach(check => {
            equipamiento[check.dataset.key] = check.checked;
        });

        const descripcionDanos = rentalDescripcionDanos.value;

        const singlePhotos = [];
        Object.keys(rentalSinglePhotoStore).forEach(key => {
            singlePhotos.push({
                fileName: `${matricula}_${key}.jpg`,
                mimeType: 'image/jpeg',
                data: rentalSinglePhotoStore[key].split(',')[1]
            });
        });

        const damagePhotos = rentalDamagePhotoStore.map((dataUrl, index) => {
            return {
                fileName: `${matricula}_dano_${index + 1}.jpg`,
                mimeType: 'image/jpeg',
                data: dataUrl.split(',')[1]
            };
        });

        if (singlePhotos.length === 0 && damagePhotos.length === 0 && !descripcionDanos) {
             showRentalStatus('Error: No hay fotos ni descripción de daños para guardar.', 'error');
             return;
        }

        showRentalStatus('Guardando registro...', 'loading');
        rentalSubmitButton.disabled = true;
        rentalSubmitButton.textContent = 'Guardando...';

        try {
            const payload = { 
                action: 'saveRentalRecord', 
                matricula: matricula, 
                tipo_registro: tipoRegistro, 
                equipamiento: equipamiento, 
                descripcionDanos: descripcionDanos, 
                singlePhotos: singlePhotos, 
                damagePhotos: damagePhotos 
            };
            
            const result = await fetchSeguro(payload);

            if(result.status === 'success') {
                showRentalStatus('¡Registro guardado con éxito!', 'success');
                setTimeout(() => { 
                    resetRentalForm(); 
                    alquilerUploadSubpage.classList.add('hidden');
                    alquilerChoiceMenu.classList.remove('hidden');
                }, 2000);
            } else {
                showRentalStatus(`Error al guardar: ${result.message}`, 'error');
            }
        } catch (error) {
            showRentalStatus(`Error de conexión: ${error.message}`, 'error');
        } finally {
            rentalSubmitButton.disabled = false;
            rentalSubmitButton.textContent = 'Guardar Registro';
        }
    }

    async function loadRentalHistory() {
        rentalHistoryListContainer.innerHTML = '';
        rentalHistoryDetailPage.classList.add('hidden');
        document.getElementById('rental-history-list-page').classList.remove('hidden');
        rentalHistoryLoadingMessage.classList.remove('hidden');
        rentalHistoryNoResults.classList.add('hidden');
        
        rentalHistoryDataStore = [];

        try {
            const result = await fetchSeguro({ action: 'getRentalHistory' });
            rentalHistoryLoadingMessage.classList.add('hidden');
            if (result.status !== 'success') { throw new Error(result.message); }

            rentalHistoryDataStore = result.data;

            if (rentalHistoryDataStore.length === 0) {
                rentalHistoryNoResults.classList.remove('hidden');
                rentalHistoryNoResults.textContent = 'No se ha subido ningún registro de alquiler.';
                return;
            }

            rentalHistoryDataStore.forEach((entry, index) => {
                let thumbnailUrl = placeholderImg;
                try {
                    const singleUrls = JSON.parse(entry.urls_single_json || '{}');
                    if (singleUrls.frontal) {
                        thumbnailUrl = singleUrls.frontal;
                    }
                } catch (e) { }

                let tipoBadge = '';
                if (entry.tipo_registro === 'Devolución') {
                    tipoBadge = `<span class="text-xs font-medium text-green-300 bg-green-900/50 px-2 py-0.5 rounded-full ml-2">Devolución</span>`;
                } else {
                    tipoBadge = `<span class="text-xs font-medium text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded-full ml-2">Entrega</span>`;
                }

                const summaryCardHTML = `
                <div class="rental-history-summary-card bg-slate-800/50 p-4 rounded-xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-all" data-matricula="${entry.matricula}" data-entry-index="${index}">
                    <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <div>
                                <span class="font-bold text-lg text-blue-300">${entry.matricula}</span>
                                ${tipoBadge}
                            </div>
                            <span class="block text-xs text-gray-400 mt-1">Fecha: ${entry.timestamp}</span>
                        </div>
                        <img src="${thumbnailUrl}" class="w-16 h-16 object-cover rounded-md border border-slate-600 ml-4 hidden sm:block">
                        <span class="block text-blue-400 text-sm ml-4">Ver detalle &rarr;</span>
                    </div>
                </div>
                `;
                rentalHistoryListContainer.innerHTML += summaryCardHTML;
            });

            document.querySelectorAll('.rental-history-summary-card').forEach(card => {
                card.addEventListener('click', () => {
                    showRentalHistoryDetail(card.dataset.entryIndex);
                });
            });

            const allRentalHistoryCards = document.querySelectorAll('#rental-history-list-container .rental-history-summary-card');
            searchRentalHistoryInput.addEventListener('input', () => {
                const searchTerm = searchRentalHistoryInput.value.toUpperCase().replace(/\s/g, '');
                let resultsFound = 0;
                allRentalHistoryCards.forEach(card => {
                    const plateText = card.dataset.matricula.toUpperCase().replace(/\s/g, '');
                    if (plateText.includes(searchTerm)) {
                        card.classList.remove('hidden'); resultsFound++;
                    } else {
                        card.classList.add('hidden');
                    }
                });
                rentalHistoryNoResults.classList.toggle('hidden', resultsFound > 0);
                rentalHistoryNoResults.textContent = 'No se encontraron registros con esa matrícula.';
            });

        } catch (error) {
            rentalHistoryLoadingMessage.classList.add('hidden');
            rentalHistoryNoResults.classList.remove('hidden');
            rentalHistoryNoResults.innerHTML = `<p class="text-center text-red-400">Error al cargar el historial: ${error.message}</p>`;
        }
    }
function showRentalHistoryDetail(index) {
        const entry = rentalHistoryDataStore[index];
        if (!entry) return;

        document.getElementById('rental-history-list-page').classList.add('hidden');
        rentalHistoryDetailPage.classList.remove('hidden');
        rentalHistoryDetailTitle.textContent = `Registro: ${entry.matricula} (${entry.timestamp})`;
        rentalHistoryDetailContent.innerHTML = '';

        const renderPhoto = (thumbnailUrl, label) => {
            if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
                let fullSizeUrl = thumbnailUrl;
                let fileId = '';
                if (thumbnailUrl.includes('thumbnail?id=')) {
                    fileId = thumbnailUrl.split('id=')[1];
                } else if (thumbnailUrl.includes('/d/')) {
                    const fileIdMatch = thumbnailUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (fileIdMatch && fileIdMatch[1]) {
                        fileId = fileIdMatch[1];
                    }
                }
                if (fileId) {
                    fullSizeUrl = `https://drive.google.com/file/d/${fileId}/view`;
                }
                return `<a href="${fullSizeUrl}" target="_blank" rel="noopener noreferrer" class="flex-1 min-w-[120px]">
                            <p class="text-sm text-gray-300 mb-1">${label}</p>
                            <img src="${thumbnailUrl}" class="w-full h-24 object-cover rounded-md border border-slate-600 hover:opacity-80">
                        </a>`;
            } else {
                return `<div class="flex-1 min-w-[120px]">
                            <p class="text-sm text-gray-400 mb-1">${label}</p>
                            <div class="w-full h-24 rounded-md border border-slate-700 bg-slate-800/50 flex items-center justify-center text-xs text-gray-500">Sin foto</div>
                        </div>`;
            }
        };

        let contentHTML = '';

        let tipoBadge = '';
        if (entry.tipo_registro === 'Devolución') {
            tipoBadge = `<span class="text-sm font-medium text-green-300 bg-green-900/50 px-3 py-1 rounded-full">Tipo: Devolución</span>`;
        } else {
            tipoBadge = `<span class="text-sm font-medium text-blue-300 bg-blue-900/50 px-3 py-1 rounded-full">Tipo: Entrega</span>`;
        }

        contentHTML += `
        <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700 history-entry-card">
            <div class="flex justify-between items-center">
                <div>
                    <span class="font-bold text-lg text-blue-300">${entry.matricula}</span>
                    <span class="block text-xs text-gray-400">${entry.timestamp}</span>
                </div>
                ${tipoBadge}
            </div>
            <div class="mt-4 flex justify-end">
                 <button class="delete-rental-history-btn btn-history-delete" 
                        data-timestamp="${entry.timestamp}" 
                        data-matricula="${entry.matricula}">
                    Borrar
                </button>
            </div>
        </div>`;

        const singleUrls = JSON.parse(entry.urls_single_json || '{}');
        contentHTML += '<div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><h3 class="text-lg font-semibold text-blue-300 mb-3">Fotos del Vehículo</h3><div class="flex flex-wrap gap-2">';
        contentHTML += renderPhoto(singleUrls.frontal, 'Frontal');
        contentHTML += renderPhoto(singleUrls.derecha, 'Derecha');
        contentHTML += renderPhoto(singleUrls.trasera, 'Trasera');
        contentHTML += renderPhoto(singleUrls.izquierda, 'Izquierda');
        contentHTML += renderPhoto(singleUrls.salpicadero, 'Salpicadero');
        contentHTML += renderPhoto(singleUrls.odometro, 'Odómetro');
        contentHTML += renderPhoto(singleUrls.llave, 'Llave');
        contentHTML += renderPhoto(singleUrls.carga, 'Zona Carga');
        contentHTML += '</div></div>';
        
        contentHTML += '<div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><h3 class="text-lg font-semibold text-blue-300 mb-3">Fotos de Neumáticos</h3><div class="flex flex-wrap gap-2">';
        contentHTML += renderPhoto(singleUrls.fd, 'Del. Derecha');
        contentHTML += renderPhoto(singleUrls.fi, 'Del. Izquierda');
        contentHTML += renderPhoto(singleUrls.tr, 'Tras. Derecha');
        contentHTML += renderPhoto(singleUrls.ti, 'Tras. Izquierda');
        contentHTML += '</div></div>';

        const equipamiento = JSON.parse(entry.equipamiento_json || '{}');
        const equipMap = { extintor: 'Extintor', martillo: 'Martillo', carro: 'Carro', botiquin: 'Botiquín', permiso: 'Permiso Circ.', ficha: 'Ficha Téc.' };
        contentHTML += '<div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><h3 class="text-lg font-semibold text-blue-300 mb-3">Equipamiento</h3><div class="grid grid-cols-2 md:grid-cols-3 gap-2">';
        for (const key in equipMap) {
            contentHTML += `<div><span class="mr-2">${equipamiento[key] ? '✅' : '❌'}</span><span class="${equipamiento[key] ? 'text-gray-200' : 'text-gray-500'}">${equipMap[key]}</span></div>`;
        }
        contentHTML += '</div></div>';

        const damageUrls = entry.urls_danos_csv ? entry.urls_danos_csv.split(/[\s,]+/).filter(u => u.startsWith('http')) : [];
        contentHTML += '<div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><h3 class="text-lg font-semibold text-blue-300 mb-3">Descripción de Daños</h3>';
        contentHTML += `<p class="text-gray-300">${entry.descripcion_danos || '--- No hay descripción ---'}</p>`;
        
        if (damageUrls.length > 0) {
            contentHTML += '<h4 class="text-md font-semibold text-gray-200 mt-4 mb-2">Fotos de Daños:</h4><div class="flex flex-wrap gap-2">';
            damageUrls.forEach((url, i) => {
                contentHTML += renderPhoto(url, `Daño ${i+1}`);
            });
            contentHTML += '</div>';
        } else {
            contentHTML += '<p class="text-gray-500 text-sm mt-2">--- No hay fotos de daños ---</p>';
        }
        contentHTML += '</div>';

        rentalHistoryDetailContent.innerHTML = contentHTML;
        
        addHistoryActionListeners();
    }
    
    // --- LÓGICA ACCIDENTES ---
    function resetAccidentForm() {
        accidentUploadForm.reset();
        accidentPartePhotoStore = null;
        accidentDamagePhotoStore = [];
        accidentPartePreview.src = placeholderImg;
        accidentDamagePhotosContainer.innerHTML = '';
        accidentStatusMessage.classList.add('hidden');
        accidentStatusMessage.textContent = '';
        accidentSubmitButton.disabled = false;
        accidentSubmitButton.textContent = 'Guardar Reporte de Accidente';
    }

    function showAccidentStatus(message, type) {
        accidentStatusMessage.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600', 'text-white');
        accidentStatusMessage.textContent = message;
        if (type === 'success') accidentStatusMessage.classList.add('bg-green-600', 'text-white');
        else if (type === 'error') accidentStatusMessage.classList.add('bg-red-600', 'text-white');
        else if (type === 'loading') accidentStatusMessage.classList.add('bg-blue-600', 'text-white');
    }

    function renderAccidentDamagePreviews() {
        accidentDamagePhotosContainer.innerHTML = '';
        accidentDamagePhotoStore.forEach((dataUrl, index) => {
            const img = document.createElement('img');
            img.src = dataUrl;
            img.className = 'w-full h-20 object-cover rounded-md border border-slate-600';
            img.dataset.index = index;
            accidentDamagePhotosContainer.appendChild(img);
        });
    }

    async function handleAccidentUpload(event) {
        event.preventDefault();

        const matricula = accidentMatriculaInput.value.toUpperCase();
        const conductor = accidentConductorInput.value;
        
        if (!matricula || matricula.length !== 7 || !conductor) {
            showAccidentStatus('Error: La Matrícula (7 caracteres) y el Conductor son obligatorios.', 'error');
            return;
        }

        const descripcion = accidentDescripcion.value;
        
        let partePhotoPayload = null;
        if (accidentPartePhotoStore) {
            partePhotoPayload = {
                fileName: `${matricula}_parte.jpg`,
                mimeType: 'image/jpeg',
                data: accidentPartePhotoStore.split(',')[1]
            };
        }

        const damagePhotosPayloads = accidentDamagePhotoStore.map((dataUrl, index) => {
            return {
                fileName: `${matricula}_accidente_dano_${index + 1}.jpg`,
                mimeType: 'image/jpeg',
                data: dataUrl.split(',')[1]
            };
        });

        if (!descripcion && !partePhotoPayload && damagePhotosPayloads.length === 0) {
             showAccidentStatus('Error: Debes añadir al menos una descripción o una foto (parte o daños).', 'error');
             return;
        }

        showAccidentStatus('Guardando reporte...', 'loading');
        accidentSubmitButton.disabled = true;
        accidentSubmitButton.textContent = 'Guardando...';

        try {
            const payload = { 
                action: 'saveAccidentReport', 
                matricula: matricula, 
                conductor: conductor,
                descripcion: descripcion,
                partePhoto: partePhotoPayload, 
                damagePhotos: damagePhotosPayloads
            };
            
            const result = await fetchSeguro(payload);

            if(result.status === 'success') {
                showAccidentStatus('¡Reporte guardado con éxito!', 'success');
                setTimeout(() => { resetAccidentForm(); }, 2000);
            } else {
                showAccidentStatus(`Error al guardar: ${result.message}`, 'error');
            }
        } catch (error) {
            showAccidentStatus(`Error de conexión: ${error.message}`, 'error');
        } finally {
            accidentSubmitButton.disabled = false;
            accidentSubmitButton.textContent = 'Guardar Reporte de Accidente';
        }
    }

    async function loadAccidentHistory() {
        accidentHistoryListContainer.innerHTML = '';
        accidentHistoryDetailPage.classList.add('hidden');
        document.getElementById('accident-history-list-page').classList.remove('hidden');
        accidentHistoryLoadingMessage.classList.remove('hidden');
        accidentHistoryNoResults.classList.add('hidden');
        
        accidentHistoryDataStore = [];

        try {
            const result = await fetchSeguro({ action: 'getAccidentHistory' });
            accidentHistoryLoadingMessage.classList.add('hidden');
            if (result.status !== 'success') { throw new Error(result.message); }

            accidentHistoryDataStore = result.data;

            if (accidentHistoryDataStore.length === 0) {
                accidentHistoryNoResults.classList.remove('hidden');
                accidentHistoryNoResults.textContent = 'No hay reportes de accidentes registrados.';
                return;
            }

            accidentHistoryDataStore.forEach((entry, index) => {
                let thumbnailUrl = entry.url_parte || placeholderImg;

                const summaryCardHTML = `
                <div class="accident-history-summary-card bg-slate-800/50 p-4 rounded-xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-all" data-matricula="${entry.matricula}" data-conductor="${entry.conductor}" data-entry-index="${index}">
                    <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <span class="font-bold text-lg text-red-400">${entry.matricula}</span>
                            <span class="block text-sm text-gray-300">Conductor: ${entry.conductor}</span>
                            <span class="block text-xs text-gray-400 mt-1">Fecha: ${entry.timestamp}</span>
                        </div>
                        <img src="${thumbnailUrl}" class="w-16 h-16 object-cover rounded-md border border-slate-600 ml-4 hidden sm:block">
                        <span class="block text-blue-400 text-sm ml-4">Ver detalle &rarr;</span>
                    </div>
                </div>
                `;
                accidentHistoryListContainer.innerHTML += summaryCardHTML;
            });

            document.querySelectorAll('.accident-history-summary-card').forEach(card => {
                card.addEventListener('click', () => {
                    showAccidentHistoryDetail(card.dataset.entryIndex);
                });
            });

            const allAccidentHistoryCards = document.querySelectorAll('#accident-history-list-container .accident-history-summary-card');
            searchAccidentHistoryInput.addEventListener('input', () => {
                const searchTerm = searchAccidentHistoryInput.value.toUpperCase().replace(/\s/g, '');
                let resultsFound = 0;
                allAccidentHistoryCards.forEach(card => {
                    const plateText = card.dataset.matricula.toUpperCase().replace(/\s/g, '');
                    const conductorText = card.dataset.conductor.toUpperCase().replace(/\s/g, '');
                    if (plateText.includes(searchTerm) || conductorText.includes(searchTerm)) {
                        card.classList.remove('hidden'); resultsFound++;
                    } else {
                        card.classList.add('hidden');
                    }
                });
                accidentHistoryNoResults.classList.toggle('hidden', resultsFound > 0);
                accidentHistoryNoResults.textContent = 'No se encontraron reportes con esa matrícula o conductor.';
            });

        } catch (error) {
            accidentHistoryLoadingMessage.classList.add('hidden');
            accidentHistoryNoResults.classList.remove('hidden');
            accidentHistoryNoResults.innerHTML = `<p class="text-center text-red-400">Error al cargar el historial: ${error.message}</p>`;
        }
    }

    function showAccidentHistoryDetail(index) {
        const entry = accidentHistoryDataStore[index];
        if (!entry) return;

        document.getElementById('accident-history-list-page').classList.add('hidden');
        accidentHistoryDetailPage.classList.remove('hidden');
        accidentHistoryDetailTitle.textContent = `Reporte: ${entry.matricula} (${entry.timestamp})`;
        accidentHistoryDetailContent.innerHTML = '';

        const renderPhoto = (thumbnailUrl, label) => {
            if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
                let fullSizeUrl = thumbnailUrl;
                let fileId = '';
                if (thumbnailUrl.includes('thumbnail?id=')) {
                    fileId = thumbnailUrl.split('id=')[1];
                } else if (thumbnailUrl.includes('/d/')) {
                    const fileIdMatch = thumbnailUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (fileIdMatch && fileIdMatch[1]) {
                        fileId = fileIdMatch[1];
                    }
                }
                if (fileId) {
                    fullSizeUrl = `https://drive.google.com/file/d/${fileId}/view`;
                }
                return `<a href="${fullSizeUrl}" target="_blank" rel="noopener noreferrer" class="flex-1 min-w-[120px]">
                            <p class="text-sm text-gray-300 mb-1">${label}</p>
                            <img src="${thumbnailUrl}" class="w-full h-24 object-cover rounded-md border border-slate-600 hover:opacity-80">
                        </a>`;
            } else {
                return `<div class="flex-1 min-w-[120px]">
                            <p class="text-sm text-gray-400 mb-1">${label}</p>
                            <div class="w-full h-24 rounded-md border border-slate-700 bg-slate-800/50 flex items-center justify-center text-xs text-gray-500">Sin foto</div>
                        </div>`;
            }
        };

        let contentHTML = '';

        contentHTML += `
        <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700 history-entry-card">
            <div class="flex justify-between items-center">
                <div>
                    <span class="font-bold text-lg text-red-400">${entry.matricula}</span>
                    <span class="block text-xs text-gray-400">${entry.timestamp}</span>
                </div>
                <button class="delete-accident-history-btn btn-history-delete" 
                        data-timestamp="${entry.timestamp}" 
                        data-matricula="${entry.matricula}">
                    Borrar
                </button>
            </div>
            <p class="text-md text-gray-300 mt-2">Conductor: <strong class="text-white">${entry.conductor}</strong></p>
        </div>`;

        contentHTML += '<div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><h3 class="text-lg font-semibold text-blue-300 mb-3">Descripción del Incidente</h3>';
        contentHTML += `<p class="text-gray-300">${entry.descripcion || '--- No hay descripción ---'}</p></div>`;

        contentHTML += '<div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><h3 class="text-lg font-semibold text-blue-300 mb-3">Foto del Parte</h3><div class="flex flex-wrap gap-2">';
        contentHTML += renderPhoto(entry.url_parte, 'Parte Amistoso');
        contentHTML += '</div></div>';
        
        const damageUrls = entry.urls_danos_csv ? entry.urls_danos_csv.split(/[\s,]+/).filter(u => u.startsWith('http')) : [];
        contentHTML += '<div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><h3 class="text-lg font-semibold text-blue-300 mb-3">Fotos de Daños</h3>';
        if (damageUrls.length > 0) {
            contentHTML += '<div class="flex flex-wrap gap-2">';
            damageUrls.forEach((url, i) => {
                contentHTML += renderPhoto(url, `Daño ${i+1}`);
            });
            contentHTML += '</div>';
        } else {
            contentHTML += '<p class="text-gray-500 text-sm">--- No hay fotos de daños ---</p>';
        }
        contentHTML += '</div>';

        accidentHistoryDetailContent.innerHTML = contentHTML;
        
        addHistoryActionListeners();
    }


    // --- LÓGICA FLOTA / VOR ---
    function populateManageVehicleList() {
        manageVehicleList.innerHTML = '';
        appVehicleList.forEach(van => {
            const itemHTML = `
            <div class="manage-van-card flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700" data-matricula="${van.matricula}">
                <div>
                    <span class="font-semibold text-white">${van.matricula}</span>
                    <span class="text-sm text-gray-400 ml-2">(${capitalize(van.marca)})</span>
                </div>
                <button class="remove-vehicle-btn text-sm font-medium text-red-400 hover:text-red-300 px-3 py-1 rounded-md border border-red-500/50 hover:bg-red-500/10 transition-all"
                        data-matricula="${van.matricula}">
                    Quitar
                </button>
            </div>
            `;
            manageVehicleList.innerHTML += itemHTML;
        });
        assignRemoveButtonListeners();
    }

    async function handleAddVehicle() {
        const matricula = document.getElementById('add-matricula').value.toUpperCase();
        const vin = document.getElementById('add-vin').value.toUpperCase();
        const marca = document.getElementById('add-marca').value;
        const poliza = document.getElementById('add-poliza').value;
        const renting = document.getElementById('add-renting').value;

        if (!matricula || !vin || !marca) {
            showAddVehicleStatus('Matrícula, VIN y Marca son obligatorios.', 'error');
            return;
        }
        if (matricula.length !== 7) {
            showAddVehicleStatus('La matrícula debe tener 7 caracteres (ej: 0000XXX).', 'error');
            return;
        }
        addVehicleButton.disabled = true;
        addVehicleButton.textContent = 'Añadiendo...';
        showAddVehicleStatus('Enviando...', 'loading');
        try {
            const payload = { 
                action: 'addVehicle', 
                matricula: matricula, 
                vin: vin, 
                marca: marca,
                poliza: poliza,   
                renting: renting 
            };
            const result = await fetchSeguro(payload);

            if (result.status === 'success') {
                showAddVehicleStatus('¡Vehículo añadido con éxito! Recargando...', 'success');
                addVehicleForm.reset();
                setTimeout(() => {
                    initializeApp(); 
                    showAddVehicleStatus('', 'hidden');
                }, 2000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showAddVehicleStatus(error.message, 'error');
        } finally {
            addVehicleButton.disabled = false;
            addVehicleButton.textContent = 'Añadir Vehículo';
        }
    }

    function assignRemoveButtonListeners() {
        document.querySelectorAll('.remove-vehicle-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const matricula = e.target.dataset.matricula;
                handleRemoveVehicle(matricula, e.target);
            });
        });
    }

    async function handleRemoveVehicle(matricula, buttonElement) {
        
        checkAdminPassword(async () => {
            
            if (!confirm(`¿Estás seguro de que quieres eliminar ${matricula}? Esta acción no se puede deshacer.`)) {
                return;
            }
            buttonElement.disabled = true;
            buttonElement.textContent = 'Eliminando...';
            try {
                const payload = { action: 'removeVehicle', matricula: matricula };
                const result = await fetchSeguro(payload);

                if (result.status === 'success') {
                    initializeApp();
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                alert(`Error al eliminar: ${error.message}`);
                buttonElement.disabled = false;
                buttonElement.textContent = 'Quitar';
            }

        });
    }

    function showAddVehicleStatus(message, type) {
        addVehicleStatus.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600', 'text-white');
        addVehicleStatus.textContent = message;
        if (type === 'success') addVehicleStatus.classList.add('bg-green-600', 'text-white');
        else if (type === 'error') addVehicleStatus.classList.add('bg-red-600', 'text-white');
        else if (type === 'loading') addVehicleStatus.classList.add('bg-blue-600', 'text-white');
        else if (type === 'hidden') addVehicleStatus.classList.add('hidden');
    }

    
    function populateVorPage() {
        vorVehicleList.innerHTML = '';
        let total = 0;
        let operativos = 0;
        let vor = 0;
        
        const renderDocThumbnail = (url, label) => {
            if (url && url.startsWith('http')) {
                return `
                <a href="${url.replace('thumbnail?id=', 'file/d/') + '/view'}" target="_blank" rel="noopener noreferrer" 
                   class="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-700/50 border border-slate-600 hover:border-blue-500 transition-all">
                    <img src="${url}" class="w-8 h-6 object-cover rounded-sm">
                    <span class="text-xs font-medium text-gray-300">${label}</span>
                </a>`;
            } else {
                return `
                <div class="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-700/50 border border-slate-700">
                    <div class="w-8 h-6 rounded-sm bg-slate-800 flex items-center justify-center text-gray-500 text-[10px]">Sin</div>
                    <span class="text-xs font-medium text-gray-500">${label}</span>
                </div>`;
            }
        };

        appVehicleList.forEach(van => {
            total++;
            let isVor = van.estado.toUpperCase() === 'VOR';

            const itvStatus = checkDateStatus(van.fecha_itv);
            const revisionStatus = checkDateStatus(van.fecha_revision);
            
            let isVorDocumental = itvStatus.color === 'text-red-400' || revisionStatus.color === 'text-red-400';

            const isFinalVor = isVor || isVorDocumental;

            if (isFinalVor) {
                vor++;
            } else {
                operativos++;
            }
            
            let alertClass = '';
            if (itvStatus.color === 'text-yellow-400' || revisionStatus.color === 'text-yellow-400') {
                alertClass = 'vor-alert';
            }

            const docThumbnailsHTML = `
            <div class="flex space-x-2 mt-3">
                ${renderDocThumbnail(van.url_permiso, 'Permiso')}
                ${renderDocThumbnail(van.url_ficha, 'Ficha')}
            </div>
            `;

            const itemHTML = `
            <div class="vor-van-card clickable-card bg-slate-800/50 p-4 rounded-lg border ${isFinalVor ? 'border-red-500/50 vor-highlight' : (alertClass ? 'border-yellow-500/50' : 'border-slate-700')}"
                 data-matricula="${van.matricula}">
                
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center">
                        <span class="w-3 h-3 rounded-full ${isFinalVor ? 'bg-red-500' : 'bg-green-500'} mr-3 flex-shrink-0"></span>
                        
                        <div>
                            <span class="font-semibold text-white text-lg">${van.matricula}</span>
                            <span class="text-sm text-gray-400 ml-2">(${capitalize(van.marca)})</span>
                        </div>
                    </div>
                    <button class="vor-toggle-btn text-xs font-medium px-2 py-1 rounded-md transition-all whitespace-nowrap
                                   ${isVor ? 'bg-green-600/20 text-green-300 hover:bg-green-600/40 border border-green-500/30'
                                           : 'bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-500/30'}"
                            data-matricula="${van.matricula}"
                            data-estado-actual="${van.estado}">
                        ${isVor ? 'Marcar Operativo' : 'Marcar VOR'}
                    </button>
                </div>

                <div class="pl-6">
                    <div class="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
                        <div class="space-y-1 text-sm">
                            <p><strong>ITV:</strong> <span class="${itvStatus.color} font-medium">${itvStatus.text}</span></p>
                            <p><strong>Revisión:</strong> <span class="${revisionStatus.color} font-medium">${revisionStatus.text}</span></p>
                        </div>
                        
                        <button class="edit-dates-btn text-xs font-medium text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded-md transition-all self-end sm:self-center"
                                data-matricula="${van.matricula}">
                            Editar Docs
                        </button>
                    </div>

                    ${docThumbnailsHTML}
                    
                </div>
            </div>
            `;
            vorVehicleList.innerHTML += itemHTML;
        });
        
        countTotal.textContent = total;
        countOperativos.textContent = operativos;
        countVor.textContent = vor;
        
        assignVorClickListeners(); 
        updateVorListVisibility(); 
    }
    
    function assignVorClickListeners() {
        document.querySelectorAll('.vor-van-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const matricula = card.dataset.matricula;

                if (e.target.classList.contains('vor-toggle-btn')) {
                    e.stopPropagation(); 
                    const button = e.target;
                    const estadoActual = button.dataset.estadoActual;
                    const nuevoEstado = estadoActual.toUpperCase() === 'VOR' ? 'Operativo' : 'VOR';
                    handleUpdateVorStatus(matricula, nuevoEstado, button);
                }
                
                else if (e.target.classList.contains('edit-dates-btn')) {
                    e.stopPropagation(); 
                    openDatesModal(matricula);
                }

                else if (e.target.closest('a')) {
                     e.stopPropagation(); 
                }
                
                else {
                    navigateToPage('page-guantera'); 
                    showGuanteraDetail(matricula);
                }
            });
        });
    }

    function updateVorListVisibility() {
        const searchTerm = searchVorInput.value.toUpperCase().replace(/\s/g, '');
        const allVorVans = vorVehicleList.querySelectorAll('.vor-van-card');
        let resultsFound = 0;

        allVorVans.forEach(card => {
            const plateText = card.dataset.matricula.toUpperCase().replace(/\s/g, '');
            const isVor = card.classList.contains('vor-highlight'); 
            const isAlert = card.classList.contains('vor-alert');

            const matchesSearch = plateText.includes(searchTerm);
            let matchesFilter = false;

            if (currentVorFilter === 'all') {
                matchesFilter = true;
            } else if (currentVorFilter === 'vor') {
                matchesFilter = isVor;
            } else if (currentVorFilter === 'op') {
                matchesFilter = !isVor;
            }

            if (matchesSearch && matchesFilter) {
                card.classList.remove('hidden');
                resultsFound++;
            } else {
                card.classList.add('hidden');
            }
        });
        vorNoResultsMessage.classList.toggle('hidden', resultsFound > 0);
    }

    async function handleUpdateVorStatus(matricula, nuevoEstado, buttonElement) {
        
        if (nuevoEstado.toUpperCase() === 'OPERATIVO') {
            const confirmMessage = `
¡ATENCIÓN!
                
Vas a marcar la furgoneta ${matricula} como OPERATIVA.
                
Esto marcará automáticamente TODAS sus tareas pendientes como "Completado".
                
¿Estás seguro de que quieres continuar?`;
            
            if (!confirm(confirmMessage)) {
                return; 
            }
        }
        
        buttonElement.disabled = true;
        buttonElement.textContent = 'Actualizando...';
        
        try {
            const payload = {
                action: 'updateVorStatus',
                matricula: matricula,
                newStatus: nuevoEstado
            };
            const result = await fetchSeguro(payload);

            if (result.status === 'success') {
                const vanIndex = appVehicleList.findIndex(van => van.matricula === matricula);
                if (vanIndex > -1) {
                    appVehicleList[vanIndex].estado = nuevoEstado;
                }
                
                await initializeApp(); 
                navigateToPage('page-operativa-vor');
                
                alert(result.message); 

            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert(`Error al actualizar estado: ${error.message}`);
            populateVorPage(); 
        }
    }

    // --- LÓGICA GUANTERA ---
    
    function populateGuanteraList() {
        guanteraVanListContainer.innerHTML = '';
        appVehicleList.forEach(van => {
            const itemHTML = `
            <div class="guantera-van-card bg-slate-800/50 p-4 rounded-xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-all"
                 data-matricula="${van.matricula}">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="font-bold text-lg text-blue-300">${van.matricula}</span>
                        <span class="block text-sm text-gray-400">${capitalize(van.marca)}</span>
                    </div>
                    <span class="block text-blue-400 text-sm">Ver historial &rarr;</span>
                </div>
            </div>
            `;
            guanteraVanListContainer.innerHTML += itemHTML;
        });

        document.querySelectorAll('.guantera-van-card').forEach(card => {
            card.addEventListener('click', () => {
                showGuanteraDetail(card.dataset.matricula);
            });
        });
    }
    
    async function showGuanteraDetail(matricula) {
        guanteraListPage.classList.add('hidden');
        guanteraDetailPage.classList.remove('hidden');
        guanteraDetailTitle.textContent = `Guantera de: ${matricula}`;
        guanteraDetailContent.innerHTML = '';
        guanteraDetailLoading.classList.remove('hidden');

        try {
            const result = await fetchSeguro({ action: 'getVehicleGuanteraData', matricula: matricula });
            const data = result.data;
            
            let html = '';
            html += renderGuanteraFlota(data.flota); 
            html += renderGuanteraTareas(data.tareas, matricula); 
            html += renderGuanteraAccidentes(data.accidentes, matricula); 
            html += renderGuanteraAlquileres(data.alquileres, matricula);
            
            guanteraDetailContent.innerHTML = html;
            guanteraDetailLoading.classList.add('hidden');
            
            assignGuanteraCardListeners(matricula);


        } catch (error) {
            guanteraDetailLoading.innerHTML = `<p class="text-center text-red-400">Error al cargar el historial: ${error.message}</p>`;
        }
    }

    function renderGuanteraFlota(data) {
        const renderDoc = (url, label) => {
            if (url && url.startsWith('http')) {
                return `<a href="${url.replace('thumbnail?id=', 'file/d/') + '/view'}" target="_blank" rel="noopener noreferrer" class="block w-full text-center bg-blue-600 text-white py-2 px-3 rounded-md font-semibold cursor-pointer text-sm transition-all hover:bg-blue-700">Ver ${label}</a>`;
            }
            return `<span class="block w-full text-center bg-slate-700 text-gray-400 py-2 px-3 rounded-md font-semibold text-sm">Sin ${label}</span>`;
        };
        
        const renderInfo = (label, value) => {
             return `
                <div>
                    <span class="block text-xs text-gray-400">${label}</span>
                    <span class="text-lg font-medium text-gray-200">${value || '---'}</span>
                </div>
             `;
        };

        return `
        <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
            <h3 class="text-xl font-semibold text-white mb-4">Información del Vehículo</h3>
            <div class="grid grid-cols-2 gap-4">
                ${renderInfo('Marca', capitalize(data.marca))}
                ${renderInfo('Renting', capitalize(data.renting))}
                ${renderInfo('Nº Póliza', data.poliza)}
                ${renderInfo('VIN', data.vin)}
                
                ${renderDoc(data.url_permiso, 'Permiso')}
                ${renderDoc(data.url_ficha, 'Ficha')}
            </div>
        </div>
        `;
    }
    
    function renderGuanteraTareas(tareas, matricula) {
        let html = `
        <div id="guantera-card-tareas" 
             class="guantera-clickable-card bg-slate-800/50 p-5 rounded-xl border border-slate-700" 
             data-target-page="page-seleccion-vans"
             data-matricula="${matricula}">
            <h3 class="text-xl font-semibold text-white mb-4">Historial de Tareas</h3>`;
            
        if (!tareas || tareas.length === 0) {
            html += '<p class="text-gray-400 text-sm text-center py-4">No hay tareas de taller registradas para esta furgoneta.</p>';
        } else {
            const pendingCount = tareas.filter(e => !e.estado || e.estado.toLowerCase() === 'pendiente').length;
            if (pendingCount > 0) {
                 html += `<span class="inline-block px-3 py-1 text-sm font-bold text-black bg-amber-400 rounded-full mb-4">${pendingCount} TAREA${pendingCount > 1 ? 'S' : ''} PENDIENTE${pendingCount > 1 ? 'S' : ''}</span>`;
            } else {
                 html += `<span class="inline-block px-3 py-1 text-sm font-medium text-green-300 bg-green-900/50 rounded-full mb-4">No hay tareas pendientes</span>`;
            }

            html += '<div class="space-y-3 max-h-40 overflow-y-auto pr-2">'; 
            tareas.slice(0, 5).forEach(entry => { 
                const isPending = !entry.estado || entry.estado.toLowerCase() === 'pendiente';
                html += `
                <div class="bg-slate-800 p-3 rounded-lg border ${isPending ? 'border-amber-500/30' : 'border-slate-700'} opacity-80">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-medium ${isPending ? 'text-amber-400' : 'text-green-400'}">${isPending ? 'Pendiente' : 'Completado'}</span>
                        <span class="text-xs text-gray-400">${entry.timestamp}</span>
                    </div>
                    <p class="text-sm text-gray-200 mt-2 truncate"><strong class="text-gray-400">Nota:</strong> ${entry.nota || '---'}</p>
                </div>
                `;
            });
            html += '</div>';
            if (tareas.length > 5) {
                 html += `<span class="block text-blue-400 text-sm text-center mt-4">Ver las ${tareas.length} entradas &rarr;</span>`;
            }
        }
        html += '</div>';
        return html;
    }

    function renderGuanteraAccidentes(accidentes, matricula) {
        let html = `
        <div id="guantera-card-accidentes" 
             class="guantera-clickable-card bg-slate-800/50 p-5 rounded-xl border border-slate-700"
             data-target-page="page-accidentes"
             data-matricula="${matricula}">
            <h3 class="text-xl font-semibold text-white mb-4">Historial de Accidentes</h3>`;
            
        if (!accidentes || accidentes.length === 0) {
            html += '<p class="text-gray-400 text-sm text-center py-4">No hay accidentes registrados para esta furgoneta.</p>';
        } else {
             html += `<span class="inline-block px-3 py-1 text-sm font-bold text-white bg-red-600/80 rounded-full mb-4">${accidentes.length} REPORTE${accidentes.length > 1 ? 'S' : ''}</span>`;

            html += '<div class="space-y-3 max-h-40 overflow-y-auto pr-2">';
            accidentes.slice(0, 5).forEach(entry => { 
                html += `
                <div class="bg-slate-800 p-3 rounded-lg border border-red-500/30 opacity-80">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-medium text-red-400">Accidente Reportado</span>
                        <span class="text-xs text-gray-400">${entry.timestamp}</span>
                    </div>
                    <p class="text-sm text-gray-200 mt-2 truncate"><strong class="text-gray-400">Conductor:</strong> ${entry.conductor}</p>
                </div>
                `;
            });
            html += '</div>';
            if (accidentes.length > 5) {
                 html += `<span class="block text-blue-400 text-sm text-center mt-4">Ver los ${accidentes.length} reportes &rarr;</span>`;
            }
        }
        html += '</div>';
        return html;
    }
    
    function renderGuanteraAlquileres(alquileres, matricula) {
        let html = `
        <div id="guantera-card-alquileres" 
             class="guantera-clickable-card bg-slate-800/50 p-5 rounded-xl border border-slate-700"
             data-target-page="page-registro-alquiler"
             data-matricula="${matricula}">
            <h3 class="text-xl font-semibold text-white mb-4">Historial de Alquiler</h3>`;
            
        if (!alquileres || alquileres.length === 0) {
            html += '<p class="text-gray-400 text-sm text-center py-4">No hay registros de alquiler para esta furgoneta.</p>';
        } else {
            const latest = alquileres[0]; 
            const isDevolucion = latest.tipo_registro === 'Devolución';
            html += `<span class="inline-block px-3 py-1 text-sm font-medium ${isDevolucion ? 'text-green-300 bg-green-900/50' : 'text-blue-300 bg-blue-900/50'} rounded-full mb-4">Último registro: ${latest.tipo_registro}</span>`;

            html += '<div class="space-y-3 max-h-40 overflow-y-auto pr-2">';
            alquileres.slice(0, 5).forEach(entry => { 
                const isDev = entry.tipo_registro === 'Devolución';
                html += `
                <div class="bg-slate-800 p-3 rounded-lg border ${isDev ? 'border-green-500/30' : 'border-blue-500/30'} opacity-80">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-medium ${isDev ? 'text-green-400' : 'text-blue-400'}">${isDev ? 'Devolución (Salida)' : 'Entrega (Recibida)'}</span>
                        <span class="text-xs text-gray-400">${entry.timestamp}</span>
                    </div>
                </div>
                `;
            });
            html += '</div>';
            if (alquileres.length > 5) {
                 html += `<span class="block text-blue-400 text-sm text-center mt-4">Ver los ${alquileres.length} registros &rarr;</span>`;
            }
        }
        html += '</div>';
        return html;
    }
    
    function assignGuanteraCardListeners(matricula) {
        document.querySelectorAll('.guantera-clickable-card').forEach(card => {
            card.addEventListener('click', () => {
                const pageId = card.dataset.targetPage;
                if (!pageId) return;

                navigateToPage(pageId); 

                if (pageId === 'page-seleccion-vans') {
                    btnShowVanGallery.click(); 
                    loadVanHistory().then(() => {
                        showVanHistoryDetail(matricula);
                    });
                }
                else if (pageId === 'page-accidentes') {
                    btnShowAccidentGallery.click(); 
                    loadAccidentHistory().then(() => {
                        const index = accidentHistoryDataStore.findIndex(e => e.matricula === matricula);
                        if (index !== -1) {
                            showAccidentHistoryDetail(index);
                        } else {
                            const searchInput = document.getElementById('search-accident-history');
                            if (searchInput) {
                                searchInput.value = matricula;
                                searchInput.dispatchEvent(new Event('input'));
                            }
                        }
                    });
                }
                else if (pageId === 'page-registro-alquiler') {
                    btnShowRentalGallery.click(); 
                    loadRentalHistory().then(() => {
                        const index = rentalHistoryDataStore.findIndex(e => e.matricula === matricula);
                        if (index !== -1) {
                            showRentalHistoryDetail(index);
                        } else {
                            const searchInput = document.getElementById('search-rental-history');
                            if (searchInput) {
                                searchInput.value = matricula;
                                searchInput.dispatchEvent(new Event('input'));
                            }
                        }
                    });
                }
            });
        });
    }


    // --- Modales y Otros ---
    
    function addHistoryActionListeners() {
        document.querySelectorAll('.delete-van-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timestamp = e.target.dataset.timestamp;
                const matricula = e.target.dataset.matricula;
                handleDeleteHistoryEntry('Notas', timestamp, matricula, e.target);
            });
        });
        document.querySelectorAll('.edit-van-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timestamp = e.target.dataset.timestamp;
                const note = e.target.dataset.note;
                const recambios = e.target.dataset.recambios;
                openEditModal(timestamp, note, recambios);
            });
        });
        document.querySelectorAll('.complete-van-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timestamp = e.target.dataset.timestamp;
                handleCompleteHistoryEntry(timestamp, e.target);
            });
        });

        document.querySelectorAll('.delete-tire-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timestamp = e.target.dataset.timestamp;
                const matricula = e.target.dataset.matricula;
                handleDeleteHistoryEntry('Neumaticos', timestamp, matricula, e.target);
            });
        });

        document.querySelectorAll('.delete-rental-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timestamp = e.target.dataset.timestamp;
                const matricula = e.target.dataset.matricula;
                handleDeleteHistoryEntry('Alquileres', timestamp, matricula, e.target);
            });
        });
        
        document.querySelectorAll('.delete-accident-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timestamp = e.target.dataset.timestamp;
                const matricula = e.target.dataset.matricula;
                handleDeleteHistoryEntry('Accidentes', timestamp, matricula, e.target);
            });
        });
    }

    async function handleCompleteHistoryEntry(timestamp, buttonElement) {
        const card = buttonElement.closest('.history-entry-card');
        card.style.opacity = '0.5';
        buttonElement.disabled = true;
        buttonElement.textContent = 'Guardando...';

        try {
            const payload = { 
                action: 'updateNoteStatus', 
                timestamp: timestamp, 
                newStatus: 'Completado' 
            };
            const result = await fetchSeguro(payload);

            if (result.status === 'success') {
                alert(result.message); // Mostrar aviso de stock restante
                
                await loadVanHistory();
                loadStock(true); // Recargar stock local
                
                const matricula = document.getElementById('van-history-detail-title').textContent.replace('Historial de: ', '');
                if (matricula) {
                    showVanHistoryDetail(matricula);
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert(`Error al completar la tarea: ${error.message}`);
            card.style.opacity = '1';
            buttonElement.disabled = false;
            buttonElement.textContent = '✅ Completar';
        }
    }


    async function handleDeleteHistoryEntry(sheetName, timestamp, matricula, buttonElement) {
        
        checkAdminPassword(async () => {
            
            if (!confirm(`¿Estás seguro de que quieres eliminar esta entrada del historial de ${matricula}?\n\nTimestamp: ${timestamp}\n\n¡Esta acción no se puede deshacer!`)) {
                return;
            }
    
            const card = buttonElement.closest('.history-entry-card');
            card.style.opacity = '0.5';
            buttonElement.disabled = true;
            buttonElement.textContent = 'Borrando...';
    
            try {
                const payload = { action: 'deleteHistoryEntry', sheetName, timestamp };
                const result = await fetchSeguro(payload);
    
                if (result.status === 'success') {
                    card.style.transition = 'all 0.3s ease';
                    card.style.transform = 'scale(0.9)';
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.remove();
                        if (sheetName === 'Notas') {
                            loadVanHistory();
                        } else if (sheetName === 'Neumaticos') {
                            loadTireHistory();
                        } else if (sheetName === 'Alquileres') {
                            loadRentalHistory();
                        } else if (sheetName === 'Accidentes') {
                            loadAccidentHistory();
                        }
                    }, 300);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                alert(`Error al eliminar: ${error.message}`);
                card.style.opacity = '1';
                buttonElement.disabled = false;
                buttonElement.textContent = 'Borrar';
            }
        });
    }

    function openEditModal(timestamp, note, recambios) {
        
        checkAdminPassword(() => {
            
            editModalTimestamp.value = timestamp;
            editModalNote.value = note || '';
            editModalRecambios.value = recambios || '';
            editModalStatus.classList.add('hidden');
            editModalSaveBtn.disabled = false;
            editModalSaveBtn.textContent = 'Guardar Cambios';
            editModal.classList.remove('hidden');

        });
    }

    function closeEditModal() {
        editModal.classList.add('hidden');
    }

    function openDatesModal(matricula) {
        checkAdminPassword(() => {
            const van = appVehicleList.find(v => v.matricula === matricula);
            if (!van) {
                alert('Error: No se encontró el vehículo.');
                return;
            }

            const itv = van.fecha_itv;
            const revision = van.fecha_revision;
            const urlPermiso = van.url_permiso;
            const urlFicha = van.url_ficha;
            const poliza = van.poliza; 
            const renting = van.renting; 

            datesModalTitle.textContent = `Editar Docs: ${matricula}`;
            datesModalMatricula.value = matricula;
            
            datesModalItv.value = (itv && itv.toLowerCase() !== 'dd/mm/aaaa' && itv.toLowerCase() !== 'sin fecha') ? itv : '';
            datesModalRevision.value = (revision && revision.toLowerCase() !== 'dd/mm/aaaa' && revision.toLowerCase() !== 'sin fecha') ? revision : '';
            
            datesModalPoliza.value = poliza || '';
            datesModalRenting.value = renting || '';
            
            previewDatesPermiso.src = (urlPermiso && urlPermiso.startsWith('http')) ? urlPermiso : placeholderImg;
            previewDatesFicha.src = (urlFicha && urlFicha.startsWith('http')) ? urlFicha : placeholderImg;
            
            docPhotoStore = {}; 
            
            datesModalStatus.classList.add('hidden');
            datesModalSaveBtn.disabled = false;
            datesModalSaveBtn.textContent = 'Guardar Cambios';
            datesModal.classList.remove('hidden');
        });
    }

    function closeDatesModal() {
        datesModal.classList.add('hidden');
    }

    async function handleUpdateVehicleDocsAndDates() {
        const matricula = datesModalMatricula.value;
        const itv = datesModalItv.value || 'DD/MM/AAAA';
        const revision = datesModalRevision.value || 'DD/MM/AAAA';
        const poliza = datesModalPoliza.value;
        const renting = datesModalRenting.value;

        const dateRegex = /^(\d{1,2}\/\d{1,2}\/\d{4}|DD\/MM\/AAAA)$/;
        if (!dateRegex.test(itv) || !dateRegex.test(revision)) {
            showDatesModalStatus('Formato de fecha incorrecto. Usa DD/MM/AAAA.', 'error');
            return;
        }
        
        showDatesModalStatus('Guardando...', 'loading');
        datesModalSaveBtn.disabled = true;

        let permisoPayload = null;
        if (docPhotoStore['permiso']) {
            permisoPayload = {
                fileName: `${matricula}_permiso.jpg`,
                mimeType: 'image/jpeg',
                data: docPhotoStore['permiso'].split(',')[1]
            };
        }
        
        let fichaPayload = null;
        if (docPhotoStore['ficha']) {
            fichaPayload = {
                fileName: `${matricula}_ficha.jpg`,
                mimeType: 'image/jpeg',
                data: docPhotoStore['ficha'].split(',')[1]
            };
        }

        try {
            const payload = {
                action: 'updateVehicleDocsAndDates',
                matricula: matricula,
                fecha_itv: itv,
                fecha_revision: revision,
                poliza: poliza,         
                renting: renting,       
                permisoPhoto: permisoPayload, 
                fichaPhoto: fichaPayload      
            };
            
            const result = await fetchSeguro(payload);

            if (result.status === 'success') {
                showDatesModalStatus('¡Datos guardados!', 'success');
                await initializeApp();
                populateVorPage();
                setTimeout(closeDatesModal, 1000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showDatesModalStatus(`Error: ${error.message}`, 'error');
            datesModalSaveBtn.disabled = false;
        }
    }

    function showDatesModalStatus(message, type) {
        datesModalStatus.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600', 'text-white');
        datesModalStatus.textContent = message;
        if (type === 'success') datesModalStatus.classList.add('bg-green-600', 'text-white');
        else if (type === 'error') datesModalStatus.classList.add('bg-red-600', 'text-white');
        else if (type === 'loading') datesModalStatus.classList.add('bg-blue-600', 'text-white');
    }
    
    function openSuggestionModal() {
        suggestionForm.reset();
        suggestionModalStatus.classList.add('hidden');
        suggestionModalSaveBtn.disabled = false;
        suggestionModalSaveBtn.textContent = 'Enviar Sugerencia';
        
        suggestionListContainer.innerHTML = '';
        suggestionLoading.classList.remove('hidden');
        suggestionVisitCounter.textContent = 'Cargando contador...';
        
        suggestionModal.classList.remove('hidden');
        
        loadSuggestions();
        getVisitCount(suggestionVisitCounter, "Veces abierto este panel: ");
    }
    
    async function loadSuggestions() {
        try {
            suggestionListContainer.innerHTML = '';
            suggestionLoading.textContent = 'Cargando ideas...';
            suggestionLoading.classList.remove('hidden');
            
            const result = await fetchSeguro({ action: 'getSuggestions' });
            
            suggestionLoading.classList.add('hidden');
            
            if (result.data.length === 0) {
                suggestionListContainer.innerHTML = '<p class="text-center text-gray-400">No hay sugerencias todavía. ¡Sé el primero!</p>';
                return;
            }
            
            result.data.forEach(entry => {
                const cardHTML = `
                <div class="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                    <p class="text-sm text-gray-200">${entry.idea}</p>
                    <p class="text-xs text-yellow-400 font-medium text-right mt-2">- ${entry.nombre} <span class="text-gray-400 font-normal">(${entry.timestamp})</span></p>
                </div>
                `;
                suggestionListContainer.innerHTML += cardHTML;
            });
            
        } catch (error) {
            suggestionLoading.textContent = `Error al cargar ideas: ${error.message}`;
            suggestionLoading.classList.add('text-red-400');
        }
    }

    async function getVisitCount(element, prefix = "Visitas: ") {
        try {
            const result = await fetchSeguro({ action: 'getVisitCount' });
            if (result.status === 'success') {
                element.textContent = `${prefix}${result.count}`;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            element.textContent = 'No se pudo cargar el contador.';
        }
    }
    
    async function getGlobalVisitCount() {
        await getVisitCount(globalVisitCounter, "Visitas Totales de la App: ");
    }

    function closeSuggestionModal() {
        suggestionModal.classList.add('hidden');
    }
    
    async function handleSuggestionSave(event) {
        event.preventDefault();
        const nombre = suggestionModalName.value;
        const idea = suggestionModalIdea.value;
        
        if (!nombre || !idea) {
            showSuggestionModalStatus('Por favor, rellena tu nombre y la idea.', 'error');
            return;
        }
        
        showSuggestionModalStatus('Enviando...', 'loading');
        suggestionModalSaveBtn.disabled = true;

        try {
            const payload = {
                action: 'saveSuggestion',
                nombre: nombre,
                idea: idea
            };
            const result = await fetchSeguro(payload);

            if (result.status === 'success') {
                showSuggestionModalStatus('¡Sugerencia enviada! Gracias.', 'success');
                suggestionForm.reset();
                await loadSuggestions(); 
                setTimeout(() => {
                    showSuggestionModalStatus('', 'hidden'); 
                }, 2000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showSuggestionModalStatus(`Error: ${error.message}`, 'error');
        } finally {
            suggestionModalSaveBtn.disabled = false;
        }
    }
    
    function showSuggestionModalStatus(message, type) {
        suggestionModalStatus.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600', 'text-white', 'text-black');
        suggestionModalStatus.textContent = message;
        if (type === 'success') suggestionModalStatus.classList.add('bg-green-600', 'text-white');
        else if (type === 'error') suggestionModalStatus.classList.add('bg-red-600', 'text-white');
        else if (type === 'loading') suggestionModalStatus.classList.add('bg-blue-600', 'text-white');
        else if (type === 'hidden') suggestionModalStatus.classList.add('hidden');
    }


    async function handleUpdateNoteEntry() {
        const timestamp = editModalTimestamp.value;
        const newNote = editModalNote.value;
        const newRecambios = editModalRecambios.value;

        editModalSaveBtn.disabled = true;
        editModalSaveBtn.textContent = 'Guardando...';
        editModalStatus.classList.remove('hidden', 'bg-red-600', 'bg-green-600');
        editModalStatus.classList.add('bg-blue-600', 'text-white');
        editModalStatus.textContent = 'Guardando...';

        try {
            const payload = { action: 'updateNoteEntry', timestamp, newNote, newRecambios };
            const result = await fetchSeguro(payload);

            if (result.status === 'success') {
                editModalStatus.classList.remove('bg-blue-600');
                editModalStatus.classList.add('bg-green-600', 'text-white');
                editModalStatus.textContent = '¡Actualizado con éxito!';
                
                setTimeout(() => {
                    closeEditModal();
                    loadVanHistory().then(() => {
                        const matricula = document.getElementById('van-history-detail-title').textContent.replace('Historial de: ', '');
                        if (matricula) {
                            showVanHistoryDetail(matricula);
                        }
                    });
                }, 1000);

            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            editModalStatus.classList.remove('bg-blue-600');
            editModalStatus.classList.add('bg-red-600', 'text-white');
            editModalStatus.textContent = `Error: ${error.message}`;
            editModalSaveBtn.disabled = false;
            editModalSaveBtn.textContent = 'Guardar Cambios';
        }
    }

    async function loadStock(silent = false) {
        if (!silent) {
            stockListLoading.classList.remove('hidden');
            stockListContainer.innerHTML = '';
        }
        
        try {
            const result = await fetchSeguro({ action: 'getStock' });
            if (!silent) stockListLoading.classList.add('hidden');
            
            if (result.status === 'success') {
                stockDataStore = result.data;
                renderStockList(stockDataStore);
            } else {
                stockListContainer.innerHTML = `<p class="col-span-3 text-center text-red-400">Error: ${result.message}</p>`;
            }
        } catch (error) {
            if (!silent) stockListLoading.classList.add('hidden');
            stockListContainer.innerHTML = `<p class="col-span-3 text-center text-red-400">Error de conexión: ${error.message}</p>`;
        }
    }

    function renderStockList(data) {
        stockListContainer.innerHTML = '';
        if (data.length === 0) {
            stockListContainer.innerHTML = '<p class="col-span-3 text-center text-gray-400">No hay recambios en stock.</p>';
            return;
        }

        data.forEach(item => {
            let colorClass = 'text-green-400'; // > 3
            let borderClass = 'border-slate-600';
            
            if (item.cantidad <= 1) {
                colorClass = 'text-red-500 font-bold';
                borderClass = 'border-red-500/50';
            } else if (item.cantidad === 2) {
                colorClass = 'text-yellow-400 font-bold';
                borderClass = 'border-yellow-500/50';
            }

            const cardHTML = `
            <div class="stock-item-card bg-slate-700/50 p-4 rounded-lg border ${borderClass} flex justify-between items-center group hover:border-amber-500/50 transition-all cursor-pointer" 
                 data-name="${item.nombre}" 
                 data-quantity="${item.cantidad}">
                <div>
                    <h4 class="font-bold text-white">${item.nombre}</h4>
                    <p class="text-sm text-gray-400">Cantidad: <span class="${colorClass} text-lg ml-1">${item.cantidad}</span></p>
                </div>
                <button class="delete-stock-btn text-red-400 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-md transition-all z-10 relative" data-name="${item.nombre}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            </div>
            `;
            stockListContainer.innerHTML += cardHTML;
        });

        document.querySelectorAll('.delete-stock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                handleDeleteStock(e.currentTarget.dataset.name);
            });
        });
        
        document.querySelectorAll('.stock-item-card').forEach(card => {
            card.addEventListener('click', (e) => {
                stockNameInput.value = card.dataset.name;
                stockQuantityInput.value = card.dataset.quantity;
                stockQuantityInput.focus();
                stockSaveBtn.textContent = "Actualizar";
                
                stockForm.parentElement.classList.add('ring-2', 'ring-amber-500');
                setTimeout(() => stockForm.parentElement.classList.remove('ring-2', 'ring-amber-500'), 500);
            });
        });
    }

    async function handleSaveStock(e) {
        e.preventDefault();
        const nombre = stockNameInput.value;
        const cantidad = stockQuantityInput.value;

        if (!nombre || cantidad === '') return;

        stockSaveBtn.disabled = true;
        stockSaveBtn.textContent = '...';
        
        try {
            const payload = { action: 'saveStockItem', nombre: nombre, cantidad: cantidad };
            const result = await fetchSeguro(payload);
            
            if (result.status === 'success') {
                stockNameInput.value = '';
                stockQuantityInput.value = '';
                stockSaveBtn.textContent = 'Guardar';
                await loadStock();
            } else {
                alert(`Error: ${result.message}`);
                stockSaveBtn.disabled = false;
            }
        } catch (error) {
            alert(`Error de conexión: ${error.message}`);
            stockSaveBtn.disabled = false;
        }
    }

    async function handleDeleteStock(nombre) {
        if (!confirm(`¿Borrar "${nombre}" del stock?`)) return;
        
        try {
            const payload = { action: 'deleteStockItem', nombre: nombre };
            const result = await fetchSeguro(payload);
            
            if (result.status === 'success') {
                await loadStock();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            alert(`Error de conexión: ${error.message}`);
        }
    }

    
    // --- LISTENERS PRINCIPALES Y APP START ---

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = passwordInput.value;
        if (!password) return;

        loginButton.disabled = true;
        loginButton.textContent = 'Verificando...';
        showLoginStatus('Verificando...', 'loading');

        try {
            const payload = { action: 'login', password: password };
            const response = await fetch(GAPS_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            
            const result = await response.json();

            if (result.status === 'success' && result.authToken) {
                authToken = result.authToken;
                showLoginStatus('¡Acceso concedido!', 'success');
                loginModal.style.display = 'none';
                initializeApp();
            } else {
                throw new Error(result.message || 'Error desconocido');
            }
        } catch (error) {
            showLoginStatus(error.message, 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(link.getAttribute('data-page'));
        });
    });

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toUpperCase().replace(/\s/g, '');
        const allVans = vanListContainer.querySelectorAll('.van-card');
        let resultsFound = 0;
        allVans.forEach(card => {
            const plateText = card.querySelector('.van-plate').textContent.toUpperCase().replace(/\s/g, '');
            if (plateText.includes(searchTerm)) {
                card.classList.remove('hidden'); resultsFound++;
            } else {
                card.classList.add('hidden');
            }
        });
        noResultsMessage.classList.toggle('hidden', resultsFound > 0);
    });
    btnShowVanUpload.addEventListener('click', () => {
        vansChoiceMenu.classList.add('hidden');
        vanUploadSection.classList.remove('hidden');
    });
    btnShowVanGallery.addEventListener('click', () => {
        vansChoiceMenu.classList.add('hidden');
        vanUploadSection.classList.add('hidden');
        vanGallerySection.classList.remove('hidden');
        loadVanHistory();
    });
    btnShowStock.addEventListener('click', () => {
        vansChoiceMenu.classList.add('hidden');
        vanStockSection.classList.remove('hidden');
        loadStock();
    });
    btnsBackToVansChoice.forEach(btn => {
        btn.addEventListener('click', () => {
            vanUploadSection.classList.add('hidden');
            vanGallerySection.classList.add('hidden');
            vanStockSection.classList.add('hidden');
            vansChoiceMenu.classList.remove('hidden');
            vanHistoryDetailPage.classList.add('hidden');
            document.getElementById('van-history-list-page').classList.remove('hidden');
        });
    });
    btnBackToHistoryList.addEventListener('click', () => {
        vanHistoryDetailPage.classList.add('hidden');
        document.getElementById('van-history-list-page').classList.remove('hidden');
    });
    searchStockInput.addEventListener('input', () => {
        const term = searchStockInput.value.toLowerCase();
        const cards = stockListContainer.querySelectorAll('div.group'); 
        cards.forEach(card => {
            const text = card.innerText.toLowerCase();
            if (text.includes(term)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });
    stockForm.addEventListener('submit', handleSaveStock);

    searchQrInput.addEventListener('input', () => {
        const searchTerm = searchQrInput.value.toUpperCase().replace(/\s/g, '');
        const allQrVans = qrListContainer.querySelectorAll('.qr-van-card');
        let resultsFound = 0;
        allQrVans.forEach(card => {
            const plateText = card.dataset.plate.toUpperCase().replace(/\s/g, '');
            const vinText = card.dataset.vin.toUpperCase();
            if (plateText.includes(searchTerm) || vinText.includes(searchTerm)) {
                card.classList.remove('hidden'); resultsFound++;
            } else {
                card.classList.add('hidden');
            }
        });
        qrNoResultsMessage.classList.toggle('hidden', resultsFound > 0);
    });
    modalShareBtn.addEventListener('click', async () => {
        const canvas = modalCompositeCanvas; const plate = canvas.dataset.plate || 'furgoneta'; const text = `Datos de la furgoneta ${plate}`;
        if (navigator.share) {
            canvas.toBlob(async (blob) => {
                const file = new File([blob], `${plate}.png`, { type: 'image/png' });
                try { await navigator.share({ files: [file], title: text, text: text }); } catch (err) { console.error('Error al compartir:', err); }
            }, 'image/png');
        } else {
            const dataUrl = canvas.toDataURL('image/png'); const link = document.createElement('a');
            link.href = dataUrl; link.download = `${plate}.png`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }
    });
    modalCloseBtn.addEventListener('click', closeModal);
    qrModal.addEventListener('click', (e) => { if (e.target === qrModal) { closeModal(); } });
    
    btnShowUpload.addEventListener('click', () => {
        neumaticosChoiceMenu.classList.add('hidden');
        neumaticosUploadSubpage.classList.remove('hidden');
        resetTireForm();
    });
    btnShowGallery.addEventListener('click', () => {
        neumaticosChoiceMenu.classList.add('hidden');
        neumaticosGallerySubpage.classList.remove('hidden');
        loadTireHistory();
    });
    btnsBackToNeumaticosChoice.forEach(btn => {
        btn.addEventListener('click', () => {
            neumaticosUploadSubpage.classList.add('hidden');
            neumaticosGallerySubpage.classList.add('hidden');
            neumaticosChoiceMenu.classList.remove('hidden');
            tireHistoryDetailPage.classList.add('hidden');
            document.getElementById('tire-history-list-page').classList.remove('hidden');
        });
    });
    matriculaSearch.addEventListener('input', () => {
        const searchTerm = matriculaSearch.value.toUpperCase().replace(/\s/g, '');
        let resultsFound = 0;
        allMatriculaBtns.forEach(btn => {
            const plateText = btn.querySelector('span.font-semibold').textContent.toUpperCase().replace(/\s/g, '');
            if (plateText.includes(searchTerm)) {
                btn.classList.remove('hidden'); resultsFound++;
            } else {
                btn.classList.add('hidden');
            }
        });
        matriculaNoResults.classList.toggle('hidden', resultsFound > 0);
    });
    document.querySelectorAll('.tire-photo-input').forEach(input => {
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0]; if (!file) return;
            const inputId = event.target.id;
            const previewId = `preview-${inputId.split('-')[1]}`;
            const storeKey = inputId.split('-')[1];
            const timestampedDataUrl = await addTimestampToImage(file);
            document.getElementById(previewId).src = timestampedDataUrl;
            tirePhotoStore[storeKey] = timestampedDataUrl;
            event.target.value = null;
        });
    });
    tireUploadForm.addEventListener('submit', handleTireUpload);
    btnBackToTireList.addEventListener('click', () => {
        tireHistoryDetailPage.classList.add('hidden');
        document.getElementById('tire-history-list-page').classList.remove('hidden');
    });

    btnShowRentalUploadEntrega.addEventListener('click', () => {
        alquilerChoiceMenu.classList.add('hidden');
        alquilerUploadSubpage.classList.remove('hidden');
        resetRentalForm();
        rentalUploadTitle.textContent = "Registrar Entrega (Recibida)";
        rentalTipoRegistro.value = "Entrega";
    });
    btnShowRentalUploadDevolucion.addEventListener('click', () => {
        alquilerChoiceMenu.classList.add('hidden');
        alquilerUploadSubpage.classList.remove('hidden');
        resetRentalForm();
        rentalUploadTitle.textContent = "Registrar Devolución (Salida)";
        rentalTipoRegistro.value = "Devolución";
    });
    
    btnShowRentalGallery.addEventListener('click', () => {
        alquilerChoiceMenu.classList.add('hidden');
        alquilerGallerySubpage.classList.remove('hidden');
        loadRentalHistory();
    });
    btnsBackToAlquilerChoice.forEach(btn => {
        btn.addEventListener('click', () => {
            alquilerUploadSubpage.classList.add('hidden');
            alquilerGallerySubpage.classList.add('hidden');
            alquilerChoiceMenu.classList.remove('hidden');
            rentalHistoryDetailPage.classList.add('hidden');
            document.getElementById('rental-history-list-page').classList.remove('hidden');
        });
    });
    btnBackToRentalList.addEventListener('click', () => {
        rentalHistoryDetailPage.classList.add('hidden');
        document.getElementById('rental-history-list-page').classList.remove('hidden');
    });
    document.querySelectorAll('.rental-photo-input-single').forEach(input => {
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0]; if (!file) return;
            const storeKey = event.target.dataset.key;
            const previewId = `preview-rental-${storeKey}`;
            
            const timestampedDataUrl = await addTimestampToImage(file);
            document.getElementById(previewId).src = timestampedDataUrl;
            rentalSinglePhotoStore[storeKey] = timestampedDataUrl;
            event.target.value = null;
        });
    });
    rentalDamagePhotoInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        for (const file of files) {
            try {
                const timestampedDataUrl = await addTimestampToImage(file);
                rentalDamagePhotoStore.push(timestampedDataUrl);
            } catch (err) {
                console.error("Error procesando imagen de daño:", err);
            }
        }
        renderRentalDamagePreviews(); 
        event.target.value = null;
    });
    rentalUploadForm.addEventListener('submit', handleRentalUpload);

    
    btnShowAccidentUpload.addEventListener('click', () => {
        accidentesChoiceMenu.classList.add('hidden');
        accidentesUploadSubpage.classList.remove('hidden');
        resetAccidentForm();
    });
    btnShowAccidentGallery.addEventListener('click', () => {
        accidentesChoiceMenu.classList.add('hidden');
        accidentesGallerySubpage.classList.remove('hidden');
        loadAccidentHistory();
    });
    btnsBackToAccidentesChoice.forEach(btn => {
        btn.addEventListener('click', () => {
            accidentesUploadSubpage.classList.add('hidden');
            accidentesGallerySubpage.classList.add('hidden');
            accidentesChoiceMenu.classList.remove('hidden');
            accidentHistoryDetailPage.classList.add('hidden');
            document.getElementById('accident-history-list-page').classList.remove('hidden');
        });
    });
    btnBackToAccidentList.addEventListener('click', () => {
        accidentHistoryDetailPage.classList.add('hidden');
        document.getElementById('accident-history-list-page').classList.remove('hidden');
    });
    accidentPartePhotoInput.addEventListener('change', async (event) => {
        const file = event.target.files[0]; if (!file) return;
        const timestampedDataUrl = await addTimestampToImage(file);
        accidentPartePreview.src = timestampedDataUrl;
        accidentPartePhotoStore = timestampedDataUrl;
        event.target.value = null;
    });
    accidentDamagePhotoInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        for (const file of files) {
            try {
                const timestampedDataUrl = await addTimestampToImage(file);
                accidentDamagePhotoStore.push(timestampedDataUrl);
            } catch (err) {
                console.error("Error procesando imagen de daño:", err);
            }
        }
        renderAccidentDamagePreviews(); 
        event.target.value = null;
    });
    accidentUploadForm.addEventListener('submit', handleAccidentUpload);


    addVehicleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddVehicle();
    });
    searchManageInput.addEventListener('input', () => {
        const searchTerm = searchManageInput.value.toUpperCase().replace(/\s/g, '');
        let resultsFound = 0;
        const allManageCards = document.querySelectorAll('#manage-vehicle-list .manage-van-card');
        allManageCards.forEach(card => {
            const plateText = card.dataset.matricula.toUpperCase().replace(/\s/g, '');
            if (plateText.includes(searchTerm)) {
                card.classList.remove('hidden'); resultsFound++;
            } else {
                card.classList.add('hidden');
            }
        });
        manageNoResults.classList.toggle('hidden', resultsFound > 0);
    });

    btnFilterAll.addEventListener('click', () => {
        currentVorFilter = 'all';
        updateVorListVisibility();
    });
    btnFilterOp.addEventListener('click', () => {
        currentVorFilter = 'op';
        updateVorListVisibility();
    });
    btnFilterVor.addEventListener('click', () => {
        currentVorFilter = 'vor';
        updateVorListVisibility();
    });
    searchVorInput.addEventListener('input', updateVorListVisibility);

    btnBackToGuanteraList.addEventListener('click', () => {
        guanteraDetailPage.classList.add('hidden');
        guanteraListPage.classList.remove('hidden');
    });
    searchGuanteraInput.addEventListener('input', () => {
        const searchTerm = searchGuanteraInput.value.toUpperCase().replace(/\s/g, '');
        let resultsFound = 0;
        const allGuanteraCards = document.querySelectorAll('#guantera-van-list-container .guantera-van-card');
        allGuanteraCards.forEach(card => {
            const plateText = card.dataset.matricula.toUpperCase().replace(/\s/g, '');
            if (plateText.includes(searchTerm)) {
                card.classList.remove('hidden'); resultsFound++;
            } else {
                card.classList.add('hidden');
            }
        });
        guanteraNoResults.classList.toggle('hidden', resultsFound > 0);
    });


    editModalCloseBtn.addEventListener('click', closeEditModal);
    editModalSaveBtn.addEventListener('click', handleUpdateNoteEntry);
    editModal.addEventListener('click', (e) => { 
        if (e.target === editModal) { closeEditModal(); }
    });
    
    datesModalCloseBtn.addEventListener('click', closeDatesModal);
    datesModalSaveBtn.addEventListener('click', handleUpdateVehicleDocsAndDates);
    datesModal.addEventListener('click', (e) => {
        if (e.target === datesModal) { closeDatesModal(); }
    });

    document.querySelectorAll('.dates-photo-input').forEach(input => {
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0]; if (!file) return;
            const storeKey = event.target.dataset.key; 
            const previewId = `preview-dates-${storeKey}`;
            
            const timestampedDataUrl = await addTimestampToImage(file);
            document.getElementById(previewId).src = timestampedDataUrl;
            docPhotoStore[storeKey] = timestampedDataUrl;
            event.target.value = null;
        });
    });
    
    suggestionFab.addEventListener('click', openSuggestionModal);
    suggestionModalCloseBtn.addEventListener('click', closeSuggestionModal);
    suggestionForm.addEventListener('submit', handleSuggestionSave);
    suggestionModal.addEventListener('click', (e) => {
        if (e.target === suggestionModal) { closeSuggestionModal(); }
    });

    helpFab.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });
    helpModalCloseBtn.addEventListener('click', () => {
        helpModal.classList.add('hidden');
    });
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });

    async function checkPendingTasksAndAlert() {
        const limiteDias = 5; 
        const hoy = new Date();
        const tasksOverdue = [];

        try {
            const result = await fetchSeguro({ action: 'getVanNotesHistory' });
            if (result.status !== 'success') { throw new Error(result.message); }

            const localHistoryDataStore = {};
            result.data.forEach(entry => {
                if (!localHistoryDataStore[entry.matricula]) {
                    localHistoryDataStore[entry.matricula] = [];
                }
                localHistoryDataStore[entry.matricula].push(entry);
            });
            
            for (const matricula in localHistoryDataStore) {
                localHistoryDataStore[matricula].forEach(entry => {
                    if (entry.estado && entry.estado.toLowerCase() === 'pendiente') {
                        try {
                            const parts = entry.timestamp.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                            if (!parts) return;

                            const taskDate = new Date(parts[3], parts[2] - 1, parts[1]);
                            
                            const timeDiff = hoy.getTime() - taskDate.getTime();
                            const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

                            if (dayDiff > limiteDias) {
                                tasksOverdue.push({
                                    matricula: matricula,
                                    nota: entry.nota || 'Sin nota',
                                    dias: dayDiff
                                });
                            }
                        } catch (e) {
                            console.error("Error al parsear fecha de tarea:", e);
                        }
                    }
                });
            }

            if (tasksOverdue.length > 0) {
                let alertMessage = `¡ALERTA DE TAREAS PENDIENTES!\n\nTienes ${tasksOverdue.length} tarea(s) pendientes por más de ${limiteDias} días:\n\n`;
                
                tasksOverdue.forEach(task => {
                    alertMessage += `  - ${task.matricula}: "${task.nota.substring(0, 30)}..." (${task.dias} días)\n`;
                });
                
                alertMessage += "\nPulsa 'Aceptar' para organizar tu jornada.";
                
                alert(alertMessage); 
            }

        } catch (error) {
            console.error("No se pudo revisar el historial de tareas para la alerta:", error.message);
        }
    }
    
    async function initializeApp() {
        try {
            loadingOverlay.classList.remove('hidden');
            loadingMessage.textContent = 'Cargando datos de vehículos...';
            appContainer.style.display = 'none';

            vanListContainer.innerHTML = '';
            qrListContainer.innerHTML = '';
            matriculaListContainer.innerHTML = '';
            manageVehicleList.innerHTML = '';
            vorVehicleList.innerHTML = '';
            guanteraVanListContainer.innerHTML = ''; 
            
            const result = await fetchSeguro({ action: 'getVehicles' });
            if (result.status !== 'success') { throw new Error(result.message); }
            appVehicleList = result.data; 

            // Carga silenciosa del stock al inicio
            loadStock(true);

            populateVanSelectionList();
            populateQRList();
            populateTireMatriculaList();
            populateManageVehicleList();
            populateVorPage();
            populateGuanteraList(); 
            
            getGlobalVisitCount();

            loadingOverlay.classList.add('hidden');
            appContainer.style.display = 'block';
            suggestionFab.classList.remove('hidden');
            helpFab.classList.remove('hidden'); 
            
            checkPendingTasksAndAlert(); 


        } catch (error) {
            loadingMessage.textContent = `Error fatal al iniciar: ${error.message}. Recarga la página.`;
            loadingMessage.classList.add('text-red-400');
            loadingOverlay.classList.remove('hidden');
        }
    }

});