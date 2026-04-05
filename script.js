document.addEventListener("DOMContentLoaded", () => {
    // Variables de estado
    let startTime = localStorage.getItem('lensesStartTime');
    let interval;
    let notificationSent = false;
    const CIRCUMFERENCE = 502; // 2 * Math.PI * 80 (radio del SVG)

    // DOM Elements
    const uiActiveState = document.getElementById('activeState');
    const uiIdleState = document.getElementById('idleState');
    const uiStartTimeDisplay = document.getElementById('startTimeDisplay');
    const uiTimer = document.getElementById('timer');
    const ring = document.getElementById('progressRing');
    const inputCustomTime = document.getElementById('customTime');
    const btnPut = document.getElementById('btnPut');
    const btnRemove = document.getElementById('btnRemove');
    
    // Insumos Elements
    const inputLensDate = document.getElementById('lensDate');
    const inputSolutionDate = document.getElementById('solutionDate');
    const uiLensDays = document.getElementById('lensDaysElapsed');
    const uiSolutionDays = document.getElementById('solutionDaysElapsed');
    
    // History Elements
    const historyList = document.getElementById('historyList');
    const btnClearHistory = document.getElementById('btnClearHistory');

    // ---------------- LÓGICA DEL TIMER Y ANILLO ---------------- //

    function requestNotificationPermission() {
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }

    function updateUI() {
        if (startTime) {
            uiActiveState.classList.remove('hidden');
            uiIdleState.classList.add('hidden');
            
            const start = new Date(startTime);
            const hours = start.getHours().toString().padStart(2, '0');
            const minutes = start.getMinutes().toString().padStart(2, '0');
            uiStartTimeDisplay.innerText = `Puestos a las ${hours}:${minutes}`;
            
            if (interval) clearInterval(interval);
            interval = setInterval(calculateTime, 1000);
            calculateTime(); 
        } else {
            uiActiveState.classList.add('hidden');
            uiIdleState.classList.remove('hidden');
            if (interval) clearInterval(interval);
        }
    }

    function calculateTime() {
        const now = new Date();
        const start = new Date(startTime);
        const diff = now - start;

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        uiTimer.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        // Lógica del Anillo (Máximo 10 horas = 100% relleno)
        const maxHours = 10;
        const totalSeconds = (h * 3600) + (m * 60) + s;
        const maxSeconds = maxHours * 3600;
        let percent = totalSeconds / maxSeconds;
        if (percent > 1) percent = 1;

        const offset = CIRCUMFERENCE - (percent * CIRCUMFERENCE);
        ring.style.strokeDashoffset = offset;

        // Colores del anillo según horas
        if (h < 6) {
            ring.style.stroke = "var(--success)"; // Verde
            uiTimer.style.color = "var(--text)";
        } else if (h < 8) {
            ring.style.stroke = "var(--warning)"; // Amarillo
            uiTimer.style.color = "var(--warning)";
        } else {
            ring.style.stroke = "var(--danger)"; // Rojo
            uiTimer.style.color = "var(--danger)";
            
            // Disparar Notificación si pasaron 8h
            if (!notificationSent && "Notification" in window && Notification.permission === "granted") {
                new Notification("LensTracker", {
                    body: "Llevás 8 horas con los lentes puestos. ¡Considerá darles un descanso!",
                    icon: "icon.png"
                });
                notificationSent = true;
            }
        }
    }

    function putLenses() {
        requestNotificationPermission();
        const customTime = inputCustomTime.value;
        let start;
        
        if (customTime) {
            start = new Date();
            const [h, m] = customTime.split(':');
            start.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
            if(start > new Date()) start.setDate(start.getDate() - 1); // Si puso una hora mayor a la actual, fue ayer
        } else {
            start = new Date();
        }

        startTime = start.toISOString();
        notificationSent = false;
        localStorage.setItem('lensesStartTime', startTime);
        inputCustomTime.value = ''; // Limpiar input
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

    // ---------------- LÓGICA DE INSUMOS ---------------- //

    function loadDates() {
        const lDate = localStorage.getItem('lensDate');
        const sDate = localStorage.getItem('solutionDate');
        
        if (lDate) {
            inputLensDate.value = lDate;
            uiLensDays.innerText = `${calculateDaysElapsed(lDate)} días de uso`;
        }
        if (sDate) {
            inputSolutionDate.value = sDate;
            uiSolutionDays.innerText = `${calculateDaysElapsed(sDate)} días de uso`;
        }
    }

    function calculateDaysElapsed(dateString) {
        const start = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    inputLensDate.addEventListener('change', (e) => {
        localStorage.setItem('lensDate', e.target.value);
        loadDates();
    });

    inputSolutionDate.addEventListener('change', (e) => {
        localStorage.setItem('solutionDate', e.target.value);
        loadDates();
    });

    // ---------------- LÓGICA DEL HISTORIAL ---------------- //

    function saveToHistory() {
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
        history.unshift(session); // Agregar al principio
        if (history.length > 7) history.pop(); // Mantener solo los últimos 7
        
        localStorage.setItem('lensesHistory', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
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

    btnClearHistory.addEventListener('click', () => {
        if(confirm('¿Borrar el historial de usos?')) {
            localStorage.removeItem('lensesHistory');
            renderHistory();
        }
    });

    // ---------------- BINDINGS Y ARRANQUE ---------------- //

    btnPut.addEventListener('click', putLenses);
    btnRemove.addEventListener('click', removeLenses);

    updateUI();
    loadDates();
    renderHistory();
});