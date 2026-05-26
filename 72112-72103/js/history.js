const History = (function() {
    let moveHistory = [];
    let currentIndex = -1;
    let boardSnapshot = [];
    const BOARD_SIZE = 15;
    const EMPTY = 0;

    function init() {
        moveHistory = [];
        currentIndex = -1;
        boardSnapshot = [];
    }

    function addMove(x, y, player, board) {
        if (currentIndex < moveHistory.length - 1) {
            moveHistory = moveHistory.slice(0, currentIndex + 1);
            boardSnapshot = boardSnapshot.slice(0, currentIndex + 1);
        }

        moveHistory.push({
            x,
            y,
            player,
            moveNumber: moveHistory.length + 1,
            timestamp: Date.now()
        });

        boardSnapshot.push(board.map(row => [...row]));
        currentIndex++;
    }

    function undo(board) {
        if (currentIndex < 0) return null;

        const lastMove = moveHistory[currentIndex];
        board[lastMove.y][lastMove.x] = EMPTY;

        currentIndex--;

        if (currentIndex >= 0) {
            const prevBoard = boardSnapshot[currentIndex];
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    board[y][x] = prevBoard[y][x];
                }
            }
        }

        return lastMove;
    }

    function getMoveCount() {
        return moveHistory.length;
    }

    function getCurrentIndex() {
        return currentIndex;
    }

    function getMoveList() {
        return [...moveHistory];
    }

    function getLastMove() {
        if (currentIndex >= 0 && currentIndex < moveHistory.length) {
            return moveHistory[currentIndex];
        }
        return null;
    }

    function canUndo() {
        return currentIndex >= 0;
    }

    function exportMoveList() {
        return moveHistory.map(move => ({
            ...move,
            coordinate: `${String.fromCharCode(65 + move.x)}${move.y + 1}`
        }));
    }

    function getBoardAtStep(step) {
        if (step < 0 || step >= boardSnapshot.length) {
            return null;
        }
        return boardSnapshot[step].map(row => [...row]);
    }

    return {
        init,
        addMove,
        undo,
        getMoveCount,
        getCurrentIndex,
        getMoveList,
        getLastMove,
        canUndo,
        exportMoveList,
        getBoardAtStep
    };
})();
