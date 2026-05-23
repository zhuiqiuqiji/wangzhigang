class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.track = null;
        this.playerCar = null;
        this.aiCars = [];
        this.carData = [];
        this.particleSystem = new ParticleSystem();
        this.trackEditor = new TrackEditor(this.canvas);
        
        this.selectedCarType = 'balanced';
        this.selectedTheme = 'neon';
        this.selectedDifficulty = 'normal';
        
        this.totalLaps = 3;
        this.gameState = 'start';
        this.rankings = [];
        this.timer = new Timer();
        
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            nitro: false
        };
        
        this.lastTime = 0;
        this.animationId = null;
        
        this.setupSelectionUI();
        this.setupInput();
        this.setupHUDReferences();
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupSelectionUI() {
        const carButtons = document.querySelectorAll('#car-selection .select-btn');
        carButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                carButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedCarType = btn.dataset.car;
            });
        });
        
        const themeButtons = document.querySelectorAll('#theme-selection .select-btn');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTheme = btn.dataset.theme;
            });
        });
        
        const difficultyButtons = document.querySelectorAll('#difficulty-selection .select-btn');
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                difficultyButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedDifficulty = btn.dataset.difficulty;
            });
        });
        
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        
        startBtn.addEventListener('click', () => this.startGame());
        restartBtn.addEventListener('click', () => this.restartGame());
    }

    setupHUDReferences() {
        this.lapDisplay = document.getElementById('lap-display');
        this.rankDisplay = document.getElementById('rank-display');
        this.lapTimeDisplay = document.getElementById('lap-time');
        this.totalTimeDisplay = document.getElementById('total-time');
        this.checkpointProgress = document.getElementById('checkpoint-progress');
        this.startScreen = document.getElementById('start-screen');
        this.hud = document.getElementById('hud');
        this.endScreen = document.getElementById('end-screen');
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        
        if (!this.track) {
            this.track = new Track(this.canvas, this.selectedTheme);
            return;
        }
        
        if (this.gameState === 'playing') {
            const savedState = this.saveGameState(oldWidth, oldHeight);
            this.track = new Track(this.canvas, this.selectedTheme);
            this.restoreGameState(savedState, newWidth, newHeight);
        } else {
            this.track = new Track(this.canvas, this.selectedTheme);
        }
    }

    saveGameState(oldWidth, oldHeight) {
        const state = {
            carStates: []
        };
        
        const scaleX = this.canvas.width / oldWidth;
        const scaleY = this.canvas.height / oldHeight;
        
        this.carData.forEach(data => {
            state.carStates.push({
                x: data.car.x * scaleX,
                y: data.car.y * scaleY,
                angle: data.car.angle,
                vx: data.car.vx,
                vy: data.car.vy,
                lap: data.lap,
                checkpointIndex: data.checkpointManager.currentCheckpoint,
                checkpointsPassed: data.checkpointManager.checkpoints.map(cp => cp.passed),
                isPlayer: data.isPlayer,
                carType: data.car.configType,
                aiStyle: data.car.aiStyle,
                difficulty: data.car.difficulty,
                nitro: data.car.nitro,
                damage: data.car.damage
            });
        });
        
        return state;
    }

    restoreGameState(state, newWidth, newHeight) {
        this.carData = [];
        this.aiCars = [];
        
        state.carStates.forEach((carState, index) => {
            const checkpointManager = new CheckpointManager(this.track);
            
            carState.checkpointsPassed.forEach((passed, i) => {
                checkpointManager.checkpoints[i].passed = passed;
            });
            checkpointManager.currentCheckpoint = carState.checkpointIndex;
            
            const car = new Car(
                carState.x,
                carState.y,
                carState.angle,
                carState.carType,
                carState.isPlayer,
                carState.aiStyle,
                carState.difficulty
            );
            car.vx = carState.vx;
            car.vy = carState.vy;
            car.nitro = carState.nitro;
            car.damage = carState.damage;
            car.setParticleSystem(this.particleSystem);
            
            this.carData.push({
                car: car,
                checkpointManager: checkpointManager,
                lap: carState.lap,
                isPlayer: carState.isPlayer,
                finished: false
            });
            
            if (carState.isPlayer) {
                this.playerCar = car;
            } else {
                this.aiCars.push(car);
            }
        });
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keys.up = true;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.keys.down = true;
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = true;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = true;
                    e.preventDefault();
                    break;
                case ' ':
                    this.keys.nitro = true;
                    e.preventDefault();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.keys.down = false;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = false;
                    break;
                case ' ':
                    this.keys.nitro = false;
                    break;
            }
        });
    }

    initCars() {
        const startPos = this.track.getStartPosition();
        this.carData = [];
        this.aiCars = [];
        this.particleSystem.clear();
        
        this.playerCar = new Car(
            startPos.x - 30,
            startPos.y,
            startPos.angle,
            this.selectedCarType,
            true
        );
        this.playerCar.setParticleSystem(this.particleSystem);
        
        this.carData.push({
            car: this.playerCar,
            checkpointManager: new CheckpointManager(this.track),
            lap: 1,
            isPlayer: true,
            finished: false
        });
        
        const aiStyles = ['aggressive', 'conservative', 'balanced'];
        const aiCarTypes = ['speed', 'handling', 'balanced'];
        const aiStartPositions = [
            { x: 30, y: 50 },
            { x: 60, y: -50 },
            { x: 90, y: 50 }
        ];
        
        for (let i = 0; i < 3; i++) {
            const aiCar = new Car(
                startPos.x + aiStartPositions[i].x,
                startPos.y + aiStartPositions[i].y,
                startPos.angle,
                aiCarTypes[i],
                false,
                aiStyles[i],
                this.selectedDifficulty
            );
            aiCar.setParticleSystem(this.particleSystem);
            this.aiCars.push(aiCar);
            
            this.carData.push({
                car: aiCar,
                checkpointManager: new CheckpointManager(this.track),
                lap: 1,
                isPlayer: false,
                finished: false
            });
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.rankings = [];
        
        this.track = new Track(this.canvas, this.selectedTheme);
        this.initCars();
        this.timer.reset();
        this.timer.start();
        
        this.startScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.endScreen.classList.add('hidden');
        
        this.lastTime = performance.now();
        this.gameLoop();
    }

    restartGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.startGame();
    }

    gameLoop(currentTime = performance.now()) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        this.carData.forEach(data => {
            if (data.finished) return;
            
            if (data.isPlayer) {
                data.car.update(this.keys, deltaTime, this.track);
            } else {
                data.car.update({}, deltaTime, this.track, data.checkpointManager);
            }
            
            this.checkCheckpoints(data);
        });
        
        this.particleSystem.update(deltaTime);
        this.updateRankings();
        this.updateHUD();
    }

    checkCheckpoints(data) {
        if (data.checkpointManager.checkCarCheckpoint(data.car)) {
            if (data.checkpointManager.isLapComplete()) {
                this.completeLap(data);
            }
        }
    }

    completeLap(data) {
        data.checkpointManager.reset();
        
        if (data.lap >= this.totalLaps) {
            data.finished = true;
            
            if (data.isPlayer) {
                this.timer.lap();
                this.endGame();
            }
        } else {
            data.lap++;
            
            if (data.isPlayer) {
                this.timer.lap();
            }
        }
    }

    updateRankings() {
        const allCars = this.carData.map(data => ({
            car: data.car,
            isPlayer: data.isPlayer,
            lap: data.lap,
            checkpoints: data.checkpointManager.getPassedCount(),
            finished: data.finished
        }));
        
        allCars.sort((a, b) => {
            if (b.finished !== a.finished) return b.finished ? 1 : -1;
            if (b.lap !== a.lap) return b.lap - a.lap;
            if (b.checkpoints !== a.checkpoints) return b.checkpoints - a.checkpoints;
            return 0;
        });
        
        this.rankings = allCars;
    }

    getPlayerData() {
        return this.carData.find(d => d.isPlayer);
    }

    updateHUD() {
        const playerData = this.getPlayerData();
        if (!playerData) return;
        
        this.lapDisplay.textContent = `${playerData.lap} / ${this.totalLaps}`;
        
        const playerRank = this.rankings.findIndex(r => r.isPlayer) + 1;
        this.rankDisplay.textContent = Utils.getOrdinalSuffix(playerRank);
        
        this.lapTimeDisplay.textContent = Utils.formatTime(this.timer.getCurrentLapTime());
        this.totalTimeDisplay.textContent = Utils.formatTime(this.timer.getElapsed());
        
        const progress = playerData.checkpointManager.getProgress();
        this.checkpointProgress.textContent = `${progress.current} / ${progress.total}`;
    }

    endGame() {
        this.gameState = 'ended';
        this.timer.stop();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.showEndScreen();
    }

    showEndScreen() {
        this.hud.classList.add('hidden');
        this.endScreen.classList.remove('hidden');
        
        const resultsBody = document.getElementById('results-body');
        const lapTimesList = document.getElementById('lap-times-list');
        const finalTotalTime = document.getElementById('final-total-time');
        
        resultsBody.innerHTML = '';
        lapTimesList.innerHTML = '';
        
        this.rankings.forEach((ranking, index) => {
            const row = document.createElement('div');
            row.className = `result-row ${index === 0 ? 'winner' : ''}`;
            row.innerHTML = `
                <span>${Utils.getOrdinalSuffix(index + 1)}</span>
                <span>${ranking.lap} 圈</span>
                <span>${ranking.isPlayer ? '玩家' : `AI ${this.rankings.filter((r, i) => !r.isPlayer && i < index).length + 1}`}</span>
            `;
            resultsBody.appendChild(row);
        });
        
        const lapTimes = this.timer.getLapTimes();
        lapTimes.forEach((time, index) => {
            const lapItem = document.createElement('div');
            lapItem.className = 'lap-time-item';
            lapItem.innerHTML = `
                <span class="lap-label">第 ${index + 1} 圈</span>
                <span class="lap-value">${Utils.formatTime(time)}</span>
            `;
            lapTimesList.appendChild(lapItem);
        });
        
        finalTotalTime.textContent = Utils.formatTime(this.timer.getElapsed());
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.track.draw(this.getPlayerCheckpointStates());
        
        this.particleSystem.draw(this.ctx);
        
        this.carData.forEach(data => {
            if (!data.isPlayer) {
                data.car.draw(this.ctx);
            }
        });
        
        if (this.playerCar) {
            this.playerCar.draw(this.ctx);
        }
        
        this.trackEditor.draw();
    }
    
    getPlayerCheckpointStates() {
        const playerData = this.getPlayerData();
        if (!playerData) return null;
        return playerData.checkpointManager.checkpoints.map(cp => cp.passed);
    }
}

window.addEventListener('load', () => {
    const game = new Game();
});
