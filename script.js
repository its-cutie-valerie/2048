// ===== Sound System =====
const SoundManager = {
    audioContext: null,
    enabled: true,
    volume: 0.5,

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    },

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    // Generate a simple tone
    playTone(frequency, duration, type = 'square', volumeMod = 1) {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gain.gain.setValueAtTime(this.volume * volumeMod, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    },

    // Slide sound - quick whoosh
    slide() {
        if (!this.enabled) return;
        this.playTone(200, 0.08, 'sine', 0.3);
        setTimeout(() => this.playTone(150, 0.05, 'sine', 0.2), 30);
    },

    // Merge sound - satisfying pop with pitch based on tile value
    merge(value) {
        if (!this.enabled) return;
        const basePitch = 220 + Math.min(value, 2048) / 4;
        this.playTone(basePitch, 0.1, 'square', 0.4);
        setTimeout(() => this.playTone(basePitch * 1.5, 0.15, 'square', 0.3), 50);
    },

    // Big merge - epic fanfare for 128+
    bigMerge(value) {
        if (!this.enabled) return;
        const basePitch = 330 + Math.min(value, 2048) / 3;
        this.playTone(basePitch, 0.1, 'square', 0.5);
        setTimeout(() => this.playTone(basePitch * 1.25, 0.1, 'square', 0.4), 80);
        setTimeout(() => this.playTone(basePitch * 1.5, 0.2, 'sawtooth', 0.5), 160);
    },

    // Time bonus - ascending arpeggio
    timeBonus() {
        if (!this.enabled) return;
        this.playTone(523, 0.08, 'square', 0.3);
        setTimeout(() => this.playTone(659, 0.08, 'square', 0.3), 60);
        setTimeout(() => this.playTone(784, 0.12, 'square', 0.4), 120);
    },

    // Time penalty - descending sad
    timePenalty() {
        if (!this.enabled) return;
        this.playTone(300, 0.1, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(200, 0.15, 'sawtooth', 0.2), 100);
    },

    // Freeze - icy crystalline sound
    freeze() {
        if (!this.enabled) return;
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(800 + Math.random() * 400, 0.1, 'sine', 0.2);
            }, i * 50);
        }
    },

    // Good event - cheerful jingle
    goodEvent() {
        if (!this.enabled) return;
        this.playTone(523, 0.1, 'square', 0.3);
        setTimeout(() => this.playTone(659, 0.1, 'square', 0.3), 100);
        setTimeout(() => this.playTone(784, 0.1, 'square', 0.3), 200);
        setTimeout(() => this.playTone(1047, 0.2, 'square', 0.4), 300);
    },

    // Bad event - ominous
    badEvent() {
        if (!this.enabled) return;
        this.playTone(150, 0.2, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(100, 0.3, 'sawtooth', 0.3), 150);
    },

    // Game over - dramatic descend
    gameOver() {
        if (!this.enabled) return;
        this.playTone(440, 0.2, 'sawtooth', 0.5);
        setTimeout(() => this.playTone(349, 0.2, 'sawtooth', 0.4), 200);
        setTimeout(() => this.playTone(294, 0.2, 'sawtooth', 0.3), 400);
        setTimeout(() => this.playTone(196, 0.4, 'sawtooth', 0.4), 600);
    },

    // Button click
    click() {
        if (!this.enabled) return;
        this.playTone(600, 0.05, 'square', 0.2);
    },

    // Victory fanfare (for 2048)
    victory() {
        if (!this.enabled) return;
        const notes = [523, 523, 523, 698, 880, 784, 698, 880];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.15, 'square', 0.4), i * 120);
        });
    },

    // Combo sound
    combo(multiplier) {
        if (!this.enabled) return;
        const basePitch = 400 + multiplier * 100;
        this.playTone(basePitch, 0.08, 'square', 0.3);
        this.playTone(basePitch * 1.5, 0.08, 'square', 0.3);
    },

    // Rewind sound - VHS tape rewind effect
    rewind() {
        if (!this.enabled) return;
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.playTone(600 - i * 50, 0.06, 'sawtooth', 0.3);
            }, i * 50);
        }
    }
};

// ===== Background Music System =====
const MusicManager = {
    audioContext: null,
    isPlaying: false,
    isMuted: false, // Start unmuted by default
    volume: 0.15,
    intervalId: null,
    currentBeat: 0,

    // Simple retro melody pattern (note frequencies)
    melody: [262, 294, 330, 262, 330, 392, 330, 294, 262, 294, 330, 392, 440, 392, 330, 294],
    bass: [131, 131, 165, 165, 131, 131, 196, 165],

    init() {
        if (!this.audioContext) {
            this.audioContext = SoundManager.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.error("Audio resume failed", e));
        }
    },

    playNote(freq, duration, type, vol) {
        if (this.isMuted) return;

        // Ensure context matches SoundManager
        if (!this.audioContext && SoundManager.audioContext) {
            this.audioContext = SoundManager.audioContext;
        }

        if (!this.audioContext) return;

        // Try to resume if suspended (but don't block)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => { });
        }

        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.type = type;
            osc.frequency.value = freq;

            const now = this.audioContext.currentTime;
            gain.gain.setValueAtTime(vol * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            // Audio context error or blocked
        }
    },

    tick() {
        // Play melody note
        const melodyNote = this.melody[this.currentBeat % this.melody.length];
        this.playNote(melodyNote, 0.2, 'square', 0.4);

        // Play bass note (every 2 beats)
        if (this.currentBeat % 2 === 0) {
            const bassNote = this.bass[(this.currentBeat / 2) % this.bass.length];
            this.playNote(bassNote, 0.3, 'triangle', 0.6);
        }

        this.currentBeat++;
    },

    start() {
        if (this.isPlaying) return;
        this.init();
        this.isPlaying = true;
        this.currentBeat = 0;
        // 180 BPM = 333ms per beat
        this.intervalId = setInterval(() => this.tick(), 180);
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isPlaying = false;
    },

    toggle() {
        this.isMuted = !this.isMuted;
        return !this.isMuted;
    }
};

// Initialize sound on first user interaction
document.addEventListener('click', () => SoundManager.init(), { once: true });
document.addEventListener('keydown', () => SoundManager.init(), { once: true });

// ===== Game Configuration =====
const DIFFICULTIES = {
    easy: { startTime: 60000, maxTime: 90000, timeMultiplier: 1.5, badEventChance: 0.08, goodEventChance: 0.15, label: 'Baby Mode', rewindRechargeTime: 20000 },
    normal: { startTime: 45000, maxTime: 75000, timeMultiplier: 1.0, badEventChance: 0.12, goodEventChance: 0.12, label: 'Marine', rewindRechargeTime: 30000 },
    hard: { startTime: 30000, maxTime: 60000, timeMultiplier: 0.5, badEventChance: 0.18, goodEventChance: 0.08, label: 'Nightmare', rewindRechargeTime: 45000 }
};

const TIME_BONUSES = { 4: 200, 8: 350, 16: 500, 32: 750, 64: 1000, 128: 1500, 256: 2000, 512: 3000, 1024: 4500, 2048: 6000 };

// Cell size based on screen width - cached for performance
let CELL_SIZE = 100;
let CELL_GAP = 12;

function updateCellDimensions() {
    // Try to read actual dimensions from DOM
    const cell = document.querySelector('.grid-cell');
    const grid = document.querySelector('.grid');

    if (cell && grid) {
        CELL_SIZE = cell.offsetWidth;
        const style = window.getComputedStyle(grid);
        CELL_GAP = parseInt(style.gap) || parseInt(style.rowGap) || 12;
    } else {
        // Fallback based on screen width
        const width = window.innerWidth;
        if (width <= 380) {
            CELL_SIZE = 60;
            CELL_GAP = 6;
        } else if (width <= 520) {
            CELL_SIZE = 70;
            CELL_GAP = 8;
        } else {
            CELL_SIZE = 100;
            CELL_GAP = 12;
        }
    }
}

// Update on load and resize
updateCellDimensions();
window.addEventListener('resize', () => {
    updateCellDimensions();
    if (game.isPlaying) {
        renderTiles(); // Re-render tiles with new dimensions
    }
});

// Silly score comments - Doom style!
const SCORE_COMMENTS = {
    pathetic: ["PATHETIC!", "MY GRANDMA SCORES BETTER!", "IS THAT ALL YOU GOT?", "DISAPPOINTING...", "SKILL ISSUE DETECTED"],
    weak: ["NOT EVEN TRYING!", "WARMING UP?", "MEDIOCRE AT BEST", "YAWN...", "MY DOG COULD DO BETTER"],
    okay: ["GETTING SOMEWHERE!", "NOT BAD, SOLDIER", "ACCEPTABLE", "KEEP PUSHING!", "SHOW ME MORE!"],
    good: ["NOW WE'RE TALKING!", "RESPECTABLE!", "THAT'S THE SPIRIT!", "GROOVY!", "NICE MOVES!"],
    great: ["IMPRESSIVE!", "RIP AND MERGE!", "KNEE DEEP IN TILES!", "BRUTAL!", "DOMINATING!"],
    amazing: ["UNSTOPPABLE!", "GODLIKE!", "LUDICROUS!", "RAMPAGE!", "M-M-M-MONSTER MERGE!"],
    legendary: ["ABSOLUTELY MENTAL!", "YOU'RE A BEAST!", "LEGENDARY!", "INCONCEIVABLE!", "HAIL TO THE KING!"],
    godmode: ["IDDQD ACTIVATED!", "YOU CHEATING?!", "LITERALLY HOW?!", "ASCENDED!", "TOUCHED BY THE TILE GODS!"]
};

// Silly merge messages
const MERGE_QUIPS = [
    "NICE!", "BOOM!", "GET REKT!", "EZ!", "CALCULATED!",
    "OVERKILL!", "FATALITY!", "COMBO!", "SLICK!", "SMOOTH!",
    "NOICE!", "BIG BRAIN!", "200 IQ!", "TACTICAL!", "YEET!"
];

const EVENTS = {
    good: [
        { type: 'bonus_time', name: '<i class="fa-solid fa-clock"></i> SOUL SPHERE!', desc: '+5 seconds, mortal!', effect: (g) => { g.addTime(5000); showScreenEffect('time-bonus-effect'); } },
        { type: 'clear_bombs', name: '<i class="fa-solid fa-fire-extinguisher"></i> BFG DEPLOYED!', desc: 'All demons defused!', effect: (g) => { g.clearBombs(); showScreenEffect('time-bonus-effect'); } },
        { type: 'unfreeze', name: '<i class="fa-solid fa-fire"></i> RIP AND THAW!', desc: 'Tiles are angry again!', effect: (g) => { g.unfreezeAll(); showScreenEffect('time-bonus-effect'); } },
        { type: 'bonus_tile', name: '<i class="fa-solid fa-star"></i> POWER-UP!', desc: 'A blessed tile descends!', effect: (g) => { g.addBonusTile(); } },
        { type: 'score_boost', name: '<i class="fa-solid fa-coins"></i> SECRET FOUND!', desc: '+500 points! Very sneaky!', effect: (g) => { g.score += 500; g.updateScore(); showScorePopup(500); showScreenEffect('time-bonus-effect'); } }
    ],
    bad: [
        { type: 'time_drain', name: '<i class="fa-solid fa-hourglass-half"></i> TIME VAMPIRE!', desc: '-3 seconds sucked away!', effect: (g) => { g.addTime(-3000); showScreenEffect('time-drain-effect'); } },
        { type: 'bomb', name: '<i class="fa-solid fa-bomb"></i> DEMON BOMB!', desc: 'Something evil appeared...', effect: (g) => { g.addBombTile(); } },
        { type: 'freeze', name: '<i class="fa-solid fa-snowflake"></i> ICE DEMON!', desc: 'A tile has been cursed!', effect: (g) => { g.freezeRandomTile(); showScreenEffect('freeze-effect'); } },
        { type: 'shuffle', name: '<i class="fa-solid fa-shuffle"></i> CHAOS MAGIC!', desc: 'Reality is scrambled!', effect: (g) => { g.shuffleTiles(); showScreenEffect('shuffle-effect'); } },
        { type: 'spawn_low', name: '<i class="fa-solid fa-rotate-left"></i> DEMONIC RESET!', desc: 'A tile got possessed!', effect: (g) => { g.resetRandomTile(); showScreenEffect('time-drain-effect'); } }
    ]
};

// Get score comment based on score
function getScoreComment(score) {
    if (score < 500) return SCORE_COMMENTS.pathetic[Math.floor(Math.random() * SCORE_COMMENTS.pathetic.length)];
    if (score < 1500) return SCORE_COMMENTS.weak[Math.floor(Math.random() * SCORE_COMMENTS.weak.length)];
    if (score < 3000) return SCORE_COMMENTS.okay[Math.floor(Math.random() * SCORE_COMMENTS.okay.length)];
    if (score < 6000) return SCORE_COMMENTS.good[Math.floor(Math.random() * SCORE_COMMENTS.good.length)];
    if (score < 12000) return SCORE_COMMENTS.great[Math.floor(Math.random() * SCORE_COMMENTS.great.length)];
    if (score < 25000) return SCORE_COMMENTS.amazing[Math.floor(Math.random() * SCORE_COMMENTS.amazing.length)];
    if (score < 50000) return SCORE_COMMENTS.legendary[Math.floor(Math.random() * SCORE_COMMENTS.legendary.length)];
    return SCORE_COMMENTS.godmode[Math.floor(Math.random() * SCORE_COMMENTS.godmode.length)];
}

// Get random merge quip
function getRandomQuip() {
    return MERGE_QUIPS[Math.floor(Math.random() * MERGE_QUIPS.length)];
}


// ===== Tile Class for Animation =====
class Tile {
    constructor(row, col, value) {
        this.row = row;
        this.col = col;
        this.value = value;
        this.prevRow = row;
        this.prevCol = col;
        this.isNew = true;
        this.isMerged = false;
        this.mergedFrom = null;
        this.element = null;
    }

    getPosition() {
        // Offset to center tiles in cells (accounting for borders)
        return { x: this.col * (CELL_SIZE + CELL_GAP) + 4, y: this.row * (CELL_SIZE + CELL_GAP) + 4 };
    }

    getPrevPosition() {
        return { x: this.prevCol * (CELL_SIZE + CELL_GAP) + 4, y: this.prevRow * (CELL_SIZE + CELL_GAP) + 4 };
    }

    updatePosition(row, col) {
        this.prevRow = this.row;
        this.prevCol = this.col;
        this.row = row;
        this.col = col;
    }

    createElement() {
        const tile = document.createElement('div');
        // Extended tile values get their own classes
        const SUPPORTED_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
        const tileClass = SUPPORTED_VALUES.includes(this.value) ? this.value : 'super';
        tile.className = `tile tile-${tileClass}`;
        tile.textContent = this.value;

        const pos = this.getPosition();
        tile.style.left = pos.x + 'px';
        tile.style.top = pos.y + 'px';

        this.element = tile;
        return tile;
    }
}

// ===== Game State =====
const MOVE_COOLDOWN = 150; // Minimum ms between moves
const BAD_MOVE_PENALTY = 500; // Time penalty (ms) for moves that don't result in tile movement
const BAD_MOVE_FREEZE_THRESHOLD = 3; // Number of consecutive bad moves before freeze
const FREEZE_DURATION = 3000; // Duration of control freeze in ms

let game = {
    tiles: [], score: 0, timeRemaining: 45000, maxTime: 75000, difficulty: 'normal',
    isPlaying: false, lastUpdate: 0, timerInterval: null, moveCount: 0, isAnimating: false,
    frozenPositions: new Set(), bombPositions: new Set(), bonusPositions: new Set(),
    bombTimers: new Map(), // Track countdown for each bomb position
    lastMoveTime: 0, // Track last move timestamp for rate limiting
    consecutiveBadMoves: 0, // Track consecutive bad moves for freeze mechanic
    isControlsFrozen: false, // Whether controls are currently frozen
    // Time Rewind mechanic
    history: [], // Stack of past game states
    rewindCharges: 3, // Number of rewinds available
    isRewinding: false, // Whether currently in rewind animation
    rewindRechargeProgress: 0, // Progress toward next charge (0-1)
    // Day/Night cycle
    gameTime: 0, // Total time played in ms
    currentPhase: 'dawn' // Current time phase: dawn, day, dusk, night
};

// Day/Night cycle phases (30 seconds each = 120s full cycle)
const TIME_PHASES = {
    dawn: { duration: 30000, next: 'day', name: 'DAWN', icon: 'fa-sun', bonus: 1.2 },
    day: { duration: 30000, next: 'dusk', name: 'DAY', icon: 'fa-sun', bonus: 1.0 },
    dusk: { duration: 30000, next: 'night', name: 'DUSK', icon: 'fa-cloud-sun', bonus: 1.0 },
    night: { duration: 30000, next: 'dawn', name: 'NIGHT', icon: 'fa-moon', bonus: 0.8 }
};

// ===== DOM Elements =====
const elements = {};
function initElements() {
    ['menuScreen', 'gameContainer', 'tileContainer', 'gridContainer', 'score', 'best', 'timerBar',
        'timerSeconds', 'timerMs', 'difficultyBadge', 'eventToast', 'gameOver', 'finalScore',
        'newHighScore', 'highScoreEasy', 'highScoreNormal', 'highScoreHard'].forEach(id => {
            elements[id] = document.getElementById(id);
        });
}

// ===== Initialization =====
function init() {
    initElements();
    loadHighScores();
    loadTheme();
    loadSoundSetting();
    loadMusicSetting();
    setupEventListeners();
}

// ===== Theme Toggle =====
function loadTheme() {
    const savedTheme = localStorage.getItem('timeRush2048Theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('timeRush2048Theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
        icon.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }
}

// ===== Sound Toggle =====
function toggleSound() {
    SoundManager.enabled = !SoundManager.enabled;
    localStorage.setItem('timeRush2048Sound', SoundManager.enabled ? 'on' : 'off');
    updateSoundIcon();
    if (SoundManager.enabled) {
        SoundManager.click();
    }
}

function loadSoundSetting() {
    const saved = localStorage.getItem('timeRush2048Sound');
    SoundManager.enabled = saved !== 'off';
    updateSoundIcon();
}

function updateSoundIcon() {
    const btn = document.getElementById('soundToggle');
    const icon = document.querySelector('.sound-icon');
    if (btn && icon) {
        if (SoundManager.enabled) {
            btn.classList.remove('muted');
            icon.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        } else {
            btn.classList.add('muted');
            icon.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        }
    }
}

// ===== Music Toggle =====
function toggleMusic() {
    MusicManager.toggle();
    // If music is now UNMUTED (isPlaying=true), we want to start it if game is active
    if (!MusicManager.isMuted && game.isPlaying) {
        MusicManager.start();
    }

    // Play interaction sound
    if (SoundManager.enabled) {
        SoundManager.click();
    }

    localStorage.setItem('timeRush2048Music', MusicManager.isMuted ? 'off' : 'on');
    updateMusicIcon();
}

function loadMusicSetting() {
    const saved = localStorage.getItem('timeRush2048Music');
    // Default is on. If saved is 'off', then isMuted = true.
    MusicManager.isMuted = saved === 'off';
    updateMusicIcon();
}

function updateMusicIcon() {
    const btn = document.getElementById('musicToggle');
    const icon = document.querySelector('.music-icon');
    if (btn && icon) {
        if (!MusicManager.isMuted) {
            btn.classList.remove('muted');
            icon.innerHTML = '<i class="fa-solid fa-music"></i>';
            btn.title = 'Music On';
        } else {
            btn.classList.add('muted');
            icon.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
            btn.title = 'Music Off';
        }
    }
}

function loadHighScores() {
    const scores = JSON.parse(localStorage.getItem('timeRush2048Scores') || '{}');
    elements.highScoreEasy.textContent = scores.easy || 0;
    elements.highScoreNormal.textContent = scores.normal || 0;
    elements.highScoreHard.textContent = scores.hard || 0;
}

function saveHighScore() {
    const scores = JSON.parse(localStorage.getItem('timeRush2048Scores') || '{}');
    if (game.score > (scores[game.difficulty] || 0)) {
        scores[game.difficulty] = game.score;
        localStorage.setItem('timeRush2048Scores', JSON.stringify(scores));
        return true;
    }
    return false;
}

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Touch support
    let touchStartX, touchStartY;
    let touchMoved = false;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchMoved = false;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        touchMoved = true;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!game.isPlaying || game.isAnimating || !touchMoved) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 30) {
            move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        }
    });

    // Mouse drag support
    let mouseStartX, mouseStartY;
    let isDragging = false;

    const gameGrid = document.getElementById('gridContainer');

    gameGrid.addEventListener('mousedown', (e) => {
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
        isDragging = true;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        // Visual feedback could be added here
    });

    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;

        if (!game.isPlaying || game.isAnimating) return;

        const dx = e.clientX - mouseStartX;
        const dy = e.clientY - mouseStartY;

        // Minimum swipe distance of 30px
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 30) {
            if (Math.abs(dx) > Math.abs(dy)) {
                move(dx > 0 ? 'right' : 'left');
            } else {
                move(dy > 0 ? 'down' : 'up');
            }
        }
    });

    // Prevent context menu on right click within game grid
    gameGrid.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Track which keys are currently held down
const keysHeld = new Set();

function handleKeyDown(e) {
    if (!game.isPlaying || game.isAnimating) return;

    // Rewind with R key
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rewind();
        return;
    }

    const keyMap = { 'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right', 'w': 'up', 's': 'down', 'a': 'left', 'd': 'right' };

    if (keyMap[e.key]) {
        e.preventDefault();
        // Only allow move if key was not already held
        if (!keysHeld.has(e.key)) {
            keysHeld.add(e.key);
            move(keyMap[e.key]);
        }
    }
}

function handleKeyUp(e) {
    keysHeld.delete(e.key);
}

// ===== Game Flow =====
function startGame(difficulty) {
    game.difficulty = difficulty;
    const config = DIFFICULTIES[difficulty];
    game.tiles = [];
    game.score = 0;
    game.timeRemaining = config.startTime;
    game.maxTime = config.maxTime;
    game.isPlaying = true;
    game.isAnimating = false;
    game.moveCount = 0;
    game.frozenPositions = new Set();
    game.bombPositions = new Set();
    game.bonusPositions = new Set();
    game.bombTimers = new Map();
    game.lastMoveTime = 0;
    game.consecutiveBadMoves = 0;
    game.isControlsFrozen = false;
    game.history = [];
    game.rewindCharges = 3;
    game.isRewinding = false;
    game.rewindRechargeProgress = 0;
    game.gameTime = 0;
    game.currentPhase = 'dawn';
    document.body.setAttribute('data-time-phase', 'dawn');

    elements.difficultyBadge.textContent = config.label;
    elements.difficultyBadge.className = `difficulty-badge ${difficulty}`;
    updateScore();
    updateBest();

    elements.menuScreen.classList.add('hidden');
    elements.gameContainer.classList.add('active');
    elements.gameOver.classList.remove('show');
    elements.tileContainer.innerHTML = '';

    // Update cell dimensions now that grid is visible
    updateCellDimensions();

    addRandomTile();
    addRandomTile();
    renderTiles();

    // Save initial state for rewind
    saveGameState();
    updateRewindUI();

    game.lastUpdate = performance.now();
    startTimer();
    MusicManager.start(); // Start background music
}

function restartGame() { stopTimer(); elements.gameOver.classList.remove('show'); startGame(game.difficulty); }
function backToMenu() { stopTimer(); MusicManager.stop(); game.isPlaying = false; elements.gameOver.classList.remove('show'); elements.gameContainer.classList.remove('active'); elements.menuScreen.classList.remove('hidden'); loadHighScores(); }

function gameOver() {
    game.isPlaying = false;
    stopTimer();
    SoundManager.gameOver();
    elements.finalScore.textContent = game.score;

    // Show silly score comment
    const comment = getScoreComment(game.score);
    const commentEl = document.getElementById('scoreComment');
    if (commentEl) commentEl.textContent = comment;

    elements.newHighScore.style.display = saveHighScore() ? 'block' : 'none';
    elements.gameOver.classList.add('show');
}

// ===== Time Rewind System =====
function saveGameState() {
    const state = {
        tiles: game.tiles.map(t => ({ row: t.row, col: t.col, value: t.value })),
        score: game.score,
        timeRemaining: game.timeRemaining,
        frozenPositions: [...game.frozenPositions],
        bombPositions: [...game.bombPositions],
        bombTimers: [...game.bombTimers.entries()]
    };
    game.history.push(state);
    // Keep only last 5 states
    if (game.history.length > 5) game.history.shift();
}

function restoreGameState(state) {
    // Recreate tiles from state
    game.tiles = state.tiles.map(t => new Tile(t.row, t.col, t.value));
    game.score = state.score;
    game.timeRemaining = state.timeRemaining;
    game.frozenPositions = new Set(state.frozenPositions);
    game.bombPositions = new Set(state.bombPositions);
    game.bombTimers = new Map(state.bombTimers);
    updateScore();
    updateTimerDisplay();
    renderTiles();
}

function rewind() {
    if (!game.isPlaying || game.isRewinding || game.isAnimating) return;
    if (game.rewindCharges <= 0) {
        showEventToast('<i class="fa-solid fa-ban"></i> NO REWINDS LEFT!', 'Keep playing!', 'bad');
        return;
    }
    if (game.history.length < 2) {
        showEventToast('<i class="fa-solid fa-ban"></i> NOTHING TO REWIND!', 'Make some moves first!', 'bad');
        return;
    }

    game.isRewinding = true;
    game.rewindCharges--;

    // Play rewind sound
    SoundManager.rewind();

    // Show VHS rewind effect
    showRewindEffect();

    // Pop current state and restore previous
    game.history.pop(); // Remove current
    const previousState = game.history[game.history.length - 1];

    setTimeout(() => {
        restoreGameState(previousState);
        game.isRewinding = false;
        updateRewindUI();
        showEventToast('<i class="fa-solid fa-backward"></i> TIME REVERSED!', 'Charge used: ' + game.rewindCharges + ' left', 'good');
    }, 500);
}

function showRewindEffect() {
    const effect = document.createElement('div');
    effect.className = 'rewind-effect';
    effect.innerHTML = '<div class="rewind-lines"></div><div class="rewind-text"><i class="fa-solid fa-backward"></i> REWINDING...</div>';
    elements.gridContainer.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}

function updateRewindUI() {
    const rewindBtn = document.getElementById('rewindBtn');
    const rewindCount = document.getElementById('rewindCount');
    if (rewindCount) {
        rewindCount.textContent = game.rewindCharges;
    }
    if (rewindBtn) {
        rewindBtn.disabled = game.rewindCharges <= 0;
    }
}

function earnRewindCharge() {
    game.rewindCharges++;
    updateRewindUI();
    showEventToast('<i class="fa-solid fa-backward"></i> REWIND EARNED!', 'You now have ' + game.rewindCharges + ' charges!', 'good');
}

// ===== Timer =====
function startTimer() { game.timerInterval = setInterval(updateTimer, 16); }
function stopTimer() { if (game.timerInterval) { clearInterval(game.timerInterval); game.timerInterval = null; } }

function updateTimer() {
    const now = performance.now();
    const delta = now - game.lastUpdate;
    game.timeRemaining -= delta;
    game.gameTime += delta; // Track total game time for day/night cycle
    game.lastUpdate = now;

    if (game.timeRemaining <= 0) { game.timeRemaining = 0; gameOver(); return; }

    updateTimerDisplay();
    updateTimePhase();
    updateRewindRecharge(delta);
}

// Passive rewind recharge over time
function updateRewindRecharge(delta) {
    // Don't recharge if already at max (3)
    if (game.rewindCharges >= 3) {
        game.rewindRechargeProgress = 0;
        updateRechargeProgressUI();
        return;
    }

    const config = DIFFICULTIES[game.difficulty];
    const rechargeRate = delta / config.rewindRechargeTime; // Progress per frame

    game.rewindRechargeProgress += rechargeRate;

    // Award a new charge when progress reaches 1
    if (game.rewindRechargeProgress >= 1) {
        game.rewindRechargeProgress = 0;
        game.rewindCharges++;
        SoundManager.timeBonus(); // Play a nice sound
        showEventToast('<i class="fa-solid fa-backward"></i> REWIND RECHARGED!', '+1 charge!', 'good');
        updateRewindUI();
    }

    // Update the recharge progress bar
    updateRechargeProgressUI();
}

function updateRechargeProgressUI() {
    const progressBar = document.getElementById('rewindProgress');
    if (progressBar) {
        progressBar.style.width = (game.rewindRechargeProgress * 100) + '%';
    }
}

function updateTimerDisplay() {
    const seconds = Math.floor(game.timeRemaining / 1000);
    const ms = Math.floor(game.timeRemaining % 1000);
    elements.timerSeconds.textContent = seconds;
    elements.timerMs.textContent = '.' + ms.toString().padStart(3, '0');
    const percentage = (game.timeRemaining / game.maxTime) * 100;
    elements.timerBar.style.width = `${Math.min(100, percentage)}%`;
    elements.timerBar.classList.remove('warning', 'danger');
    if (percentage < 20) elements.timerBar.classList.add('danger');
    else if (percentage < 40) elements.timerBar.classList.add('warning');
}

// Day/Night cycle update
function updateTimePhase() {
    const cycleTime = game.gameTime % 120000; // 120s full cycle
    let newPhase;

    if (cycleTime < 30000) newPhase = 'dawn';
    else if (cycleTime < 60000) newPhase = 'day';
    else if (cycleTime < 90000) newPhase = 'dusk';
    else newPhase = 'night';

    if (newPhase !== game.currentPhase) {
        game.currentPhase = newPhase;
        applyTimePhase(newPhase);
    }

    // Update phase indicator
    updatePhaseIndicator();
}

function applyTimePhase(phase) {
    document.body.setAttribute('data-time-phase', phase);
    const phaseInfo = TIME_PHASES[phase];
    showEventToast(`<i class="fa-solid ${phaseInfo.icon}"></i> ${phaseInfo.name}`, getPhaseDescription(phase), 'good');
}

function getPhaseDescription(phase) {
    switch (phase) {
        case 'dawn': return 'Time bonuses +20%!';
        case 'day': return 'Standard gameplay';
        case 'dusk': return 'Twilight approaches...';
        case 'night': return 'Time bonuses -20%!';
    }
}

function updatePhaseIndicator() {
    const indicator = document.getElementById('phaseIndicator');
    const phaseIcon = document.getElementById('phaseIcon');
    const phaseTime = document.getElementById('phaseTime');

    if (!indicator) return;

    const phaseInfo = TIME_PHASES[game.currentPhase];
    const cycleTime = game.gameTime % 120000;
    let phaseProgress;

    // Calculate time remaining in current phase
    if (game.currentPhase === 'dawn') phaseProgress = cycleTime;
    else if (game.currentPhase === 'day') phaseProgress = cycleTime - 30000;
    else if (game.currentPhase === 'dusk') phaseProgress = cycleTime - 60000;
    else phaseProgress = cycleTime - 90000;

    const timeLeft = Math.ceil((30000 - phaseProgress) / 1000);

    if (phaseIcon) phaseIcon.className = `fa-solid ${phaseInfo.icon}`;
    if (phaseTime) phaseTime.textContent = timeLeft + 's';
}

function getTimePhaseBonus() {
    return TIME_PHASES[game.currentPhase]?.bonus || 1.0;
}

function addTime(ms) {
    // Apply time phase bonus
    const bonus = getTimePhaseBonus();
    const adjustedMs = ms > 0 ? Math.round(ms * bonus) : ms;
    game.timeRemaining = Math.min(game.maxTime, Math.max(0, game.timeRemaining + adjustedMs));
    updateTimerDisplay();
}

// ===== Grid Helpers =====
function getGrid() {
    const grid = Array(4).fill(null).map(() => Array(4).fill(null));
    game.tiles.forEach(tile => { grid[tile.row][tile.col] = tile; });
    return grid;
}

function getEmptyCells() {
    const grid = getGrid();
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!grid[r][c]) empty.push({ r, c });
    return empty;
}

function addRandomTile() {
    const empty = getEmptyCells();
    if (empty.length === 0) return null;
    const pos = empty[Math.floor(Math.random() * empty.length)];
    const tile = new Tile(pos.r, pos.c, Math.random() < 0.9 ? 2 : 4);
    game.tiles.push(tile);
    return tile;
}

// ===== Movement with Animation =====
function move(direction) {
    if (!game.isPlaying || game.isAnimating || game.isControlsFrozen) return;

    // Rate limiting - enforce minimum time between moves
    const now = performance.now();
    if (now - game.lastMoveTime < MOVE_COOLDOWN) return;
    game.lastMoveTime = now;

    const vectors = { up: { r: -1, c: 0 }, down: { r: 1, c: 0 }, left: { r: 0, c: -1 }, right: { r: 0, c: 1 } };
    const vector = vectors[direction];

    // Prepare tiles for movement
    game.tiles.forEach(tile => { tile.prevRow = tile.row; tile.prevCol = tile.col; tile.isMerged = false; tile.isNew = false; });

    // Build traversal order
    const traversals = buildTraversals(vector);
    let moved = false;
    let mergeScore = 0;
    const mergedValues = [];
    const mergedPositions = [];

    traversals.rows.forEach(row => {
        traversals.cols.forEach(col => {
            const grid = getGrid();
            const tile = grid[row][col];
            if (!tile) return;

            // Check if frozen
            if (game.frozenPositions.has(`${row},${col}`)) return;

            const positions = findFarthestPosition(tile.row, tile.col, vector);
            const next = positions.next;
            const nextGrid = getGrid();
            const nextTile = next ? nextGrid[next.r]?.[next.c] : null;

            if (nextTile && nextTile.value === tile.value && !nextTile.isMerged && !game.frozenPositions.has(`${next.r},${next.c}`)) {
                // Merge
                const newValue = tile.value * 2;
                nextTile.value = newValue;
                nextTile.isMerged = true;
                nextTile.mergedFrom = tile;
                tile.row = next.r;
                tile.col = next.c;
                game.tiles = game.tiles.filter(t => t !== tile);
                mergeScore += newValue;
                mergedValues.push(newValue);
                mergedPositions.push({ r: next.r, c: next.c, value: newValue });

                // Check bomb - bombs explode when merged!
                if (game.bombPositions.has(`${row},${col}`) || game.bombPositions.has(`${next.r},${next.c}`)) {
                    // Mark for explosion - bomb merged with something
                    game.bombPositions.delete(`${row},${col}`);
                    game.bombPositions.delete(`${next.r},${next.c}`);
                    game.bombTimers.delete(`${row},${col}`);
                    game.bombTimers.delete(`${next.r},${next.c}`);
                    // Trigger explosion at merge position
                    triggerBombExplosion(next.r, next.c);
                }
                moved = true;
            } else if (positions.farthest.r !== tile.row || positions.farthest.c !== tile.col) {
                // Move
                const oldKey = `${tile.row},${tile.col}`;
                tile.row = positions.farthest.r;
                tile.col = positions.farthest.c;
                const newKey = `${tile.row},${tile.col}`;

                // Update special positions
                if (game.frozenPositions.has(oldKey)) { game.frozenPositions.delete(oldKey); game.frozenPositions.add(newKey); }
                if (game.bombPositions.has(oldKey)) {
                    game.bombPositions.delete(oldKey);
                    game.bombPositions.add(newKey);
                    // Also update bomb timer key
                    if (game.bombTimers.has(oldKey)) {
                        const timer = game.bombTimers.get(oldKey);
                        game.bombTimers.delete(oldKey);
                        game.bombTimers.set(newKey, timer);
                    }
                }
                if (game.bonusPositions.has(oldKey)) { game.bonusPositions.delete(oldKey); game.bonusPositions.add(newKey); }
                moved = true;
            }
        });
    });

    if (moved) {
        game.isAnimating = true;
        game.moveCount++;
        game.consecutiveBadMoves = 0; // Reset bad move counter on successful move
        game.score += mergeScore;
        updateScore();
        SoundManager.slide();

        // Animate tiles
        animateTiles(() => {
            // Add time bonuses
            mergedValues.forEach((val, i) => {
                const bonus = (TIME_BONUSES[val] || 100) * DIFFICULTIES[game.difficulty].timeMultiplier;
                addTime(bonus);
                const pos = mergedPositions[i];
                showTimeBonusAt(bonus, pos.r, pos.c);
                spawnParticles(pos.r, pos.c, 'star', 8);

                // Play merge sound based on value
                if (val >= 128) {
                    SoundManager.bigMerge(val);
                } else {
                    SoundManager.merge(val);
                }

                // Check for 2048 victory!
                if (val === 2048) {
                    SoundManager.victory();
                }

                // Show silly quip for big merges!
                if (val >= 64) {
                    showQuipAt(getRandomQuip(), pos.r, pos.c);
                }
            });

            // Check bombs
            checkBombs();

            // Add new tile
            const newTile = addRandomTile();
            renderTiles(newTile);

            // Trigger random events
            triggerRandomEvent();

            // Save game state for rewind
            saveGameState();
            updateRewindUI();

            // Award rewind charge for reaching milestones
            mergedValues.forEach(val => {
                if (val === 512 || val === 1024 || val === 2048) {
                    earnRewindCharge();
                }
            });

            game.isAnimating = false;

            // Check game over
            if (!canMove()) gameOver();
        });
    } else {
        // Bad move - no tiles moved, apply time penalty
        game.consecutiveBadMoves++;
        addTime(-BAD_MOVE_PENALTY);
        showBadMoveFeedback();

        // Check if we should freeze controls
        if (game.consecutiveBadMoves >= BAD_MOVE_FREEZE_THRESHOLD) {
            freezeControls();
        }
    }
}

function buildTraversals(vector) {
    const traversals = { rows: [], cols: [] };
    for (let i = 0; i < 4; i++) { traversals.rows.push(i); traversals.cols.push(i); }
    if (vector.r === 1) traversals.rows.reverse();
    if (vector.c === 1) traversals.cols.reverse();
    return traversals;
}

function findFarthestPosition(row, col, vector) {
    let prev, cell = { r: row, c: col };
    do {
        prev = cell;
        cell = { r: prev.r + vector.r, c: prev.c + vector.c };
    } while (isWithinBounds(cell) && !getGrid()[cell.r][cell.c]);
    return { farthest: prev, next: isWithinBounds(cell) ? cell : null };
}

function isWithinBounds(cell) { return cell.r >= 0 && cell.r < 4 && cell.c >= 0 && cell.c < 4; }

function canMove() {
    if (getEmptyCells().length > 0) return true;
    const grid = getGrid();
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const tile = grid[r][c];
            if (tile) {
                if ((c < 3 && grid[r][c + 1]?.value === tile.value) || (r < 3 && grid[r + 1]?.[c]?.value === tile.value)) return true;
            }
        }
    }
    return false;
}

// ===== Rendering with Animation =====
function animateTiles(callback) {
    const container = elements.tileContainer;

    // Animate existing tiles to new positions
    game.tiles.forEach(tile => {
        if (!tile.element) return;
        const pos = tile.getPosition();
        tile.element.style.transition = 'left 0.12s ease-out, top 0.12s ease-out';
        tile.element.style.left = pos.x + 'px';
        tile.element.style.top = pos.y + 'px';

        if (tile.isMerged) {
            tile.element.classList.add('merged');
            const SUPPORTED_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
            const tileClass = SUPPORTED_VALUES.includes(tile.value) ? tile.value : 'super';
            tile.element.className = `tile tile-${tileClass} merged`;
            tile.element.textContent = tile.value;
        }
    });

    setTimeout(callback, 130);
}

function renderTiles(newTile = null) {
    const container = elements.tileContainer;
    container.innerHTML = '';

    game.tiles.forEach(tile => {
        const el = tile.createElement();

        // Apply special states
        const key = `${tile.row},${tile.col}`;
        if (game.frozenPositions.has(key)) el.classList.add('frozen');
        if (game.bombPositions.has(key)) {
            el.classList.add('bomb');
            // Add bomb timer indicator
            const timer = game.bombTimers.get(key);
            if (timer !== undefined) {
                const timerBadge = document.createElement('span');
                timerBadge.className = 'bomb-timer';
                timerBadge.textContent = timer;
                el.appendChild(timerBadge);
            }
        }
        if (game.bonusPositions.has(key)) el.classList.add('bonus');

        // New tile animation
        if (tile === newTile || tile.isNew) {
            el.classList.add('new');
            tile.isNew = false;
        }

        container.appendChild(el);
    });
}

function updateScore() { elements.score.textContent = game.score; }
function updateBest() {
    const scores = JSON.parse(localStorage.getItem('timeRush2048Scores') || '{}');
    elements.best.textContent = scores[game.difficulty] || 0;
}

// ===== Visual Effects =====
function showTimeBonusAt(ms, row, col) {
    const bonus = document.createElement('div');
    bonus.className = 'time-bonus' + (ms < 0 ? ' negative' : '');
    bonus.textContent = (ms >= 0 ? '+' : '') + (ms / 1000).toFixed(1) + 's';
    bonus.style.left = (col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2) + 'px';
    bonus.style.top = (row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2) + 'px';
    elements.gridContainer.appendChild(bonus);
    setTimeout(() => bonus.remove(), 1200);
}

function showScorePopup(points) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+' + points;
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    elements.gridContainer.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

// Show silly quip at tile position
function showQuipAt(text, row, col) {
    const quip = document.createElement('div');
    quip.className = 'quip-popup';
    quip.textContent = text;
    quip.style.left = (col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2) + 'px';
    quip.style.top = (row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2 - 30) + 'px';
    elements.gridContainer.appendChild(quip);
    setTimeout(() => quip.remove(), 1000);
}


function showScreenEffect(effectClass) {
    const effect = document.createElement('div');
    effect.className = effectClass;
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}

function showBadMoveFeedback() {
    // Show penalty popup in center
    const popup = document.createElement('div');
    popup.className = 'time-bonus negative';
    popup.textContent = '-0.5s';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    elements.gridContainer.appendChild(popup);
    setTimeout(() => popup.remove(), 800);

    // Shake the board
    shakeBoard();

    // Play penalty sound
    SoundManager.timePenalty();

    // Brief red flash
    showScreenEffect('bad-move-effect');
}

function freezeControls() {
    if (game.isControlsFrozen) return; // Already frozen

    game.isControlsFrozen = true;
    game.consecutiveBadMoves = 0; // Reset counter
    SoundManager.freeze();

    // Create freeze overlay
    const overlay = document.createElement('div');
    overlay.className = 'freeze-overlay';
    overlay.id = 'freezeOverlay';

    const freezeContent = document.createElement('div');
    freezeContent.className = 'freeze-content';

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-snowflake freeze-icon';

    const text = document.createElement('div');
    text.className = 'freeze-text';
    text.textContent = 'CONTROLS FROZEN!';

    const subtext = document.createElement('div');
    subtext.className = 'freeze-subtext';
    subtext.textContent = 'Too many bad moves!';

    const countdown = document.createElement('div');
    countdown.className = 'freeze-countdown';
    countdown.id = 'freezeCountdown';
    countdown.textContent = '3';

    freezeContent.appendChild(icon);
    freezeContent.appendChild(text);
    freezeContent.appendChild(subtext);
    freezeContent.appendChild(countdown);
    overlay.appendChild(freezeContent);
    elements.gridContainer.appendChild(overlay);

    // Show event toast
    showEventToast('<i class="fa-solid fa-snowflake"></i> BRAIN FREEZE!', 'Controls locked for 3 seconds!', 'bad');

    // Countdown animation
    let remaining = 3;
    const countdownEl = document.getElementById('freezeCountdown');

    const countdownInterval = setInterval(() => {
        remaining--;
        if (countdownEl) {
            countdownEl.textContent = remaining > 0 ? remaining : '';
            countdownEl.classList.add('pulse');
            setTimeout(() => countdownEl.classList.remove('pulse'), 200);
        }

        if (remaining <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);

    // Unfreeze after duration
    setTimeout(() => {
        game.isControlsFrozen = false;
        const overlayEl = document.getElementById('freezeOverlay');
        if (overlayEl) {
            overlayEl.classList.add('fade-out');
            setTimeout(() => overlayEl.remove(), 300);
        }
    }, FREEZE_DURATION);
}

function spawnParticles(row, col, type, count) {
    const x = col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
    const y = row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = `particle ${type}`;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const distance = 40 + Math.random() * 40;
        particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
        elements.gridContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }
}

function shakeBoard() {
    elements.gridContainer.classList.add('shake');
    setTimeout(() => elements.gridContainer.classList.remove('shake'), 300);
}

// ===== Random Events =====
function triggerRandomEvent() {
    if (game.moveCount < 5) return;
    const config = DIFFICULTIES[game.difficulty];
    const roll = Math.random();

    if (roll < config.goodEventChance) {
        const event = EVENTS.good[Math.floor(Math.random() * EVENTS.good.length)];
        event.effect(game);
        showEventToast(event.name, event.desc, 'good');
    } else if (roll < config.goodEventChance + config.badEventChance) {
        const event = EVENTS.bad[Math.floor(Math.random() * EVENTS.bad.length)];
        event.effect(game);
        showEventToast(event.name, event.desc, 'bad');
        shakeBoard();
    }
}

function showEventToast(title, desc, type) {
    elements.eventToast.innerHTML = `<strong>${title}</strong> ${desc}`;
    elements.eventToast.className = `event-toast ${type} show`;

    // Play sound based on event type
    if (type === 'good') {
        SoundManager.goodEvent();
    } else if (type === 'bad') {
        SoundManager.badEvent();
    }

    setTimeout(() => elements.eventToast.classList.remove('show'), 2500);
}

// ===== Special Tile Effects =====
game.addTime = addTime;
game.updateScore = updateScore;

game.addBombTile = function () {
    const tiles = game.tiles.filter(t => !game.bombPositions.has(`${t.row},${t.col}`));
    if (tiles.length > 0) {
        const tile = tiles[Math.floor(Math.random() * tiles.length)];
        const key = `${tile.row},${tile.col}`;
        game.bombPositions.add(key);
        game.bombTimers.set(key, 3); // Bomb explodes after 3 moves
        renderTiles();
        spawnParticles(tile.row, tile.col, 'fire', 6);
    }
};

game.clearBombs = function () {
    game.bombPositions.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        spawnParticles(r, c, 'star', 4);
    });
    game.bombPositions.clear();
    game.bombTimers.clear();
    renderTiles();
};

game.freezeRandomTile = function () {
    const tiles = game.tiles.filter(t => !game.frozenPositions.has(`${t.row},${t.col}`));
    if (tiles.length > 0) {
        const tile = tiles[Math.floor(Math.random() * tiles.length)];
        game.frozenPositions.add(`${tile.row},${tile.col}`);
        renderTiles();
        spawnParticles(tile.row, tile.col, 'ice', 8);
    }
};

game.unfreezeAll = function () {
    game.frozenPositions.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        spawnParticles(r, c, 'fire', 4);
    });
    game.frozenPositions.clear();
    renderTiles();
};

game.addBonusTile = function () {
    const empty = getEmptyCells();
    if (empty.length > 0) {
        const pos = empty[Math.floor(Math.random() * empty.length)];
        const tile = new Tile(pos.r, pos.c, 8);
        tile.isNew = true;
        game.tiles.push(tile);
        game.bonusPositions.add(`${pos.r},${pos.c}`);
        renderTiles(tile);
        spawnParticles(pos.r, pos.c, 'star', 10);
        showScreenEffect('time-bonus-effect');
    }
};

game.shuffleTiles = function () {
    const positions = [];
    game.tiles.forEach(t => positions.push({ r: t.row, c: t.col }));
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    game.tiles.forEach((t, i) => { t.row = positions[i].r; t.col = positions[i].c; });
    game.frozenPositions.clear();
    game.bombPositions.clear();
    game.bombTimers.clear();
    game.bonusPositions.clear();
    renderTiles();
};

game.resetRandomTile = function () {
    const tiles = game.tiles.filter(t => t.value > 2);
    if (tiles.length > 0) {
        const tile = tiles[Math.floor(Math.random() * tiles.length)];
        spawnParticles(tile.row, tile.col, 'fire', 6);
        tile.value = 2;
        renderTiles();
    }
};
// Trigger explosion at a specific position
function triggerBombExplosion(r, c) {
    showScreenEffect('explosion-effect');
    spawnParticles(r, c, 'fire', 16);

    // Destroy all tiles in a 3x3 area around the explosion
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4) {
                game.tiles = game.tiles.filter(t => !(t.row === nr && t.col === nc));
                game.frozenPositions.delete(`${nr},${nc}`);
                game.bombPositions.delete(`${nr},${nc}`);
                game.bombTimers.delete(`${nr},${nc}`);
                game.bonusPositions.delete(`${nr},${nc}`);
            }
        }
    }

    addTime(-5000);
    shakeBoard();
    showEventToast('💥 BOOM!', '-5 seconds!', 'bad');

    // Re-render after explosion
    setTimeout(() => renderTiles(), 50);
}

function checkBombs() {
    const toExplode = [];

    // Decrement all bomb timers and check which ones should explode
    game.bombTimers.forEach((timer, key) => {
        const newTimer = timer - 1;
        if (newTimer <= 0) {
            toExplode.push(key);
        } else {
            game.bombTimers.set(key, newTimer);
        }
    });

    // Explode bombs that have timed out
    toExplode.forEach(key => {
        game.bombPositions.delete(key);
        game.bombTimers.delete(key);
        const [r, c] = key.split(',').map(Number);
        triggerBombExplosion(r, c);
    });
}

// ===== Help Modal =====
function toggleHelpModal() {
    const overlay = document.getElementById('helpModalOverlay');
    if (overlay) {
        overlay.classList.toggle('show');
    }
}

function closeHelpModalIfOverlay(event) {
    // Only close if clicking directly on the overlay, not the modal content
    if (event.target.id === 'helpModalOverlay') {
        toggleHelpModal();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('helpModalOverlay');
        if (overlay && overlay.classList.contains('show')) {
            toggleHelpModal();
        }
    }
});

// ===== Start =====
init();
