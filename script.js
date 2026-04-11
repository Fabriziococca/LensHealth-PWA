document.addEventListener("DOMContentLoaded", () => {
    // 1. Variables de Estado
    let startTime = localStorage.getItem('lensesStartTime');
    let interval;
    let notificationSent = false;
    const CIRCUMFERENCE = 502; // 2 * Math.PI * 80

    // Límites de descarte (Días) para el Semáforo
    const LIMITS = {
        lenses: 60,
        solution: 90,
        case: 90,
        systane: 90
    };

    // 2. DOM Elements - Timer y UI
    const uiActiveState = document.getElementById('activeState');
    const uiIdleState = document.getElementById('idleState');
    const uiStartTimeDisplay = document.getElementById('startTimeDisplay');
    const uiTimer = document.getElementById('timer');
    const ring = document.getElementById('progressRing');
    const inputCustomTime = document.getElementById('customTime');
    const btnPut = document.getElementById('btnPut');
    const btnRemove = document.getElementById('btnRemove');
    
    // 3. DOM Elements - Insumos, Stock y Fechas
    const inputLensDate = document.getElementById('lensDate');
    const inputSolutionDate = document.getElementById('solutionDate');
    const inputCaseDate = document.getElementById('caseDate');
    const inputSystaneDate = document.getElementById('systaneDate');
    
    const uiLensDays = document.getElementById('lensDaysElapsed');
    const uiSolutionDays = document.getElementById('solutionDaysElapsed');
    const uiCaseDays = document.getElementById('caseDaysElapsed');
    const uiSystaneDays = document.getElementById('systaneDaysElapsed');
    
    const inputStock = document.getElementById('lensStock');
    const btnNewPair = document.getElementById('btnNewPair');
    const stockWarning = document.getElementById('stockWarning');
    
    // 4. DOM Elements - Historial y Backup
    const historyList = document.getElementById('historyList');
    const btnClearHistory = document.getElementById('btnClearHistory');
    const btnExport = document.getElementById('btnExport');
    const importFile = document.getElementById('importFile');

    // ---------------- LÓGICA DEL TIMER ---------------- //

    function requestNotificationPermission() {
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }

    function updateUI() {
        if (startTime) {
            if (uiActiveState) uiActiveState.classList.remove('hidden');
            if (uiIdleState) uiIdleState.classList.add('hidden');
            
            const start = new Date(startTime);
            const hours = start.getHours().toString().padStart(2, '0');
            const minutes = start.getMinutes().toString().padStart(2, '0');
            if (uiStartTimeDisplay) uiStartTimeDisplay.innerText = `Puestos a las ${hours}:${minutes}`;
            
            if (interval) clearInterval(interval);
            interval = setInterval(calculateTime, 1000);
            calculateTime(); 
        } else {
            if (uiActiveState) uiActiveState.classList.add('hidden');
            if (uiIdleState) uiIdleState.classList.remove('hidden');
            if (interval) clearInterval(interval);
        }
    }

    function calculateTime() {
        if (!startTime) return;
        const now = new Date();
        const start = new Date(startTime);
        const diff = now - start;

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        if (uiTimer) uiTimer.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        const maxHours = 10;
        const totalSeconds = (h * 3600) + (m * 60) + s;
        const maxSeconds = maxHours * 3600;
        let percent = totalSeconds / maxSeconds;
        if (percent > 1) percent = 1;

        if (ring) {
            const offset = CIRCUMFERENCE - (percent * CIRCUMFERENCE);
            ring.style.strokeDashoffset = offset;
            if (h < 6) ring.style.stroke = "var(--success)";
            else if (h < 8) ring.style.stroke = "var(--warning)";
            else ring.style.stroke = "var(--danger)";
        }

        if (h >= 8 && !notificationSent && "Notification" in window && Notification.permission === "granted") {
            new Notification("LensTracker", { body: "Llevás 8 horas con los lentes. ¡Dales un descanso!", icon: "icon.png" });
            notificationSent = true;
        }
    }

    function putLenses() {
        requestNotificationPermission();
        const customValue = inputCustomTime ? inputCustomTime.value : "";
        let start = new Date();
        
        if (customValue) {
            const [h, m] = customValue.split(':');
            start.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
            if(start > new Date()) start.setDate(start.getDate() - 1);
        }

        startTime = start.toISOString();
        notificationSent = false;
        localStorage.setItem('lensesStartTime', startTime);
        if (inputCustomTime) inputCustomTime.value = '';
        updateUI();
    }

    function removeLenses() {
        if (confirm('¿Te sacaste los lentes?')) {
            saveToHistory();
            localStorage.removeItem('lensesStartTime');
            startTime = null;
            updateUI();
        }
    }

    // ---------------- LÓGICA DE INSUMOS, STOCK Y COLORES ---------------- //

    function updateLabelStyle(element, days, limit) {
        if (!element) return;
        if (days === "--") {
            element.style.color = "var(--primary)"; // Color default si no hay fecha
            return;
        }
        
        const daysInt = parseInt(days);
        if (daysInt >= limit) {
            element.style.color = "var(--danger)"; // Rojo: Vencido
        } else if (daysInt >= limit * 0.85) {
            element.style.color = "var(--warning)"; // Amarillo: Cerca del límite (85%)
        } else {
            element.style.color = "var(--success)"; // Verde: En regla
        }
    }

    function calculateDaysElapsed(dateString) {
        if (!dateString) return "--";
        const start = new Date(dateString);
        const diffTime = Math.abs(new Date() - start);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    function loadDatesAndStock() {
        const lDate = localStorage.getItem('lensDate');
        const sDate = localStorage.getItem('solutionDate');
        const cDate = localStorage.getItem('caseDate');
        const sysDate = localStorage.getItem('systaneDate');
        let stock = localStorage.getItem('lensStock') || 0;
        
        if (inputStock) inputStock.value = stock;
        checkStockWarning(stock);

        // Lentes
        const lDays = calculateDaysElapsed(lDate);
        if (inputLensDate) inputLensDate.value = lDate || "";
        if (uiLensDays) {
            uiLensDays.innerText = `${lDays} días de uso`;
            updateLabelStyle(uiLensDays, lDays, LIMITS.lenses);
        }

        // Líquido
        const sDays = calculateDaysElapsed(sDate);
        if (inputSolutionDate) inputSolutionDate.value = sDate || "";
        if (uiSolutionDays) {
            uiSolutionDays.innerText = `${sDays} días de uso`;
            updateLabelStyle(uiSolutionDays, sDays, LIMITS.solution);
        }

        // Estuche
        const cDays = calculateDaysElapsed(cDate);
        if (inputCaseDate) inputCaseDate.value = cDate || "";
        if (uiCaseDays) {
            uiCaseDays.innerText = `${cDays} días de uso`;
            updateLabelStyle(uiCaseDays, cDays, LIMITS.case);
        }

        // Systane
        const sysDays = calculateDaysElapsed(sysDate);
        if (inputSystaneDate) inputSystaneDate.value = sysDate || "";
        if (uiSystaneDays) {
            uiSystaneDays.innerText = `${sysDays} días de uso`;
            updateLabelStyle(uiSystaneDays, sysDays, LIMITS.systane);
        }
    }

    function checkStockWarning(stock) {
        if (!stockWarning) return;
        if (parseInt(stock) <= 1) stockWarning.classList.remove('hidden');
        else stockWarning.classList.add('hidden');
    }

    // Listeners para cambios manuales en fechas e insumos
    if (inputLensDate) inputLensDate.addEventListener('change', (e) => { localStorage.setItem('lensDate', e.target.value); loadDatesAndStock(); });
    if (inputSolutionDate) inputSolutionDate.addEventListener('change', (e) => { localStorage.setItem('solutionDate', e.target.value); loadDatesAndStock(); });
    if (inputCaseDate) inputCaseDate.addEventListener('change', (e) => { localStorage.setItem('caseDate', e.target.value); loadDatesAndStock(); });
    if (inputSystaneDate) inputSystaneDate.addEventListener('change', (e) => { localStorage.setItem('systaneDate', e.target.value); loadDatesAndStock(); });
    if (inputStock) inputStock.addEventListener('change', (e) => { localStorage.setItem('lensStock', e.target.value); checkStockWarning(e.target.value); });

    if (btnNewPair) {
        btnNewPair.addEventListener('click', () => {
            let stock = parseInt(localStorage.getItem('lensStock')) || 0;
            if (stock > 0) {
                stock -= 1;
                localStorage.setItem('lensStock', stock);
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('lensDate', today);
                loadDatesAndStock();
                alert('Nuevo par en uso. Stock descontado.');
            } else {
                alert('El stock ya está en 0.');
            }
        });
    }

    // ---------------- LÓGICA DEL HISTORIAL ---------------- //

    function saveToHistory() {
        if (!startTime) return;
        const start = new Date(startTime);
        const end = new Date();
        const diff = end - start;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        
        const session = {
            date: start.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
            duration: `${h}h ${m}m`
        };

        let history = JSON.parse(localStorage.getItem('lensesHistory')) || [];
        history.unshift(session);
        if (history.length > 7) history.pop();
        
        localStorage.setItem('lensesHistory', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        if (!historyList) return;
        const history = JSON.parse(localStorage.getItem('lensesHistory')) || [];
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<li><span class="hist-date">Sin registros aún</span></li>';
            return;
        }

        history.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="hist-date">${item.date}</span> <span class="hist-time">${item.duration}</span>`;
            historyList.appendChild(li);
        });
    }

    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            if(confirm('¿Borrar el historial de usos?')) {
                localStorage.removeItem('lensesHistory');
                renderHistory();
            }
        });
    }

    // ---------------- BACKUP SYSTEM (JSON) ---------------- //

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const data = {
                lensDate: localStorage.getItem('lensDate'),
                solutionDate: localStorage.getItem('solutionDate'),
                caseDate: localStorage.getItem('caseDate'),
                systaneDate: localStorage.getItem('systaneDate'),
                lensStock: localStorage.getItem('lensStock'),
                lensesHistory: localStorage.getItem('lensesHistory'),
                lensesStartTime: localStorage.getItem('lensesStartTime')
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `LensTracker_Backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        });
    }

    if (importFile) {
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    Object.keys(data).forEach(key => { 
                        if(data[key] !== null && data[key] !== undefined) {
                            localStorage.setItem(key, data[key]); 
                        }
                    });
                    alert('Backup restaurado correctamente.');
                    location.reload();
                } catch (err) { alert('Archivo inválido.'); }
            };
            reader.readAsText(file);
        });
    }

    // ---------------- ARRANQUE ---------------- //

    if (btnPut) btnPut.addEventListener('click', putLenses);
    if (btnRemove) btnRemove.addEventListener('click', removeLenses);

    updateUI();
    loadDatesAndStock();
    renderHistory();
});