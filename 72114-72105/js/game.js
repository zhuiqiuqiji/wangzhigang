const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const nextBubbleElement = document.getElementById('nextBubble');
const gameOverElement = document.getElementById('gameOver');
const gameOverTitle = document.getElementById('gameOverTitle');
const finalScoreElement = document.getElementById('finalScore');
const finalStarsElement = document.getElementById('finalStars');
const restartBtn = document.getElementById('restartBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const menuBtn = document.getElementById('menuBtn');
const menuOverlay = document.getElementById('menuOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const levelGrid = document.getElementById('levelGrid');
const comboDisplay = document.getElementById('comboDisplay');
const starsPanel = document.getElementById('starsPanel');

const BUBBLE_RADIUS = 20;
const BUBBLE_COLORS = ['#e94560', '#00d9ff', '#ffd700', '#7bed9f', '#a55eea'];
const SPECIAL_BUBBLES = ['bomb', 'rainbow'];
const COLS = 11;
const ROWS = 20;
const WARNING_LINE_Y = 450;

const LEVELS = [
    { rows: 4, colors: 3, target: 500, stars: [300, 500, 800], special: 0.05 },
    { rows: 5, colors: 4, target: 800, stars: [500, 800, 1200], special: 0.08 },
    { rows: 5, colors: 4, target: 1000, stars: [700, 1000, 1500], special: 0.1 },
    { rows: 6, colors: 4, target: 1200, stars: [800, 1200, 1800], special: 0.1 },
    { rows: 6, colors: 5, target: 1500, stars: [1000, 1500, 2200], special: 0.12 },
    { rows: 7, colors: 5, target: 1800, stars: [1200, 1800, 2600], special: 0.12 },
    { rows: 7, colors: 5, target: 2000, stars: [1500, 2000, 3000], special: 0.15, hidden: true },
    { rows: 8, colors: 5, target: 2500, stars: [1800, 2500, 3500], special: 0.15, hidden: true },
    { rows: 8, colors: 5, target: 3000, stars: [2200, 3000, 4000], special: 0.18, hidden: true },
    { rows: 9, colors: 5, target: 3500, stars: [2500, 3500, 5000], special: 0.2, hidden: true }
];

let bubbles = [];
let currentBubble = null;
let nextBubble = null;
let shootingBubble = null;
let score = 0;
let currentLevel = 1;
let isDragging = false;
let shootAngle = -Math.PI / 2;
let gameRunning = true;
let shooterX = canvas.width / 2;
let shooterY = canvas.height - 60;
let combo = 0;
let comboTimer = null;
let items = { aim: 3, undo: 3, swap: 3 };
let history = [];
let aimActive = false;
let levelProgress = JSON.parse(localStorage.getItem('bubbleGameProgress') || '{}');
let particles = [];
let floatTexts = [];

function initGame(level = currentLevel) {
    currentLevel = level;
    const levelData = LEVELS[level - 1];
    const availableColors = BUBBLE_COLORS.slice(0, levelData.colors);
    
    bubbles = [];
    score = 0;
    gameRunning = true;
    shootingBubble = null;
    combo = 0;
    particles = [];
    floatTexts = [];
    history = [];
    
    for (let row = 0; row < levelData.rows; row++) {
        for (let col = 0; col < COLS; col++) {
            if (row % 2 === 1 && col === COLS - 1) continue;
            const x = getBubbleX(col, row);
            const y = getBubbleY(row);
            
            let bubbleType = 'normal';
            let bubbleColor = availableColors[Math.floor(Math.random() * availableColors.length)];
            
            if (Math.random() < levelData.special) {
                bubbleType = SPECIAL_BUBBLES[Math.floor(Math.random() * SPECIAL_BUBBLES.length)];
            }
            
            bubbles.push({
                x,
                y,
                color: bubbleColor,
                row,
                col,
                type: bubbleType
            });
        }
    }
    
    currentBubble = createRandomBubble(availableColors, levelData.special);
    nextBubble = createRandomBubble(availableColors, levelData.special);
    
    levelElement.textContent = level;
    updateNextBubblePreview();
    updateScore();
    updateStars();
    updateItemsUI();
    generateLevelGrid();
    
    gameOverElement.style.display = 'none';
    menuOverlay.classList.remove('active');
}

function createRandomBubble(colors, specialChance) {
    let type = 'normal';
    let color = colors[Math.floor(Math.random() * colors.length)];
    
    if (Math.random() < specialChance) {
        type = SPECIAL_BUBBLES[Math.floor(Math.random() * SPECIAL_BUBBLES.length)];
    }
    
    return { color, type };
}

function getBubbleX(col, row) {
    const offset = row % 2 === 1 ? BUBBLE_RADIUS : 0;
    return BUBBLE_RADIUS + col * BUBBLE_RADIUS * 2 + offset;
}

function getBubbleY(row) {
    return BUBBLE_RADIUS + row * BUBBLE_RADIUS * 1.8;
}

function updateNextBubblePreview() {
    if (nextBubble.type === 'bomb') {
        nextBubbleElement.style.background = 'radial-gradient(circle at 30% 30%, #333, #000)';
        nextBubbleElement.innerHTML = '💣';
        nextBubbleElement.style.display = 'flex';
        nextBubbleElement.style.alignItems = 'center';
        nextBubbleElement.style.justifyContent = 'center';
        nextBubbleElement.style.fontSize = '20px';
    } else if (nextBubble.type === 'rainbow') {
        nextBubbleElement.style.background = 'linear-gradient(45deg, #e94560, #ffd700, #7bed9f, #00d9ff, #a55eea)';
        nextBubbleElement.innerHTML = '🌈';
        nextBubbleElement.style.display = 'flex';
        nextBubbleElement.style.alignItems = 'center';
        nextBubbleElement.style.justifyContent = 'center';
        nextBubbleElement.style.fontSize = '20px';
    } else {
        nextBubbleElement.style.background = `radial-gradient(circle at 30% 30%, ${lightenColor(nextBubble.color, 30)}, ${nextBubble.color})`;
        nextBubbleElement.innerHTML = '';
    }
}

function updateScore() {
    scoreElement.textContent = score;
    updateStars();
}

function updateStars() {
    const levelData = LEVELS[currentLevel - 1];
    const stars = [star1, star2, star3];
    
    levelData.stars.forEach((target, i) => {
        if (score >= target) {
            stars[i].classList.add('earned');
        } else {
            stars[i].classList.remove('earned');
        }
    });
}

function updateItemsUI() {
    document.getElementById('aimCount').textContent = items.aim;
    document.getElementById('undoCount').textContent = items.undo;
    document.getElementById('swapCount').textContent = items.swap;
    
    document.getElementById('itemAim').disabled = items.aim <= 0;
    document.getElementById('itemUndo').disabled = items.undo <= 0 || history.length === 0;
    document.getElementById('itemSwap').disabled = items.swap <= 0;
    
    document.getElementById('itemAim').classList.toggle('active', aimActive);
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`;
}

function drawBubble(x, y, color, type = 'normal') {
    ctx.save();
    
    if (type === 'bomb') {
        const gradient = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, BUBBLE_RADIUS);
        gradient.addColorStop(0, '#555');
        gradient.addColorStop(0.5, '#222');
        gradient.addColorStop(1, '#000');
        
        ctx.beginPath();
        ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', x, y);
    } else if (type === 'rainbow') {
        const gradient = ctx.createLinearGradient(x - BUBBLE_RADIUS, y - BUBBLE_RADIUS, x + BUBBLE_RADIUS, y + BUBBLE_RADIUS);
        gradient.addColorStop(0, '#e94560');
        gradient.addColorStop(0.25, '#ffd700');
        gradient.addColorStop(0.5, '#7bed9f');
        gradient.addColorStop(0.75, '#00d9ff');
        gradient.addColorStop(1, '#a55eea');
        
        ctx.beginPath();
        ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌈', x, y);
    } else {
        const gradient = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, BUBBLE_RADIUS);
        gradient.addColorStop(0, lightenColor(color, 50));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, lightenColor(color, -30));
        
        ctx.beginPath();
        ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x - 6, y - 6, BUBBLE_RADIUS * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }
    
    ctx.restore();
}

function drawShooter() {
    ctx.strokeStyle = aimActive ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = aimActive ? 4 : 3;
    ctx.setLineDash(aimActive ? [] : [10, 5]);
    ctx.beginPath();
    ctx.moveTo(shooterX, shooterY);
    const lineLength = 100;
    ctx.lineTo(shooterX + Math.cos(shootAngle) * lineLength, shooterY + Math.sin(shootAngle) * lineLength);
    ctx.stroke();
    ctx.setLineDash([]);
    
    drawTrajectoryPreview();
    drawBubble(shooterX, shooterY, currentBubble.color, currentBubble.type);
}

function drawTrajectoryPreview() {
    if (!aimActive) return;
    
    let px = shooterX;
    let py = shooterY;
    let vx = Math.cos(shootAngle) * 8;
    let vy = Math.sin(shootAngle) * 8;
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    
    for (let i = 0; i < 150; i++) {
        px += vx;
        py += vy;
        
        if (px <= BUBBLE_RADIUS || px >= canvas.width - BUBBLE_RADIUS) {
            vx *= -1;
            px = Math.max(BUBBLE_RADIUS, Math.min(canvas.width - BUBBLE_RADIUS, px));
        }
        
        if (py <= BUBBLE_RADIUS) break;
        
        let hit = false;
        for (const bubble of bubbles) {
            const dx = px - bubble.x;
            const dy = py - bubble.y;
            if (Math.sqrt(dx * dx + dy * dy) < BUBBLE_RADIUS * 2) {
                hit = true;
                break;
            }
        }
        if (hit) break;
        
        if (i % 3 === 0) {
            ctx.lineTo(px, py);
        }
    }
    
    ctx.stroke();
}

function drawWarningLine() {
    ctx.strokeStyle = 'rgba(233, 69, 96, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, WARNING_LINE_Y);
    ctx.lineTo(canvas.width, WARNING_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawParticles() {
    particles = particles.filter(p => p.life > 0);
    
    particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
    });
    
    ctx.globalAlpha = 1;
}

function drawFloatTexts() {
    floatTexts = floatTexts.filter(t => t.life > 0);
    
    floatTexts.forEach(t => {
        ctx.globalAlpha = t.life / t.maxLife;
        ctx.fillStyle = t.color;
        ctx.font = `bold ${t.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        
        t.y -= 1;
        t.life--;
    });
    
    ctx.globalAlpha = 1;
}

function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            color,
            size: Math.random() * 4 + 2,
            life: 30,
            maxLife: 30
        });
    }
}

function createFloatText(x, y, text, color = '#ffd700', size = 24) {
    floatTexts.push({
        x,
        y,
        text,
        color,
        size,
        life: 60,
        maxLife: 60
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawWarningLine();
    
    bubbles.forEach(bubble => {
        drawBubble(bubble.x, bubble.y, bubble.color, bubble.type);
    });
    
    if (shootingBubble) {
        drawBubble(shootingBubble.x, shootingBubble.y, shootingBubble.color, shootingBubble.type);
    }
    
    drawShooter();
    drawParticles();
    drawFloatTexts();
}

function getNeighbors(bubble) {
    const directions = bubble.row % 2 === 0 ? [
        [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
    ] : [
        [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
    ];
    
    const neighbors = [];
    directions.forEach(([dr, dc]) => {
        const neighbor = bubbles.find(b => b.row === bubble.row + dr && b.col === bubble.col + dc);
        if (neighbor) neighbors.push(neighbor);
    });
    return neighbors;
}

function findConnectedBubbles(startBubble, targetColor) {
    const visited = new Set();
    const queue = [startBubble];
    const connected = [];
    
    while (queue.length > 0) {
        const bubble = queue.shift();
        const key = `${bubble.row},${bubble.col}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (bubble.type === 'rainbow') {
            connected.push(bubble);
        } else if (bubble.color === targetColor) {
            connected.push(bubble);
        } else {
            continue;
        }
        
        const neighbors = getNeighbors(bubble);
        neighbors.forEach(n => {
            if (!visited.has(`${n.row},${n.col}`)) {
                queue.push(n);
            }
        });
    }
    
    return connected;
}

function findRainbowMatches(rainbowBubble) {
    let maxGroup = [];
    
    BUBBLE_COLORS.forEach(color => {
        const group = findConnectedBubbles(rainbowBubble, color);
        if (group.length > maxGroup.length) {
            maxGroup = group;
        }
    });
    
    return maxGroup;
}

function findBombBlast(bubble) {
    const affected = [];
    const range = BUBBLE_RADIUS * 3.5;
    
    bubbles.forEach(b => {
        const dx = b.x - bubble.x;
        const dy = b.y - bubble.y;
        if (Math.sqrt(dx * dx + dy * dy) <= range) {
            affected.push(b);
        }
    });
    
    return affected;
}

function findFloatingBubbles() {
    const visited = new Set();
    const queue = [];
    
    bubbles.forEach(bubble => {
        if (bubble.row === 0) {
            queue.push(bubble);
        }
    });
    
    if (queue.length === 0) {
        return [...bubbles];
    }
    
    while (queue.length > 0) {
        const bubble = queue.shift();
        const key = `${bubble.row},${bubble.col}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        const neighbors = getNeighbors(bubble);
        neighbors.forEach(n => {
            if (!visited.has(`${n.row},${n.col}`)) {
                queue.push(n);
            }
        });
    }
    
    return bubbles.filter(bubble => !visited.has(`${bubble.row},${bubble.col}`));
}

function snapBubbleToGrid(shootingBubble) {
    let closestRow = 0;
    let closestCol = 0;
    let minDist = Infinity;
    
    for (let row = 0; row < ROWS; row++) {
        const colsInRow = row % 2 === 0 ? COLS : COLS - 1;
        for (let col = 0; col < colsInRow; col++) {
            const x = getBubbleX(col, row);
            const y = getBubbleY(row);
            const dist = Math.sqrt((shootingBubble.x - x) ** 2 + (shootingBubble.y - y) ** 2);
            
            if (dist < minDist && !bubbles.find(b => b.row === row && b.col === col)) {
                minDist = dist;
                closestRow = row;
                closestCol = col;
            }
        }
    }
    
    const newBubble = {
        x: getBubbleX(closestCol, closestRow),
        y: getBubbleY(closestRow),
        color: shootingBubble.color,
        row: closestRow,
        col: closestCol,
        type: shootingBubble.type
    };
    
    bubbles.push(newBubble);
    return newBubble;
}

function handleCollision() {
    history.push({
        bubbles: JSON.parse(JSON.stringify(bubbles)),
        score,
        currentBubble: { ...currentBubble },
        nextBubble: { ...nextBubble }
    });
    if (history.length > 5) history.shift();
    
    const newBubble = snapBubbleToGrid(shootingBubble);
    shootingBubble = null;
    
    let toRemove = [];
    
    if (newBubble.type === 'bomb') {
        toRemove = findBombBlast(newBubble);
        combo++;
    } else if (newBubble.type === 'rainbow') {
        toRemove = findRainbowMatches(newBubble);
        if (toRemove.length >= 3) combo++;
    } else {
        const connected = findConnectedBubbles(newBubble, newBubble.color);
        if (connected.length >= 3) {
            toRemove = connected;
            combo++;
        }
    }
    
    if (toRemove.length > 0) {
        toRemove.forEach(bubble => {
            const index = bubbles.findIndex(b => b.row === bubble.row && b.col === bubble.col);
            if (index !== -1) {
                createParticles(bubbles[index].x, bubbles[index].y, bubbles[index].color, 15);
                bubbles.splice(index, 1);
            }
        });
        
        const baseScore = toRemove.length * 10;
        const comboMultiplier = Math.min(combo, 5);
        const earnedScore = baseScore * comboMultiplier;
        score += earnedScore;
        
        createFloatText(newBubble.x, newBubble.y - 30, `+${earnedScore}`, combo > 1 ? '#ffd700' : '#00d9ff');
        
        if (combo > 1) {
            showCombo(combo);
        }
        
        const floating = findFloatingBubbles();
        floating.forEach(bubble => {
            const index = bubbles.findIndex(b => b.row === bubble.row && b.col === bubble.col);
            if (index !== -1) {
                createParticles(bubbles[index].x, bubbles[index].y, bubbles[index].color, 10);
                bubbles.splice(index, 1);
            }
        });
        
        score += floating.length * 20;
        if (floating.length > 0) {
            createFloatText(newBubble.x, newBubble.y - 60, `掉落 +${floating.length * 20}`, '#7bed9f');
        }
        
        updateScore();
    } else {
        combo = 0;
    }
    
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        combo = 0;
        hideCombo();
    }, 3000);
    
    checkGameOver();
    
    if (gameRunning) {
        const levelData = LEVELS[currentLevel - 1];
        const availableColors = BUBBLE_COLORS.slice(0, levelData.colors);
        
        currentBubble = nextBubble;
        nextBubble = createRandomBubble(availableColors, levelData.special);
        updateNextBubblePreview();
        updateItemsUI();
    }
}

function showCombo(count) {
    comboDisplay.textContent = `${count}x COMBO!`;
    comboDisplay.classList.add('active');
}

function hideCombo() {
    comboDisplay.classList.remove('active');
}

function checkGameOver() {
    const lowestBubble = bubbles.reduce((max, b) => Math.max(max, b.y), 0);
    
    if (lowestBubble >= WARNING_LINE_Y) {
        endGame(false);
    } else if (bubbles.length === 0) {
        endGame(true);
    }
}

function endGame(victory) {
    gameRunning = false;
    finalScoreElement.textContent = score;
    
    if (victory) {
        gameOverTitle.textContent = '🎉 关卡完成！';
        gameOverElement.classList.add('victory');
        
        const levelData = LEVELS[currentLevel - 1];
        let starsEarned = 0;
        levelData.stars.forEach(target => {
            if (score >= target) starsEarned++;
        });
        
        const prevStars = levelProgress[currentLevel] || 0;
        if (starsEarned > prevStars) {
            levelProgress[currentLevel] = starsEarned;
        }
        
        if (starsEarned >= 1 && currentLevel < LEVELS.length) {
            levelProgress[currentLevel + 1] = levelProgress[currentLevel + 1] || 0;
        }
        
        localStorage.setItem('bubbleGameProgress', JSON.stringify(levelProgress));
        
        const stars = finalStarsElement.querySelectorAll('.star');
        stars.forEach((star, i) => {
            star.classList.toggle('earned', i < starsEarned);
        });
        
        nextLevelBtn.style.display = currentLevel < LEVELS.length ? 'block' : 'none';
    } else {
        gameOverTitle.textContent = '游戏结束';
        gameOverElement.classList.remove('victory');
        finalStarsElement.querySelectorAll('.star').forEach(star => star.classList.remove('earned'));
        nextLevelBtn.style.display = 'none';
    }
    
    gameOverElement.style.display = 'block';
    generateLevelGrid();
}

function update() {
    if (!gameRunning) return;
    
    if (shootingBubble) {
        shootingBubble.x += shootingBubble.vx;
        shootingBubble.y += shootingBubble.vy;
        
        if (shootingBubble.x <= BUBBLE_RADIUS || shootingBubble.x >= canvas.width - BUBBLE_RADIUS) {
            shootingBubble.vx *= -1;
            shootingBubble.x = Math.max(BUBBLE_RADIUS, Math.min(canvas.width - BUBBLE_RADIUS, shootingBubble.x));
        }
        
        if (shootingBubble.y <= BUBBLE_RADIUS) {
            handleCollision();
        } else {
            for (const bubble of bubbles) {
                const dx = shootingBubble.x - bubble.x;
                const dy = shootingBubble.y - bubble.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < BUBBLE_RADIUS * 2) {
                    handleCollision();
                    break;
                }
            }
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touches = e.touches && e.touches.length > 0 ? e.touches : e.changedTouches;
    const clientX = touches ? touches[0].clientX : e.clientX;
    const clientY = touches ? touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function updateAngle(pos) {
    const dx = pos.x - shooterX;
    const dy = pos.y - shooterY;
    let angle = Math.atan2(dy, dx);
    
    if (angle > -0.2) angle = -0.2;
    if (angle < -Math.PI + 0.2) angle = -Math.PI + 0.2;
    
    shootAngle = angle;
}

function shoot() {
    if (shootingBubble || !gameRunning) return;
    
    const speed = 12;
    shootingBubble = {
        x: shooterX,
        y: shooterY,
        vx: Math.cos(shootAngle) * speed,
        vy: Math.sin(shootAngle) * speed,
        color: currentBubble.color,
        type: currentBubble.type
    };
    
    aimActive = false;
    updateItemsUI();
}

function useItem(item) {
    if (items[item] <= 0) return;
    
    switch (item) {
        case 'aim':
            aimActive = !aimActive;
            if (aimActive) items.aim--;
            break;
        case 'undo':
            if (history.length > 0) {
                const last = history.pop();
                bubbles = last.bubbles;
                score = last.score;
                currentBubble = last.currentBubble;
                nextBubble = last.nextBubble;
                items.undo--;
                updateScore();
                updateNextBubblePreview();
            }
            break;
        case 'swap':
            const temp = currentBubble;
            currentBubble = nextBubble;
            nextBubble = temp;
            items.swap--;
            updateNextBubblePreview();
            break;
    }
    
    updateItemsUI();
}

function generateLevelGrid() {
    levelGrid.innerHTML = '';
    
    LEVELS.forEach((level, i) => {
        const levelNum = i + 1;
        const isUnlocked = i === 0 || levelProgress[levelNum] !== undefined || (levelProgress[levelNum - 1] || 0) >= 1;
        const stars = levelProgress[levelNum] || 0;
        
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.textContent = levelNum;
        
        if (!isUnlocked || level.hidden && !isUnlocked) {
            btn.classList.add('locked');
            btn.textContent = '🔒';
        } else {
            if (stars > 0) {
                btn.classList.add('completed');
                const starsSpan = document.createElement('span');
                starsSpan.className = 'mini-stars';
                starsSpan.textContent = '★'.repeat(stars);
                btn.appendChild(starsSpan);
            }
            
            btn.addEventListener('click', () => {
                initGame(levelNum);
            });
        }
        
        levelGrid.appendChild(btn);
    });
}

function setTheme(theme) {
    document.body.className = '';
    if (theme !== 'classic') {
        document.body.classList.add(`theme-${theme}`);
    }
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    localStorage.setItem('bubbleGameTheme', theme);
}

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateAngle(getEventPos(e));
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        updateAngle(getEventPos(e));
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        shoot();
    }
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDragging = true;
    updateAngle(getEventPos(e));
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDragging) {
        updateAngle(getEventPos(e));
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (isDragging) {
        isDragging = false;
        shoot();
    }
});

restartBtn.addEventListener('click', () => initGame(currentLevel));
nextLevelBtn.addEventListener('click', () => initGame(currentLevel + 1));

menuBtn.addEventListener('click', () => {
    menuOverlay.classList.add('active');
    generateLevelGrid();
});

resumeBtn.addEventListener('click', () => {
    menuOverlay.classList.remove('active');
});

document.querySelectorAll('.item-btn').forEach(btn => {
    btn.addEventListener('click', () => useItem(btn.dataset.item));
});

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
});

const savedTheme = localStorage.getItem('bubbleGameTheme') || 'classic';
setTheme(savedTheme);

initGame();
gameLoop();
