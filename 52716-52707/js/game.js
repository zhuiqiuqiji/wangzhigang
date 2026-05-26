class Game {
    constructor() {
        this.board = null;
        this.pathFinder = null;
        this.animation = null;
        this.selectedTile = null;
        this.score = 0;
        this.steps = 0;
        this.time = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.isProcessing = false;
        this.isGameOver = false;
        
        this.items = {
            hint: 3,
            shuffle: 3,
            bomb: 1,
            undo: 3
        };
        
        this.history = [];
        this.hintTiles = [];
        
        this.levelId = 1;
        this.themeKey = 'classic';
        this.level = null;
        this.theme = null;
        
        this.parseURLParams();
        this.initElements();
        this.init();
    }

    parseURLParams() {
        const params = new URLSearchParams(window.location.search);
        this.levelId = parseInt(params.get('level')) || 1;
        this.themeKey = params.get('theme') || 'classic';
    }

    initElements() {
        this.gameBoardEl = document.getElementById('game-board');
        this.pathCanvasEl = document.getElementById('path-canvas');
        this.scoreEl = document.getElementById('score');
        this.remainingEl = document.getElementById('remaining');
        this.timeEl = document.getElementById('time');
        this.stepsEl = document.getElementById('steps');
        this.levelTitleEl = document.getElementById('level-title');
        this.levelStarsEl = document.getElementById('level-stars');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalStars = document.getElementById('modal-stars');
        this.modalMessage = document.getElementById('modal-message');
        this.modalScore = document.getElementById('modal-score');
        this.modalTime = document.getElementById('modal-time');
        this.modalSteps = document.getElementById('modal-steps');
        this.modalConfirm = document.getElementById('modal-confirm');
        this.modalRestart = document.getElementById('modal-restart');
        this.pauseModal = document.getElementById('pause-modal');
        
        this.hintCountEl = document.getElementById('hint-count');
        this.shuffleCountEl = document.getElementById('shuffle-count');
        this.bombCountEl = document.getElementById('bomb-count');
        this.undoCountEl = document.getElementById('undo-count');
    }

    init() {
        this.level = Levels.getLevel(this.levelId);
        this.theme = Themes[this.themeKey] || Themes.classic;
        
        this.applyTheme();
        this.initBoard();
        this.pathFinder = new PathFinder(this.board);
        this.animation = new Animation(this.gameBoardEl, this.pathCanvasEl);
        this.bindEvents();
        this.startGame();
    }

    applyTheme() {
        document.body.style.background = this.theme.background;
        document.querySelector('.game-board-container').style.background = this.theme.boardBackground;
        
        if (this.level) {
            this.levelTitleEl.textContent = `第 ${this.levelId} 关 - ${this.level.name}`;
        }
    }

    initBoard() {
        if (!this.level) {
            this.board = new Board(8, 12, 3);
            return;
        }
        
        this.board = new Board(this.level.rows, this.level.cols, this.level.layers);
        this.board.currentTheme = this.themeKey;
    }

    bindEvents() {
        document.getElementById('back-btn').addEventListener('click', () => this.goToMenu());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('menu-btn').addEventListener('click', () => this.goToMenu());
        this.modalConfirm.addEventListener('click', () => this.handleModalConfirm());
        this.modalRestart.addEventListener('click', () => this.restartLevel());

        document.querySelectorAll('.item-btn[data-item]').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.dataset.item;
                this.useItem(item);
            });
        });
    }

    startGame() {
        this.score = 0;
        this.steps = 0;
        this.time = 0;
        this.selectedTile = null;
        this.isProcessing = false;
        this.isGameOver = false;
        this.history = [];
        this.hintTiles = [];
        
        this.items = {
            hint: 3,
            shuffle: 3,
            bomb: 1,
            undo: 3
        };
        
        this.generateTiles();
        this.renderTiles();
        this.updateUI();
        this.startTimer();
    }

    generateTiles() {
        this.board.tiles = [];
        this.board.grid = [];
        
        for (let z = 0; z < this.board.layers; z++) {
            this.board.grid[z] = [];
            for (let y = 0; y < this.board.rows; y++) {
                this.board.grid[z][y] = [];
                for (let x = 0; x < this.board.cols; x++) {
                    this.board.grid[z][y][x] = null;
                }
            }
        }

        const positions = Levels.generatePositions(this.levelId);
        let totalPositions = positions.length;
        
        if (totalPositions % 2 !== 0) {
            positions.pop();
            totalPositions--;
        }

        const tilePairs = Math.floor(totalPositions / 2);
        const selectedTypes = [];
        const themeTypes = this.theme.tileTypes;
        
        for (let i = 0; i < tilePairs; i++) {
            const typeIndex = i % themeTypes.length;
            selectedTypes.push({ ...themeTypes[typeIndex] });
            selectedTypes.push({ ...themeTypes[typeIndex] });
        }

        this.board.shuffleArray(selectedTypes);
        
        for (let i = 0; i < selectedTypes.length && i < positions.length; i++) {
            const pos = positions[i];
            const tileType = selectedTypes[i];
            const tile = {
                id: `tile_${pos.z}_${pos.y}_${pos.x}`,
                type: tileType.type,
                value: tileType.value,
                display: tileType.display,
                color: tileType.color,
                x: pos.x,
                y: pos.y,
                z: pos.z,
                isSelected: false,
                isRemoved: false,
                element: null
            };
            this.board.tiles.push(tile);
            this.board.grid[pos.z][pos.y][pos.x] = tile;
        }
    }

    renderTiles() {
        this.gameBoardEl.innerHTML = '';
        
        const tiles = this.board.tiles.slice().sort((a, b) => a.z - b.z);
        
        tiles.forEach(tile => {
            if (!tile.isRemoved) {
                this.createTileElement(tile);
            }
        });

        this.updateTileStates();
    }

    createTileElement(tile) {
        const el = document.createElement('div');
        el.className = `mahjong-tile`;
        el.dataset.tileId = tile.id;
        el.style.background = this.theme.tileBackground;
        el.style.borderColor = this.theme.tileBorder;
        
        const content = document.createElement('span');
        content.className = 'tile-content';
        content.textContent = tile.display;
        content.style.color = tile.color || '#333';
        el.appendChild(content);

        const layerOffset = tile.z * 5;
        el.style.left = `${tile.x * 50 + 30 + layerOffset}px`;
        el.style.top = `${tile.y * 64 + 30 + layerOffset}px`;
        el.style.zIndex = tile.z * 10 + tile.y;

        el.addEventListener('click', () => this.handleTileClick(tile));
        
        tile.element = el;
        this.gameBoardEl.appendChild(el);
    }

    handleTileClick(tile) {
        if (this.isProcessing || tile.isRemoved || this.isPaused || this.isGameOver) return;
        if (!this.board.isTileClickable(tile)) return;

        this.clearHints();

        if (this.selectedTile === tile) {
            this.deselectTile(tile);
            return;
        }

        if (this.selectedTile === null) {
            this.selectTile(tile);
        } else {
            this.tryMatch(this.selectedTile, tile);
        }
    }

    selectTile(tile) {
        this.selectedTile = tile;
        tile.isSelected = true;
        if (tile.element) {
            tile.element.classList.add('selected');
        }
    }

    deselectTile(tile) {
        this.selectedTile = null;
        tile.isSelected = false;
        if (tile.element) {
            tile.element.classList.remove('selected');
        }
    }

    tryMatch(tile1, tile2) {
        this.isProcessing = true;
        this.steps++;

        if (tile1.type !== tile2.type || tile1.value !== tile2.value) {
            this.animation.shakeTile(tile2);
            this.deselectTile(tile1);
            this.isProcessing = false;
            this.updateUI();
            return;
        }

        const path = this.pathFinder.findPath(tile1, tile2);
        
        if (!path) {
            this.animation.shakeTile(tile2);
            this.deselectTile(tile1);
            this.isProcessing = false;
            this.updateUI();
            return;
        }

        this.saveHistory(tile1, tile2);
        
        this.animation.showPath(path, 50, 64, 30, 30);

        setTimeout(() => {
            this.removeMatchedTiles(tile1, tile2);
        }, 300);
    }

    removeMatchedTiles(tile1, tile2) {
        const centerX = (tile1.x + tile2.x) * 50 / 2 + 30;
        const centerY = (tile1.y + tile2.y) * 64 / 2 + 30;
        
        this.score += 10;
        this.animation.showScorePopup(centerX, centerY, 10);

        this.deselectTile(tile1);
        
        this.animation.removeTileWithAnimation(tile1, () => {
            this.board.removeTile(tile1);
        });
        
        this.animation.removeTileWithAnimation(tile2, () => {
            this.board.removeTile(tile2);
            this.updateUI();
            this.updateTileStates();
            this.isProcessing = false;
            this.checkGameState();
        });
    }

    saveHistory(tile1, tile2) {
        this.history.push({
            tile1: {
                id: tile1.id,
                type: tile1.type,
                value: tile1.value,
                display: tile1.display,
                color: tile1.color,
                x: tile1.x,
                y: tile1.y,
                z: tile1.z
            },
            tile2: {
                id: tile2.id,
                type: tile2.type,
                value: tile2.value,
                display: tile2.display,
                color: tile2.color,
                x: tile2.x,
                y: tile2.y,
                z: tile2.z
            }
        });
        if (this.history.length > 50) {
            this.history.shift();
        }
    }

    updateTileStates() {
        this.board.tiles.forEach(tile => {
            if (tile.element && !tile.isRemoved) {
                const isClickable = this.board.isTileClickable(tile);
                if (isClickable) {
                    tile.element.classList.remove('disabled');
                } else {
                    tile.element.classList.add('disabled');
                }
            }
        });
    }

    updateUI() {
        this.scoreEl.textContent = this.score;
        this.remainingEl.textContent = this.board.getRemainingTiles().length;
        this.stepsEl.textContent = this.steps;
        
        this.hintCountEl.textContent = this.items.hint;
        this.shuffleCountEl.textContent = this.items.shuffle;
        this.bombCountEl.textContent = this.items.bomb;
        this.undoCountEl.textContent = this.items.undo;
        
        document.querySelectorAll('.item-btn[data-item]').forEach(btn => {
            const item = btn.dataset.item;
            btn.disabled = this.items[item] <= 0;
        });

        if (this.level && this.level.stepLimit > 0) {
            const remaining = this.level.stepLimit - this.steps;
            if (remaining <= 10) {
                this.stepsEl.classList.add('warning');
            } else {
                this.stepsEl.classList.remove('warning');
            }
        }
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver) {
                this.time++;
                this.updateTimeDisplay();
                this.checkTimeLimit();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimeDisplay() {
        const minutes = Math.floor(this.time / 60);
        const seconds = this.time % 60;
        this.timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.level && this.level.timeLimit > 0) {
            const remaining = this.level.timeLimit - this.time;
            if (remaining <= 30) {
                this.timeEl.classList.add('warning');
            } else {
                this.timeEl.classList.remove('warning');
            }
        }
    }

    checkTimeLimit() {
        if (this.level && this.level.timeLimit > 0 && this.time >= this.level.timeLimit) {
            this.gameOver('时间到！');
        }
    }

    checkGameState() {
        const remaining = this.board.getRemainingTiles().length;
        
        if (remaining === 0) {
            this.gameWin();
            return;
        }

        if (this.level && this.level.stepLimit > 0 && this.steps >= this.level.stepLimit) {
            this.gameOver('步数用尽！');
            return;
        }

        if (!this.hasValidMove()) {
            this.showNoMoveModal();
        }
    }

    hasValidMove() {
        const clickableTiles = this.board.getClickableTiles();
        
        for (let i = 0; i < clickableTiles.length; i++) {
            for (let j = i + 1; j < clickableTiles.length; j++) {
                const tile1 = clickableTiles[i];
                const tile2 = clickableTiles[j];
                
                if (tile1.type === tile2.type && tile1.value === tile2.value) {
                    const path = this.pathFinder.findPath(tile1, tile2);
                    if (path) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    useItem(item) {
        if (this.items[item] <= 0 || this.isProcessing || this.isPaused || this.isGameOver) return;

        this.clearHints();

        switch (item) {
            case 'hint':
                this.useHint();
                break;
            case 'shuffle':
                this.useShuffle();
                break;
            case 'bomb':
                this.useBomb();
                break;
            case 'undo':
                this.useUndo();
                break;
        }
    }

    useHint() {
        const hintPair = this.findHintPair();
        if (hintPair) {
            this.items.hint--;
            this.highlightHint(hintPair[0], hintPair[1]);
            this.updateUI();
        }
    }

    findHintPair() {
        const clickableTiles = this.board.getClickableTiles();
        
        for (let i = 0; i < clickableTiles.length; i++) {
            for (let j = i + 1; j < clickableTiles.length; j++) {
                const tile1 = clickableTiles[i];
                const tile2 = clickableTiles[j];
                
                if (tile1.type === tile2.type && tile1.value === tile2.value) {
                    const path = this.pathFinder.findPath(tile1, tile2);
                    if (path) {
                        return [tile1, tile2];
                    }
                }
            }
        }
        
        return null;
    }

    highlightHint(tile1, tile2) {
        this.hintTiles = [tile1, tile2];
        if (tile1.element) tile1.element.classList.add('hint');
        if (tile2.element) tile2.element.classList.add('hint');
        
        setTimeout(() => {
            this.clearHints();
        }, 3000);
    }

    clearHints() {
        this.hintTiles.forEach(tile => {
            if (tile.element) {
                tile.element.classList.remove('hint');
            }
        });
        this.hintTiles = [];
    }

    useShuffle() {
        this.items.shuffle--;
        this.shuffleBoard();
        this.updateUI();
    }

    shuffleBoard() {
        this.board.shuffle();
        this.renderTiles();
        this.updateUI();
    }

    useBomb() {
        const pair = this.findAnyPair();
        if (pair) {
            this.items.bomb--;
            this.isProcessing = true;
            
            if (this.selectedTile) {
                this.deselectTile(this.selectedTile);
            }
            
            this.saveHistory(pair[0], pair[1]);
            
            this.animation.removeTileWithAnimation(pair[0], () => {
                this.board.removeTile(pair[0]);
            });
            
            this.animation.removeTileWithAnimation(pair[1], () => {
                this.board.removeTile(pair[1]);
                this.updateUI();
                this.updateTileStates();
                this.isProcessing = false;
                this.checkGameState();
            });
            
            this.updateUI();
        }
    }

    findAnyPair() {
        const tiles = this.board.getRemainingTiles();
        
        for (let i = 0; i < tiles.length; i++) {
            for (let j = i + 1; j < tiles.length; j++) {
                if (tiles[i].type === tiles[j].type && tiles[i].value === tiles[j].value) {
                    return [tiles[i], tiles[j]];
                }
            }
        }
        
        return null;
    }

    useUndo() {
        if (this.history.length === 0) return;
        
        this.items.undo--;
        const lastMove = this.history.pop();
        
        this.restoreTile(lastMove.tile1);
        this.restoreTile(lastMove.tile2);
        
        this.score = Math.max(0, this.score - 10);
        this.updateUI();
        this.updateTileStates();
    }

    restoreTile(tileData) {
        const tile = {
            ...tileData,
            isRemoved: false,
            isSelected: false,
            element: null
        };
        
        this.board.tiles.push(tile);
        this.board.grid[tile.z][tile.y][tile.x] = tile;
        this.createTileElement(tile);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.pauseModal.classList.remove('hidden');
        } else {
            this.pauseModal.classList.add('hidden');
        }
    }

    gameWin() {
        this.isGameOver = true;
        this.stopTimer();
        
        const stars = this.calculateStars();
        Storage.saveLevelResult(this.levelId, this.score, this.time, stars);
        Storage.setHighScore(this.score);
        
        this.showResultModal('🎉 恭喜通关！', '太棒了！你成功完成了本关！', stars);
    }

    gameOver(reason) {
        this.isGameOver = true;
        this.stopTimer();
        this.showResultModal('😢 游戏结束', reason, 0);
    }

    calculateStars() {
        if (!this.level) return 3;
        
        let timeStars = 1;
        let scoreStars = 1;
        
        if (this.level.stars.time) {
            const timeThresholds = this.level.stars.time;
            if (this.time <= timeThresholds[0]) {
                timeStars = 3;
            } else if (this.time <= timeThresholds[1]) {
                timeStars = 2;
            } else if (this.time <= timeThresholds[2]) {
                timeStars = 1;
            } else {
                timeStars = 0;
            }
        }
        
        if (this.level.stars.score) {
            const scoreThresholds = this.level.stars.score;
            if (this.score >= scoreThresholds[0]) {
                scoreStars = 3;
            } else if (this.score >= scoreThresholds[1]) {
                scoreStars = 2;
            } else if (this.score >= scoreThresholds[2]) {
                scoreStars = 1;
            } else {
                scoreStars = 0;
            }
        }
        
        return Math.max(1, Math.min(timeStars, scoreStars));
    }

    showResultModal(title, message, stars) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modalScore.textContent = this.score;
        
        const minutes = Math.floor(this.time / 60);
        const seconds = this.time % 60;
        this.modalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.modalSteps.textContent = this.steps;
        
        this.modalStars.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = i < stars ? 'filled' : '';
            star.textContent = '★';
            star.style.animationDelay = `${i * 0.2}s`;
            this.modalStars.appendChild(star);
        }
        
        if (stars === 3) {
            this.modalConfirm.textContent = '下一关';
        } else {
            this.modalConfirm.textContent = '确定';
        }
        
        this.modal.classList.remove('hidden');
    }

    showNoMoveModal() {
        this.modalTitle.textContent = '🤔 没有可用配对';
        
        if (this.items.shuffle > 0) {
            this.modalMessage.textContent = `当前没有可消除的配对了。\n使用洗牌道具重新排列牌面？`;
            this.modalConfirm.textContent = '使用洗牌';
            this.modalRestart.classList.remove('hidden');
            this.currentModalAction = 'shuffle';
        } else {
            this.modalMessage.textContent = `洗牌道具已用完，游戏结束！`;
            this.modalConfirm.textContent = '重新开始';
            this.modalRestart.classList.add('hidden');
            this.currentModalAction = 'restart';
        }
        
        this.modalStars.innerHTML = '';
        this.modalScore.textContent = '-';
        this.modalTime.textContent = '-';
        this.modalSteps.textContent = '-';
        
        this.modal.classList.remove('hidden');
    }

    handleModalConfirm() {
        this.modal.classList.add('hidden');
        
        if (this.isGameOver) {
            if (this.calculateStars() === 3 && this.levelId < Levels.getLevelCount()) {
                this.nextLevel();
            } else {
                this.goToMenu();
            }
        } else if (this.currentModalAction === 'shuffle') {
            this.useShuffle();
        } else {
            this.restartLevel();
        }
    }

    restartLevel() {
        this.modal.classList.add('hidden');
        this.startGame();
    }

    nextLevel() {
        this.levelId++;
        if (this.levelId > Levels.getLevelCount()) {
            this.goToMenu();
            return;
        }
        this.level = Levels.getLevel(this.levelId);
        this.initBoard();
        this.pathFinder = new PathFinder(this.board);
        this.startGame();
    }

    goToMenu() {
        this.stopTimer();
        window.location.href = 'menu.html';
    }
}

const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
