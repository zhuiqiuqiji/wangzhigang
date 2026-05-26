class Board {
    constructor(rows = 8, cols = 12, layers = 3) {
        this.rows = rows;
        this.cols = cols;
        this.layers = layers;
        this.tiles = [];
        this.grid = [];
        this.tileTypes = this.generateTileTypes();
    }

    generateTileTypes() {
        const types = [];
        for (let i = 1; i <= 9; i++) {
            types.push({ type: 'wan', value: i, display: this.getWanDisplay(i) });
            types.push({ type: 'tiao', value: i, display: this.getTiaoDisplay(i) });
            types.push({ type: 'tong', value: i, display: this.getTongDisplay(i) });
        }
        const fengChars = ['东', '南', '西', '北'];
        for (let i = 0; i < 4; i++) {
            types.push({ type: 'feng', value: i + 1, display: fengChars[i] });
        }
        const jianChars = ['中', '发', '白'];
        for (let i = 0; i < 3; i++) {
            types.push({ type: 'jian', value: i + 1, display: jianChars[i] });
        }
        return types;
    }

    getWanDisplay(value) {
        const chars = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        return chars[value - 1] + '万';
    }

    getTiaoDisplay(value) {
        return value + '条';
    }

    getTongDisplay(value) {
        return value + '筒';
    }

    generateTiles() {
        this.tiles = [];
        this.grid = [];
        
        for (let z = 0; z < this.layers; z++) {
            this.grid[z] = [];
            for (let y = 0; y < this.rows; y++) {
                this.grid[z][y] = [];
                for (let x = 0; x < this.cols; x++) {
                    this.grid[z][y][x] = null;
                }
            }
        }

        const positions = this.generateLayeredPositions();
        let totalPositions = positions.length;
        
        if (totalPositions % 2 !== 0) {
            positions.pop();
            totalPositions--;
        }

        const tilePairs = Math.floor(totalPositions / 2);
        const selectedTypes = [];
        
        for (let i = 0; i < tilePairs; i++) {
            const typeIndex = i % this.tileTypes.length;
            selectedTypes.push({ ...this.tileTypes[typeIndex] });
            selectedTypes.push({ ...this.tileTypes[typeIndex] });
        }

        this.shuffleArray(selectedTypes);
        
        for (let i = 0; i < selectedTypes.length && i < positions.length; i++) {
            const pos = positions[i];
            const tile = {
                id: `tile_${pos.z}_${pos.y}_${pos.x}`,
                type: selectedTypes[i].type,
                value: selectedTypes[i].value,
                display: selectedTypes[i].display,
                x: pos.x,
                y: pos.y,
                z: pos.z,
                isSelected: false,
                isRemoved: false,
                element: null
            };
            this.tiles.push(tile);
            this.grid[pos.z][pos.y][pos.x] = tile;
        }

        return this.tiles;
    }

    generateLayeredPositions() {
        const positions = [];
        
        for (let z = 0; z < this.layers; z++) {
            const layerOffset = z;
            const startX = layerOffset;
            const startY = layerOffset;
            const endX = this.cols - layerOffset - 1;
            const endY = this.rows - layerOffset - 1;

            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    const isEdge = y === startY || y === endY || x === startX || x === endX;
                    if (z === 0) {
                        positions.push({ x, y, z });
                    } else if (isEdge) {
                        positions.push({ x, y, z });
                    } else {
                        const pattern = (x + y) % 3;
                        if (pattern !== 0) {
                            positions.push({ x, y, z });
                        }
                    }
                }
            }
        }

        this.shuffleArray(positions);
        return positions;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getTileAt(x, y, z = 0) {
        if (z < 0 || z >= this.layers || y < 0 || y >= this.rows || x < 0 || x >= this.cols) {
            return null;
        }
        return this.grid[z][y][x];
    }

    getTopTileAt(x, y) {
        for (let z = this.layers - 1; z >= 0; z--) {
            const tile = this.grid[z][y][x];
            if (tile && !tile.isRemoved) {
                return tile;
            }
        }
        return null;
    }

    isEmptyAt(x, y) {
        return this.getTopTileAt(x, y) === null;
    }

    removeTile(tile) {
        tile.isRemoved = true;
        this.grid[tile.z][tile.y][tile.x] = null;
        const index = this.tiles.indexOf(tile);
        if (index > -1) {
            this.tiles.splice(index, 1);
        }
    }

    isTileClickable(tile) {
        if (tile.isRemoved) return false;

        for (let z = tile.z + 1; z < this.layers; z++) {
            const aboveTile = this.grid[z][tile.y][tile.x];
            if (aboveTile && !aboveTile.isRemoved) {
                return false;
            }
        }

        const leftEmpty = tile.x === 0 || this.isEmptyAt(tile.x - 1, tile.y);
        const rightEmpty = tile.x === this.cols - 1 || this.isEmptyAt(tile.x + 1, tile.y);

        return leftEmpty || rightEmpty;
    }

    getClickableTiles() {
        return this.tiles.filter(tile => this.isTileClickable(tile));
    }

    getRemainingTiles() {
        return this.tiles.filter(tile => !tile.isRemoved);
    }

    shuffle() {
        const remainingTiles = this.getRemainingTiles();
        const tileData = remainingTiles.map(tile => ({
            type: tile.type,
            value: tile.value,
            display: tile.display
        }));

        this.shuffleArray(tileData);

        for (let i = 0; i < remainingTiles.length; i++) {
            const tile = remainingTiles[i];
            tile.type = tileData[i].type;
            tile.value = tileData[i].value;
            tile.display = tileData[i].display;
        }

        return remainingTiles;
    }
}
