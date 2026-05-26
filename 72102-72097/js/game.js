const BOARD_SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1],  [1, 0], [1, 1]
];

let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let isProcessing = false;

function initGame() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    
    const mid = BOARD_SIZE / 2;
    board[mid - 1][mid - 1] = WHITE;
    board[mid - 1][mid] = BLACK;
    board[mid][mid - 1] = BLACK;
    board[mid][mid] = WHITE;

    currentPlayer = BLACK;
    gameOver = false;
    isProcessing = false;

    hideGameOverModal();
    renderBoard();
    updateScore();
    updateStatus();
    highlightCurrentPlayer();
}

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    const validMoves = getValidMoves(currentPlayer);

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (board[row][col] !== EMPTY) {
                const piece = document.createElement('div');
                piece.className = `piece ${board[row][col] === BLACK ? 'black' : 'white'}`;
                cell.appendChild(piece);
                cell.classList.add('has-piece');
            } else if (validMoves.some(move => move.row === row && move.col === col)) {
                cell.classList.add('valid-move');
            }

            cell.addEventListener('click', () => handleCellClick(row, col));
            boardElement.appendChild(cell);
        }
    }
}

function handleCellClick(row, col) {
    if (gameOver || isProcessing) return;
    if (board[row][col] !== EMPTY) return;
    if (!isValidMove(row, col, currentPlayer)) return;

    makeMove(row, col);
}

function makeMove(row, col) {
    const piecesToFlip = getPiecesToFlip(row, col, currentPlayer);
    
    if (piecesToFlip.length === 0) return false;

    isProcessing = true;
    board[row][col] = currentPlayer;
    
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        cell.classList.remove('valid-move');
        cell.classList.add('has-piece');
        const piece = document.createElement('div');
        piece.className = `piece ${currentPlayer === BLACK ? 'black' : 'white'} placing`;
        cell.appendChild(piece);
    }

    setTimeout(() => {
        flipPieces(piecesToFlip);
        
        setTimeout(() => {
            updateScore();
            
            if (checkGameOver()) {
                endGame();
            } else {
                switchPlayer();
                
                const nextValidMoves = getValidMoves(currentPlayer);
                if (nextValidMoves.length === 0) {
                    updateStatus(`${currentPlayer === BLACK ? '黑方' : '白方'}无合法走法，跳过回合`);
                    setTimeout(() => {
                        switchPlayer();
                        
                        const nextNextValidMoves = getValidMoves(currentPlayer);
                        if (nextNextValidMoves.length === 0) {
                            endGame();
                        } else {
                            renderBoard();
                            updateStatus();
                            highlightCurrentPlayer();
                        }
                        isProcessing = false;
                    }, 1000);
                } else {
                    renderBoard();
                    updateStatus();
                    highlightCurrentPlayer();
                    isProcessing = false;
                }
            }
        }, 600);
    }, 100);

    return true;
}

function flipPieces(pieces) {
    pieces.forEach(([row, col]) => {
        board[row][col] = currentPlayer;
        
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            const piece = cell.querySelector('.piece');
            if (piece) {
                piece.classList.add('flipping');
                
                setTimeout(() => {
                    piece.className = `piece ${currentPlayer === BLACK ? 'black' : 'white'}`;
                }, 300);
            }
        }
    });
}

function getPiecesToFlip(row, col, player) {
    const piecesToFlip = [];
    const opponent = player === BLACK ? WHITE : BLACK;

    for (const [dr, dc] of DIRECTIONS) {
        const pieces = [];
        let r = row + dr;
        let c = col + dc;

        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) {
            pieces.push([r, c]);
            r += dr;
            c += dc;
        }

        if (pieces.length > 0 && r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
            piecesToFlip.push(...pieces);
        }
    }

    return piecesToFlip;
}

function isValidMove(row, col, player) {
    if (board[row][col] !== EMPTY) return false;
    return getPiecesToFlip(row, col, player).length > 0;
}

function getValidMoves(player) {
    const moves = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isValidMove(row, col, player)) {
                moves.push({ row, col });
            }
        }
    }
    return moves;
}

function countPieces() {
    let black = 0;
    let white = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === BLACK) black++;
            else if (board[row][col] === WHITE) white++;
        }
    }
    return { black, white };
}

function updateScore() {
    const { black, white } = countPieces();
    document.getElementById('black-score').textContent = black;
    document.getElementById('white-score').textContent = white;
}

function switchPlayer() {
    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
}

function updateStatus(message) {
    const statusElement = document.getElementById('game-status');
    if (message) {
        statusElement.textContent = message;
    } else {
        statusElement.textContent = `${currentPlayer === BLACK ? '黑方' : '白方'}回合`;
    }
}

function highlightCurrentPlayer() {
    document.querySelector('.black-player').classList.toggle('active', currentPlayer === BLACK);
    document.querySelector('.white-player').classList.toggle('active', currentPlayer === WHITE);
}

function checkGameOver() {
    const { black, white } = countPieces();
    
    if (black + white === BOARD_SIZE * BOARD_SIZE) return true;
    
    const blackMoves = getValidMoves(BLACK);
    const whiteMoves = getValidMoves(WHITE);
    
    return blackMoves.length === 0 && whiteMoves.length === 0;
}

function endGame() {
    gameOver = true;
    isProcessing = false;
    const { black, white } = countPieces();
    
    let winnerText;
    if (black > white) {
        winnerText = '🎉 黑方获胜！';
    } else if (white > black) {
        winnerText = '🎉 白方获胜！';
    } else {
        winnerText = '🤝 平局！';
    }

    document.getElementById('winner-text').textContent = winnerText;
    document.getElementById('final-score').textContent = `黑方 ${black} : ${white} 白方`;
    
    setTimeout(() => {
        showGameOverModal();
    }, 500);
}

function showGameOverModal() {
    document.getElementById('game-over-modal').classList.remove('hidden');
}

function hideGameOverModal() {
    document.getElementById('game-over-modal').classList.add('hidden');
}

document.getElementById('restart-btn').addEventListener('click', initGame);
document.getElementById('play-again-btn').addEventListener('click', initGame);

document.addEventListener('DOMContentLoaded', initGame);
