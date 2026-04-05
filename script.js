document.addEventListener("DOMContentLoaded", () => {
    let startTime = localStorage.getItem('lensesStartTime');
    let interval;

    // Elementos del DOM
    const uiActiveState = document.getElementById('activeState');
    const uiIdleState = document.getElementById('idleState');
    const uiStartTimeDisplay = document.getElementById('startTimeDisplay');
    const uiTimer = document.getElementById('timer');
    const inputCustomTime = document.getElementById('customTime');
    const btnPut = document.getElementById('btnPut');
    const btnRemove = document.getElementById('btnRemove');

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
            calculateTime(); // Llamada inmediata para evitar lag de 1s
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

        uiTimer.innerText = 
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        // Alerta visual a las 8 horas de uso
        if (h >= 8) {
            uiTimer.style.color = '#fb7185';
        } else {
            uiTimer.style.color = 'white';
        }
    }

    function putLenses() {
        const customTime = inputCustomTime.value;
        let start;
        
        if (customTime) {
            start = new Date();
            const [h, m] = customTime.split(':');
            start.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        } else {
            start = new Date();
        }

        startTime = start.toISOString();
        localStorage.setItem('lensesStartTime', startTime);
        updateUI();
    }

    function removeLenses() {
        if (confirm('¿Te sacaste los lentes?')) {
            localStorage.removeItem('lensesStartTime');
            startTime = null;
            updateUI();
        }
    }

    // Bind de eventos
    btnPut.addEventListener('click', putLenses);
    btnRemove.addEventListener('click', removeLenses);

    // Arranque inicial
    updateUI();
});