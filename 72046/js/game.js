const GAME_MODE = {
    CLASSIC: 'classic',
    TIMED: 'timed',
    MOVES: 'moves'
};

const GAME_MODE_LABELS = {
    [GAME_MODE.CLASSIC]: '经典模式',
    [GAME_MODE.TIMED]: '限时挑战',
    [GAME_MODE.MOVES]: '步数限制'
};

const LEVEL_CONFIGS = [
    { rows: 5, cols: 5, obstacles: 0, liquidType: LIQUID_TYPES.WATER },
    { rows: 5, cols: 5, obstacles: 1, liquidType: LIQUID_TYPES.WATER },
    { rows: 6, cols: 6, obstacles: 1, liquidType: LIQUID_TYPES.WATER },
    { rows: 6, cols: 6, obstacles: 2, liquidType: LIQUID_TYPES.SEWAGE },
    { rows: 6, cols: 6, obstacles: 2, liquidType: LIQUID_TYPES.SEWAGE },
    { rows: 7, cols: 7, obstacles: 2, liquidType: LIQUID_TYPES.SEWAGE },
    { rows: 7, cols: 7, obstacles: 3, liquidType: LIQUID_TYPES.STEAM },
    { rows: 7, cols: 7, obstacles: 3, liquidType: LIQUID_TYPES.STEAM },
    { rows: 8, cols: 8, obstacles: 3, liquidType: LIQUID_TYPES.STEAM },
    { rows: 8, cols: 8, obstacles: 4, liquidType: LIQUID_TYPES.WATER }
];

const TIMED_MODE_DURATIONS = [120, 150, 180, 210, 240, 270, 300, 330, 360, 420];
const MOVES_MODE_LIMITS = [15, 18, 22, 26, 30, 35, 40, 45, 50, 60];

class Game {
    constructor() {
        this.grid = [];
        this.rows = 6;
        this.cols = 6;
        this.startRow = 0;
        this.startCol = 0;
        this.endRow = 0;
        this.endCol = 0;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isPlaying = false;
        this.level = 1;
        this.difficulty = 'medium';
        this.gameMode = GAME_MODE.CLASSIC;
        this.bestScores = this.loadBestScores();
        this.connectedPath = [];
        this.movesUsed = 0;
        this.movesLimit = 0;
        this.timeLimit = 0;
        this.remainingTime = 0;
        this.liquidType = LIQUID_TYPES.WATER;
        this.obstacles = [];
        this.onGameOver = null;
        this.onMove = null;
        this.customLevels = this.loadCustomLevels();
        this.currentCustomLevel = null;
        this.unlockedLevel = this.loadUnlockedLevel();
    }

    init(difficulty = 'medium', mode = GAME_MODE.CLASSIC, level = 1) {
        this.difficulty = difficulty;
        this.gameMode = mode;
        this.level = level;
        this.movesUsed = 0;
        this.setLevelConfig();
        this.generateLevel();
    }

    setLevelConfig() {
        if (this.currentCustomLevel) {
            this.rows = this.currentCustomLevel.rows;
            this.cols = this.currentCustomLevel.cols;
            this.liquidType = this.currentCustomLevel.liquidType || LIQUID_TYPES.WATER;
            return;
        }

        const levelIdx = Math.min(this.level - 1, LEVEL_CONFIGS.length - 1);
        const config = LEVEL_CONFIGS[levelIdx];
        
        let baseRows = config.rows;
        let baseCols = config.cols;
        
        if (this.difficulty === 'easy') {
            baseRows = Math.max(4, baseRows - 1);
            baseCols = Math.max(4, baseCols - 1);
        } else if (this.difficulty === 'hard') {
            baseRows = baseRows + 1;
            baseCols = baseCols + 1;
        }
        
        this.rows = baseRows;
        this.cols = baseCols;
        this.liquidType = config.liquidType;
        
        const modeIdx = Math.min(this.level - 1, TIMED_MODE_DURATIONS.length - 1);
        if (this.gameMode === GAME_MODE.TIMED) {
            this.timeLimit = TIMED_MODE_DURATIONS[modeIdx];
            this.remainingTime = this.timeLimit;
        }
        if (this.gameMode === GAME_MODE.MOVES) {
            this.movesLimit = MOVES_MODE_LIMITS[modeIdx];
        }
    }

    generateLevel() {
        this.grid = [];
        this.connectedPath = [];
        this.obstacles = [];
        this.movesUsed = 0;
        
        this.startRow = Math.floor(this.rows / 2);
        this.startCol = 0;
        this.endRow = Math.floor(this.rows / 2);
        this.endCol = this.cols - 1;

        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = null;
            }
        }

        if (this.currentCustomLevel) {
            this.applyCustomLevel();
        } else {
            this.generatePath();
            this.addObstacles();
            this.fillEmptyCells();
            this.applyLiquidType();
            this.randomizeRotations();
        }
        
        this.checkConnectivity();
    }

    applyCustomLevel() {
        const level = this.currentCustomLevel;
        this.liquidType = level.liquidType || LIQUID_TYPES.WATER;
        
        if (level.startPos) {
            this.startRow = level.startPos.row;
            this.startCol = level.startPos.col;
        }
        if (level.endPos) {
            this.endRow = level.endPos.row;
            this.endCol = level.endPos.col;
        }
        
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = null;
            }
        }
        
        for (const pipeData of level.pipes) {
            const pipe = Pipe.fromJSON(pipeData);
            if (pipe.row >= 0 && pipe.row < this.rows && pipe.col >= 0 && pipe.col < this.cols) {
                this.grid[pipe.row][pipe.col] = pipe;
            }
            
            if (pipe.isBlocked && !pipe.blockageCleared) {
                this.obstacles.push({ row: pipe.row, col: pipe.col, type: 'blocked' });
            }
            if (pipe.isLeaking && !pipe.leakFixed) {
                this.obstacles.push({ row: pipe.row, col: pipe.col, type: 'leaking' });
            }
        }
        
        this.connectedPath = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c]) {
                    this.connectedPath.push({ row: r, col: c });
                }
            }
        }
    }

    addObstacles() {
        const levelIdx = Math.min(this.level - 1, LEVEL_CONFIGS.length - 1);
        const config = LEVEL_CONFIGS[levelIdx];
        const obstacleCount = config.obstacles;
        
        const availablePositions = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const isOnPath = this.connectedPath.some(p => p.row === row && p.col === col);
                const isStartOrEnd = (row === this.startRow && col === this.startCol) || 
                                     (row === this.endRow && col === this.endCol);
                if (!isOnPath && !isStartOrEnd) {
                    availablePositions.push({ row, col });
                }
            }
        }
        
        for (let i = 0; i < obstacleCount && availablePositions.length > 0; i++) {
            const idx = Math.floor(Math.random() * availablePositions.length);
            const pos = availablePositions.splice(idx, 1)[0];
            
            const obstacleType = Math.random() > 0.5 ? PIPE_TYPES.BLOCKED : PIPE_TYPES.LEAKING;
            this.grid[pos.row][pos.col] = new Pipe(obstacleType, pos.row, pos.col);
            this.grid[pos.row][pos.col].liquidType = this.liquidType;
            this.obstacles.push({ row: pos.row, col: pos.col, type: obstacleType });
        }
    }

    applyLiquidType() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    this.grid[row][col].liquidType = this.liquidType;
                }
            }
        }
    }

    generatePath() {
        const maxRetries = 50;
        for (let retry = 0; retry < maxRetries; retry++) {
            const result = this.tryGeneratePath();
            if (result) {
                this.connectedPath = result;
                return;
            }
        }
        this.connectedPath = [];
    }

    tryGeneratePath() {
        const visited = new Set();
        const path = [];
        
        const startRow = this.startRow;
        const startCol = this.startCol;
        const endRow = this.endRow;
        const endCol = this.endCol;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = null;
            }
        }

        const startPipe = new Pipe(PIPE_TYPES.START, startRow, startCol);
        const startOpening = PIPE_OPENINGS[PIPE_TYPES.START][0];
        const startRotationSteps = (DIRECTION.RIGHT - startOpening + 4) % 4;
        startPipe.setRotation(startRotationSteps * 90);
        startPipe.liquidType = this.liquidType;
        this.grid[startRow][startCol] = startPipe;
        visited.add(`${startRow},${startCol}`);
        path.push({ row: startRow, col: startCol });

        let prevDirection = DIRECTION.RIGHT;
        let currentRow = startRow;
        let currentCol = startCol + 1;

        let steps = 0;
        const maxSteps = this.rows * this.cols * 4;

        while (currentCol !== endCol || currentRow !== endRow) {
            steps++;
            if (steps > maxSteps) {
                return null;
            }

            if (currentRow < 0 || currentRow >= this.rows || currentCol < 0 || currentCol >= this.cols) {
                return null;
            }

            const key = `${currentRow},${currentCol}`;
            if (visited.has(key)) {
                return null;
            }

            const directions = this.getValidDirections(currentRow, currentCol, visited, prevDirection);
            
            if (directions.length === 0) {
                return null;
            }

            let direction;
            if (currentCol < endCol && directions.includes(DIRECTION.RIGHT) && Math.random() > 0.3) {
                direction = DIRECTION.RIGHT;
            } else {
                direction = directions[Math.floor(Math.random() * directions.length)];
            }

            const pipeType = this.selectPipeType(prevDirection, direction);
            const rotation = this.getPipeRotation(prevDirection, direction);
            
            this.grid[currentRow][currentCol] = new Pipe(pipeType, currentRow, currentCol);
            this.grid[currentRow][currentCol].setRotation(rotation);
            this.grid[currentRow][currentCol].liquidType = this.liquidType;

            visited.add(key);
            path.push({ row: currentRow, col: currentCol });

            const offset = DIR_OFFSET[direction];
            const nextRow = currentRow + offset.row;
            const nextCol = currentCol + offset.col;

            prevDirection = direction;
            currentRow = nextRow;
            currentCol = nextCol;

            if (currentRow === endRow && currentCol === endCol) {
                const endPipe = new Pipe(PIPE_TYPES.END, endRow, endCol);
                const neededRotation = this.getNeededRotation(prevDirection);
                endPipe.setRotation(neededRotation);
                endPipe.liquidType = this.liquidType;
                this.grid[endRow][endCol] = endPipe;
                path.push({ row: endRow, col: endCol });
                visited.add(`${endRow},${endCol}`);
                break;
            }
        }

        return path;
    }

    getValidDirections(row, col, visited, prevDirection) {
        const directions = [];
        const opposites = new Set();
        
        if (prevDirection !== null) {
            opposites.add(OPPOSITE[prevDirection]);
        }

        if (row > 0 && !visited.has(`${row - 1},${col}`) && !opposites.has(DIRECTION.UP)) {
            directions.push(DIRECTION.UP);
        }
        if (col < this.cols - 1 && !visited.has(`${row},${col + 1}`) && !opposites.has(DIRECTION.RIGHT)) {
            directions.push(DIRECTION.RIGHT);
        }
        if (row < this.rows - 1 && !visited.has(`${row + 1},${col}`) && !opposites.has(DIRECTION.DOWN)) {
            directions.push(DIRECTION.DOWN);
        }
        if (col > 0 && !visited.has(`${row},${col - 1}`) && !opposites.has(DIRECTION.LEFT)) {
            directions.push(DIRECTION.LEFT);
        }

        return directions;
    }

    getRowOffset(direction) {
        return DIR_OFFSET[direction].row;
    }

    getColOffset(direction) {
        return DIR_OFFSET[direction].col;
    }

    selectPipeType(incoming, outgoing) {
        const realIncoming = OPPOSITE[incoming];
        const isStraight = OPPOSITE[realIncoming] === outgoing;
        
        if (isStraight) {
            return PIPE_TYPES.STRAIGHT;
        } else {
            return PIPE_TYPES.CURVE;
        }
    }

    getPipeRotation(incomingDir, outgoingDir) {
        const entryDir = OPPOSITE[incomingDir];
        const exitDir = outgoingDir;
        
        const isStraight = OPPOSITE[entryDir] === exitDir;
        
        if (isStraight) {
            if (entryDir === DIRECTION.UP || entryDir === DIRECTION.DOWN) {
                return 0;
            } else {
                return 90;
            }
        } else {
            if ((entryDir === DIRECTION.LEFT && exitDir === DIRECTION.UP) ||
                (entryDir === DIRECTION.UP && exitDir === DIRECTION.LEFT)) {
                return 270;
            }
            if ((entryDir === DIRECTION.DOWN && exitDir === DIRECTION.LEFT) ||
                (entryDir === DIRECTION.LEFT && exitDir === DIRECTION.DOWN)) {
                return 180;
            }
            if ((entryDir === DIRECTION.RIGHT && exitDir === DIRECTION.DOWN) ||
                (entryDir === DIRECTION.DOWN && exitDir === DIRECTION.RIGHT)) {
                return 90;
            }
            if ((entryDir === DIRECTION.UP && exitDir === DIRECTION.RIGHT) ||
                (entryDir === DIRECTION.RIGHT && exitDir === DIRECTION.UP)) {
                return 0;
            }
        }
        
        return 0;
    }

    getNeededRotation(incomingDirection) {
        const neededOpening = OPPOSITE[incomingDirection];
        const baseOpening = PIPE_OPENINGS[PIPE_TYPES.END][0];
        let rotationSteps = (neededOpening - baseOpening + 4) % 4;
        return rotationSteps * 90;
    }

    fillEmptyCells() {
        const pipeTypes = [PIPE_TYPES.STRAIGHT, PIPE_TYPES.CURVE, PIPE_TYPES.T_PIPE];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === null) {
                    const type = pipeTypes[Math.floor(Math.random() * pipeTypes.length)];
                    this.grid[row][col] = new Pipe(type, row, col);
                    this.grid[row][col].liquidType = this.liquidType;
                }
            }
        }
    }

    randomizeRotations() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col].randomRotation();
            }
        }
    }

    rotatePipe(row, col) {
        if (!this.isPlaying) return false;
        
        const pipe = this.grid[row][col];
        if (!pipe || pipe.isStart || pipe.isEnd) return false;
        if (pipe.isBlocked && !pipe.blockageCleared) return false;
        if (pipe.isLeaking && !pipe.leakFixed) return false;

        pipe.rotate();
        this.movesUsed++;
        
        if (this.onMove) {
            this.onMove(this.movesUsed);
        }
        
        this.checkConnectivity();
        
        if (this.checkWin()) {
            this.onWin();
        }
        
        if (this.gameMode === GAME_MODE.MOVES && this.movesUsed >= this.movesLimit && !this.checkWin()) {
            this.onGameOver && this.onGameOver({ reason: 'moves' });
        }

        return true;
    }

    toggleValve(row, col) {
        if (!this.isPlaying) return false;
        
        const pipe = this.grid[row][col];
        if (!pipe || !pipe.isValve) return false;
        
        pipe.toggleValve();
        this.movesUsed++;
        
        if (this.onMove) {
            this.onMove(this.movesUsed);
        }
        
        this.checkConnectivity();
        
        if (this.checkWin()) {
            this.onWin();
        }
        
        return true;
    }

    clearBlockage(row, col) {
        if (!this.isPlaying) return false;
        
        const pipe = this.grid[row][col];
        if (!pipe || !pipe.isBlocked || pipe.blockageCleared) return false;
        
        pipe.clearBlockage();
        this.movesUsed++;
        
        if (this.onMove) {
            this.onMove(this.movesUsed);
        }
        
        this.obstacles = this.obstacles.filter(o => !(o.row === row && o.col === col));
        
        this.checkConnectivity();
        
        if (this.checkWin()) {
            this.onWin();
        }
        
        return true;
    }

    fixLeak(row, col) {
        if (!this.isPlaying) return false;
        
        const pipe = this.grid[row][col];
        if (!pipe || !pipe.isLeaking || pipe.leakFixed) return false;
        
        pipe.fixLeak();
        this.movesUsed++;
        
        if (this.onMove) {
            this.onMove(this.movesUsed);
        }
        
        this.obstacles = this.obstacles.filter(o => !(o.row === row && o.col === col));
        
        this.checkConnectivity();
        
        if (this.checkWin()) {
            this.onWin();
        }
        
        return true;
    }

    checkConnectivity() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col].isConnected = false;
            }
        }

        const queue = [{ row: this.startRow, col: this.startCol }];
        const visited = new Set();
        visited.add(`${this.startRow},${this.startCol}`);
        this.grid[this.startRow][this.startCol].isConnected = true;

        while (queue.length > 0) {
            const { row, col } = queue.shift();
            const pipe = this.grid[row][col];
            const openings = pipe.getOpenings();

            for (const direction of openings) {
                const offset = DIR_OFFSET[direction];
                const neighborRow = row + offset.row;
                const neighborCol = col + offset.col;
                const key = `${neighborRow},${neighborCol}`;

                if (this.isValidCell(neighborRow, neighborCol) && !visited.has(key)) {
                    const neighbor = this.grid[neighborRow][neighborCol];
                    const oppositeDir = OPPOSITE[direction];

                    if (neighbor.hasOpening(oppositeDir)) {
                        visited.add(key);
                        neighbor.isConnected = true;
                        queue.push({ row: neighborRow, col: neighborCol });
                    }
                }
            }
        }

        return visited;
    }

    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    checkWin() {
        if (!this.grid[this.endRow][this.endCol].isConnected) {
            return false;
        }
        
        for (const { row, col } of this.connectedPath) {
            if (!this.grid[row][col].isConnected) {
                return false;
            }
        }
        
        return true;
    }

    getUnconnectedCount() {
        let count = 0;
        for (const { row, col } of this.connectedPath) {
            if (!this.grid[row][col].isConnected) {
                count++;
            }
        }
        return count;
    }

    getConnectedPipesInOrder() {
        return this.connectedPath;
    }

    startTimer() {
        this.startTime = Date.now();
        this.isPlaying = true;
        
        if (this.gameMode === GAME_MODE.TIMED) {
            this.remainingTime = this.timeLimit;
        }
        
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            
            if (this.gameMode === GAME_MODE.TIMED) {
                this.remainingTime = this.timeLimit - this.elapsedTime;
                if (this.remainingTime <= 0) {
                    this.remainingTime = 0;
                    this.stopTimer();
                    this.isPlaying = false;
                    if (this.onGameOver) {
                        this.onGameOver({ reason: 'time' });
                    }
                }
            }
            
            if (this.onTimerUpdate) {
                this.onTimerUpdate(this.elapsedTime);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isPlaying = false;
    }

    resetTimer() {
        this.stopTimer();
        this.elapsedTime = 0;
        if (this.onTimerUpdate) {
            this.onTimerUpdate(0);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    calculateStars() {
        if (this.gameMode === GAME_MODE.TIMED) {
            const timeRatio = this.elapsedTime / this.timeLimit;
            if (timeRatio <= 0.5) return 3;
            if (timeRatio <= 0.75) return 2;
            return 1;
        } else if (this.gameMode === GAME_MODE.MOVES) {
            const movesRatio = this.movesUsed / this.movesLimit;
            if (movesRatio <= 0.5) return 3;
            if (movesRatio <= 0.75) return 2;
            return 1;
        } else {
            const baseTime = this.rows * this.cols * 2;
            if (this.elapsedTime <= baseTime) return 3;
            if (this.elapsedTime <= baseTime * 1.5) return 2;
            return 1;
        }
    }

    onWin() {
        this.stopTimer();
        this.saveBestScore();
        this.unlockNextLevel();
        
        if (this.onWinCallback) {
            this.onWinCallback({
                time: this.elapsedTime,
                formattedTime: this.formatTime(this.elapsedTime),
                stars: this.calculateStars(),
                level: this.level,
                moves: this.movesUsed,
                gameMode: this.gameMode
            });
        }
    }

    saveBestScore() {
        const key = `${this.difficulty}_${this.gameMode}_level_${this.level}`;
        const currentBest = this.bestScores[key];
        
        if (!currentBest) {
            this.bestScores[key] = {
                time: this.elapsedTime,
                moves: this.movesUsed,
                stars: this.calculateStars()
            };
        } else {
            if (this.elapsedTime < currentBest.time) {
                currentBest.time = this.elapsedTime;
            }
            if (this.movesUsed < currentBest.moves) {
                currentBest.moves = this.movesUsed;
            }
            currentBest.stars = Math.max(currentBest.stars, this.calculateStars());
            this.bestScores[key] = currentBest;
        }
        
        localStorage.setItem('pipeGameBestScores', JSON.stringify(this.bestScores));
    }

    loadBestScores() {
        try {
            const saved = localStorage.getItem('pipeGameBestScores');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    loadUnlockedLevel() {
        try {
            const saved = localStorage.getItem('pipeGameUnlockedLevel');
            return saved ? parseInt(saved) : 1;
        } catch {
            return 1;
        }
    }

    unlockNextLevel() {
        if (this.level >= this.unlockedLevel) {
            this.unlockedLevel = this.level + 1;
            localStorage.setItem('pipeGameUnlockedLevel', this.unlockedLevel.toString());
        }
    }

    getBestScore() {
        const key = `${this.difficulty}_${this.gameMode}_level_${this.level}`;
        const score = this.bestScores[key];
        if (!score) return '--';
        
        if (this.gameMode === GAME_MODE.MOVES) {
            return `${score.moves} 步`;
        }
        return this.formatTime(score.time);
    }

    nextLevel() {
        this.level++;
        this.currentCustomLevel = null;
        this.resetTimer();
        this.movesUsed = 0;
        this.setLevelConfig();
        this.generateLevel();
    }

    resetLevel() {
        this.resetTimer();
        this.movesUsed = 0;
        this.generateLevel();
    }

    render(container) {
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const pipe = this.grid[row][col];
                const element = pipe.render();
                container.appendChild(element);
            }
        }
    }

    updateVisuals() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col].updateVisual();
            }
        }
    }

    async playWaterAnimation() {
        const connected = this.checkConnectivity();
        const queue = [{ row: this.startRow, col: this.startCol }];
        const visited = new Set();
        visited.add(`${this.startRow},${this.startCol}`);

        this.grid[this.startRow][this.startCol].setWaterFlowing(true);
        await this.delay(100);

        while (queue.length > 0) {
            const { row, col } = queue.shift();
            const pipe = this.grid[row][col];
            const openings = pipe.getOpenings();

            for (const direction of openings) {
                const offset = DIR_OFFSET[direction];
                const neighborRow = row + offset.row;
                const neighborCol = col + offset.col;
                const key = `${neighborRow},${neighborCol}`;

                if (this.isValidCell(neighborRow, neighborCol) && !visited.has(key)) {
                    const neighbor = this.grid[neighborRow][neighborCol];
                    const oppositeDir = OPPOSITE[direction];

                    if (neighbor.hasOpening(oppositeDir)) {
                        visited.add(key);
                        neighbor.setWaterFlowing(true);
                        queue.push({ row: neighborRow, col: neighborCol });
                        await this.delay(100);
                    }
                }
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearWaterAnimation() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col].setWaterFlowing(false);
            }
        }
    }

    loadCustomLevels() {
        try {
            const saved = localStorage.getItem('pipeGameCustomLevels');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    saveCustomLevel(levelData) {
        this.customLevels.push(levelData);
        localStorage.setItem('pipeGameCustomLevels', JSON.stringify(this.customLevels));
    }

    deleteCustomLevel(index) {
        this.customLevels.splice(index, 1);
        localStorage.setItem('pipeGameCustomLevels', JSON.stringify(this.customLevels));
    }

    exportLevel(levelData) {
        return JSON.stringify(levelData, null, 2);
    }

    importLevel(jsonString) {
        try {
            const levelData = JSON.parse(jsonString);
            if (!levelData.rows || !levelData.cols || !levelData.pipes) {
                throw new Error('关卡数据格式不正确');
            }
            return levelData;
        } catch (e) {
            throw new Error('导入失败：' + e.message);
        }
    }

    playCustomLevel(levelData) {
        this.currentCustomLevel = levelData;
        this.level = 1;
        this.gameMode = GAME_MODE.CLASSIC;
        this.difficulty = 'medium';
        this.movesUsed = 0;
        this.setLevelConfig();
        this.generateLevel();
    }
}