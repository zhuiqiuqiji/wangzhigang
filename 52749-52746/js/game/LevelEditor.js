class LevelEditor {
    constructor(canvas, cellSize = 50) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.cellSize = cellSize;
        this.cols = Math.floor(this.width / cellSize);
        this.rows = Math.floor(this.height / cellSize);

        this.grid = [];
        this.path = [];
        this.isEditing = false;
        this.editMode = 'path';
        this.selectedTheme = 'grassland';

        this.initGrid();

        this.setupEventListeners();
    }

    initGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = 0;
            }
        }
        this.path = [];
    }

    setupEventListeners() {
        let isDragging = false;

        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isEditing) return;
            isDragging = true;
            this.handleClick(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isEditing || !isDragging) return;
            this.handleClick(e);
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

        if (this.editMode === 'path') {
            this.togglePathCell(col, row);
        } else if (this.editMode === 'tower') {
            this.toggleTowerSpot(col, row);
        } else if (this.editMode === 'eraser') {
            this.eraseCell(col, row);
        }

        this.updatePath();
    }

    togglePathCell(col, row) {
        if (this.grid[row][col] === 1) return;
        this.grid[row][col] = 1;
    }

    toggleTowerSpot(col, row) {
        if (this.grid[row][col] === 1) return;
        this.grid[row][col] = this.grid[row][col] === 2 ? 0 : 2;
    }

    eraseCell(col, row) {
        this.grid[row][col] = 0;
    }

    updatePath() {
        const startPoint = this.findStartPoint();
        if (!startPoint) {
            this.path = [];
            return;
        }

        this.path = this.findPath(startPoint);
    }

    findStartPoint() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (this.grid[row][col] === 1) {
                    return { col, row };
                }
            }
        }
        return null;
    }

    findPath(start) {
        const path = [{ x: start.col, y: start.row }];
        const visited = new Set();
        visited.add(`${start.col},${start.row}`);

        let current = start;
        let maxIterations = 1000;

        while (maxIterations > 0) {
            maxIterations--;
            const neighbors = this.getPathNeighbors(current.col, current.row, visited);
            
            if (neighbors.length === 0) break;

            const next = neighbors[0];
            path.push({ x: next.col, y: next.row });
            visited.add(`${next.col},${next.row}`);
            current = next;
        }

        return path;
    }

    getPathNeighbors(col, row, visited) {
        const neighbors = [];
        const directions = [
            { dc: 1, dr: 0 },
            { dc: 0, dr: 1 },
            { dc: -1, dr: 0 },
            { dc: 0, dr: -1 }
        ];

        for (const dir of directions) {
            const newCol = col + dir.dc;
            const newRow = row + dir.dr;
            const key = `${newCol},${newRow}`;

            if (
                newCol >= 0 && newCol < this.cols &&
                newRow >= 0 && newRow < this.rows &&
                this.grid[newRow][newCol] === 1 &&
                !visited.has(key)
            ) {
                neighbors.push({ col: newCol, row: newRow });
            }
        }

        return neighbors;
    }

    setEditMode(mode) {
        this.editMode = mode;
    }

    setTheme(theme) {
        this.selectedTheme = theme;
    }

    clear() {
        this.initGrid();
    }

    getLevelData() {
        return {
            theme: this.selectedTheme,
            path: [...this.path],
            grid: JSON.parse(JSON.stringify(this.grid))
        };
    }

    loadLevelData(data) {
        this.selectedTheme = data.theme || 'grassland';
        this.grid = JSON.parse(JSON.stringify(data.grid));
        this.path = [...(data.path || [])];
    }

    render() {
        const themeConfig = MAP_THEMES[this.selectedTheme] || MAP_THEMES.grassland;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = col * this.cellSize;
                const y = row * this.cellSize;

                const shade = (row + col) % 3;
                this.ctx.fillStyle = themeConfig.groundColors[shade];
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);

                if (this.grid[row][col] === 1) {
                    const pathShade = (row + col) % 3;
                    this.ctx.fillStyle = themeConfig.pathColors[pathShade];
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                } else if (this.grid[row][col] === 2) {
                    this.ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    this.ctx.font = '20px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('🏰', x + this.cellSize / 2, y + this.cellSize / 2);
                }

                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            }
        }

        if (this.path.length > 1) {
            this.ctx.beginPath();
            this.ctx.moveTo(
                this.path[0].x * this.cellSize + this.cellSize / 2,
                this.path[0].y * this.cellSize + this.cellSize / 2
            );

            for (let i = 1; i < this.path.length; i++) {
                this.ctx.lineTo(
                    this.path[i].x * this.cellSize + this.cellSize / 2,
                    this.path[i].y * this.cellSize + this.cellSize / 2
                );
            }

            this.ctx.strokeStyle = themeConfig.accentColor;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        }

        if (this.path.length > 0) {
            const start = this.path[0];
            const end = this.path[this.path.length - 1];

            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🚪', start.x * this.cellSize + this.cellSize / 2, start.y * this.cellSize + this.cellSize / 2);
            this.ctx.fillText('🥕', end.x * this.cellSize + this.cellSize / 2, end.y * this.cellSize + this.cellSize / 2);
        }

        if (this.isEditing) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 150, 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`编辑模式: ${this.getModeName()}`, 20, 30);
        }
    }

    getModeName() {
        const names = {
            path: '绘制路径',
            tower: '塔位标记',
            eraser: '橡皮擦'
        };
        return names[this.editMode] || this.editMode;
    }

    exportToJSON() {
        const data = this.getLevelData();
        return JSON.stringify(data, null, 2);
    }

    importFromJSON(json) {
        try {
            const data = JSON.parse(json);
            this.loadLevelData(data);
            return true;
        } catch (e) {
            console.error('导入失败:', e);
            return false;
        }
    }
}
