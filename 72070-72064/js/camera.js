class Camera {
    constructor(canvas, gridSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.lerpSpeed = 0.12;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.viewRadius = 40;
        this.fogOfWar = false;

        this.setupRoundRect();
    }

    setupRoundRect() {
        if (!this.ctx.roundRect) {
            this.ctx.roundRect = function(x, y, width, height, radius) {
                if (typeof radius === 'number') {
                    radius = { tl: radius, tr: radius, br: radius, bl: radius };
                } else {
                    radius = {
                        tl: radius.tl || 0,
                        tr: radius.tr || 0,
                        br: radius.br || 0,
                        bl: radius.bl || 0
                    };
                }
                this.beginPath();
                this.moveTo(x + radius.tl, y);
                this.lineTo(x + width - radius.tr, y);
                this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
                this.lineTo(x + width, y + height - radius.br);
                this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
                this.lineTo(x + radius.bl, y + height);
                this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
                this.lineTo(x, y + radius.tl);
                this.quadraticCurveTo(x, y, x + radius.tl, y);
                this.closePath();
                return this;
            };
        }
    }

    setMapSize(width, height) {
        this.mapWidth = width;
        this.mapHeight = height;
    }

    update(targetWorldX, targetWorldY) {
        this.targetX = targetWorldX * this.gridSize - this.canvas.width / 2 + this.gridSize / 2;
        this.targetY = targetWorldY * this.gridSize - this.canvas.height / 2 + this.gridSize / 2;

        this.x += (this.targetX - this.x) * this.lerpSpeed;
        this.y += (this.targetY - this.y) * this.lerpSpeed;

        const maxX = this.mapWidth * this.gridSize - this.canvas.width;
        const maxY = this.mapHeight * this.gridSize - this.canvas.height;
        this.x = Math.max(0, Math.min(this.x, maxX));
        this.y = Math.max(0, Math.min(this.y, maxY));
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.gridSize - this.x,
            y: worldY * this.gridSize - this.y
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: Math.floor((screenX + this.x) / this.gridSize),
            y: Math.floor((screenY + this.y) / this.gridSize)
        };
    }

    isInView(worldX, worldY, margin = 5) {
        const screenPos = this.worldToScreen(worldX, worldY);
        return screenPos.x > -margin * this.gridSize &&
               screenPos.x < this.canvas.width + margin * this.gridSize &&
               screenPos.y > -margin * this.gridSize &&
               screenPos.y < this.canvas.height + margin * this.gridSize;
    }

    clear() {
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;

        const startX = Math.floor(this.x / this.gridSize);
        const startY = Math.floor(this.y / this.gridSize);
        const endX = Math.ceil((this.x + this.canvas.width) / this.gridSize);
        const endY = Math.ceil((this.y + this.canvas.height) / this.gridSize);

        for (let x = startX; x <= endX; x++) {
            const screenX = x * this.gridSize - this.x;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = startY; y <= endY; y++) {
            const screenY = y * this.gridSize - this.y;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
            this.ctx.stroke();
        }
    }

    drawBorders() {
        const padding = 2;
        this.ctx.strokeStyle = '#ff4444';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#ff4444';
        this.ctx.shadowBlur = 15;

        const topLeft = this.worldToScreen(0, 0);
        const bottomRight = this.worldToScreen(this.mapWidth, this.mapHeight);

        this.ctx.strokeRect(
            topLeft.x - padding,
            topLeft.y - padding,
            bottomRight.x - topLeft.x + padding * 2,
            bottomRight.y - topLeft.y + padding * 2
        );

        this.ctx.shadowBlur = 0;
    }

    drawSnake(snake, particleSystem) {
        if (!snake.isAlive) return;
        if (snake.isInvisible && !snake.isPlayer) return;

        const body = snake.body;
        const skin = snake.skin;
        const head = snake.getHead();

        if (skin && skin.hasTrail && particleSystem) {
            snake.trailTimer = (snake.trailTimer || 0) + 16;
            if (snake.trailTimer > 50) {
                snake.trailTimer = 0;
                const tail = body[body.length - 1];
                const colors = SkinSystem.getParticleColor(skin.particleType);
                particleSystem.emitTrail(tail.x, tail.y, colors[0], 3);
            }
        }

        if (snake.isBoosting && particleSystem && snake.body.length % 2 === 0) {
            const tail = body[body.length - 1];
            const boostColors = ['#ffd93d', '#ff6b6b'];
            particleSystem.emitTrail(tail.x, tail.y, boostColors[Math.floor(Math.random() * boostColors.length)], 4);
        }

        for (let i = body.length - 1; i >= 0; i--) {
            const segment = body[i];
            const screenPos = this.worldToScreen(segment.x, segment.y);

            if (!this.isInView(segment.x, segment.y, 2)) continue;

            let bodyColor, glowColor;

            if (skin) {
                bodyColor = SkinSystem.getBodyColor(skin, i, body.length);
                glowColor = skin.glowColor || bodyColor;
            } else if (snake.customBodyColor) {
                bodyColor = snake.customBodyColor;
                glowColor = bodyColor;
            } else {
                bodyColor = '#00ff88';
                glowColor = '#00ff88';
            }

            if (i === 0) {
                const headColor = skin ? skin.headColor : (snake.customHeadColor || '#00ffff');
                this.ctx.shadowColor = headColor;
                this.ctx.shadowBlur = snake.isBoosting ? 25 : 15;
                this.ctx.fillStyle = headColor;

                if (snake.isInvisible) {
                    this.ctx.globalAlpha = 0.4;
                }
            } else {
                const alpha = 0.5 + (1 - i / body.length) * 0.5;
                this.ctx.shadowBlur = skin && skin.hasGlow ? 8 : 0;
                this.ctx.shadowColor = glowColor;
                this.ctx.fillStyle = bodyColor;
                this.ctx.globalAlpha = snake.isInvisible ? 0.25 : alpha;
            }

            const size = this.gridSize - 2;
            const offset = 1;

            this.ctx.beginPath();
            this.ctx.roundRect(
                screenPos.x + offset,
                screenPos.y + offset,
                size,
                size,
                4
            );
            this.ctx.fill();

            this.ctx.globalAlpha = 1;
        }

        this.ctx.shadowBlur = 0;

        if (!snake.isInvisible || snake.isPlayer) {
            this.drawSnakeEyes(snake);
        }

        if (snake.hasShield && (snake.isPlayer || this.isInView(head.x, head.y, 3))) {
            this.drawShieldEffect(snake);
        }

        if (snake.isPlayer) {
            this.drawPlayerIndicator(head);
        }
    }

    drawShieldEffect(snake) {
        const head = snake.getHead();
        const headScreenPos = this.worldToScreen(head.x, head.y);
        const centerX = headScreenPos.x + this.gridSize / 2;
        const centerY = headScreenPos.y + this.gridSize / 2;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#22c55e';
        this.ctx.shadowBlur = 10;

        const time = Date.now() / 200;
        const shieldRadius = this.gridSize * 0.9 + Math.sin(time) * 2;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, shieldRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, shieldRadius + 3, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawSnakeEyes(snake) {
        const head = snake.getHead();
        const headScreenPos = this.worldToScreen(head.x, head.y);
        const eyeSize = this.gridSize * 0.18;
        const eyeOffset = this.gridSize * 0.25;

        this.ctx.fillStyle = '#000';
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = snake.isInvisible ? 0.5 : 1;

        const centerX = headScreenPos.x + this.gridSize / 2;
        const centerY = headScreenPos.y + this.gridSize / 2;

        let eye1X, eye1Y, eye2X, eye2Y;

        if (snake.direction.x === 1) {
            eye1X = centerX + eyeOffset;
            eye1Y = centerY - eyeOffset;
            eye2X = centerX + eyeOffset;
            eye2Y = centerY + eyeOffset;
        } else if (snake.direction.x === -1) {
            eye1X = centerX - eyeOffset;
            eye1Y = centerY - eyeOffset;
            eye2X = centerX - eyeOffset;
            eye2Y = centerY + eyeOffset;
        } else if (snake.direction.y === 1) {
            eye1X = centerX - eyeOffset;
            eye1Y = centerY + eyeOffset;
            eye2X = centerX + eyeOffset;
            eye2Y = centerY + eyeOffset;
        } else {
            eye1X = centerX - eyeOffset;
            eye1Y = centerY - eyeOffset;
            eye2X = centerX + eyeOffset;
            eye2Y = centerY - eyeOffset;
        }

        this.ctx.beginPath();
        this.ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(eye1X - 1, eye1Y - 1, eyeSize * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(eye2X - 1, eye2Y - 1, eyeSize * 0.4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalAlpha = 1;
    }

    drawPlayerIndicator(head) {
        const screenPos = this.worldToScreen(head.x, head.y);
        const centerX = screenPos.x + this.gridSize / 2;
        const centerY = screenPos.y - 10;

        this.ctx.fillStyle = '#00ff88';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - 8);
        this.ctx.lineTo(centerX - 5, centerY);
        this.ctx.lineTo(centerX + 5, centerY);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawFogOfWar(playerHead) {
        if (!this.fogOfWar) return;

        const screenPos = this.worldToScreen(playerHead.x, playerHead.y);
        const centerX = screenPos.x + this.gridSize / 2;
        const centerY = screenPos.y + this.gridSize / 2;
        const viewRadiusPixels = this.viewRadius * this.gridSize;

        this.ctx.save();

        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, viewRadiusPixels * 0.5,
            centerX, centerY, viewRadiusPixels
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.92)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, viewRadiusPixels, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawStatusEffects(snake, screenY = 80) {
        if (!snake.isAlive) return;

        const effects = [];
        if (snake.isBoosting) effects.push({ icon: '⚡', color: '#ffd93d', text: '加速' });
        if (snake.isSlowed) effects.push({ icon: '🐌', color: '#8b5cf6', text: '减速' });
        if (snake.isInvisible) effects.push({ icon: '👻', color: '#38bdf8', text: '隐身' });
        if (snake.hasShield) effects.push({ icon: '🛡', color: '#22c55e', text: '护盾' });
        if (snake.hasMagnet) effects.push({ icon: '🧲', color: '#ec4899', text: '磁铁' });
        if (snake.isTimeSlowed) effects.push({ icon: '⏱', color: '#06b6d4', text: '时滞' });

        if (effects.length === 0) return;

        const centerX = this.canvas.width / 2;
        const startX = centerX - (effects.length * 35) / 2;

        effects.forEach((effect, i) => {
            const x = startX + i * 35;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.roundRect(x, screenY, 30, 30, 6);
            this.ctx.fill();

            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(effect.icon, x + 15, screenY + 15);
        });
    }
}