// Guitar Practice - Guitar Routine Practice Studio
// Pure JavaScript logic leveraging Wavesurfer.js v7

// Default preloaded backing tracks
const DEFAULT_TRACKS = [
  {
    name: "Survivor - Eye of the tiger - Guitar Backing track",
    url: "tracks/Survivor - Eye of the tiger - Guitar Backing track.mp3",
    id: "eye-of-the-tiger"
  },
  {
    name: "Smoke On The Water - Em (100% com Click)",
    url: "tracks/Smoke On The Water - Em (100% com Click).wav",
    id: "smoke-on-the-water"
  },
  {
    name: "Eye of the tiger.mp3",
    url: "tracks/Eye of the tiger.mp3.mpeg",
    id: "eye-of-the-tiger-alt"
  }
];

// App State
let ws = null;
let wsRegions = null;
let wsTimeline = null;
let activeRegion = null;

let trackLibrary = [...DEFAULT_TRACKS];
let currentTrackIndex = 0;

let loopStart = 0;
let loopEnd = 0;
let isPlayingRoutine = false;
let currentLoopCount = 1;
let maxLoops = 10;
let loopInfinite = false;

// Audio Synth Instance
const synth = new PracticeSynth();

// DOM Elements
const trackListContainer = document.getElementById('track-list');
const currentTrackTitle = document.getElementById('current-track-title');
const playingBadge = document.getElementById('playing-badge');

const btnPlayPause = document.getElementById('btn-play-pause');
const playIcon = document.getElementById('play-icon');
const btnStop = document.getElementById('btn-stop');
const btnBackward = document.getElementById('btn-backward');
const btnForward = document.getElementById('btn-forward');
const btnMute = document.getElementById('btn-mute');
const volumeIcon = document.getElementById('volume-icon');
const volumeSlider = document.getElementById('volume-slider');

const zoomSlider = document.getElementById('zoom-slider');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');

const loopStartInput = document.getElementById('loop-start-input');
const loopEndInput = document.getElementById('loop-end-input');
const btnSetStart = document.getElementById('btn-set-start');
const btnSetEnd = document.getElementById('btn-set-end');

const speedSlider = document.getElementById('speed-slider');
const speedDisplay = document.getElementById('speed-display');
const presetButtons = document.querySelectorAll('.btn-preset');

const loopsInput = document.getElementById('loops-input');
const btnLoopsDec = document.getElementById('btn-loops-dec');
const btnLoopsInc = document.getElementById('btn-loops-inc');
const loopInfiniteChk = document.getElementById('loop-infinite-chk');
const countdownSelect = document.getElementById('countdown-select');
const pauseSlider = document.getElementById('pause-slider');
const pauseDisplay = document.getElementById('pause-display');

const btnStartRoutine = document.getElementById('btn-start-routine');
const btnStopRoutine = document.getElementById('btn-stop-routine');

const routineProgressCard = document.getElementById('routine-progress-card');
const progressCircle = document.getElementById('progress-circle');
const currentLoopNum = document.getElementById('current-loop-num');
const totalLoopsNum = document.getElementById('total-loops-num');
const statusSpeed = document.getElementById('status-speed');
const statusInterval = document.getElementById('status-interval');
const btnNudgeDown = document.getElementById('btn-nudge-down');
const btnNudgeUp = document.getElementById('btn-nudge-up');

const notesTextarea = document.getElementById('notes-textarea');
const saveStatus = document.getElementById('save-status');
const routineSaveStatus = document.getElementById('routine-save-status');
const presetNameInput = document.getElementById('preset-name-input');
const btnSavePreset = document.getElementById('btn-save-preset');

const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeModal = document.getElementById('close-modal');
const btnCloseHelp = document.getElementById('btn-close-help');

const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const countdownSongInfo = document.getElementById('countdown-song-info');

const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// ----------------------------------------------------
// Web Audio Synthesizer Class (Ticks & Completion)
// ----------------------------------------------------
function PracticeSynth() {
  this.ctx = null;
}

PracticeSynth.prototype.init = function() {
  if (!this.ctx) {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (this.ctx.state === 'suspended') {
    this.ctx.resume();
  }
};

PracticeSynth.prototype.playTick = function(frequency, duration) {
  try {
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(frequency || 800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  } catch (e) {
    console.error("Erro ao emitir som de bipe:", e);
  }
};

PracticeSynth.prototype.playSuccess = function() {
  try {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    // Arpeggio de Dó Maior (C4 -> E4 -> G4 -> C5)
    const notes = [261.63, 329.63, 392.00, 523.25];
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.frequency.setValueAtTime(freq, now + index * 0.12);
      
      gain.gain.setValueAtTime(0.0, now + index * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + index * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + index * 0.12 + 0.45);
      
      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 0.5);
    });
  } catch (e) {
    console.error("Erro ao tocar som de sucesso:", e);
  }
};

// ----------------------------------------------------
// Formatting & Helpers
// ----------------------------------------------------
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null) return "00:00.0";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  
  const minStr = String(mins).padStart(2, '0');
  const secStr = String(secs).padStart(2, '0');
  return `${minStr}:${secStr}.${tenths}`;
}

function parseTime(timeStr) {
  if (!timeStr) return 0;
  
  // MM:SS.t or MM:SS or SS.t or SS
  const parts = timeStr.trim().split(':');
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  } else if (parts.length === 1) {
    return parseFloat(parts[0]) || 0;
  }
  return 0;
}

// ----------------------------------------------------
// Wavesurfer Initialization
// ----------------------------------------------------
function initWavesurfer(audioUrl) {
  // Clear any existing instances
  if (ws) {
    ws.destroy();
  }
  
  document.getElementById('waveform-loading').classList.remove('hidden');

  ws = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#475569',
    progressColor: '#f59e0b',
    cursorColor: '#fbbf24',
    cursorWidth: 2,
    height: 128,
    normalize: true,
    barWidth: 2,
    barGap: 1,
    minPxPerSec: 50,
    fillParent: true
  });

  // Timeline registration
  wsTimeline = ws.registerPlugin(WaveSurfer.Timeline.create({
    container: '#timeline',
    insertPosition: 'beforebegin',
    style: {
      color: '#94a3b8',
      fontSize: '10px',
      fontFamily: 'JetBrains Mono'
    }
  }));

  // Regions registration
  wsRegions = ws.registerPlugin(WaveSurfer.Regions.create());

  // Load track
  ws.load(audioUrl);

  // Events
  ws.on('ready', () => {
    document.getElementById('waveform-loading').classList.add('hidden');
    
    const duration = ws.getDuration();
    timeTotal.textContent = formatTime(duration);
    
    // Sync zoom level
    ws.zoom(parseFloat(zoomSlider.value));
    
    // Restore routine settings or set default loop coordinates
    loadRoutineSettings();
    
    // Apply current settings
    ws.setVolume(parseFloat(volumeSlider.value) / 100);
    
    // Auto-load saved notes
    loadNotes();

    // Auto-load saved presets
    renderPresets();
  });

  ws.on('timeupdate', (currentTime) => {
    timeCurrent.textContent = formatTime(currentTime);
    
    // Loop control
    if (isPlayingRoutine && !isPausedBetweenLoops) {
      // Check if past loopEnd
      if (currentTime >= loopEnd) {
        handleLoopCycle();
      }
      
      // Update active routine progress bar
      updateActiveRoutineProgress(currentTime);
    } else {
      // Normal playback looping (wavesurfer native behavior if loop clicked or custom manual loop)
      if (ws.isPlaying() && currentTime >= loopEnd) {
        ws.setTime(loopStart);
      }
    }
  });

  ws.on('play', () => {
    playIcon.setAttribute('data-lucide', 'pause');
    lucide.createIcons();
    playingBadge.innerHTML = '<span class="pulse-dot"></span> Reproduzindo';
  });

  ws.on('pause', () => {
    playIcon.setAttribute('data-lucide', 'play');
    lucide.createIcons();
    playingBadge.innerHTML = 'Pausado';
  });

  // Drag and drop event listeners on region
  wsRegions.on('region-updated', (region) => {
    if (region.id === 'loop-region') {
      loopStart = region.start;
      loopEnd = region.end;
      updateLoopInputs();
      
      // If loop progress display is open, update intervals
      if (isPlayingRoutine) {
        statusInterval.textContent = `${formatTime(loopStart).split('.')[0]} - ${formatTime(loopEnd).split('.')[0]}`;
      }
      saveRoutineSettings();
    }
  });
}

function createLoopRegion(start, end) {
  if (!wsRegions) return;
  
  wsRegions.clearRegions();
  
  activeRegion = wsRegions.addRegion({
    id: 'loop-region',
    start: start,
    end: end,
    color: 'rgba(245, 158, 11, 0.15)',
    drag: true,
    resize: true
  });
}

function updateLoopInputs() {
  loopStartInput.value = formatTime(loopStart);
  loopEndInput.value = formatTime(loopEnd);
}

function updatePlaybackSpeed() {
  if (!ws) return;
  const speed = parseFloat(speedSlider.value) / 100;
  ws.setPlaybackRate(speed);
  speedDisplay.textContent = `${speedSlider.value}%`;
  
  if (isPlayingRoutine) {
    statusSpeed.textContent = `${speedSlider.value}%`;
  }
}

// ----------------------------------------------------
// UI Logic & Playlist management
// ----------------------------------------------------
function renderTrackList() {
  trackListContainer.innerHTML = '';
  
  trackLibrary.forEach((track, index) => {
    const item = document.createElement('div');
    item.className = `track-item ${index === currentTrackIndex ? 'active' : ''}`;
    
    item.innerHTML = `
      <div class="track-icon-wrapper">
        <i data-lucide="${index === currentTrackIndex ? 'play' : 'music'}"></i>
      </div>
      <div class="track-details">
        <span class="track-item-name" title="${track.name}">${track.name}</span>        
      </div>
    `;
    
    // Clicking the item loads the song
    item.addEventListener('click', () => {
      selectTrack(index);
    });
    
    trackListContainer.appendChild(item);
  });
  
  lucide.createIcons();
}

function selectTrack(index) {
  if (isPlayingRoutine) {
    if (!confirm("Uma rotina de treino está ativa. Deseja parar o treino e mudar de música?")) {
      return;
    }
    stopRoutine(false);
  }
  
  currentTrackIndex = index;
  const track = trackLibrary[currentTrackIndex];
  
  currentTrackTitle.textContent = track.name;
  initWavesurfer(track.url);
  renderTrackList();
}

// ----------------------------------------------------
// Routine practice core loop
// ----------------------------------------------------
let countdownTimeout = null;
let isPausedBetweenLoops = false;

function startPracticeRoutine() {
  if (!ws) return;
  
  // Trigger audio context activation on first click
  synth.init();
  
  // Parse configs
  loopInfinite = loopInfiniteChk.checked;
  maxLoops = parseInt(loopsInput.value) || 10;
  
  const rawStart = parseTime(loopStartInput.value);
  const rawEnd = parseTime(loopEndInput.value);
  const duration = ws.getDuration();
  
  // Validate times
  if (rawStart >= rawEnd) {
    showToast("O tempo de início deve ser menor que o fim.", "error");
    return;
  }
  
  if (rawStart < 0 || rawEnd > duration) {
    showToast("Tempos fora do limite da música.", "error");
    return;
  }
  
  loopStart = rawStart;
  loopEnd = rawEnd;
  
  // Create / lock loop region visually
  createLoopRegion(loopStart, loopEnd);
  
  // Speed Setup
  updatePlaybackSpeed();
  
  // Setup Routine Progress UI
  currentLoopCount = 1;
  isPlayingRoutine = true;
  isPausedBetweenLoops = false;
  
  updateRoutineUI();
  routineProgressCard.classList.remove('hidden');
  
  btnStartRoutine.classList.add('hidden');
  btnStopRoutine.classList.remove('hidden');
  
  // Stop any active play
  ws.pause();
  
  // Countdown Config
  const countdownTime = parseInt(countdownSelect.value) || 0;
  if (countdownTime > 0) {
    // Show countdown overlay
    countdownOverlay.classList.remove('hidden');
    countdownSongInfo.textContent = trackLibrary[currentTrackIndex].name;
    
    runCountdown(countdownTime, 
      (count) => {
        countdownNumber.textContent = count;
      },
      () => {
        countdownOverlay.classList.add('hidden');
        if (isPlayingRoutine) {
          ws.setTime(loopStart);
          ws.play();
        }
      }
    );
  } else {
    ws.setTime(loopStart);
    ws.play();
  }
}

let countdownInterval = null;
function runCountdown(seconds, onTick, onComplete) {
  let remaining = seconds;
  onTick(remaining);
  synth.playTick(700, 0.08); // Initial countdown tick sound

  countdownInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      onTick(remaining);
      synth.playTick(700, 0.08);
    } else if (remaining === 0) {
      onTick("VAI!");
      synth.playTick(1200, 0.2); // Beep high frequency for start
    } else {
      clearInterval(countdownInterval);
      onComplete();
    }
  }, 1000);
}

function cancelCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  countdownOverlay.classList.add('hidden');
}

function handleLoopCycle() {
  if (!isPlayingRoutine) return;
  
  ws.pause();
  
  if (loopInfinite) {
    currentLoopCount++;
    triggerNextLoopCycle();
  } else {
    if (currentLoopCount >= maxLoops) {
      completeRoutine();
    } else {
      currentLoopCount++;
      triggerNextLoopCycle();
    }
  }
}

function triggerNextLoopCycle() {
  updateRoutineUI();
  
  const pauseTime = parseFloat(pauseSlider.value) || 0;
  if (pauseTime > 0) {
    isPausedBetweenLoops = true;
    let remainingPause = pauseTime;
    
    const routineBadge = document.getElementById('routine-badge');
    routineBadge.textContent = `Pausa: ${remainingPause.toFixed(1)}s`;
    routineBadge.className = 'badge badge-accent';
    
    // Metronome tick sounds or simple ticking during rest
    const pauseTickTimer = setInterval(() => {
      remainingPause -= 0.1;
      if (remainingPause <= 0) {
        clearInterval(pauseTickTimer);
        isPausedBetweenLoops = false;
        routineBadge.textContent = 'Looping';
        routineBadge.className = 'badge badge-accent';
        
        if (isPlayingRoutine) {
          ws.setTime(loopStart);
          ws.play();
        }
      } else {
        routineBadge.textContent = `Pausa: ${remainingPause.toFixed(1)}s`;
        // Sound a small click/beep every second during rest
        if (Math.abs(remainingPause - Math.round(remainingPause)) < 0.05 && remainingPause >= 1) {
          synth.playTick(500, 0.04);
        }
      }
    }, 100);
  } else {
    ws.setTime(loopStart);
    ws.play();
  }
}

function updateRoutineUI() {
  currentLoopNum.textContent = currentLoopCount;
  totalLoopsNum.textContent = loopInfinite ? "∞" : maxLoops;
  
  statusSpeed.textContent = `${speedSlider.value}%`;
  statusInterval.textContent = `${formatTime(loopStart).split('.')[0]} - ${formatTime(loopEnd).split('.')[0]}`;
  
  // Progress Circle visual update
  const pct = loopInfinite ? 0 : ((currentLoopCount - 1) / maxLoops) * 100;
  progressCircle.style.background = `radial-gradient(closest-side, var(--bg-surface) 79%, transparent 80% 100%), conic-gradient(var(--accent) ${pct}%, rgba(30, 41, 59, 0.6) 0%)`;
}

function updateActiveRoutineProgress(currentTime) {
  // Update progress circle slice during the current loop duration
  const totalInLoop = loopEnd - loopStart;
  const elapsedInLoop = Math.max(0, currentTime - loopStart);
  const currentPercentage = totalInLoop > 0 ? (elapsedInLoop / totalInLoop) : 0;
  
  let totalPct = 0;
  if (!loopInfinite) {
    const loopsPct = ((currentLoopCount - 1) / maxLoops) * 100;
    const progressInCurrentLoopPct = (currentPercentage * 100) / maxLoops;
    totalPct = Math.min(100, loopsPct + progressInCurrentLoopPct);
  } else {
    // For infinite loops, represent progress of current loop cycle
    totalPct = currentPercentage * 100;
  }
  
  progressCircle.style.background = `radial-gradient(closest-side, var(--bg-surface) 79%, transparent 80% 100%), conic-gradient(var(--accent) ${totalPct}%, rgba(30, 41, 59, 0.6) 0%)`;
}

function completeRoutine() {
  synth.playSuccess();
  savePracticeSession();
  stopRoutine(true);
}

function stopRoutine(completed = false) {
  isPlayingRoutine = false;
  isPausedBetweenLoops = false;
  cancelCountdown();
  
  routineProgressCard.classList.add('hidden');
  btnStartRoutine.classList.remove('hidden');
  btnStopRoutine.classList.add('hidden');
  
  ws.pause();
  
  if (completed) {
    showToast(`Parabéns! Treino completo: ${maxLoops} repetições a ${speedSlider.value}% da velocidade.`, "success");
  } else {
    showToast("Treino interrompido.", "info");
  }
}

// ----------------------------------------------------
// Toast Notification
// ----------------------------------------------------
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate-fade-in`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  lucide.createIcons();
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ----------------------------------------------------
// Training Presets Management
// ----------------------------------------------------
function getPresets() {
  const track = trackLibrary[currentTrackIndex];
  if (!track) return [];
  const raw = localStorage.getItem(`guitar_practice_presets_${track.id}`);
  return raw ? JSON.parse(raw) : [];
}

function savePresets(presets) {
  const track = trackLibrary[currentTrackIndex];
  if (!track) return;
  localStorage.setItem(`guitar_practice_presets_${track.id}`, JSON.stringify(presets));
}

function renderPresets() {
  const presets = getPresets();
  const listContainer = document.getElementById('presets-list');
  if (!listContainer) return;
  
  if (presets.length === 0) {
    listContainer.innerHTML = `<p class="empty-state">Nenhum preset salvo para esta música.</p>`;
    return;
  }
  
  listContainer.innerHTML = '';
  presets.forEach(preset => {
    const item = document.createElement('div');
    item.className = 'preset-item animate-fade-in';
    
    const isInfinite = preset.infinite;
    const loopsText = isInfinite ? "∞" : `${preset.loops}x`;
    const speedText = `${preset.speed}%`;
    const timeText = `${formatTime(preset.loopStart).split('.')[0]} - ${formatTime(preset.loopEnd).split('.')[0]}`;
    
    item.innerHTML = `
      <div class="preset-info">
        <span class="preset-name" title="${preset.name}">${preset.name}</span>
        <div class="preset-meta">
          <span class="preset-meta-item"><i data-lucide="repeat" class="inline-icon" style="width:10px; height:10px;"></i> ${loopsText}</span>
          <span class="preset-meta-item"><i data-lucide="gauge" class="inline-icon" style="width:10px; height:10px;"></i> ${speedText}</span>
          <span class="preset-meta-item"><i data-lucide="clock" class="inline-icon" style="width:10px; height:10px;"></i> ${timeText}</span>
        </div>
      </div>
      <button class="btn-delete-preset" title="Excluir preset" data-id="${preset.id}">
        <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
      </button>
    `;
    
    // Load preset click event
    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-preset')) return;
      loadPreset(preset);
    });
    
    // Delete preset click event
    const btnDelete = item.querySelector('.btn-delete-preset');
    btnDelete.addEventListener('click', () => {
      deletePreset(preset.id);
    });
    
    listContainer.appendChild(item);
  });
  
  lucide.createIcons();
}

function loadPreset(preset) {
  if (isPlayingRoutine) {
    if (!confirm("Uma rotina de treino está ativa. Deseja parar o treino e carregar o preset?")) {
      return;
    }
    stopRoutine(false);
  }
  
  loopStart = preset.loopStart;
  loopEnd = preset.loopEnd;
  
  loopStartInput.value = formatTime(loopStart);
  loopEndInput.value = formatTime(loopEnd);
  
  speedSlider.value = preset.speed;
  speedDisplay.textContent = `${preset.speed}%`;
  updatePlaybackSpeed();
  
  presetButtons.forEach(btn => {
    const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
    if (Math.round(btnSpeed * 100) === parseInt(speedSlider.value)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  loopsInput.value = preset.loops;
  loopInfiniteChk.checked = !!preset.infinite;
  
  // Update UI for infinite loop
  loopsInput.disabled = loopInfiniteChk.checked;
  btnLoopsDec.disabled = loopInfiniteChk.checked;
  btnLoopsInc.disabled = loopInfiniteChk.checked;
  const opacity = loopInfiniteChk.checked ? '0.5' : '1';
  loopsInput.style.opacity = opacity;
  btnLoopsDec.style.opacity = opacity;
  btnLoopsInc.style.opacity = opacity;
  
  countdownSelect.value = preset.countdown !== undefined ? preset.countdown : "3";
  
  pauseSlider.value = preset.pause !== undefined ? preset.pause : 0;
  pauseDisplay.textContent = `${pauseSlider.value}s`;
  
  createLoopRegion(loopStart, loopEnd);
  
  if (ws) {
    ws.setTime(loopStart);
  }
  
  showToast(`Preset "${preset.name}" carregado!`, "success");
  saveRoutineSettings();
}

function deletePreset(id) {
  let presets = getPresets();
  presets = presets.filter(p => p.id !== id);
  savePresets(presets);
  renderPresets();
  showToast("Preset excluído", "info");
}

// Event listener for saving preset
if (btnSavePreset) {
  btnSavePreset.addEventListener('click', () => {
    const name = presetNameInput.value.trim();
    if (!name) {
      showToast("Por favor, digite um nome para o preset.", "error");
      return;
    }
    
    const presets = getPresets();
    const newPreset = {
      id: 'preset_' + Date.now(),
      name: name,
      loopStart: loopStart,
      loopEnd: loopEnd,
      speed: parseInt(speedSlider.value) || 100,
      loops: parseInt(loopsInput.value) || 10,
      infinite: loopInfiniteChk.checked,
      countdown: countdownSelect.value,
      pause: parseFloat(pauseSlider.value) || 0
    };
    
    presets.push(newPreset);
    savePresets(presets);
    presetNameInput.value = '';
    renderPresets();
    showToast(`Preset "${name}" salvo com sucesso!`, "success");
  });
}

// ----------------------------------------------------
// LocalStorage (Notes, History)
// ----------------------------------------------------
function getTrackNotesKey() {
  const track = trackLibrary[currentTrackIndex];
  return `guitar_practice_notes_${track.id}`;
}

function loadNotes() {
  const key = getTrackNotesKey();
  const saved = localStorage.getItem(key);
  notesTextarea.value = saved || "";
  saveStatus.textContent = "Anotações carregadas";
}

let notesTimeout = null;
notesTextarea.addEventListener('input', () => {
  saveStatus.textContent = "Digitando...";
  
  if (notesTimeout) clearTimeout(notesTimeout);
  notesTimeout = setTimeout(() => {
    const key = getTrackNotesKey();
    localStorage.setItem(key, notesTextarea.value);
    saveStatus.textContent = "Salvo automaticamente";
  }, 1000);
});

// Routine Settings Auto-save & Auto-load
let routineSaveTimeout = null;
function saveRoutineSettings() {
  const track = trackLibrary[currentTrackIndex];
  if (!track) return;
  
  if (routineSaveStatus) {
    routineSaveStatus.textContent = "Salvando...";
  }

  if (routineSaveTimeout) clearTimeout(routineSaveTimeout);
  
  routineSaveTimeout = setTimeout(() => {
    const settings = {
      loopStart: loopStart,
      loopEnd: loopEnd,
      speed: speedSlider.value,
      loops: loopsInput.value,
      infinite: loopInfiniteChk.checked,
      countdown: countdownSelect.value,
      pause: pauseSlider.value
    };
    
    localStorage.setItem(`guitar_practice_routine_${track.id}`, JSON.stringify(settings));
    if (routineSaveStatus) {
      routineSaveStatus.textContent = "Salvo automaticamente";
    }
  }, 800);
}

function loadRoutineSettings() {
  const track = trackLibrary[currentTrackIndex];
  if (!track) return;
  
  const raw = localStorage.getItem(`guitar_practice_routine_${track.id}`);
  if (raw) {
    try {
      const settings = JSON.parse(raw);
      
      loopStart = parseFloat(settings.loopStart) || 0;
      const duration = ws.getDuration();
      loopEnd = Math.min(parseFloat(settings.loopEnd) || duration, duration);
      
      loopStartInput.value = formatTime(loopStart);
      loopEndInput.value = formatTime(loopEnd);
      
      speedSlider.value = settings.speed || 100;
      speedDisplay.textContent = `${speedSlider.value}%`;
      updatePlaybackSpeed();
      
      presetButtons.forEach(btn => {
        const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
        if (Math.round(btnSpeed * 100) === parseInt(speedSlider.value)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      loopsInput.value = settings.loops || 10;
      loopInfiniteChk.checked = !!settings.infinite;
      
      // Update UI for infinite loop
      loopsInput.disabled = loopInfiniteChk.checked;
      btnLoopsDec.disabled = loopInfiniteChk.checked;
      btnLoopsInc.disabled = loopInfiniteChk.checked;
      const opacity = loopInfiniteChk.checked ? '0.5' : '1';
      loopsInput.style.opacity = opacity;
      btnLoopsDec.style.opacity = opacity;
      btnLoopsInc.style.opacity = opacity;
      
      countdownSelect.value = settings.countdown !== undefined ? settings.countdown : "3";
      
      pauseSlider.value = settings.pause !== undefined ? settings.pause : 0;
      pauseDisplay.textContent = `${pauseSlider.value}s`;
      
      createLoopRegion(loopStart, loopEnd);
      
      if (routineSaveStatus) {
        routineSaveStatus.textContent = "Salvo automaticamente";
      }
    } catch (e) {
      console.error("Erro ao carregar configurações salvas:", e);
    }
  } else {
    // Defaults if no settings
    const duration = ws.getDuration();
    loopStart = 0;
    loopEnd = Math.min(47, duration);
    createLoopRegion(loopStart, loopEnd);
    updateLoopInputs();
    
    speedSlider.value = 100;
    speedDisplay.textContent = "100%";
    updatePlaybackSpeed();
    presetButtons.forEach(btn => {
      if (btn.getAttribute('data-speed') === '1.0') btn.classList.add('active');
      else btn.classList.remove('active');
    });
    
    loopsInput.value = 10;
    loopInfiniteChk.checked = false;
    loopsInput.disabled = false;
    btnLoopsDec.disabled = false;
    btnLoopsInc.disabled = false;
    loopsInput.style.opacity = '1';
    btnLoopsDec.style.opacity = '1';
    btnLoopsInc.style.opacity = '1';
    
    countdownSelect.value = "3";
    pauseSlider.value = 0;
    pauseDisplay.textContent = "0s";
    
    if (routineSaveStatus) {
      routineSaveStatus.textContent = "Padrão carregado";
    }
  }
}

// Practice History Management
function savePracticeSession() {
  const track = trackLibrary[currentTrackIndex];
  const history = getHistory();
  
  const newEntry = {
    songName: track.name,
    loops: loopInfinite ? "Infinitas" : maxLoops,
    speed: speedSlider.value,
    timestamp: Date.now()
  };
  
  history.unshift(newEntry);
  // Keep last 30 entries
  if (history.length > 30) history.pop();
  
  localStorage.setItem('guitar_practice_history', JSON.stringify(history));
  renderHistory();
}

function getHistory() {
  const raw = localStorage.getItem('guitar_practice_history');
  return raw ? JSON.parse(raw) : [];
}

function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    historyList.innerHTML = `<p class="empty-state">Nenhum treino registrado hoje. Comece a praticar!</p>`;
    clearHistoryBtn.classList.add('hidden');
    return;
  }
  
  clearHistoryBtn.classList.remove('hidden');
  historyList.innerHTML = '';
  
  history.forEach(entry => {
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    
    const card = document.createElement('div');
    card.className = 'history-item';
    card.innerHTML = `
      <div class="history-header">
        <span class="track-item-name" style="width:140px; font-weight:600;">${entry.songName}</span>
        <span class="history-date">${dateStr}</span>
      </div>
      <div class="history-meta">
        <span><i data-lucide="repeat" class="inline-icon" style="width:10px;"></i> ${entry.loops}x</span>
        <span><i data-lucide="gauge" class="inline-icon" style="width:10px;"></i> ${entry.speed}%</span>
      </div>
    `;
    historyList.appendChild(card);
  });
  
  lucide.createIcons();
}

clearHistoryBtn.addEventListener('click', () => {
  if (confirm("Tem certeza que deseja apagar todo seu histórico de treino?")) {
    localStorage.removeItem('guitar_practice_history');
    renderHistory();
    showToast("Histórico limpo", "info");
  }
});

// ----------------------------------------------------
// Event Listeners (Audio control, speeds, loops)
// ----------------------------------------------------
btnPlayPause.addEventListener('click', () => {
  if (!ws) return;
  
  // First play interaction - activate synth context in case browser is blocking
  synth.init();
  
  if (ws.isPlaying()) {
    ws.pause();
  } else {
    ws.play();
  }
});

btnStop.addEventListener('click', () => {
  if (!ws) return;
  ws.pause();
  ws.setTime(loopStart);
});

btnBackward.addEventListener('click', () => {
  if (!ws) return;
  const current = ws.getCurrentTime();
  ws.setTime(Math.max(0, current - 5));
});

btnForward.addEventListener('click', () => {
  if (!ws) return;
  const current = ws.getCurrentTime();
  ws.setTime(Math.min(ws.getDuration(), current + 5));
});

btnMute.addEventListener('click', () => {
  if (!ws) return;
  const isMuted = ws.getMuted();
  ws.setMuted(!isMuted);
  
  if (!isMuted) {
    volumeIcon.setAttribute('data-lucide', 'volume-x');
  } else {
    // Restore appropriate icon based on volume slider
    const val = parseFloat(volumeSlider.value);
    if (val === 0) volumeIcon.setAttribute('data-lucide', 'volume');
    else if (val < 50) volumeIcon.setAttribute('data-lucide', 'volume-1');
    else volumeIcon.setAttribute('data-lucide', 'volume-2');
  }
  lucide.createIcons();
});

volumeSlider.addEventListener('input', () => {
  if (!ws) return;
  const val = parseFloat(volumeSlider.value) / 100;
  ws.setVolume(val);
  ws.setMuted(false);
  
  if (val === 0) {
    volumeIcon.setAttribute('data-lucide', 'volume-x');
  } else if (val < 0.5) {
    volumeIcon.setAttribute('data-lucide', 'volume-1');
  } else {
    volumeIcon.setAttribute('data-lucide', 'volume-2');
  }
  lucide.createIcons();
});

zoomSlider.addEventListener('input', () => {
  if (!ws) return;
  ws.zoom(parseFloat(zoomSlider.value));
});

// Loop Intervals Setter Pins
btnSetStart.addEventListener('click', () => {
  if (!ws) return;
  const current = ws.getCurrentTime();
  if (current < loopEnd) {
    loopStart = current;
    createLoopRegion(loopStart, loopEnd);
    updateLoopInputs();
    showToast(`Início do loop definido para ${formatTime(loopStart)}`, "info");
    saveRoutineSettings();
  } else {
    showToast("O início do loop não pode ser posterior ao fim.", "error");
  }
});

btnSetEnd.addEventListener('click', () => {
  if (!ws) return;
  const current = ws.getCurrentTime();
  if (current > loopStart) {
    loopEnd = current;
    createLoopRegion(loopStart, loopEnd);
    updateLoopInputs();
    showToast(`Fim do loop definido para ${formatTime(loopEnd)}`, "info");
    saveRoutineSettings();
  } else {
    showToast("O fim do loop não pode ser anterior ao início.", "error");
  }
});

// Speed Inputs
speedSlider.addEventListener('input', () => {
  updatePlaybackSpeed();
  saveRoutineSettings();
});

presetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    presetButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const speed = parseFloat(btn.getAttribute('data-speed'));
    speedSlider.value = Math.round(speed * 100);
    updatePlaybackSpeed();
    saveRoutineSettings();
  });
});

// Repetitions inputs Spinner
btnLoopsDec.addEventListener('click', () => {
  const val = Math.max(1, parseInt(loopsInput.value) - 1);
  loopsInput.value = val;
  saveRoutineSettings();
});

btnLoopsInc.addEventListener('click', () => {
  const val = parseInt(loopsInput.value) + 1;
  loopsInput.value = val;
  saveRoutineSettings();
});

loopsInput.addEventListener('change', () => {
  let val = parseInt(loopsInput.value) || 10;
  if (val < 1) val = 1;
  loopsInput.value = val;
  saveRoutineSettings();
});

loopInfiniteChk.addEventListener('change', () => {
  const isInfinite = loopInfiniteChk.checked;
  loopsInput.disabled = isInfinite;
  btnLoopsDec.disabled = isInfinite;
  btnLoopsInc.disabled = isInfinite;
  
  if (isInfinite) {
    loopsInput.style.opacity = '0.5';
    btnLoopsDec.style.opacity = '0.5';
    btnLoopsInc.style.opacity = '0.5';
  } else {
    loopsInput.style.opacity = '1';
    btnLoopsDec.style.opacity = '1';
    btnLoopsInc.style.opacity = '1';
  }
  saveRoutineSettings();
});

countdownSelect.addEventListener('change', () => {
  saveRoutineSettings();
});

// Pause displays
pauseSlider.addEventListener('input', () => {
  pauseDisplay.textContent = `${pauseSlider.value}s`;
  saveRoutineSettings();
});

// Manual Interval edits
loopStartInput.addEventListener('change', () => {
  const secs = parseTime(loopStartInput.value);
  const duration = ws ? ws.getDuration() : 9999;
  if (secs >= 0 && secs < loopEnd) {
    loopStart = secs;
    createLoopRegion(loopStart, loopEnd);
    updateLoopInputs();
    saveRoutineSettings();
  } else {
    showToast("Início inválido.", "error");
    updateLoopInputs();
  }
});

loopEndInput.addEventListener('change', () => {
  const secs = parseTime(loopEndInput.value);
  const duration = ws ? ws.getDuration() : 9999;
  if (secs > loopStart && secs <= duration) {
    loopEnd = secs;
    createLoopRegion(loopStart, loopEnd);
    updateLoopInputs();
    saveRoutineSettings();
  } else {
    showToast("Fim inválido.", "error");
    updateLoopInputs();
  }
});

// Practice Actions
btnStartRoutine.addEventListener('click', startPracticeRoutine);
btnStopRoutine.addEventListener('click', () => stopRoutine(false));

// Live speed adjusting nudges during training
btnNudgeDown.addEventListener('click', () => {
  let val = parseInt(speedSlider.value) - 5;
  if (val < 50) val = 50;
  speedSlider.value = val;
  updatePlaybackSpeed();
  
  // Update presets visual
  presetButtons.forEach(b => b.classList.remove('active'));
  saveRoutineSettings();
});

btnNudgeUp.addEventListener('click', () => {
  let val = parseInt(speedSlider.value) + 5;
  if (val > 150) val = 150;
  speedSlider.value = val;
  updatePlaybackSpeed();
  
  // Update presets visual
  presetButtons.forEach(b => b.classList.remove('active'));
  saveRoutineSettings();
});

// Help Modal controls
helpBtn.addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

btnCloseHelp.addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

helpModal.addEventListener('click', (e) => {
  if (e.target === helpModal) {
    helpModal.classList.add('hidden');
  }
});


// ----------------------------------------------------
// Global Keyboard Shortcuts
// ----------------------------------------------------
window.addEventListener('keydown', (e) => {
  // Ignore keys if typing in form inputs or textareas
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
    return;
  }
  
  if (e.code === 'Space') {
    e.preventDefault(); // Prevent page scroll
    btnPlayPause.click();
  }
  
  if (e.code === 'Escape') {
    if (isPlayingRoutine) {
      stopRoutine(false);
    }
  }
  
  if (e.code === 'KeyS') {
    btnSetStart.click();
  }
  
  if (e.code === 'KeyE') {
    btnSetEnd.click();
  }
});

// ----------------------------------------------------
// Startup / Initialization
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Load playlist and select first track
  renderTrackList();
  renderHistory();
  selectTrack(0);
  
  // Trigger Lucide Icons replace
  lucide.createIcons();
  
  // Initialise Audio Context silently on first user interaction
  document.addEventListener('click', () => synth.init(), { once: true });
});
