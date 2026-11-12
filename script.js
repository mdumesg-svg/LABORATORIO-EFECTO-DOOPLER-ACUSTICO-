/**
 * SIMULADOR DE EFECTO DOPPLER ACÚSTICO COMPLETO
 * Incluye Web Audio API, Roles Firestore, Gráficas, Fórmulas, Material de Clase, Chat y Subida de Archivos
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. ESTADO GLOBAL
    const state = {
        f: 440, vS: 20, vR: 0, T: 20, v: 343.4, fObs: 440, lambda: 0.78,
        isPaused: false, time: 0, waves: [], srcX: 0, recX: 0, history: []
    };

    let audioCtx = null, oscillator = null, gainNode = null, isAudioPlaying = false;
    let charts = {};

    const inputs = {
        frequency: document.getElementById('frequency'),
        sourceVelocity: document.getElementById('sourceVelocity'),
        receiverVelocity: document.getElementById('receiverVelocity'),
        temperature: document.getElementById('temperature'),
        directionMode: document.getElementById('directionMode'),
        themeSelect: document.getElementById('themeSelect'),
        waveScale: document.getElementById('waveScale'),
        waveSpacing: document.getElementById('waveSpacing')
    };

    const outputs = {
        f: document.getElementById('frequencyOut'),
        vS: document.getElementById('sourceVelocityOut'),
        vR: document.getElementById('receiverVelocityOut'),
        T: document.getElementById('temperatureOut'),
        soundSpeed: document.getElementById('soundSpeedValue'),
        observedFreq: document.getElementById('observedFrequencyValue'),
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

    // 2. AUDIO WEB API
    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
            oscillator = audioCtx.createOscillator();
            gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = state.fObs;
            gainNode.gain.value = 0;
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
        }
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

    // 3. FÍSICA Y FÓRMULAS
    function calculatePhysics() {
        state.f = parseFloat(inputs.frequency.value);
        state.vS = parseFloat(inputs.sourceVelocity.value);
        state.vR = parseFloat(inputs.receiverVelocity.value);
        state.T = parseFloat(inputs.temperature.value);

        const mode = inputs.directionMode.value;
        if (mode === 'approach') { state.vS = Math.abs(state.vS); state.vR = -Math.abs(state.vR); } 
        else if (mode === 'recede') { state.vS = -Math.abs(state.vS); state.vR = Math.abs(state.vR); } 
        else if (mode === 'stationary') { state.vS = 0; state.vR = 0; inputs.sourceVelocity.value = 0; inputs.receiverVelocity.value = 0; }

        state.v = 331.3 + (0.606 * state.T);
        let denom = state.v - state.vS;
        let num = state.v - state.vR;
        if (Math.abs(denom) < 0.1) denom = 0.1;

        state.fObs = state.f * (num / denom);
        if (state.fObs < 0 || state.vS >= state.v) state.fObs = 0; 
        state.lambda = state.v / state.f;
        const delta = ((state.fObs - state.f) / state.f) * 100;

        if (oscillator && isAudioPlaying) oscillator.frequency.setTargetAtTime(state.fObs, audioCtx.currentTime, 0.1);

        outputs.f.textContent = `${state.f} Hz`;
        outputs.vS.textContent = `${state.vS} m/s`;
        outputs.vR.textContent = `${state.vR} m/s`;
        outputs.T.textContent = `${state.T} °C`;
        outputs.soundSpeed.innerHTML = `${state.v.toFixed(1)} <small>m/s</small>`;
        
        if (state.vS >= state.v) {
            outputs.observedFreq.innerHTML = `Supersónico`;
            document.getElementById('physicsWarning').style.display = 'block';
        } else {
            outputs.observedFreq.innerHTML = `${state.fObs.toFixed(1)} <small>Hz</small>`;
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
        document.getElementById('dataTable').innerHTML = `
            <tr><td>Velocidad Sonido</td><td>v</td><td>${state.v.toFixed(1)}</td><td>m/s</td></tr>
            <tr><td>Frec. Emitida</td><td>f</td><td>${state.f}</td><td>Hz</td></tr>
            <tr><td>Frec. Percibida</td><td>f'</td><td>${state.fObs.toFixed(1)}</td><td>Hz</td></tr>
            <tr><td>Vel. Fuente</td><td>v<sub>s</sub></td><td>${state.vS}</td><td>m/s</td></tr>
            <tr><td>Vel. Receptor</td><td>v<sub>r</sub></td><td>${state.vR}</td><td>m/s</td></tr>
            <tr><td>Long. de Onda</td><td>λ</td><td>${state.lambda.toFixed(3)}</td><td>m</td></tr>
        `;
    }

    // 4. GRÁFICOS
    function initCharts() {
        Chart.defaults.color = '#91a2bd';
        Chart.defaults.font.family = "'DM Sans', sans-serif";
        const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(145,162,189,0.1)' } }, y: { grid: { color: 'rgba(145,162,189,0.1)' } } } };
        
        charts.source = new Chart(document.getElementById('chartSource'), { type: 'line', data: { labels: [], datasets: [{ data: [], borderColor: '#63d7c6', tension: 0.4 }] }, options: opts });
        charts.wavelength = new Chart(document.getElementById('chartWavelength'), { type: 'bar', data: { labels: ['Frente', 'Detrás'], datasets: [{ data: [0, 0], backgroundColor: ['#ffb66b', '#7aa7ff'] }] }, options: opts });
        charts.compare = new Chart(document.getElementById('chartCompare'), { type: 'bar', data: { labels: ['Emitida (f)', 'Percibida (f\')'], datasets: [{ data: [0, 0], backgroundColor: ['#91a2bd', '#63d7c6'] }] }, options: opts });
        charts.speed = new Chart(document.getElementById('chartSpeed'), { type: 'doughnut', data: { labels: ['Velocidad Fuente', 'Margen hasta Mach 1'], datasets: [{ data: [0, 100], backgroundColor: ['#f5bd62', '#263651'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } } });
        charts.time = new Chart(document.getElementById('chartTime'), { type: 'line', data: { labels: Array(20).fill(''), datasets: [{ data: Array(20).fill(null), borderColor: '#7aa7ff', fill: true, backgroundColor: 'rgba(122, 167, 255, 0.1)' }] }, options: { ...opts, animation: false, scales: { y: { min: 0 } } } });
    }

    function updateCharts() {
        if (!charts.source) return;
        let vData = [], fData = [];
        for (let v = -100; v <= 100; v += 20) {
            vData.push(v);
            let d = state.v - v;
            let val = state.f * ((state.v - state.vR) / (d === 0 ? 0.1 : d));
            fData.push(val > 0 ? val : 0);
        }
        charts.source.data.labels = vData; charts.source.data.datasets[0].data = fData; charts.source.update();
        charts.wavelength.data.datasets[0].data = [(state.v - state.vS) / state.f, (state.v + state.vS) / state.f]; charts.wavelength.update();
        charts.compare.data.datasets[0].data = [state.f, state.fObs]; charts.compare.update();
        let mach = Math.abs(state.vS) / state.v; charts.speed.data.datasets[0].data = [mach, Math.max(0, 1 - mach)]; charts.speed.update();
        
        if (!state.isPaused) {
            state.history.push(state.fObs);
            if (state.history.length > 20) state.history.shift();
            charts.time.data.datasets[0].data = state.history;
            charts.time.update();
        }
    }

    // 5. CANVAS RENDER
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight;
        state.srcX = canvas.width / 4; state.recX = (canvas.width / 4) * 3;
    }

    function draw() {
        if (!state.isPaused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let vSRatio = state.vS / 340; let vRRatio = state.vR / 340;
            state.srcX += vSRatio * 2;
            if (toggles.receiver.checked) state.recX += vRRatio * 2;
            if (state.srcX > canvas.width + 50) state.srcX = -50; if (state.srcX < -50) state.srcX = canvas.width + 50;
            if (state.recX > canvas.width + 50) state.recX = -50; if (state.recX < -50) state.recX = canvas.width + 50;

            state.time++;
            if (state.time % Math.max(5, Math.floor(100 / (state.f/440))) === 0 && toggles.waves.checked) {
                state.waves.push({ x: state.srcX, y: canvas.height / 2, radius: 0, alpha: 1 });
            }

            if (toggles.path.checked) {
                ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.strokeStyle = '#263651'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
            }

            if (toggles.waves.checked) {
                for (let i = state.waves.length - 1; i >= 0; i--) {
                    let w = state.waves[i];
                    w.radius += (state.v / 100);
                    w.alpha -= 0.003;
                    if (w.alpha <= 0) { state.waves.splice(i, 1); continue; }
                    ctx.beginPath(); ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(99, 215, 198, ${Math.max(0, w.alpha)})`; ctx.lineWidth = 1.5; ctx.stroke();
                }
            }

            const cY = canvas.height / 2;
            if (toggles.receiver.checked) {
                ctx.beginPath(); ctx.arc(state.recX, cY, 8, 0, Math.PI * 2); ctx.fillStyle = '#72a9ff'; ctx.fill();
            }
            ctx.beginPath(); ctx.arc(state.srcX, cY, 8, 0, Math.PI * 2); ctx.fillStyle = '#ffb66b'; ctx.fill();
        }
        requestAnimationFrame(draw);
    }

    // 6. EVENTOS BÁSICOS
    Object.values(inputs).forEach(input => { if (input) input.addEventListener('input', calculatePhysics); });
    inputs.themeSelect.addEventListener('change', (e) => {
        document.body.setAttribute('data-theme', e.target.value);
        Chart.defaults.color = getComputedStyle(document.body).getPropertyValue('--muted');
        Object.values(charts).forEach(c => c.update());
    });
    document.getElementById('toggleAudioBtn').addEventListener('click', (e) => toggleAudio(e.target));
    document.getElementById('pauseBtn').addEventListener('click', (e) => {
        state.isPaused = !state.isPaused; e.target.textContent = state.isPaused ? 'Reanudar' : 'Pausar';
    });
    document.getElementById('restartAnimationBtn').addEventListener('click', () => { state.waves = []; resizeCanvas(); });
    document.getElementById('resetBtn').addEventListener('click', () => {
        inputs.frequency.value = 440; inputs.sourceVelocity.value = 20; inputs.receiverVelocity.value = 0; inputs.temperature.value = 20;
        calculatePhysics(); state.waves = [];
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

    document.querySelectorAll('.btn-load-ex').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.dataset.f) inputs.frequency.value = e.target.dataset.f;
            if (e.target.dataset.vs) inputs.sourceVelocity.value = e.target.dataset.vs;
            if (e.target.dataset.vr) inputs.receiverVelocity.value = e.target.dataset.vr;
            inputs.directionMode.value = 'custom'; 
            calculatePhysics();
            const ogText = e.target.textContent; e.target.textContent = '¡Cargado!';
            setTimeout(() => e.target.textContent = ogText, 1500);
        });
    });

    document.getElementById('exportExcelBtn').addEventListener('click', () => {
        let csv = "Variable;Simbolo;Valor;Unidad\n";
        const rows = [
            ["Temperatura", "T", state.T, "°C"], ["Velocidad del Sonido", "v", state.v.toFixed(2).replace('.', ','), "m/s"],
            ["Frecuencia Emitida", "f", state.f, "Hz"], ["Frecuencia Percibida", "f'", state.fObs.toFixed(2).replace('.', ','), "Hz"]
        ];
        rows.forEach(r => csv += r.join(";") + "\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }));
        link.download = `doppler_${new Date().getTime()}.csv`;
        link.click();
    });

    window.addEventListener('resize', resizeCanvas);

    // ==========================================
    // 7. FIREBASE: PLATAFORMA LMS (CHAT Y ARCHIVOS)
    // ==========================================
    setTimeout(() => {
        if(window.firebaseAuth && window.firestoreAPI && window.storageAPI) {
            const loginBtn = document.getElementById('loginBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            const userInfo = document.getElementById('userInfo');
            const userPhoto = document.getElementById('userPhoto');
            const userName = document.getElementById('userName');

            const { doc, getDoc, setDoc, collection, addDoc, onSnapshot, query, orderBy } = window.firestoreAPI;
            const { ref, uploadBytesResumable, getDownloadURL } = window.storageAPI;

            let unsubscribeChat = null;
            let unsubscribeFiles = null;

            async function checkUserRole(user) {
                const userRef = doc(window.firebaseDb, "usuarios", user.email);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    return docSnap.data().rol;
                } else {
                    await setDoc(userRef, { nombre: user.displayName, email: user.email, rol: "estudiante", fecha: new Date() });
                    return "estudiante";
                }
            }

            function aplicarRolVisual(rol) {
                const eduPanel = document.getElementById('educationalPanel');
                const viejas = eduPanel.querySelectorAll('.rol-badge');
                viejas.forEach(tag => tag.remove());

                const rolBadge = document.createElement('div');
                rolBadge.className = 'tag rol-badge';
                rolBadge.style.marginBottom = '15px';
                rolBadge.style.display = 'inline-block';

                const taskPanel = document.getElementById('taskPanel');
                const chatPanel = document.getElementById('chatPanel');
                const materialPanel = document.getElementById('materialPanel');
                const taskInst = document.getElementById('taskInstructions');

                if (rol === 'docente') {
                    rolBadge.textContent = '👨‍🏫 VISTA DE DOCENTE';
                    rolBadge.style.backgroundColor = 'color-mix(in srgb, var(--warning) 15%, transparent)';
                    rolBadge.style.color = 'var(--warning)';
                    taskInst.textContent = "Sube las tareas y guías para los alumnos (PDF/Word).";
                } else {
                    rolBadge.textContent = '🎓 VISTA DE ESTUDIANTE';
                    taskInst.textContent = "Descarga la tarea del profesor y sube tu resolución.";
                }

                eduPanel.insertBefore(rolBadge, eduPanel.children[1]);
                
                taskPanel.style.display = 'block';
                chatPanel.style.display = 'block';
                materialPanel.style.display = 'block';
            }

            function iniciarSistemas(user) {
                // 1. CHAT EN TIEMPO REAL
                const chatBox = document.getElementById('chatBox');
                const chatInput = document.getElementById('chatInput');
                const sendMsgBtn = document.getElementById('sendMsgBtn');

                const qChat = query(collection(window.firebaseDb, "chat"), orderBy("fecha", "asc"));
                unsubscribeChat = onSnapshot(qChat, (snapshot) => {
                    chatBox.innerHTML = '';
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        const div = document.createElement('div');
                        div.style.fontSize = '11px';
                        div.style.background = data.email === user.email ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'var(--surface-1)';
                        div.style.padding = '8px';
                        div.style.borderRadius = '5px';
                        div.style.borderLeft = data.email === user.email ? '3px solid var(--primary)' : '3px solid var(--muted)';
                        div.innerHTML = `<strong style="color:var(--text);">${data.usuario}</strong><br><span style="color:var(--muted);">${data.mensaje}</span>`;
                        chatBox.appendChild(div);
                    });
                    chatBox.scrollTop = chatBox.scrollHeight;
                });

                sendMsgBtn.onclick = async () => {
                    const msg = chatInput.value.trim();
                    if(msg === '') return;
                    await addDoc(collection(window.firebaseDb, "chat"), {
                        usuario: user.displayName,
                        email: user.email,
                        mensaje: msg,
                        fecha: new Date()
                    });
                    chatInput.value = '';
                };

                // 2. GESTIÓN DE ARCHIVOS
                const fileInput = document.getElementById('fileInput');
                const uploadFileBtn = document.getElementById('uploadFileBtn');
                const fileList = document.getElementById('fileList');

                const qFiles = query(collection(window.firebaseDb, "archivos"), orderBy("fecha", "desc"));
                unsubscribeFiles = onSnapshot(qFiles, (snapshot) => {
                    fileList.innerHTML = '';
                    if(snapshot.empty) {
                        fileList.innerHTML = '<li style="color: var(--muted); font-style: italic;">No hay archivos aún.</li>';
                        return;
                    }
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        const li = document.createElement('li');
                        li.style.marginBottom = '8px';
                        li.style.paddingBottom = '8px';
                        li.style.borderBottom = '1px solid var(--line)';
                        li.innerHTML = `<a href="${data.url}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 600;">📄 ${data.nombre}</a><br><span style="color: var(--muted); font-size: 9px;">Subido por ${data.subidoPor}</span>`;
                        fileList.appendChild(li);
                    });
                });

                uploadFileBtn.onclick = () => {
                    const file = fileInput.files[0];
                    if(!file) return alert("Por favor, selecciona un archivo primero.");
                    
                    uploadFileBtn.textContent = "Subiendo...";
                    uploadFileBtn.disabled = true;

                    const storageRef = ref(window.firebaseStorage, 'archivos/' + file.name);
                    const uploadTask = uploadBytesResumable(storageRef, file);

                    uploadTask.on('state_changed', 
                        null, 
                        (error) => {
                            console.error(error);
                            alert("Error al subir el archivo.");
                            uploadFileBtn.textContent = "Subir Archivo";
                            uploadFileBtn.disabled = false;
                        }, 
                        async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            await addDoc(collection(window.firebaseDb, "archivos"), {
                                nombre: file.name,
                                url: url,
                                subidoPor: user.displayName,
                                email: user.email,
                                fecha: new Date()
                            });
                            fileInput.value = '';
                            uploadFileBtn.textContent = "Subir Archivo";
                            uploadFileBtn.disabled = false;
                        }
                    );
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
                    loginBtn.style.display = 'block';
                    userInfo.style.display = 'none';
                    document.getElementById('taskPanel').style.display = 'none';
                    document.getElementById('chatPanel').style.display = 'none';
                    document.getElementById('materialPanel').style.display = 'none';
                    
                    const rolBadge = document.querySelector('.rol-badge');
                    if (rolBadge) rolBadge.remove();

                    if(unsubscribeChat) unsubscribeChat();
                    if(unsubscribeFiles) unsubscribeFiles();
                }
            });

            loginBtn.addEventListener('click', () => { window.signInWithPopup(window.firebaseAuth, window.googleProvider).catch(console.error); });
            logoutBtn.addEventListener('click', () => { window.signOut(window.firebaseAuth); });
        }
    }, 1000);

    // INICIO
    resizeCanvas();
    initCharts();
    calculatePhysics();
    requestAnimationFrame(draw);
    setInterval(() => { if(!state.isPaused) updateCharts() }, 1000);
});
