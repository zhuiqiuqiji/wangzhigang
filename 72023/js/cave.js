class HiddenCave {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.width = 80;
        this.height = 100;
        this.x = Utils.random(canvasWidth * 0.6, canvasWidth - this.width - 30);
        this.y = Utils.random(canvasHeight * 0.3, canvasHeight - this.height - 80);
        this.discovered = false;
        this.entered = false;
        this.glowPhase = 0;
        this.treasures = [];
        this.enemies = [];
    }

    generateContent(levelNumber) {
        this.treasures = [];
        this.enemies = [];

        const rareCount = Utils.randomInt(1, 3);
        for (let i = 0; i < rareCount; i++) {
            this.treasures.push(new Treasure(
                Utils.random(60, this.canvasWidth - 60),
                Utils.random(80, this.canvasHeight - 100),
                'rarePearl',
                this.canvasWidth,
                this.canvasHeight
            ));
        }

        const coinCount = Utils.randomInt(2, 5);
        for (let i = 0; i < coinCount; i++) {
            this.treasures.push(new Treasure(
                Utils.random(60, this.canvasWidth - 60),
                Utils.random(80, this.canvasHeight - 100),
                'coin',
                this.canvasWidth,
                this.canvasHeight
            ));
        }

        if (levelNumber >= 2) {
            const enemyCount = Utils.randomInt(1, Math.min(levelNumber - 1, 3));
            for (let i = 0; i < enemyCount; i++) {
                const types = ['jellyfish', 'octopus'];
                const aiTypes = ['ambush', 'patrol'];
                this.enemies.push(new Enemy(
                    Utils.random(60, this.canvasWidth - 60),
                    Utils.random(80, this.canvasHeight - 100),
                    types[Utils.randomInt(0, types.length - 1)],
                    aiTypes[Utils.randomInt(0, aiTypes.length - 1)],
                    this.canvasWidth,
                    this.canvasHeight
                ));
            }
        }
    }

    update(dt) {
        this.glowPhase += dt * 2;
    }

    getEntranceHitbox() {
        return {
            x: this.x + this.width * 0.25,
            y: this.y + this.height * 0.3,
            width: this.width * 0.5,
            height: this.height * 0.6
        };
    }

    render(ctx) {
        if (!this.discovered && !this.entered) return;

        ctx.save();

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        const glow = 0.5 + Math.sin(this.glowPhase) * 0.3;
        const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, this.width * 0.8);
        glowGrad.addColorStop(0, `rgba(150, 100, 255, ${0.3 + glow * 0.3})`);
        glowGrad.addColorStop(1, 'rgba(100, 50, 200, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, this.width * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2a1a3a';
        ctx.beginPath();
        ctx.arc(cx, cy + 10, this.width * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3d2e5a';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.3);
        ctx.quadraticCurveTo(this.x + this.width * 0.3, this.y + this.height * 0.1, this.x + this.width * 0.5, this.y);
        ctx.quadraticCurveTo(this.x + this.width * 0.7, this.y + this.height * 0.1, this.x + this.width * 0.8, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4a3a6a';
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.25, this.y + this.height * 0.4);
        ctx.quadraticCurveTo(this.x + this.width * 0.35, this.y + this.height * 0.2, this.x + this.width * 0.5, this.y + 5);
        ctx.quadraticCurveTo(this.x + this.width * 0.65, this.y + this.height * 0.2, this.x + this.width * 0.75, this.y + this.height * 0.4);
        ctx.lineTo(this.x + this.width - 5, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#5a4a7a';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.5);
        ctx.quadraticCurveTo(this.x + this.width * 0.4, this.y + this.height * 0.35, this.x + this.width * 0.5, this.y + 10);
        ctx.quadraticCurveTo(this.x + this.width * 0.6, this.y + this.height * 0.35, this.x + this.width * 0.7, this.y + this.height * 0.5);
        ctx.lineTo(this.x + this.width - 10, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        const innerGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, this.width * 0.35);
        innerGlow.addColorStop(0, `rgba(180, 130, 255, ${0.4 + glow * 0.3})`);
        innerGlow.addColorStop(1, 'rgba(50, 30, 80, 0.9)');
        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, this.width * 0.3, this.height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.discovered && !this.entered) {
            const pulse = 0.5 + Math.sin(this.glowPhase * 1.5) * 0.5;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Nunito, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('按 E 进入隐藏洞穴', cx, this.y - 10);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    renderInterior(ctx, time) {
        const grad = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        grad.addColorStop(0, '#1a0a2e');
        grad.addColorStop(0.5, '#2c1654');
        grad.addColorStop(1, '#1a0a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        for (let i = 0; i < 15; i++) {
            const gx = (i * 97) % this.canvasWidth;
            const gy = (i * 61) % this.canvasHeight;
            const glow = 0.5 + Math.sin(time * 2 + i) * 0.5;
            const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, 25);
            g.addColorStop(0, `rgba(${100 + i * 10 % 100}, ${50 + i * 15 % 150}, 255, ${0.3 + glow * 0.3})`);
            g.addColorStop(1, 'rgba(100, 50, 200, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(gx, gy, 25, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#3a2a5a';
        for (let i = 0; i < 8; i++) {
            const sx = (i * 127 + 50) % this.canvasWidth;
            const sh = 30 + (i * 13) % 60;
            ctx.beginPath();
            ctx.moveTo(sx - 8, this.canvasHeight);
            ctx.lineTo(sx, this.canvasHeight - sh);
            ctx.lineTo(sx + 8, this.canvasHeight);
            ctx.closePath();
            ctx.fill();
        }

        for (let i = 0; i < 8; i++) {
            const sx = (i * 137 + 80) % this.canvasWidth;
            const sh = 20 + (i * 17) % 50;
            ctx.beginPath();
            ctx.moveTo(sx - 6, 0);
            ctx.lineTo(sx, sh);
            ctx.lineTo(sx + 6, 0);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(100, 80, 150, 0.5)';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(
                Utils.random(30, this.canvasWidth - 30),
                Utils.random(50, this.canvasHeight - 50),
                Utils.random(1, 3),
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        const pulse = 0.5 + Math.sin(time * 1.5) * 0.5;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('按 E 返回主场景', this.canvasWidth / 2, this.canvasHeight - 30);
        ctx.globalAlpha = 1;
    }
}
