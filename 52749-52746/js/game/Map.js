const MAP_THEMES = {
    grassland: {
        name: '草原',
        groundColors: ['#90EE90', '#7CCD7C', '#6B8E23'],
        pathColors: ['#DEB887', '#D2B48C', '#C4A67C'],
        accentColor: '#228B22',
        decorations: ['🌳', '🌲', '🌿', '🌸', '🍀'],
        pathEmoji: ''
    },
    snow: {
        name: '雪地',
        groundColors: ['#F0F8FF', '#E6E6FA', '#B0E0E6'],
        pathColors: ['#A9A9A9', '#808080', '#696969'],
        accentColor: '#4169E1',
        decorations: ['❄️', '⛄', '🌨️', '🏔️', '🧊'],
        pathEmoji: ''
    },
    volcano: {
        name: '火山',
        groundColors: ['#8B0000', '#A52A2A', '#CD5C5C'],
        pathColors: ['#2F4F4F', '#3D3D3D', '#4A4A4A'],
        accentColor: '#FF4500',
        decorations: ['🌋', '🔥', '💀', '🪨', '⚫'],
        pathEmoji: ''
    },
    space: {
        name: '太空',
        groundColors: ['#0C0C1E', '#1a1a3e', '#0d1b2a'],
        pathColors: ['#4B0082', '#6A5ACD', '#7B68EE'],
        accentColor: '#00FFFF',
        decorations: ['⭐', '🌙', '🪐', '💫', '✨'],
        pathEmoji: ''
    }
};

const MAP_LAYOUTS = {
    grassland: [
        { x: 0, y: 3 },
        { x: 2, y: 3 },
        { x: 2, y: 1 },
        { x: 5, y: 1 },
        { x: 5, y: 5 },
        { x: 8, y: 5 },
        { x: 8, y: 2 },
        { x: 11, y: 2 },
        { x: 11, y: 6 },
        { x: 14, y: 6 },
        { x: 14, y: 3 },
        { x: 16, y: 3 }
    ],
    snow: [
        { x: 0, y: 5 },
        { x: 3, y: 5 },
        { x: 3, y: 2 },
        { x: 7, y: 2 },
        { x: 7, y: 7 },
        { x: 10, y: 7 },
        { x: 10, y: 4 },
        { x: 13, y: 4 },
        { x: 13, y: 1 },
        { x: 16, y: 1 },
        { x: 16, y: 5 }
    ],
    volcano: [
        { x: 0, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 6 },
        { x: 2, y: 6 },
        { x: 2, y: 9 },
        { x: 8, y: 9 },
        { x: 8, y: 4 },
        { x: 12, y: 4 },
        { x: 12, y: 7 },
        { x: 16, y: 7 }
    ],
    space: [
        { x: 0, y: 6 },
        { x: 5, y: 6 },
        { x: 5, y: 2 },
        { x: 8, y: 2 },
        { x: 8, y: 8 },
        { x: 11, y: 8 },
        { x: 11, y: 3 },
        { x: 14, y: 3 },
        { x: 14, y: 6 },
        { x: 16, y: 6 }
    ]
};

class GameMap {
    constructor(width, height, cellSize, theme = 'grassland', customPath = null) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.floor(width / cellSize);
        this.rows = Math.floor(height / cellSize);
        this.theme = theme;
        this.themeConfig = MAP_THEMES[theme];
        this.grid = [];
        this.path = [];
        this.decorations = [];
        
        this.initGrid();
        if (customPath) {
            this.setCustomPath(customPath);
        } else {
            this.initPath();
        }
        this.initDecorations();
    }

    initGrid() {
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = 0;
            }
        }
    }

    initPath() {
        this.path = MAP_LAYOUTS[this.theme] || MAP_LAYOUTS.grassland;

        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            this.markPathCells(start, end);
        }
    }

    setCustomPath(pathPoints) {
        this.path = pathPoints;
        this.initGrid();
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            this.markPathCells(start, end);
        }
    }

    markPathCells(start, end) {
        const dx = Math.sign(end.x - start.x);
        const dy = Math.sign(end.y - start.y);
        let x = start.x;
        let y = start.y;

        while (x !== end.x || y !== end.y) {
            if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
                this.grid[y][x] = 1;
            }
            if (x !== end.x) x += dx;
            else if (y !== end.y) y += dy;
        }
        if (end.y >= 0 && end.y < this.rows && end.x >= 0 && end.x < this.cols) {
            this.grid[end.y][end.x] = 1;
        }
    }

    initDecorations() {
        this.decorations = [];
        const count = 8 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
            const col = Math.floor(Math.random() * this.cols);
            const row = Math.floor(Math.random() * this.rows);
            if (this.grid[row] && this.grid[row][col] === 0) {
                const decorIndex = Math.floor(Math.random() * this.themeConfig.decorations.length);
                this.decorations.push({
                    x: col * this.cellSize + this.cellSize / 2,
                    y: row * this.cellSize + this.cellSize / 2,
                    emoji: this.themeConfig.decorations[decorIndex],
                    size: 16 + Math.random() * 12,
                    offset: Math.random() * Math.PI * 2
                });
            }
        }
    }

    getPathPixelPoints() {
        return this.path.map(point => ({
            x: point.x * this.cellSize + this.cellSize / 2,
            y: point.y * this.cellSize + this.cellSize / 2
        }));
    }

    isPathCell(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return true;
        }
        return this.grid[row][col] === 1;
    }

    hasTower(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return true;
        }
        return this.grid[row][col] === 2;
    }

    canPlaceTower(col, row) {
        return !this.isPathCell(col, row) && !this.hasTower(col, row);
    }

    placeTower(col, row) {
        if (this.canPlaceTower(col, row)) {
            this.grid[row][col] = 2;
            return true;
        }
        return false;
    }

    removeTower(col, row) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = 0;
        }
    }

    getGridPosition(pixelX, pixelY) {
        return {
            col: Math.floor(pixelX / this.cellSize),
            row: Math.floor(pixelY / this.cellSize)
        };
    }

    getCellCenter(col, row) {
        return {
            x: col * this.cellSize + this.cellSize / 2,
            y: row * this.cellSize + this.cellSize / 2
        };
    }

    render(ctx) {
        const time = Date.now() / 1000;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = col * this.cellSize;
                const y = row * this.cellSize;

                if (this.grid[row][col] === 1) {
                    const pathShade = (row + col) % 3;
                    ctx.fillStyle = this.themeConfig.pathColors[pathShade];
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                } else {
                    const shade = (row + col) % 3;
                    ctx.fillStyle = this.themeConfig.groundColors[shade];
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                }

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            }
        }

        this.drawDecorations(ctx, time);
        this.drawPath(ctx);
        this.drawEndPoint(ctx);
    }

    drawDecorations(ctx, time) {
        for (const decor of this.decorations) {
            const bobY = Math.sin(time * 2 + decor.offset) * 2;
            ctx.font = `${decor.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(decor.emoji, decor.x, decor.y + bobY);
        }
    }

    drawPath(ctx) {
        const points = this.getPathPixelPoints();
        if (points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.strokeStyle = this.themeConfig.accentColor;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawEndPoint(ctx) {
        const lastPoint = this.path[this.path.length - 1];
        const x = lastPoint.x * this.cellSize + this.cellSize / 2;
        const y = lastPoint.y * this.cellSize + this.cellSize / 2;

        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🥕', x, y);
    }

    drawPlacementPreview(ctx, col, row, isValid) {
        const x = col * this.cellSize;
        const y = row * this.cellSize;

        ctx.fillStyle = isValid ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)';
        ctx.fillRect(x, y, this.cellSize, this.cellSize);

        ctx.strokeStyle = isValid ? '#4CAF50' : '#F44336';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, this.cellSize, this.cellSize);
    }

    static getThemes() {
        return Object.keys(MAP_THEMES).map(key => ({
            id: key,
            name: MAP_THEMES[key].name
        }));
    }
}
