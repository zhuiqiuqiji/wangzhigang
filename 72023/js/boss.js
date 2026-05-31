class Boss {
    constructor(type, canvasWidth, canvasHeight) {
        this.type = type;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.width = 80;
        this.height = 80;
        this.x = canvasWidth - 120;
        this.y = canvasHeight / 2 - this.height / 2;
        this.vx = 0;
        this.vy = 0;
        this.animPhase = 0;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.attackPattern = 0;
        this.isAttacking = false;
        this.enraged = false;
        this.active = true;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.damageFlash = 0;

        this._setupByType();
    }

    _setupByType() {
        switch (this.type) {
            case 'giantJellyfish':
                this.name = '巨型水母';
                this.maxHealth = 100;
                this.health = this.maxHealth;
                this.width = 70;
                this.height = 90;
                this.color = '#ff6b9d';
                this.damage = 1;
                this.attackInterval = 3;
                break;
            case 'kraken':
                this.name = '北海巨妖';
                this.maxHealth = 150;
                this.health = this.maxHealth;
                this.width = 100;
                this.height = 90;
                this.color = '#8b4513';
                this.damage = 1;
                this.attackInterval = 2.5;
                break;
            case 'anglerfish':
                this.name = '深海琵琶鱼';
                this.maxHealth = 120;
                this.health = this.maxHealth;
                this.width = 80;
                this.height = 60;
                this.color = '#2c3e50';
                this.damage = 1;
                this.attackInterval = 2;
                break;
            case 'lavacrab':
                this.name = '熔岩巨蟹';
                this.maxHealth = 180;
                this.health = this.maxHealth;
                this.width = 100;
                this.height = 70;
                this.color = '#ff5722';
                this.damage = 1;
                this.attackInterval = 2.8;
                break;
        }
    }

    takeDamage(amount) {
        if (this.invincible) return false;
        this.health -= amount;
        this.damageFlash = 0.15;
        if (this.health <= this.maxHealth * 0.3) {
            this.enraged = true;
        }
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
            return true;
        }
        this.invincible = true;
        this.invincibleTimer = 0.5;
        return false;
    }

    update(dt, players) {
        this.animPhase += dt * 3;
        this.damageFlash = Math.max(0, this.damageFlash - dt);

        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        if (!this.active) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        } else {
            this.attackTimer += dt;
            if (this.attackTimer >= this.attackInterval) {
                this.attackTimer = 0;
                this.attackPattern = (this.attackPattern + 1) % 3;
                this._startAttack(players);
            }
        }

        this._updateMovement(dt, players);
    }

    _startAttack(players) {
        this.isAttacking = true;
        this.attackCooldown = this.enraged ? 1.5 : 2;

        if (this.type === 'giantJellyfish') {
            this.vy = (Math.random() > 0.5 ? 1 : -1) * 3;
        } else if (this.type === 'kraken') {
            const target = players[Math.floor(Math.random() * players.length)];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.vx = (dx / dist) * 4;
                this.vy = (dy / dist) * 4;
            }
        } else if (this.type === 'anglerfish') {
            this.vx = -6;
        } else if (this.type === 'lavacrab') {
            this.vy = -5;
        }

        setTimeout(() => {
            this.isAttacking = false;
        }, 500);
    }

    _updateMovement(dt, players) {
        if (this.enraged && !this.isAttacking) {
            const target = players[0];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 100) {
                this.vx += (dx / dist) * 0.2;
                this.vy += (dy / dist) * 0.2;
            }
        }

        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;

        this.vx *= 0.96;
        this.vy *= 0.96;

        this.x = Utils.clamp(this.x, this.canvasWidth * 0.5, this.canvasWidth - this.width - 10);
        this.y = Utils.clamp(this.y, 50, this.canvasHeight - this.height - 30);
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        switch (this.type) {
            case 'giantJellyfish':
                this._renderGiantJellyfish(ctx, cx, cy);
                break;
            case 'kraken':
                this._renderKraken(ctx, cx, cy);
                break;
            case 'anglerfish':
                this._renderAnglerfish(ctx, cx, cy);
                break;
            case 'lavacrab':
                this._renderLavacrab(ctx, cx, cy);
                break;
        }

        if (this.damageFlash > 0) {
            ctx.globalAlpha = Math.min(1, this.damageFlash * 6);
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(cx, cy, this.width / 2 + 5, this.height / 2 + 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }

        if (this.enraged) {
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(this.width, this.height) * 0.7 + Math.sin(this.animPhase * 5) * 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    _renderGiantJellyfish(ctx, cx, cy) {
        const r = this.width / 2;
        const grad = ctx.createRadialGradient(cx, cy - 10, 5, cx, cy - 10, r + 10);
        grad.addColorStop(0, 'rgba(255, 150, 200, 0.9)');
        grad.addColorStop(0.6, 'rgba(255, 107, 157, 0.6)');
        grad.addColorStop(1, 'rgba(200, 80, 130, 0.3)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 10, r, r * 0.6, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 180, 220, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 10, r + 5, r * 0.6 + 5, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#2a1a3a';
        ctx.beginPath();
        ctx.arc(cx - 12, cy - 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 12, cy - 12, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 130, 190, 0.6)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
            const tx = cx - 25 + i * 10;
            const wave = Math.sin(this.animPhase + i * 0.6) * 12;
            ctx.beginPath();
            ctx.moveTo(tx, cy + 5);
            ctx.quadraticCurveTo(tx + wave, cy + 30, tx - wave * 0.5, cy + this.height * 0.7);
            ctx.stroke();
        }
    }

    _renderKraken(ctx, cx, cy) {
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 0.8 + Math.PI * 0.1;
            const wave = Math.sin(this.animPhase + i * 0.6) * 15;
            const baseX = cx - 30 + i * 12;
            const baseY = cy + 10;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.quadraticCurveTo(
                baseX + Math.cos(angle) * 20 + wave,
                baseY + 25,
                baseX + Math.cos(angle) * 40 - wave * 0.5,
                baseY + 50
            );
            ctx.stroke();
        }

        const headGrad = ctx.createRadialGradient(cx - 10, cy - 15, 5, cx, cy, this.width * 0.45);
        headGrad.addColorStop(0, '#a0522d');
        headGrad.addColorStop(0.7, '#8b4513');
        headGrad.addColorStop(1, '#5d2e0c');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 10, this.width * 0.45, this.height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(cx - 10, cy - 12, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 10, cy - 12, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.enraged) {
            ctx.fillStyle = '#ff3333';
        } else {
            ctx.fillStyle = '#ffaa00';
        }
        ctx.beginPath();
        ctx.arc(cx - 10, cy - 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 10, cy - 12, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderAnglerfish(ctx, cx, cy) {
        const facing = -1;
        ctx.save();
        ctx.translate(cx, cy);
        if (facing < 0) ctx.scale(-1, 1);

        const bodyGrad = ctx.createRadialGradient(-10, -5, 5, 0, 0, this.width * 0.5);
        bodyGrad.addColorStop(0, '#3d4f5f');
        bodyGrad.addColorStop(0.7, '#2c3e50');
        bodyGrad.addColorStop(1, '#1a252f');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width * 0.45, this.height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.moveTo(this.width * 0.3, -5);
        ctx.lineTo(this.width * 0.5, -12);
        ctx.lineTo(this.width * 0.5, 5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#1a252f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, -this.height * 0.45);
        ctx.quadraticCurveTo(-15, -this.height * 0.6, -20, -this.height * 0.7);
        ctx.stroke();

        const lureGlow = 0.5 + Math.sin(this.animPhase * 4) * 0.5;
        const lureGrad = ctx.createRadialGradient(-20, -this.height * 0.7, 0, -20, -this.height * 0.7, 15);
        lureGrad.addColorStop(0, `rgba(255, ${200 + lureGlow * 55}, 50, 1)`);
        lureGrad.addColorStop(0.5, 'rgba(255, 150, 50, 0.7)');
        lureGrad.addColorStop(1, 'rgba(255, 100, 50, 0)');
        ctx.fillStyle = lureGrad;
        ctx.beginPath();
        ctx.arc(-20, -this.height * 0.7, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffdd33';
        ctx.beginPath();
        ctx.arc(-20, -this.height * 0.7, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-15, -3, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-15, -2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(5, 5 + i * 3);
            ctx.lineTo(12, 3 + i * 3);
            ctx.lineTo(8, 8 + i * 3);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    _renderLavacrab(ctx, cx, cy) {
        const bodyGrad = ctx.createRadialGradient(cx, cy - 5, 5, cx, cy, this.width * 0.45);
        bodyGrad.addColorStop(0, '#ff7733');
        bodyGrad.addColorStop(0.7, '#ff5722');
        bodyGrad.addColorStop(1, '#d32f2f');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width * 0.45, this.height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        const crackGlow = 0.3 + Math.sin(this.animPhase * 2) * 0.3;
        ctx.strokeStyle = `rgba(255, 200, 50, ${0.5 + crackGlow * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy - 10);
        ctx.lineTo(cx - 5, cy);
        ctx.lineTo(cx - 10, cy + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy - 15);
        ctx.lineTo(cx + 15, cy - 5);
        ctx.stroke();

        ctx.fillStyle = '#ff4411';
        ctx.beginPath();
        ctx.ellipse(cx - this.width * 0.4, cy - 10, 15, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + this.width * 0.4, cy - 10, 15, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx - this.width * 0.4, cy - 10, 15, 10, -0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx + this.width * 0.4, cy - 10, 15, 10, 0.3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(cx - 25 + i * 12, cy + this.height * 0.3);
            ctx.lineTo(cx - 30 + i * 12, cy + this.height * 0.5 + Math.sin(this.animPhase + i) * 3);
            ctx.stroke();
        }

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(cx - 8, cy - 15, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 8, cy - 15, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.enraged) {
            ctx.fillStyle = '#ffff00';
        } else {
            ctx.fillStyle = '#ffaa00';
        }
        ctx.beginPath();
        ctx.arc(cx - 8, cy - 15, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 8, cy - 15, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderHealthBar(ctx, canvasWidth) {
        if (!this.active) return;

        const barWidth = 300;
        const barHeight = 18;
        const x = (canvasWidth - barWidth) / 2;
        const y = 50;

        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this._roundRect(ctx, x - 4, y - 4, barWidth + 8, barHeight + 8, 10);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this._roundRect(ctx, x, y, barWidth, barHeight, 7);
        ctx.fill();

        const percentage = this.health / this.maxHealth;
        const fillWidth = barWidth * percentage;

        let color1, color2;
        if (this.enraged) {
            color1 = '#ff6b6b';
            color2 = '#c0392b';
        } else if (percentage > 0.5) {
            color1 = '#2ecc71';
            color2 = '#27ae60';
        } else if (percentage > 0.25) {
            color1 = '#f39c12';
            color2 = '#e67e22';
        } else {
            color1 = '#e74c3c';
            color2 = '#c0392b';
        }

        const grad = ctx.createLinearGradient(x, y, x + fillWidth, y);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        this._roundRect(ctx, x, y, Math.max(fillWidth, barHeight), barHeight, 7);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.name}  ${Math.ceil(this.health)}/${this.maxHealth}`, x + barWidth / 2, y + barHeight / 2 + 1);

        if (this.enraged) {
            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 12px Nunito, sans-serif';
            ctx.fillText('狂暴状态', x + barWidth / 2, y - 10);
        }

        ctx.restore();
    }

    getHitbox() {
        return {
            x: this.x + 10,
            y: this.y + 10,
            width: this.width - 20,
            height: this.height - 20
        };
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
}
