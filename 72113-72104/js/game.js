const CELL_SIZE = 40;
const BOARD_SIZE = 600;
const PLANE_RADIUS = 12;

const PLAYER_COLORS = ['#ff4444', '#44ff44', '#ffff44', '#4444ff'];
const PLAYER_NAMES = ['红方', '绿方', '黄方', '蓝方'];

const TOTAL_CELLS = 52;
const FINAL_PATH_LENGTH = 5;
const TOTAL_STEPS_TO_WIN = 57;

const THEMES = {
    classic: {
        bg: '#ffffff',
        path: '#f0f0f0',
        border: '#333',
        homeColors: ['#ffcccc', '#ccffcc', '#ffffcc', '#ccccff']
    },
    ocean: {
        bg: '#e0f7fa',
        path: '#b2ebf2',
        border: '#006064',
        homeColors: ['#ffcdd2', '#c8e6c9', '#fff9c4', '#bbdefb']
    },
    forest: {
        bg: '#e8f5e9',
        path: '#c8e6c9',
        border: '#2e7d32',
        homeColors: ['#ffccbc', '#dcedc8', '#f0f4c3', '#b2dfdb']
    },
    neon: {
        bg: '#1a1a2e',
        path: '#16213e',
        border: '#e94560',
        homeColors: ['#e9456040', '#0f346040', '#53348340', '#e9456040']
    }
};

const SKINS = {
    classic: { shape: 'circle', symbol: null },
    star: { shape: 'star', symbol: '★' },
    heart: { shape: 'heart', symbol: '♥' },
    diamond: { shape: 'diamond', symbol: '◆' }
};

class FlyingChess {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.currentPlayer = 0;
        this.diceValue = 1;
        this.diceValue2 = null;
        this.isRolling = false;
        this.gameOver = false;
        this.gameStarted = false;
        this.selectedPlane = null;
        this.movablePlanes = [];
        
        this.currentTheme = 'classic';
        this.currentSkin = 'classic';
        
        this.aiPlayers = {
            1: { enabled: true, strategy: 'balanced' },
            2: { enabled: true, strategy: 'balanced' },
            3: { enabled: true, strategy: 'balanced' }
        };
        
        this.items = {
            fixedDice: 2,
            doubleDice: 2,
            shield: 2
        };
        this.activeItem = null;
        this.shields = [false, false, false, false];
        
        this.combos = [0, 0, 0, 0];
        this.revengeAvailable = null;
        this.revengeTarget = null;
        
        this.achievements = this.loadAchievements();
        this.replayData = [];
        this.currentReplayStep = 0;
        this.isReplaying = false;
        
        this.players = [];
        for (let i = 0; i < 4; i++) {
            this.players.push({
                planes: Array(4).fill(null).map(() => ({
                    position: -1,
                    isFinished: false
                })),
                finishedCount: 0
            });
        }

        this.pathPositions = this.generatePathPositions();
        this.homePositions = this.generateHomePositions();
        this.finalPathPositions = this.generateFinalPathPositions();
        this.startPositions = this.generateStartPositions();
        
        this.init();
    }

    generatePathPositions() {
        const positions = [];
        const centerX = BOARD_SIZE / 2;
        const centerY = BOARD_SIZE / 2;
        
        for (let i = 0; i < 13; i++) {
            positions.push({ x: centerX + (6 - i) * CELL_SIZE, y: centerY - CELL_SIZE });
        }
        for (let i = 0; i < 13; i++) {
            positions.push({ x: centerX - CELL_SIZE, y: centerY - (6 - i) * CELL_SIZE });
        }
        for (let i = 0; i < 13; i++) {
            positions.push({ x: centerX - (6 - i) * CELL_SIZE, y: centerY + CELL_SIZE });
        }
        for (let i = 0; i < 13; i++) {
            positions.push({ x: centerX + CELL_SIZE, y: centerY + (6 - i) * CELL_SIZE });
        }
        
        return positions;
    }

    generateHomePositions() {
        const homes = [];
        const offsets = [
            { x: 2, y: 2 },
            { x: 9, y: 2 },
            { x: 9, y: 9 },
            { x: 2, y: 9 }
        ];
        
        for (let p = 0; p < 4; p++) {
            const homePlanes = [];
            const baseX = offsets[p].x * CELL_SIZE + CELL_SIZE;
            const baseY = offsets[p].y * CELL_SIZE + CELL_SIZE;
            const planePositions = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: 1, y: 1 }
            ];
            
            for (let i = 0; i < 4; i++) {
                homePlanes.push({
                    x: baseX + planePositions[i].x * CELL_SIZE,
                    y: baseY + planePositions[i].y * CELL_SIZE
                });
            }
            homes.push(homePlanes);
        }
        return homes;
    }

    generateFinalPathPositions() {
        const finalPaths = [];
        const centerX = BOARD_SIZE / 2;
        const centerY = BOARD_SIZE / 2;
        
        finalPaths.push([]);
        for (let i = 1; i <= 5; i++) {
            finalPaths[0].push({ x: centerX - i * CELL_SIZE, y: centerY });
        }
        
        finalPaths.push([]);
        for (let i = 1; i <= 5; i++) {
            finalPaths[1].push({ x: centerX, y: centerY - i * CELL_SIZE });
        }
        
        finalPaths.push([]);
        for (let i = 1; i <= 5; i++) {
            finalPaths[2].push({ x: centerX + i * CELL_SIZE, y: centerY });
        }
        
        finalPaths.push([]);
        for (let i = 1; i <= 5; i++) {
            finalPaths[3].push({ x: centerX, y: centerY + i * CELL_SIZE });
        }
        
        return finalPaths;
    }

    generateStartPositions() {
        return [0, 13, 26, 39];
    }

    init() {
        this.drawBoard();
        this.drawPlanes();
        this.bindEvents();
        this.updateUI();
        this.updateAchievementsUI();
        this.addLog('点击"开始游戏"按钮开始！');
    }

    drawBoard() {
        const theme = THEMES[this.currentTheme];
        
        this.ctx.fillStyle = theme.bg;
        this.ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
        
        this.drawHomeAreas();
        this.drawPath();
        this.drawFinalPaths();
        this.drawCenter();
    }

    drawHomeAreas() {
        const theme = THEMES[this.currentTheme];
        const offsets = [
            { x: 1, y: 1 },
            { x: 10, y: 1 },
            { x: 10, y: 10 },
            { x: 1, y: 10 }
        ];
        
        for (let p = 0; p < 4; p++) {
            this.ctx.fillStyle = theme.homeColors[p];
            this.ctx.fillRect(
                offsets[p].x * CELL_SIZE,
                offsets[p].y * CELL_SIZE,
                CELL_SIZE * 4,
                CELL_SIZE * 4
            );
            
            this.ctx.strokeStyle = theme.border;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                offsets[p].x * CELL_SIZE,
                offsets[p].y * CELL_SIZE,
                CELL_SIZE * 4,
                CELL_SIZE * 4
            );
        }
    }

    drawPath() {
        const theme = THEMES[this.currentTheme];
        const specialPositions = [0, 13, 26, 39];
        const safePositions = [0, 8, 13, 21, 26, 34, 39, 47];
        
        for (let i = 0; i < this.pathPositions.length; i++) {
            const pos = this.pathPositions[i];
            
            let color = theme.path;
            if (specialPositions.includes(i)) {
                const playerIndex = specialPositions.indexOf(i);
                color = PLAYER_COLORS[playerIndex] + '40';
            } else if (safePositions.includes(i)) {
                color = '#e0e0e0';
            }
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(
                pos.x - CELL_SIZE / 2,
                pos.y - CELL_SIZE / 2,
                CELL_SIZE,
                CELL_SIZE
            );
            
            this.ctx.strokeStyle = '#999';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                pos.x - CELL_SIZE / 2,
                pos.y - CELL_SIZE / 2,
                CELL_SIZE,
                CELL_SIZE
            );
            
            if (safePositions.includes(i) && !specialPositions.includes(i)) {
                this.ctx.fillStyle = '#999';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    drawFinalPaths() {
        for (let p = 0; p < 4; p++) {
            for (let i = 0; i < this.finalPathPositions[p].length; i++) {
                const pos = this.finalPathPositions[p][i];
                
                this.ctx.fillStyle = PLAYER_COLORS[p] + '40';
                this.ctx.fillRect(
                    pos.x - CELL_SIZE / 2,
                    pos.y - CELL_SIZE / 2,
                    CELL_SIZE,
                    CELL_SIZE
                );
                
                this.ctx.strokeStyle = PLAYER_COLORS[p];
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    pos.x - CELL_SIZE / 2,
                    pos.y - CELL_SIZE / 2,
                    CELL_SIZE,
                    CELL_SIZE
                );
            }
        }
    }

    drawCenter() {
        const theme = THEMES[this.currentTheme];
        const centerX = BOARD_SIZE / 2;
        const centerY = BOARD_SIZE / 2;
        
        this.ctx.fillStyle = theme.bg;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - CELL_SIZE);
        this.ctx.lineTo(centerX + CELL_SIZE, centerY);
        this.ctx.lineTo(centerX, centerY + CELL_SIZE);
        this.ctx.lineTo(centerX - CELL_SIZE, centerY);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.strokeStyle = theme.border;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        const colors = [PLAYER_COLORS[0], PLAYER_COLORS[1], PLAYER_COLORS[2], PLAYER_COLORS[3]];
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) - Math.PI / 4;
            this.ctx.fillStyle = colors[i];
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, CELL_SIZE / 2, angle, angle + Math.PI / 2);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawPlanes() {
        for (let p = 0; p < 4; p++) {
            for (let i = 0; i < 4; i++) {
                const plane = this.players[p].planes[i];
                if (plane.isFinished) continue;
                let pos;
                
                if (plane.position === -1) {
                    pos = this.homePositions[p][i];
                } else if (plane.position >= TOTAL_CELLS) {
                    const finalIndex = plane.position - TOTAL_CELLS;
                    pos = this.finalPathPositions[p][finalIndex];
                } else {
                    const actualPos = (plane.position + this.startPositions[p]) % TOTAL_CELLS;
                    pos = this.pathPositions[actualPos];
                }
                
                const isSelected = this.selectedPlane && 
                                   this.selectedPlane.player === p && 
                                   this.selectedPlane.planeIndex === i;
                const isMovable = this.movablePlanes.some(
                    mp => mp.player === p && mp.planeIndex === i
                );
                
                this.drawPlane(pos.x, pos.y, PLAYER_COLORS[p], isSelected, isMovable, i + 1, this.shields[p]);
            }
        }
    }

    drawPlane(x, y, color, isSelected, isMovable, number, hasShield) {
        if (isMovable) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, PLANE_RADIUS + 5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            this.ctx.fill();
        }
        
        if (hasShield) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, PLANE_RADIUS + 8, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#00bfff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        if (isSelected) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, PLANE_RADIUS + 4, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        const skin = SKINS[this.currentSkin];
        
        if (skin.shape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(x, y, PLANE_RADIUS, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else {
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = color;
            this.ctx.fillText(skin.symbol, x, y);
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            this.ctx.strokeText(skin.symbol, x, y);
        }
        
        this.ctx.fillStyle = '#fff';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(number.toString(), x, y);
        this.ctx.strokeText(number.toString(), x, y);
    }

    bindEvents() {
        document.getElementById('rollDiceBtn').addEventListener('click', () => this.rollDice());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTheme = e.target.dataset.theme;
                this.drawBoard();
                this.drawPlanes();
            });
        });
        
        document.querySelectorAll('.skin-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentSkin = e.target.dataset.skin;
                this.drawBoard();
                this.drawPlanes();
            });
        });
        
        document.querySelectorAll('.item-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                if (!this.gameStarted || this.gameOver || this.isRolling) return;
                if (this.currentPlayer !== 0) return;
                
                const item = slot.dataset.item;
                if (this.items[item] > 0) {
                    this.useItem(item);
                }
            });
        });
        
        document.querySelectorAll('.dice-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = parseInt(e.target.dataset.value);
                this.confirmFixedDice(value);
            });
        });
        
        document.getElementById('cancelFixedDice').addEventListener('click', () => {
            document.getElementById('fixedDiceModal').classList.remove('show');
            this.activeItem = null;
        });
        
        document.getElementById('revengeYes').addEventListener('click', () => this.useRevenge(true));
        document.getElementById('revengeNo').addEventListener('click', () => this.useRevenge(false));
        
        document.getElementById('saveReplayBtn').addEventListener('click', () => this.saveReplay());
        document.getElementById('loadReplayBtn').addEventListener('click', () => this.loadReplay());
    }

    startGame() {
        this.aiPlayers[1].enabled = document.getElementById('ai1').checked;
        this.aiPlayers[1].strategy = document.getElementById('ai1Strategy').value;
        this.aiPlayers[2].enabled = document.getElementById('ai2').checked;
        this.aiPlayers[2].strategy = document.getElementById('ai2Strategy').value;
        this.aiPlayers[3].enabled = document.getElementById('ai3').checked;
        this.aiPlayers[3].strategy = document.getElementById('ai3Strategy').value;
        
        this.gameStarted = true;
        document.getElementById('startGameBtn').textContent = '游戏进行中...';
        document.getElementById('startGameBtn').disabled = true;
        
        document.getElementById('playerType1').textContent = this.aiPlayers[1].enabled ? 'AI' : '玩家';
        document.getElementById('playerType2').textContent = this.aiPlayers[2].enabled ? 'AI' : '玩家';
        document.getElementById('playerType3').textContent = this.aiPlayers[3].enabled ? 'AI' : '玩家';
        
        this.addLog('游戏开始！红方先掷骰子。');
        this.updateUI();
        
        if (this.aiPlayers[this.currentPlayer]?.enabled) {
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    useItem(item) {
        if (item === 'fixedDice') {
            this.activeItem = 'fixedDice';
            document.getElementById('fixedDiceModal').classList.add('show');
        } else if (item === 'doubleDice') {
            this.activeItem = 'doubleDice';
            this.items.doubleDice--;
            this.updateItemUI();
            this.addLog('使用了双骰子！');
            this.rollDice();
        } else if (item === 'shield') {
            this.activeItem = null;
            this.items.shield--;
            this.shields[0] = true;
            this.updateItemUI();
            this.drawBoard();
            this.drawPlanes();
            this.addLog('使用了保护罩！');
        }
    }

    confirmFixedDice(value) {
        this.items.fixedDice--;
        this.updateItemUI();
        document.getElementById('fixedDiceModal').classList.remove('show');
        
        this.diceValue = value;
        document.getElementById('dice').textContent = value;
        this.addLog(`使用指定点数骰子: ${value}`);
        this.activeItem = null;
        this.handleDiceResult();
    }

    updateItemUI() {
        document.getElementById('item-fixedDice').textContent = this.items.fixedDice;
        document.getElementById('item-doubleDice').textContent = this.items.doubleDice;
        document.getElementById('item-shield').textContent = this.items.shield;
    }

    rollDice() {
        if (!this.gameStarted || this.isRolling || this.gameOver) return;
        if (this.isReplaying) return;
        
        if (this.activeItem === 'fixedDice') {
            return;
        }
        
        this.isRolling = true;
        this.selectedPlane = null;
        this.movablePlanes = [];
        
        const dice = document.getElementById('dice');
        const dice2 = document.getElementById('dice2');
        
        dice.classList.add('rolling');
        if (this.activeItem === 'doubleDice') {
            dice2.style.display = 'flex';
            dice2.classList.add('rolling');
        }
        
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            dice.textContent = this.diceValue;
            
            if (this.activeItem === 'doubleDice') {
                this.diceValue2 = Math.floor(Math.random() * 6) + 1;
                dice2.textContent = this.diceValue2;
            }
            
            rollCount++;
            
            if (rollCount >= 10) {
                clearInterval(rollInterval);
                dice.classList.remove('rolling');
                dice2.classList.remove('rolling');
                this.isRolling = false;
                
                if (this.activeItem === 'doubleDice') {
                    this.diceValue = this.diceValue + this.diceValue2;
                    this.activeItem = null;
                    setTimeout(() => {
                        dice2.style.display = 'none';
                    }, 500);
                }
                
                this.recordReplay({ action: 'roll', player: this.currentPlayer, value: this.diceValue });
                this.handleDiceResult();
            }
        }, 50);
    }

    handleDiceResult() {
        const player = this.players[this.currentPlayer];
        const playerName = PLAYER_NAMES[this.currentPlayer];
        
        this.addLog(`${playerName}掷出了 ${this.diceValue} 点`);
        
        this.movablePlanes = [];
        
        for (let i = 0; i < 4; i++) {
            const plane = player.planes[i];
            
            if (plane.isFinished) continue;
            
            if (plane.position === -1) {
                if (this.diceValue === 6) {
                    this.movablePlanes.push({ player: this.currentPlayer, planeIndex: i });
                }
            } else {
                const newPosition = plane.position + this.diceValue;
                if (newPosition <= TOTAL_STEPS_TO_WIN) {
                    this.movablePlanes.push({ player: this.currentPlayer, planeIndex: i });
                }
            }
        }
        
        if (this.movablePlanes.length === 0) {
            this.addLog(`${playerName}没有可移动的飞机`);
            this.resetCombo(this.currentPlayer);
            if (this.diceValue === 6) {
                this.addLog(`${playerName}掷出6点，再掷一次！`);
                if (this.aiPlayers[this.currentPlayer]?.enabled) {
                    setTimeout(() => this.aiTurn(), 1000);
                }
            } else {
                this.nextPlayer();
            }
        } else if (this.movablePlanes.length === 1) {
            this.movePlane(this.movablePlanes[0].player, this.movablePlanes[0].planeIndex);
        } else {
            if (this.aiPlayers[this.currentPlayer]?.enabled || this.isReplaying) {
                setTimeout(() => this.aiSelectPlane(), 500);
            } else {
                this.addLog(`请点击选择要移动的飞机`);
            }
        }
        
        this.drawBoard();
        this.drawPlanes();
    }

    handleCanvasClick(e) {
        if (!this.gameStarted || this.gameOver || this.isRolling || this.movablePlanes.length === 0) return;
        if (this.aiPlayers[this.currentPlayer]?.enabled) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        for (const movable of this.movablePlanes) {
            const plane = this.players[movable.player].planes[movable.planeIndex];
            if (plane.isFinished) continue;
            let pos;
            
            if (plane.position === -1) {
                pos = this.homePositions[movable.player][movable.planeIndex];
            } else if (plane.position >= TOTAL_CELLS) {
                const finalIndex = plane.position - TOTAL_CELLS;
                pos = this.finalPathPositions[movable.player][finalIndex];
            } else {
                const actualPos = (plane.position + this.startPositions[movable.player]) % TOTAL_CELLS;
                pos = this.pathPositions[actualPos];
            }
            
            const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
            if (distance <= PLANE_RADIUS + 5) {
                this.selectedPlane = movable;
                this.drawBoard();
                this.drawPlanes();
                this.movePlane(movable.player, movable.planeIndex);
                return;
            }
        }
    }

    movePlane(playerIndex, planeIndex) {
        const plane = this.players[playerIndex].planes[planeIndex];
        const playerName = PLAYER_NAMES[playerIndex];
        
        if (plane.position === -1) {
            plane.position = 0;
            this.addLog(`${playerName}的飞机 ${planeIndex + 1} 从停机坪出发！`);
        } else {
            const oldPosition = plane.position;
            plane.position += this.diceValue;
            
            if (plane.position > TOTAL_STEPS_TO_WIN) {
                plane.position = oldPosition;
                this.addLog(`${playerName}的飞机 ${planeIndex + 1} 超出终点，无法移动`);
            } else if (plane.position === TOTAL_STEPS_TO_WIN) {
                plane.isFinished = true;
                this.players[playerIndex].finishedCount++;
                this.addLog(`🎉 ${playerName}的飞机 ${planeIndex + 1} 到达终点！`);
                
                if (this.players[playerIndex].finishedCount === 4) {
                    this.gameOver = true;
                    this.showWinner(playerIndex);
                    return;
                }
            } else {
                this.addLog(`${playerName}的飞机 ${planeIndex + 1} 移动到位置 ${plane.position}`);
            }
        }
        
        if (plane.position >= 0 && plane.position < TOTAL_CELLS && !plane.isFinished) {
            this.checkCollision(playerIndex, planeIndex);
        }
        
        this.movablePlanes = [];
        this.selectedPlane = null;
        
        if (this.diceValue === 6 && !plane.isFinished) {
            this.addCombo(playerIndex);
            this.addLog(`${playerName}掷出6点，再掷一次！`);
            if (this.aiPlayers[playerIndex]?.enabled) {
                setTimeout(() => this.aiTurn(), 1000);
            }
        } else {
            this.resetCombo(playerIndex);
            this.nextPlayer();
        }
        
        this.drawBoard();
        this.drawPlanes();
        this.updateUI();
        
        this.recordReplay({ action: 'move', player: playerIndex, plane: planeIndex, position: plane.position });
    }

    checkCollision(playerIndex, planeIndex) {
        const plane = this.players[playerIndex].planes[planeIndex];
        const actualPos = (plane.position + this.startPositions[playerIndex]) % TOTAL_CELLS;
        
        const safePositions = [0, 8, 13, 21, 26, 34, 39, 47];
        if (safePositions.includes(actualPos)) return;
        
        for (let p = 0; p < 4; p++) {
            if (p === playerIndex) continue;
            
            for (let i = 0; i < 4; i++) {
                const otherPlane = this.players[p].planes[i];
                if (otherPlane.position === -1 || otherPlane.isFinished) continue;
                if (otherPlane.position >= TOTAL_CELLS) continue;
                
                const otherActualPos = (otherPlane.position + this.startPositions[p]) % TOTAL_CELLS;
                
                if (otherActualPos === actualPos) {
                    if (this.shields[p]) {
                        this.shields[p] = false;
                        this.addLog(`🛡️ ${PLAYER_NAMES[p]}的保护罩抵挡了攻击！`);
                    } else {
                        otherPlane.position = -1;
                        this.addLog(`💥 ${PLAYER_NAMES[playerIndex]}的飞机击落了 ${PLAYER_NAMES[p]}的飞机 ${i + 1}！`);
                        
                        if (p === 0 && !this.aiPlayers[0]?.enabled) {
                            this.revengeAvailable = p;
                            this.revengeTarget = { player: playerIndex, plane: planeIndex };
                            this.showRevengeModal();
                        }
                    }
                }
            }
        }
    }

    showRevengeModal() {
        document.getElementById('revengeModal').classList.add('show');
    }

    useRevenge(use) {
        document.getElementById('revengeModal').classList.remove('show');
        
        if (use && this.revengeTarget) {
            const target = this.players[this.revengeTarget.player].planes[this.revengeTarget.plane];
            if (target.position !== -1 && !target.isFinished) {
                target.position = -1;
                this.addLog(`⚔️ 反击成功！${PLAYER_NAMES[this.revengeTarget.player]}的飞机被击退！`);
                this.unlockAchievement('revenge');
            }
        }
        
        this.revengeAvailable = null;
        this.revengeTarget = null;
        this.drawBoard();
        this.drawPlanes();
    }

    addCombo(playerIndex) {
        this.combos[playerIndex]++;
        this.updateComboDisplay();
        
        if (this.combos[playerIndex] >= 5) {
            this.unlockAchievement('combo5');
        }
    }

    resetCombo(playerIndex) {
        this.combos[playerIndex] = 0;
        this.updateComboDisplay();
    }

    updateComboDisplay() {
        const comboDisplay = document.getElementById('comboDisplay');
        const comboCount = this.combos[this.currentPlayer];
        
        if (comboCount >= 2) {
            comboDisplay.classList.add('show');
            comboDisplay.querySelector('.combo-count').textContent = comboCount;
        } else {
            comboDisplay.classList.remove('show');
        }
        
        for (let i = 0; i < 4; i++) {
            const badge = document.getElementById(`combo${i}`);
            if (this.combos[i] >= 2) {
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    aiTurn() {
        if (!this.gameStarted || this.gameOver) return;
        if (!this.aiPlayers[this.currentPlayer]?.enabled) return;
        
        if (this.isReplaying) return;
        
        setTimeout(() => this.rollDice(), 500);
    }

    aiSelectPlane() {
        if (this.movablePlanes.length === 0) return;
        
        const strategy = this.aiPlayers[this.currentPlayer].strategy;
        let bestPlane = this.movablePlanes[0];
        
        if (strategy === 'offensive') {
            for (const movable of this.movablePlanes) {
                const plane = this.players[movable.player].planes[movable.planeIndex];
                if (plane.position === -1) {
                    bestPlane = movable;
                    break;
                }
            }
        } else if (strategy === 'defensive') {
            let maxProgress = -1;
            for (const movable of this.movablePlanes) {
                const plane = this.players[movable.player].planes[movable.planeIndex];
                if (plane.position > maxProgress) {
                    maxProgress = plane.position;
                    bestPlane = movable;
                }
            }
        } else if (strategy === 'aggressive') {
            bestPlane = this.findBestAttackPlane();
        } else {
            const canLaunch = this.movablePlanes.some(m => 
                this.players[m.player].planes[m.planeIndex].position === -1
            );
            if (canLaunch) {
                bestPlane = this.movablePlanes.find(m => 
                    this.players[m.player].planes[m.planeIndex].position === -1
                );
            } else {
                let maxProgress = -1;
                for (const movable of this.movablePlanes) {
                    const plane = this.players[movable.player].planes[movable.planeIndex];
                    if (plane.position > maxProgress) {
                        maxProgress = plane.position;
                        bestPlane = movable;
                    }
                }
            }
        }
        
        setTimeout(() => {
            this.selectedPlane = bestPlane;
            this.drawBoard();
            this.drawPlanes();
            setTimeout(() => {
                this.movePlane(bestPlane.player, bestPlane.planeIndex);
            }, 300);
        }, 500);
    }

    findBestAttackPlane() {
        let bestPlane = this.movablePlanes[0];
        let bestScore = -1;
        
        for (const movable of this.movablePlanes) {
            const plane = this.players[movable.player].planes[movable.planeIndex];
            const newPosition = plane.position + this.diceValue;
            
            if (newPosition >= TOTAL_CELLS) continue;
            
            const actualPos = (newPosition + this.startPositions[movable.player]) % TOTAL_CELLS;
            let score = 0;
            
            for (let p = 0; p < 4; p++) {
                if (p === movable.player) continue;
                
                for (let i = 0; i < 4; i++) {
                    const otherPlane = this.players[p].planes[i];
                    if (otherPlane.position === -1 || otherPlane.isFinished) continue;
                    if (otherPlane.position >= TOTAL_CELLS) continue;
                    
                    const otherActualPos = (otherPlane.position + this.startPositions[p]) % TOTAL_CELLS;
                    if (otherActualPos === actualPos) {
                        score += 100;
                    }
                }
            }
            
            score += newPosition;
            
            if (score > bestScore) {
                bestScore = score;
                bestPlane = movable;
            }
        }
        
        return bestPlane;
    }

    nextPlayer() {
        this.currentPlayer = (this.currentPlayer + 1) % 4;
        this.updateUI();
        this.updateComboDisplay();
        
        if (this.aiPlayers[this.currentPlayer]?.enabled) {
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    updateUI() {
        document.getElementById('currentPlayerName').textContent = PLAYER_NAMES[this.currentPlayer];
        document.getElementById('currentPlayerName').style.color = PLAYER_COLORS[this.currentPlayer];
        
        for (let i = 0; i < 4; i++) {
            const planesAtHome = this.players[i].planes.filter(p => p.position === -1).length;
            document.getElementById(`planesHome${i}`).textContent = planesAtHome;
            
            const statusEl = document.getElementById(`playerStatus${i}`);
            if (i === this.currentPlayer) {
                statusEl.classList.add('active');
            } else {
                statusEl.classList.remove('active');
            }
        }
        
        const canRoll = this.gameStarted && !this.gameOver && !this.isRolling && 
                       this.movablePlanes.length === 0 &&
                       !this.aiPlayers[this.currentPlayer]?.enabled;
        document.getElementById('rollDiceBtn').disabled = !canRoll;
    }

    addLog(message) {
        const logContent = document.getElementById('gameLog');
        const p = document.createElement('p');
        p.textContent = message;
        logContent.appendChild(p);
        logContent.scrollTop = logContent.scrollHeight;
    }

    showWinner(playerIndex) {
        const modal = document.getElementById('winnerModal');
        const winnerText = document.getElementById('winnerText');
        winnerText.textContent = `${PLAYER_NAMES[playerIndex]}获胜！`;
        winnerText.style.color = PLAYER_COLORS[playerIndex];
        
        const earnedDiv = document.getElementById('earnedAchievements');
        earnedDiv.innerHTML = '';
        
        this.unlockAchievement('firstWin');
        
        const allPlanesStarted = this.players[playerIndex].planes.every(p => p.isFinished || p.position !== -1);
        if (allPlanesStarted) {
            this.unlockAchievement('perfect');
        }
        
        const earnedThisGame = ['firstWin'];
        if (this.combos.some(c => c >= 5)) earnedThisGame.push('combo5');
        
        earnedDiv.innerHTML = '<h4>获得成就:</h4>';
        earnedThisGame.forEach(id => {
            const ach = this.getAchievementInfo(id);
            earnedDiv.innerHTML += `<span class="earned-ach">${ach.icon} ${ach.name}</span>`;
        });
        
        modal.classList.add('show');
        this.addLog(`🏆 ${PLAYER_NAMES[playerIndex]}获得胜利！🏆`);
    }

    getAchievementInfo(id) {
        const infos = {
            firstWin: { icon: '🥇', name: '首胜' },
            combo5: { icon: '🔥', name: '五连击' },
            revenge: { icon: '⚔️', name: '复仇者' },
            perfect: { icon: '💯', name: '完美胜利' }
        };
        return infos[id] || { icon: '🏅', name: id };
    }

    loadAchievements() {
        try {
            return JSON.parse(localStorage.getItem('flyingChessAchievements')) || {};
        } catch {
            return {};
        }
    }

    saveAchievements() {
        localStorage.setItem('flyingChessAchievements', JSON.stringify(this.achievements));
    }

    unlockAchievement(id) {
        if (!this.achievements[id]) {
            this.achievements[id] = true;
            this.saveAchievements();
            this.updateAchievementsUI();
        }
    }

    updateAchievementsUI() {
        document.querySelectorAll('.achievement').forEach(ach => {
            const id = ach.dataset.id;
            if (this.achievements[id]) {
                ach.classList.add('unlocked');
            }
        });
    }

    recordReplay(data) {
        if (!this.isReplaying) {
            this.replayData.push({
                ...data,
                timestamp: Date.now()
            });
        }
    }

    saveReplay() {
        const json = JSON.stringify(this.replayData);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flying-chess-replay-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.addLog('回放已保存！');
    }

    loadReplay() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.replayData = JSON.parse(e.target.result);
                    this.startReplay();
                } catch {
                    alert('回放文件无效！');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    startReplay() {
        this.restartGame();
        this.isReplaying = true;
        this.currentReplayStep = 0;
        this.addLog('开始回放...');
        this.playNextReplayStep();
    }

    playNextReplayStep() {
        if (this.currentReplayStep >= this.replayData.length) {
            this.isReplaying = false;
            this.addLog('回放结束！');
            return;
        }
        
        const step = this.replayData[this.currentReplayStep];
        
        if (step.action === 'roll') {
            this.diceValue = step.value;
            document.getElementById('dice').textContent = this.diceValue;
            this.handleDiceResult();
        } else if (step.action === 'move') {
            // Move already handled in handleDiceResult
        }
        
        this.currentReplayStep++;
        setTimeout(() => this.playNextReplayStep(), 1000);
    }

    restartGame() {
        this.currentPlayer = 0;
        this.diceValue = 1;
        this.diceValue2 = null;
        this.isRolling = false;
        this.gameOver = false;
        this.gameStarted = false;
        this.selectedPlane = null;
        this.movablePlanes = [];
        this.activeItem = null;
        this.replayData = [];
        this.isReplaying = false;
        
        this.items = {
            fixedDice: 2,
            doubleDice: 2,
            shield: 2
        };
        this.shields = [false, false, false, false];
        this.combos = [0, 0, 0, 0];
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                this.players[i].planes[j] = {
                    position: -1,
                    isFinished: false
                };
            }
            this.players[i].finishedCount = 0;
        }
        
        document.getElementById('dice').textContent = '1';
        document.getElementById('dice2').style.display = 'none';
        document.getElementById('winnerModal').classList.remove('show');
        document.getElementById('gameLog').innerHTML = '';
        document.getElementById('startGameBtn').textContent = '开始游戏';
        document.getElementById('startGameBtn').disabled = false;
        
        this.updateItemUI();
        this.drawBoard();
        this.drawPlanes();
        this.updateUI();
        this.updateComboDisplay();
        this.addLog('游戏已重置，点击"开始游戏"按钮开始！');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FlyingChess();
});
