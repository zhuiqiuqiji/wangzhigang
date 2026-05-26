const Levels = {
    layouts: {
        rectangle: (rows, cols, layers) => {
            const positions = [];
            for (let z = 0; z < layers; z++) {
                const offset = z;
                for (let y = offset; y < rows - offset; y++) {
                    for (let x = offset; x < cols - offset; x++) {
                        if (z === 0 || y === offset || y === rows - offset - 1 || 
                            x === offset || x === cols - offset - 1) {
                            positions.push({ x, y, z });
                        } else if ((x + y) % 3 !== 0) {
                            positions.push({ x, y, z });
                        }
                    }
                }
            }
            return positions;
        },
        pyramid: (rows, cols, layers) => {
            const positions = [];
            for (let z = 0; z < layers; z++) {
                const shrink = z * 2;
                const startX = Math.floor(cols / 2) - Math.floor((cols - shrink) / 2);
                const startY = Math.floor(rows / 2) - Math.floor((rows - shrink) / 2);
                const endX = startX + (cols - shrink);
                const endY = startY + (rows - shrink);
                
                for (let y = startY; y < endY && y < rows; y++) {
                    for (let x = startX; x < endX && x < cols; x++) {
                        if (y >= 0 && x >= 0) {
                            positions.push({ x, y, z });
                        }
                    }
                }
            }
            return positions;
        },
        diamond: (rows, cols, layers) => {
            const positions = [];
            const centerX = Math.floor(cols / 2);
            const centerY = Math.floor(rows / 2);
            
            for (let z = 0; z < layers; z++) {
                const radius = Math.min(centerX, centerY) - z;
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        const distance = Math.abs(x - centerX) + Math.abs(y - centerY);
                        if (distance <= radius) {
                            positions.push({ x, y, z });
                        }
                    }
                }
            }
            return positions;
        },
        cross: (rows, cols, layers) => {
            const positions = [];
            const centerX = Math.floor(cols / 2);
            const centerY = Math.floor(rows / 2);
            
            for (let z = 0; z < layers; z++) {
                const width = 3 - z;
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        const inHorizontal = Math.abs(y - centerY) <= width;
                        const inVertical = Math.abs(x - centerX) <= width;
                        if (inHorizontal || inVertical) {
                            if (z === 0 || (y > z && y < rows - z - 1 && x > z && x < cols - z - 1)) {
                                positions.push({ x, y, z });
                            }
                        }
                    }
                }
            }
            return positions;
        },
        heart: (rows, cols, layers) => {
            const positions = [];
            for (let z = 0; z < Math.min(layers, 2); z++) {
                for (let y = z; y < rows - z; y++) {
                    for (let x = z; x < cols - z; x++) {
                        const nx = (x - cols / 2) / (cols / 4);
                        const ny = -(y - rows / 2) / (rows / 4);
                        const heart = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
                        if (heart < 0) {
                            positions.push({ x, y, z });
                        }
                    }
                }
            }
            return positions;
        },
        ring: (rows, cols, layers) => {
            const positions = [];
            const centerX = Math.floor(cols / 2);
            const centerY = Math.floor(rows / 2);
            
            for (let z = 0; z < layers; z++) {
                const outerRadius = Math.min(centerX, centerY) - z;
                const innerRadius = outerRadius - 2;
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        const dx = x - centerX;
                        const dy = y - centerY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance <= outerRadius && distance >= innerRadius) {
                            positions.push({ x, y, z });
                        }
                    }
                }
            }
            return positions;
        },
        checkerboard: (rows, cols, layers) => {
            const positions = [];
            for (let z = 0; z < layers; z++) {
                for (let y = z; y < rows - z; y++) {
                    for (let x = z; x < cols - z; x++) {
                        if ((x + y + z) % 2 === 0) {
                            positions.push({ x, y, z });
                        }
                    }
                }
            }
            return positions;
        },
        spiral: (rows, cols, layers) => {
            const positions = [];
            for (let z = 0; z < layers; z++) {
                let left = z, right = cols - z - 1;
                let top = z, bottom = rows - z - 1;
                
                while (left <= right && top <= bottom) {
                    for (let x = left; x <= right; x++) positions.push({ x, y: top, z });
                    top++;
                    for (let y = top; y <= bottom; y++) positions.push({ x: right, y, z });
                    right--;
                    if (top <= bottom) {
                        for (let x = right; x >= left; x--) positions.push({ x, y: bottom, z });
                        bottom--;
                    }
                    if (left <= right) {
                        for (let y = bottom; y >= top; y--) positions.push({ x: left, y, z });
                        left++;
                    }
                }
            }
            return positions;
        }
    },
    
    list: [
        {
            id: 1,
            name: '新手入门',
            layout: 'rectangle',
            rows: 6,
            cols: 8,
            layers: 1,
            theme: 'classic',
            timeLimit: 0,
            stepLimit: 0,
            stars: { time: [120, 180, 300], score: [500, 300, 100] }
        },
        {
            id: 2,
            name: '初次挑战',
            layout: 'rectangle',
            rows: 6,
            cols: 10,
            layers: 2,
            theme: 'classic',
            timeLimit: 0,
            stepLimit: 0,
            stars: { time: [180, 240, 360], score: [800, 500, 200] }
        },
        {
            id: 3,
            name: '金字塔',
            layout: 'pyramid',
            rows: 8,
            cols: 10,
            layers: 3,
            theme: 'fruits',
            timeLimit: 0,
            stepLimit: 0,
            stars: { time: [240, 300, 420], score: [1200, 800, 400] }
        },
        {
            id: 4,
            name: '菱形迷阵',
            layout: 'diamond',
            rows: 8,
            cols: 12,
            layers: 2,
            theme: 'festival',
            timeLimit: 0,
            stepLimit: 0,
            stars: { time: [210, 270, 390], score: [1000, 600, 300] }
        },
        {
            id: 5,
            name: '十字交叉',
            layout: 'cross',
            rows: 8,
            cols: 12,
            layers: 3,
            theme: 'animals',
            timeLimit: 300,
            stepLimit: 0,
            stars: { time: [150, 210, 300], score: [1500, 1000, 500] }
        },
        {
            id: 6,
            name: '爱心满满',
            layout: 'heart',
            rows: 8,
            cols: 10,
            layers: 2,
            theme: 'festival',
            timeLimit: 0,
            stepLimit: 100,
            stars: { time: [180, 240, 360], score: [1200, 800, 400] }
        },
        {
            id: 7,
            name: '环形挑战',
            layout: 'ring',
            rows: 8,
            cols: 12,
            layers: 3,
            theme: 'fruits',
            timeLimit: 240,
            stepLimit: 0,
            stars: { time: [120, 180, 240], score: [1800, 1200, 600] }
        },
        {
            id: 8,
            name: '棋盘格',
            layout: 'checkerboard',
            rows: 8,
            cols: 12,
            layers: 2,
            theme: 'classic',
            timeLimit: 0,
            stepLimit: 80,
            stars: { time: [150, 210, 300], score: [1500, 1000, 500] }
        },
        {
            id: 9,
            name: '螺旋迷宫',
            layout: 'spiral',
            rows: 8,
            cols: 12,
            layers: 3,
            theme: 'animals',
            timeLimit: 300,
            stepLimit: 120,
            stars: { time: [180, 240, 300], score: [2000, 1400, 800] }
        },
        {
            id: 10,
            name: '终极挑战',
            layout: 'rectangle',
            rows: 8,
            cols: 14,
            layers: 3,
            theme: 'classic',
            timeLimit: 360,
            stepLimit: 150,
            stars: { time: [240, 300, 360], score: [2500, 1800, 1000] }
        }
    ],

    getLevel(id) {
        return this.list.find(l => l.id === id);
    },

    getLevelCount() {
        return this.list.length;
    },

    generatePositions(levelId) {
        const level = this.getLevel(levelId);
        if (!level) return [];
        
        const layoutFn = this.layouts[level.layout];
        if (!layoutFn) return [];
        
        return layoutFn(level.rows, level.cols, level.layers);
    }
};
