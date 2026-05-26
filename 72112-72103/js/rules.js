const Rules = (function() {
    const BOARD_SIZE = 15;
    const EMPTY = 0;
    const BLACK = 1;
    const WHITE = 2;

    function checkWin(board, x, y, player) {
        const directions = [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1]
        ];

        for (const [dx, dy] of directions) {
            const count = countDirection(board, x, y, dx, dy, player);
            if (count >= 5) {
                return true;
            }
        }
        return false;
    }

    function countDirection(board, x, y, dx, dy, player) {
        let count = 1;

        let nx = x + dx;
        let ny = y + dy;
        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
            count++;
            nx += dx;
            ny += dy;
        }

        nx = x - dx;
        ny = y - dy;
        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
            count++;
            nx -= dx;
            ny -= dy;
        }

        return count;
    }

    function countLiveThrees(board, x, y, player) {
        const directions = [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1]
        ];

        let liveThreeCount = 0;
        const tempBoard = board.map(row => [...row]);
        tempBoard[y][x] = player;

        for (const [dx, dy] of directions) {
            const line = getLinePattern(tempBoard, x, y, dx, dy, player);
            
            if (isPatternLiveThree(line)) {
                liveThreeCount++;
            }
        }

        return liveThreeCount;
    }

    function getLinePattern(board, x, y, dx, dy, player) {
        let line = [];
        
        for (let i = -4; i <= 4; i++) {
            const nx = x + dx * i;
            const ny = y + dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                line.push(board[ny][nx]);
            } else {
                line.push(-1);
            }
        }
        return line;
    }

    function isPatternLiveThree(line) {
        const patterns = [
            [0, 1, 1, 1, 0],
            [0, 1, 1, 0, 1, 0],
            [0, 1, 0, 1, 1, 0]
        ];

        const lineStr = line.join('');
        
        if (lineStr.includes('01110')) {
            return true;
        }
        if (lineStr.includes('010110') || lineStr.includes('011010')) {
            return true;
        }

        return false;
    }

    function countFours(board, x, y, player) {
        const directions = [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1]
        ];

        let fourCount = 0;
        const tempBoard = board.map(row => [...row]);
        tempBoard[y][x] = player;

        for (const [dx, dy] of directions) {
            let count = 1;
            let openEnds = 0;

            let nx = x + dx;
            let ny = y + dy;
            while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && tempBoard[ny][nx] === player) {
                count++;
                nx += dx;
                ny += dy;
            }
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && tempBoard[ny][nx] === EMPTY) {
                openEnds++;
            }

            nx = x - dx;
            ny = y - dy;
            while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && tempBoard[ny][nx] === player) {
                count++;
                nx -= dx;
                ny -= dy;
            }
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && tempBoard[ny][nx] === EMPTY) {
                openEnds++;
            }

            if (count === 4 && openEnds >= 1) {
                fourCount++;
            }
        }

        return fourCount;
    }

    function checkOverline(board, x, y, player) {
        const directions = [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1]
        ];

        const tempBoard = board.map(row => [...row]);
        tempBoard[y][x] = player;

        for (const [dx, dy] of directions) {
            let count = 1;

            let nx = x + dx;
            let ny = y + dy;
            while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && tempBoard[ny][nx] === player) {
                count++;
                nx += dx;
                ny += dy;
            }

            nx = x - dx;
            ny = y - dy;
            while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && tempBoard[ny][nx] === player) {
                count++;
                nx -= dx;
                ny -= dy;
            }

            if (count >= 6) {
                return true;
            }
        }

        return false;
    }

    function isForbiddenMove(board, x, y, player) {
        if (player !== BLACK) return false;
        if (board[y][x] !== EMPTY) return false;

        const tempBoard = board.map(row => [...row]);
        tempBoard[y][x] = player;

        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
            let count = 1;
            
            let nx = x + dx, ny = y + dy;
            while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && tempBoard[ny][nx] === player) {
                count++; nx += dx; ny += dy;
            }
            
            nx = x - dx; ny = y - dy;
            while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && tempBoard[ny][nx] === player) {
                count++; nx -= dx; ny -= dy;
            }
            
            if (count === 5) {
                return false;
            }
        }

        if (checkOverline(board, x, y, player)) {
            return true;
        }

        const liveThreeCount = countLiveThrees(board, x, y, player);
        if (liveThreeCount >= 2) {
            return true;
        }

        const fourCount = countFours(board, x, y, player);
        if (fourCount >= 2) {
            return true;
        }

        return false;
    }

    function checkDraw(board) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === EMPTY) {
                    return false;
                }
            }
        }
        return true;
    }

    return {
        checkWin,
        countDirection,
        isForbiddenMove,
        checkDraw,
        countLiveThrees,
        countFours,
        checkOverline
    };
})();
