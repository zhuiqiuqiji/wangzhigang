class ChineseChessAI {
    constructor(game) {
        this.game = game;
        this.pieceValues = {
            jiang: 10000,
            ju: 900,
            pao: 450,
            ma: 400,
            xiang: 200,
            shi: 200,
            bing: 50
        };
        
        this.positionBonus = {
            jiang: this.generateJiangBonus(),
            ju: this.generateJuBonus(),
            ma: this.generateMaBonus(),
            pao: this.generatePaoBonus(),
            xiang: this.generateXiangBonus(),
            shi: this.generateShiBonus(),
            bing: this.generateBingBonus()
        };
    }
    
    generateJiangBonus() {
        const bonus = Array(10).fill(null).map(() => Array(9).fill(0));
        for (let y = 7; y <= 9; y++) {
            for (let x = 3; x <= 5; x++) {
                bonus[y][x] = 10;
            }
        }
        for (let y = 0; y <= 2; y++) {
            for (let x = 3; x <= 5; x++) {
                bonus[y][x] = 10;
            }
        }
        return bonus;
    }
    
    generateJuBonus() {
        const bonus = Array(10).fill(null).map(() => Array(9).fill(0));
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                bonus[y][x] = 5 - Math.abs(x - 4);
            }
        }
        return bonus;
    }
    
    generateMaBonus() {
        const bonus = Array(10).fill(null).map(() => Array(9).fill(0));
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                bonus[y][x] = 3 + (y > 2 && y < 7 ? 2 : 0);
            }
        }
        return bonus;
    }
    
    generatePaoBonus() {
        const bonus = Array(10).fill(null).map(() => Array(9).fill(0));
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                bonus[y][x] = 4;
            }
        }
        return bonus;
    }
    
    generateXiangBonus() {
        const bonus = Array(10).fill(null).map(() => Array(9).fill(0));
        const positions = [[2, 0], [6, 0], [0, 2], [4, 2], [8, 2], [2, 4], [6, 4],
                          [2, 5], [6, 5], [0, 7], [4, 7], [8, 7], [2, 9], [6, 9]];
        for (const [x, y] of positions) {
            bonus[y][x] = 5;
        }
        return bonus;
    }
    
    generateShiBonus() {
        const bonus = Array(10).fill(null).map(() => Array(9).fill(0));
        for (const y of [0, 2, 7, 9]) {
            for (const x of [3, 5]) {
                bonus[y][x] = 5;
            }
        }
        bonus[1][4] = 5;
        bonus[8][4] = 5;
        return bonus;
    }
    
    generateBingBonus() {
        const bonus = Array(10).fill(null).map(() => Array(9).fill(0));
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const progress = y > 4 ? y - 4 : 4 - y;
                bonus[y][x] = progress * 3;
            }
        }
        return bonus;
    }
    
    evaluateBoard(board, color) {
        let score = 0;
        
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (piece) {
                    const value = this.pieceValues[piece.type] || 0;
                    const posBonus = this.positionBonus[piece.type] ? 
                        this.positionBonus[piece.type][y][x] : 0;
                    
                    if (piece.color === color) {
                        score += (value + posBonus);
                    } else {
                        score -= (value + posBonus);
                    }
                }
            }
        }
        
        return score;
    }
    
    getAllMoves(board, color) {
        const moves = [];
        const originalBoard = this.game.board;
        this.game.board = board;
        
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (piece && piece.color === color) {
                    const pieceMoves = this.game.getValidMoves(x, y);
                    for (const move of pieceMoves) {
                        moves.push({ fromX: x, fromY: y, toX: move.x, toY: move.y });
                    }
                }
            }
        }
        
        this.game.board = originalBoard;
        return moves;
    }
    
    makeMove(board, move) {
        const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
        newBoard[move.toY][move.toX] = newBoard[move.fromY][move.fromX];
        newBoard[move.fromY][move.fromX] = null;
        return newBoard;
    }
    
    minimax(board, depth, alpha, beta, maximizingPlayer, aiColor) {
        if (depth === 0) {
            return this.evaluateBoard(board, aiColor);
        }
        
        const currentColor = maximizingPlayer ? aiColor : (aiColor === 'red' ? 'black' : 'red');
        const moves = this.getAllMoves(board, currentColor);
        
        if (moves.length === 0) {
            return maximizingPlayer ? -100000 : 100000;
        }
        
        moves.sort((a, b) => {
            const pieceA = board[a.toY][a.toX];
            const pieceB = board[b.toY][b.toX];
            const valueA = pieceA ? this.pieceValues[pieceA.type] : 0;
            const valueB = pieceB ? this.pieceValues[pieceB.type] : 0;
            return valueB - valueA;
        });
        
        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, false, aiColor);
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, true, aiColor);
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }
    
    getBestMove(difficulty) {
        const aiColor = this.game.currentPlayer;
        const moves = this.getAllMoves(this.game.board, aiColor);
        
        if (moves.length === 0) return null;
        
        if (difficulty === 'easy') {
            const checkMoves = moves.filter(m => {
                const testBoard = this.makeMove(this.game.board, m);
                return this.game.isInCheck(aiColor === 'red' ? 'black' : 'red', testBoard);
            });
            const candidateMoves = checkMoves.length > 0 ? checkMoves : moves;
            return candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
        }
        
        let depth = 2;
        if (difficulty === 'medium') depth = 3;
        if (difficulty === 'hard') depth = 4;
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        const sortedMoves = moves.sort((a, b) => {
            const pieceA = this.game.board[a.toY][a.toX];
            const pieceB = this.game.board[b.toY][b.toX];
            const valueA = pieceA ? this.pieceValues[pieceA.type] : 0;
            const valueB = pieceB ? this.pieceValues[pieceB.type] : 0;
            return valueB - valueA;
        });
        
        for (const move of sortedMoves) {
            const newBoard = this.makeMove(this.game.board, move);
            const score = this.minimax(newBoard, depth - 1, -Infinity, Infinity, false, aiColor);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    getTopMoves(color, count = 5) {
        const moves = this.getAllMoves(this.game.board, color);
        const scoredMoves = [];
        
        for (const move of moves) {
            const newBoard = this.makeMove(this.game.board, move);
            const score = this.evaluateBoard(newBoard, color);
            const piece = this.game.board[move.fromY][move.fromX];
            scoredMoves.push({ move, score, piece });
        }
        
        return scoredMoves
            .sort((a, b) => b.score - a.score)
            .slice(0, count);
    }
}

class ChineseChess {
    constructor() {
        this.board = [];
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { red: [], black: [] };
        this.historyStates = [];
        this.gameOver = false;
        this.gameMode = 'pvp';
        this.ai = new ChineseChessAI(this);
        this.isReplaying = false;
        this.replayIndex = 0;
        this.replayInterval = null;
        this.savedGames = JSON.parse(localStorage.getItem('chessGames') || '[]');
        
        this.endgames = {
            stallmate: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
            checkmate1: '4k4/9/4R4/9/9/9/9/9/4r4/4K4 w - - 0 1',
            checkmate2: '4k4/9/4N4/9/9/9/9/9/9/4K4 w - - 0 1',
            checkmate3: '4k4/9/9/9/9/9/9/9/4P3/4K4 w - - 0 1'
        };
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.renderBoard();
        this.bindEvents();
        this.updateUI();
    }
    
    initBoard() {
        this.board = Array(10).fill(null).map(() => Array(9).fill(null));
        
        const pieces = {
            red: [
                { type: 'ju', name: '车', x: 0, y: 9 },
                { type: 'ma', name: '马', x: 1, y: 9 },
                { type: 'xiang', name: '相', x: 2, y: 9 },
                { type: 'shi', name: '仕', x: 3, y: 9 },
                { type: 'jiang', name: '帅', x: 4, y: 9 },
                { type: 'shi', name: '仕', x: 5, y: 9 },
                { type: 'xiang', name: '相', x: 6, y: 9 },
                { type: 'ma', name: '马', x: 7, y: 9 },
                { type: 'ju', name: '车', x: 8, y: 9 },
                { type: 'pao', name: '炮', x: 1, y: 7 },
                { type: 'pao', name: '炮', x: 7, y: 7 },
                { type: 'bing', name: '兵', x: 0, y: 6 },
                { type: 'bing', name: '兵', x: 2, y: 6 },
                { type: 'bing', name: '兵', x: 4, y: 6 },
                { type: 'bing', name: '兵', x: 6, y: 6 },
                { type: 'bing', name: '兵', x: 8, y: 6 }
            ],
            black: [
                { type: 'ju', name: '车', x: 0, y: 0 },
                { type: 'ma', name: '马', x: 1, y: 0 },
                { type: 'xiang', name: '象', x: 2, y: 0 },
                { type: 'shi', name: '士', x: 3, y: 0 },
                { type: 'jiang', name: '将', x: 4, y: 0 },
                { type: 'shi', name: '士', x: 5, y: 0 },
                { type: 'xiang', name: '象', x: 6, y: 0 },
                { type: 'ma', name: '马', x: 7, y: 0 },
                { type: 'ju', name: '车', x: 8, y: 0 },
                { type: 'pao', name: '炮', x: 1, y: 2 },
                { type: 'pao', name: '炮', x: 7, y: 2 },
                { type: 'bing', name: '卒', x: 0, y: 3 },
                { type: 'bing', name: '卒', x: 2, y: 3 },
                { type: 'bing', name: '卒', x: 4, y: 3 },
                { type: 'bing', name: '卒', x: 6, y: 3 },
                { type: 'bing', name: '卒', x: 8, y: 3 }
            ]
        };
        
        for (const color of ['red', 'black']) {
            for (const piece of pieces[color]) {
                this.board[piece.y][piece.x] = {
                    type: piece.type,
                    name: piece.name,
                    color: color
                };
            }
        }
    }
    
    renderBoard() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        
        const gridEl = document.createElement('div');
        gridEl.className = 'board-grid';
        
        for (let i = 0; i < 10; i++) {
            const line = document.createElement('div');
            line.className = 'grid-line horizontal-line';
            line.style.top = `${i * (100 / 9)}%`;
            gridEl.appendChild(line);
        }
        
        for (let i = 0; i < 9; i++) {
            const topLine = document.createElement('div');
            topLine.className = 'grid-line vertical-line';
            topLine.style.left = `${i * (100 / 8)}%`;
            topLine.style.height = `${(100 / 9) * 5}%`;
            gridEl.appendChild(topLine);
            
            const bottomLine = document.createElement('div');
            bottomLine.className = 'grid-line vertical-line';
            bottomLine.style.left = `${i * (100 / 8)}%`;
            bottomLine.style.top = `${(100 / 9) * 5}%`;
            bottomLine.style.height = `${(100 / 9) * 4}%`;
            gridEl.appendChild(bottomLine);
        }
        
        const palaceLines = [
            { x1: 3, y1: 0, x2: 5, y2: 2 },
            { x1: 5, y1: 0, x2: 3, y2: 2 },
            { x1: 3, y1: 7, x2: 5, y2: 9 },
            { x1: 5, y1: 7, x2: 3, y2: 9 }
        ];
        
        const gridWidth = 410;
        const gridHeight = 460;
        const cellWidth = gridWidth / 8;
        const cellHeight = gridHeight / 9;
        
        for (const line of palaceLines) {
            const palaceLine = document.createElement('div');
            palaceLine.className = 'palace-line';
            const x1 = line.x1 * cellWidth;
            const y1 = line.y1 * cellHeight;
            const x2 = line.x2 * cellWidth;
            const y2 = line.y2 * cellHeight;
            
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            palaceLine.style.left = `${x1}px`;
            palaceLine.style.top = `${y1}px`;
            palaceLine.style.width = `${length}px`;
            palaceLine.style.transform = `rotate(${angle}deg)`;
            palaceLine.style.transformOrigin = '0 0';
            gridEl.appendChild(palaceLine);
        }
        
        boardEl.appendChild(gridEl);
        
        const threatenedPieces = this.getThreatenedPieces();
        
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.left = `${20 + x * 50}px`;
                cell.style.top = `${20 + y * 50}px`;
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.addEventListener('click', () => this.handleCellClick(x, y));
                boardEl.appendChild(cell);
                
                const piece = this.board[y][x];
                if (piece) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `piece ${piece.color}`;
                    pieceEl.textContent = piece.name;
                    pieceEl.dataset.x = x;
                    pieceEl.dataset.y = y;
                    
                    if (this.selectedPiece && this.selectedPiece.x === x && this.selectedPiece.y === y) {
                        pieceEl.classList.add('selected');
                    }
                    
                    if (threatenedPieces.some(p => p.x === x && p.y === y && p.color === piece.color)) {
                        pieceEl.classList.add('threatened-piece');
                    }
                    
                    cell.appendChild(pieceEl);
                }
            }
        }
        
        this.renderValidMoves();
    }
    
    renderValidMoves() {
        document.querySelectorAll('.valid-move, .valid-capture, .hint-move').forEach(el => el.remove());
        
        if (!this.selectedPiece) return;
        
        const boardEl = document.getElementById('board');
        
        for (const move of this.validMoves) {
            const marker = document.createElement('div');
            const targetPiece = this.board[move.y][move.x];
            
            if (targetPiece) {
                marker.className = 'valid-capture';
            } else {
                marker.className = 'valid-move';
            }
            
            marker.style.left = `${20 + move.x * 50}px`;
            marker.style.top = `${20 + move.y * 50}px`;
            boardEl.appendChild(marker);
        }
    }
    
    bindEvents() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('draw-btn').addEventListener('click', () => this.offerDraw());
        document.getElementById('resign-btn').addEventListener('click', () => this.resign());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('analyze-btn').addEventListener('click', () => this.analyzePosition());
        
        document.getElementById('export-fen').addEventListener('click', () => this.exportFEN());
        document.getElementById('import-fen').addEventListener('click', () => this.showFENInput());
        document.getElementById('save-record').addEventListener('click', () => this.saveGame());
        document.getElementById('load-record').addEventListener('click', () => this.loadGame());
        document.getElementById('replay-btn').addEventListener('click', () => this.startReplay());
        
        document.querySelectorAll('.endgame-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.loadEndgame(e.target.dataset.endgame));
        });
        
        document.getElementById('modal-confirm').addEventListener('click', () => this.handleModalConfirm());
        document.getElementById('modal-cancel').addEventListener('click', () => this.hideModal());
        
        document.getElementById('replay-prev').addEventListener('click', () => this.replayPrev());
        document.getElementById('replay-play').addEventListener('click', () => this.toggleReplayPlay());
        document.getElementById('replay-next').addEventListener('click', () => this.replayNext());
        document.getElementById('replay-stop').addEventListener('click', () => this.stopReplay());
    }
    
    handleCellClick(x, y) {
        if (this.gameOver || this.isReplaying) return;
        
        if (this.gameMode !== 'pvp' && this.currentPlayer === 'black') return;
        
        const piece = this.board[y][x];
        
        if (this.selectedPiece) {
            const isValidMove = this.validMoves.some(m => m.x === x && m.y === y);
            
            if (isValidMove) {
                this.movePiece(this.selectedPiece.x, this.selectedPiece.y, x, y);
                this.selectedPiece = null;
                this.validMoves = [];
            } else if (piece && piece.color === this.currentPlayer) {
                this.selectPiece(x, y);
            } else {
                this.selectedPiece = null;
                this.validMoves = [];
            }
        } else {
            if (piece && piece.color === this.currentPlayer) {
                this.selectPiece(x, y);
            }
        }
        
        this.renderBoard();
        this.updateUI();
    }
    
    selectPiece(x, y) {
        this.selectedPiece = { x, y };
        this.validMoves = this.getValidMoves(x, y);
    }
    
    getValidMoves(x, y) {
        const piece = this.board[y][x];
        if (!piece) return [];
        
        let moves = [];
        
        switch (piece.type) {
            case 'ju':
                moves = this.getJuMoves(x, y, piece.color);
                break;
            case 'ma':
                moves = this.getMaMoves(x, y, piece.color);
                break;
            case 'xiang':
                moves = this.getXiangMoves(x, y, piece.color);
                break;
            case 'shi':
                moves = this.getShiMoves(x, y, piece.color);
                break;
            case 'jiang':
                moves = this.getJiangMoves(x, y, piece.color);
                break;
            case 'pao':
                moves = this.getPaoMoves(x, y, piece.color);
                break;
            case 'bing':
                moves = this.getBingMoves(x, y, piece.color);
                break;
        }
        
        return moves.filter(move => {
            const testBoard = this.cloneBoard();
            testBoard[move.y][move.x] = testBoard[y][x];
            testBoard[y][x] = null;
            return !this.isInCheck(piece.color, testBoard);
        });
    }
    
    cloneBoard() {
        return this.board.map(row => row.map(cell => cell ? { ...cell } : null));
    }
    
    getJuMoves(x, y, color) {
        const moves = [];
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        
        for (const [dx, dy] of directions) {
            let nx = x + dx;
            let ny = y + dy;
            
            while (nx >= 0 && nx < 9 && ny >= 0 && ny < 10) {
                const target = this.board[ny][nx];
                if (!target) {
                    moves.push({ x: nx, y: ny });
                } else {
                    if (target.color !== color) {
                        moves.push({ x: nx, y: ny });
                    }
                    break;
                }
                nx += dx;
                ny += dy;
            }
        }
        
        return moves;
    }
    
    getMaMoves(x, y, color) {
        const moves = [];
        const jumps = [
            { dx: -1, dy: -2, blockX: 0, blockY: -1 },
            { dx: 1, dy: -2, blockX: 0, blockY: -1 },
            { dx: -1, dy: 2, blockX: 0, blockY: 1 },
            { dx: 1, dy: 2, blockX: 0, blockY: 1 },
            { dx: -2, dy: -1, blockX: -1, blockY: 0 },
            { dx: -2, dy: 1, blockX: -1, blockY: 0 },
            { dx: 2, dy: -1, blockX: 1, blockY: 0 },
            { dx: 2, dy: 1, blockX: 1, blockY: 0 }
        ];
        
        for (const jump of jumps) {
            const nx = x + jump.dx;
            const ny = y + jump.dy;
            const bx = x + jump.blockX;
            const by = y + jump.blockY;
            
            if (nx >= 0 && nx < 9 && ny >= 0 && ny < 10) {
                if (!this.board[by][bx]) {
                    const target = this.board[ny][nx];
                    if (!target || target.color !== color) {
                        moves.push({ x: nx, y: ny });
                    }
                }
            }
        }
        
        return moves;
    }
    
    getXiangMoves(x, y, color) {
        const moves = [];
        const jumps = [
            { dx: -2, dy: -2, blockX: -1, blockY: -1 },
            { dx: 2, dy: -2, blockX: 1, blockY: -1 },
            { dx: -2, dy: 2, blockX: -1, blockY: 1 },
            { dx: 2, dy: 2, blockX: 1, blockY: 1 }
        ];
        
        for (const jump of jumps) {
            const nx = x + jump.dx;
            const ny = y + jump.dy;
            const bx = x + jump.blockX;
            const by = y + jump.blockY;
            
            const isInOwnTerritory = color === 'red' ? ny >= 5 : ny <= 4;
            
            if (nx >= 0 && nx < 9 && ny >= 0 && ny < 10 && isInOwnTerritory) {
                if (!this.board[by][bx]) {
                    const target = this.board[ny][nx];
                    if (!target || target.color !== color) {
                        moves.push({ x: nx, y: ny });
                    }
                }
            }
        }
        
        return moves;
    }
    
    getShiMoves(x, y, color) {
        const moves = [];
        const directions = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            const isInPalace = nx >= 3 && nx <= 5 && (
                color === 'red' ? (ny >= 7 && ny <= 9) : (ny >= 0 && ny <= 2)
            );
            
            if (isInPalace) {
                const target = this.board[ny][nx];
                if (!target || target.color !== color) {
                    moves.push({ x: nx, y: ny });
                }
            }
        }
        
        return moves;
    }
    
    getJiangMoves(x, y, color) {
        const moves = [];
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            const isInPalace = nx >= 3 && nx <= 5 && (
                color === 'red' ? (ny >= 7 && ny <= 9) : (ny >= 0 && ny <= 2)
            );
            
            if (isInPalace) {
                const target = this.board[ny][nx];
                if (!target || target.color !== color) {
                    moves.push({ x: nx, y: ny });
                }
            }
        }
        
        const opponentColor = color === 'red' ? 'black' : 'red';
        const kingPos = this.findKing(opponentColor);
        if (kingPos && kingPos.x === x) {
            let hasPieceBetween = false;
            const minY = Math.min(y, kingPos.y);
            const maxY = Math.max(y, kingPos.y);
            
            for (let checkY = minY + 1; checkY < maxY; checkY++) {
                if (this.board[checkY][x]) {
                    hasPieceBetween = true;
                    break;
                }
            }
            
            if (!hasPieceBetween) {
                moves.push({ x: kingPos.x, y: kingPos.y });
            }
        }
        
        return moves;
    }
    
    getPaoMoves(x, y, color) {
        const moves = [];
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        
        for (const [dx, dy] of directions) {
            let nx = x + dx;
            let ny = y + dy;
            let jumped = false;
            
            while (nx >= 0 && nx < 9 && ny >= 0 && ny < 10) {
                const target = this.board[ny][nx];
                
                if (!jumped) {
                    if (!target) {
                        moves.push({ x: nx, y: ny });
                    } else {
                        jumped = true;
                    }
                } else {
                    if (target) {
                        if (target.color !== color) {
                            moves.push({ x: nx, y: ny });
                        }
                        break;
                    }
                }
                
                nx += dx;
                ny += dy;
            }
        }
        
        return moves;
    }
    
    getBingMoves(x, y, color) {
        const moves = [];
        const forward = color === 'red' ? -1 : 1;
        const hasCrossedRiver = color === 'red' ? y <= 4 : y >= 5;
        
        const ny = y + forward;
        if (ny >= 0 && ny < 10) {
            const target = this.board[ny][x];
            if (!target || target.color !== color) {
                moves.push({ x, y: ny });
            }
        }
        
        if (hasCrossedRiver) {
            for (const dx of [-1, 1]) {
                const nx = x + dx;
                if (nx >= 0 && nx < 9) {
                    const target = this.board[y][nx];
                    if (!target || target.color !== color) {
                        moves.push({ x: nx, y });
                    }
                }
            }
        }
        
        return moves;
    }
    
    findKing(color, board = this.board) {
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (piece && piece.type === 'jiang' && piece.color === color) {
                    return { x, y };
                }
            }
        }
        return null;
    }
    
    isInCheck(color, board = this.board) {
        const kingPos = this.findKing(color, board);
        if (!kingPos) return true;
        
        const opponentColor = color === 'red' ? 'black' : 'red';
        
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (piece && piece.color === opponentColor) {
                    const attacks = this.getAttackMoves(x, y, piece, board);
                    if (attacks.some(a => a.x === kingPos.x && a.y === kingPos.y)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    getAttackMoves(x, y, piece, board) {
        const originalBoard = this.board;
        this.board = board;
        let moves = [];
        
        switch (piece.type) {
            case 'ju':
                moves = this.getJuMoves(x, y, piece.color);
                break;
            case 'ma':
                moves = this.getMaMoves(x, y, piece.color);
                break;
            case 'xiang':
                moves = this.getXiangMoves(x, y, piece.color);
                break;
            case 'shi':
                moves = this.getShiMoves(x, y, piece.color);
                break;
            case 'jiang':
                moves = this.getJiangMoves(x, y, piece.color);
                break;
            case 'pao':
                moves = this.getPaoMoves(x, y, piece.color);
                break;
            case 'bing':
                moves = this.getBingMoves(x, y, piece.color);
                break;
        }
        
        this.board = originalBoard;
        return moves;
    }
    
    isCheckmate(color) {
        if (!this.isInCheck(color)) return false;
        return this.hasNoValidMoves(color);
    }
    
    isStalemate(color) {
        if (this.isInCheck(color)) return false;
        return this.hasNoValidMoves(color);
    }
    
    hasNoValidMoves(color) {
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = this.board[y][x];
                if (piece && piece.color === color) {
                    const moves = this.getValidMoves(x, y);
                    if (moves.length > 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    movePiece(fromX, fromY, toX, toY, isReplay = false) {
        const piece = this.board[fromY][fromX];
        const capturedPiece = this.board[toY][toX];
        
        this.historyStates.push({
            board: this.cloneBoard(),
            currentPlayer: this.currentPlayer,
            capturedPieces: JSON.parse(JSON.stringify(this.capturedPieces)),
            moveHistory: [...this.moveHistory]
        });
        
        this.board[toY][toX] = piece;
        this.board[fromY][fromX] = null;
        
        if (capturedPiece) {
            this.capturedPieces[this.currentPlayer].push(capturedPiece);
        }
        
        const moveNotation = this.getMoveNotation(piece, fromX, fromY, toX, toY, capturedPiece);
        this.moveHistory.push({
            player: this.currentPlayer,
            notation: moveNotation,
            fromX, fromY, toX, toY
        });
        
        if (capturedPiece && capturedPiece.type === 'jiang') {
            this.gameOver = true;
            this.showStatus(`${this.currentPlayer === 'red' ? '红方' : '黑方'}获胜！`, 'win');
            return;
        }
        
        const opponentColor = this.currentPlayer === 'red' ? 'black' : 'red';
        
        if (this.isCheckmate(opponentColor)) {
            this.gameOver = true;
            this.showStatus(`${this.currentPlayer === 'red' ? '红方' : '黑方'}获胜！${opponentColor === 'red' ? '红方' : '黑方'}被将死！`, 'win');
            return;
        }
        
        if (this.isStalemate(opponentColor)) {
            this.gameOver = true;
            this.showStatus(`${this.currentPlayer === 'red' ? '红方' : '黑方'}获胜！${opponentColor === 'red' ? '红方' : '黑方'}困毙！`, 'win');
            return;
        }
        
        this.currentPlayer = opponentColor;
        
        if (this.isInCheck(this.currentPlayer)) {
            this.showStatus('将军！', 'check');
        } else {
            this.hideStatus();
        }
        
        if (!isReplay && this.gameMode !== 'pvp' && this.currentPlayer === 'black' && !this.gameOver) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }
    
    getMoveNotation(piece, fromX, fromY, toX, toY, captured) {
        const redNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        const blackNums = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
        
        const nums = piece.color === 'red' ? redNums : blackNums;
        const fromCol = piece.color === 'red' ? 8 - fromX : fromX;
        const toCol = piece.color === 'red' ? 8 - toX : toX;
        
        let notation = piece.name;
        
        if (fromX === toX) {
            const dy = Math.abs(toY - fromY);
            const forward = (piece.color === 'red' && toY < fromY) || (piece.color === 'black' && toY > fromY);
            notation += nums[fromCol] + (forward ? '进' : '退') + (dy === 1 ? '' : nums[dy - 1]);
        } else {
            notation += nums[fromCol] + '平' + nums[toCol];
        }
        
        if (captured) {
            notation += ' 吃' + captured.name;
        }
        
        return notation;
    }
    
    showStatus(message, type = '') {
        const statusEl = document.getElementById('game-status');
        statusEl.textContent = message;
        statusEl.className = 'game-status show ' + type;
    }
    
    hideStatus() {
        const statusEl = document.getElementById('game-status');
        statusEl.className = 'game-status';
    }
    
    updateUI() {
        const playerEl = document.getElementById('current-player');
        playerEl.textContent = this.currentPlayer === 'red' ? '红方' : '黑方';
        playerEl.className = this.currentPlayer;
        
        this.updateCapturedPieces();
        this.updateMoveHistory();
        this.updateThreatAnalysis();
    }
    
    updateCapturedPieces() {
        const redCapturedEl = document.getElementById('red-captured');
        const blackCapturedEl = document.getElementById('black-captured');
        
        redCapturedEl.innerHTML = '';
        blackCapturedEl.innerHTML = '';
        
        for (const piece of this.capturedPieces.red) {
            const el = document.createElement('div');
            el.className = 'captured-piece black';
            el.textContent = piece.name;
            redCapturedEl.appendChild(el);
        }
        
        for (const piece of this.capturedPieces.black) {
            const el = document.createElement('div');
            el.className = 'captured-piece red';
            el.textContent = piece.name;
            blackCapturedEl.appendChild(el);
        }
    }
    
    updateMoveHistory() {
        const historyEl = document.getElementById('move-history');
        historyEl.innerHTML = '';
        
        for (let i = 0; i < this.moveHistory.length; i++) {
            const move = this.moveHistory[i];
            const item = document.createElement('div');
            item.className = 'move-history-item';
            item.textContent = `${Math.floor(i / 2) + 1}. ${move.player === 'red' ? '红' : '黑'} ${move.notation}`;
            historyEl.appendChild(item);
        }
        
        historyEl.scrollTop = historyEl.scrollHeight;
    }
    
    getThreatenedPieces() {
        const threatened = [];
        
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = this.board[y][x];
                if (piece && piece.color === this.currentPlayer) {
                    const opponentColor = this.currentPlayer === 'red' ? 'black' : 'red';
                    for (let oy = 0; oy < 10; oy++) {
                        for (let ox = 0; ox < 9; ox++) {
                            const attacker = this.board[oy][ox];
                            if (attacker && attacker.color === opponentColor) {
                                const attacks = this.getAttackMoves(ox, oy, attacker, this.board);
                                if (attacks.some(a => a.x === x && a.y === y)) {
                                    threatened.push({ x, y, color: piece.color, name: piece.name, attacker: attacker.name });
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return threatened;
    }
    
    updateThreatAnalysis() {
        const threatEl = document.getElementById('threat-analysis');
        const threatened = this.getThreatenedPieces();
        
        threatEl.innerHTML = '';
        
        if (threatened.length === 0) {
            const item = document.createElement('div');
            item.className = 'threat-item';
            item.textContent = '无威胁';
            threatEl.appendChild(item);
        } else {
            for (const t of threatened) {
                const item = document.createElement('div');
                item.className = 'threat-item danger';
                item.textContent = `${t.name} 被 ${t.attacker} 攻击`;
                threatEl.appendChild(item);
            }
        }
    }
    
    undo() {
        if (this.historyStates.length === 0 || this.isReplaying) return;
        
        const state = this.historyStates.pop();
        this.board = state.board;
        this.currentPlayer = state.currentPlayer;
        this.capturedPieces = state.capturedPieces;
        this.moveHistory = state.moveHistory;
        this.selectedPiece = null;
        this.validMoves = [];
        this.gameOver = false;
        
        this.hideStatus();
        this.renderBoard();
        this.updateUI();
    }
    
    newGame() {
        const modeSelect = document.getElementById('game-mode');
        this.gameMode = modeSelect.value;
        
        this.board = [];
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { red: [], black: [] };
        this.historyStates = [];
        this.gameOver = false;
        this.isReplaying = false;
        
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
            this.replayInterval = null;
        }
        
        document.querySelector('.replay-controls').style.display = 'none';
        
        this.initBoard();
        this.hideStatus();
        this.renderBoard();
        this.updateUI();
    }
    
    makeAIMove() {
        if (this.gameOver || this.currentPlayer !== 'black') return;
        
        document.getElementById('ai-thinking').style.display = 'inline';
        
        setTimeout(() => {
            let difficulty = 'easy';
            if (this.gameMode === 'pve-medium') difficulty = 'medium';
            if (this.gameMode === 'pve-hard') difficulty = 'hard';
            
            const move = this.ai.getBestMove(difficulty);
            document.getElementById('ai-thinking').style.display = 'none';
            
            if (move) {
                this.movePiece(move.fromX, move.fromY, move.toX, move.toY);
                this.renderBoard();
                this.updateUI();
            }
        }, 100);
    }
    
    offerDraw() {
        this.showModal('求和', '确定要向对方求和吗？', () => {
            this.gameOver = true;
            this.showStatus('双方同意和棋！', 'win');
        });
    }
    
    resign() {
        this.showModal('认输', `确定要认输吗？${this.currentPlayer === 'red' ? '红方' : '黑方'}认输，${this.currentPlayer === 'red' ? '黑方' : '红方'}获胜！`, () => {
            this.gameOver = true;
            this.showStatus(`${this.currentPlayer === 'red' ? '黑方' : '红方'}获胜！${this.currentPlayer === 'red' ? '红方' : '黑方'}认输！`, 'win');
        });
    }
    
    showHint() {
        if (this.gameOver || this.isReplaying) return;
        
        const topMoves = this.ai.getTopMoves(this.currentPlayer, 3);
        const bestMovesEl = document.getElementById('best-moves');
        bestMovesEl.innerHTML = '';
        
        if (topMoves.length === 0) {
            const item = document.createElement('div');
            item.className = 'best-move-item';
            item.textContent = '无可用走法';
            bestMovesEl.appendChild(item);
            return;
        }
        
        for (let i = 0; i < topMoves.length; i++) {
            const m = topMoves[i];
            const item = document.createElement('div');
            item.className = 'best-move-item';
            item.innerHTML = `${i + 1}. ${m.piece.name} → (${m.move.toX}, ${9 - m.move.toY}) <span class="score">${m.score}</span>`;
            bestMovesEl.appendChild(item);
        }
        
        const bestMove = topMoves[0].move;
        const boardEl = document.getElementById('board');
        const hint = document.createElement('div');
        hint.className = 'hint-move';
        hint.style.left = `${20 + bestMove.toX * 50}px`;
        hint.style.top = `${20 + bestMove.toY * 50}px`;
        boardEl.appendChild(hint);
        
        setTimeout(() => {
            document.querySelectorAll('.hint-move').forEach(el => el.remove());
        }, 3000);
    }
    
    analyzePosition() {
        if (this.gameOver) return;
        
        const score = this.ai.evaluateBoard(this.board, this.currentPlayer);
        const topMoves = this.ai.getTopMoves(this.currentPlayer, 5);
        
        let analysis = `局面评估: ${score}分\n\n推荐走法:\n`;
        for (let i = 0; i < Math.min(5, topMoves.length); i++) {
            const m = topMoves[i];
            analysis += `${i + 1}. ${m.piece.name} → 评分: ${m.score}\n`;
        }
        
        alert(analysis);
    }
    
    showModal(title, message, onConfirm) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal').style.display = 'flex';
        this._modalCallback = onConfirm;
    }
    
    hideModal() {
        document.getElementById('modal').style.display = 'none';
        this._modalCallback = null;
    }
    
    handleModalConfirm() {
        if (this._modalCallback) {
            this._modalCallback();
        }
        this.hideModal();
    }
    
    exportFEN() {
        const fen = this.boardToFEN();
        const input = document.getElementById('fen-input');
        input.style.display = 'block';
        input.value = fen;
        input.select();
        document.execCommand('copy');
        alert('FEN已复制到剪贴板:\n' + fen);
    }
    
    boardToFEN() {
        let fen = '';
        for (let y = 0; y < 10; y++) {
            let emptyCount = 0;
            for (let x = 0; x < 9; x++) {
                const piece = this.board[y][x];
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    const symbol = this.pieceToSymbol(piece);
                    fen += symbol;
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (y < 9) fen += '/';
        }
        fen += ' ' + (this.currentPlayer === 'red' ? 'w' : 'b');
        fen += ' - - 0 1';
        return fen;
    }
    
    pieceToSymbol(piece) {
        const map = {
            'red_jiang': 'K', 'red_ju': 'R', 'red_ma': 'N',
            'red_pao': 'C', 'red_xiang': 'B', 'red_shi': 'A', 'red_bing': 'P',
            'black_jiang': 'k', 'black_ju': 'r', 'black_ma': 'n',
            'black_pao': 'c', 'black_xiang': 'b', 'black_shi': 'a', 'black_bing': 'p'
        };
        return map[`${piece.color}_${piece.type}`] || '';
    }
    
    showFENInput() {
        const input = document.getElementById('fen-input');
        if (input.style.display === 'none') {
            input.style.display = 'block';
        } else {
            const fen = input.value.trim();
            if (fen) {
                this.importFEN(fen);
            }
            input.style.display = 'none';
        }
    }
    
    importFEN(fen) {
        try {
            this.board = Array(10).fill(null).map(() => Array(9).fill(null));
            const parts = fen.split(' ');
            const rows = parts[0].split('/');
            
            const symbolToPiece = {
                'K': { type: 'jiang', name: '帅', color: 'red' },
                'R': { type: 'ju', name: '车', color: 'red' },
                'N': { type: 'ma', name: '马', color: 'red' },
                'C': { type: 'pao', name: '炮', color: 'red' },
                'B': { type: 'xiang', name: '相', color: 'red' },
                'A': { type: 'shi', name: '仕', color: 'red' },
                'P': { type: 'bing', name: '兵', color: 'red' },
                'k': { type: 'jiang', name: '将', color: 'black' },
                'r': { type: 'ju', name: '车', color: 'black' },
                'n': { type: 'ma', name: '马', color: 'black' },
                'c': { type: 'pao', name: '炮', color: 'black' },
                'b': { type: 'xiang', name: '象', color: 'black' },
                'a': { type: 'shi', name: '士', color: 'black' },
                'p': { type: 'bing', name: '卒', color: 'black' }
            };
            
            for (let y = 0; y < 10 && y < rows.length; y++) {
                let x = 0;
                for (const char of rows[y]) {
                    if (char >= '1' && char <= '9') {
                        x += parseInt(char);
                    } else if (symbolToPiece[char]) {
                        this.board[y][x] = { ...symbolToPiece[char] };
                        x++;
                    }
                }
            }
            
            this.currentPlayer = parts[1] === 'w' ? 'red' : 'black';
            this.moveHistory = [];
            this.capturedPieces = { red: [], black: [] };
            this.historyStates = [];
            this.gameOver = false;
            this.selectedPiece = null;
            this.validMoves = [];
            
            this.renderBoard();
            this.updateUI();
            alert('FEN导入成功！');
        } catch (e) {
            alert('FEN格式错误: ' + e.message);
        }
    }
    
    saveGame() {
        const gameData = {
            date: new Date().toISOString(),
            fen: this.boardToFEN(),
            moves: [...this.moveHistory]
        };
        
        this.savedGames.push(gameData);
        localStorage.setItem('chessGames', JSON.stringify(this.savedGames));
        alert('棋谱已保存！共保存' + this.savedGames.length + '局棋谱。');
    }
    
    loadGame() {
        if (this.savedGames.length === 0) {
            alert('没有保存的棋谱！');
            return;
        }
        
        let list = '选择要加载的棋谱:\n';
        for (let i = 0; i < this.savedGames.length; i++) {
            const g = this.savedGames[i];
            list += `${i + 1}. ${new Date(g.date).toLocaleString()} - ${g.moves.length}步\n`;
        }
        
        const idx = prompt(list + '\n输入序号:');
        if (idx && idx > 0 && idx <= this.savedGames.length) {
            const game = this.savedGames[idx - 1];
            this.importFEN(game.fen);
            this._savedMoves = game.moves;
            alert('棋谱加载完成！点击"回放棋谱"开始回放。');
        }
    }
    
    loadEndgame(endgameKey) {
        const fen = this.endgames[endgameKey];
        if (fen) {
            this.gameMode = 'pvp';
            document.getElementById('game-mode').value = 'pvp';
            this.importFEN(fen);
        }
    }
    
    startReplay() {
        if (this.moveHistory.length === 0 && !this._savedMoves) {
            alert('没有可回放的棋谱！');
            return;
        }
        
        this.isReplaying = true;
        this.replayIndex = 0;
        this.replayMoves = this._savedMoves || [...this.moveHistory];
        
        this.newGame();
        this.isReplaying = true;
        
        document.querySelector('.replay-controls').style.display = 'flex';
    }
    
    replayNext() {
        if (!this.isReplaying || this.replayIndex >= this.replayMoves.length) return;
        
        const move = this.replayMoves[this.replayIndex];
        this.movePiece(move.fromX, move.fromY, move.toX, move.toY, true);
        this.replayIndex++;
        this.renderBoard();
        this.updateUI();
    }
    
    replayPrev() {
        if (!this.isReplaying || this.replayIndex <= 0) return;
        this.undo();
        this.replayIndex--;
    }
    
    toggleReplayPlay() {
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
            this.replayInterval = null;
            document.getElementById('replay-play').textContent = '播放';
        } else {
            document.getElementById('replay-play').textContent = '暂停';
            this.replayInterval = setInterval(() => {
                if (this.replayIndex >= this.replayMoves.length) {
                    clearInterval(this.replayInterval);
                    this.replayInterval = null;
                    document.getElementById('replay-play').textContent = '播放';
                } else {
                    this.replayNext();
                }
            }, 1000);
        }
    }
    
    stopReplay() {
        this.isReplaying = false;
        this.replayIndex = 0;
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
            this.replayInterval = null;
        }
        document.querySelector('.replay-controls').style.display = 'none';
        document.getElementById('replay-play').textContent = '播放';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChineseChess();
});