class PathFinder {
    constructor(board) {
        this.board = board;
    }

    findPath(tile1, tile2) {
        if (this.canConnectDirectly(tile1, tile2)) {
            return [
                { x: tile1.x, y: tile1.y },
                { x: tile2.x, y: tile2.y }
            ];
        }

        const oneTurnPath = this.canConnectWithOneTurn(tile1, tile2);
        if (oneTurnPath) {
            return oneTurnPath;
        }

        const twoTurnPath = this.canConnectWithTwoTurns(tile1, tile2);
        if (twoTurnPath) {
            return twoTurnPath;
        }

        return null;
    }

    canConnectDirectly(tile1, tile2) {
        if (tile1.x === tile2.x) {
            return this.isVerticalLineClear(tile1.x, tile1.y, tile2.y, tile1, tile2);
        }
        if (tile1.y === tile2.y) {
            return this.isHorizontalLineClear(tile1.y, tile1.x, tile2.x, tile1, tile2);
        }
        return false;
    }

    canConnectWithOneTurn(tile1, tile2) {
        const corner1 = { x: tile1.x, y: tile2.y };
        if (this.board.isEmptyAt(corner1.x, corner1.y)) {
            if (this.isVerticalLineClear(tile1.x, tile1.y, corner1.y, tile1, null) &&
                this.isHorizontalLineClear(corner1.y, corner1.x, tile2.x, null, tile2)) {
                return [
                    { x: tile1.x, y: tile1.y },
                    corner1,
                    { x: tile2.x, y: tile2.y }
                ];
            }
        }

        const corner2 = { x: tile2.x, y: tile1.y };
        if (this.board.isEmptyAt(corner2.x, corner2.y)) {
            if (this.isHorizontalLineClear(tile1.y, tile1.x, corner2.x, tile1, null) &&
                this.isVerticalLineClear(corner2.x, corner2.y, tile2.y, null, tile2)) {
                return [
                    { x: tile1.x, y: tile1.y },
                    corner2,
                    { x: tile2.x, y: tile2.y }
                ];
            }
        }

        return null;
    }

    canConnectWithTwoTurns(tile1, tile2) {
        for (let x = -1; x <= this.board.cols; x++) {
            if (x === tile1.x || x === tile2.x) continue;

            const p1 = { x, y: tile1.y };
            const p2 = { x, y: tile2.y };

            if ((x === -1 || x === this.board.cols || this.board.isEmptyAt(x, tile1.y)) &&
                (x === -1 || x === this.board.cols || this.board.isEmptyAt(x, tile2.y))) {
                if (this.isHorizontalLineClear(tile1.y, tile1.x, x, tile1, null) &&
                    this.isVerticalLineClear(x, tile1.y, tile2.y, null, null) &&
                    this.isHorizontalLineClear(tile2.y, x, tile2.x, null, tile2)) {
                    return [
                        { x: tile1.x, y: tile1.y },
                        p1,
                        p2,
                        { x: tile2.x, y: tile2.y }
                    ];
                }
            }
        }

        for (let y = -1; y <= this.board.rows; y++) {
            if (y === tile1.y || y === tile2.y) continue;

            const p1 = { x: tile1.x, y };
            const p2 = { x: tile2.x, y };

            if ((y === -1 || y === this.board.rows || this.board.isEmptyAt(tile1.x, y)) &&
                (y === -1 || y === this.board.rows || this.board.isEmptyAt(tile2.x, y))) {
                if (this.isVerticalLineClear(tile1.x, tile1.y, y, tile1, null) &&
                    this.isHorizontalLineClear(y, tile1.x, tile2.x, null, null) &&
                    this.isVerticalLineClear(tile2.x, y, tile2.y, null, tile2)) {
                    return [
                        { x: tile1.x, y: tile1.y },
                        p1,
                        p2,
                        { x: tile2.x, y: tile2.y }
                    ];
                }
            }
        }

        return null;
    }

    isHorizontalLineClear(y, x1, x2, excludeStart = null, excludeEnd = null) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);

        for (let x = minX; x <= maxX; x++) {
            if (x < 0 || x >= this.board.cols) continue;
            if (excludeStart && x === excludeStart.x && y === excludeStart.y) continue;
            if (excludeEnd && x === excludeEnd.x && y === excludeEnd.y) continue;
            if (!this.board.isEmptyAt(x, y)) {
                return false;
            }
        }
        return true;
    }

    isVerticalLineClear(x, y1, y2, excludeStart = null, excludeEnd = null) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        for (let y = minY; y <= maxY; y++) {
            if (y < 0 || y >= this.board.rows) continue;
            if (excludeStart && x === excludeStart.x && y === excludeStart.y) continue;
            if (excludeEnd && x === excludeEnd.x && y === excludeEnd.y) continue;
            if (!this.board.isEmptyAt(x, y)) {
                return false;
            }
        }
        return true;
    }
}
