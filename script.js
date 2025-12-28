// ===== Game Configuration =====
const DIFFICULTIES = {
    easy: { startTime: 60000, maxTime: 90000, timeMultiplier: 1.5, badEventChance: 0.08, goodEventChance: 0.15, label: 'Baby Mode' },
    normal: { startTime: 45000, maxTime: 75000, timeMultiplier: 1.0, badEventChance: 0.12, goodEventChance: 0.12, label: 'Marine' },
    hard: { startTime: 30000, maxTime: 60000, timeMultiplier: 0.5, badEventChance: 0.18, goodEventChance: 0.08, label: 'Nightmare' }
};

const TIME_BONUSES = { 4: 200, 8: 350, 16: 500, 32: 750, 64: 1000, 128: 1500, 256: 2000, 512: 3000, 1024: 4500, 2048: 6000 };
const CELL_SIZE = 100;
const CELL_GAP = 12;

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
        { type: 'bonus_time', name: '⏰ SOUL SPHERE!', desc: '+5 seconds, mortal!', effect: (g) => { g.addTime(5000); showScreenEffect('time-bonus-effect'); } },
        { type: 'clear_bombs', name: '🧯 BFG DEPLOYED!', desc: 'All demons defused!', effect: (g) => { g.clearBombs(); showScreenEffect('time-bonus-effect'); } },
        { type: 'unfreeze', name: '🔥 RIP AND THAW!', desc: 'Tiles are angry again!', effect: (g) => { g.unfreezeAll(); showScreenEffect('time-bonus-effect'); } },
        { type: 'bonus_tile', name: '⭐ POWER-UP!', desc: 'A blessed tile descends!', effect: (g) => { g.addBonusTile(); } },
        { type: 'score_boost', name: '💰 SECRET FOUND!', desc: '+500 points! Very sneaky!', effect: (g) => { g.score += 500; g.updateScore(); showScorePopup(500); showScreenEffect('time-bonus-effect'); } }
    ],
    bad: [
        { type: 'time_drain', name: '⏳ TIME VAMPIRE!', desc: '-3 seconds sucked away!', effect: (g) => { g.addTime(-3000); showScreenEffect('time-drain-effect'); } },
        { type: 'bomb', name: '💣 DEMON BOMB!', desc: 'Something evil appeared...', effect: (g) => { g.addBombTile(); } },
        { type: 'freeze', name: '❄️ ICE DEMON!', desc: 'A tile has been cursed!', effect: (g) => { g.freezeRandomTile(); showScreenEffect('freeze-effect'); } },
        { type: 'shuffle', name: '🔀 CHAOS MAGIC!', desc: 'Reality is scrambled!', effect: (g) => { g.shuffleTiles(); showScreenEffect('shuffle-effect'); } },
        { type: 'spawn_low', name: '↩️ DEMONIC RESET!', desc: 'A tile got possessed!', effect: (g) => { g.resetRandomTile(); showScreenEffect('time-drain-effect'); } }
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
        return { x: this.col * (CELL_SIZE + CELL_GAP), y: this.row * (CELL_SIZE + CELL_GAP) };
    }

    getPrevPosition() {
        return { x: this.prevCol * (CELL_SIZE + CELL_GAP), y: this.prevRow * (CELL_SIZE + CELL_GAP) };
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

let game = {
    tiles: [], score: 0, timeRemaining: 45000, maxTime: 75000, difficulty: 'normal',
    isPlaying: false, lastUpdate: 0, timerInterval: null, moveCount: 0, isAnimating: false,
    frozenPositions: new Set(), bombPositions: new Set(), bonusPositions: new Set(),
    bombTimers: new Map(), // Track countdown for each bomb position
    lastMoveTime: 0 // Track last move timestamp for rate limiting
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
        icon.textContent = theme === 'dark' ? '🌙' : '☀️';
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

    elements.difficultyBadge.textContent = config.label;
    elements.difficultyBadge.className = `difficulty-badge ${difficulty}`;
    updateScore();
    updateBest();

    elements.menuScreen.classList.add('hidden');
    elements.gameContainer.classList.add('active');
    elements.gameOver.classList.remove('show');
    elements.tileContainer.innerHTML = '';

    addRandomTile();
    addRandomTile();
    renderTiles();

    game.lastUpdate = performance.now();
    startTimer();
}

function restartGame() { stopTimer(); elements.gameOver.classList.remove('show'); startGame(game.difficulty); }
function backToMenu() { stopTimer(); game.isPlaying = false; elements.gameOver.classList.remove('show'); elements.gameContainer.classList.remove('active'); elements.menuScreen.classList.remove('hidden'); loadHighScores(); }

function gameOver() {
    game.isPlaying = false;
    stopTimer();
    elements.finalScore.textContent = game.score;

    // Show silly score comment
    const comment = getScoreComment(game.score);
    const commentEl = document.getElementById('scoreComment');
    if (commentEl) commentEl.textContent = comment;

    elements.newHighScore.style.display = saveHighScore() ? 'block' : 'none';
    elements.gameOver.classList.add('show');
}

// ===== Timer =====
function startTimer() { game.timerInterval = setInterval(updateTimer, 16); }
function stopTimer() { if (game.timerInterval) { clearInterval(game.timerInterval); game.timerInterval = null; } }

function updateTimer() {
    const now = performance.now();
    game.timeRemaining -= now - game.lastUpdate;
    game.lastUpdate = now;
    if (game.timeRemaining <= 0) { game.timeRemaining = 0; gameOver(); return; }
    updateTimerDisplay();
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

function addTime(ms) {
    game.timeRemaining = Math.min(game.maxTime, Math.max(0, game.timeRemaining + ms));
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
    if (!game.isPlaying || game.isAnimating) return;

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
        game.score += mergeScore;
        updateScore();

        // Animate tiles
        animateTiles(() => {
            // Add time bonuses
            mergedValues.forEach((val, i) => {
                const bonus = (TIME_BONUSES[val] || 100) * DIFFICULTIES[game.difficulty].timeMultiplier;
                addTime(bonus);
                const pos = mergedPositions[i];
                showTimeBonusAt(bonus, pos.r, pos.c);
                spawnParticles(pos.r, pos.c, 'star', 8);

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

            game.isAnimating = false;

            // Check game over
            if (!canMove()) gameOver();
        });
    } else {
        // Bad move - no tiles moved, apply time penalty
        addTime(-BAD_MOVE_PENALTY);
        showBadMoveFeedback();
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

    // Brief red flash
    showScreenEffect('bad-move-effect');
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

// ===== Start =====
init();
