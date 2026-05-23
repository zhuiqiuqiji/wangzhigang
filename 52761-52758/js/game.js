const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const nextBubbleElement = document.getElementById('nextBubble');
const currentLevelElement = document.getElementById('currentLevel');
const targetScoreElement = document.getElementById('targetScore');
const comboDisplay = document.getElementById('comboDisplay');
const levelSelectElement = document.getElementById('levelSelect');
const gameScreenElement = document.getElementById('gameScreen');
const levelGridElement = document.getElementById('levelGrid');
const resultModal = document.getElementById('resultModal');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 700;
const BUBBLE_RADIUS = 25;
const COLS = 12;
const COLORS = ['#ff4757', '#3742fa', '#2ed573', '#ffa502', '#a55eea'];
const SPECIAL_COLORS = {
    bomb: '#2c3e50',
    rainbow: 'rainbow',
    chain: '#7f8c8d',
    poison: '#8e44ad'
};
const BUBBLE_SPEED = 12;
const GRAVITY = 0.5;
const DANGER_LINE = 600;
const ROW_HEIGHT = BUBBLE_RADIUS * Math.sqrt(3);

const evenRowOffsets = [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
const oddRowOffsets = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

const LEVELS = [
    { id: 1, name: '新手入门', rows: 4, targetScore: 500, shootThreshold: 8, specialChance: 0 },
    { id: 2, name: '初级挑战', rows: 5, targetScore: 800, shootThreshold: 7, specialChance: 0.05 },
    { id: 3, name: '炸弹来袭', rows: 5, targetScore: 1200, shootThreshold: 6, specialChance: 0.1, specials: ['bomb'] },
    { id: 4, name: '彩虹魔力', rows: 6, targetScore: 1500, shootThreshold: 6, specialChance: 0.1, specials: ['bomb', 'rainbow'] },
    { id: 5, name: '锁链困局', rows: 6, targetScore: 2000, shootThreshold: 5, specialChance: 0.12, specials: ['bomb', 'rainbow', 'chain'] },
    { id: 6, name: '毒雾弥漫', rows: 7, targetScore: 2500, shootThreshold: 5, specialChance: 0.12, specials: ['bomb', 'rainbow', 'chain', 'poison'] },
    { id: 7, name: '步步紧逼', rows: 7, targetScore: 3000, shootThreshold: 4, specialChance: 0.15, specials: ['bomb', 'rainbow', 'chain', 'poison'] },
    { id: 8, name: '极限挑战', rows: 8, targetScore: 4000, shootThreshold: 4, specialChance: 0.18, specials: ['bomb', 'rainbow', 'chain', 'poison'] },
    { id: 9, name: '终极考验', rows: 8, targetScore: 5000, shootThreshold: 3, specialChance: 0.2, specials: ['bomb', 'rainbow', 'chain', 'poison'] },
    { id: 10, name: '大师之路', rows: 9, targetScore: 8000, shootThreshold: 3, specialChance: 0.25, specials: ['bomb', 'rainbow', 'chain', 'poison'] }
];

let grid = [];
let score = 0;
let comboScore = 0;
let currentBubble;
let nextBubble;
let shootCount = 0;
let gameOver = false;
let angle = -Math.PI / 2;
let shootingBubble = null;
let fallingBubbles = [];
let removingBubbles = [];
let activeTimeouts = [];
let currentLevel = 1;
let unlockedLevels = 1;
let levelStars = {};
let consecutiveClears = 0;
let history = [];

let items = {
    sight: 3,
    undo: 2,
    shuffle: 5
};
let sightActive = false;

function loadProgress() {
    const saved = localStorage.getItem('bubbleShooterProgress');
    if (saved) {
        const data = JSON.parse(saved);
        unlockedLevels = data.unlockedLevels || 1;
        levelStars = data.levelStars || {};
    }
}

function saveProgress() {
    localStorage.setItem('bubbleShooterProgress', JSON.stringify({
        unlockedLevels,
        levelStars
    }));
}

function renderLevelSelect() {
    levelGridElement.innerHTML = '';
    for (let i = 0; i < LEVELS.length; i++) {
        const level = LEVELS[i];
        const card = document.createElement('div');
        card.className = 'level-card';
        if (i + 1 > unlockedLevels) {
            card.classList.add('locked');
        }
        const stars = levelStars[i + 1] || 0;
        card.innerHTML = `
            <div class="level-number">${level.id}</div>
            <div class="level-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        `;
        if (i + 1 <= unlockedLevels) {
            card.addEventListener('click', () => startLevel(i + 1));
        }
        levelGridElement.appendChild(card);
    }
}

function startLevel(levelId) {
    currentLevel = levelId;
    const level = LEVELS[levelId - 1];
    
    for (const timeoutId of activeTimeouts) {
        clearTimeout(timeoutId);
    }
    activeTimeouts = [];
    
    grid = [];
    score = 0;
    comboScore = 0;
    shootCount = 0;
    gameOver = false;
    shootingBubble = null;
    fallingBubbles = [];
    removingBubbles = [];
    consecutiveClears = 0;
    history = [];
    sightActive = false;
    
    items = { sight: 3, undo: 2, shuffle: 5 };
    updateItemDisplay();
    
    scoreElement.textContent = '0';
    currentLevelElement.textContent = levelId;
    targetScoreElement.textContent = level.targetScore;
    comboDisplay.textContent = '';
    
    for (let row = 0; row < level.rows; row++) {
        grid[row] = [];
        const colsInRow = row % 2 === 0 ? COLS : COLS - 1;
        for (let col = 0; col < colsInRow; col++) {
            grid[row][col] = createBubble(row, col, getRandomBubbleColor(level));
        }
    }
    
    currentBubble = getRandomBubbleColor(level);
    nextBubble = getRandomBubbleColor(level);
    updateNextBubblePreview();
    
    levelSelectElement.style.display = 'none';
    gameScreenElement.style.display = 'flex';
    resultModal.classList.remove('show');
    gameOverModal.classList.remove('show');
}

function getRandomBubbleColor(level) {
    if (level.specials && level.specialChance > 0 && Math.random() < level.specialChance) {
        const specialType = level.specials[Math.floor(Math.random() * level.specials.length)];
        return { type: 'special', special: specialType };
    }
    return { type: 'normal', color: Math.floor(Math.random() * COLORS.length) };
}

function createBubble(row, col, colorData) {
    const x = getBubbleX(row, col);
    const y = getBubbleY(row);
    return { 
        row, col, x, y, 
        colorData, 
        falling: false, 
        vy: 0, 
        scale: 1, 
        removing: false,
        chainHp: colorData.special === 'chain' ? 2 : 0
    };
}

function getBubbleX(row, col) {
    if (row % 2 === 0) {
        return col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS;
    } else {
        return col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS * 2;
    }
}

function getBubbleY(row) {
    return row * ROW_HEIGHT + BUBBLE_RADIUS;
}

function updateNextBubblePreview() {
    if (nextBubble.type === 'normal') {
        const color = COLORS[nextBubble.color];
        nextBubbleElement.style.background = `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), ${color})`;
    } else {
        nextBubbleElement.style.background = getSpecialBubbleGradient(nextBubble.special);
    }
}

function getSpecialBubbleGradient(type) {
    switch (type) {
        case 'bomb':
            return 'radial-gradient(circle at 30% 30%, #555, #1a1a1a)';
        case 'rainbow':
            return 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)';
        case 'chain':
            return 'radial-gradient(circle at 30% 30%, #aaa, #555)';
        case 'poison':
            return 'radial-gradient(circle at 30% 30%, #9b59b6, #4a235a)';
        default:
            return '#888';
    }
}

function drawBubble(x, y, bubble, scale = 1) {
    const radius = BUBBLE_RADIUS * scale;
    const colorData = bubble.colorData || bubble;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (colorData.type === 'normal') {
        const color = COLORS[colorData.color];
        const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, shadeColor(color, -30));
        ctx.fillStyle = gradient;
    } else {
        const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
        switch (colorData.special) {
            case 'bomb':
                gradient.addColorStop(0, '#555');
                gradient.addColorStop(1, '#1a1a1a');
                break;
            case 'rainbow':
                const rainbow = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
                rainbow.addColorStop(0, '#ff0000');
                rainbow.addColorStop(0.2, '#ff7f00');
                rainbow.addColorStop(0.4, '#ffff00');
                rainbow.addColorStop(0.6, '#00ff00');
                rainbow.addColorStop(0.8, '#0000ff');
                rainbow.addColorStop(1, '#8b00ff');
                ctx.fillStyle = rainbow;
                ctx.fill();
                drawSpecialIcon(x, y, radius, '🌈');
                ctx.restore();
                return;
            case 'chain':
                gradient.addColorStop(0, '#aaa');
                gradient.addColorStop(1, '#555');
                break;
            case 'poison':
                gradient.addColorStop(0, '#9b59b6');
                gradient.addColorStop(1, '#4a235a');
                break;
        }
        ctx.fillStyle = gradient;
    }
    
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    
    if (colorData.type === 'special') {
        const icons = { bomb: '💣', chain: '⛓️', poison: '☠️' };
        if (icons[colorData.special]) {
            drawSpecialIcon(x, y, radius, icons[colorData.special]);
        }
        if (colorData.special === 'chain' && bubble.chainHp === 2) {
            ctx.font = `${radius * 0.6}px Arial`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('2', x, y + radius * 0.1);
        }
    }
    
    ctx.restore();
}

function drawSpecialIcon(x, y, radius, icon) {
    ctx.font = `${radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y);
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function drawShooter() {
    const shooterX = CANVAS_WIDTH / 2;
    const shooterY = CANVAS_HEIGHT - 50;
    
    drawAimLine();
    
    ctx.save();
    ctx.translate(shooterX, shooterY);
    ctx.rotate(angle + Math.PI / 2);
    
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(-15, 15);
    ctx.lineTo(15, 15);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, -35, 0, 15);
    gradient.addColorStop(0, '#4ecdc4');
    gradient.addColorStop(1, '#45b7d1');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
    
    if (currentBubble) {
        drawBubble(shooterX, shooterY, { colorData: currentBubble });
    }
}

function drawAimLine() {
    const shooterX = CANVAS_WIDTH / 2;
    const shooterY = CANVAS_HEIGHT - 50;
    
    ctx.save();
    ctx.strokeStyle = sightActive ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    
    let simX = shooterX;
    let simY = shooterY;
    let simVx = Math.cos(angle) * BUBBLE_SPEED;
    let simVy = Math.sin(angle) * BUBBLE_SPEED;
    const maxSteps = sightActive ? 500 : 200;
    
    ctx.beginPath();
    ctx.moveTo(simX, simY);
    
    for (let i = 0; i < maxSteps; i++) {
        simX += simVx;
        simY += simVy;
        
        if (simX - BUBBLE_RADIUS < 0 || simX + BUBBLE_RADIUS > CANVAS_WIDTH) {
            simVx = -simVx;
            simX = Math.max(BUBBLE_RADIUS, Math.min(CANVAS_WIDTH - BUBBLE_RADIUS, simX));
        }
        
        if (simY - BUBBLE_RADIUS <= 0) {
            ctx.lineTo(simX, simY);
            break;
        }
        
        let hit = false;
        for (let row = 0; row < grid.length; row++) {
            if (!grid[row]) continue;
            for (let col = 0; col < grid[row].length; col++) {
                const bubble = grid[row][col];
                if (bubble && !bubble.removing) {
                    const dx = simX - bubble.x;
                    const dy = simY - bubble.y;
                    if (Math.sqrt(dx * dx + dy * dy) < BUBBLE_RADIUS * 2) {
                        hit = true;
                        break;
                    }
                }
            }
            if (hit) break;
        }
        
        if (hit) {
            ctx.lineTo(simX, simY);
            break;
        }
        
        if (i % 3 === 0) {
            ctx.lineTo(simX, simY);
        }
    }
    
    ctx.stroke();
    ctx.restore();
}

function drawDangerLine() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.6)';
    ctx.setLineDash([10, 5]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, DANGER_LINE);
    ctx.lineTo(CANVAS_WIDTH, DANGER_LINE);
    ctx.stroke();
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#0c0c1e');
    bgGradient.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawDangerLine();
    
    for (let row = 0; row < grid.length; row++) {
        if (grid[row]) {
            for (let col = 0; col < grid[row].length; col++) {
                const bubble = grid[row][col];
                if (bubble) {
                    drawBubble(bubble.x, bubble.y, bubble, bubble.scale);
                }
            }
        }
    }
    
    for (const bubble of fallingBubbles) {
        drawBubble(bubble.x, bubble.y, bubble);
    }
    
    if (shootingBubble) {
        drawBubble(shootingBubble.x, shootingBubble.y, { colorData: shootingBubble.colorData });
    }
    
    drawShooter();
}

function update() {
    if (gameOver) return;
    
    updateShootingBubble();
    updateFallingBubbles();
    updateRemovingBubbles();
    checkGameOver();
    checkLevelComplete();
}

function updateShootingBubble() {
    if (!shootingBubble) return;
    
    shootingBubble.x += shootingBubble.vx;
    shootingBubble.y += shootingBubble.vy;
    
    if (shootingBubble.x - BUBBLE_RADIUS < 0) {
        shootingBubble.x = BUBBLE_RADIUS;
        shootingBubble.vx = -shootingBubble.vx;
    }
    if (shootingBubble.x + BUBBLE_RADIUS > CANVAS_WIDTH) {
        shootingBubble.x = CANVAS_WIDTH - BUBBLE_RADIUS;
        shootingBubble.vx = -shootingBubble.vx;
    }
    
    if (shootingBubble.y - BUBBLE_RADIUS <= 0) {
        stickBubbleToTop();
        return;
    }
    
    for (let row = 0; row < grid.length; row++) {
        if (!grid[row]) continue;
        for (let col = 0; col < grid[row].length; col++) {
            const bubble = grid[row][col];
            if (bubble && !bubble.removing) {
                const dx = shootingBubble.x - bubble.x;
                const dy = shootingBubble.y - bubble.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < BUBBLE_RADIUS * 2 - 2) {
                    stickBubble();
                    return;
                }
            }
        }
    }
}

function stickBubbleToTop() {
    const col = Math.floor((shootingBubble.x - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 2));
    const clampedCol = Math.max(0, Math.min(COLS - 1, col));
    
    if (!grid[0]) grid[0] = [];
    grid[0][clampedCol] = createBubble(0, clampedCol, shootingBubble.colorData);
    
    shootingBubble = null;
    afterShoot();
}

function stickBubble() {
    let bestRow = -1;
    let bestCol = -1;
    let minDist = Infinity;
    
    for (let row = 0; row < grid.length + 1; row++) {
        const colsInRow = row % 2 === 0 ? COLS : COLS - 1;
        for (let col = 0; col < colsInRow; col++) {
            if (grid[row] && grid[row][col]) continue;
            
            let hasNeighbor = false;
            const offsets = row % 2 === 0 ? evenRowOffsets : oddRowOffsets;
            for (const [dr, dc] of offsets) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && grid[nr] && nc >= 0 && nc < grid[nr].length && grid[nr][nc] && !grid[nr][nc].removing) {
                    hasNeighbor = true;
                    break;
                }
            }
            if (!hasNeighbor && row > 0) continue;
            
            const cellX = getBubbleX(row, col);
            const cellY = getBubbleY(row);
            const dx = shootingBubble.x - cellX;
            const dy = shootingBubble.y - cellY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDist) {
                minDist = dist;
                bestRow = row;
                bestCol = col;
            }
        }
    }
    
    if (bestRow < 0) {
        const targetRow = grid.length;
        const colsInRow = targetRow % 2 === 0 ? COLS : COLS - 1;
        bestRow = targetRow;
        bestCol = Math.floor((shootingBubble.x - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 2));
        bestCol = Math.max(0, Math.min(colsInRow - 1, bestCol));
    }
    
    if (!grid[bestRow]) grid[bestRow] = [];
    grid[bestRow][bestCol] = createBubble(bestRow, bestCol, shootingBubble.colorData);
    
    shootingBubble = null;
    afterShoot();
}

function afterShoot() {
    shootCount++;
    sightActive = false;
    document.getElementById('itemSight').classList.remove('active');
    
    const hadClear = checkAndRemoveBubbles();
    if (hadClear) {
        consecutiveClears++;
        if (consecutiveClears >= 2) {
            showCombo(consecutiveClears);
        }
    } else {
        consecutiveClears = 0;
    }
    
    const level = LEVELS[currentLevel - 1];
    if (shootCount % level.shootThreshold === 0) {
        pushDownBubbles();
    }
    
    saveHistory();
    
    currentBubble = nextBubble;
    nextBubble = getRandomBubbleColor(level);
    updateNextBubblePreview();
    
    scoreElement.textContent = score;
}

function saveHistory() {
    const state = {
        grid: JSON.parse(JSON.stringify(grid)),
        score,
        currentBubble: JSON.parse(JSON.stringify(currentBubble)),
        nextBubble: JSON.parse(JSON.stringify(nextBubble)),
        shootCount
    };
    history.push(state);
    if (history.length > 5) history.shift();
}

function checkAndRemoveBubbles() {
    let hadClear = false;
    
    for (let row = 0; row < grid.length; row++) {
        if (!grid[row]) continue;
        for (let col = 0; col < grid[row].length; col++) {
            const bubble = grid[row][col];
            if (bubble && !bubble.removing) {
                const connected = findConnectedBubbles(row, col, bubble.colorData);
                if (connected.length >= 3) {
                    const hasBomb = connected.some(b => b.colorData.type === 'special' && b.colorData.special === 'bomb');
                    
                    if (hasBomb) {
                        for (const b of connected) {
                            if (b.colorData.type === 'special' && b.colorData.special === 'bomb') {
                                triggerBomb(b.row, b.col);
                            }
                        }
                        hadClear = true;
                        return hadClear;
                    }
                    
                    const baseScore = connected.length * 10;
                    const multiplier = getScoreMultiplier(connected.length);
                    const comboBonus = consecutiveClears > 0 ? 50 * consecutiveClears : 0;
                    const totalScore = Math.floor(baseScore * multiplier) + comboBonus;
                    score += totalScore;
                    comboScore += comboBonus;
                    
                    for (const b of connected) {
                        handleSpecialOnRemove(b);
                        b.removing = true;
                        b.scale = 1;
                        removingBubbles.push(b);
                    }
                    
                    const timeoutId = setTimeout(() => {
                        for (const b of connected) {
                            if (grid[b.row] && grid[b.row][b.col]) {
                                if (b.colorData.type === 'special' && b.colorData.special === 'chain' && b.chainHp > 1) {
                                    b.chainHp--;
                                    b.removing = false;
                                    b.scale = 1;
                                    removingBubbles = removingBubbles.filter(rb => rb !== b);
                                } else {
                                    grid[b.row][b.col] = null;
                                }
                            }
                        }
                        removingBubbles = removingBubbles.filter(b => !connected.includes(b) || b.removing === false);
                        checkFallingBubbles();
                        activeTimeouts = activeTimeouts.filter(id => id !== timeoutId);
                    }, 300);
                    activeTimeouts.push(timeoutId);
                    
                    hadClear = true;
                    return hadClear;
                }
            }
        }
    }
    
    return hadClear;
}

function handleSpecialOnRemove(bubble) {
    if (bubble.colorData.type !== 'special') return;
    
    if (bubble.colorData.special === 'poison') {
        const offsets = bubble.row % 2 === 0 ? evenRowOffsets : oddRowOffsets;
        let converted = 0;
        for (const [dr, dc] of offsets) {
            if (converted >= 2) break;
            const nr = bubble.row + dr;
            const nc = bubble.col + dc;
            if (grid[nr] && grid[nr][nc] && !grid[nr][nc].removing && grid[nr][nc].colorData.type === 'normal') {
                grid[nr][nc].colorData = { type: 'special', special: 'poison' };
                converted++;
            }
        }
    }
}

function triggerBomb(row, col) {
    const affected = [];
    for (let r = Math.max(0, row - 1); r <= Math.min(grid.length - 1, row + 1); r++) {
        if (!grid[r]) continue;
        for (let c = 0; c < grid[r].length; c++) {
            const bubble = grid[r][c];
            if (bubble && !bubble.removing) {
                affected.push(bubble);
            }
        }
    }
    
    score += affected.length * 15;
    
    for (const b of affected) {
        b.removing = true;
        removingBubbles.push(b);
    }
    
    const timeoutId = setTimeout(() => {
        for (const b of affected) {
            if (grid[b.row] && grid[b.row][b.col]) {
                grid[b.row][b.col] = null;
            }
        }
        removingBubbles = removingBubbles.filter(b => !affected.includes(b));
        checkFallingBubbles();
        activeTimeouts = activeTimeouts.filter(id => id !== timeoutId);
    }, 300);
    activeTimeouts.push(timeoutId);
}

function getScoreMultiplier(count) {
    if (count >= 12) return 3;
    if (count >= 8) return 2;
    if (count >= 5) return 1.5;
    return 1;
}

function showCombo(count) {
    comboDisplay.textContent = `${count}连击! +${50 * count}分`;
    comboDisplay.style.animation = 'none';
    comboDisplay.offsetHeight;
    comboDisplay.style.animation = 'comboPopup 0.5s ease';
    setTimeout(() => {
        comboDisplay.textContent = '';
    }, 1500);
}

function findConnectedBubbles(startRow, startCol, colorData) {
    const visited = new Set();
    const connected = [];
    const queue = [[startRow, startCol]];
    
    while (queue.length > 0) {
        const [row, col] = queue.shift();
        const key = `${row},${col}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        const bubble = grid[row] && grid[row][col];
        if (!bubble || bubble.removing) continue;
        
        if (!colorsMatch(bubble.colorData, colorData)) continue;
        
        connected.push(bubble);
        
        const offsets = row % 2 === 0 ? evenRowOffsets : oddRowOffsets;
        for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && grid[newRow] && newCol >= 0 && newCol < grid[newRow].length) {
                queue.push([newRow, newCol]);
            }
        }
    }
    
    return connected;
}

function colorsMatch(c1, c2) {
    if (c1.type === 'special' && c1.special === 'rainbow') return true;
    if (c2.type === 'special' && c2.special === 'rainbow') return true;
    if (c1.type === 'special' || c2.type === 'special') return false;
    return c1.color === c2.color;
}

function checkFallingBubbles() {
    const connectedToTop = new Set();
    const queue = [];
    
    if (grid[0]) {
        for (let col = 0; col < grid[0].length; col++) {
            if (grid[0][col] && !grid[0][col].removing) {
                queue.push([0, col]);
            }
        }
    }
    
    while (queue.length > 0) {
        const [row, col] = queue.shift();
        const key = `${row},${col}`;
        
        if (connectedToTop.has(key)) continue;
        connectedToTop.add(key);
        
        const bubble = grid[row] && grid[row][col];
        if (!bubble || bubble.removing) continue;
        
        const offsets = row % 2 === 0 ? evenRowOffsets : oddRowOffsets;
        for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && grid[newRow] && newCol >= 0 && newCol < grid[newRow].length) {
                queue.push([newRow, newCol]);
            }
        }
    }
    
    for (let row = 0; row < grid.length; row++) {
        if (!grid[row]) continue;
        for (let col = 0; col < grid[row].length; col++) {
            const bubble = grid[row][col];
            if (bubble && !bubble.removing && !connectedToTop.has(`${row},${col}`)) {
                bubble.falling = true;
                bubble.vy = 0;
                fallingBubbles.push(bubble);
                grid[row][col] = null;
                score += 20;
            }
        }
    }
    
    scoreElement.textContent = score;
}

function updateFallingBubbles() {
    for (let i = fallingBubbles.length - 1; i >= 0; i--) {
        const bubble = fallingBubbles[i];
        bubble.vy += GRAVITY;
        bubble.y += bubble.vy;
        
        if (bubble.y > CANVAS_HEIGHT + BUBBLE_RADIUS) {
            fallingBubbles.splice(i, 1);
        }
    }
}

function updateRemovingBubbles() {
    for (let i = removingBubbles.length - 1; i >= 0; i--) {
        const bubble = removingBubbles[i];
        bubble.scale -= 0.05;
        if (bubble.scale <= 0) {
            removingBubbles.splice(i, 1);
        }
    }
}

function pushDownBubbles() {
    const oldGrid = grid;
    const newGrid = [];
    
    newGrid[0] = [];
    
    for (let oldRow = 0; oldRow < oldGrid.length; oldRow++) {
        if (!oldGrid[oldRow]) continue;
        const newRow = oldRow + 1;
        newGrid[newRow] = [];
        
        for (let oldCol = 0; oldCol < oldGrid[oldRow].length; oldCol++) {
            const bubble = oldGrid[oldRow][oldCol];
            if (!bubble) continue;
            
            const oldX = bubble.x;
            const newRowIsEven = newRow % 2 === 0;
            
            let candidateCols;
            if (oldRow % 2 === 0 && newRow % 2 === 1) {
                candidateCols = [oldCol - 1, oldCol];
            } else if (oldRow % 2 === 1 && newRow % 2 === 0) {
                candidateCols = [oldCol, oldCol + 1];
            } else {
                candidateCols = [oldCol];
            }
            
            const maxCol = newRowIsEven ? COLS - 1 : COLS - 2;
            let bestCol = candidateCols[0];
            let bestDiff = Infinity;
            
            for (const col of candidateCols) {
                if (col < 0 || col > maxCol) continue;
                const newX = getBubbleX(newRow, col);
                const diff = Math.abs(newX - oldX);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestCol = col;
                }
            }
            
            if (bestCol >= 0 && bestCol <= maxCol && !newGrid[newRow][bestCol]) {
                bubble.row = newRow;
                bubble.col = bestCol;
                bubble.x = getBubbleX(newRow, bestCol);
                bubble.y = getBubbleY(newRow);
                newGrid[newRow][bestCol] = bubble;
            }
        }
    }
    
    grid = newGrid;
    
    const level = LEVELS[currentLevel - 1];
    for (let col = 0; col < COLS; col++) {
        grid[0][col] = createBubble(0, col, getRandomBubbleColor(level));
    }
}

function checkGameOver() {
    for (let row = 0; row < grid.length; row++) {
        if (!grid[row]) continue;
        for (let col = 0; col < grid[row].length; col++) {
            const bubble = grid[row][col];
            if (bubble && !bubble.removing && bubble.y + BUBBLE_RADIUS >= DANGER_LINE) {
                gameOver = true;
                finalScoreElement.textContent = score;
                gameOverModal.classList.add('show');
                return;
            }
        }
    }
}

function checkLevelComplete() {
    if (gameOver) return;
    
    let hasBubbles = false;
    for (let row = 0; row < grid.length; row++) {
        if (!grid[row]) continue;
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col] && !grid[row][col].removing) {
                hasBubbles = true;
                break;
            }
        }
        if (hasBubbles) break;
    }
    
    if (!hasBubbles) {
        gameOver = true;
        showLevelComplete();
    }
}

function showLevelComplete() {
    const level = LEVELS[currentLevel - 1];
    let stars = 1;
    if (score >= level.targetScore * 2) stars = 3;
    else if (score >= level.targetScore * 1.5) stars = 2;
    
    if (currentLevel >= unlockedLevels && currentLevel < LEVELS.length) {
        unlockedLevels = currentLevel + 1;
    }
    
    if (!levelStars[currentLevel] || levelStars[currentLevel] < stars) {
        levelStars[currentLevel] = stars;
    }
    
    saveProgress();
    
    document.getElementById('resultTitle').textContent = '关卡通过!';
    document.getElementById('starsDisplay').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('resultScore').textContent = score;
    document.getElementById('resultCombo').textContent = comboScore;
    document.getElementById('resultItem').textContent = items.sight + items.undo + items.shuffle;
    
    resultModal.classList.add('show');
    
    if (currentLevel >= LEVELS.length) {
        document.getElementById('btnNext').style.display = 'none';
    }
}

function shoot() {
    if (shootingBubble || gameOver) return;
    
    shootingBubble = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 50,
        vx: Math.cos(angle) * BUBBLE_SPEED,
        vy: Math.sin(angle) * BUBBLE_SPEED,
        colorData: currentBubble,
        active: true
    };
}

function useItem(type) {
    if (gameOver || shootingBubble) return;
    if (items[type] <= 0) return;
    
    items[type]--;
    updateItemDisplay();
    
    switch (type) {
        case 'sight':
            sightActive = true;
            document.getElementById('itemSight').classList.add('active');
            break;
        case 'undo':
            if (history.length > 0) {
                const lastState = history.pop();
                grid = lastState.grid;
                score = lastState.score;
                currentBubble = lastState.currentBubble;
                nextBubble = lastState.nextBubble;
                shootCount = lastState.shootCount;
                scoreElement.textContent = score;
                updateNextBubblePreview();
                consecutiveClears = 0;
            }
            break;
        case 'shuffle':
            const level = LEVELS[currentLevel - 1];
            currentBubble = getRandomBubbleColor(level);
            break;
    }
}

function updateItemDisplay() {
    document.getElementById('countSight').textContent = items.sight;
    document.getElementById('countUndo').textContent = items.undo;
    document.getElementById('countShuffle').textContent = items.shuffle;
    
    document.getElementById('itemSight').disabled = items.sight <= 0;
    document.getElementById('itemUndo').disabled = items.undo <= 0;
    document.getElementById('itemShuffle').disabled = items.shuffle <= 0;
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const shooterX = CANVAS_WIDTH / 2;
    const shooterY = CANVAS_HEIGHT - 50;
    
    angle = Math.atan2(mouseY - shooterY, mouseX - shooterX);
    
    if (angle > -0.1) angle = -0.1;
    if (angle < -Math.PI + 0.1) angle = -Math.PI + 0.1;
});

canvas.addEventListener('click', shoot);

document.getElementById('itemSight').addEventListener('click', () => useItem('sight'));
document.getElementById('itemUndo').addEventListener('click', () => useItem('undo'));
document.getElementById('itemShuffle').addEventListener('click', () => useItem('shuffle'));

document.getElementById('backToLevelSelect').addEventListener('click', () => {
    gameScreenElement.style.display = 'none';
    levelSelectElement.style.display = 'block';
    renderLevelSelect();
});

document.getElementById('btnRetry').addEventListener('click', () => {
    resultModal.classList.remove('show');
    startLevel(currentLevel);
});

document.getElementById('btnNext').addEventListener('click', () => {
    resultModal.classList.remove('show');
    if (currentLevel < LEVELS.length) {
        startLevel(currentLevel + 1);
    }
});

document.getElementById('btnBack').addEventListener('click', () => {
    resultModal.classList.remove('show');
    gameScreenElement.style.display = 'none';
    levelSelectElement.style.display = 'block';
    renderLevelSelect();
});

document.getElementById('retryBtn').addEventListener('click', () => {
    gameOverModal.classList.remove('show');
    startLevel(currentLevel);
});

document.getElementById('backBtn').addEventListener('click', () => {
    gameOverModal.classList.remove('show');
    gameScreenElement.style.display = 'none';
    levelSelectElement.style.display = 'block';
    renderLevelSelect();
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

loadProgress();
renderLevelSelect();
gameLoop();
