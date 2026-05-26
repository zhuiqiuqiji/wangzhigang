class MiniMap {
    constructor(canvas, mapWidth, mapHeight, size = 150) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.size = size;

        this.canvas.width = size;
        this.canvas.height = size;

        this.scaleX = size / mapWidth;
        this.scaleY = size / mapHeight;

        this.viewRadius = 40;
    }

    setViewRadius(radius) {
        this.viewRadius = radius;
    }

    update(playerSnake, snakes, foods) {
        this.playerSnake = playerSnake;
        this.snakes = snakes;
        this.foods = foods;
    }

    draw() {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
        ctx.fillRect(0, 0, this.size, this.size);

        ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.size, this.size);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (const food of this.foods) {
            const fx = food.x * this.scaleX;
            const fy = food.y * this.scaleY;

            if (this.playerSnake && this.isInPlayerView(food.x, food.y)) {
                ctx.fillStyle = this.getFoodColor(food);
                ctx.beginPath();
                ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.beginPath();
                ctx.arc(fx, fy, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (this.playerSnake && this.playerSnake.isAlive) {
            const playerHead = this.playerSnake.getHead();
            const px = playerHead.x * this.scaleX;
            const py = playerHead.y * this.scaleY;

            ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(px, py, this.viewRadius * this.scaleX, 0, Math.PI * 2);
            ctx.stroke();
        }

        for (const snake of this.snakes) {
            if (!snake.isAlive) continue;

            const head = snake.getHead();

            if (this.playerSnake) {
                const playerHead = this.playerSnake.getHead();
                const dist = Math.abs(head.x - playerHead.x) + Math.abs(head.y - playerHead.y);

                if (dist > this.viewRadius && !snake.isPlayer) {
                    continue;
                }
            }

            if (snake.isInvisible && !snake.isPlayer) continue;

            let color;
            if (snake.isPlayer) {
                color = '#00ff88';
            } else if (snake.teamId) {
                color = this.getTeamColor(snake.teamId);
            } else {
                color = snake.customBodyColor || '#ff6b6b';
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(
                head.x * this.scaleX,
                head.y * this.scaleY,
                snake.isPlayer ? 4 : 2.5,
                0,
                Math.PI * 2
            );
            ctx.fill();

            if (snake.isPlayer) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            if (snake.teamId) {
                ctx.strokeStyle = this.getTeamColor(snake.teamId);
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    getFoodColor(food) {
        switch (food.type) {
            case 'large': return '#ffd700';
            case 'shield': return '#22c55e';
            case 'speed': return '#f97316';
            case 'magnet': return '#ec4899';
            case 'invisible': return '#38bdf8';
            case 'poison': return '#8b5cf6';
            case 'timeslow': return '#06b6d4';
            default: return 'rgba(255, 255, 255, 0.5)';
        }
    }

    getTeamColor(teamId) {
        const colors = {
            'red': '#ef4444',
            'blue': '#3b82f6',
            'green': '#22c55e',
            'yellow': '#eab308'
        };
        return colors[teamId] || '#ffffff';
    }

    isInPlayerView(x, y) {
        if (!this.playerSnake || !this.playerSnake.isAlive) return true;
        const head = this.playerSnake.getHead();
        const dist = Math.abs(x - head.x) + Math.abs(y - head.y);
        return dist <= this.viewRadius;
    }
}