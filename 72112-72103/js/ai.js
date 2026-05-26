const AI = (function() {
    const BOARD_SIZE = 15;
    const EMPTY = 0;
    const BLACK = 1;
    const WHITE = 2;

    const SCORE = {
        FIVE: 100000,
        LIVE_FOUR: 10000,
        RUSH_FOUR: 1000,
        LIVE_THREE: 1000,
        SLEEP_THREE: 100,
        LIVE_TWO: 100,
        SLEEP_TWO: 10,
        LIVE_ONE: 1
    };

    let searchDepth = 2;
    let nodes = 0;
    let startTime = 0;

    function setLevel(level) {
        searchDepth = level + 1;
    }

    function evaluatePosition(board, x, y, player) {
        let score = 0;
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        for (const [dx, dy] of directions) {
            const lineScore = evaluateLine(board, x, y, dx, dy, player);
            score += lineScore;
        }

        return score;
    }

    function evaluateLine(board, x, y, dx, dy, player) {
        let count = 1;
        let empty = 0;
        let anotherEmpty = 0;

        let nx = x + dx;
        let ny = y + dy;
        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
            count++;
            nx += dx;
            ny += dy;
        }
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === EMPTY) {
            empty++;
            nx += dx;
            ny += dy;
            while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
                nx += dx;
                ny += dy;
            }
        }

        nx = x - dx;
        ny = y - dy;
        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
            count++;
            nx -= dx;
            ny -= dy;
        }
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === EMPTY) {
            anotherEmpty++;
            nx -= dx;
            ny -= dy;
            while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
                nx -= dx;
                ny -= dy;
            }
        }

        return getShapeScore(count, empty + anotherEmpty);
    }

    function getShapeScore(count, emptyCount) {
        if (count >= 5) return SCORE.FIVE;
        if (count === 4) {
            if (emptyCount >= 2) return SCORE.LIVE_FOUR;
            if (emptyCount === 1) return SCORE.RUSH_FOUR;
        }
        if (count === 3) {
            if (emptyCount >= 2) return SCORE.LIVE_THREE;
            if (emptyCount === 1) return SCORE.SLEEP_THREE;
        }
        if (count === 2) {
            if (emptyCount >= 2) return SCORE.LIVE_TWO;
            if (emptyCount === 1) return SCORE.SLEEP_TWO;
        }
        if (count === 1 && emptyCount >= 2) return SCORE.LIVE_ONE;
        return 0;
    }

    function evaluateBoard(board, player) {
        let score = 0;
        const opponent = player === BLACK ? WHITE : BLACK;

        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === player) {
                    score += evaluatePosition(board, x, y, player);
                } else if (board[y][x] === opponent) {
                    score -= evaluatePosition(board, x, y, opponent) * 1.1;
                }
            }
        }

        return score;
    }

    function getCandidateMoves(board) {
        const moves = [];
        const checked = new Set();

        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] !== EMPTY) {
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            const key = `${nx},${ny}`;

                            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE &&
                                board[ny][nx] === EMPTY && !checked.has(key)) {
                                checked.add(key);
                                moves.push({ x: nx, y: ny });
                            }
                        }
                    }
                }
            }
        }

        if (moves.length === 0) {
            moves.push({ x: 7, y: 7 });
        }

        return moves;
    }

    function minimax(board, depth, alpha, beta, isMaximizing, aiPlayer) {
        nodes++;

        if (Date.now() - startTime > 3000) {
            return isMaximizing ? alpha : beta;
        }

        if (depth === 0) {
            return evaluateBoard(board, aiPlayer);
        }

        const moves = getCandidateMoves(board);
        const scoredMoves = moves.map(move => {
            const score = evaluatePosition(board, move.x, move.y, isMaximizing ? aiPlayer : (aiPlayer === BLACK ? WHITE : BLACK));
            return { ...move, score };
        }).sort((a, b) => b.score - a.score);

        const bestMoves = scoredMoves.slice(0, Math.min(10, scoredMoves.length));

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of bestMoves) {
                board[move.y][move.x] = aiPlayer;

                if (Rules.checkWin(board, move.x, move.y, aiPlayer)) {
                    board[move.y][move.x] = EMPTY;
                    return SCORE.FIVE - (searchDepth - depth) * 100;
                }

                const evalScore = minimax(board, depth - 1, alpha, beta, false, aiPlayer);
                board[move.y][move.x] = EMPTY;

                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            const opponent = aiPlayer === BLACK ? WHITE : BLACK;
            let minEval = Infinity;

            for (const move of bestMoves) {
                board[move.y][move.x] = opponent;

                if (Rules.checkWin(board, move.x, move.y, opponent)) {
                    board[move.y][move.x] = EMPTY;
                    return -SCORE.FIVE + (searchDepth - depth) * 100;
                }

                const evalScore = minimax(board, depth - 1, alpha, beta, true, aiPlayer);
                board[move.y][move.x] = EMPTY;

                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function getBestMove(board, aiPlayer, level = 2) {
        setLevel(level);
        nodes = 0;
        startTime = Date.now();

        const moves = getCandidateMoves(board);
        let bestMove = moves[0];
        let bestScore = -Infinity;

        const scoredMoves = moves.map(move => {
            const score = evaluatePosition(board, move.x, move.y, aiPlayer) +
                         evaluatePosition(board, move.x, move.y, aiPlayer === BLACK ? WHITE : BLACK) * 0.9;
            return { ...move, score };
        }).sort((a, b) => b.score - a.score);

        const candidateMoves = scoredMoves.slice(0, Math.min(8, scoredMoves.length));

        for (const move of candidateMoves) {
            board[move.y][move.x] = aiPlayer;

            if (Rules.checkWin(board, move.x, move.y, aiPlayer)) {
                board[move.y][move.x] = EMPTY;
                return move;
            }

            const score = minimax(board, searchDepth - 1, -Infinity, Infinity, false, aiPlayer);
            board[move.y][move.x] = EMPTY;

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    function analyzePosition(board, player) {
        const moves = getCandidateMoves(board);
        const analysis = [];

        for (const move of moves) {
            const attackScore = evaluatePosition(board, move.x, move.y, player);
            const defenseScore = evaluatePosition(board, move.x, move.y, player === BLACK ? WHITE : BLACK);
            const totalScore = attackScore + defenseScore * 0.8;
            analysis.push({ x: move.x, y: move.y, score: totalScore });
        }

        analysis.sort((a, b) => b.score - a.score);
        return analysis.slice(0, 5);
    }

    function calculateWinRate(board, player) {
        const myScore = evaluateBoard(board, player);
        const opponentScore = evaluateBoard(board, player === BLACK ? WHITE : BLACK);
        const total = Math.abs(myScore) + Math.abs(opponentScore);

        if (total === 0) return 50;
        const rate = (myScore + 1000) / (total + 2000) * 100;
        return Math.max(5, Math.min(95, Math.round(rate)));
    }

    return {
        getBestMove,
        analyzePosition,
        calculateWinRate,
        evaluateBoard
    };
})();
