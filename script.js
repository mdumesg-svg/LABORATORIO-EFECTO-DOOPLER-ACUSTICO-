/**
 * SIMULADOR DE EFECTO DOPPLER ACÚSTICO
 * Motor físico, renderizado visual, gráficas y módulo didáctico
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. ESTADO GLOBAL Y REFERENCIAS DEL DOM
    // ==========================================

    const state = {
        f: 440,        // Frecuencia (Hz)
        vS: 20,        // Velocidad fuente (m/s)
        vR: 0,         // Velocidad receptor (m/s)
        T: 20,         // Temperatura (°C)
        v: 343.4,      // Velocidad del sonido (m/s)
        fObs: 440,     // Frecuencia observada (Hz)
        lambda: 0.78,  // Longitud de onda (m)
        isPaused: false,
        time: 0,
        waves: [],
        srcX: 0,       // Posición visual de la fuente
        recX: 0,       // Posición visual del receptor
        history: [],   // Historial para gráficas
    };

    // Inputs
    const inputs = {
        frequency: document.getElementById('frequency'),
        sourceVelocity: document.getElementById('sourceVelocity'),
        receiverVelocity: document.getElementById('receiverVelocity'),
        temperature: document.getElementById('temperature'),
        waveScale: document.getElementById('waveScale'),
        waveSpacing: document.getElementById('waveSpacing'),
        directionMode: document.getElementById('directionMode'),
        themeSelect: document.getElementById('themeSelect')
    };

    // Outputs de texto
    const outputs = {
        f: document.getElementById('frequencyOut'),
        vS: document.getElementById('sourceVelocityOut'),
        vR: document.getElementById('receiverVelocityOut'),
        T: document.getElementById('temperatureOut'),
        soundSpeed: document.getElementById('soundSpeedValue'),
        observedFreq: document.getElementById('observedFrequencyValue'),
        emittedWave: document.getElementById('emittedWavelengthValue'),
        freqDelta: document.getElementById('frequencyDeltaValue'),
        dataTable: document.getElementById('dataTable')
    };

    // Toggles
    const toggles = {
        waves: document.getElementById('showWaves'),
        path: document.getElementById('showPath'),
        arrows: document.getElementById('showArrows'),
        labels: document.getElementById('showLabels'),
        receiver: document.getElementById('showReceiver')
    };

    // Canvas
    const canvas = document.getElementById('waveCanvas');
    const ctx = canvas.getContext('2d');
    
    // Gráficas (Chart.js)
    let charts = {};

    // ==========================================
    // 2. LÓGICA FÍSICA Y MATEMÁTICA
    // ==========================================

    function calculatePhysics() {
        // Leer valores de los inputs
        state.f = parseFloat(inputs.frequency.value);
        state.vS = parseFloat(inputs.sourceVelocity.value);
        state.vR = parseFloat(inputs.receiverVelocity.value);
        state.T = parseFloat(inputs.temperature.value);

        // Control de modos de dirección
        const mode = inputs.directionMode.value;
        if (mode === 'approach') {
            state.vS = Math.abs(state.vS);
            state.vR = -Math.abs(state.vR);
        } else if (mode === 'recede') {
            state.vS = -Math.abs(state.vS);
            state.vR = Math.abs(state.vR);
        } else if (mode === 'stationary') {
            state.vS = 0;
            state.vR = 0;
            inputs.sourceVelocity.value = 0;
            inputs.receiverVelocity.value = 0;
        }

        // 1. Velocidad del sonido dependiente de la temperatura
        state.v = 331.3 + (0.606 * state.T);

        // 2. Efecto Doppler
        let denom = state.v - state.vS;
        let num = state.v - state.vR;

        // Evitar singularidad
        if (Math.abs(denom) < 0.1) denom = 0.1;

        state.fObs = state.f * (num / denom);
        
        // No permitir frecuencias negativas físicamente
        if (state.fObs < 0 || state.vS >= state.v) state.fObs = 0; 

        // 3. Longitud de onda
        state.lambda = state.v / state.f;

        // Porcentaje de cambio
        const delta = ((state.fObs - state.f) / state.f) * 100;

        // ACTUALIZACIÓN DE LA UI
        outputs.f.textContent = `${state.f} Hz`;
        outputs.vS.textContent = `${state.vS} m/s`;
        outputs.vR.textContent = `${state.vR} m/s`;
        outputs.T.textContent = `${state.T} °C`;

        outputs.soundSpeed.innerHTML = `${state.v.toFixed(1)} <small>m/s</small>`;
        document.getElementById('temperatureNote').textContent = `A ${state.T} °C`;
        
        if (state.vS >= state.v) {
            outputs.observedFreq.innerHTML = `Supersónico`;
            document.getElementById('frequencyState').textContent = `Onda de choque (Mach ≥ 1)`;
            document.getElementById('physicsWarning').style.display = 'block';
        } else {
            outputs.observedFreq.innerHTML = `${state.fObs.toFixed(1)} <small>Hz</small>`;
            document.getElementById('frequencyState').textContent = delta > 0 ? 'Desplazamiento al azul (Agudo)' : (delta < 0 ? 'Desplazamiento al rojo (Grave)' : 'Sin movimiento relativo');
            document.getElementById('physicsWarning').style.display = 'none';
        }

        outputs.emittedWave.innerHTML = `${state.lambda.toFixed(3)} <small>m</small>`;
        outputs.freqDelta.innerHTML = `${delta > 0 ? '+' : ''}${delta.toFixed(1)} <small>%</small>`;

        updateFormulas(delta, num, denom);
        updateDataTable();
        updateCharts();
    }

    function updateFormulas(delta, num, denom) {
        document.getElementById('proc-sound').innerHTML = `v = 331,3 + 0,606(${state.T})<br><strong>v = ${state.v.toFixed(1)} m/s</strong>`;
        document.getElementById('proc-doppler').innerHTML = `f′ = ${state.f} · (${state.v.toFixed(1)} ${state.vR >= 0 ? '-' : '+'} ${Math.abs(state.vR)}) / (${state.v.toFixed(1)} ${state.vS >= 0 ? '-' : '+'} ${Math.abs(state.vS)})<br>f′ = ${state.f} · (${num.toFixed(1)}) / (${denom.toFixed(1)})<br><strong>f′ = ${state.fObs.toFixed(1)} Hz</strong>`;
        document.getElementById('proc-emitted').innerHTML = `λ = ${state.v.toFixed(1)} / ${state.f}<br><strong>λ = ${state.lambda.toFixed(3)} m</strong>`;
        
        let lambdaFront = (state.v - state.vS) / state.f;
        let lambdaBack = (state.v + state.vS) / state.f;
        document.getElementById('proc-frontback').innerHTML = `Frente: λ = (${state.v.toFixed(1)} - ${state.vS}) / ${state.f} = <strong>${lambdaFront.toFixed(3)} m</strong><br>Detrás: λ = (${state.v.toFixed(1)} + ${state.vS}) / ${state.f} = <strong>${lambdaBack.toFixed(3)} m</strong>`;
        
        document.getElementById('proc-delta').innerHTML = `%Δf = [(${state.fObs.toFixed(1)} - ${state.f}) / ${state.f}] · 100<br><strong>%Δf = ${delta.toFixed(1)} %</strong>`;
    }

    function updateDataTable() {
        outputs.dataTable.innerHTML = `
            <tr><td>Velocidad del Sonido</td><td>v</td><td>${state.v.toFixed(1)}</td><td>m/s</td></tr>
            <tr><td>Frecuencia Emitida</td><td>f</td><td>${state.f}</td><td>Hz</td></tr>
            <tr><td>Frecuencia Percibida</td><td>f'</td><td>${state.fObs.toFixed(1)}</td><td>Hz</td></tr>
            <tr><td>Velocidad Fuente</td><td>v<sub>s</sub></td><td>${state.vS}</td><td>m/s</td></tr>
            <tr><td>Velocidad Receptor</td><td>v<sub>r</sub></td><td>${state.vR}</td><td>m/s</td></tr>
            <tr><td>Longitud de Onda</td><td>λ</td><td>${state.lambda.toFixed(3)}</td><td>m</td></tr>
        `;
    }

    // ==========================================
    // 3. MOTOR DE RENDERIZADO (CANVAS)
    // ==========================================

    function resizeCanvas() {
        const wrap = canvas.parentElement;
        canvas.width = wrap.clientWidth;
        canvas.height = wrap.clientHeight;
        state.srcX = canvas.width / 4;
        state.recX = (canvas.width / 4) * 3;
    }

    function draw() {
        if (!state.isPaused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const visualScale = parseFloat(inputs.waveScale.value);
            const spacing = parseFloat(inputs.waveSpacing.value);
            
            const maxPxSpeed = 2;
            let vSRatio = state.vS / 340; 
            let vRRatio = state.vR / 340;

            state.srcX += vSRatio * maxPxSpeed;
            if (toggles.receiver.checked) state.recX += vRRatio * maxPxSpeed;

            if (state.srcX > canvas.width + 50) state.srcX = -50;
            if (state.srcX < -50) state.srcX = canvas.width + 50;
            if (state.recX > canvas.width + 50) state.recX = -50;
            if (state.recX < -50) state.recX = canvas.width + 50;

            state.time++;
            const waveInterval = Math.max(5, Math.floor(100 / (state.f/440 * spacing)));
            if (state.time % waveInterval === 0 && toggles.waves.checked) {
                state.waves.push({
                    x: state.srcX,
                    y: canvas.height / 2,
                    radius: 0,
                    alpha: 1
                });
            }

            if (toggles.path.checked) {
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);
                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--line');
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            if (toggles.waves.checked) {
                const colorAccent = getComputedStyle(document.body).getPropertyValue('--accent');
                
                for (let i = state.waves.length - 1; i >= 0; i--) {
                    let w = state.waves[i];
                    w.radius += (state.v / 100) * visualScale;
                    w.alpha -= 0.003 * visualScale;

                    if (w.alpha <= 0) {
                        state.waves.splice(i, 1);
                        continue;
                    }

                    ctx.beginPath();
                    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${hexToRgb(colorAccent.trim())}, ${Math.max(0, w.alpha)})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            const centerY = canvas.height / 2;

            if (toggles.receiver.checked) {
                ctx.beginPath();
                ctx.arc(state.recX, centerY, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#72a9ff';
                ctx.fill();
                
                if (toggles.labels.checked) {
                    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text');
                    ctx.font = '10px "DM Sans"';
                    ctx.fillText('Receptor', state.recX - 20, centerY - 15);
                }

                if (toggles.arrows.checked && state.vR !== 0) {
                    drawArrow(ctx, state.recX, centerY + 15, state.recX + (state.vR > 0 ? 30 : -30), centerY + 15, '#72a9ff');
                }
            }

            ctx.beginPath();
            ctx.arc(state.srcX, centerY, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffb66b';
            ctx.fill();

            if (toggles.labels.checked) {
                ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text');
                ctx.font = '10px "DM Sans"';
                ctx.fillText('Fuente', state.srcX - 15, centerY - 15);
            }

            if (toggles.arrows.checked && state.vS !== 0) {
                drawArrow(ctx, state.srcX, centerY + 15, state.srcX + (state.vS > 0 ? 30 : -30), centerY + 15, '#ffb66b');
            }
        }
        requestAnimationFrame(draw);
    }

    function drawArrow(ctx, fromx, fromy, tox, toy, color) {
        const headlen = 6;
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function hexToRgb(hex) {
        if (hex.startsWith('#')) {
            hex = hex.slice(1);
            if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
            const r = parseInt(hex.substring(0,2), 16);
            const g = parseInt(hex.substring(2,4), 16);
            const b = parseInt(hex.substring(4,6), 16);
            return `${r}, ${g}, ${b}`;
        }
        return '99, 215, 198';
    }

    // ==========================================
    // 4. GRÁFICAS (Chart.js)
    // ==========================================

    function initCharts() {
        Chart.defaults.color = '#91a2bd';
        Chart.defaults.font.family = "'DM Sans', sans-serif";

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(145, 162, 189, 0.1)' } },
                y: { grid: { color: 'rgba(145, 162, 189, 0.1)' } }
            }
        };

        charts.source = new Chart(document.getElementById('chartSource'), {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Frecuencia (Hz)', data: [], borderColor: '#63d7c6', tension: 0.4 }] },
            options: { ...commonOptions, scales: { x: { title: { display: true, text: 'v_s (m/s)' } } } }
        });

        charts.wavelength = new Chart(document.getElementById('chartWavelength'), {
            type: 'bar',
            data: {
                labels: ['Frente', 'Detrás'],
                datasets: [{ data: [0, 0], backgroundColor: ['#ffb66b', '#7aa7ff'] }]
            },
            options: commonOptions
        });

        charts.compare = new Chart(document.getElementById('chartCompare'), {
            type: 'bar',
            data: {
                labels: ['Emitida (f)', 'Percibida (f\')'],
                datasets: [{ data: [0, 0], backgroundColor: ['#91a2bd', '#63d7c6'] }]
            },
            options: commonOptions
        });

        charts.speed = new Chart(document.getElementById('chartSpeed'), {
            type: 'doughnut',
            data: {
                labels: ['Velocidad Fuente', 'Margen hasta Mach 1'],
                datasets: [{ data: [0, 100], backgroundColor: ['#f5bd62', '#263651'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } }
        });

        charts.time = new Chart(document.getElementById('chartTime'), {
            type: 'line',
            data: { labels: Array(20).fill(''), datasets: [{ data: Array(20).fill(null), borderColor: '#7aa7ff', fill: true, backgroundColor: 'rgba(122, 167, 255, 0.1)' }] },
            options: { ...commonOptions, animation: false, scales: { y: { min: 0 } } }
        });
    }

    function updateCharts() {
        if (!charts.source) return;

        let vSData = [], fData = [];
        for (let v = -100; v <= 100; v += 20) {
            vSData.push(v);
            let denom = state.v - v;
            let val = state.f * ((state.v - state.vR) / (denom === 0 ? 0.1 : denom));
            fData.push(val > 0 ? val : 0);
        }
        charts.source.data.labels = vSData;
        charts.source.data.datasets[0].data = fData;
        charts.source.update();

        let lambdaFront = (state.v - state.vS) / state.f;
        let lambdaBack = (state.v + state.vS) / state.f;
        charts.wavelength.data.datasets[0].data = [lambdaFront, lambdaBack];
        charts.wavelength.update();

        charts.compare.data.datasets[0].data = [state.f, state.fObs];
        charts.compare.update();

        let mach = Math.abs(state.vS) / state.v;
        charts.speed.data.datasets[0].data = [mach, Math.max(0, 1 - mach)];
        charts.speed.update();

        if (!state.isPaused) {
            state.history.push(state.fObs);
            if (state.history.length > 20) state.history.shift();
            charts.time.data.datasets[0].data = state.history;
            charts.time.update();
        }
    }


    // ==========================================
    // 5. EVENTOS E INICIALIZACIÓN
    // ==========================================

    Object.values(inputs).forEach(input => {
        if (input.type === 'range' || input.tagName === 'SELECT') {
            input.addEventListener('input', calculatePhysics);
        }
    });

    inputs.themeSelect.addEventListener('change', (e) => {
        document.body.setAttribute('data-theme', e.target.value);
        Chart.defaults.color = getComputedStyle(document.body).getPropertyValue('--muted');
        Object.values(charts).forEach(c => c.update());
    });

    document.getElementById('pauseBtn').addEventListener('click', (e) => {
        state.isPaused = !state.isPaused;
        e.target.textContent = state.isPaused ? 'Reanudar' : 'Pausar';
        e.target.classList.toggle('btn-outline');
        e.target.classList.toggle('btn-primary');
    });

    document.getElementById('restartAnimationBtn').addEventListener('click', () => {
        state.waves = [];
        state.history = [];
        resizeCanvas();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        inputs.frequency.value = 440;
        inputs.sourceVelocity.value = 20;
        inputs.receiverVelocity.value = 0;
        inputs.temperature.value = 20;
        inputs.directionMode.value = 'custom';
        calculatePhysics();
        state.waves = [];
    });

    document.querySelectorAll('.mini-button').forEach(btn => {
        if(!btn.classList.contains('btn-load-ex')) {
            btn.addEventListener('click', (e) => {
                const procId = 'proc-' + e.target.getAttribute('data-procedure');
                const panel = document.getElementById(procId);
                panel.classList.toggle('open');
                e.target.textContent = panel.classList.contains('open') ? 'Ocultar' : 'Ver procedimiento';
            });
        }
    });

    const qrModal = document.getElementById('qrModal');
    let qrInst = null;
    
    document.getElementById('shareBtn').addEventListener('click', () => {
        const url = window.location.href.split('?')[0]; 
        document.getElementById('pageUrl').value = url;
        
        if(!qrInst) {
            qrInst = new QRCode(document.getElementById("qrcode"), {
                text: url,
                width: 170,
                height: 170,
                colorDark : "#0a1020",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.M
            });
        } else {
            qrInst.clear();
            qrInst.makeCode(url);
        }
        qrModal.classList.add('open');
    });

    document.getElementById('closeQrBtn').addEventListener('click', () => qrModal.classList.remove('open'));
    
    document.getElementById('copyUrlBtn').addEventListener('click', (e) => {
        navigator.clipboard.writeText(document.getElementById('pageUrl').value);
        e.target.textContent = '¡Copiado!';
        setTimeout(() => e.target.textContent = 'Copiar', 2000);
    });

    window.addEventListener('resize', resizeCanvas);


    // ==========================================
    // 6. MÓDULO DIDÁCTICO Y EXPORTACIÓN A EXCEL
    // ==========================================

    document.querySelectorAll('.btn-load-ex').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const f = e.target.getAttribute('data-f');
            const vs = e.target.getAttribute('data-vs');
            const vr = e.target.getAttribute('data-vr');
            const t = e.target.getAttribute('data-t');

            if (f) inputs.frequency.value = f;
            if (vs) inputs.sourceVelocity.value = vs;
            if (vr) inputs.receiverVelocity.value = vr;
            if (t) inputs.temperature.value = t;
            
            inputs.directionMode.value = 'custom'; 
            calculatePhysics();
            
            const originalText = e.target.textContent;
            e.target.textContent = '¡Variables cargadas!';
            setTimeout(() => {
                e.target.textContent = originalText;
            }, 1500);
        });
    });

    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            let csvContent = "Variable;Simbolo;Valor;Unidad\n";
            
            const dataRows = [
                ["Temperatura", "T", state.T, "°C"],
                ["Velocidad del Sonido", "v", state.v.toFixed(2).replace('.', ','), "m/s"],
                ["Frecuencia Emitida", "f", state.f, "Hz"],
                ["Frecuencia Percibida", "f'", state.fObs.toFixed(2).replace('.', ','), "Hz"],
                ["Velocidad Fuente", "vs", state.vS, "m/s"],
                ["Velocidad Receptor", "vr", state.vR, "m/s"],
                ["Longitud de Onda Frontal", "λ_front", ((state.v - state.vS)/state.f).toFixed(3).replace('.', ','), "m"],
                ["Longitud de Onda Posterior", "λ_back", ((state.v + state.vS)/state.f).toFixed(3).replace('.', ','), "m"]
            ];

            dataRows.forEach(row => {
                csvContent += row.join(";") + "\n";
            });

            const bom = "\uFEFF";
            const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `doppler_datos_${new Date().getTime()}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Boot
    resizeCanvas();
    initCharts();
    calculatePhysics();
    requestAnimationFrame(draw);
    
    setInterval(() => { if(!state.isPaused) updateCharts() }, 1000);
});