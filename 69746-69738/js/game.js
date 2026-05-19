const CONFIG = {
    GRID_SIZE: 8,
    COLORS: 6,
    MAX_STEPS: 30,
    SCORE_PER_BLOCK: 10
};

const state = {
    grid: [],
    score: 0,
    steps: CONFIG.MAX_STEPS,
    selected: null,
    isAnimating: false,
    gameOver: false,
    dragStart: null,
    touchStartPos: null,
    touchMoved: false,
    lastDragBlock: null,
    fallingBlocks: new Set(),
    newBlocks: new Set()
};

const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const stepsElement = document.getElementById('steps');
const gameOverModal = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

function initGame() {
    state.score = 0;
    state.steps = CONFIG.MAX_STEPS;
    state.selected = null;
    state.isAnimating = false;
    state.gameOver = false;
    
    updateUI();
    gameOverModal.classList.add('hidden');
    hideNoMovesTip();
    
    do {
        createGrid();
    } while (checkMatches().length > 0 || !hasPossibleMoves());
    
    renderGrid();
}

function createGrid() {
    state.grid = [];
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        state.grid[y] = [];
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            state.grid[y][x] = getRandomColor(x, y);
        }
    }
}

function getRandomColor(x, y) {
    let color;
    do {
        color = Math.floor(Math.random() * CONFIG.COLORS);
    } while (
        (x >= 2 && state.grid[y][x - 1] === color && state.grid[y][x - 2] === color) ||
        (y >= 2 && state.grid[y - 1][x] === color && state.grid[y - 2][x] === color)
    );
    return color;
}

function renderGrid() {
    gameBoard.innerHTML = '';
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            const block = createBlock(x, y, state.grid[y][x]);
            gameBoard.appendChild(block);
        }
    }
    
    state.fallingBlocks.clear();
    state.newBlocks.clear();
}

function createBlock(x, y, color) {
    const block = document.createElement('div');
    const key = `${x},${y}`;
    let classes = `block color-${color}`;
    
    if (state.newBlocks.has(key)) {
        classes += ' new';
    } else if (state.fallingBlocks.has(key)) {
        classes += ' falling';
    }
    
    block.className = classes;
    block.dataset.x = x;
    block.dataset.y = y;
    
    const emojis = ['🍎', '🍊', '🍋', '🍀', '💎', '🔮'];
    block.textContent = emojis[color];
    
    block.addEventListener('click', handleBlockClick);
    block.addEventListener('mousedown', handleDragStart);
    block.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    return block;
}

function handleBlockClick(e) {
    if (state.isAnimating || state.gameOver) return;
    
    const x = parseInt(e.currentTarget.dataset.x);
    const y = parseInt(e.currentTarget.dataset.y);
    
    if (state.selected === null) {
        state.selected = { x, y };
        e.currentTarget.classList.add('selected');
    } else {
        const prevBlock = document.querySelector('.block.selected');
        if (prevBlock) {
            prevBlock.classList.remove('selected');
        }
        
        const dx = Math.abs(state.selected.x - x);
        const dy = Math.abs(state.selected.y - y);
        
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            trySwap(state.selected.x, state.selected.y, x, y);
        } else if (dx === 0 && dy === 0) {
            state.selected = null;
            return;
        }
        
        state.selected = null;
    }
}

function handleDragStart(e) {
    if (state.isAnimating || state.gameOver) return;
    e.preventDefault();
    
    const x = parseInt(e.currentTarget.dataset.x);
    const y = parseInt(e.currentTarget.dataset.y);
    state.dragStart = { x, y, element: e.currentTarget };
    state.lastDragBlock = { x, y };
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
}

function handleTouchStart(e) {
    if (state.isAnimating || state.gameOver) return;
    
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target || !target.classList.contains('block')) return;
    
    const x = parseInt(target.dataset.x);
    const y = parseInt(target.dataset.y);
    state.dragStart = { x, y, element: target };
    state.lastDragBlock = { x, y };
    state.touchStartPos = { x: touch.clientX, y: touch.clientY };
    state.touchMoved = false;
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
}

function handleDragMove(e) {
    if (!state.dragStart) return;
    e.preventDefault();
    
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (target && target.classList.contains('block')) {
        const x = parseInt(target.dataset.x);
        const y = parseInt(target.dataset.y);
        checkAndSwapFromDrag(x, y);
    }
}

function handleTouchMove(e) {
    if (!state.dragStart || !state.touchStartPos) return;
    
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - state.touchStartPos.x);
    const dy = Math.abs(touch.clientY - state.touchStartPos.y);
    
    if (!state.touchMoved && dx < 10 && dy < 10) {
        return;
    }
    
    state.touchMoved = true;
    e.preventDefault();
    
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('block')) {
        const x = parseInt(target.dataset.x);
        const y = parseInt(target.dataset.y);
        checkAndSwapFromDrag(x, y);
    }
}

function checkAndSwapFromDrag(x, y) {
    if (!state.lastDragBlock) return;
    
    const dxFromStart = x - state.dragStart.x;
    const dyFromStart = y - state.dragStart.y;
    const absDx = Math.abs(dxFromStart);
    const absDy = Math.abs(dyFromStart);
    
    if (absDx === 0 && absDy === 0) {
        state.lastDragBlock = { x, y };
        return;
    }
    
    let targetX = state.dragStart.x;
    let targetY = state.dragStart.y;
    
    if (absDx > absDy) {
        targetX += dxFromStart > 0 ? 1 : -1;
    } else {
        targetY += dyFromStart > 0 ? 1 : -1;
    }
    
    if (targetX >= 0 && targetX < CONFIG.GRID_SIZE && 
        targetY >= 0 && targetY < CONFIG.GRID_SIZE) {
        trySwap(state.dragStart.x, state.dragStart.y, targetX, targetY);
        endDrag();
    }
    
    state.lastDragBlock = { x, y };
}

function handleDragEnd() {
    endDrag();
}

function handleTouchEnd() {
    endDrag();
}

function endDrag() {
    state.dragStart = null;
    state.touchStartPos = null;
    state.touchMoved = false;
    state.lastDragBlock = null;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
}

async function trySwap(x1, y1, x2, y2) {
    state.isAnimating = true;
    
    swapBlocks(x1, y1, x2, y2);
    renderGrid();
    
    const matches = checkMatches();
    
    if (matches.length === 0) {
        await delay(200);
        swapBlocks(x1, y1, x2, y2);
        renderGrid();
        state.isAnimating = false;
    } else {
        state.steps--;
        updateUI();
        await processMatches();
        state.isAnimating = false;
        
        if (state.steps <= 0) {
            endGame();
        }
    }
}

function swapBlocks(x1, y1, x2, y2) {
    const temp = state.grid[y1][x1];
    state.grid[y1][x1] = state.grid[y2][x2];
    state.grid[y2][x2] = temp;
}

function checkMatchGroups() {
    const groups = [];
    
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        let count = 1;
        for (let x = 1; x < CONFIG.GRID_SIZE; x++) {
            if (state.grid[y][x] === state.grid[y][x - 1] && state.grid[y][x] !== null) {
                count++;
            } else {
                if (count >= 3) {
                    const group = [];
                    for (let i = 0; i < count; i++) {
                        group.push({ x: x - 1 - i, y });
                    }
                    groups.push(group);
                }
                count = 1;
            }
        }
        if (count >= 3) {
            const group = [];
            for (let i = 0; i < count; i++) {
                group.push({ x: CONFIG.GRID_SIZE - 1 - i, y });
            }
            groups.push(group);
        }
    }
    
    for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        let count = 1;
        for (let y = 1; y < CONFIG.GRID_SIZE; y++) {
            if (state.grid[y][x] === state.grid[y - 1][x] && state.grid[y][x] !== null) {
                count++;
            } else {
                if (count >= 3) {
                    const group = [];
                    for (let i = 0; i < count; i++) {
                        group.push({ x, y: y - 1 - i });
                    }
                    groups.push(group);
                }
                count = 1;
            }
        }
        if (count >= 3) {
            const group = [];
            for (let i = 0; i < count; i++) {
                group.push({ x, y: CONFIG.GRID_SIZE - 1 - i });
            }
            groups.push(group);
        }
    }
    
    return mergeOverlappingGroups(groups);
}

function mergeOverlappingGroups(groups) {
    const parent = groups.map((_, i) => i);
    
    function find(x) {
        if (parent[x] !== x) {
            parent[x] = find(parent[x]);
        }
        return parent[x];
    }
    
    function union(a, b) {
        parent[find(a)] = find(b);
    }
    
    const pointToGroupIndices = new Map();
    for (let i = 0; i < groups.length; i++) {
        for (const point of groups[i]) {
            const key = `${point.x},${point.y}`;
            if (pointToGroupIndices.has(key)) {
                for (const existingIdx of pointToGroupIndices.get(key)) {
                    union(existingIdx, i);
                }
            } else {
                pointToGroupIndices.set(key, []);
            }
            pointToGroupIndices.get(key).push(i);
        }
    }
    
    const mergedGroups = new Map();
    for (let i = 0; i < groups.length; i++) {
        const root = find(i);
        if (!mergedGroups.has(root)) {
            mergedGroups.set(root, new Set());
        }
        for (const point of groups[i]) {
            const key = `${point.x},${point.y}`;
            mergedGroups.get(root).add(key);
        }
    }
    
    const result = [];
    for (const pointSet of mergedGroups.values()) {
        const group = [];
        for (const key of pointSet) {
            const [x, y] = key.split(',').map(Number);
            group.push({ x, y });
        }
        result.push(group);
    }
    
    return result;
}

function checkMatches() {
    const groups = checkMatchGroups();
    const allMatches = [];
    for (const group of groups) {
        allMatches.push(...group);
    }
    return allMatches;
}

async function processMatches() {
    let totalScore = 0;
    let hasMatches = true;
    
    while (hasMatches) {
        const groups = checkMatchGroups();
        if (groups.length === 0) {
            hasMatches = false;
            break;
        }
        
        const allMatches = [];
        let roundScore = 0;
        
        for (const group of groups) {
            roundScore += calculateGroupScore(group.length);
            allMatches.push(...group);
        }
        
        totalScore += roundScore;
        
        showScorePopup(allMatches, roundScore);
        await animateRemove(allMatches);
        removeMatches(allMatches);
        
        await delay(100);
        dropBlocks();
        renderGrid();
        
        await delay(300);
        generateNewBlocks();
        renderGrid();
        
        await delay(300);
    }
    
    state.score += totalScore;
    updateUI();
    
    if (!hasPossibleMoves()) {
        await handleNoMoves();
    }
}

function calculateGroupScore(groupSize) {
    let score = groupSize * CONFIG.SCORE_PER_BLOCK;
    if (groupSize >= 5) {
        score *= 2;
    } else if (groupSize >= 4) {
        score *= 1.5;
    }
    return score;
}

function showScorePopup(matches, score) {
    if (matches.length === 0) return;
    
    const centerX = matches.reduce((sum, m) => sum + m.x, 0) / matches.length;
    const centerY = matches.reduce((sum, m) => sum + m.y, 0) / matches.length;
    
    const blockElement = document.querySelector(`[data-x="${Math.floor(centerX)}"][data-y="${Math.floor(centerY)}"]`);
    if (!blockElement) return;
    
    const boardRect = gameBoard.getBoundingClientRect();
    const blockRect = blockElement.getBoundingClientRect();
    
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${score}`;
    popup.style.left = `${blockRect.left - boardRect.left + blockRect.width / 2 - 20}px`;
    popup.style.top = `${blockRect.top - boardRect.top}px`;
    
    gameBoard.appendChild(popup);
    
    setTimeout(() => popup.remove(), 800);
}

async function animateRemove(matches) {
    for (const match of matches) {
        const block = document.querySelector(`[data-x="${match.x}"][data-y="${match.y}"]`);
        if (block) {
            block.classList.add('matching');
        }
    }
    await delay(300);
}

function removeMatches(matches) {
    for (const match of matches) {
        state.grid[match.y][match.x] = null;
    }
}

function dropBlocks() {
    state.fallingBlocks.clear();
    for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        let emptyY = CONFIG.GRID_SIZE - 1;
        for (let y = CONFIG.GRID_SIZE - 1; y >= 0; y--) {
            if (state.grid[y][x] !== null) {
                if (y !== emptyY) {
                    state.grid[emptyY][x] = state.grid[y][x];
                    state.grid[y][x] = null;
                    state.fallingBlocks.add(`${x},${emptyY}`);
                }
                emptyY--;
            }
        }
    }
}

function generateNewBlocks() {
    state.newBlocks.clear();
    for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            if (state.grid[y][x] === null) {
                state.grid[y][x] = Math.floor(Math.random() * CONFIG.COLORS);
                state.newBlocks.add(`${x},${y}`);
            }
        }
    }
}

function hasPossibleMoves() {
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            if (x < CONFIG.GRID_SIZE - 1) {
                swapBlocks(x, y, x + 1, y);
                const matches = checkMatches();
                swapBlocks(x, y, x + 1, y);
                if (matches.length > 0) return true;
            }
            if (y < CONFIG.GRID_SIZE - 1) {
                swapBlocks(x, y, x, y + 1);
                const matches = checkMatches();
                swapBlocks(x, y, x, y + 1);
                if (matches.length > 0) return true;
            }
        }
    }
    return false;
}

async function handleNoMoves() {
    showNoMovesTip();
    
    await delay(1500);
    
    let attempts = 0;
    let validGrid = false;
    do {
        shuffleGrid();
        attempts++;
        if (attempts > 100) {
            createGrid();
        }
        if (checkMatches().length === 0 && hasPossibleMoves()) {
            validGrid = true;
        }
    } while (!validGrid);
    
    renderGrid();
    hideNoMovesTip();
}

function shuffleGrid() {
    const allBlocks = [];
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            allBlocks.push(state.grid[y][x]);
        }
    }
    
    for (let i = allBlocks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allBlocks[i], allBlocks[j]] = [allBlocks[j], allBlocks[i]];
    }
    
    let index = 0;
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            state.grid[y][x] = allBlocks[index++];
        }
    }
}

function showNoMovesTip() {
    let tip = document.getElementById('no-moves-tip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'no-moves-tip';
        tip.className = 'no-moves-tip';
        tip.innerHTML = '💡 无可消除组合，正在重新排列...';
        gameBoard.appendChild(tip);
    }
    tip.style.display = 'flex';
}

function hideNoMovesTip() {
    const tip = document.getElementById('no-moves-tip');
    if (tip) {
        tip.style.display = 'none';
    }
}

function updateUI() {
    scoreElement.textContent = state.score;
    stepsElement.textContent = state.steps;
}

function endGame() {
    state.gameOver = true;
    finalScoreElement.textContent = state.score;
    gameOverModal.classList.remove('hidden');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

restartBtn.addEventListener('click', initGame);

initGame();
