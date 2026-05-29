class GameUI {
    constructor() {
        this.game = new Game();
        this.initElements();
        this.bindEvents();
        this.initGame();
    }

    initElements() {
        this.pipeGrid = document.getElementById('pipeGrid');
        this.timerDisplay = document.getElementById('timer');
        this.unconnectedDisplay = document.getElementById('unconnected');
        this.levelDisplay = document.getElementById('level');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.difficultySelect = document.getElementById('difficulty');
        this.winModal = document.getElementById('winModal');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.finalTimeDisplay = document.getElementById('finalTime');
        this.starsDisplay = document.getElementById('stars');
        this.bestScoreDisplay = document.getElementById('bestScore');
        this.nextLevelBtn = document.getElementById('nextLevelBtn');
        this.replayBtn = document.getElementById('replayBtn');
        this.modeSelect = document.getElementById('gameMode');
        this.movesDisplay = document.getElementById('movesDisplay');
        this.movesContainer = document.getElementById('movesContainer');
        this.liquidTypeDisplay = document.getElementById('liquidTypeDisplay');
        this.liquidInfo = document.getElementById('liquidInfo');
        this.levelSelectModal = document.getElementById('levelSelectModal');
        this.openLevelSelectBtn = document.getElementById('levelSelectBtn');
        this.closeLevelSelectBtn = document.getElementById('closeLevelSelect');
        this.levelGrid = document.getElementById('levelGrid');
        this.toolPanel = document.getElementById('toolPanel');
        this.toolWrenchBtn = document.getElementById('toolWrench');
        this.toolPatchBtn = document.getElementById('toolPatch');
        this.activeTool = null;
        this.editorBtn = document.getElementById('editorBtn');
        this.customLevelsBtn = document.getElementById('customLevelsBtn');
        this.customLevelsModal = document.getElementById('customLevelsModal');
        this.closeCustomLevelsBtn = document.getElementById('closeCustomLevels');
        this.customLevelsList = document.getElementById('customLevelsList');
        this.importLevelBtn = document.getElementById('importLevelBtn');
        this.importModal = document.getElementById('importModal');
        this.closeImportBtn = document.getElementById('closeImport');
        this.importTextarea = document.getElementById('importTextarea');
        this.importConfirmBtn = document.getElementById('importConfirm');
        this.gameOverReason = document.getElementById('gameOverReason');
        this.gameOverStats = document.getElementById('gameOverStats');
        this.gameOverReplayBtn = document.getElementById('gameOverReplay');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.difficultySelect.addEventListener('change', () => this.changeDifficulty());
        this.modeSelect.addEventListener('change', () => this.changeMode());
        this.pipeGrid.addEventListener('click', (e) => this.handlePipeClick(e));
        this.nextLevelBtn.addEventListener('click', () => this.nextLevel());
        this.replayBtn.addEventListener('click', () => this.replayLevel());
        this.gameOverReplayBtn.addEventListener('click', () => this.replayLevel());
        this.gameOverSelectLevelBtn = document.getElementById('gameOverSelectLevel');
        this.gameOverSelectLevelBtn.addEventListener('click', () => {
            this.closeGameOverModal();
            this.showLevelSelect();
        });
        this.winModal.addEventListener('click', (e) => {
            if (e.target === this.winModal) this.closeWinModal();
        });
        this.gameOverModal.addEventListener('click', (e) => {
            if (e.target === this.gameOverModal) this.closeGameOverModal();
        });
        this.openLevelSelectBtn.addEventListener('click', () => this.showLevelSelect());
        this.closeLevelSelectBtn.addEventListener('click', () => this.closeLevelSelect());
        this.toolWrenchBtn.addEventListener('click', () => this.setActiveTool('wrench'));
        this.toolPatchBtn.addEventListener('click', () => this.setActiveTool('patch'));
        this.editorBtn.addEventListener('click', () => this.openEditor());
        this.customLevelsBtn.addEventListener('click', () => this.showCustomLevels());
        this.closeCustomLevelsBtn.addEventListener('click', () => this.closeCustomLevels());
        this.importLevelBtn.addEventListener('click', () => this.showImportModal());
        this.closeImportBtn.addEventListener('click', () => this.closeImportModal());
        this.importConfirmBtn.addEventListener('click', () => this.handleImport());

        this.game.onTimerUpdate = (time) => {
            this.updateTimer(time);
        };

        this.game.onWinCallback = (result) => {
            this.showWinModal(result);
        };

        this.game.onGameOver = (result) => {
            this.showGameOverModal(result);
        };

        this.game.onMove = (moves) => {
            this.updateMoves(moves);
        };

        window.addEventListener('resize', () => this.handleResize());
    }

    initGame() {
        const difficulty = this.difficultySelect.value;
        const mode = this.modeSelect.value;
        this.game.init(difficulty, mode, 1);
        this.renderGrid();
        this.updateUI();
        this.updateLiquidInfo();
        this.updateModeUI();
        
        if (window.particleSystem) {
            window.particleSystem.init(document.getElementById('particlesContainer'));
        }
    }

    startGame() {
        this.game.stopTimer();
        this.game.clearWaterAnimation();
        this.game.movesUsed = 0;
        this.game.currentCustomLevel = null;
        const difficulty = this.difficultySelect.value;
        const mode = this.modeSelect.value;
        this.game.init(difficulty, mode, this.game.level);
        this.renderGrid();
        this.game.startTimer();
        this.updateUI();
        this.updateLiquidInfo();
        this.updateModeUI();
        this.activeTool = null;
        this.updateToolButtons();
    }

    resetGame() {
        this.game.stopTimer();
        this.game.clearWaterAnimation();
        this.game.resetLevel();
        this.renderGrid();
        this.game.startTimer();
        this.updateUI();
        this.updateLiquidInfo();
        this.activeTool = null;
        this.updateToolButtons();
    }

    changeDifficulty() {
        this.game.stopTimer();
        this.game.clearWaterAnimation();
        const difficulty = this.difficultySelect.value;
        const mode = this.modeSelect.value;
        this.game.level = 1;
        this.game.currentCustomLevel = null;
        this.game.init(difficulty, mode, 1);
        this.renderGrid();
        this.updateUI();
        this.updateLiquidInfo();
        this.updateModeUI();
    }

    changeMode() {
        this.game.stopTimer();
        this.game.clearWaterAnimation();
        const difficulty = this.difficultySelect.value;
        const mode = this.modeSelect.value;
        this.game.level = 1;
        this.game.currentCustomLevel = null;
        this.game.init(difficulty, mode, 1);
        this.renderGrid();
        this.updateUI();
        this.updateLiquidInfo();
        this.updateModeUI();
    }

    handlePipeClick(e) {
        const cell = e.target.closest('.pipe-cell');
        if (!cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        const pipe = this.game.grid[row][col];
        
        if (this.activeTool === 'wrench' && pipe.isBlocked && !pipe.blockageCleared) {
            if (this.game.clearBlockage(row, col)) {
                this.game.grid[row][col].updateVisual();
                this.game.updateVisuals();
                this.renderGrid();
                this.updateUI();
                this.activeTool = null;
                this.updateToolButtons();
            }
            return;
        }
        
        if (this.activeTool === 'patch' && pipe.isLeaking && !pipe.leakFixed) {
            if (this.game.fixLeak(row, col)) {
                this.game.grid[row][col].updateVisual();
                this.game.updateVisuals();
                this.renderGrid();
                this.updateUI();
                this.activeTool = null;
                this.updateToolButtons();
            }
            return;
        }

        if (pipe.isValve) {
            if (this.game.toggleValve(row, col)) {
                this.game.grid[row][col].updateVisual();
                this.game.updateVisuals();
                this.updateUI();
            }
            return;
        }

        if (this.game.rotatePipe(row, col)) {
            this.game.grid[row][col].updateVisual();
            this.game.updateVisuals();
            this.updateUI();
        }
    }

    setActiveTool(tool) {
        if (this.activeTool === tool) {
            this.activeTool = null;
        } else {
            this.activeTool = tool;
        }
        this.updateToolButtons();
    }

    updateToolButtons() {
        this.toolWrenchBtn.classList.toggle('active', this.activeTool === 'wrench');
        this.toolPatchBtn.classList.toggle('active', this.activeTool === 'patch');
    }

    renderGrid() {
        this.game.render(this.pipeGrid);
    }

    updateUI() {
        this.updateTimer(this.game.elapsedTime);
        this.updateUnconnected();
        this.updateLevel();
        this.updateMoves(this.game.movesUsed);
    }

    updateTimer(time) {
        if (this.game.gameMode === GAME_MODE.TIMED && this.game.isPlaying) {
            const remaining = Math.max(0, this.game.remainingTime);
            this.timerDisplay.textContent = this.game.formatTime(remaining);
            if (remaining <= 30) {
                this.timerDisplay.style.color = 'var(--danger-color)';
            } else {
                this.timerDisplay.style.color = 'var(--primary-color)';
            }
        } else {
            this.timerDisplay.textContent = this.game.formatTime(time);
            this.timerDisplay.style.color = 'var(--primary-color)';
        }
    }

    updateUnconnected() {
        const count = this.game.getUnconnectedCount();
        this.unconnectedDisplay.textContent = count;
        
        if (count === 0) {
            this.unconnectedDisplay.style.color = 'var(--secondary-color)';
        } else {
            this.unconnectedDisplay.style.color = 'var(--warning-color)';
        }
    }

    updateLevel() {
        this.levelDisplay.textContent = this.game.level;
    }

    updateMoves(moves) {
        if (this.game.gameMode === GAME_MODE.MOVES) {
            const remaining = this.game.movesLimit - moves;
            this.movesDisplay.textContent = remaining;
            if (remaining <= 5) {
                this.movesDisplay.style.color = 'var(--danger-color)';
            } else {
                this.movesDisplay.style.color = 'var(--primary-color)';
            }
        } else {
            this.movesDisplay.textContent = moves;
            this.movesDisplay.style.color = 'var(--primary-color)';
        }
    }

    updateLiquidInfo() {
        const config = LIQUID_CONFIG[this.game.liquidType];
        this.liquidInfo.textContent = `${config.icon} ${config.name}`;
    }

    updateModeUI() {
        if (this.game.gameMode === GAME_MODE.MOVES) {
            this.movesContainer.classList.add('show');
        } else {
            this.movesContainer.classList.remove('show');
        }
    }

    async showWinModal(result) {
        await this.game.playWaterAnimation();
        await this.game.delay(500);

        this.finalTimeDisplay.textContent = result.formattedTime;
        
        const stars = '⭐'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
        this.starsDisplay.textContent = stars;
        
        this.bestScoreDisplay.textContent = this.game.getBestScore();
        
        this.winModal.classList.add('active');
    }

    closeWinModal() {
        this.winModal.classList.remove('active');
    }

    showGameOverModal(result) {
        this.game.stopTimer();
        let reasonText = '';
        let statsText = '';
        
        if (result.reason === 'time') {
            reasonText = '⏰ 时间耗尽！';
            statsText = `用时：${this.game.formatTime(this.game.elapsedTime)}`;
        } else if (result.reason === 'moves') {
            reasonText = '🔢 步数用尽！';
            statsText = `已用步数：${this.game.movesUsed}`;
        }
        
        this.gameOverReason.textContent = reasonText;
        this.gameOverStats.textContent = statsText;
        this.gameOverModal.classList.add('active');
    }

    closeGameOverModal() {
        this.gameOverModal.classList.remove('active');
    }

    nextLevel() {
        this.closeWinModal();
        this.closeGameOverModal();
        this.game.clearWaterAnimation();
        this.game.nextLevel();
        this.renderGrid();
        this.game.startTimer();
        this.updateUI();
        this.updateLiquidInfo();
        this.updateModeUI();
    }

    replayLevel() {
        this.closeWinModal();
        this.closeGameOverModal();
        this.game.clearWaterAnimation();
        this.game.resetLevel();
        this.renderGrid();
        this.game.startTimer();
        this.updateUI();
        this.updateLiquidInfo();
    }

    showLevelSelect() {
        this.renderLevelGrid();
        this.levelSelectModal.classList.add('active');
    }

    closeLevelSelect() {
        this.levelSelectModal.classList.remove('active');
    }

    renderLevelGrid() {
        this.levelGrid.innerHTML = '';
        const totalLevels = LEVEL_CONFIGS.length;
        const unlocked = this.game.unlockedLevel;
        
        for (let i = 1; i <= totalLevels; i++) {
            const config = LEVEL_CONFIGS[i - 1];
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            
            const isUnlocked = i <= unlocked;
            if (!isUnlocked) {
                btn.classList.add('locked');
                btn.innerHTML = `
                    <span class="level-num">${i}</span>
                    <span class="level-lock">🔒</span>
                `;
                btn.disabled = true;
            } else {
                const liquidConfig = LIQUID_CONFIG[config.liquidType];
                const bestKey = `${this.game.difficulty}_${this.game.gameMode}_level_${i}`;
                const bestScore = this.game.bestScores[bestKey];
                const stars = bestScore ? '⭐'.repeat(bestScore.stars) : '';
                
                btn.innerHTML = `
                    <span class="level-num">${i}</span>
                    <span class="level-size">${config.rows}×${config.cols}</span>
                    <span class="level-liquid">${liquidConfig.icon}</span>
                    <span class="level-stars">${stars}</span>
                `;
                
                btn.addEventListener('click', () => {
                    this.closeLevelSelect();
                    this.game.level = i;
                    this.startGame();
                });
            }
            
            this.levelGrid.appendChild(btn);
        }
    }

    showCustomLevels() {
        this.renderCustomLevelsList();
        this.customLevelsModal.classList.add('active');
    }

    closeCustomLevels() {
        this.customLevelsModal.classList.remove('active');
    }

    renderCustomLevelsList() {
        this.customLevelsList.innerHTML = '';
        
        if (this.game.customLevels.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-hint';
            empty.textContent = '暂无自定义关卡，快去编辑器创建吧！';
            this.customLevelsList.appendChild(empty);
            return;
        }
        
        this.game.customLevels.forEach((level, index) => {
            const item = document.createElement('div');
            item.className = 'custom-level-item';
            
            const name = level.name || `关卡 ${index + 1}`;
            const liquidConfig = LIQUID_CONFIG[level.liquidType] || LIQUID_CONFIG[LIQUID_TYPES.WATER];
            
            item.innerHTML = `
                <span class="custom-level-name">${name}</span>
                <span class="custom-level-info">${level.rows}×${level.cols} ${liquidConfig.icon}</span>
                <button class="btn-play-custom" data-index="${index}">▶ 游玩</button>
                <button class="btn-export-custom" data-index="${index}">📤 导出</button>
                <button class="btn-delete-custom" data-index="${index}">🗑</button>
            `;
            
            item.querySelector('.btn-play-custom').addEventListener('click', () => {
                this.closeCustomLevels();
                this.game.stopTimer();
                this.game.playCustomLevel(level);
                this.renderGrid();
                this.game.startTimer();
                this.updateUI();
                this.updateLiquidInfo();
            });
            
            item.querySelector('.btn-export-custom').addEventListener('click', () => {
                const json = this.game.exportLevel(level);
                navigator.clipboard.writeText(json).then(() => {
                    alert('关卡数据已复制到剪贴板！');
                }).catch(() => {
                    const textarea = document.createElement('textarea');
                    textarea.value = json;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    alert('关卡数据已复制到剪贴板！');
                });
            });
            
            item.querySelector('.btn-delete-custom').addEventListener('click', () => {
                if (confirm('确定要删除这个关卡吗？')) {
                    this.game.deleteCustomLevel(index);
                    this.renderCustomLevelsList();
                }
            });
            
            this.customLevelsList.appendChild(item);
        });
    }

    showImportModal() {
        this.importTextarea.value = '';
        this.importModal.classList.add('active');
    }

    closeImportModal() {
        this.importModal.classList.remove('active');
    }

    handleImport() {
        const json = this.importTextarea.value.trim();
        if (!json) {
            alert('请粘贴关卡数据');
            return;
        }
        
        try {
            const levelData = this.game.importLevel(json);
            const name = prompt('请输入关卡名称：', levelData.name || '导入关卡');
            levelData.name = name || '导入关卡';
            this.game.saveCustomLevel(levelData);
            this.closeImportModal();
            alert('关卡导入成功！');
        } catch (e) {
            alert(e.message);
        }
    }

    openEditor() {
        if (window.LevelEditor) {
            new window.LevelEditor(this.game);
        }
    }

    handleResize() {
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const gameUI = new GameUI();
    window.gameUI = gameUI;
});