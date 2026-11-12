/**
 * SIMULADOR DE EFECTO DOPPLER ACÚSTICO Y AULA VIRTUAL (LMS)
 * UNEMI - Laboratorio Virtual de Física (Plan Gratuito Spark)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. ESTADO GLOBAL
    const state = {
        f: 440,
        vS: 20,
        vR: 0,
        T: 20,
        amplitude: 1.0,
        waveScale: 1.0,
        waveSpacing: 1.0,
        v: 343.4,
        fObs: 440,
        lambda: 0.78,
        isPaused: false,
        time: 0,
        waves: [],
        srcX: 0,
        recX: 0,
        history: []
    };

    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;
    let isAudioPlaying = false;
    let charts = {};

    const inputs = {
        frequency: document.getElementById('frequency'),
        sourceVelocity: document.getElementById('sourceVelocity'),
        receiverVelocity: document.getElementById('receiverVelocity'),
        temperature: document.getElementById('temperature'),
        amplitude: document.getElementById('amplitude'),
        waveScale: document.getElementById('waveScale'),
        waveSpacing: document.getElementById('waveSpacing'),
        directionMode: document.getElementById('directionMode'),
        themeSelect: document.getElementById('themeSelect')
    };

    const outputs = {
        f: document.getElementById('frequencyOut'),
        vS: document.getElementById('sourceVelocityOut'),
        vR: document.getElementById('receiverVelocityOut'),
        T: document.getElementById('temperatureOut'),
        amplitude: document.getElementById('amplitudeOut'),
        waveScale: document.getElementById('waveScaleOut'),
        waveSpacing: document.getElementById('waveSpacingOut'),
        soundSpeed: document.getElementById('soundSpeedValue'),
        tempNote: document.getElementById('temperatureNote'),
        observedFreq: document.getElementById('observedFrequencyValue'),
        freqState: document.getElementById('frequencyState'),
        emittedWave: document.getElementById('emittedWavelengthValue'),
        freqDelta: document.getElementById('frequencyDeltaValue')
    };

    const toggles = {
        waves: document.getElementById('showWaves'),
        path: document.getElementById('showPath'),
        arrows: document.getElementById('showArrows'),
        labels: document.getElementById('showLabels'),
        receiver: document.getElementById('showReceiver')
    };

    const canvas = document.getElementById('waveCanvas');
    const ctx = canvas.getContext('2d');

    // 2. WEB AUDIO API (SONIDO DOPPLER Y TIMBRE DE NOTIFICACIÓN)
    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
            oscillator = audioCtx.createOscillator();
            gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = state.fObs || state.f;
            gainNode.gain.value = 0;
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
        }
    }

    function playNotificationSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const notifCtx = audioCtx || new AudioContext();
            if (notifCtx.state === 'suspended') notifCtx.resume();

            const osc = notifCtx.createOscillator();
            const gain = notifCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, notifCtx.currentTime);
            osc.frequency.setValueAtTime(880, notifCtx.currentTime + 0.11);

            gain.gain.setValueAtTime(0.08, notifCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, notifCtx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(notifCtx.destination);
            osc.start();
            osc.stop(notifCtx.currentTime + 0.36);
        } catch (e) {}
    }

    function toggleAudio(btn) {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        isAudioPlaying = !isAudioPlaying;

        if (isAudioPlaying) {
            gainNode.gain.setTargetAtTime(0.1, audioCtx.currentTime, 0.05);
            btn.innerHTML = '🔇 Silenciar';
            btn.classList.replace('btn-outline', 'btn-primary');
        } else {
            gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
            btn.innerHTML = '🔊 Sonido';
            btn.classList.replace('btn-primary', 'btn-outline');
        }
    }

    // 3. MOTOR FÍSICO Y CÁLCULO DE FÓRMULAS
    function calculatePhysics() {
        state.f = parseFloat(inputs.frequency.value);
        state.vS = parseFloat(inputs.sourceVelocity.value);
        state.vR = parseFloat(inputs.receiverVelocity.value);
        state.T = parseFloat(inputs.temperature.value);
        state.amplitude = parseFloat(inputs.amplitude.value);
        state.waveScale = parseFloat(inputs.waveScale.value);
        state.waveSpacing = parseFloat(inputs.waveSpacing.value);

        const mode = inputs.directionMode.value;
        if (mode === 'approach') {
            state.vS = Math.abs(state.vS) || 30;
            state.vR = -Math.abs(state.vR);
            inputs.sourceVelocity.value = state.vS;
            inputs.receiverVelocity.value = state.vR;
        } else if (mode === 'recede') {
            state.vS = -Math.abs(state.vS) || -30;
            state.vR = Math.abs(state.vR);
            inputs.sourceVelocity.value = state.vS;
            inputs.receiverVelocity.value = state.vR;
        } else if (mode === 'stationary') {
            state.vS = 0;
            state.vR = 0;
            inputs.sourceVelocity.value = 0;
            inputs.receiverVelocity.value = 0;
        }

        state.v = 331.3 + (0.606 * state.T);
        let denom = state.v - state.vS;
        let num = state.v - state.vR;
        if (Math.abs(denom) < 0.1) denom = 0.1;

        state.fObs = state.f * (num / denom);
        if (state.fObs < 0 || state.vS >= state.v) state.fObs = 0;

        state.lambda = state.v / state.f;
        const delta = ((state.fObs - state.f) / state.f) * 100;

        if (oscillator && isAudioPlaying && state.fObs > 0) {
            oscillator.frequency.setTargetAtTime(Math.min(state.fObs, 4000), audioCtx.currentTime, 0.08);
        }

        outputs.f.textContent = `${state.f} Hz`;
        outputs.vS.textContent = `${state.vS} m/s`;
        outputs.vR.textContent = `${state.vR} m/s`;
        outputs.T.textContent = `${state.T} °C`;
        outputs.amplitude.textContent = state.amplitude.toFixed(1);
        outputs.waveScale.textContent = `${state.waveScale.toFixed(1)}×`;
        outputs.waveSpacing.textContent = `${state.waveSpacing.toFixed(1)}×`;

        outputs.soundSpeed.innerHTML = `${state.v.toFixed(1)} <small>m/s</small>`;
        outputs.tempNote.textContent = `A ${state.T} °C`;

        if (state.vS >= state.v) {
            outputs.observedFreq.innerHTML = `Supersónico`;
            outputs.freqState.textContent = `Mach ${(state.vS / state.v).toFixed(2)}`;
            document.getElementById('physicsWarning').style.display = 'block';
        } else {
            outputs.observedFreq.innerHTML = `${state.fObs.toFixed(1)} <small>Hz</small>`;
            document.getElementById('physicsWarning').style.display = 'none';
            if (Math.abs(delta) < 0.05) outputs.freqState.textContent = 'Sin desplazamiento Doppler';
            else if (delta > 0) outputs.freqState.textContent = 'Tono más agudo (compresión)';
            else outputs.freqState.textContent = 'Tono más grave (expansión)';
        }

        outputs.emittedWave.innerHTML = `${state.lambda.toFixed(3)} <small>m</small>`;
        outputs.freqDelta.innerHTML = `${delta > 0 ? '+' : ''}${delta.toFixed(1)} <small>%</small>`;

        updateFormulas(delta, num, denom);
        updateDataTable();
        updateCharts();
    }

    function updateFormulas(delta, num, denom) {
        document.getElementById('proc-sound').innerHTML =
            `v = 331,3 + 0,606(${state.T})<br><strong>v = ${state.v.toFixed(1)} m/s</strong>`;

        document.getElementById('proc-doppler').innerHTML =
            `f′ = ${state.f} · (${state.v.toFixed(1)} ${state.vR >= 0 ? '−' : '+'} ${Math.abs(state.vR)}) / (${state.v.toFixed(1)} ${state.vS >= 0 ? '−' : '+'} ${Math.abs(state.vS)})<br>` +
            `f′ = ${state.f} · (${num.toFixed(1)}) / (${denom.toFixed(1)})<br><strong>f′ = ${state.fObs.toFixed(1)} Hz</strong>`;

        document.getElementById('proc-emitted').innerHTML =
            `λ = ${state.v.toFixed(1)} / ${state.f}<br><strong>λ = ${state.lambda.toFixed(3)} m</strong>`;

        const lambdaFront = Math.max(0, (state.v - state.vS) / state.f);
        const lambdaBack = (state.v + state.vS) / state.f;
        document.getElementById('proc-frontback').innerHTML =
            `Frente: λ = (${state.v.toFixed(1)} − ${state.vS}) / ${state.f} = <strong>${lambdaFront.toFixed(3)} m</strong><br>` +
            `Detrás: λ = (${state.v.toFixed(1)} + ${state.vS}) / ${state.f} = <strong>${lambdaBack.toFixed(3)} m</strong>`;

        document.getElementById('proc-delta').innerHTML =
            `%Δf = [(${state.fObs.toFixed(1)} − ${state.f}) / ${state.f}] · 100<br><strong>%Δf = ${delta.toFixed(1)} %</strong>`;
    }

    function updateDataTable() {
        document.getElementById('dataTable').innerHTML = `
            <tr><td>Velocidad del sonido</td><td>v</td><td>${state.v.toFixed(1)}</td><td>m/s</td></tr>
            <tr><td>Frecuencia emitida</td><td>f</td><td>${state.f}</td><td>Hz</td></tr>
            <tr><td>Frecuencia percibida</td><td>f′</td><td>${state.fObs.toFixed(1)}</td><td>Hz</td></tr>
            <tr><td>Velocidad de la fuente</td><td>vₛ</td><td>${state.vS}</td><td>m/s</td></tr>
            <tr><td>Velocidad del receptor</td><td>vᵣ</td><td>${state.vR}</td><td>m/s</td></tr>
            <tr><td>Longitud de onda emitida</td><td>λ</td><td>${state.lambda.toFixed(3)}</td><td>m</td></tr>
        `;
    }

    // 4. GRÁFICAS (5 PANELES)
    function initCharts() {
        Chart.defaults.color = '#91a2bd';
        Chart.defaults.font.family = "'DM Sans', sans-serif";
        const opts = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(145,162,189,0.1)' } },
                y: { grid: { color: 'rgba(145,162,189,0.1)' } }
            }
        };

        charts.source = new Chart(document.getElementById('chartSource'), {
            type: 'line',
            data: { labels: [], datasets: [{ data: [], borderColor: '#63d7c6', tension: 0.35 }] },
            options: opts
        });

        charts.wavelength = new Chart(document.getElementById('chartWavelength'), {
            type: 'bar',
            data: { labels: ['Frente (λ−)', 'Detrás (λ+)'], datasets: [{ data: [0, 0], backgroundColor: ['#ffb66b', '#72a9ff'] }] },
            options: opts
        });

        charts.compare = new Chart(document.getElementById('chartCompare'), {
            type: 'bar',
            data: { labels: ['Emitida (f)', 'Percibida (f′)'], datasets: [{ data: [0, 0], backgroundColor: ['#91a2bd', '#63d7c6'] }] },
            options: opts
        });

        charts.speed = new Chart(document.getElementById('chartSpeed'), {
            type: 'doughnut',
            data: {
                labels: ['Número de Mach', 'Margen subsónico'],
                datasets: [{ data: [0, 1], backgroundColor: ['#ffb66b', '#243452'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } }
        });

        charts.time = new Chart(document.getElementById('chartTime'), {
            type: 'line',
            data: {
                labels: Array(25).fill(''),
                datasets: [{ data: Array(25).fill(null), borderColor: '#72a9ff', fill: true, backgroundColor: 'rgba(114, 169, 255, 0.12)', tension: 0.25 }]
            },
            options: { ...opts, animation: false, scales: { y: { min: 0 } } }
        });
    }

    function updateCharts() {
        if (!charts.source) return;
        const vData = [];
        const fData = [];
        for (let v = -120; v <= 120; v += 20) {
            vData.push(v);
            const d = state.v - v;
            const val = state.f * ((state.v - state.vR) / (d === 0 ? 0.1 : d));
            fData.push(val > 0 ? val : 0);
        }
        charts.source.data.labels = vData;
        charts.source.data.datasets[0].data = fData;
        charts.source.update();

        charts.wavelength.data.datasets[0].data = [
            Math.max(0, (state.v - state.vS) / state.f),
            (state.v + state.vS) / state.f
        ];
        charts.wavelength.update();

        charts.compare.data.datasets[0].data = [state.f, state.fObs];
        charts.compare.update();

        const mach = Math.min(1, Math.abs(state.vS) / state.v);
        charts.speed.data.datasets[0].data = [mach, Math.max(0, 1 - mach)];
        charts.speed.update();

        if (!state.isPaused) {
            state.history.push(state.fObs);
            if (state.history.length > 25) state.history.shift();
            charts.time.data.datasets[0].data = state.history;
            charts.time.update();
        }
    }

    // 5. ANIMACIÓN CANVAS
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        state.srcX = canvas.width * 0.25;
        state.recX = canvas.width * 0.75;
    }

    function drawArrow(fx, fy, tx, ty, color) {
        const angle = Math.atan2(ty - fy, tx - fx);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.lineTo(tx - 7 * Math.cos(angle - Math.PI / 6), ty - 7 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - 7 * Math.cos(angle + Math.PI / 6), ty - 7 * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function draw() {
        if (!state.isPaused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cY = canvas.height / 2;

            state.srcX += (state.vS / 340) * 2.2 * state.waveScale;
            if (toggles.receiver.checked) {
                state.recX += (state.vR / 340) * 2.2 * state.waveScale;
            }

            if (state.srcX > canvas.width + 40) state.srcX = -40;
            if (state.srcX < -40) state.srcX = canvas.width + 40;
            if (state.recX > canvas.width + 40) state.recX = -40;
            if (state.recX < -40) state.recX = canvas.width + 40;

            state.time++;
            const emitInterval = Math.max(4, Math.floor((85 / (state.f / 440)) / state.waveSpacing));
            if (state.time % emitInterval === 0 && toggles.waves.checked) {
                state.waves.push({ x: state.srcX, y: cY, radius: 0, alpha: 1 });
            }

            if (toggles.path.checked) {
                ctx.beginPath();
                ctx.moveTo(0, cY);
                ctx.lineTo(canvas.width, cY);
                ctx.strokeStyle = 'rgba(145, 162, 189, 0.25)';
                ctx.setLineDash([6, 6]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            if (toggles.waves.checked) {
                for (let i = state.waves.length - 1; i >= 0; i--) {
                    const w = state.waves[i];
                    w.radius += (state.v / 110) * state.waveScale;
                    w.alpha -= 0.0032 * state.waveScale;
                    if (w.alpha <= 0) {
                        state.waves.splice(i, 1);
                        continue;
                    }
                    ctx.beginPath();
                    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(99, 215, 198, ${Math.max(0, w.alpha)})`;
                    ctx.lineWidth = 1.4 * state.amplitude;
                    ctx.stroke();
                }
            }

            if (toggles.receiver.checked) {
                ctx.beginPath();
                ctx.arc(state.recX, cY, 9, 0, Math.PI * 2);
                ctx.fillStyle = '#72a9ff';
                ctx.fill();

                if (toggles.arrows.checked && state.vR !== 0) {
                    const dir = state.vR > 0 ? 34 : -34;
                    drawArrow(state.recX, cY + 18, state.recX + dir, cY + 18, '#72a9ff');
                }
                if (toggles.labels.checked) {
                    ctx.fillStyle = '#72a9ff';
                    ctx.font = '600 11px "DM Sans", sans-serif';
                    ctx.fillText(`Receptor (${state.vR} m/s)`, state.recX - 42, cY - 16);
                }
            }

            ctx.beginPath();
            ctx.arc(state.srcX, cY, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#ffb66b';
            ctx.fill();

            if (toggles.arrows.checked && state.vS !== 0) {
                const dir = state.vS > 0 ? 34 : -34;
                drawArrow(state.srcX, cY + 18, state.srcX + dir, cY + 18, '#ffb66b');
            }
            if (toggles.labels.checked) {
                ctx.fillStyle = '#ffb66b';
                ctx.font = '600 11px "DM Sans", sans-serif';
                ctx.fillText(`Fuente (${state.vS} m/s)`, state.srcX - 38, cY - 16);
            }
        }
        requestAnimationFrame(draw);
    }

    // 6. EVENTOS DE SIMULADOR
    Object.values(inputs).forEach(input => {
        if (input && input.id !== 'themeSelect') {
            input.addEventListener('input', () => {
                if (input.id === 'sourceVelocity' || input.id === 'receiverVelocity') {
                    inputs.directionMode.value = 'custom';
                }
                calculatePhysics();
            });
        }
    });

    inputs.themeSelect.addEventListener('change', (e) => {
        document.body.setAttribute('data-theme', e.target.value);
        Chart.defaults.color = getComputedStyle(document.body).getPropertyValue('--muted');
        Object.values(charts).forEach(c => c.update());
    });

    document.getElementById('toggleAudioBtn').addEventListener('click', (e) => toggleAudio(e.target));
    document.getElementById('pauseBtn').addEventListener('click', (e) => {
        state.isPaused = !state.isPaused;
        e.target.textContent = state.isPaused ? 'Reanudar' : 'Pausar';
    });
    document.getElementById('restartAnimationBtn').addEventListener('click', () => {
        state.waves = [];
        resizeCanvas();
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        inputs.frequency.value = 440;
        inputs.sourceVelocity.value = 20;
        inputs.receiverVelocity.value = 0;
        inputs.temperature.value = 20;
        inputs.amplitude.value = 1;
        inputs.waveScale.value = 1;
        inputs.waveSpacing.value = 1;
        inputs.directionMode.value = 'custom';
        calculatePhysics();
        state.waves = [];
    });

    document.querySelectorAll('.mini-button[data-procedure]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const panel = document.getElementById('proc-' + e.target.getAttribute('data-procedure'));
            panel.classList.toggle('open');
            e.target.textContent = panel.classList.contains('open') ? 'Ocultar' : 'Ver procedimiento';
        });
    });

    document.querySelectorAll('.btn-load-ex').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.dataset.f) inputs.frequency.value = e.target.dataset.f;
            if (e.target.dataset.vs) inputs.sourceVelocity.value = e.target.dataset.vs;
            if (e.target.dataset.vr) inputs.receiverVelocity.value = e.target.dataset.vr;
            if (e.target.dataset.t) inputs.temperature.value = e.target.dataset.t;
            inputs.directionMode.value = 'custom';
            calculatePhysics();
            const original = e.target.textContent;
            e.target.textContent = '¡Variables cargadas!';
            setTimeout(() => { e.target.textContent = original; }, 1500);
        });
    });

    document.getElementById('exportExcelBtn').addEventListener('click', () => {
        let csv = "Variable;Simbolo;Valor;Unidad\n";
        const rows = [
            ["Temperatura", "T", state.T, "°C"],
            ["Velocidad del Sonido", "v", state.v.toFixed(2).replace('.', ','), "m/s"],
            ["Frecuencia Emitida", "f", state.f, "Hz"],
            ["Frecuencia Percibida", "f'", state.fObs.toFixed(2).replace('.', ','), "Hz"],
            ["Velocidad Fuente", "vs", state.vS, "m/s"],
            ["Velocidad Receptor", "vr", state.vR, "m/s"],
            ["Longitud de Onda", "lambda", state.lambda.toFixed(4).replace('.', ','), "m"]
        ];
        rows.forEach(r => { csv += r.join(";") + "\n"; });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }));
        link.download = `doppler_unemi_${Date.now()}.csv`;
        link.click();
    });

    window.addEventListener('resize', resizeCanvas);

    // ==========================================
    // 7. FIREBASE: ROLES, MATERIALES, TAREAS, CHAT, ELIMINACIÓN SINCRONIZADA Y NOTIFICACIONES
    // ==========================================
    const MAX_FIRESTORE_FILE_BYTES = 700 * 1024; // 700 KB para plan gratuito Spark

    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (file.size > MAX_FIRESTORE_FILE_BYTES) {
                reject(new Error(`El archivo "${file.name}" pesa ${(file.size / 1024).toFixed(0)} KB y supera el límite gratuito de 700 KB. Comprímelo o pega un enlace de Google Drive.`));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
            reader.readAsDataURL(file);
        });
    }

    function getSafeFileUrl(url) {
        if (!url || !url.startsWith('data:')) return url;
        try {
            const parts = url.split(',');
            const mime = parts[0].match(/:(.*?);/)[1];
            const binary = atob(parts[1]);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([array], { type: mime });
            return URL.createObjectURL(blob);
        } catch (e) {
            return url;
        }
    }

    function showToastNotification(title, message) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `<strong>🔔 ${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span>`;
        toast.onclick = () => {
            document.getElementById('chatPanel').scrollIntoView({ behavior: 'smooth' });
            toast.remove();
        };
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 6000);
    }

    function iniciarFirebaseCuandoEsteListo() {
        if (window.firebaseIniciado) return;
        if (!window.firebaseAuth || !window.firestoreAPI) return;
        window.firebaseIniciado = true;

        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        const userPhoto = document.getElementById('userPhoto');
        const userName = document.getElementById('userName');

        const { doc, getDoc, setDoc, updateDoc, collection, addDoc, onSnapshot, query, orderBy } = window.firestoreAPI;

        let unsubscribeChat = null;
        let unsubscribeFiles = null;
        let unsubscribeRubrica = null;
        let unsubscribeCuadernillo = null;
        let currentUserRole = 'estudiante';
        let unreadCount = 0;

        async function checkUserRole(user) {
            const userRef = doc(window.firebaseDb, "usuarios", user.email);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                return docSnap.data().rol || "estudiante";
            } else {
                await setDoc(userRef, {
                    nombre: user.displayName,
                    email: user.email,
                    rol: "estudiante",
                    fecha: new Date()
                });
                return "estudiante";
            }
        }

        function aplicarRolVisual(rol) {
            currentUserRole = rol;
            const eduPanel = document.getElementById('educationalPanel');
            eduPanel.querySelectorAll('.rol-badge').forEach(tag => tag.remove());

            const rolBadge = document.createElement('div');
            rolBadge.className = 'tag rol-badge';
            rolBadge.style.marginBottom = '12px';

            const taskInst = document.getElementById('taskInstructions');
            const teacherUploadBox = document.getElementById('teacherMaterialUpload');

            if (rol === 'docente') {
                rolBadge.textContent = '👨‍🏫 VISTA DE DOCENTE';
                rolBadge.style.backgroundColor = 'color-mix(in srgb, var(--warning) 18%, transparent)';
                rolBadge.style.color = 'var(--warning)';
                taskInst.textContent = "Sube deberes o guías (aparecerán en el chat) y califica las entregas.";
                teacherUploadBox.style.display = 'flex';
            } else {
                rolBadge.textContent = '🎓 VISTA DE ESTUDIANTE';
                taskInst.textContent = "Sube tu tarea resuelta; se enviará al chat y quedará lista para calificación.";
                teacherUploadBox.style.display = 'none';
            }

            eduPanel.insertBefore(rolBadge, eduPanel.children[1]);

            document.getElementById('materialPanel').style.display = 'block';
            document.getElementById('taskPanel').style.display = 'block';
            document.getElementById('chatPanel').style.display = 'block';
        }

        function iniciarSistemas(user) {
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }

            // A. SINCRONIZACIÓN DE RÚBRICA Y CUADERNILLO (DESCARGA PARA TODOS)
            const btnRubrica = document.getElementById('btnDownloadRubrica');
            const btnCuadernillo = document.getElementById('btnDownloadCuadernillo');

            unsubscribeRubrica = onSnapshot(doc(window.firebaseDb, "materiales", "rubrica"), (snap) => {
                if (snap.exists() && snap.data().url) {
                    const data = snap.data();
                    btnRubrica.href = getSafeFileUrl(data.url);
                    btnRubrica.target = "_blank";
                    btnRubrica.classList.remove('disabled-link');
                    btnRubrica.innerHTML = `📄 Rúbrica de Laboratorio <small>Descargar</small>`;
                } else {
                    btnRubrica.href = "#";
                    btnRubrica.classList.add('disabled-link');
                    btnRubrica.innerHTML = `📄 Rúbrica de Laboratorio <small>(Pendiente)</small>`;
                }
            });

            unsubscribeCuadernillo = onSnapshot(doc(window.firebaseDb, "materiales", "cuadernillo"), (snap) => {
                if (snap.exists() && snap.data().url) {
                    const data = snap.data();
                    btnCuadernillo.href = getSafeFileUrl(data.url);
                    btnCuadernillo.target = "_blank";
                    btnCuadernillo.classList.remove('disabled-link');
                    btnCuadernillo.innerHTML = `📓 Cuadernillo de Actividades <small>Descargar</small>`;
                } else {
                    btnCuadernillo.href = "#";
                    btnCuadernillo.classList.add('disabled-link');
                    btnCuadernillo.innerHTML = `📓 Cuadernillo de Actividades <small>(Pendiente)</small>`;
                }
            });

            // SUBIDA DE RÚBRICA / CUADERNILLO (EXCLUSIVO DOCENTE)
            const uploadMaterialBtn = document.getElementById('uploadMaterialBtn');
            uploadMaterialBtn.onclick = async () => {
                if (currentUserRole !== 'docente') return;

                const rubricaFile = document.getElementById('rubricaInput').files[0];
                const rubricaLink = document.getElementById('rubricaUrlInput').value.trim();
                const cuadernilloFile = document.getElementById('cuadernilloInput').files[0];
                const cuadernilloLink = document.getElementById('cuadernilloUrlInput').value.trim();

                const hasRubrica = Boolean(rubricaFile || rubricaLink);
                const hasCuadernillo = Boolean(cuadernilloFile || cuadernilloLink);

                if (!hasRubrica && !hasCuadernillo) {
                    alert("Selecciona el archivo o pega el enlace de la rúbrica, del cuadernillo o de ambos.");
                    return;
                }

                uploadMaterialBtn.disabled = true;
                uploadMaterialBtn.textContent = "Publicando...";

                try {
                    let rubricaFinalUrl = null;
                    let rubricaName = "Rúbrica de Laboratorio";
                    let cuadernilloFinalUrl = null;
                    let cuadernilloName = "Cuadernillo de Actividades";

                    if (hasRubrica) {
                        if (rubricaFile) {
                            rubricaFinalUrl = await fileToBase64(rubricaFile);
                            rubricaName = rubricaFile.name;
                        } else {
                            rubricaFinalUrl = rubricaLink;
                        }
                        await setDoc(doc(window.firebaseDb, "materiales", "rubrica"), {
                            nombre: rubricaName,
                            url: rubricaFinalUrl,
                            subidoPor: user.displayName,
                            fecha: new Date()
                        });
                    }

                    if (hasCuadernillo) {
                        if (cuadernilloFile) {
                            cuadernilloFinalUrl = await fileToBase64(cuadernilloFile);
                            cuadernilloName = cuadernilloFile.name;
                        } else {
                            cuadernilloFinalUrl = cuadernilloLink;
                        }
                        await setDoc(doc(window.firebaseDb, "materiales", "cuadernillo"), {
                            nombre: cuadernilloName,
                            url: cuadernilloFinalUrl,
                            subidoPor: user.displayName,
                            fecha: new Date()
                        });
                    }

                    let textoAnuncio = "";
                    const adjuntos = [];

                    if (hasRubrica && hasCuadernillo) {
                        textoAnuncio = `📢 El docente ${user.displayName} subió la rúbrica y el cuadernillo.`;
                        adjuntos.push({ nombre: `Rúbrica: ${rubricaName}`, url: rubricaFinalUrl });
                        adjuntos.push({ nombre: `Cuadernillo: ${cuadernilloName}`, url: cuadernilloFinalUrl });
                    } else if (hasRubrica) {
                        textoAnuncio = `📢 El docente ${user.displayName} subió la rúbrica.`;
                        adjuntos.push({ nombre: `Rúbrica: ${rubricaName}`, url: rubricaFinalUrl });
                    } else {
                        textoAnuncio = `📢 El docente ${user.displayName} subió el cuadernillo.`;
                        adjuntos.push({ nombre: `Cuadernillo: ${cuadernilloName}`, url: cuadernilloFinalUrl });
                    }

                    await addDoc(collection(window.firebaseDb, "chat"), {
                        usuario: user.displayName,
                        email: user.email,
                        mensaje: textoAnuncio,
                        adjuntos: adjuntos,
                        esSistema: true,
                        fecha: new Date()
                    });

                    document.getElementById('rubricaInput').value = '';
                    document.getElementById('rubricaUrlInput').value = '';
                    document.getElementById('cuadernilloInput').value = '';
                    document.getElementById('cuadernilloUrlInput').value = '';
                } catch (err) {
                    console.error("Error publicando material:", err);
                    alert(err.message);
                } finally {
                    uploadMaterialBtn.disabled = false;
                    uploadMaterialBtn.textContent = "Publicar Material Seleccionado";
                }
            };

            // B. CHAT EN TIEMPO REAL + NOTIFICACIONES
            const chatBox = document.getElementById('chatBox');
            const chatInput = document.getElementById('chatInput');
            const sendMsgBtn = document.getElementById('sendMsgBtn');
            const unreadBadge = document.getElementById('chatUnreadBadge');

            function resetUnreadBadge() {
                unreadCount = 0;
                unreadBadge.style.display = 'none';
            }

            chatBox.addEventListener('click', resetUnreadBadge);
            chatInput.addEventListener('focus', resetUnreadBadge);

            let isInitialChatLoad = true;
            const qChat = query(collection(window.firebaseDb, "chat"), orderBy("fecha", "asc"));

            unsubscribeChat = onSnapshot(qChat, (snapshot) => {
                if (!isInitialChatLoad) {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const newMsg = change.doc.data();
                            if (newMsg.email !== user.email) {
                                unreadCount++;
                                unreadBadge.textContent = `${unreadCount} nuevo${unreadCount > 1 ? 's' : ''}`;
                                unreadBadge.style.display = 'inline-block';

                                playNotificationSound();
                                showToastNotification(newMsg.usuario, newMsg.mensaje);

                                if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
                                    new Notification(`Mensaje de ${newMsg.usuario}`, { body: newMsg.mensaje });
                                }
                            }
                        }
                    });
                }
                isInitialChatLoad = false;

                chatBox.innerHTML = '';
                if (snapshot.empty) {
                    chatBox.innerHTML = '<div class="empty-msg">No hay mensajes aún. Inicia la conversación.</div>';
                    return;
                }

                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const isMine = data.email === user.email;
                    const div = document.createElement('div');
                    div.style.fontSize = '11px';
                    div.style.padding = '8px 10px';
                    div.style.borderRadius = '8px';

                    if (data.esSistema) {
                        div.style.background = 'color-mix(in srgb, var(--warning) 16%, var(--surface-2))';
                        div.style.borderLeft = '3px solid var(--warning)';
                    } else if (isMine) {
                        div.style.background = 'color-mix(in srgb, var(--primary) 16%, transparent)';
                        div.style.borderLeft = '3px solid var(--primary)';
                    } else {
                        div.style.background = 'var(--surface-2)';
                        div.style.borderLeft = '3px solid var(--accent-2)';
                    }

                    let adjuntosHTML = '';
                    if (Array.isArray(data.adjuntos)) {
                        data.adjuntos.forEach(adj => {
                            const safeHref = getSafeFileUrl(adj.url);
                            adjuntosHTML += `<div><a href="${escapeHTML(safeHref)}" target="_blank" class="chat-attachment">📎 ${escapeHTML(adj.nombre)}</a></div>`;
                        });
                    } else if (data.archivoUrl) {
                        const safeHref = getSafeFileUrl(data.archivoUrl);
                        adjuntosHTML = `<div><a href="${escapeHTML(safeHref)}" target="_blank" class="chat-attachment">📎 ${escapeHTML(data.archivoNombre || 'Descargar archivo')}</a></div>`;
                    }

                    div.innerHTML = `
                        <strong>${escapeHTML(data.usuario)}</strong><br>
                        <span style="color:var(--text);">${escapeHTML(data.mensaje)}</span>
                        ${adjuntosHTML}
                    `;
                    chatBox.appendChild(div);
                });
                chatBox.scrollTop = chatBox.scrollHeight;
            }, (err) => {
                console.error("Error leyendo chat:", err);
                chatBox.innerHTML = `<div class="empty-msg" style="color:var(--warning);">Verifica los permisos de Firestore en Firebase.</div>`;
            });

            async function enviarMensaje() {
                const msg = chatInput.value.trim();
                if (!msg) return;
                chatInput.value = '';
                resetUnreadBadge();
                try {
                    await addDoc(collection(window.firebaseDb, "chat"), {
                        usuario: user.displayName,
                        email: user.email,
                        mensaje: msg,
                        fecha: new Date()
                    });
                } catch (err) {
                    console.error("Error enviando mensaje:", err);
                    alert("No se pudo enviar el mensaje.");
                }
            }

            sendMsgBtn.onclick = enviarMensaje;
            chatInput.onkeydown = (e) => {
                if (e.key === 'Enter') enviarMensaje();
            };

            // C. GESTIÓN DE TAREAS, CALIFICACIONES, ELIMINACIÓN SINCRONIZADA Y ENVÍO AL CHAT
            const fileInput = document.getElementById('fileInput');
            const fileUrlInput = document.getElementById('fileUrlInput');
            const uploadFileBtn = document.getElementById('uploadFileBtn');
            const fileList = document.getElementById('fileList');

            async function eliminarArchivo(fileId, fileData, btnEl) {
                if (!confirm(`¿Eliminar "${fileData.nombre}" de la lista de tareas y del chat?`)) return;
                btnEl.disabled = true;
                btnEl.textContent = 'Borrando...';
                try {
                    const fsMod = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
                    const { deleteDoc: delDoc, getDocs, where } = fsMod;

                    // 1. Eliminar el archivo de la colección "archivos"
                    await delDoc(doc(window.firebaseDb, "archivos", fileId));

                    // 2. Buscar y eliminar el mensaje adjunto en la colección "chat"
                    const chatRef = collection(window.firebaseDb, "chat");
                    const qPorId = query(chatRef, where("archivoId", "==", fileId));
                    const snapPorId = await getDocs(qPorId);

                    if (!snapPorId.empty) {
                        for (const msgDoc of snapPorId.docs) {
                            await delDoc(doc(window.firebaseDb, "chat", msgDoc.id));
                        }
                    } else {
                        // Respaldo para archivos subidos antes de vincular archivoId
                        const qPorNombre = query(chatRef, where("archivoNombre", "==", fileData.nombre));
                        const snapPorNombre = await getDocs(qPorNombre);
                        for (const msgDoc of snapPorNombre.docs) {
                            const msgData = msgDoc.data();
                            if (msgData.email === fileData.email) {
                                await delDoc(doc(window.firebaseDb, "chat", msgDoc.id));
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error al eliminar archivo y mensaje:", err);
                    alert("No se pudo eliminar por completo: " + err.message);
                    btnEl.disabled = false;
                    btnEl.textContent = '🗑️ Eliminar';
                }
            }

            const qFiles = query(collection(window.firebaseDb, "archivos"), orderBy("fecha", "desc"));
            unsubscribeFiles = onSnapshot(qFiles, (snapshot) => {
                fileList.innerHTML = '';
                if (snapshot.empty) {
                    fileList.innerHTML = '<li class="empty-msg">No hay archivos subidos aún.</li>';
                    return;
                }
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const fileId = docSnap.id;
                    const safeHref = getSafeFileUrl(data.url);
                    const li = document.createElement('li');
                    li.className = 'file-item';

                    const notaHTML = data.calificacion !== undefined && data.calificacion !== null
                        ? `<div class="grade-badge">Calificación: ${data.calificacion} / 10</div>`
                        : `<div class="grade-badge" style="opacity:0.65;">Pendiente de revisión</div>`;

                    li.innerHTML = `
                        <a href="${escapeHTML(safeHref)}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 600;">
                            📄 ${escapeHTML(data.nombre)}
                        </a>
                        <div style="color: var(--muted); font-size: 10px;">
                            Subido por: ${escapeHTML(data.subidoPor)} (${escapeHTML(data.rolAutor || 'usuario')})
                        </div>
                        ${notaHTML}
                    `;

                    const esArchivoPropio = Boolean(
                        data.email &&
                        user.email &&
                        data.email.trim().toLowerCase() === user.email.trim().toLowerCase()
                    );

                    if (currentUserRole === 'docente') {
                        const gradeRow = document.createElement('div');
                        gradeRow.className = 'grade-row';
                        gradeRow.innerHTML = `
                            <input type="number" min="0" max="10" step="0.5" placeholder="Nota (0-10)" value="${data.calificacion ?? ''}" style="width: 82px; padding: 4px 6px; font-size: 11px;">
                            <button class="mini-button btn-grade">Calificar</button>
                            <button class="mini-button btn-delete" style="color: var(--warning);">🗑️ Eliminar</button>
                        `;
                        const gradeInput = gradeRow.querySelector('input');
                        const gradeBtn = gradeRow.querySelector('.btn-grade');
                        const deleteBtn = gradeRow.querySelector('.btn-delete');

                        gradeBtn.onclick = async () => {
                            const val = parseFloat(gradeInput.value);
                            if (isNaN(val) || val < 0 || val > 10) {
                                alert("Ingresa una calificación válida entre 0 y 10.");
                                return;
                            }
                            gradeBtn.textContent = "Guardando...";
                            try {
                                await updateDoc(doc(window.firebaseDb, "archivos", fileId), {
                                    calificacion: val,
                                    calificadoPor: user.displayName
                                });
                                gradeBtn.textContent = "¡Guardado!";
                                setTimeout(() => { gradeBtn.textContent = "Calificar"; }, 1200);
                            } catch (err) {
                                console.error("Error calificando:", err);
                                alert("No se pudo guardar la calificación.");
                                gradeBtn.textContent = "Calificar";
                            }
                        };

                        deleteBtn.onclick = () => eliminarArchivo(fileId, data, deleteBtn);
                        li.appendChild(gradeRow);
                    } else if (esArchivoPropio) {
                        const actionRow = document.createElement('div');
                        actionRow.className = 'grade-row';
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'mini-button';
                        deleteBtn.style.color = 'var(--warning)';
                        deleteBtn.textContent = '🗑️ Eliminar';
                        deleteBtn.onclick = () => eliminarArchivo(fileId, data, deleteBtn);
                        actionRow.appendChild(deleteBtn);
                        li.appendChild(actionRow);
                    }

                    fileList.appendChild(li);
                });
            });

            uploadFileBtn.onclick = async () => {
                const file = fileInput.files[0];
                const externalLink = fileUrlInput.value.trim();

                if (!file && !externalLink) {
                    alert("Selecciona un archivo de tu equipo o pega un enlace de Google Drive.");
                    return;
                }

                uploadFileBtn.textContent = "Guardando...";
                uploadFileBtn.disabled = true;

                try {
                    let finalUrl = "";
                    let finalName = "";

                    if (file) {
                        finalUrl = await fileToBase64(file);
                        finalName = file.name;
                    } else {
                        finalUrl = externalLink;
                        finalName = `Entrega de ${user.displayName} (Enlace externo)`;
                    }

                    const archivoDocRef = await addDoc(collection(window.firebaseDb, "archivos"), {
                        nombre: finalName,
                        url: finalUrl,
                        subidoPor: user.displayName,
                        email: user.email,
                        rolAutor: currentUserRole,
                        calificacion: null,
                        fecha: new Date()
                    });

                    const textoChat = currentUserRole === 'docente'
                        ? `📌 El docente ${user.displayName} subió una nueva tarea:`
                        : `📎 ${user.displayName} subió un archivo de tarea:`;

                    await addDoc(collection(window.firebaseDb, "chat"), {
                        usuario: user.displayName,
                        email: user.email,
                        mensaje: textoChat,
                        archivoId: archivoDocRef.id,
                        archivoNombre: finalName,
                        archivoUrl: finalUrl,
                        esSistema: currentUserRole === 'docente',
                        fecha: new Date()
                    });

                    fileInput.value = '';
                    fileUrlInput.value = '';
                } catch (err) {
                    console.error("Error subiendo tarea:", err);
                    alert(err.message);
                } finally {
                    uploadFileBtn.textContent = "Subir Tarea / Archivo";
                    uploadFileBtn.disabled = false;
                }
            };
        }

        window.onAuthStateChanged(window.firebaseAuth, async (user) => {
            if (user) {
                loginBtn.style.display = 'none';
                userInfo.style.display = 'flex';
                userName.textContent = user.displayName;
                userPhoto.src = user.photoURL;

                const rol = await checkUserRole(user);
                aplicarRolVisual(rol);
                iniciarSistemas(user);
            } else {
                loginBtn.style.display = 'inline-flex';
                userInfo.style.display = 'none';
                document.getElementById('materialPanel').style.display = 'none';
                document.getElementById('taskPanel').style.display = 'none';
                document.getElementById('chatPanel').style.display = 'none';
                document.querySelectorAll('.rol-badge').forEach(tag => tag.remove());

                if (unsubscribeChat) unsubscribeChat();
                if (unsubscribeFiles) unsubscribeFiles();
                if (unsubscribeRubrica) unsubscribeRubrica();
                if (unsubscribeCuadernillo) unsubscribeCuadernillo();
            }
        });

        loginBtn.addEventListener('click', () => {
            window.signInWithPopup(window.firebaseAuth, window.googleProvider).catch((err) => {
                console.error("Error de login:", err);
                alert("No se pudo iniciar sesión: " + err.message);
            });
        });

        logoutBtn.addEventListener('click', () => {
            window.signOut(window.firebaseAuth);
        });
    }

    if (window.firebaseAuth && window.firestoreAPI) {
        iniciarFirebaseCuandoEsteListo();
    } else {
        window.addEventListener('firebase-ready', iniciarFirebaseCuandoEsteListo);
        const pollFirebase = setInterval(() => {
            if (window.firebaseAuth && window.firestoreAPI) {
                iniciarFirebaseCuandoEsteListo();
                clearInterval(pollFirebase);
            }
        }, 300);
    }

    // INICIALIZACIÓN
    resizeCanvas();
    initCharts();
    calculatePhysics();
    requestAnimationFrame(draw);
    setInterval(() => {
        if (!state.isPaused) updateCharts();
    }, 1000);
});
