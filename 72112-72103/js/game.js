const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const STAR_POINTS = [
    [3, 3], [3, 7], [3, 11],
    [7, 3], [7, 7], [7, 11],
    [11, 3], [11, 7], [11, 11]
];

let board = [];
let gameState = {
    currentPlayer: BLACK,
    moveCount: 0,
    lastMove: null,
    gameOver: false,
    winner: null,
    mode: 'pvp',
    aiLevel: 2,
    forbiddenRule: true,
    aiThinking: false
};

let recommendedMove = null;

const boardElement = document.getElementById('board');
const currentPlayerElement = document.getElementById('currentPlayer');
const moveCountElement = document.getElementById('moveCount');
const gameResultElement = document.getElementById('gameResult');
const forbiddenWarningElement = document.getElementById('forbiddenWarning');
const restartBtn = document.getElementById('restartBtn');
const undoBtn = document.getElementById('undoBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const exportSgfBtn = document.getElementById('exportSgfBtn');
const toggleSoundBtn = document.getElementById('toggleSoundBtn');
const gameModeSelect = document.getElementById('gameMode');
const aiLevelSelect = document.getElementById('aiLevel');
const aiLevelGroup = document.getElementById('aiLevelGroup');
const forbiddenRuleCheckbox = document.getElementById('forbiddenRule');
const themeSelect = document.getElementById('themeSelect');
const winRateElement = document.getElementById('winRate');
const bestMoveElement = document.getElementById('bestMove');
const moveListElement = document.getElementById('moveList');

function initGame() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    gameState = {
        currentPlayer: BLACK,
        moveCount: 0,
        lastMove: null,
        gameOver: false,
        winner: null,
        mode: gameModeSelect.value,
        aiLevel: parseInt(aiLevelSelect.value),
        forbiddenRule: forbiddenRuleCheckbox.checked,
        aiThinking: false
    };

    recommendedMove = null;
    History.init();
    gameResultElement.classList.add('hidden');
    gameResultElement.className = 'game-result hidden';
    forbiddenWarningElement.classList.add('hidden');
    renderBoard();
    updateStatus();
    updateMoveList();
    updateAnalysisDisplay();
}

function renderBoard() {
    boardElement.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'board-grid';

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const intersection = document.createElement('div');
            intersection.className = 'intersection';
            intersection.dataset.x = x;
            intersection.dataset.y = y;

            if (y === 0) intersection.classList.add('top-edge');
            if (y === BOARD_SIZE - 1) intersection.classList.add('bottom-edge');
            if (x === 0) intersection.classList.add('left-edge');
            if (x === BOARD_SIZE - 1) intersection.classList.add('right-edge');

            if (STAR_POINTS.some(([sx, sy]) => sx === x && sy === y)) {
                const starPoint = document.createElement('div');
                starPoint.className = 'star-point';
                intersection.appendChild(starPoint);
            }

            if (recommendedMove && recommendedMove.x === x && recommendedMove.y === y && board[y][x] === EMPTY) {
                const indicator = document.createElement('div');
                indicator.className = 'recommended-move';
                intersection.appendChild(indicator);
            }

            if (board[y][x] !== EMPTY) {
                const piece = document.createElement('div');
                piece.className = `piece ${board[y][x] === BLACK ? 'black' : 'white'}`;

                if (gameState.lastMove && gameState.lastMove.x === x && gameState.lastMove.y === y) {
                    piece.classList.add('last-move');
                }

                intersection.appendChild(piece);
            } else if (!gameState.gameOver && !gameState.aiThinking) {
                const hoverPiece = document.createElement('div');
                hoverPiece.className = `hover-piece ${gameState.currentPlayer === BLACK ? 'black' : 'white'}`;
                intersection.appendChild(hoverPiece);
            }

            intersection.addEventListener('click', () => handleClick(x, y));
            grid.appendChild(intersection);
        }
    }

    boardElement.appendChild(grid);
}

function handleClick(x, y) {
    if (gameState.gameOver) return;
    if (gameState.aiThinking) return;
    if (board[y][x] !== EMPTY) return;

    if (gameState.mode === 'pve' && gameState.currentPlayer === WHITE) {
        return;
    }

    if (gameState.forbiddenRule && Rules.isForbiddenMove(board, x, y, gameState.currentPlayer)) {
        showForbiddenWarning();
        return;
    }

    placePiece(x, y);
}

function placePiece(x, y) {
    board[y][x] = gameState.currentPlayer;
    gameState.moveCount++;
    gameState.lastMove = { x, y };

    History.addMove(x, y, gameState.currentPlayer, board);
    Audio.playPlaceSound();

    recommendedMove = null;

    if (Rules.checkWin(board, x, y, gameState.currentPlayer)) {
        gameState.gameOver = true;
        gameState.winner = gameState.currentPlayer;
        Audio.playWinSound();
        showResult('win');
    } else if (Rules.checkDraw(board)) {
        gameState.gameOver = true;
        showResult('draw');
    } else {
        gameState.currentPlayer = gameState.currentPlayer === BLACK ? WHITE : BLACK;

        if (gameState.mode === 'pve' && gameState.currentPlayer === WHITE) {
            setTimeout(aiMove, 500);
        }
    }

    renderBoard();
    updateStatus();
    updateMoveList();
    updateAnalysisDisplay();
}

function aiMove() {
    if (gameState.gameOver) return;

    gameState.aiThinking = true;
    renderBoard();

    setTimeout(() => {
        const aiPlayer = WHITE;
        let move = AI.getBestMove(board, aiPlayer, gameState.aiLevel);

        if (gameState.forbiddenRule) {
            if (aiPlayer === BLACK && Rules.isForbiddenMove(board, move.x, move.y, BLACK)) {
                const moves = AI.analyzePosition(board, aiPlayer);
                for (const m of moves) {
                    if (!Rules.isForbiddenMove(board, m.x, m.y, BLACK)) {
                        move = m;
                        break;
                    }
                }
            }
        }

        gameState.aiThinking = false;

        if (move && board[move.y][move.x] === EMPTY) {
            board[move.y][move.x] = aiPlayer;
            gameState.moveCount++;
            gameState.lastMove = { x: move.x, y: move.y };

            History.addMove(move.x, move.y, aiPlayer, board);
            Audio.playPlaceSound();

            if (Rules.checkWin(board, move.x, move.y, aiPlayer)) {
                gameState.gameOver = true;
                gameState.winner = aiPlayer;
                Audio.playWinSound();
                showResult('win');
            } else if (Rules.checkDraw(board)) {
                gameState.gameOver = true;
                showResult('draw');
            } else {
                gameState.currentPlayer = BLACK;
            }

            renderBoard();
            updateStatus();
            updateMoveList();
            updateAnalysisDisplay();
        }
    }, 300);
}

function showForbiddenWarning() {
    Audio.playForbiddenSound();
    forbiddenWarningElement.classList.remove('hidden');
    setTimeout(() => {
        forbiddenWarningElement.classList.add('hidden');
    }, 1500);
}

function showResult(type) {
    gameResultElement.classList.remove('hidden');

    if (type === 'win') {
        gameResultElement.classList.add('win');
        const winner = gameState.winner === BLACK ? '黑方' : '白方';
        gameResultElement.textContent = `🎉 ${winner}获胜！`;
    } else {
        gameResultElement.classList.add('draw');
        gameResultElement.textContent = '🤝 平局！';
    }
}

function updateStatus() {
    if (gameState.gameOver) {
        currentPlayerElement.textContent = '已结束';
        currentPlayerElement.className = 'player-indicator game-over';
    } else if (gameState.aiThinking) {
        currentPlayerElement.textContent = '思考中...';
        currentPlayerElement.className = 'player-indicator ai-thinking';
    } else {
        currentPlayerElement.textContent = gameState.currentPlayer === BLACK ? '黑方' : '白方';
        currentPlayerElement.className = `player-indicator ${gameState.currentPlayer === BLACK ? 'black' : 'white'}`;
    }
    moveCountElement.textContent = gameState.moveCount;
}

function updateMoveList() {
    const moves = History.exportMoveList();
    moveListElement.innerHTML = '';

    moves.forEach((move, index) => {
        const moveItem = document.createElement('div');
        moveItem.className = 'move-item';
        moveItem.innerHTML = `
            <span class="move-num">${index + 1}.</span>
            <span class="move-player ${move.player === BLACK ? 'black' : 'white'}"></span>
            <span class="move-coord">${move.coordinate}</span>
        `;
        moveListElement.appendChild(moveItem);
    });

    moveListElement.scrollTop = moveListElement.scrollHeight;
}

function updateAnalysisDisplay() {
    if (gameState.moveCount > 0) {
        const winRate = AI.calculateWinRate(board, BLACK);
        winRateElement.textContent = `${winRate}%`;
    } else {
        winRateElement.textContent = '--';
    }

    if (recommendedMove) {
        const coord = `${String.fromCharCode(65 + recommendedMove.x)}${recommendedMove.y + 1}`;
        bestMoveElement.textContent = coord;
    } else {
        bestMoveElement.textContent = '--';
    }
}

function undoMove() {
    if (!History.canUndo()) return;
    if (gameState.aiThinking) return;

    Audio.playClickSound();

    History.undo(board);

    if (gameState.mode === 'pve' && History.getMoveCount() > 0) {
        History.undo(board);
    }

    const lastMove = History.getLastMove();
    gameState.lastMove = lastMove ? { x: lastMove.x, y: lastMove.y } : null;
    gameState.moveCount = History.getMoveCount();
    gameState.currentPlayer = gameState.moveCount % 2 === 0 ? BLACK : WHITE;
    gameState.gameOver = false;
    gameState.winner = null;

    gameResultElement.classList.add('hidden');
    gameResultElement.className = 'game-result hidden';
    recommendedMove = null;

    renderBoard();
    updateStatus();
    updateMoveList();
    updateAnalysisDisplay();
}

function analyzeBoard() {
    if (gameState.gameOver) return;

    Audio.playClickSound();

    const analysis = AI.analyzePosition(board, gameState.currentPlayer);
    if (analysis.length > 0) {
        recommendedMove = analysis[0];
        renderBoard();
        updateAnalysisDisplay();
    }
}

function exportSGF() {
    if (gameState.moveCount === 0) return;

    Audio.playClickSound();

    let result = '?';
    if (gameState.winner === BLACK) result = 'B+R';
    else if (gameState.winner === WHITE) result = 'W+R';
    else if (gameState.gameOver) result = 'Draw';

    const gameInfo = {
        gameName: '五子棋对局',
        blackPlayer: gameState.mode === 'pve' ? '玩家' : '黑方',
        whitePlayer: gameState.mode === 'pve' ? 'AI' : '白方',
        result: result,
        rules: gameState.forbiddenRule ? '禁手' : '无禁手'
    };

    const sgfContent = SGF.exportToSGF(gameInfo, History.getMoveList());
    SGF.downloadSGF(SGF.generateFilename(), sgfContent);
}

function toggleSound() {
    const enabled = Audio.toggle();
    toggleSoundBtn.textContent = `音效: ${enabled ? '开' : '关'}`;
}

gameModeSelect.addEventListener('change', () => {
    Audio.playClickSound();
    if (gameModeSelect.value === 'pve') {
        aiLevelGroup.style.display = 'flex';
    } else {
        aiLevelGroup.style.display = 'none';
    }
    initGame();
});

aiLevelSelect.addEventListener('change', () => {
    Audio.playClickSound();
    gameState.aiLevel = parseInt(aiLevelSelect.value);
});

forbiddenRuleCheckbox.addEventListener('change', () => {
    Audio.playClickSound();
    gameState.forbiddenRule = forbiddenRuleCheckbox.checked;
    initGame();
});

themeSelect.addEventListener('change', () => {
    Audio.playClickSound();
    Themes.applyTheme(themeSelect.value);
});

restartBtn.addEventListener('click', initGame);
undoBtn.addEventListener('click', undoMove);
analyzeBtn.addEventListener('click', analyzeBoard);
exportSgfBtn.addEventListener('click', exportSGF);
toggleSoundBtn.addEventListener('click', toggleSound);

document.addEventListener('click', () => {
    Audio.initAudioContext();
}, { once: true });

initGame();
