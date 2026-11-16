/**
 * SIMULADOR DE EFECTO DOPPLER ACÚSTICO Y AULA VIRTUAL SINCRÓNICA (LMS)
 * UNEMI - Laboratorio Virtual de Física (Plan Gratuito Spark)
 */

document.addEventListener('DOMContentLoaded', () => {
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 820;

    // CATÁLOGO DE 12 ESCENARIOS DE LA VIDA REAL
    // facesRightByDefault: true solo si el emoji nativo ya mira a la derecha
    const REAL_SCENARIOS = [
        {
            id: 'ambulance',
            name: 'Ambulancia',
            emoji: '🚑',
            facesRightByDefault: false,
            sub: 'vs = 32 m/s · Sirena',
            desc: '🚑 <strong>Ambulancia en avenida urbana:</strong> sirena bitonal a 660 Hz desplazándose por la carretera a 32 m/s (115 km/h) frente a un peatón en la acera.',
            f: 660, vS: 32, vR: 0, T: 20, mediumSpeed: null,
            env: 'suburb_road', sourceType: 'ambulance', receiverType: 'pedestrian', soundProfile: 'ambulance'
        },
        {
            id: 'police',
            name: 'Patrulla Policial',
            emoji: '🚓',
            facesRightByDefault: false,
            sub: 'vs = 38 m/s · Persecución',
            desc: '🚓 <strong>Patrulla policial nocturna:</strong> sirena modulada a 780 Hz avanzando a 38 m/s frente a un vehículo estacionado en la avenida.',
            f: 780, vS: 38, vR: 0, T: 20, mediumSpeed: null,
            env: 'city_night', sourceType: 'police', receiverType: 'car_parked', soundProfile: 'police'
        },
        {
            id: 'firetruck',
            name: 'Camión de Bomberos',
            emoji: '🚒',
            facesRightByDefault: false,
            sub: 'vs = 28 m/s · vr = -6 m/s',
            desc: '🚒 <strong>Camión de bomberos:</strong> bocina de emergencia de 320 Hz avanzando a 28 m/s mientras un ciclista se aproxima en sentido contrario a 6 m/s.',
            f: 320, vS: 28, vR: -6, T: 22, mediumSpeed: null,
            env: 'suburb_road', sourceType: 'firetruck', receiverType: 'cyclist', soundProfile: 'firetruck'
        },
        {
            id: 'bullet_train',
            name: 'Tren Bala',
            emoji: '🚄',
            facesRightByDefault: false,
            sub: 'vs = 85 m/s · 306 km/h',
            desc: '🚄 <strong>Tren de alta velocidad:</strong> cruza la estación ferroviaria a 85 m/s emitiendo su silbato a 440 Hz frente a un pasajero en el andén.',
            f: 440, vS: 85, vR: 0, T: 20, mediumSpeed: null,
            env: 'railway', sourceType: 'train', receiverType: 'pedestrian', soundProfile: 'train'
        },
        {
            id: 'f1_car',
            name: 'Auto Fórmula 1',
            emoji: '🏎️',
            facesRightByDefault: false,
            sub: 'vs = 92 m/s · 331 km/h',
            desc: '🏎️ <strong>Monoplaza Fórmula 1 en recta principal:</strong> motor a 540 Hz pasando a 92 m/s frente a los espectadores en las tarimas (efecto "neeee-owww").',
            f: 540, vS: 92, vR: 0, T: 26, mediumSpeed: null,
            env: 'racetrack', sourceType: 'f1', receiverType: 'spectator', soundProfile: 'f1'
        },
        {
            id: 'supersonic_jet',
            name: 'Caza Supersónico',
            emoji: '✈️',
            facesRightByDefault: true,
            sub: 'vs = 400 m/s · Mach 1.16',
            desc: '✈️ <strong>Aeronave supersónica (Mach > 1):</strong> supera la velocidad del sonido (400 m/s) sobre las nubes acumulando los frentes en un Cono de Mach.',
            f: 300, vS: 400, vR: 0, T: 20, mediumSpeed: null,
            env: 'sky_high', sourceType: 'jet', receiverType: 'observer_ground', soundProfile: 'jet'
        },
        {
            id: 'helicopter',
            name: 'Helicóptero',
            emoji: '🚁',
            facesRightByDefault: false,
            sub: 'vs = 45 m/s · Rotores',
            desc: '🚁 <strong>Helicóptero de rescate en vuelo rasante:</strong> batido de rotores a 210 Hz desplazándose a 45 m/s sobre el valle.',
            f: 210, vS: 45, vR: 0, T: 18, mediumSpeed: null,
            env: 'valley_sky', sourceType: 'helicopter', receiverType: 'pedestrian', soundProfile: 'helicopter'
        },
        {
            id: 'motorcycle',
            name: 'Motocicleta',
            emoji: '🏍️',
            facesRightByDefault: false,
            sub: 'vs = 42 m/s · Carretera',
            desc: '🏍️ <strong>Motocicleta deportiva:</strong> escape a 490 Hz acelerando a 42 m/s en carretera panorámica frente a un observador.',
            f: 490, vS: 42, vR: 0, T: 24, mediumSpeed: null,
            env: 'highway', sourceType: 'moto', receiverType: 'pedestrian', soundProfile: 'moto'
        },
        {
            id: 'bat',
            name: 'Murciélago (Sonar)',
            emoji: '🦇',
            facesRightByDefault: false,
            sub: 'vs = 12 m/s · Bio-sonar',
            desc: '🦇 <strong>Ecolocalización de murciélago en bosque nocturno:</strong> emite chirridos de bio-sonar (950 Hz audible) a 12 m/s mientras persigue una polilla a 4 m/s.',
            f: 950, vS: 12, vR: 4, T: 16, mediumSpeed: null,
            env: 'night_forest', sourceType: 'bat', receiverType: 'moth', soundProfile: 'bat'
        },
        {
            id: 'dolphin_sonar',
            name: 'Delfín / Sonar Marino',
            emoji: '🐬',
            facesRightByDefault: false,
            sub: 'v = 1480 m/s · En Agua',
            desc: '🐬 <strong>Propagación acústica submarina:</strong> en el océano el sonido viaja a 1480 m/s (~4.3 veces más rápido que en el aire), reduciendo el corrimiento relativo.',
            f: 820, vS: 18, vR: -8, T: 20, mediumSpeed: 1480,
            env: 'ocean', sourceType: 'dolphin', receiverType: 'submarine', soundProfile: 'dolphin'
        },
        {
            id: 'ship_horn',
            name: 'Buque en Puerto',
            emoji: '🚢',
            facesRightByDefault: true,
            sub: 'vs = 14 m/s · Niebla',
            desc: '🚢 <strong>Buque carguero entrando a puerto:</strong> sirena de niebla grave (180 Hz) avanzando lentamente a 14 m/s hacia el muelle y faro.',
            f: 180, vS: 14, vR: 0, T: 15, mediumSpeed: null,
            env: 'harbor', sourceType: 'ship', receiverType: 'pedestrian', soundProfile: 'ship'
        },
        {
            id: 'two_cars',
            name: 'Cruce de Autos',
            emoji: '🚗',
            facesRightByDefault: false,
            sub: 'vs = 25 m/s · vr = -22 m/s',
            desc: '🚗 <strong>Cruce frontal en carretera:</strong> dos vehículos se acercan mutuamente (25 m/s y -22 m/s) tocando el claxon, sumando ambos efectos.',
            f: 440, vS: 25, vR: -22, T: 20, mediumSpeed: null,
            env: 'highway', sourceType: 'car_source', receiverType: 'car_receiver', soundProfile: 'car'
        }
    ];

    // 1. ESTADO GLOBAL
    const state = {
        f: 440,
        vS: 20,
        vR: 0,
        T: 20,
        amplitude: 1.6,
        waveScale: 1.0,
        waveSpacing: 1.2,
        v: 343.4,
        fObs: 440,
        lambda: 0.78,
        isPaused: false,
        time: 0,
        waves: [],
        srcX: 0,
        recX: 0,
        history: [],
        perspective: 'physics', // 'physics' | 'real'
        activeScenario: REAL_SCENARIOS[0]
    };

    // MOTOR ACÚSTICO MULTIPERFIL (WEB AUDIO API)
    let audioCtx = null;
    let mainOsc = null;
    let subOsc = null;
    let lfoOsc = null;
    let lfoGain = null;
    let masterGain = null;
    let subGain = null;
    let noiseNode = null;
    let noiseGain = null;
    let filterNode = null;
    let isAudioPlaying = false;
    let soundModInterval = null;
    let soundStep = 0;

    let charts = {};
    let isApplyingRemoteSync = false;
    let lastCanvasWidth = 0;

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
    const ctx = canvas.getContext('2d', { alpha: false });

    // CONSTRUCCIÓN DE BOTONES DE ESCENARIOS DE LA VIDA REAL
    function initRealScenariosUI() {
        const grid = document.getElementById('realScenariosGrid');
        if (!grid) return;
        grid.innerHTML = '';

        REAL_SCENARIOS.forEach((sc) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'real-sc-btn' + (sc.id === state.activeScenario.id ? ' active' : '');
            btn.dataset.scenarioId = sc.id;
            btn.innerHTML = `
                <span class="sc-emoji">${sc.emoji}</span>
                <span class="sc-text">
                    <span class="sc-name">${sc.name}</span>
                    <span class="sc-sub">${sc.sub}</span>
                </span>
            `;
            btn.addEventListener('click', () => selectRealScenario(sc.id));
            grid.appendChild(btn);
        });
    }

    function setPerspectiveMode(mode) {
        state.perspective = mode;
        const modePhysicsBtn = document.getElementById('modePhysicsBtn');
        const modeRealBtn = document.getElementById('modeRealBtn');
        const drawer = document.getElementById('realScenariosDrawer');
        const badge = document.getElementById('activeScenarioBadge');
        const overlay = document.getElementById('canvasModeOverlay');

        if (mode === 'real') {
            modeRealBtn.classList.add('active');
            modePhysicsBtn.classList.remove('active');
            drawer.style.display = 'block';
            selectRealScenario(state.activeScenario.id);
        } else {
            modePhysicsBtn.classList.add('active');
            modeRealBtn.classList.remove('active');
            drawer.style.display = 'none';
            badge.textContent = 'Vista esquemática de laboratorio';
            if (overlay) overlay.textContent = 'SIMULACIÓN ACTIVA · FÍSICA';
            calculatePhysics();
        }
    }

    function selectRealScenario(scenarioId) {
        const sc = REAL_SCENARIOS.find(s => s.id === scenarioId) || REAL_SCENARIOS[0];
        state.activeScenario = sc;

        inputs.frequency.value = sc.f;
        inputs.sourceVelocity.value = sc.vS;
        inputs.receiverVelocity.value = sc.vR;
        inputs.temperature.value = sc.T;
        inputs.directionMode.value = 'custom';

        document.querySelectorAll('.real-sc-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scenarioId === sc.id);
        });

        const contextEl = document.getElementById('scenarioContextText');
        const badge = document.getElementById('activeScenarioBadge');
        const overlay = document.getElementById('canvasModeOverlay');

        if (contextEl) contextEl.innerHTML = sc.desc;
        if (badge) badge.textContent = `${sc.emoji} ${sc.name}`;
        if (overlay) overlay.textContent = `VIDA REAL · ${sc.name.toUpperCase()}`;

        state.waves = [];
        state.srcX = canvas.width * 0.20;
        state.recX = canvas.width * 0.76;
        soundStep = 0;
        calculatePhysics();
    }

    // 2. WEB AUDIO API (SONIDO REALISTA POR ESCENARIO + DOPPLER EN TIEMPO REAL)
    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            mainOsc = audioCtx.createOscillator();
            subOsc = audioCtx.createOscillator();
            lfoOsc = audioCtx.createOscillator();
            lfoGain = audioCtx.createGain();

            filterNode = audioCtx.createBiquadFilter();
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 3200;

            masterGain = audioCtx.createGain();
            subGain = audioCtx.createGain();
            noiseGain = audioCtx.createGain();

            masterGain.gain.value = 0;
            subGain.gain.value = 0;
            noiseGain.gain.value = 0;
            lfoGain.gain.value = 0;

            // Generador de ruido blanco suave para viento/turbina/rotores
            const bufferSize = audioCtx.sampleRate * 2;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            noiseNode = audioCtx.createBufferSource();
            noiseNode.buffer = noiseBuffer;
            noiseNode.loop = true;

            mainOsc.connect(filterNode);
            subOsc.connect(subGain);
            subGain.connect(filterNode);
            noiseNode.connect(noiseGain);
            noiseGain.connect(filterNode);

            lfoOsc.connect(lfoGain);
            lfoGain.connect(mainOsc.frequency);

            filterNode.connect(masterGain);
            masterGain.connect(audioCtx.destination);

            mainOsc.start();
            subOsc.start();
            lfoOsc.start();
            noiseNode.start();

            // Bucle de modulación temporal (sirenas bitonales, chirridos de murciélago, clics de delfín)
            soundModInterval = setInterval(updateSoundModulation, 110);
        }
    }

    function updateSoundModulation() {
        if (!audioCtx || !isAudioPlaying || state.fObs <= 0) return;

        const now = audioCtx.currentTime;
        const baseF = Math.min(state.fObs, 3600);
        const profile = state.perspective === 'real' ? state.activeScenario.soundProfile : 'physics';
        soundStep++;

        if (profile === 'physics') {
            mainOsc.type = 'sine';
            subGain.gain.setTargetAtTime(0, now, 0.04);
            noiseGain.gain.setTargetAtTime(0, now, 0.04);
            lfoGain.gain.setTargetAtTime(0, now, 0.04);
            filterNode.frequency.setTargetAtTime(4000, now, 0.05);
            mainOsc.frequency.setTargetAtTime(baseF, now, 0.05);
        } else if (profile === 'ambulance') {
            mainOsc.type = 'triangle';
            subOsc.type = 'sine';
            const highTone = Math.floor(soundStep / 5) % 2 === 0;
            const targetF = highTone ? baseF * 1.18 : baseF * 0.88;
            mainOsc.frequency.setTargetAtTime(targetF, now, 0.03);
            subOsc.frequency.setTargetAtTime(targetF * 0.5, now, 0.03);
            subGain.gain.setTargetAtTime(0.35, now, 0.04);
            noiseGain.gain.setTargetAtTime(0, now, 0.04);
            lfoGain.gain.setTargetAtTime(0, now, 0.04);
            filterNode.frequency.setTargetAtTime(2800, now, 0.05);
        } else if (profile === 'police') {
            mainOsc.type = 'sawtooth';
            const sweep = Math.sin(soundStep * 0.28) * (baseF * 0.24);
            mainOsc.frequency.setTargetAtTime(baseF + sweep, now, 0.05);
            subGain.gain.setTargetAtTime(0, now, 0.04);
            noiseGain.gain.setTargetAtTime(0, now, 0.04);
            lfoGain.gain.setTargetAtTime(0, now, 0.04);
            filterNode.frequency.setTargetAtTime(2200, now, 0.05);
        } else if (profile === 'firetruck') {
            mainOsc.type = 'sawtooth';
            subOsc.type = 'square';
            const pulse = Math.floor(soundStep / 4) % 2 === 0;
            mainOsc.frequency.setTargetAtTime(pulse ? baseF : baseF * 0.84, now, 0.04);
            subOsc.frequency.setTargetAtTime((pulse ? baseF : baseF * 0.84) * 1.25, now, 0.04);
            subGain.gain.setTargetAtTime(0.4, now, 0.04);
            noiseGain.gain.setTargetAtTime(0.03, now, 0.04);
            filterNode.frequency.setTargetAtTime(1600, now, 0.05);
        } else if (profile === 'train') {
            mainOsc.type = 'triangle';
            subOsc.type = 'sawtooth';
            mainOsc.frequency.setTargetAtTime(baseF, now, 0.05);
            subOsc.frequency.setTargetAtTime(baseF * 1.26, now, 0.05);
            subGain.gain.setTargetAtTime(0.45, now, 0.05);
            noiseGain.gain.setTargetAtTime(0.05, now, 0.05);
            filterNode.frequency.setTargetAtTime(1900, now, 0.05);
        } else if (profile === 'f1' || profile === 'moto') {
            mainOsc.type = 'sawtooth';
            subOsc.type = 'sawtooth';
            const rpmJitter = Math.sin(soundStep * 0.9) * (baseF * 0.02);
            mainOsc.frequency.setTargetAtTime(baseF * 0.5 + rpmJitter, now, 0.04);
            subOsc.frequency.setTargetAtTime(baseF + rpmJitter, now, 0.04);
            subGain.gain.setTargetAtTime(0.55, now, 0.04);
            noiseGain.gain.setTargetAtTime(0.06, now, 0.04);
            lfoOsc.frequency.setTargetAtTime(28, now, 0.05);
            lfoGain.gain.setTargetAtTime(14, now, 0.05);
            filterNode.frequency.setTargetAtTime(2500, now, 0.05);
        } else if (profile === 'jet') {
            mainOsc.type = 'sawtooth';
            subOsc.type = 'sine';
            mainOsc.frequency.setTargetAtTime(Math.max(120, baseF * 0.6), now, 0.06);
            subOsc.frequency.setTargetAtTime(Math.max(80, baseF * 0.3), now, 0.06);
            subGain.gain.setTargetAtTime(0.5, now, 0.05);
            noiseGain.gain.setTargetAtTime(0.28, now, 0.05);
            lfoGain.gain.setTargetAtTime(0, now, 0.04);
            filterNode.frequency.setTargetAtTime(1400, now, 0.05);
        } else if (profile === 'helicopter') {
            mainOsc.type = 'triangle';
            subOsc.type = 'sine';
            const chop = (soundStep % 2 === 0) ? 1.0 : 0.35;
            mainOsc.frequency.setTargetAtTime(Math.max(90, baseF * 0.45), now, 0.02);
            subOsc.frequency.setTargetAtTime(Math.max(55, baseF * 0.25), now, 0.02);
            subGain.gain.setTargetAtTime(0.6 * chop, now, 0.02);
            noiseGain.gain.setTargetAtTime(0.22 * chop, now, 0.02);
            filterNode.frequency.setTargetAtTime(950, now, 0.03);
        } else if (profile === 'bat') {
            mainOsc.type = 'sine';
            const isPulse = (soundStep % 4 === 0);
            if (isPulse) {
                mainOsc.frequency.setValueAtTime(Math.min(3800, baseF * 1.35), now);
                mainOsc.frequency.exponentialRampToValueAtTime(Math.max(250, baseF * 0.85), now + 0.09);
                masterGain.gain.setTargetAtTime(0.11, now, 0.01);
            } else {
                masterGain.gain.setTargetAtTime(0.012, now, 0.03);
            }
            subGain.gain.setTargetAtTime(0, now, 0.02);
            noiseGain.gain.setTargetAtTime(0, now, 0.02);
            filterNode.frequency.setTargetAtTime(4200, now, 0.03);
        } else if (profile === 'dolphin') {
            mainOsc.type = 'sine';
            subOsc.type = 'triangle';
            const chirp = Math.sin(soundStep * 0.65) * (baseF * 0.18);
            mainOsc.frequency.setTargetAtTime(baseF + chirp, now, 0.04);
            subOsc.frequency.setTargetAtTime(baseF * 1.5 - chirp, now, 0.04);
            subGain.gain.setTargetAtTime((soundStep % 3 === 0) ? 0.35 : 0.05, now, 0.03);
            noiseGain.gain.setTargetAtTime(0.02, now, 0.04);
            filterNode.frequency.setTargetAtTime(3600, now, 0.05);
        } else if (profile === 'ship') {
            mainOsc.type = 'sawtooth';
            subOsc.type = 'sine';
            mainOsc.frequency.setTargetAtTime(Math.max(75, baseF * 0.5), now, 0.08);
            subOsc.frequency.setTargetAtTime(Math.max(55, baseF * 0.375), now, 0.08);
            subGain.gain.setTargetAtTime(0.65, now, 0.06);
            noiseGain.gain.setTargetAtTime(0.04, now, 0.06);
            filterNode.frequency.setTargetAtTime(750, now, 0.08);
        } else if (profile === 'car') {
            mainOsc.type = 'sawtooth';
            subOsc.type = 'sawtooth';
            mainOsc.frequency.setTargetAtTime(baseF, now, 0.04);
            subOsc.frequency.setTargetAtTime(baseF * 1.25, now, 0.04);
            subGain.gain.setTargetAtTime(0.5, now, 0.04);
            noiseGain.gain.setTargetAtTime(0.02, now, 0.04);
            filterNode.frequency.setTargetAtTime(2100, now, 0.05);
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
            masterGain.gain.setTargetAtTime(0.11, audioCtx.currentTime, 0.05);
            updateSoundModulation();
            btn.innerHTML = '🔇 Silenciar';
            btn.classList.replace('btn-outline', 'btn-primary');
        } else {
            masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
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

        const isUnderwater = state.perspective === 'real' && state.activeScenario.mediumSpeed;
        state.v = isUnderwater ? state.activeScenario.mediumSpeed : (331.3 + (0.606 * state.T));

        let denom = state.v - state.vS;
        let num = state.v - state.vR;
        if (Math.abs(denom) < 0.1) denom = 0.1;

        state.fObs = state.f * (num / denom);
        if (state.fObs < 0 || Math.abs(state.vS) >= state.v) state.fObs = 0;

        state.lambda = state.v / state.f;
        const delta = ((state.fObs - state.f) / state.f) * 100;

        if (mainOsc && isAudioPlaying) {
            if (state.fObs <= 0) {
                masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04);
            } else {
                masterGain.gain.setTargetAtTime(0.11, audioCtx.currentTime, 0.04);
                updateSoundModulation();
            }
        }

        outputs.f.textContent = `${state.f} Hz`;
        outputs.vS.textContent = `${state.vS} m/s`;
        outputs.vR.textContent = `${state.vR} m/s`;
        outputs.T.textContent = `${state.T} °C`;
        outputs.amplitude.textContent = state.amplitude.toFixed(1);
        outputs.waveScale.textContent = `${state.waveScale.toFixed(1)}×`;
        outputs.waveSpacing.textContent = `${state.waveSpacing.toFixed(1)}×`;

        outputs.soundSpeed.innerHTML = `${state.v.toFixed(1)} <small>m/s</small>`;
        outputs.tempNote.textContent = isUnderwater ? 'Medio acuático (20 °C)' : `A ${state.T} °C`;

        if (Math.abs(state.vS) >= state.v) {
            outputs.observedFreq.innerHTML = `Supersónico`;
            outputs.freqState.textContent = `Mach ${(Math.abs(state.vS) / state.v).toFixed(2)}`;
            document.getElementById('physicsWarning').style.display = 'block';
        } else {
            outputs.observedFreq.innerHTML = `${state.fObs.toFixed(1)} <small>Hz</small>`;
            outputs.freqState.textContent = '';
            document.getElementById('physicsWarning').style.display = 'none';
            if (Math.abs(delta) < 0.05) outputs.freqState.textContent = 'Sin desplazamiento Doppler';
            else if (delta > 0) outputs.freqState.textContent = 'Tono más agudo (compresión)';
            else outputs.freqState.textContent = 'Tono más grave (expansión)';
        }

        outputs.emittedWave.innerHTML = `${state.lambda.toFixed(3)} <small>m</small>`;
        outputs.freqDelta.innerHTML = `${delta > 0 ? '+' : ''}${delta.toFixed(1)} <small>%</small>`;

        updateFormulas(delta, num, denom, isUnderwater);
        updateDataTable();
        updateCharts();

        if (!isApplyingRemoteSync && typeof window.broadcastSimulatorState === 'function') {
            window.broadcastSimulatorState();
        }
    }

    function updateFormulas(delta, num, denom, isUnderwater) {
        document.getElementById('proc-sound').innerHTML = isUnderwater
            ? `Medio acuático: <strong>v = 1480.0 m/s</strong>`
            : `v = 331,3 + 0,606(${state.T})<br><strong>v = ${state.v.toFixed(1)} m/s</strong>`;

        document.getElementById('proc-doppler').innerHTML =
            `f′ = ${state.f} · (${state.v.toFixed(1)} ${state.vR >= 0 ? '−' : '+'} ${Math.abs(state.vR)}) / (${state.v.toFixed(1)} ${state.vS >= 0 ? '−' : '+'} ${Math.abs(state.vS)})<br>` +
            `f′ = ${state.f} · (${num.toFixed(1)}) / (${denom.toFixed(1)})<br><strong>f′ = ${state.fObs.toFixed(1)} Hz</strong>`;

        document.getElementById('proc-emitted').innerHTML =
            `λ = ${state.v.toFixed(1)} / ${state.f}<br><strong>λ = ${state.lambda.toFixed(3)} m</strong>`;

        const lambdaFront = Math.max(0, (state.v - Math.abs(state.vS)) / state.f);
        const lambdaBack = (state.v + Math.abs(state.vS)) / state.f;
        document.getElementById('proc-frontback').innerHTML =
            `Frente: λ = (${state.v.toFixed(1)} − ${Math.abs(state.vS)}) / ${state.f} = <strong>${lambdaFront.toFixed(3)} m</strong><br>` +
            `Detrás: λ = (${state.v.toFixed(1)} + ${Math.abs(state.vS)}) / ${state.f} = <strong>${lambdaBack.toFixed(3)} m</strong>`;

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

    // 4. GRÁFICAS (5 PANELES OPTIMIZADOS PARA MÓVIL Y ESCRITORIO)
    function initCharts() {
        Chart.defaults.color = '#91a2bd';
        Chart.defaults.font.family = "'DM Sans', sans-serif";
        if (isMobileDevice) {
            Chart.defaults.devicePixelRatio = 1;
        }

        const opts = {
            responsive: true,
            maintainAspectRatio: false,
            animation: isMobileDevice ? false : { duration: 250 },
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
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                cutout: '72%',
                plugins: { legend: { display: false } }
            }
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
        charts.source.update('none');

        charts.wavelength.data.datasets[0].data = [
            Math.max(0, (state.v - Math.abs(state.vS)) / state.f),
            (state.v + Math.abs(state.vS)) / state.f
        ];
        charts.wavelength.update('none');

        charts.compare.data.datasets[0].data = [state.f, state.fObs];
        charts.compare.update('none');

        const mach = Math.min(1, Math.abs(state.vS) / state.v);
        charts.speed.data.datasets[0].data = [mach, Math.max(0, 1 - mach)];
        charts.speed.update('none');

        if (!state.isPaused) {
            state.history.push(state.fObs);
            if (state.history.length > 25) state.history.shift();
            charts.time.data.datasets[0].data = state.history;
            charts.time.update('none');
        }
    }

    // 5. ANIMACIÓN CANVAS CON ESCENARIOS ILUSTRADOS Y ORIENTACIÓN CORREGIDA
    function resizeCanvas(force = false) {
        const parent = canvas.parentElement;
        if (!parent || parent.clientWidth === 0) return;

        // Evita que Safari iOS borre el canvas por el cambio de altura de la barra URL al hacer scroll
        if (!force && isMobileDevice && parent.clientWidth === lastCanvasWidth) {
            return;
        }
        lastCanvasWidth = parent.clientWidth;

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        state.srcX = canvas.width * 0.22;
        state.recX = canvas.width * 0.76;
    }

    function drawArrow(fx, fy, tx, ty, color) {
        const angle = Math.atan2(ty - fy, tx - fx);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.lineTo(tx - 8 * Math.cos(angle - Math.PI / 6), ty - 8 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - 8 * Math.cos(angle + Math.PI / 6), ty - 8 * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.restore();
    }

    function drawCloud(cx, cy, scale = 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, 16 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 15 * scale, cy - 5 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 34 * scale, cy, 15 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawHouse(x, groundY, w, h, wallColor, roofColor, isNight = false) {
        ctx.fillStyle = wallColor;
        ctx.fillRect(x, groundY - h, w, h);
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(x - 5, groundY - h);
        ctx.lineTo(x + w / 2, groundY - h - 18);
        ctx.lineTo(x + w + 5, groundY - h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = isNight ? 'rgba(250, 204, 21, 0.75)' : 'rgba(186, 230, 253, 0.55)';
        ctx.fillRect(x + 8, groundY - h + 10, 10, 10);
        ctx.fillRect(x + w - 18, groundY - h + 10, 10, 10);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(x + w / 2 - 5, groundY - 16, 10, 16);
    }

    function drawTree(x, groundY, scale = 1) {
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(x - 3 * scale, groundY - 16 * scale, 6 * scale, 16 * scale);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(x, groundY - 24 * scale, 14 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawScenarioBackdrop(w, h, cY) {
        if (state.perspective === 'physics') {
            const bgSurface = getComputedStyle(document.body).getPropertyValue('--surface-2').trim() || '#17233b';
            ctx.fillStyle = bgSurface;
            ctx.fillRect(0, 0, w, h);

            ctx.save();
            ctx.strokeStyle = 'rgba(145, 162, 189, 0.08)';
            ctx.lineWidth = 1;
            const step = 40;
            for (let x = 0; x < w; x += step) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = 0; y < h; y += step) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        const env = state.activeScenario.env;
        const groundY = cY + 18;
        ctx.save();

        // Fondo base opaco para evitar rastros al usar alpha: false
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // 1. CIELO SEGÚN ESCENARIO
        const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
        if (env === 'city_night' || env === 'night_forest') {
            skyGrad.addColorStop(0, '#04091a');
            skyGrad.addColorStop(1, '#111c38');
        } else if (env === 'ocean') {
            skyGrad.addColorStop(0, '#03396c');
            skyGrad.addColorStop(1, '#011627');
        } else {
            skyGrad.addColorStop(0, '#0c3b66');
            skyGrad.addColorStop(1, '#1e5b8c');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, env === 'ocean' ? h : groundY);

        if (env === 'city_night' || env === 'night_forest') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            for (let i = 0; i < 24; i++) {
                ctx.fillRect((i * 73) % w, (i * 31) % (groundY - 25), 2, 2);
            }
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(w - 95, 42, 14, 0, Math.PI * 2);
            ctx.fill();
        } else if (env !== 'ocean') {
            ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
            ctx.beginPath();
            ctx.arc(90, 42, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
            for (let i = 0; i < 5; i++) {
                const cx = ((i * 210 + state.time * 0.25) % (w + 120)) - 60;
                const cy = 34 + (i % 2) * 24;
                drawCloud(cx, cy, 0.9 + (i % 2) * 0.25);
            }
        }

        // 2. DECORACIÓN DE CADA ESCENARIO
        if (env === 'suburb_road') {
            const palette = [
                ['#334155', '#b91c1c'],
                ['#475569', '#d97706'],
                ['#1e293b', '#0f766e'],
                ['#3f3f46', '#9a3412']
            ];
            let idx = 0;
            for (let x = 24; x < w - 60; x += 135) {
                const colors = palette[idx % palette.length];
                drawHouse(x, groundY, 58, 38 + (idx % 2) * 10, colors[0], colors[1], false);
                drawTree(x + 82, groundY, 0.95);
                idx++;
            }
        } else if (env === 'city_night') {
            for (let x = 18; x < w - 40; x += 78) {
                const bh = 52 + ((x * 17) % 55);
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(x, groundY - bh, 56, bh);
                ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
                for (let wy = groundY - bh + 8; wy < groundY - 12; wy += 13) {
                    ctx.fillRect(x + 10, wy, 8, 6);
                    ctx.fillRect(x + 24, wy, 8, 6);
                    ctx.fillRect(x + 38, wy, 8, 6);
                }
            }
        } else if (env === 'racetrack') {
            const standX = Math.max(260, state.recX - 95);
            const standW = 190;
            const standH = 58;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(standX, groundY - standH, standW, standH);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(standX - 8, groundY - standH - 8, standW + 16, 8);
            const crowdColors = ['#38bdf8', '#facc15', '#f43f5e', '#4ade80', '#a78bfa'];
            for (let row = 0; row < 3; row++) {
                const ry = groundY - 14 - row * 14;
                ctx.fillStyle = '#334155';
                ctx.fillRect(standX + 4, ry, standW - 8, 3);
                for (let px = standX + 12; px < standX + standW - 12; px += 14) {
                    ctx.fillStyle = crowdColors[(px + row) % crowdColors.length];
                    ctx.beginPath();
                    ctx.arc(px, ry - 4, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(24, groundY - 22, 160, 22);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(24, groundY - 22, 160, 5);
        } else if (env === 'railway') {
            const platX = Math.max(240, state.recX - 85);
            ctx.fillStyle = '#334155';
            ctx.fillRect(platX, groundY - 46, 170, 6);
            ctx.fillRect(platX + 25, groundY - 40, 5, 40);
            ctx.fillRect(platX + 140, groundY - 40, 5, 40);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(110, groundY - 48, 6, 48);
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(113, groundY - 42, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (env === 'highway' || env === 'valley_sky') {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
            ctx.beginPath();
            ctx.moveTo(0, groundY);
            ctx.lineTo(140, groundY - 68);
            ctx.lineTo(310, groundY);
            ctx.lineTo(480, groundY - 76);
            ctx.lineTo(680, groundY);
            ctx.lineTo(880, groundY - 62);
            ctx.lineTo(w, groundY);
            ctx.closePath();
            ctx.fill();

            for (let x = 40; x < w; x += 120) {
                drawTree(x, groundY, 0.9);
            }
        } else if (env === 'night_forest') {
            for (let x = 20; x < w; x += 55) {
                const th = 55 + (x % 35);
                ctx.fillStyle = '#062c1e';
                ctx.beginPath();
                ctx.moveTo(x, h);
                ctx.lineTo(x + 20, h - th);
                ctx.lineTo(x + 40, h);
                ctx.closePath();
                ctx.fill();
            }
        } else if (env === 'ocean') {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.07)';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(50 + i * 170, 0);
                ctx.lineTo(120 + i * 170, 0);
                ctx.lineTo(200 + i * 170, h);
                ctx.lineTo(10 + i * 170, h);
                ctx.closePath();
                ctx.fill();
            }
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
            ctx.lineWidth = 1.2;
            for (let i = 0; i < 12; i++) {
                const bx = (i * 89 + 30) % w;
                const by = h - ((state.time * 0.8 + i * 27) % h);
                ctx.beginPath();
                ctx.arc(bx, by, 3 + (i % 3), 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (env === 'harbor') {
            const pierX = w - 165;
            ctx.fillStyle = '#475569';
            ctx.fillRect(pierX, groundY - 8, 165, 16);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(w - 52, groundY - 56, 16, 48);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(w - 52, groundY - 42, 16, 12);
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(w - 44, groundY - 60, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. SUPERFICIE DE DESPLAZAMIENTO
        if (env === 'racetrack') {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, groundY, w, h - groundY);
            for (let x = 0; x < w; x += 28) {
                ctx.fillStyle = (Math.floor(x / 28) % 2 === 0) ? '#ef4444' : '#f8fafc';
                ctx.fillRect(x, groundY, 28, 5);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 2;
            ctx.setLineDash([24, 18]);
            ctx.beginPath();
            ctx.moveTo(0, groundY + 24);
            ctx.lineTo(w, groundY + 24);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (env === 'railway') {
            ctx.fillStyle = '#334155';
            ctx.fillRect(0, groundY, w, h - groundY);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(0, groundY + 3, w, 4);
            ctx.fillStyle = '#78350f';
            for (let x = 0; x < w; x += 16) ctx.fillRect(x, groundY + 7, 9, 5);
        } else if (env === 'harbor') {
            ctx.fillStyle = '#0369a1';
            ctx.fillRect(0, groundY + 4, w, h - groundY);
        } else if (env === 'suburb_road' || env === 'city_night' || env === 'highway' || env === 'valley_sky') {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(0, groundY - 3, w, 5);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, groundY + 2, w, h - groundY);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([22, 16]);
            ctx.beginPath();
            ctx.moveTo(0, groundY + 22);
            ctx.lineTo(w, groundY + 22);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    function drawHighVisibilityWaves(cY) {
        if (!toggles.waves.checked) return;

        ctx.save();
        const glowStrength = isMobileDevice ? 0 : Math.min(24, 10 * state.amplitude);

        for (let i = state.waves.length - 1; i >= 0; i--) {
            const w = state.waves[i];
            w.radius += (state.v / 110) * state.waveScale;
            w.alpha -= 0.0028 * state.waveScale;
            if (w.alpha <= 0) {
                state.waves.splice(i, 1);
                continue;
            }

            const alpha = Math.max(0, w.alpha);

            if (!isMobileDevice) {
                const radGrad = ctx.createRadialGradient(
                    w.x, w.y, Math.max(0, w.radius - 10),
                    w.x, w.y, w.radius + 3
                );
                radGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
                radGrad.addColorStop(0.75, `rgba(0, 240, 255, ${alpha * 0.14})`);
                radGrad.addColorStop(1, `rgba(167, 139, 250, ${alpha * 0.22})`);

                ctx.fillStyle = radGrad;
                ctx.beginPath();
                ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.lineWidth = 2.1 * state.amplitude;
            ctx.shadowBlur = glowStrength;

            ctx.strokeStyle = state.vS > 0
                ? `rgba(0, 240, 255, ${Math.min(1, alpha * 0.95)})`
                : `rgba(167, 139, 250, ${Math.min(1, alpha * 0.9)})`;
            if (!isMobileDevice) ctx.shadowColor = state.vS > 0 ? '#00f0ff' : '#a78bfa';
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.radius, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();

            ctx.strokeStyle = state.vS < 0
                ? `rgba(0, 240, 255, ${Math.min(1, alpha * 0.95)})`
                : `rgba(167, 139, 250, ${Math.min(1, alpha * 0.9)})`;
            if (!isMobileDevice) ctx.shadowColor = state.vS < 0 ? '#00f0ff' : '#a78bfa';
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.radius, Math.PI / 2, (3 * Math.PI) / 2);
            ctx.stroke();
        }

        if (Math.abs(state.vS) >= state.v) {
            const sinTheta = state.v / Math.abs(state.vS);
            const theta = Math.asin(Math.min(1, sinTheta));
            const coneLen = 240;
            const dir = state.vS >= 0 ? -1 : 1;

            ctx.strokeStyle = '#f43f5e';
            if (!isMobileDevice) {
                ctx.shadowColor = '#f43f5e';
                ctx.shadowBlur = 16;
            }
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(state.srcX + dir * coneLen * Math.cos(theta), cY - coneLen * Math.sin(theta));
            ctx.lineTo(state.srcX, cY);
            ctx.lineTo(state.srcX + dir * coneLen * Math.cos(theta), cY + coneLen * Math.sin(theta));
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawEntities(cY) {
        if (toggles.receiver.checked) {
            const isF1Stand = state.perspective === 'real' && state.activeScenario.env === 'racetrack';
            const recY = isF1Stand ? cY - 26 : cY;

            if (state.perspective === 'physics') {
                ctx.save();
                ctx.beginPath();
                ctx.arc(state.recX, recY, 10, 0, Math.PI * 2);
                ctx.fillStyle = '#72a9ff';
                if (!isMobileDevice) {
                    ctx.shadowColor = '#72a9ff';
                    ctx.shadowBlur = 12;
                }
                ctx.fill();
                ctx.restore();
            } else {
                const recIcons = {
                    pedestrian: '🧍',
                    car_parked: '🚙',
                    cyclist: '🚴',
                    spectator: '🙋',
                    observer_ground: '🔭',
                    moth: '🦋',
                    submarine: '🛥️',
                    car_receiver: '🚘'
                };
                ctx.save();
                ctx.translate(state.recX, recY);
                if (state.vR > 0 && (state.activeScenario.receiverType === 'cyclist' || state.activeScenario.receiverType === 'car_receiver')) {
                    ctx.scale(-1, 1);
                }
                ctx.font = '28px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(recIcons[state.activeScenario.receiverType] || '🧍', 0, 0);
                ctx.restore();
            }

            if (toggles.arrows.checked && state.vR !== 0) {
                const dir = state.vR > 0 ? 38 : -38;
                drawArrow(state.recX, recY + 22, state.recX + dir, recY + 22, '#72a9ff');
            }
            if (toggles.labels.checked) {
                ctx.save();
                ctx.fillStyle = '#72a9ff';
                ctx.font = '600 11px "DM Sans", sans-serif';
                ctx.textAlign = 'center';
                const recText = isF1Stand ? `Espectador en tarima (0 m/s)` : `Receptor (${state.vR} m/s)`;
                ctx.fillText(recText, state.recX, recY - 22);
                ctx.restore();
            }
        }

        if (state.perspective === 'physics') {
            ctx.save();
            ctx.beginPath();
            ctx.arc(state.srcX, cY, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffb66b';
            if (!isMobileDevice) {
                ctx.shadowColor = '#ffb66b';
                ctx.shadowBlur = 14;
            }
            ctx.fill();
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(state.srcX, cY);

            const movingRight = state.vS >= 0;
            const shouldFlip = state.activeScenario.facesRightByDefault ? !movingRight : movingRight;
            if (shouldFlip) {
                ctx.scale(-1, 1);
            }

            ctx.font = '34px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(state.activeScenario.emoji, 0, 0);

            const sType = state.activeScenario.sourceType;
            if (sType === 'ambulance' || sType === 'police' || sType === 'firetruck') {
                const flash = Math.sin(state.time * 0.35) > 0;
                ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
                if (!isMobileDevice) {
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 16;
                }
                ctx.beginPath();
                ctx.arc(0, -16, 4.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        if (toggles.arrows.checked && state.vS !== 0) {
            const dir = state.vS > 0 ? 38 : -38;
            drawArrow(state.srcX, cY + 22, state.srcX + dir, cY + 22, '#ffb66b');
        }
        if (toggles.labels.checked) {
            ctx.save();
            ctx.fillStyle = '#ffb66b';
            ctx.font = '600 11px "DM Sans", sans-serif';
            ctx.textAlign = 'center';
            const srcLabel = state.perspective === 'real'
                ? `${state.activeScenario.name} (${state.vS} m/s)`
                : `Fuente (${state.vS} m/s)`;
            ctx.fillText(srcLabel, state.srcX, cY - 22);
            ctx.restore();
        }
    }

    function draw() {
        if (!state.isPaused) {
            const cY = canvas.height / 2 + 12;

            drawScenarioBackdrop(canvas.width, canvas.height, cY);

            state.srcX += (state.vS / 340) * 2.2 * state.waveScale;
            if (toggles.receiver.checked) {
                state.recX += (state.vR / 340) * 2.2 * state.waveScale;
            }

            if (state.srcX > canvas.width + 40) state.srcX = -40;
            if (state.srcX < -40) state.srcX = canvas.width + 40;
            if (state.recX > canvas.width + 40) state.recX = -40;
            if (state.recX < -40) state.recX = canvas.width + 40;

            state.time++;
            const emitInterval = Math.max(4, Math.floor((78 / (state.f / 440)) / state.waveSpacing));
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

            drawHighVisibilityWaves(cY);
            drawEntities(cY);
        }
        requestAnimationFrame(draw);
    }

    // 6. EVENTOS DE SIMULADOR Y SELECTOR DE PERSPECTIVA
    document.getElementById('modePhysicsBtn').addEventListener('click', () => setPerspectiveMode('physics'));
    document.getElementById('modeRealBtn').addEventListener('click', () => setPerspectiveMode('real'));

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
        Object.values(charts).forEach(c => c.update('none'));
    });

    document.getElementById('toggleAudioBtn').addEventListener('click', (e) => toggleAudio(e.target));
    document.getElementById('pauseBtn').addEventListener('click', (e) => {
        state.isPaused = !state.isPaused;
        e.target.textContent = state.isPaused ? 'Reanudar' : 'Pausar';
    });
    document.getElementById('restartAnimationBtn').addEventListener('click', () => {
        state.waves = [];
        resizeCanvas(true);
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        inputs.frequency.value = 440;
        inputs.sourceVelocity.value = 20;
        inputs.receiverVelocity.value = 0;
        inputs.temperature.value = 20;
        inputs.amplitude.value = 1.6;
        inputs.waveScale.value = 1.0;
        inputs.waveSpacing.value = 1.2;
        inputs.directionMode.value = 'custom';
        setPerspectiveMode('physics');
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

    window.addEventListener('resize', () => resizeCanvas(false));

    // ==========================================
    // 7. FIREBASE: ROLES, CLASE EN VIVO, MATERIALES, TAREAS, CHAT Y NOTIFICACIONES
    // ==========================================
    const MAX_FIRESTORE_FILE_BYTES = 700 * 1024;
    const JITSI_ROOM_NAME = "LaboratorioFisicaUNEMIDoppler";

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

    function showToastNotification(title, message, targetId = 'chatPanel') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `<strong>🔔 ${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span>`;
        toast.onclick = () => {
            const el = document.getElementById(targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
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
        let unsubscribeLiveClass = null;
        let currentUserRole = 'estudiante';
        let unreadCount = 0;
        let jitsiApi = null;
        let syncTimer = null;

        function cerrarJitsi() {
            if (jitsiApi) {
                try { jitsiApi.dispose(); } catch (e) {}
                jitsiApi = null;
            }
            const container = document.getElementById('jitsiContainer');
            container.innerHTML = '';
            container.style.display = 'none';
            document.getElementById('jitsiFallbackBar').style.display = 'none';
        }

        function abrirJitsi(user) {
            const container = document.getElementById('jitsiContainer');
            const fallbackBar = document.getElementById('jitsiFallbackBar');
            container.style.display = 'block';
            fallbackBar.style.display = 'block';

            if (jitsiApi) return;

            if (typeof window.JitsiMeetExternalAPI === 'function') {
                jitsiApi = new window.JitsiMeetExternalAPI("meet.jit.si", {
                    roomName: JITSI_ROOM_NAME,
                    width: "100%",
                    height: 460,
                    parentNode: container,
                    userInfo: {
                        displayName: user.displayName,
                        email: user.email
                    },
                    configOverwrite: {
                        startWithAudioMuted: currentUserRole !== 'docente',
                        startWithVideoMuted: currentUserRole !== 'docente',
                        prejoinPageEnabled: false
                    }
                });

                jitsiApi.addListener('videoConferenceLeft', () => {
                    cerrarJitsi();
                    if (currentUserRole === 'estudiante') {
                        document.getElementById('joinJitsiBtn').style.display = 'inline-flex';
                        document.getElementById('leaveJitsiBtn').style.display = 'none';
                    }
                });
            } else {
                container.innerHTML = `<iframe src="https://meet.jit.si/${JITSI_ROOM_NAME}#userInfo.displayName=%22${encodeURIComponent(user.displayName)}%22" allow="camera; microphone; fullscreen; display-capture; autoplay" style="width:100%; height:460px; border:0;"></iframe>`;
            }
        }

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
            const teacherLiveCtrl = document.getElementById('teacherLiveControls');
            const studentLiveCtrl = document.getElementById('studentLiveControls');

            if (rol === 'docente') {
                rolBadge.textContent = '👨‍🏫 VISTA DE DOCENTE';
                rolBadge.style.backgroundColor = 'color-mix(in srgb, var(--warning) 18%, transparent)';
                rolBadge.style.color = 'var(--warning)';
                taskInst.textContent = "Sube deberes o guías (aparecerán en el chat) y califica las entregas.";
                teacherUploadBox.style.display = 'flex';
                teacherLiveCtrl.style.display = 'flex';
                studentLiveCtrl.style.display = 'none';
            } else {
                rolBadge.textContent = '🎓 VISTA DE ESTUDIANTE';
                taskInst.textContent = "Sube tu tarea resuelta; se enviará al chat y quedará lista para calificación.";
                teacherUploadBox.style.display = 'none';
                teacherLiveCtrl.style.display = 'none';
                studentLiveCtrl.style.display = 'flex';
            }

            eduPanel.insertBefore(rolBadge, eduPanel.children[1]);

            document.getElementById('liveClassPanel').style.display = 'block';
            document.getElementById('materialPanel').style.display = 'block';
            document.getElementById('taskPanel').style.display = 'block';
            document.getElementById('chatPanel').style.display = 'block';
        }

        function iniciarSistemas(user) {
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }

            const liveDocRef = doc(window.firebaseDb, "clase_vivo", "estado");
            const liveStatusBadge = document.getElementById('liveStatusBadge');
            const toggleLiveClassBtn = document.getElementById('toggleLiveClassBtn');
            const syncSimulatorToggle = document.getElementById('syncSimulatorToggle');
            const externalMeetInput = document.getElementById('externalMeetInput');
            const saveExternalMeetBtn = document.getElementById('saveExternalMeetBtn');
            const clearExternalMeetBtn = document.getElementById('clearExternalMeetBtn');
            const studentLiveText = document.getElementById('studentLiveText');
            const joinJitsiBtn = document.getElementById('joinJitsiBtn');
            const leaveJitsiBtn = document.getElementById('leaveJitsiBtn');
            const externalMeetBar = document.getElementById('externalMeetBar');
            const externalMeetLinkBtn = document.getElementById('externalMeetLinkBtn');
            const guidedSyncNotice = document.getElementById('guidedSyncNotice');

            let isClassActive = false;
            let wasClassActive = false;

            window.broadcastSimulatorState = () => {
                if (currentUserRole !== 'docente' || !syncSimulatorToggle.checked) return;
                clearTimeout(syncTimer);
                syncTimer = setTimeout(async () => {
                    try {
                        await setDoc(liveDocRef, {
                            syncSimulador: true,
                            docente: user.displayName,
                            simState: {
                                f: state.f,
                                vS: state.vS,
                                vR: state.vR,
                                T: state.T,
                                amplitude: state.amplitude,
                                waveScale: state.waveScale,
                                waveSpacing: state.waveSpacing,
                                directionMode: inputs.directionMode.value,
                                perspective: state.perspective,
                                scenarioId: state.activeScenario.id
                            },
                            actualizado: new Date()
                        }, { merge: true });
                    } catch (err) {
                        console.error("Error sincronizando simulador:", err);
                    }
                }, 150);
            };

            unsubscribeLiveClass = onSnapshot(liveDocRef, (snap) => {
                const data = snap.exists() ? snap.data() : {};
                isClassActive = Boolean(data.activa);

                if (isClassActive) {
                    liveStatusBadge.textContent = `🔴 EN VIVO (${data.docente || 'Docente'})`;
                    liveStatusBadge.style.backgroundColor = 'color-mix(in srgb, var(--warning) 22%, transparent)';
                    liveStatusBadge.style.color = 'var(--warning)';

                    if (currentUserRole === 'docente') {
                        toggleLiveClassBtn.textContent = '⏹️ Finalizar Videollamada';
                        toggleLiveClassBtn.classList.replace('btn-primary', 'btn-outline');
                    } else {
                        studentLiveText.textContent = `El docente ${data.docente || ''} está transmitiendo en vivo.`;
                        if (!jitsiApi && document.getElementById('jitsiContainer').style.display === 'none') {
                            joinJitsiBtn.style.display = 'inline-flex';
                            leaveJitsiBtn.style.display = 'none';
                        }
                        if (!wasClassActive) {
                            playNotificationSound();
                            showToastNotification("Clase en Vivo Iniciada", "Haz clic aquí para unirte a la videollamada.", "liveClassPanel");
                        }
                    }
                } else {
                    liveStatusBadge.textContent = '⚪ Sala en espera';
                    liveStatusBadge.style.backgroundColor = '';
                    liveStatusBadge.style.color = '';

                    if (currentUserRole === 'docente') {
                        toggleLiveClassBtn.textContent = '🎥 Iniciar Videollamada en la App';
                        toggleLiveClassBtn.classList.replace('btn-outline', 'btn-primary');
                    } else {
                        studentLiveText.textContent = 'El docente aún no ha iniciado la transmisión en vivo.';
                        joinJitsiBtn.style.display = 'none';
                        leaveJitsiBtn.style.display = 'none';
                        cerrarJitsi();
                    }
                }
                wasClassActive = isClassActive;

                if (data.enlaceExterno) {
                    externalMeetBar.style.display = 'block';
                    externalMeetLinkBtn.href = data.enlaceExterno;
                    if (currentUserRole === 'docente') {
                        externalMeetInput.value = data.enlaceExterno;
                        clearExternalMeetBtn.style.display = 'inline-flex';
                    }
                } else {
                    externalMeetBar.style.display = 'none';
                    if (currentUserRole === 'docente') {
                        clearExternalMeetBtn.style.display = 'none';
                    }
                }

                if (currentUserRole === 'docente') {
                    syncSimulatorToggle.checked = Boolean(data.syncSimulador);
                } else {
                    if (data.syncSimulador && data.simState) {
                        guidedSyncNotice.style.display = 'block';
                        isApplyingRemoteSync = true;
                        if (data.simState.perspective && data.simState.perspective !== state.perspective) {
                            setPerspectiveMode(data.simState.perspective);
                        }
                        if (data.simState.perspective === 'real' && data.simState.scenarioId) {
                            selectRealScenario(data.simState.scenarioId);
                        }
                        inputs.frequency.value = data.simState.f;
                        inputs.sourceVelocity.value = data.simState.vS;
                        inputs.receiverVelocity.value = data.simState.vR;
                        inputs.temperature.value = data.simState.T;
                        inputs.amplitude.value = data.simState.amplitude;
                        inputs.waveScale.value = data.simState.waveScale;
                        inputs.waveSpacing.value = data.simState.waveSpacing;
                        inputs.directionMode.value = data.simState.directionMode || 'custom';
                        calculatePhysics();
                        isApplyingRemoteSync = false;
                    } else {
                        guidedSyncNotice.style.display = 'none';
                    }
                }
            });

            if (currentUserRole === 'docente') {
                toggleLiveClassBtn.onclick = async () => {
                    const nuevoEstado = !isClassActive;
                    toggleLiveClassBtn.disabled = true;
                    try {
                        await setDoc(liveDocRef, {
                            activa: nuevoEstado,
                            docente: user.displayName,
                            actualizado: new Date()
                        }, { merge: true });

                        if (nuevoEstado) {
                            abrirJitsi(user);
                            await addDoc(collection(window.firebaseDb, "chat"), {
                                usuario: user.displayName,
                                email: user.email,
                                mensaje: `🎥 El docente ${user.displayName} inició la clase virtual en vivo en el panel superior.`,
                                esSistema: true,
                                fecha: new Date()
                            });
                        } else {
                            cerrarJitsi();
                        }
                    } catch (err) {
                        console.error("Error cambiando estado de clase en vivo:", err);
                        alert("No se pudo iniciar la sala: " + err.message);
                    } finally {
                        toggleLiveClassBtn.disabled = false;
                    }
                };

                syncSimulatorToggle.onchange = async () => {
                    try {
                        if (syncSimulatorToggle.checked) {
                            window.broadcastSimulatorState();
                        } else {
                            await setDoc(liveDocRef, {
                                syncSimulador: false,
                                actualizado: new Date()
                            }, { merge: true });
                        }
                    } catch (err) {
                        console.error("Error en sincronización:", err);
                    }
                };

                saveExternalMeetBtn.onclick = async () => {
                    const url = externalMeetInput.value.trim();
                    if (!url) {
                        alert("Pega primero el enlace de Google Meet o Zoom.");
                        return;
                    }
                    try {
                        await setDoc(liveDocRef, {
                            enlaceExterno: url,
                            docente: user.displayName,
                            actualizado: new Date()
                        }, { merge: true });
                        alert("Enlace de sala externa publicado para toda la clase.");
                    } catch (err) {
                        alert("Error guardando enlace: " + err.message);
                    }
                };

                clearExternalMeetBtn.onclick = async () => {
                    try {
                        await setDoc(liveDocRef, {
                            enlaceExterno: "",
                            actualizado: new Date()
                        }, { merge: true });
                        externalMeetInput.value = "";
                    } catch (err) {
                        alert("Error quitando enlace: " + err.message);
                    }
                };
            } else {
                joinJitsiBtn.onclick = () => {
                    abrirJitsi(user);
                    joinJitsiBtn.style.display = 'none';
                    leaveJitsiBtn.style.display = 'inline-flex';
                };

                leaveJitsiBtn.onclick = () => {
                    cerrarJitsi();
                    if (isClassActive) joinJitsiBtn.style.display = 'inline-flex';
                    leaveJitsiBtn.style.display = 'none';
                };
            }

            // A. SINCRONIZACIÓN DE RÚBRICA Y CUADERNILLO
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

            // C. GESTIÓN DE TAREAS, CALIFICACIONES Y ELIMINACIÓN SINCRONIZADA
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

                    await delDoc(doc(window.firebaseDb, "archivos", fileId));

                    const chatRef = collection(window.firebaseDb, "chat");
                    const qPorId = query(chatRef, where("archivoId", "==", fileId));
                    const snapPorId = await getDocs(qPorId);

                    if (!snapPorId.empty) {
                        for (const msgDoc of snapPorId.docs) {
                            await delDoc(doc(window.firebaseDb, "chat", msgDoc.id));
                        }
                    } else {
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
                document.getElementById('liveClassPanel').style.display = 'none';
                document.getElementById('materialPanel').style.display = 'none';
                document.getElementById('taskPanel').style.display = 'none';
                document.getElementById('chatPanel').style.display = 'none';
                document.querySelectorAll('.rol-badge').forEach(tag => tag.remove());
                cerrarJitsi();

                if (unsubscribeChat) unsubscribeChat();
                if (unsubscribeFiles) unsubscribeFiles();
                if (unsubscribeRubrica) unsubscribeRubrica();
                if (unsubscribeCuadernillo) unsubscribeCuadernillo();
                if (unsubscribeLiveClass) unsubscribeLiveClass();
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
    initRealScenariosUI();
    resizeCanvas(true);
    initCharts();
    calculatePhysics();
    requestAnimationFrame(draw);
    setInterval(() => {
        if (!state.isPaused) updateCharts();
    }, isMobileDevice ? 4000 : 1000);
});
