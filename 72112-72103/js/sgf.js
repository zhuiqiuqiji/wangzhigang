const SGF = (function() {
    const BOARD_SIZE = 15;

    function coordToSGF(x, y) {
        return String.fromCharCode(97 + x) + String.fromCharCode(97 + y);
    }

    function sgfToCoord(sgfCoord) {
        return {
            x: sgfCoord.charCodeAt(0) - 97,
            y: sgfCoord.charCodeAt(1) - 97
        };
    }

    function exportToSGF(gameInfo, moveHistory) {
        let sgf = '(;';

        sgf += `GM[5]`;
        sgf += `SZ[${BOARD_SIZE}]`;
        sgf += `DT[${new Date().toISOString().split('T')[0]}]`;
        sgf += `PB[${gameInfo.blackPlayer || '黑方'}]`;
        sgf += `PW[${gameInfo.whitePlayer || '白方'}]`;
        sgf += `RE[${gameInfo.result || '?'}]`;
        sgf += `RU[${gameInfo.rules || 'Chinese'}]`;

        if (gameInfo.gameName) {
            sgf += `GN[${gameInfo.gameName}]`;
        }

        sgf += '\n';

        moveHistory.forEach((move, index) => {
            const player = move.player === 1 ? 'B' : 'W';
            const coord = coordToSGF(move.x, move.y);
            sgf += `;${player}[${coord}]`;

            if ((index + 1) % 10 === 0) {
                sgf += '\n';
            }
        });

        sgf += ')';

        return sgf;
    }

    function downloadSGF(filename, sgfContent) {
        const blob = new Blob([sgfContent], { type: 'application/x-go-sgf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.sgf') ? filename : `${filename}.sgf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function parseSGF(sgfString) {
        const moves = [];
        const gameInfo = {};

        const infoMatch = sgfString.match(/\(;([^;]+)/);
        if (infoMatch) {
            const infoStr = infoMatch[1];

            const gm = infoStr.match(/GM\[([^\]]+)\]/);
            if (gm) gameInfo.gameType = parseInt(gm[1]);

            const sz = infoStr.match(/SZ\[([^\]]+)\]/);
            if (sz) gameInfo.boardSize = parseInt(sz[1]);

            const pb = infoStr.match(/PB\[([^\]]+)\]/);
            if (pb) gameInfo.blackPlayer = pb[1];

            const pw = infoStr.match(/PW\[([^\]]+)\]/);
            if (pw) gameInfo.whitePlayer = pw[1];

            const re = infoStr.match(/RE\[([^\]]+)\]/);
            if (re) gameInfo.result = re[1];
        }

        const moveRegex = /;(B|W)\[([a-z]{2})\]/g;
        let match;
        while ((match = moveRegex.exec(sgfString)) !== null) {
            const player = match[1] === 'B' ? 1 : 2;
            const coord = sgfToCoord(match[2]);
            moves.push({
                x: coord.x,
                y: coord.y,
                player
            });
        }

        return { gameInfo, moves };
    }

    function generateFilename() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        return `gomoku_${dateStr}_${timeStr}.sgf`;
    }

    return {
        exportToSGF,
        downloadSGF,
        parseSGF,
        generateFilename
    };
})();
