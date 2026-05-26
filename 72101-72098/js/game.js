class GoGame {
    constructor() {
        this.boardSize = 19;
        this.board = [];
        this.currentPlayer = 1;
        this.moveCount = 0;
        this.blackCaptures = 0;
        this.whiteCaptures = 0;
        this.koPoint = null;
        this.consecutivePasses = 0;
        this.gameOver = false;
        this.starPoints = [];
        this.lastMove = null;
        
        this.canvas = document.getElementById('goBoard');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 30;
        this.padding = 25;
        this.dpr = window.devicePixelRatio || 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initBoard();
        this.calculateStarPoints();
        this.resizeCanvas();
        this.drawBoard();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('boardSize').addEventListener('change', (e) => this.changeBoardSize(parseInt(e.target.value)));
        document.getElementById('passBtn').addEventListener('click', () => this.pass());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
    }

    initBoard() {
        this.board = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = 0;
            }
        }
    }

    calculateStarPoints() {
        this.starPoints = [];
        if (this.boardSize === 19) {
            const points = [3, 9, 15];
            for (let i of points) {
                for (let j of points) {
                    this.starPoints.push({x: i, y: j});
                }
            }
        } else if (this.boardSize === 13) {
            const points = [3, 6, 9];
            for (let i of points) {
                for (let j of points) {
                    this.starPoints.push({x: i, y: j});
                }
            }
        } else if (this.boardSize === 9) {
            const points = [2, 4, 6];
            for (let i of points) {
                for (let j of points) {
                    this.starPoints.push({x: i, y: j});
                }
            }
        }
    }

    resizeCanvas() {
        const boardPixelSize = (this.boardSize - 1) * this.cellSize + this.padding * 2;
        this.canvas.width = boardPixelSize * this.dpr;
        this.canvas.height = boardPixelSize * this.dpr;
        this.canvas.style.width = boardPixelSize + 'px';
        this.canvas.style.height = boardPixelSize + 'px';
        this.ctx.scale(this.dpr, this.dpr);
    }

    changeBoardSize(size) {
        this.boardSize = size;
        this.calculateStarPoints();
        this.restart();
    }

    restart() {
        this.initBoard();
        this.currentPlayer = 1;
        this.moveCount = 0;
        this.blackCaptures = 0;
        this.whiteCaptures = 0;
        this.koPoint = null;
        this.consecutivePasses = 0;
        this.gameOver = false;
        this.lastMove = null;
        this.resizeCanvas();
        this.updateUI();
        this.drawBoard();
    }

    drawBoard() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.fillStyle = '#deb887';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < this.boardSize; i++) {
            ctx.beginPath();
            ctx.moveTo(this.padding, this.padding + i * this.cellSize);
            ctx.lineTo(this.padding + (this.boardSize - 1) * this.cellSize, this.padding + i * this.cellSize);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.padding + i * this.cellSize, this.padding);
            ctx.lineTo(this.padding + i * this.cellSize, this.padding + (this.boardSize - 1) * this.cellSize);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#000';
        for (let point of this.starPoints) {
            ctx.beginPath();
            ctx.arc(
                this.padding + point.x * this.cellSize,
                this.padding + point.y * this.cellSize,
                4, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        this.drawStones();
        
        if (this.lastMove) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                this.padding + this.lastMove.x * this.cellSize,
                this.padding + this.lastMove.y * this.cellSize,
                this.cellSize / 3, 0, Math.PI * 2
            );
            ctx.stroke();
        }
    }

    drawStones() {
        const ctx = this.ctx;
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] !== 0) {
                    const x = this.padding + j * this.cellSize;
                    const y = this.padding + i * this.cellSize;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, this.cellSize / 2 - 1, 0, Math.PI * 2);
                    
                    if (this.board[i][j] === 1) {
                        const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, this.cellSize / 2);
                        gradient.addColorStop(0, '#555');
                        gradient.addColorStop(1, '#000');
                        ctx.fillStyle = gradient;
                    } else {
                        const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, this.cellSize / 2);
                        gradient.addColorStop(0, '#fff');
                        gradient.addColorStop(1, '#ccc');
                        ctx.fillStyle = gradient;
                    }
                    
                    ctx.fill();
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    handleClick(e) {
        if (this.gameOver) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const x = Math.round((clickX - this.padding) / this.cellSize);
        const y = Math.round((clickY - this.padding) / this.cellSize);
        
        if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
            this.placeStone(x, y);
        }
    }

    placeStone(x, y) {
        if (this.board[y][x] !== 0) return;
        
        if (this.koPoint && this.koPoint.x === x && this.koPoint.y === y) {
            return;
        }
        
        const originalBoard = this.copyBoard();
        this.board[y][x] = this.currentPlayer;
        
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        let capturedStones = [];
        
        const neighbors = this.getNeighbors(x, y);
        for (let neighbor of neighbors) {
            if (this.board[neighbor.y][neighbor.x] === opponent) {
                const group = this.getGroup(neighbor.x, neighbor.y);
                if (this.getLiberties(group).length === 0) {
                    capturedStones = capturedStones.concat(group);
                }
            }
        }
        
        for (let stone of capturedStones) {
            this.board[stone.y][stone.x] = 0;
        }
        
        const ownGroup = this.getGroup(x, y);
        if (this.getLiberties(ownGroup).length === 0) {
            this.board = originalBoard;
            return;
        }
        
        if (capturedStones.length > 0) {
            if (this.currentPlayer === 1) {
                this.blackCaptures += capturedStones.length;
            } else {
                this.whiteCaptures += capturedStones.length;
            }
        }
        
        if (capturedStones.length === 1) {
            const captured = capturedStones[0];
            const newGroup = this.getGroup(x, y);
            if (newGroup.length === 1 && this.getLiberties(newGroup).length === 1) {
                this.koPoint = {x: captured.x, y: captured.y};
            } else {
                this.koPoint = null;
            }
        } else {
            this.koPoint = null;
        }
        
        this.lastMove = {x, y};
        this.consecutivePasses = 0;
        this.moveCount++;
        this.currentPlayer = opponent;
        this.updateUI();
        this.drawBoard();
    }

    copyBoard() {
        const copy = [];
        for (let i = 0; i < this.boardSize; i++) {
            copy[i] = [...this.board[i]];
        }
        return copy;
    }

    getNeighbors(x, y) {
        const neighbors = [];
        if (x > 0) neighbors.push({x: x - 1, y});
        if (x < this.boardSize - 1) neighbors.push({x: x + 1, y});
        if (y > 0) neighbors.push({x, y: y - 1});
        if (y < this.boardSize - 1) neighbors.push({x, y: y + 1});
        return neighbors;
    }

    getGroup(x, y) {
        const color = this.board[y][x];
        if (color === 0) return [];
        
        const group = [];
        const visited = new Set();
        const stack = [{x, y}];
        
        while (stack.length > 0) {
            const stone = stack.pop();
            const key = `${stone.x},${stone.y}`;
            
            if (visited.has(key)) continue;
            if (this.board[stone.y][stone.x] !== color) continue;
            
            visited.add(key);
            group.push(stone);
            
            const neighbors = this.getNeighbors(stone.x, stone.y);
            for (let neighbor of neighbors) {
                stack.push(neighbor);
            }
        }
        
        return group;
    }

    getLiberties(group) {
        const liberties = new Set();
        
        for (let stone of group) {
            const neighbors = this.getNeighbors(stone.x, stone.y);
            for (let neighbor of neighbors) {
                if (this.board[neighbor.y][neighbor.x] === 0) {
                    liberties.add(`${neighbor.x},${neighbor.y}`);
                }
            }
        }
        
        return Array.from(liberties).map(key => {
            const [x, y] = key.split(',').map(Number);
            return {x, y};
        });
    }

    pass() {
        if (this.gameOver) return;
        
        this.consecutivePasses++;
        this.moveCount++;
        this.lastMove = null;
        this.koPoint = null;
        
        if (this.consecutivePasses >= 2) {
            this.endGame();
        } else {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updateUI();
            this.drawBoard();
        }
    }

    endGame() {
        this.gameOver = true;
        const result = this.calculateScore();
        this.showResult(result);
    }

    calculateScore() {
        const boardCopy = this.copyBoard();
        const deadStones = this.removeDeadStonesAndCount(boardCopy);
        
        const territory = this.calculateTerritory();
        const komi = 6.5;
        
        const blackDeadStones = deadStones.white;
        const whiteDeadStones = deadStones.black;
        
        const blackScore = territory.black + this.blackCaptures + blackDeadStones;
        const whiteScore = territory.white + this.whiteCaptures + whiteDeadStones + komi;
        
        return {
            blackTerritory: territory.black,
            whiteTerritory: territory.white,
            blackCaptures: this.blackCaptures,
            whiteCaptures: this.whiteCaptures,
            blackDeadStones,
            whiteDeadStones,
            blackTotal: blackScore,
            whiteTotal: whiteScore,
            winner: blackScore > whiteScore ? '黑方' : '白方',
            margin: Math.abs(blackScore - whiteScore)
        };
    }

    removeDeadStonesAndCount(board) {
        const deadStones = {black: 0, white: 0};
        let changed = true;
        
        while (changed) {
            changed = false;
            const visitedGroups = new Set();
            
            for (let i = 0; i < this.boardSize; i++) {
                for (let j = 0; j < this.boardSize; j++) {
                    const color = board[i][j];
                    if (color !== 0) {
                        const groupKey = this.getGroupKey(j, i, board);
                        if (!visitedGroups.has(groupKey)) {
                            visitedGroups.add(groupKey);
                            const group = this.getGroupWithBoard(j, i, board);
                            if (!this.isGroupAlive(group, color, board)) {
                                if (color === 1) {
                                    deadStones.black += group.length;
                                } else {
                                    deadStones.white += group.length;
                                }
                                for (let stone of group) {
                                    board[stone.y][stone.x] = 0;
                                }
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
        
        return deadStones;
    }

    calculateTerritory() {
        const boardCopy = this.copyBoard();
        this.removeDeadStones(boardCopy);
        
        const visited = new Set();
        let blackTerritory = 0;
        let whiteTerritory = 0;
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (boardCopy[i][j] === 0 && !visited.has(`${j},${i}`)) {
                    const result = this.floodFillTerritoryWithBoard(j, i, visited, boardCopy);
                    if (result.owner === 1) {
                        blackTerritory += result.count;
                    } else if (result.owner === 2) {
                        whiteTerritory += result.count;
                    }
                }
            }
        }
        
        return {black: blackTerritory, white: whiteTerritory};
    }

    removeDeadStones(board) {
        let changed = true;
        while (changed) {
            changed = false;
            const visitedGroups = new Set();
            
            for (let i = 0; i < this.boardSize; i++) {
                for (let j = 0; j < this.boardSize; j++) {
                    const color = board[i][j];
                    if (color !== 0) {
                        const groupKey = this.getGroupKey(j, i, board);
                        if (!visitedGroups.has(groupKey)) {
                            visitedGroups.add(groupKey);
                            const group = this.getGroupWithBoard(j, i, board);
                            if (!this.isGroupAlive(group, color, board)) {
                                for (let stone of group) {
                                    board[stone.y][stone.x] = 0;
                                }
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
    }

    getGroupKey(x, y, board) {
        const group = this.getGroupWithBoard(x, y, board);
        const keys = group.map(s => `${s.x},${s.y}`).sort();
        return keys.join('|');
    }

    getGroupWithBoard(x, y, board) {
        const color = board[y][x];
        if (color === 0) return [];
        
        const group = [];
        const visited = new Set();
        const stack = [{x, y}];
        
        while (stack.length > 0) {
            const stone = stack.pop();
            const key = `${stone.x},${stone.y}`;
            
            if (visited.has(key)) continue;
            if (board[stone.y][stone.x] !== color) continue;
            
            visited.add(key);
            group.push(stone);
            
            const neighbors = this.getNeighbors(stone.x, stone.y);
            for (let neighbor of neighbors) {
                stack.push(neighbor);
            }
        }
        
        return group;
    }

    isGroupAlive(group, color, board) {
        const liberties = this.getLibertiesWithBoard(group, board);
        if (liberties.length === 0) return false;
        
        const eyeSpaces = this.findEyeSpaces(group, color, board);
        const trueEyes = eyeSpaces.filter(eye => this.isTrueEye(eye, color, board));
        
        if (trueEyes.length >= 2) return true;
        
        return this.hasPotentialToLive(group, color, board);
    }

    getLibertiesWithBoard(group, board) {
        const liberties = new Set();
        
        for (let stone of group) {
            const neighbors = this.getNeighbors(stone.x, stone.y);
            for (let neighbor of neighbors) {
                if (board[neighbor.y][neighbor.x] === 0) {
                    liberties.add(`${neighbor.x},${neighbor.y}`);
                }
            }
        }
        
        return Array.from(liberties).map(key => {
            const [x, y] = key.split(',').map(Number);
            return {x, y};
        });
    }

    findEyeSpaces(group, color, board) {
        const eyeSpaces = [];
        const visited = new Set();
        const opponent = color === 1 ? 2 : 1;
        
        for (let stone of group) {
            const neighbors = this.getNeighbors(stone.x, stone.y);
            for (let neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (board[neighbor.y][neighbor.x] === 0 && !visited.has(key)) {
                    const space = this.floodFillEmptySpace(neighbor.x, neighbor.y, board, visited);
                    let surroundedBy = 0;
                    for (let point of space) {
                        const pointNeighbors = this.getNeighbors(point.x, point.y);
                        for (let pn of pointNeighbors) {
                            if (board[pn.y][pn.x] === color) surroundedBy++;
                            if (board[pn.y][pn.x] === opponent) surroundedBy--;
                        }
                    }
                    if (surroundedBy > 0) {
                        eyeSpaces.push(space);
                    }
                }
            }
        }
        
        return eyeSpaces;
    }

    floodFillEmptySpace(startX, startY, board, visited) {
        const space = [];
        const stack = [{x: startX, y: startY}];
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            if (board[y][x] !== 0) continue;
            
            visited.add(key);
            space.push({x, y});
            
            const neighbors = this.getNeighbors(x, y);
            for (let neighbor of neighbors) {
                stack.push(neighbor);
            }
        }
        
        return space;
    }

    isTrueEye(eyeSpace, color, board) {
        if (eyeSpace.length > 1) return false;
        
        const point = eyeSpace[0];
        const neighbors = this.getNeighbors(point.x, point.y);
        let friendlyCount = 0;
        
        for (let neighbor of neighbors) {
            if (board[neighbor.y][neighbor.x] === color) {
                friendlyCount++;
            }
        }
        
        const isCorner = (point.x === 0 || point.x === this.boardSize - 1) && 
                         (point.y === 0 || point.y === this.boardSize - 1);
        const isEdge = point.x === 0 || point.x === this.boardSize - 1 || 
                       point.y === 0 || point.y === this.boardSize - 1;
        
        if (isCorner) return friendlyCount >= 2;
        if (isEdge) return friendlyCount >= 3;
        return friendlyCount >= 4;
    }

    hasPotentialToLive(group, color, board) {
        const liberties = this.getLibertiesWithBoard(group, board);
        if (liberties.length >= 5) return true;
        
        if (liberties.length >= 3) {
            const opponent = color === 1 ? 2 : 1;
            for (let liberty of liberties) {
                const testBoard = this.copyBoardWithBoard(board);
                testBoard[liberty.y][liberty.x] = color;
                const newGroup = this.getGroupWithBoard(liberty.x, liberty.y, testBoard);
                const newLiberties = this.getLibertiesWithBoard(newGroup, testBoard);
                if (newLiberties.length >= 6) return true;
            }
        }
        
        return false;
    }

    copyBoardWithBoard(board) {
        const copy = [];
        for (let i = 0; i < this.boardSize; i++) {
            copy[i] = [...board[i]];
        }
        return copy;
    }

    floodFillTerritoryWithBoard(startX, startY, visited, board) {
        const stack = [{x: startX, y: startY}];
        const territory = [];
        let blackBorder = false;
        let whiteBorder = false;
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            
            if (board[y][x] === 1) {
                blackBorder = true;
                continue;
            }
            if (board[y][x] === 2) {
                whiteBorder = true;
                continue;
            }
            
            visited.add(key);
            territory.push({x, y});
            
            const neighbors = this.getNeighbors(x, y);
            for (let neighbor of neighbors) {
                stack.push(neighbor);
            }
        }
        
        let owner = 0;
        if (blackBorder && !whiteBorder) {
            owner = 1;
        } else if (whiteBorder && !blackBorder) {
            owner = 2;
        }
        
        return {count: territory.length, owner};
    }

    showResult(result) {
        const modal = document.getElementById('gameOverModal');
        const content = document.getElementById('resultContent');
        
        content.innerHTML = `
            <p><strong>${result.winner}获胜！</strong></p>
            <p>胜差: ${result.margin.toFixed(1)} 目</p>
            <hr style="margin: 15px 0;">
            <p>黑方: 领地 ${result.blackTerritory} + 提子 ${result.blackCaptures} + 死子 ${result.blackDeadStones} = <strong>${result.blackTotal.toFixed(1)}</strong></p>
            <p>白方: 领地 ${result.whiteTerritory} + 提子 ${result.whiteCaptures} + 死子 ${result.whiteDeadStones} + 贴目 6.5 = <strong>${result.whiteTotal.toFixed(1)}</strong></p>
        `;
        
        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('gameOverModal').classList.remove('show');
    }

    updateUI() {
        document.getElementById('moveCount').textContent = this.moveCount;
        document.getElementById('blackCaptures').textContent = this.blackCaptures;
        document.getElementById('whiteCaptures').textContent = this.whiteCaptures;
        
        const currentPlayerEl = document.getElementById('currentPlayer');
        if (this.currentPlayer === 1) {
            currentPlayerEl.textContent = '黑方';
            currentPlayerEl.classList.remove('white');
        } else {
            currentPlayerEl.textContent = '白方';
            currentPlayerEl.classList.add('white');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GoGame();
});