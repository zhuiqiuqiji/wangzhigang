class Player {
    constructor(x, y, canvasWidth, canvasHeight, characterId = 'spongebob', playerId = 'P1') {
        this.id = playerId;
        this.x = x;
        this.y = y;
        this.width = 36;
        this.height = 44;
        this.baseSpeed = 3.5;
        this.speed = this.baseSpeed;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.vx = 0;
        this.vy = 0;

        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 2;

        this.facing = 1;
        this.swimPhase = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;

        this.characterId = characterId;
        this.character = Character.getCharacterById(characterId);
        this.healthModifier = this.character.modifiers.health;
        this.oxygenModifier = this.character.modifiers.oxygen;
        this.scoreModifier = this.character.modifiers.score;
        this.speedModifier = this.character.modifiers.speed;
        this.color = this.character.color;

        this.alive = true;
    }

    handleInput(keys) {
        this.vx = 0;
        this.vy = 0;

        if (this.id === 'P1') {
            if (keys['KeyA']) {
                this.vx = -1;
                this.facing = -1;
            }
            if (keys['KeyD']) {
                this.vx = 1;
                this.facing = 1;
            }
            if (keys['KeyW']) {
                this.vy = -1;
            }
            if (keys['KeyS']) {
                this.vy = 1;
            }
        } else {
            if (keys['ArrowLeft']) {
                this.vx = -1;
                this.facing = -1;
            }
            if (keys['ArrowRight']) {
                this.vx = 1;
                this.facing = 1;
            }
            if (keys['ArrowUp']) {
                this.vy = -1;
            }
            if (keys['ArrowDown']) {
                this.vy = 1;
            }
        }

        if (this.vx !== 0 && this.vy !== 0) {
            const norm = 1 / Math.sqrt(2);
            this.vx *= norm;
            this.vy *= norm;
        }
    }

    update(dt) {
        const actualSpeed = this.baseSpeed * this.speedModifier;
        this.x += this.vx * actualSpeed * dt * 60;
        this.y += this.vy * actualSpeed * dt * 60;

        this.x = Utils.clamp(this.x, 5, this.canvasWidth - this.width - 5);
        this.y = Utils.clamp(this.y, 5, this.canvasHeight - this.height - 5);

        if (this.vx !== 0 || this.vy !== 0) {
            this.swimPhase += dt * 8;
        } else {
            this.swimPhase += dt * 2;
        }

        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            if (this.isBlinking) {
                this.isBlinking = false;
                this.blinkTimer = Utils.random(2, 5);
            } else {
                this.isBlinking = true;
                this.blinkTimer = 0.15;
            }
        }
    }

    takeDamage() {
        if (this.invincible || !this.alive) return false;
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        return true;
    }

    render(ctx) {
        if (!this.alive) return;
        if (this.invincible && Math.sin(this.invincibleTimer * 15) > 0) return;

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const swimBob = Math.sin(this.swimPhase) * 2;

        ctx.save();
        ctx.translate(cx, cy + swimBob);
        if (this.facing < 0) ctx.scale(-1, 1);

        this.character.render(ctx, 0, 0, 1.2);

        ctx.restore();

        ctx.save();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.font = 'bold 10px Nunito, sans-serif';
        ctx.textAlign = 'center';
        const labelX = this.x + this.width / 2;
        const labelY = this.y - 8;
        ctx.strokeText(this.id, labelX, labelY);
        ctx.fillText(this.id, labelX, labelY);
        ctx.restore();
    }
}
