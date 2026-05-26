const PET_DATABASE = [
    { emoji: '🐱', name: '小猫咪' },
    { emoji: '🐶', name: '小狗狗' },
    { emoji: '🐰', name: '小兔子' },
    { emoji: '🐼', name: '大熊猫' },
    { emoji: '🐨', name: '考拉' },
    { emoji: '🐯', name: '小老虎' },
    { emoji: '🦁', name: '狮子王' },
    { emoji: '🐮', name: '奶牛' },
    { emoji: '🐷', name: '小猪猪' },
    { emoji: '🐸', name: '青蛙' },
    { emoji: '🐵', name: '猴子' },
    { emoji: '🐔', name: '小鸡' },
    { emoji: '🦊', name: '狐狸' },
    { emoji: '🦝', name: '浣熊' },
    { emoji: '🦄', name: '独角兽' },
    { emoji: '🐴', name: '小马' },
    { emoji: '🐑', name: '绵羊' },
    { emoji: '🐐', name: '山羊' },
    { emoji: '🐪', name: '骆驼' },
    { emoji: '🐘', name: '大象' },
    { emoji: '🐭', name: '小老鼠' },
    { emoji: '🐹', name: '仓鼠' },
    { emoji: '🐻', name: '棕熊' },
    { emoji: '🐻‍❄️', name: '北极熊' },
    { emoji: '🦥', name: '树懒' },
    { emoji: '🦦', name: '水獭' },
    { emoji: '🦘', name: '袋鼠' },
    { emoji: '🦒', name: '长颈鹿' },
    { emoji: '🐃', name: '水牛' },
    { emoji: '🐂', name: '公牛' },
    { emoji: '🐄', name: '乳牛' },
    { emoji: '🐖', name: '母猪' },
    { emoji: '🐏', name: '公羊' },
    { emoji: '🐀', name: '大鼠' },
    { emoji: '🐁', name: '小鼠' },
    { emoji: '🦔', name: '刺猬' },
    { emoji: '🐇', name: '兔兔' },
    { emoji: '🦉', name: '猫头鹰' },
    { emoji: '🦅', name: '老鹰' },
    { emoji: '🦆', name: '鸭子' },
    { emoji: '🦢', name: '天鹅' },
    { emoji: '🦜', name: '鹦鹉' },
    { emoji: '🦩', name: '火烈鸟' },
    { emoji: '🐧', name: '企鹅' },
    { emoji: '🦎', name: '蜥蜴' },
    { emoji: '🐊', name: '鳄鱼' },
    { emoji: '🐢', name: '乌龟' },
    { emoji: '🐍', name: '蛇蛇' },
    { emoji: '🦖', name: '霸王龙' },
    { emoji: '🦕', name: '梁龙' },
    { emoji: '🦐', name: '虾' },
    { emoji: '🦀', name: '螃蟹' },
    { emoji: '🐙', name: '章鱼' },
    { emoji: '🐟', name: '小鱼' },
    { emoji: '🐬', name: '海豚' },
    { emoji: '🐋', name: '鲸鱼' },
    { emoji: '🦈', name: '鲨鱼' },
    { emoji: '🐳', name: '蓝鲸' }
];

const LEVEL_CONFIGS = [
    { rows: 6, cols: 8,  petTypes: 6,  timeLimit: 120, stepLimit: 50,  name: '初级训练' },
    { rows: 6, cols: 10, petTypes: 8,  timeLimit: 150, stepLimit: 60,  name: '进阶挑战' },
    { rows: 8, cols: 10, petTypes: 10, timeLimit: 180, stepLimit: 70,  name: '中级考验' },
    { rows: 8, cols: 12, petTypes: 12, timeLimit: 200, stepLimit: 80,  name: '高手之路' },
    { rows: 10, cols: 12, petTypes: 14, timeLimit: 240, stepLimit: 95, name: '专家级别' },
    { rows: 10, cols: 14, petTypes: 16, timeLimit: 280, stepLimit: 110, name: '大师挑战' },
    { rows: 10, cols: 14, petTypes: 18, timeLimit: 300, stepLimit: 120, name: '宗师试炼' },
    { rows: 12, cols: 14, petTypes: 20, timeLimit: 340, stepLimit: 135, name: '传奇之路' },
    { rows: 12, cols: 16, petTypes: 22, timeLimit: 380, stepLimit: 150, name: '神话巅峰' },
    { rows: 12, cols: 16, petTypes: 26, timeLimit: 420, stepLimit: 165, name: '终极BOSS' }
];

const DEFAULT_ITEMS = {
    hint: 3,
    bomb: 2,
    time: 1
};

class LianLianKanGame {
    constructor() {
        this.rows = 6;
        this.cols = 8;
        this.padding = 2;
        this.board = [];
        this.selectedTile = null;
        this.score = 0;
        this.level = 1;
        this.remaining = 0;
        this.isAnimating = false;
        this.combo = 0;
        this.lastMatchTime = 0;
        this.totalMatches = 0;
        this.maxCombo = 0;
        this.gameMode = 'classic';
        this.timerInterval = null;
        this.timeLeft = 0;
        this.stepsLeft = 0;
        this.items = { ...DEFAULT_ITEMS };
        this.customLevel = null;
        this.album = this.loadAlbum();
        this.currentTheme = 'purple';
        this.editorSelectedPets = new Set();

        this.cacheElements();
        this.init();
        this.bindEvents();
    }

    cacheElements() {
        this.gameBoard = document.getElementById('game-board');
        this.pathSvg = document.getElementById('path-svg');
        this.scoreEl = document.getElementById('score');
        this.remainingEl = document.getElementById('remaining');
        this.levelEl = document.getElementById('level');
        this.comboEl = document.getElementById('combo');
        this.comboContainer = document.getElementById('combo-container');
        this.timerEl = document.getElementById('timer');
        this.timerContainer = document.getElementById('timer-container');
        this.stepsEl = document.getElementById('steps');
        this.stepsContainer = document.getElementById('steps-container');
        this.comboPopup = document.getElementById('combo-popup');
        
        this.restartBtn = document.getElementById('restart-btn');
        this.albumBtn = document.getElementById('album-btn');
        this.editorBtn = document.getElementById('editor-btn');
        
        this.itemHintBtn = document.getElementById('item-hint');
        this.itemBombBtn = document.getElementById('item-bomb');
        this.itemTimeBtn = document.getElementById('item-time');
        this.itemShuffleBtn = document.getElementById('item-shuffle');
        this.hintCountEl = document.getElementById('hint-count');
        this.bombCountEl = document.getElementById('bomb-count');
        this.timeCountEl = document.getElementById('time-count');
        
        this.modal = document.getElementById('game-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalStats = document.getElementById('modal-stats');
        this.modalBtn = document.getElementById('modal-btn');
        this.modalRetry = document.getElementById('modal-retry');
        this.starRating = document.getElementById('star-rating');
        
        this.albumModal = document.getElementById('album-modal');
        this.albumGrid = document.getElementById('album-grid');
        this.albumCount = document.getElementById('album-count');
        this.albumTotal = document.getElementById('album-total');
        this.albumClose = document.getElementById('album-close');
        
        this.editorModal = document.getElementById('editor-modal');
        this.editorRows = document.getElementById('editor-rows');
        this.editorCols = document.getElementById('editor-cols');
        this.editorTypes = document.getElementById('editor-types');
        this.editorName = document.getElementById('editor-name');
        this.editorPetGrid = document.getElementById('editor-pet-grid');
        this.editorPlay = document.getElementById('editor-play');
        this.editorExport = document.getElementById('editor-export');
        this.editorImport = document.getElementById('editor-import');
        this.editorClose = document.getElementById('editor-close');
        this.editorIO = document.getElementById('editor-io');
    }

    init() {
        this.score = 0;
        this.selectedTile = null;
        this.isAnimating = false;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalMatches = 0;
        this.lastMatchTime = 0;
        this.items = { ...DEFAULT_ITEMS };
        this.customLevel = null;
        
        this.stopTimer();
        this.applyLevelConfig();
        this.generateBoard();
        this.renderBoard();
        this.updateStats();
        this.updateItemUI();
        this.autoShuffleCheck();
    }

    applyLevelConfig() {
        const config = LEVEL_CONFIGS[Math.min(this.level - 1, LEVEL_CONFIGS.length - 1)];
        this.rows = config.rows;
        this.cols = config.cols;
        this.currentPetTypes = config.petTypes;
        this.timeLimit = config.timeLimit;
        this.stepLimit = config.stepLimit;
        this.levelName = config.name;
        
        if (this.gameMode === 'time') {
            this.timeLeft = this.timeLimit;
            this.startTimer();
        } else if (this.gameMode === 'steps') {
            this.stepsLeft = this.stepLimit;
        }
    }

    setMode(mode) {
        this.gameMode = mode;
        this.level = 1;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        this.timerContainer.style.display = mode === 'time' ? 'flex' : 'none';
        this.stepsContainer.style.display = mode === 'steps' ? 'flex' : 'none';
        
        this.init();
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateStats();
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.gameOver('时间到！');
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    generateBoard() {
        const totalCells = this.rows * this.cols;
        const petCount = Math.floor(totalCells / 2);
        let tiles = [];
        
        let petsToUse;
        if (this.customLevel && this.customLevel.pets) {
            petsToUse = this.customLevel.pets.map(p => p.emoji);
        } else {
            petsToUse = PET_DATABASE.slice(0, Math.min(this.currentPetTypes, PET_DATABASE.length))
                .map(p => p.emoji);
        }
        
        for (let i = 0; i < petCount; i++) {
            const pet = petsToUse[i % petsToUse.length];
            tiles.push(pet, pet);
        }
        
        tiles = this.shuffleArray(tiles);
        
        this.board = [];
        let tileIndex = 0;
        
        for (let r = 0; r < this.rows + this.padding * 2; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.cols + this.padding * 2; c++) {
                if (r >= this.padding && r < this.rows + this.padding &&
                    c >= this.padding && c < this.cols + this.padding) {
                    this.board[r][c] = tiles[tileIndex++] || null;
                } else {
                    this.board[r][c] = null;
                }
            }
        }
        
        this.remaining = petCount * 2;
    }

    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        
        for (let r = this.padding; r < this.rows + this.padding; r++) {
            for (let c = this.padding; c < this.cols + this.padding; c++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = r;
                tile.dataset.col = c;
                
                if (this.board[r][c]) {
                    tile.textContent = this.board[r][c];
                    tile.addEventListener('click', () => this.handleTileClick(r, c, tile));
                } else {
                    tile.classList.add('empty');
                }
                
                this.gameBoard.appendChild(tile);
            }
        }
    }

    handleTileClick(row, col, tileElement) {
        if (this.isAnimating || !this.board[row][col]) return;
        
        if (this.selectedTile) {
            if (this.selectedTile.row === row && this.selectedTile.col === col) {
                this.selectedTile.element.classList.remove('selected');
                this.selectedTile = null;
                return;
            }
            
            if (this.board[this.selectedTile.row][this.selectedTile.col] === this.board[row][col]) {
                const path = this.findPath(
                    this.selectedTile.row, this.selectedTile.col,
                    row, col
                );
                
                if (path) {
                    this.matchTiles(this.selectedTile, { row, col, element: tileElement }, path);
                    return;
                }
            }
            
            this.selectedTile.element.classList.remove('selected');
            this.selectedTile = { row, col, element: tileElement };
            tileElement.classList.add('selected');
        } else {
            this.selectedTile = { row, col, element: tileElement };
            tileElement.classList.add('selected');
        }
    }

    findPath(r1, c1, r2, c2) {
        if (this.checkDirectPath(r1, c1, r2, c2)) {
            return [{ r: r1, c: c1 }, { r: r2, c: c2 }];
        }
        
        const oneCorner = this.checkOneCorner(r1, c1, r2, c2);
        if (oneCorner) {
            return [{ r: r1, c: c1 }, oneCorner, { r: r2, c: c2 }];
        }
        
        const twoCorners = this.checkTwoCorners(r1, c1, r2, c2);
        if (twoCorners) {
            return [{ r: r1, c: c1 }, twoCorners[0], twoCorners[1], { r: r2, c: c2 }];
        }
        
        return null;
    }

    isEmpty(r, c) {
        if (r < 0 || r >= this.rows + this.padding * 2 ||
            c < 0 || c >= this.cols + this.padding * 2) {
            return true;
        }
        return !this.board[r][c];
    }

    checkDirectPath(r1, c1, r2, c2) {
        if (r1 === r2) {
            const minC = Math.min(c1, c2);
            const maxC = Math.max(c1, c2);
            for (let c = minC + 1; c < maxC; c++) {
                if (!this.isEmpty(r1, c)) return false;
            }
            return true;
        }
        
        if (c1 === c2) {
            const minR = Math.min(r1, r2);
            const maxR = Math.max(r1, r2);
            for (let r = minR + 1; r < maxR; r++) {
                if (!this.isEmpty(r, c1)) return false;
            }
            return true;
        }
        
        return false;
    }

    checkOneCorner(r1, c1, r2, c2) {
        if (this.isEmpty(r1, c2) &&
            this.checkDirectPath(r1, c1, r1, c2) &&
            this.checkDirectPath(r1, c2, r2, c2)) {
            return { r: r1, c: c2 };
        }
        
        if (this.isEmpty(r2, c1) &&
            this.checkDirectPath(r1, c1, r2, c1) &&
            this.checkDirectPath(r2, c1, r2, c2)) {
            return { r: r2, c: c1 };
        }
        
        return null;
    }

    checkTwoCorners(r1, c1, r2, c2) {
        for (let c = 0; c < this.cols + this.padding * 2; c++) {
            if (c === c1 || c === c2) continue;
            if (this.isEmpty(r1, c) && this.isEmpty(r2, c) &&
                this.checkDirectPath(r1, c1, r1, c) &&
                this.checkDirectPath(r1, c, r2, c) &&
                this.checkDirectPath(r2, c, r2, c2)) {
                return [{ r: r1, c }, { r: r2, c }];
            }
        }
        
        for (let r = 0; r < this.rows + this.padding * 2; r++) {
            if (r === r1 || r === r2) continue;
            if (this.isEmpty(r, c1) && this.isEmpty(r, c2) &&
                this.checkDirectPath(r1, c1, r, c1) &&
                this.checkDirectPath(r, c1, r, c2) &&
                this.checkDirectPath(r, c2, r2, c2)) {
                return [{ r, c: c1 }, { r, c: c2 }];
            }
        }
        
        return null;
    }

    matchTiles(tile1, tile2, path) {
        this.isAnimating = true;
        
        this.drawPath(path);
        
        const now = Date.now();
        const timeDiff = now - this.lastMatchTime;
        if (timeDiff < 3000 && this.lastMatchTime > 0) {
            this.combo++;
        } else {
            this.combo = 1;
        }
        this.lastMatchTime = now;
        this.totalMatches++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        this.addToAlbum(this.board[tile1.row][tile1.col]);
        
        setTimeout(() => {
            tile1.element.classList.add('matched');
            tile2.element.classList.add('matched');
            
            if (this.combo >= 2) {
                this.showComboPopup(tile1.element, tile2.element, this.combo);
            }
            
            setTimeout(() => {
                this.board[tile1.row][tile1.col] = null;
                this.board[tile2.row][tile2.col] = null;
                tile1.element.classList.remove('selected', 'matched');
                tile2.element.classList.remove('selected', 'matched');
                tile1.element.classList.add('empty');
                tile2.element.classList.add('empty');
                tile1.element.textContent = '';
                tile2.element.textContent = '';
                
                const comboBonus = this.combo > 1 ? this.combo * 5 : 0;
                this.score += 10 * this.level + comboBonus;
                this.remaining -= 2;
                this.selectedTile = null;
                
                if (this.gameMode === 'steps') {
                    this.stepsLeft--;
                }
                
                this.updateStats();
                this.clearPath();
                this.updateItemUI();
                
                this.isAnimating = false;
                
                if (this.remaining === 0) {
                    this.showWinModal();
                } else if (this.gameMode === 'steps' && this.stepsLeft <= 0) {
                    this.gameOver('步数用尽！');
                } else {
                    this.autoShuffleCheck();
                }
            }, 400);
        }, 300);
    }

    showComboPopup(el1, el2, combo) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        const containerRect = this.gameBoard.parentElement.getBoundingClientRect();
        
        const midX = (rect1.left + rect2.left) / 2 - containerRect.left + rect1.width / 2;
        const midY = (rect1.top + rect2.top) / 2 - containerRect.top + rect1.height / 2;
        
        this.comboPopup.style.left = midX + 'px';
        this.comboPopup.style.top = midY + 'px';
        this.comboPopup.textContent = `${combo}连击!`;
        this.comboPopup.classList.remove('hidden');
        
        this.comboContainer.classList.add('active');
        setTimeout(() => this.comboContainer.classList.remove('active'), 300);
        
        setTimeout(() => {
            this.comboPopup.classList.add('hidden');
        }, 1000);
    }

    drawPath(path) {
        this.pathSvg.innerHTML = '';
        const boardRect = this.gameBoard.getBoundingClientRect();
        const containerRect = this.gameBoard.parentElement.getBoundingClientRect();
        
        const tileWidth = boardRect.width / this.cols;
        const tileHeight = boardRect.height / this.rows;
        
        const offsetX = boardRect.left - containerRect.left;
        const offsetY = boardRect.top - containerRect.top;
        
        let pathD = '';
        path.forEach((point, index) => {
            const x = offsetX + (point.c - this.padding + 0.5) * tileWidth;
            const y = offsetY + (point.r - this.padding + 0.5) * tileHeight;
            
            if (index === 0) {
                pathD += `M ${x} ${y}`;
            } else {
                pathD += ` L ${x} ${y}`;
            }
        });
        
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', pathD);
        pathEl.setAttribute('class', 'path-line');
        this.pathSvg.appendChild(pathEl);
    }

    clearPath() {
        setTimeout(() => {
            this.pathSvg.innerHTML = '';
        }, 300);
    }

    updateStats() {
        this.scoreEl.textContent = this.score;
        this.remainingEl.textContent = this.remaining;
        this.levelEl.textContent = this.level;
        this.comboEl.textContent = this.combo;
        
        if (this.gameMode === 'time') {
            this.timerEl.textContent = this.formatTime(this.timeLeft);
            if (this.timeLeft <= 10) {
                this.timerEl.style.color = '#f44336';
            } else {
                this.timerEl.style.color = '';
            }
        }
        
        if (this.gameMode === 'steps') {
            this.stepsEl.textContent = this.stepsLeft;
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    updateItemUI() {
        this.hintCountEl.textContent = this.items.hint;
        this.bombCountEl.textContent = this.items.bomb;
        this.timeCountEl.textContent = this.items.time;
        
        this.itemHintBtn.disabled = this.items.hint <= 0;
        this.itemBombBtn.disabled = this.items.bomb <= 0;
        this.itemTimeBtn.disabled = this.items.time <= 0 || this.gameMode !== 'time';
    }

    useHint() {
        if (this.items.hint <= 0 || this.isAnimating) return;
        
        const match = this.findAnyMatch();
        if (match) {
            this.items.hint--;
            this.updateItemUI();
            
            const tile1 = document.querySelector(`.tile[data-row="${match[0].r}"][data-col="${match[0].c}"]`);
            const tile2 = document.querySelector(`.tile[data-row="${match[1].r}"][data-col="${match[1].c}"]`);
            
            tile1.classList.add('hint');
            tile2.classList.add('hint');
            
            setTimeout(() => {
                tile1.classList.remove('hint');
                tile2.classList.remove('hint');
            }, 2000);
        }
    }

    useBomb() {
        if (this.items.bomb <= 0 || this.isAnimating) return;
        
        const match = this.findAnyMatch();
        if (match) {
            this.items.bomb--;
            this.updateItemUI();
            
            const tile1El = document.querySelector(`.tile[data-row="${match[0].r}"][data-col="${match[0].c}"]`);
            const tile2El = document.querySelector(`.tile[data-row="${match[1].r}"][data-col="${match[1].c}"]`);
            
            const path = this.findPath(match[0].r, match[0].c, match[1].r, match[1].c);
            if (path) {
                this.matchTiles(
                    { row: match[0].r, col: match[0].c, element: tile1El },
                    { row: match[1].r, col: match[1].c, element: tile2El },
                    path
                );
            }
        }
    }

    useTime() {
        if (this.items.time <= 0 || this.gameMode !== 'time') return;
        
        this.items.time--;
        this.timeLeft += 30;
        this.updateStats();
        this.updateItemUI();
    }

    shuffleBoard() {
        let tiles = [];
        
        for (let r = this.padding; r < this.rows + this.padding; r++) {
            for (let c = this.padding; c < this.cols + this.padding; c++) {
                if (this.board[r][c]) {
                    tiles.push(this.board[r][c]);
                }
            }
        }
        
        tiles = this.shuffleArray(tiles);
        
        let tileIndex = 0;
        for (let r = this.padding; r < this.rows + this.padding; r++) {
            for (let c = this.padding; c < this.cols + this.padding; c++) {
                if (this.board[r][c]) {
                    this.board[r][c] = tiles[tileIndex++];
                }
            }
        }
        
        this.renderBoard();
        this.selectedTile = null;
    }

    findAnyMatch() {
        const positions = [];
        
        for (let r = this.padding; r < this.rows + this.padding; r++) {
            for (let c = this.padding; c < this.cols + this.padding; c++) {
                if (this.board[r][c]) {
                    positions.push({ r, c });
                }
            }
        }
        
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const p1 = positions[i];
                const p2 = positions[j];
                
                if (this.board[p1.r][p1.c] === this.board[p2.r][p2.c]) {
                    const path = this.findPath(p1.r, p1.c, p2.r, p2.c);
                    if (path) {
                        return [p1, p2];
                    }
                }
            }
        }
        
        return null;
    }

    autoShuffleCheck() {
        if (!this.findAnyMatch()) {
            setTimeout(() => {
                this.shuffleBoard();
                this.autoShuffleCheck();
            }, 500);
        }
    }

    calculateStars() {
        const totalPairs = (this.rows * this.cols) / 2;
        let stars = 1;
        
        if (this.gameMode === 'time') {
            const timeRatio = this.timeLeft / this.timeLimit;
            if (timeRatio > 0.5) stars = 2;
            if (timeRatio > 0.75) stars = 3;
        } else if (this.gameMode === 'steps') {
            const stepsUsed = this.stepLimit - this.stepsLeft;
            const stepsRatio = 1 - (stepsUsed / totalPairs);
            if (stepsRatio > 0.3) stars = 2;
            if (stepsRatio > 0.5) stars = 3;
        } else {
            if (this.maxCombo >= 5) stars = 2;
            if (this.maxCombo >= 10) stars = 3;
        }
        
        return stars;
    }

    showWinModal() {
        this.stopTimer();
        
        const stars = this.calculateStars();
        this.starRating.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'star' + (i < stars ? ' filled' : '');
            star.textContent = i < stars ? '★' : '☆';
            this.starRating.appendChild(star);
        }
        
        this.modalTitle.textContent = '🎉 恭喜通关！';
        this.modalMessage.textContent = `${this.levelName} 完成！`;
        
        this.modalStats.innerHTML = `
            <div class="modal-stat">
                <div class="modal-stat-label">得分</div>
                <div class="modal-stat-value">${this.score}</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">最高连击</div>
                <div class="modal-stat-value">${this.maxCombo}</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">消除对数</div>
                <div class="modal-stat-value">${this.totalMatches}</div>
            </div>
        `;
        
        this.modalBtn.textContent = this.level < LEVEL_CONFIGS.length ? '下一关' : '再玩一次';
        this.modal.classList.remove('hidden');
    }

    gameOver(reason) {
        this.stopTimer();
        this.modalTitle.textContent = '😢 游戏结束';
        this.modalMessage.textContent = reason;
        this.starRating.innerHTML = '';
        this.modalStats.innerHTML = `
            <div class="modal-stat">
                <div class="modal-stat-label">得分</div>
                <div class="modal-stat-value">${this.score}</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">消除对数</div>
                <div class="modal-stat-value">${this.totalMatches}</div>
            </div>
        `;
        this.modalBtn.textContent = '重新开始';
        this.modal.classList.remove('hidden');
    }

    nextLevel() {
        if (this.level < LEVEL_CONFIGS.length) {
            this.level++;
        }
        this.modal.classList.add('hidden');
        this.init();
    }

    restartGame() {
        this.level = 1;
        this.modal.classList.add('hidden');
        this.init();
    }

    retryLevel() {
        this.modal.classList.add('hidden');
        this.init();
    }

    loadAlbum() {
        try {
            const saved = localStorage.getItem('petAlbum');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    }

    saveAlbum() {
        try {
            localStorage.setItem('petAlbum', JSON.stringify([...this.album]));
        } catch {}
    }

    addToAlbum(emoji) {
        if (!this.album.has(emoji)) {
            this.album.add(emoji);
            this.saveAlbum();
        }
    }

    showAlbum() {
        this.albumCount.textContent = this.album.size;
        this.albumTotal.textContent = PET_DATABASE.length;
        
        this.albumGrid.innerHTML = '';
        PET_DATABASE.forEach(pet => {
            const item = document.createElement('div');
            item.className = 'album-item';
            if (this.album.has(pet.emoji)) {
                item.classList.add('collected');
                const tooltip = document.createElement('div');
                tooltip.className = 'album-tooltip';
                tooltip.textContent = pet.name;
                item.appendChild(tooltip);
            } else {
                item.classList.add('locked');
            }
            item.textContent = pet.emoji;
            this.albumGrid.appendChild(item);
        });
        
        this.albumModal.classList.remove('hidden');
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.parentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        try { localStorage.setItem('petTheme', theme); } catch {}
    }

    showEditor() {
        this.editorSelectedPets = new Set();
        this.editorRows.value = 8;
        this.editorCols.value = 10;
        this.editorTypes.value = 10;
        this.editorName.value = '';
        this.editorIO.classList.remove('visible');
        this.renderEditorPetGrid();
        this.editorModal.classList.remove('hidden');
    }

    renderEditorPetGrid() {
        const types = Math.min(parseInt(this.editorTypes.value) || 10, PET_DATABASE.length);
        this.editorPetGrid.innerHTML = '';
        PET_DATABASE.slice(0, types).forEach((pet, index) => {
            const item = document.createElement('div');
            item.className = 'editor-pet-item';
            item.textContent = pet.emoji;
            item.title = pet.name;
            if (this.editorSelectedPets.has(index)) {
                item.classList.add('selected');
            }
            item.addEventListener('click', () => {
                if (this.editorSelectedPets.has(index)) {
                    this.editorSelectedPets.delete(index);
                    item.classList.remove('selected');
                } else {
                    this.editorSelectedPets.add(index);
                    item.classList.add('selected');
                }
            });
            this.editorPetGrid.appendChild(item);
        });
    }

    exportLevel() {
        const rows = parseInt(this.editorRows.value);
        const cols = parseInt(this.editorCols.value);
        const types = parseInt(this.editorTypes.value);
        const name = this.editorName.value || '自定义关卡';
        
        const pets = [...this.editorSelectedPets].map(i => PET_DATABASE[i]);
        
        const levelData = {
            rows, cols, types, name,
            pets: pets.length > 0 ? pets : PET_DATABASE.slice(0, types)
        };
        
        this.editorIO.value = btoa(encodeURIComponent(JSON.stringify(levelData)));
        this.editorIO.classList.add('visible');
        this.editorIO.select();
    }

    importLevel() {
        try {
            const code = this.editorIO.value.trim();
            if (!code) return;
            
            const levelData = JSON.parse(decodeURIComponent(atob(code)));
            
            if (levelData.rows && levelData.cols) {
                this.editorRows.value = levelData.rows;
                this.editorCols.value = levelData.cols;
                this.editorTypes.value = levelData.types || levelData.pets?.length || 10;
                this.editorName.value = levelData.name || '自定义关卡';
                
                if (levelData.pets) {
                    this.editorSelectedPets = new Set();
                    let maxIdx = -1;
                    levelData.pets.forEach(pet => {
                        const idx = PET_DATABASE.findIndex(p => p.emoji === pet.emoji);
                        if (idx >= 0) {
                            this.editorSelectedPets.add(idx);
                            if (idx > maxIdx) maxIdx = idx;
                        }
                    });
                    
                    if (maxIdx >= 0 && parseInt(this.editorTypes.value) <= maxIdx) {
                        this.editorTypes.value = Math.min(maxIdx + 1, PET_DATABASE.length);
                    }
                }
                
                this.renderEditorPetGrid();
                
                if (levelData.pets) {
                    this.editorSelectedPets.forEach(idx => {
                        const items = this.editorPetGrid.querySelectorAll('.editor-pet-item');
                        if (items[idx]) items[idx].classList.add('selected');
                    });
                }
            }
        } catch (e) {
            alert('导入失败：关卡代码格式错误');
        }
    }

    playCustomLevel() {
        const rows = Math.max(4, Math.min(12, parseInt(this.editorRows.value) || 8));
        const cols = Math.max(4, Math.min(16, parseInt(this.editorCols.value) || 10));
        
        let pets;
        if (this.editorSelectedPets.size > 0) {
            pets = [...this.editorSelectedPets].map(i => PET_DATABASE[i]);
        } else {
            const types = Math.min(parseInt(this.editorTypes.value) || 10, PET_DATABASE.length);
            pets = PET_DATABASE.slice(0, types);
        }
        
        this.customLevel = { pets };
        this.levelName = this.editorName.value || '自定义关卡';
        
        this.setMode('classic');
        this.rows = rows;
        this.cols = cols;
        this.currentPetTypes = pets.length;
        this.customLevel = { pets };
        
        this.editorModal.classList.add('hidden');
        this.stopTimer();
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalMatches = 0;
        this.items = { ...DEFAULT_ITEMS };
        this.selectedTile = null;
        this.isAnimating = false;
        
        this.generateBoard();
        this.renderBoard();
        this.updateStats();
        this.updateItemUI();
        this.autoShuffleCheck();
    }

    bindEvents() {
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.albumBtn.addEventListener('click', () => this.showAlbum());
        this.editorBtn.addEventListener('click', () => this.showEditor());
        
        this.itemHintBtn.addEventListener('click', () => this.useHint());
        this.itemBombBtn.addEventListener('click', () => this.useBomb());
        this.itemTimeBtn.addEventListener('click', () => this.useTime());
        this.itemShuffleBtn.addEventListener('click', () => this.shuffleBoard());
        
        this.modalBtn.addEventListener('click', () => {
            if (this.remaining === 0) {
                this.nextLevel();
            } else {
                this.restartGame();
            }
        });
        this.modalRetry.addEventListener('click', () => this.retryLevel());
        
        this.albumClose.addEventListener('click', () => {
            this.albumModal.classList.add('hidden');
        });
        
        this.editorPlay.addEventListener('click', () => this.playCustomLevel());
        this.editorExport.addEventListener('click', () => this.exportLevel());
        this.editorImport.addEventListener('click', () => this.importLevel());
        this.editorClose.addEventListener('click', () => {
            this.editorModal.classList.add('hidden');
        });
        
        this.editorTypes.addEventListener('change', () => this.renderEditorPetGrid());
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setTheme(btn.dataset.theme));
        });
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
        
        try {
            const savedTheme = localStorage.getItem('petTheme');
            if (savedTheme) this.setTheme(savedTheme);
        } catch {}
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LianLianKanGame();
});