class Enemy {
    constructor(x, y, type, aiType, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.aiType = aiType;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        switch (type) {
            case 'jellyfish':
                this.width = 30;
                this.height = 40;
                this.speed = Utils.random(0.6, 1.2);
                this.patrolMin = Utils.random(50, canvasHeight * 0.3);
                this.patrolMax = Utils.random(canvasHeight * 0.5, canvasHeight - 80);
                this.direction = 1;
                this.tentaclePhase = Utils.random(0, Math.PI * 2);
                break;
            case 'shark':
                this.width = 55;
                this.height = 28;
                this.speed = Utils.random(1.8, 3.0);
                this.direction = Math.random() > 0.5 ? 1 : -1;
                this.patrolY = y;
                this.wobblePhase = Utils.random(0, Math.PI * 2);
                break;
            case 'octopus':
                this.width = 35;
                this.height = 40;
                this.speed = Utils.random(0.4, 0.9);
                this.targetX = x;
                this.targetY = y;
                this.changeTimer = Utils.random(1, 3);
                this.tentaclePhase = Utils.random(0, Math.PI * 2);
                break;
        }

        this.chaseRange = 200;
        this.ambushState = 'hidden';
        this.ambushTimer = Utils.random(2, 5);
        this.ambushAlertRange = 150;
        this.ambushAttackRange = 80;

        this.animPhase = Utils.random(0, Math.PI * 2);
        this.active = true;
    }

    resize(newCanvasWidth, newCanvasHeight) {
        const widthRatio = newCanvasWidth / this.canvasWidth;
        const heightRatio = newCanvasHeight / this.canvasHeight;

        this.canvasWidth = newCanvasWidth;
        this.canvasHeight = newCanvasHeight;

        this.x = Utils.clamp(this.x * widthRatio, 10, this.canvasWidth - this.width - 10);
        this.y = Utils.clamp(this.y * heightRatio, 40, this.canvasHeight - this.height - 30);

        if (this.type === 'jellyfish') {
            this.patrolMin = Utils.clamp(this.patrolMin * heightRatio, 50, this.canvasHeight * 0.4);
            this.patrolMax = Utils.clamp(this.patrolMax * heightRatio, this.canvasHeight * 0.4, this.canvasHeight - 80);
        } else if (this.type === 'shark') {
            this.patrolY = Utils.clamp(this.patrolY * heightRatio, 60, this.canvasHeight - 60);
        }
    }

    update(dt, players) {
        this.animPhase += dt * 3;

        if (this.aiType === 'chase' || this.aiType === 'ambush') {
            const nearestPlayer = this._findNearestPlayer(players);
            if (nearestPlayer) {
                if (this.aiType === 'chase') {
                    this._updateChase(dt, nearestPlayer);
                } else {
                    this._updateAmbush(dt, nearestPlayer);
                }
            } else {
                this._updatePatrol(dt);
            }
        } else {
            this._updatePatrol(dt);
        }

        this.x = Utils.clamp(this.x, 10, this.canvasWidth - this.width - 10);
        this.y = Utils.clamp(this.y, 40, this.canvasHeight - this.height - 30);
    }

    _findNearestPlayer(players) {
        let nearest = null;
        let minDist = Infinity;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        for (const p of players) {
            if (!p.alive) continue;
            const dx = (p.x + p.width / 2) - cx;
            const dy = (p.y + p.height / 2) - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = { player: p, dist, dx, dy };
            }
        }
        return nearest;
    }

    _updatePatrol(dt) {
        switch (this.type) {
            case 'jellyfish':
                this.tentaclePhase += dt * 4;
                this.y += this.direction * this.speed * dt * 60;
                if (this.y <= this.patrolMin) {
                    this.direction = 1;
                } else if (this.y >= this.patrolMax) {
                    this.direction = -1;
                }
                this.x += Math.sin(this.animPhase) * 0.5 * dt * 60;
                break;
            case 'shark':
                this.wobblePhase += dt * 2;
                this.x += this.direction * this.speed * dt * 60;
                this.y = this.patrolY + Math.sin(this.wobblePhase) * 15;
                if (this.x > this.canvasWidth + this.width) {
                    this.x = -this.width;
                } else if (this.x < -this.width) {
                    this.x = this.canvasWidth + this.width;
                }
                break;
            case 'octopus':
                this.tentaclePhase += dt * 3;
                this.changeTimer -= dt;
                if (this.changeTimer <= 0) {
                    this.targetX = Utils.random(30, this.canvasWidth - 60);
                    this.targetY = Utils.random(60, this.canvasHeight - 80);
                    this.changeTimer = Utils.random(2, 4);
                }
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2) {
                    this.x += (dx / dist) * this.speed * dt * 60;
                    this.y += (dy / dist) * this.speed * dt * 60;
                }
                break;
        }
    }

    _updateChase(dt, nearest) {
        const { dist, dx, dy } = nearest;
        const chaseSpeed = this.speed * 1.5;

        if (dist < this.chaseRange && dist > 5) {
            this.x += (dx / dist) * chaseSpeed * dt * 60;
            this.y += (dy / dist) * chaseSpeed * dt * 60;
            this.direction = dx > 0 ? 1 : -1;
        } else {
            this._updatePatrol(dt);
        }

        if (this.type === 'jellyfish') {
            this.tentaclePhase += dt * 6;
        } else if (this.type === 'octopus') {
            this.tentaclePhase += dt * 5;
        } else if (this.type === 'shark') {
            this.wobblePhase += dt * 3;
        }
    }

    _updateAmbush(dt, nearest) {
        const { dist } = nearest;

        switch (this.ambushState) {
            case 'hidden':
                if (dist < this.ambushAlertRange) {
                    this.ambushState = 'alert';
                    this.ambushTimer = Utils.random(0.5, 1.5);
                }
                if (this.type === 'jellyfish') this.tentaclePhase += dt * 1;
                if (this.type === 'octopus') this.tentaclePhase += dt * 1;
                break;

            case 'alert':
                this.ambushTimer -= dt;
                if (this.ambushTimer <= 0) {
                    if (dist < this.ambushAttackRange) {
                        this.ambushState = 'attack';
                        this.ambushTimer = Utils.random(1, 2);
                    } else {
                        this.ambushState = 'hidden';
                    }
                }
                if (this.type === 'jellyfish') this.tentaclePhase += dt * 6;
                if (this.type === 'octopus') this.tentaclePhase += dt * 6;
                break;

            case 'attack':
                const { dx, dy } = nearest;
                const attackSpeed = this.speed * 3;
                if (dist > 5) {
                    this.x += (dx / dist) * attackSpeed * dt * 60;
                    this.y += (dy / dist) * attackSpeed * dt * 60;
                    this.direction = dx > 0 ? 1 : -1;
                }
                this.ambushTimer -= dt;
                if (this.ambushTimer <= 0) {
                    this.ambushState = 'hidden';
                    this.ambushTimer = Utils.random(3, 6);
                }
                if (this.type === 'jellyfish') this.tentaclePhase += dt * 8;
                if (this.type === 'octopus') this.tentaclePhase += dt * 8;
                break;
        }
    }

    render(ctx) {
        if (!this.active) return;

        if (this.aiType === 'ambush' && this.ambushState === 'hidden') {
            ctx.save();
            ctx.globalAlpha = 0.25;
            this._renderByType(ctx);
            ctx.restore();
        } else if (this.aiType === 'ambush' && this.ambushState === 'alert') {
            ctx.save();
            const pulse = 0.5 + Math.sin(this.animPhase * 10) * 0.3;
            ctx.globalAlpha = 0.5 + pulse * 0.3;
            this._renderByType(ctx);
            ctx.restore();
        } else {
            this._renderByType(ctx);
        }
    }

    _renderByType(ctx) {
        ctx.save();
        switch (this.type) {
            case 'jellyfish':
                this._renderJellyfish(ctx);
                break;
            case 'shark':
                this._renderShark(ctx);
                break;
            case 'octopus':
                this._renderOctopus(ctx);
                break;
        }
        ctx.restore();
    }

    _renderJellyfish(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height * 0.35;

        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, this.width / 2);
        grad.addColorStop(0, 'rgba(255, 150, 200, 0.9)');
        grad.addColorStop(0.6, 'rgba(255, 100, 170, 0.6)');
        grad.addColorStop(1, 'rgba(200, 80, 150, 0.3)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width / 2, this.height * 0.35, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 180, 220, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width / 2 + 3, this.height * 0.35 + 3, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#2a1a3a';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 5, cy - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 4.5, cy - 4, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 5.5, cy - 4, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 130, 190, 0.5)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            const tx = cx - 9 + i * 6;
            const wave = Math.sin(this.tentaclePhase + i * 0.8) * 5;
            ctx.beginPath();
            ctx.moveTo(tx, cy + 3);
            ctx.quadraticCurveTo(tx + wave, cy + 15, tx - wave * 0.5, cy + this.height * 0.65);
            ctx.stroke();
        }
    }

    _renderShark(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const facing = this.direction;

        ctx.save();
        ctx.translate(cx, cy);
        if (facing < 0) ctx.scale(-1, 1);

        ctx.fillStyle = '#6b7b8d';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8899aa';
        ctx.beginPath();
        ctx.ellipse(0, 3, this.width / 2 - 4, this.height / 2 - 6, 0, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#4a5a6a';
        ctx.beginPath();
        ctx.moveTo(-5, -this.height / 2);
        ctx.lineTo(0, -this.height / 2 - 12);
        ctx.lineTo(5, -this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#5a6a7a';
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 15, 5);
        ctx.lineTo(this.width / 2 - 5, -5);
        ctx.lineTo(this.width / 2 - 5, 15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(this.width / 2 - 10, -3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.width / 2 - 9, -4, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#4a5a6a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 5, -8);
        ctx.lineTo(this.width / 2 - 15, -8);
        ctx.stroke();

        ctx.restore();
    }

    _renderOctopus(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height * 0.25;

        ctx.strokeStyle = 'rgba(150, 60, 100, 0.6)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 0.8 + Math.PI * 0.1;
            const wave = Math.sin(this.tentaclePhase + i * 0.6) * 6;
            const baseX = cx - 12 + i * 5;
            const baseY = cy + 10;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.quadraticCurveTo(
                baseX + wave,
                baseY + 15,
                baseX - wave * 0.5,
                baseY + this.height * 0.6
            );
            ctx.stroke();
        }

        const headGrad = ctx.createRadialGradient(cx, cy - 5, 2, cx, cy, this.width * 0.5);
        headGrad.addColorStop(0, '#d4578a');
        headGrad.addColorStop(0.7, '#a8326a');
        headGrad.addColorStop(1, '#7a1d4a');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width * 0.5, this.height * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy - 3, 3.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 6, cy - 3, 3.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 7, cy - 5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        const blink = Math.sin(this.animPhase * 2) > 0.95;
        if (!blink) {
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.ellipse(cx - 6, cy + 3, 1.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + 6, cy + 3, 1.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
