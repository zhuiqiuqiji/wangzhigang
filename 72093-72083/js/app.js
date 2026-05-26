class SudokuGame {
    constructor() {
        this.solution = [];
        this.puzzle = [];
        this.currentBoard = [];
        this.initialCells = [];
        this.candidates = [];
        this.selectedCell = null;
        this.isNoteMode = false;
        this.difficulty = 'medium';
        this.timer = 0;
        this.timerInterval = null;
        this.isComplete = false;
        this.achievements = {
            firstWin: false,
            speedWin: false,
            expertWin: false,
            streakDays: 0,
            lastPlayDate: null,
            totalWins: 0
        };
        this.solverState = {
            running: false,
            paused: false,
            speed: 100
        };
        this.isSolverWin = false;

        const savedGame = this.loadGame();
        if (savedGame) {
            this.loadFromSave(savedGame);
        } else {
            this.init();
        }
    }

    init() {
        this.loadAchievements();
        this.generateSolution();
        this.generatePuzzle();
        this.copyPuzzleToCurrent();
        this.initCandidates();
        this.renderBoard();
        this.bindEvents();
        this.startTimer();
        this.updateDifficultyDisplay();
        this.updateAchievementsUI();
    }

    generateSolution() {
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillBoard(this.solution);
    }

    fillBoard(board) {
        const empty = this.findEmpty(board);
        if (!empty) return true;

        const [row, col] = empty;
        const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (const num of nums) {
            if (this.isValidPlacement(board, row, col, num)) {
                board[row][col] = num;
                if (this.fillBoard(board)) return true;
                board[row][col] = 0;
            }
        }
        return false;
    }

    findEmpty(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) return [i, j];
            }
        }
        return null;
    }

    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    isValidPlacement(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
        }

        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }

        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }

    countSolutions(board, count = { value: 0 }) {
        if (count.value > 1) return count.value;
        
        const empty = this.findEmpty(board);
        if (!empty) {
            count.value++;
            return count.value;
        }

        const [row, col] = empty;
        for (let num = 1; num <= 9; num++) {
            if (this.isValidPlacement(board, row, col, num)) {
                board[row][col] = num;
                this.countSolutions(board, count);
                board[row][col] = 0;
                if (count.value > 1) break;
            }
        }
        return count.value;
    }

    getRemoveCount() {
        const counts = {
            easy: 35,
            medium: 45,
            hard: 52,
            expert: 58
        };
        return counts[this.difficulty] || 45;
    }

    generatePuzzle() {
        this.puzzle = this.solution.map(row => [...row]);
        this.initialCells = Array(9).fill(null).map(() => Array(9).fill(true));
        
        const cellsToRemove = this.getRemoveCount();
        let removed = 0;
        const positions = [];
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        
        const shuffledPositions = this.shuffleArray(positions);
        
        for (const [row, col] of shuffledPositions) {
            if (removed >= cellsToRemove) break;
            
            const temp = this.puzzle[row][col];
            this.puzzle[row][col] = 0;
            
            const testBoard = this.puzzle.map(r => [...r]);
            if (this.countSolutions(testBoard) === 1) {
                this.initialCells[row][col] = false;
                removed++;
            } else {
                this.puzzle[row][col] = temp;
            }
        }
    }

    copyPuzzleToCurrent() {
        this.currentBoard = this.puzzle.map(row => [...row]);
    }

    initCandidates() {
        this.candidates = Array(9).fill(null).map(() => 
            Array(9).fill(null).map(() => new Set())
        );
    }

    calculateCandidates(row, col) {
        const candidates = new Set();
        if (this.currentBoard[row][col] !== 0) return candidates;

        for (let num = 1; num <= 9; num++) {
            if (this.isValidPlacement(this.currentBoard, row, col, num)) {
                candidates.add(num);
            }
        }
        return candidates;
    }

    autoFillCandidates() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.currentBoard[i][j] === 0) {
                    this.candidates[i][j] = this.calculateCandidates(i, j);
                }
            }
        }
        this.renderBoard();
    }

    clearCandidates() {
        this.initCandidates();
        this.renderBoard();
    }

    updateCandidatesAfterInput(row, col, num) {
        this.candidates[row][col].clear();

        for (let i = 0; i < 9; i++) {
            this.candidates[row][i].delete(num);
            this.candidates[i][col].delete(num);
        }

        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.candidates[boxRow + i][boxCol + j].delete(num);
            }
        }
    }

    updateCandidatesAfterClear(row, col) {
        for (let i = 0; i < 9; i++) {
            if (this.currentBoard[row][i] === 0) {
                this.candidates[row][i] = this.calculateCandidates(row, i);
            }
            if (this.currentBoard[i][col] === 0) {
                this.candidates[i][col] = this.calculateCandidates(i, col);
            }
        }

        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const r = boxRow + i;
                const c = boxCol + j;
                if (this.currentBoard[r][c] === 0) {
                    this.candidates[r][c] = this.calculateCandidates(r, c);
                }
            }
        }
    }

    renderBoard() {
        const boardEl = document.getElementById('sudokuBoard');
        boardEl.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;

                const value = this.currentBoard[i][j];
                if (value !== 0) {
                    cell.textContent = value;
                    if (this.initialCells[i][j]) {
                        cell.classList.add('initial');
                    } else {
                        cell.classList.add('user');
                    }
                } else if (this.candidates[i][j] && this.candidates[i][j].size > 0) {
                    cell.classList.add('candidates');
                    for (let n = 1; n <= 9; n++) {
                        const span = document.createElement('span');
                        if (this.candidates[i][j].has(n)) {
                            span.textContent = n;
                        }
                        cell.appendChild(span);
                    }
                }

                boardEl.appendChild(cell);
            }
        }

        this.checkAllConflicts();
        this.highlightSelected();
    }

    bindEvents() {
        document.getElementById('sudokuBoard').addEventListener('click', (e) => {
            if (this.isComplete || this.solverState.running) return;
            
            const cell = e.target.closest('.cell');
            if (cell) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.selectCell(row, col);
            }
        });

        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isComplete || this.solverState.running) return;
                
                const num = parseInt(btn.dataset.num);
                this.inputNumber(num);
            });
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.solverState.running) return;
                this.changeDifficulty(btn.dataset.difficulty);
            });
        });

        document.getElementById('newGameBtn').addEventListener('click', () => {
            if (this.solverState.running) return;
            this.newGame();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            if (this.solverState.running) return;
            this.resetGame();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.hideWinModal();
            this.newGame();
        });

        document.getElementById('noteModeBtn').addEventListener('click', () => {
            this.toggleNoteMode();
        });

        document.getElementById('autoCandidatesBtn').addEventListener('click', () => {
            if (this.solverState.running) return;
            this.autoFillCandidates();
        });

        document.getElementById('clearCandidatesBtn').addEventListener('click', () => {
            if (this.solverState.running) return;
            this.clearCandidates();
        });

        document.getElementById('checkErrorsBtn').addEventListener('click', () => {
            if (this.solverState.running) return;
            this.checkErrors();
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            if (this.solverState.running) return;
            this.hint();
        });

        document.getElementById('solveBtn').addEventListener('click', () => {
            this.startSolverVisualization();
        });

        document.getElementById('pauseSolveBtn').addEventListener('click', () => {
            this.toggleSolverPause();
        });

        document.getElementById('stopSolveBtn').addEventListener('click', () => {
            this.stopSolverVisualization();
        });

        document.getElementById('solveSpeed').addEventListener('input', (e) => {
            this.solverState.speed = parseInt(e.target.value);
        });

        document.addEventListener('keydown', (e) => {
            if (this.isComplete || this.solverState.running) return;
            
            if (e.key === 'n' || e.key === 'N') {
                this.toggleNoteMode();
            } else if (e.key >= '1' && e.key <= '9') {
                this.inputNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                this.inputNumber(0);
            } else if (e.key === 'ArrowUp' && this.selectedCell) {
                e.preventDefault();
                const newRow = Math.max(0, this.selectedCell.row - 1);
                this.selectCell(newRow, this.selectedCell.col);
            } else if (e.key === 'ArrowDown' && this.selectedCell) {
                e.preventDefault();
                const newRow = Math.min(8, this.selectedCell.row + 1);
                this.selectCell(newRow, this.selectedCell.col);
            } else if (e.key === 'ArrowLeft' && this.selectedCell) {
                e.preventDefault();
                const newCol = Math.max(0, this.selectedCell.col - 1);
                this.selectCell(this.selectedCell.row, newCol);
            } else if (e.key === 'ArrowRight' && this.selectedCell) {
                e.preventDefault();
                const newCol = Math.min(8, this.selectedCell.col + 1);
                this.selectCell(this.selectedCell.row, newCol);
            }
        });
    }

    selectCell(row, col) {
        this.selectedCell = { row, col };
        this.highlightSelected();
    }

    highlightSelected() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'highlight');
        });

        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;

        document.querySelectorAll('.cell').forEach(cell => {
            const cellRow = parseInt(cell.dataset.row);
            const cellCol = parseInt(cell.dataset.col);

            if (cellRow === row && cellCol === col) {
                cell.classList.add('selected');
            } else if (cellRow === row || cellCol === col) {
                cell.classList.add('highlight');
            } else if (cellRow >= boxRow && cellRow < boxRow + 3 && 
                       cellCol >= boxCol && cellCol < boxCol + 3) {
                cell.classList.add('highlight');
            }
        });
    }

    toggleNoteMode() {
        this.isNoteMode = !this.isNoteMode;
        const btn = document.getElementById('noteModeBtn');
        btn.classList.toggle('active', this.isNoteMode);
    }

    inputNumber(num) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;

        if (this.initialCells[row][col]) return;

        if (this.isNoteMode && num !== 0) {
            if (this.candidates[row][col].has(num)) {
                this.candidates[row][col].delete(num);
            } else {
                this.candidates[row][col].add(num);
            }
            this.renderBoard();
            return;
        }

        this.currentBoard[row][col] = num;
        if (num !== 0) {
            this.updateCandidatesAfterInput(row, col, num);
        } else {
            this.updateCandidatesAfterClear(row, col);
        }
        this.renderBoard();
        this.checkWin();
        this.saveGame();
    }

    checkAllConflicts() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('conflict');
        });

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const num = this.currentBoard[i][j];
                if (num === 0) continue;

                const conflicts = this.getConflicts(i, j, num);
                if (conflicts.length > 0) {
                    const cell = document.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
                    if (cell) cell.classList.add('conflict');
                }
            }
        }
    }

    getConflicts(row, col, num) {
        const conflicts = [];

        for (let i = 0; i < 9; i++) {
            if (i !== col && this.currentBoard[row][i] === num) {
                conflicts.push({ row, col: i });
            }
        }

        for (let i = 0; i < 9; i++) {
            if (i !== row && this.currentBoard[i][col] === num) {
                conflicts.push({ row: i, col });
            }
        }

        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const r = boxRow + i;
                const c = boxCol + j;
                if ((r !== row || c !== col) && this.currentBoard[r][c] === num) {
                    conflicts.push({ row: r, col: c });
                }
            }
        }

        return conflicts;
    }

    checkErrors() {
        let errorCount = 0;
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('conflict');
        });

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const num = this.currentBoard[i][j];
                if (num === 0) continue;

                if (num !== this.solution[i][j] && !this.initialCells[i][j]) {
                    const cell = document.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
                    if (cell) cell.classList.add('conflict');
                    errorCount++;
                }
            }
        }

        if (errorCount === 0) {
            this.showToast('✨ 目前没有发现错误');
        } else {
            this.showToast(`⚠️ 发现 ${errorCount} 个错误`);
        }
    }

    hint() {
        const hintableCells = [];

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.currentBoard[i][j] === 0 && !this.initialCells[i][j]) {
                    const candidates = this.calculateCandidates(i, j);
                    if (candidates.size === 1) {
                        hintableCells.push({ row: i, col: j, num: [...candidates][0] });
                    }
                }
            }
        }

        for (let i = 0; i < 9; i++) {
            for (let num = 1; num <= 9; num++) {
                const possibleCols = [];
                for (let j = 0; j < 9; j++) {
                    if (this.currentBoard[i][j] === 0 && 
                        this.isValidPlacement(this.currentBoard, i, j, num)) {
                        possibleCols.push(j);
                    }
                }
                if (possibleCols.length === 1) {
                    const col = possibleCols[0];
                    if (this.currentBoard[i][col] === 0) {
                        hintableCells.push({ row: i, col, num });
                    }
                }
            }
        }

        for (let j = 0; j < 9; j++) {
            for (let num = 1; num <= 9; num++) {
                const possibleRows = [];
                for (let i = 0; i < 9; i++) {
                    if (this.currentBoard[i][j] === 0 && 
                        this.isValidPlacement(this.currentBoard, i, j, num)) {
                        possibleRows.push(i);
                    }
                }
                if (possibleRows.length === 1) {
                    const row = possibleRows[0];
                    if (this.currentBoard[row][j] === 0) {
                        hintableCells.push({ row, col: j, num });
                    }
                }
            }
        }

        if (hintableCells.length === 0) {
            this.showToast('💡 没有找到可提示的格子');
            return;
        }

        const hint = hintableCells[0];
        const cell = document.querySelector(`.cell[data-row="${hint.row}"][data-col="${hint.col}"]`);
        if (cell) {
            cell.classList.add('hint');
            setTimeout(() => cell.classList.remove('hint'), 2000);
        }

        this.showToast(`💡 提示：第 ${hint.row + 1} 行第 ${hint.col + 1} 列填 ${hint.num}`);
    }

    checkWin() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.currentBoard[i][j] === 0) return;
            }
        }

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.currentBoard[i][j] !== this.solution[i][j]) return;
            }
        }

        this.winGame();
    }

    winGame() {
        this.isComplete = true;
        this.stopTimer();
        if (!this.isSolverWin) {
            this.updateAchievements();
        }
        this.showWinModal();
        this.clearSave();
        this.isSolverWin = false;
    }

    showWinModal() {
        document.getElementById('finalTime').textContent = this.formatTime(this.timer);
        this.renderModalAchievements();
        document.getElementById('winModal').classList.add('show');
    }

    hideWinModal() {
        document.getElementById('winModal').classList.remove('show');
    }

    renderModalAchievements() {
        const container = document.getElementById('modalAchievements');
        container.innerHTML = '';
        
        if (this.achievements.firstWin) {
            const ach = document.createElement('div');
            ach.className = 'modal-achievement';
            ach.textContent = '🏆';
            ach.title = '首次通关';
            container.appendChild(ach);
        }
        if (this.achievements.speedWin) {
            const ach = document.createElement('div');
            ach.className = 'modal-achievement';
            ach.textContent = '⚡';
            ach.title = '快速通关';
            container.appendChild(ach);
        }
        if (this.achievements.expertWin) {
            const ach = document.createElement('div');
            ach.className = 'modal-achievement';
            ach.textContent = '🎯';
            ach.title = '通关专家难度';
            container.appendChild(ach);
        }
    }

    startTimer() {
        this.timer = 0;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
            if (this.timer % 30 === 0) {
                this.saveGame();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetTimer() {
        this.stopTimer();
        this.timer = 0;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        document.getElementById('timer').textContent = this.formatTime(this.timer);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    changeDifficulty(difficulty) {
        this.difficulty = difficulty;
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
        this.updateDifficultyDisplay();
        this.newGame();
    }

    updateDifficultyDisplay() {
        const labels = {
            easy: '简单',
            medium: '中等',
            hard: '困难',
            expert: '专家'
        };
        document.getElementById('difficultyLabel').textContent = labels[this.difficulty] || '中等';
    }

    newGame() {
        this.stopTimer();
        this.stopSolverVisualization();
        this.isComplete = false;
        this.selectedCell = null;
        this.isNoteMode = false;
        document.getElementById('noteModeBtn').classList.remove('active');
        this.hideWinModal();
        this.clearCellHighlight();
        this.generateSolution();
        this.generatePuzzle();
        this.copyPuzzleToCurrent();
        this.initCandidates();
        this.renderBoard();
        this.startTimer();
        this.saveGame();
    }

    resetGame() {
        this.stopTimer();
        this.copyPuzzleToCurrent();
        this.initCandidates();
        this.selectedCell = null;
        this.isComplete = false;
        this.clearCellHighlight();
        this.renderBoard();
        this.resetTimer();
        this.startTimer();
    }

    clearCellHighlight() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'highlight', 'conflict', 'hint', 'solving', 'solved');
        });
    }

    async startSolverVisualization() {
        if (this.solverState.running) return;

        this.currentBoard = this.puzzle.map(row => [...row]);
        this.solverState.running = true;
        this.solverState.paused = false;
        this.isSolverWin = true;
        this.stopTimer();
        
        document.getElementById('solveModal').classList.add('show');
        document.getElementById('solveStatus').textContent = '正在求解...';

        const result = await this.visualSolve();
        
        if (result) {
            document.getElementById('solveStatus').textContent = '✅ 求解完成！';
            this.checkWin();
        } else {
            document.getElementById('solveStatus').textContent = '❌ 无解';
            this.isSolverWin = false;
            if (!this.isComplete) {
                this.startTimer();
            }
        }
        
        this.solverState.running = false;
    }

    async visualSolve() {
        const empty = this.findEmpty(this.currentBoard);
        if (!empty) return true;

        const [row, col] = empty;

        for (let num = 1; num <= 9; num++) {
            if (!this.solverState.running) return false;
            
            while (this.solverState.paused) {
                await this.sleep(100);
            }

            if (this.isValidPlacement(this.currentBoard, row, col, num)) {
                this.currentBoard[row][col] = num;
                this.updateSolverCell(row, col, num, 'solving');
                await this.sleep(this.solverState.speed);

                if (await this.visualSolve()) {
                    this.updateSolverCell(row, col, num, 'solved');
                    return true;
                }

                this.currentBoard[row][col] = 0;
                this.updateSolverCell(row, col, 0, '');
                await this.sleep(this.solverState.speed / 2);
            }
        }
        return false;
    }

    updateSolverCell(row, col, num, className) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.remove('solving', 'solved');
            if (num !== 0) {
                cell.textContent = num;
                cell.classList.remove('candidates');
                cell.classList.add('user');
                if (className) {
                    cell.classList.add(className);
                }
            } else {
                cell.textContent = '';
                cell.classList.remove('user');
            }
        }
    }

    toggleSolverPause() {
        this.solverState.paused = !this.solverState.paused;
        document.getElementById('pauseSolveBtn').textContent = 
            this.solverState.paused ? '继续' : '暂停';
    }

    stopSolverVisualization() {
        this.solverState.running = false;
        this.solverState.paused = false;
        this.isSolverWin = false;
        document.getElementById('pauseSolveBtn').textContent = '暂停';
        document.getElementById('solveModal').classList.remove('show');
        if (!this.isComplete) {
            this.startTimer();
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    loadAchievements() {
        const saved = localStorage.getItem('sudoku_achievements');
        if (saved) {
            this.achievements = JSON.parse(saved);
        }
    }

    saveAchievements() {
        localStorage.setItem('sudoku_achievements', JSON.stringify(this.achievements));
    }

    updateAchievements() {
        const today = new Date().toDateString();
        let newAchievements = [];

        if (!this.achievements.firstWin) {
            this.achievements.firstWin = true;
            newAchievements.push({ icon: '🏆', name: '首次通关' });
        }

        if (this.timer < 300 && !this.achievements.speedWin) {
            this.achievements.speedWin = true;
            newAchievements.push({ icon: '⚡', name: '快速通关（<5分钟）' });
        }

        if (this.difficulty === 'expert' && !this.achievements.expertWin) {
            this.achievements.expertWin = true;
            newAchievements.push({ icon: '🎯', name: '通关专家难度' });
        }

        if (this.achievements.lastPlayDate) {
            const lastDate = new Date(this.achievements.lastPlayDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                this.achievements.streakDays++;
            } else if (diffDays > 1) {
                this.achievements.streakDays = 1;
            }
        } else {
            this.achievements.streakDays = 1;
        }
        this.achievements.lastPlayDate = today;
        this.achievements.totalWins++;

        this.saveAchievements();
        this.updateAchievementsUI();

        for (const ach of newAchievements) {
            this.showAchievementToast(ach);
        }
    }

    updateAchievementsUI() {
        document.getElementById('achFirstWin').classList.toggle('unlocked', this.achievements.firstWin);
        document.getElementById('achSpeedWin').classList.toggle('unlocked', this.achievements.speedWin);
        document.getElementById('achExpertWin').classList.toggle('unlocked', this.achievements.expertWin);
        document.getElementById('streakDays').textContent = this.achievements.streakDays || 0;
    }

    showAchievementToast(achievement) {
        const toast = document.getElementById('achievementToast');
        document.getElementById('toastText').textContent = achievement.name;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    showToast(message) {
        const toast = document.getElementById('achievementToast');
        document.getElementById('toastText').textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    saveGame() {
        const saveData = {
            solution: this.solution,
            puzzle: this.puzzle,
            currentBoard: this.currentBoard,
            initialCells: this.initialCells,
            candidates: this.candidates.map(row => 
                row.map(c => [...c])
            ),
            difficulty: this.difficulty,
            timer: this.timer,
            savedAt: Date.now()
        };
        localStorage.setItem('sudoku_save', JSON.stringify(saveData));
    }

    loadGame() {
        const saved = localStorage.getItem('sudoku_save');
        return saved ? JSON.parse(saved) : null;
    }

    loadFromSave(saveData) {
        this.solution = saveData.solution;
        this.puzzle = saveData.puzzle;
        this.currentBoard = saveData.currentBoard;
        this.initialCells = saveData.initialCells;
        this.difficulty = saveData.difficulty || 'medium';
        this.timer = saveData.timer || 0;
        
        this.candidates = saveData.candidates.map(row => 
            row.map(c => new Set(c))
        );

        this.loadAchievements();
        this.renderBoard();
        this.bindEvents();
        this.startTimer();
        this.updateDifficultyDisplay();
        this.updateAchievementsUI();

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === this.difficulty);
        });
    }

    clearSave() {
        localStorage.removeItem('sudoku_save');
    }

    hasSavedGame() {
        return localStorage.getItem('sudoku_save') !== null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
