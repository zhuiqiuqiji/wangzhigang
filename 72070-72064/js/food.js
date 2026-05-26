class Food {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.rotation = 0;

        this.setupByType();
    }

    setupByType() {
        switch (this.type) {
            case 'normal':
                this.value = 1;
                this.scoreValue = 10;
                this.size = 0.6;
                this.colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#a855f7', '#f97316', '#ec4899'];
                this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
                break;
            case 'large':
                this.value = 3;
                this.scoreValue = 50;
                this.size = 1;
                this.color = '#ffd700';
                break;
            case 'poison':
                this.value = 0;
                this.scoreValue = 0;
                this.size = 0.7;
                this.color = '#8b5cf6';
                this.duration = 5000;
                break;
            case 'invisible':
                this.value = 1;
                this.scoreValue = 20;
                this.size = 0.65;
                this.color = '#38bdf8';
                this.duration = 5000;
                break;
            case 'speed':
                this.value = 0;
                this.scoreValue = 15;
                this.size = 0.6;
                this.color = '#f97316';
                this.duration = 4000;
                break;
            case 'shield':
                this.value = 0;
                this.scoreValue = 30;
                this.size = 0.7;
                this.color = '#22c55e';
                this.duration = 8000;
                break;
            case 'magnet':
                this.value = 1;
                this.scoreValue = 25;
                this.size = 0.65;
                this.color = '#ec4899';
                this.duration = 6000;
                break;
            case 'timeslow':
                this.value = 0;
                this.scoreValue = 20;
                this.size = 0.7;
                this.color = '#06b6d4';
                this.duration = 5000;
                break;
            case 'remains':
                this.value = 2;
                this.scoreValue = 30;
                this.size = 0.8;
                this.color = '#f97316';
                break;
        }
    }

    update(deltaTime) {
        this.pulsePhase += deltaTime * 3;
        this.rotation += deltaTime * 2;
    }

    getPulseScale() {
        return 1 + Math.sin(this.pulsePhase) * 0.15;
    }

    applyEffect(snake) {
        switch (this.type) {
            case 'normal':
            case 'large':
            case 'remains':
            case 'magnet':
                for (let i = 0; i < this.value; i++) {
                    snake.growSnake();
                }
                snake.score += this.scoreValue;
                if (this.type === 'magnet') {
                    snake.applyMagnetEffect(this.duration);
                }
                break;
            case 'poison':
                snake.applySlowEffect(this.duration);
                break;
            case 'invisible':
                snake.applyInvisibleEffect(this.duration);
                break;
            case 'speed':
                snake.startBoost();
                snake.score += this.scoreValue;
                break;
            case 'shield':
                snake.applyShieldEffect(this.duration);
                snake.score += this.scoreValue;
                break;
            case 'timeslow':
                snake.applyTimeSlowEffect(this.duration);
                snake.score += this.scoreValue;
                break;
        }
    }

    draw(ctx, gridSize, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const pulseScale = this.getPulseScale();
        const baseSize = gridSize * this.size;
        const size = baseSize * pulseScale;

        const centerX = screenPos.x + gridSize / 2;
        const centerY = screenPos.y + gridSize / 2;

        ctx.save();
        ctx.translate(centerX, centerY);

        if (this.type === 'poison') {
            ctx.rotate(this.rotation);
        }

        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.type === 'large' ? 25 : 15;
        ctx.fillStyle = this.color;

        if (this.type === 'invisible') {
            ctx.globalAlpha = 0.6 + Math.sin(this.pulsePhase) * 0.2;
        }

        this.drawShape(ctx, size);

        ctx.shadowBlur = 0;
        this.drawIcon(ctx, size);

        ctx.restore();
    }

    drawShape(ctx, size) {
        switch (this.type) {
            case 'normal':
            case 'remains':
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'large':
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
                    const r = size / 2 * (i % 2 === 0 ? 1 : 0.6);
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                break;
            case 'poison':
                ctx.beginPath();
                ctx.moveTo(0, -size / 2);
                ctx.lineTo(size / 2, size / 3);
                ctx.lineTo(0, size / 2);
                ctx.lineTo(-size / 2, size / 3);
                ctx.closePath();
                ctx.fill();
                break;
            case 'invisible':
                ctx.beginPath();
                ctx.ellipse(0, 0, size / 2, size / 3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'speed':
                ctx.beginPath();
                ctx.moveTo(-size / 3, -size / 2);
                ctx.lineTo(size / 4, -size / 6);
                ctx.lineTo(0, 0);
                ctx.lineTo(size / 4, size / 6);
                ctx.lineTo(-size / 3, size / 2);
                ctx.lineTo(-size / 8, 0);
                ctx.closePath();
                ctx.fill();
                break;
            case 'shield':
                ctx.beginPath();
                ctx.moveTo(0, -size / 2);
                ctx.lineTo(size / 2, -size / 4);
                ctx.lineTo(size / 2, size / 4);
                ctx.lineTo(0, size / 2);
                ctx.lineTo(-size / 2, size / 4);
                ctx.lineTo(-size / 2, -size / 4);
                ctx.closePath();
                ctx.fill();
                break;
            case 'magnet':
                ctx.beginPath();
                ctx.arc(-size / 4, 0, size / 3, Math.PI / 2, Math.PI * 1.5);
                ctx.lineTo(-size / 4, -size / 6);
                ctx.lineTo(-size / 8, -size / 6);
                ctx.lineTo(-size / 8, 0);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(size / 4, 0, size / 3, -Math.PI / 2, Math.PI / 2);
                ctx.lineTo(size / 4, size / 6);
                ctx.lineTo(size / 8, size / 6);
                ctx.lineTo(size / 8, 0);
                ctx.fill();
                break;
            case 'timeslow':
                ctx.beginPath();
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    const r = i % 2 === 0 ? size / 2 : size / 3;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                break;
        }
    }

    drawIcon(ctx, size) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `bold ${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        switch (this.type) {
            case 'poison':
                ctx.fillText('☠', 0, 0);
                break;
            case 'invisible':
                ctx.fillText('👻', 0, 0);
                break;
            case 'large':
                ctx.fillStyle = '#fff';
                ctx.fillText('★', 0, 0);
                break;
            case 'speed':
                ctx.fillText('⚡', 0, 0);
                break;
            case 'shield':
                ctx.fillText('🛡', 0, 0);
                break;
            case 'magnet':
                ctx.fillText('🧲', 0, 0);
                break;
            case 'timeslow':
                ctx.fillText('⏱', 0, 0);
                break;
        }
    }
}

class FoodSystem {
    constructor(mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.foods = [];
        this.maxFoodCount = 50;
    }

    generateFood(snakes) {
        const rand = Math.random();
        let type = 'normal';
        if (rand < 0.03) type = 'shield';
        else if (rand < 0.06) type = 'magnet';
        else if (rand < 0.09) type = 'speed';
        else if (rand < 0.12) type = 'timeslow';
        else if (rand < 0.17) type = 'invisible';
        else if (rand < 0.27) type = 'poison';
        else if (rand < 0.37) type = 'large';

        let x, y;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            x = Math.floor(Math.random() * this.mapWidth);
            y = Math.floor(Math.random() * this.mapHeight);
            attempts++;
        } while (this.isPositionOccupied(x, y, snakes) && attempts < maxAttempts);

        if (attempts < maxAttempts) {
            this.foods.push(new Food(x, y, type));
        }
    }

    isPositionOccupied(x, y, snakes) {
        for (const food of this.foods) {
            if (food.x === x && food.y === y) return true;
        }

        for (const snake of snakes) {
            if (!snake.isAlive) continue;
            if (snake.containsPosition(x, y)) return true;
        }

        return false;
    }

    isPositionOccupiedByFood(x, y, excludeFood = null) {
        for (const food of this.foods) {
            if (food === excludeFood) continue;
            if (food.x === x && food.y === y) return true;
        }
        return false;
    }

    createRemains(snake) {
        const remainsCount = Math.floor(snake.getLength() / 3);
        for (let i = 0; i < remainsCount; i++) {
            const bodyIndex = Math.floor(Math.random() * snake.body.length);
            const bodyPart = snake.body[bodyIndex];
            const remains = new Food(bodyPart.x, bodyPart.y, 'remains');
            this.foods.push(remains);
        }
    }

    removeFood(food) {
        const index = this.foods.indexOf(food);
        if (index > -1) {
            this.foods.splice(index, 1);
        }
    }

    update(deltaTime, snakes) {
        for (const food of this.foods) {
            food.update(deltaTime);
        }

        while (this.foods.length < this.maxFoodCount) {
            this.generateFood(snakes);
        }
    }

    draw(ctx, gridSize, camera) {
        for (const food of this.foods) {
            food.draw(ctx, gridSize, camera);
        }
    }
}