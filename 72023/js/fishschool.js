class FishSchool {
    constructor(canvasWidth, canvasHeight, count = 8) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.fish = [];
        this.centerX = canvasWidth / 2;
        this.centerY = canvasHeight / 2;
        this.targetX = canvasWidth / 2;
        this.targetY = canvasHeight / 2;
        this.changeTargetTimer = 0;

        for (let i = 0; i < count; i++) {
            const colors = ['#ffd93d', '#ff6b6b', '#4ecdc4', '#f38181', '#aa96da'];
            this.fish.push({
                x: Utils.random(canvasWidth * 0.2, canvasWidth * 0.8),
                y: Utils.random(canvasHeight * 0.2, canvasHeight * 0.7),
                vx: Utils.random(-0.5, 0.5),
                vy: Utils.random(-0.3, 0.3),
                size: Utils.random(3, 6),
                color: colors[Utils.randomInt(0, colors.length - 1)],
                phase: Utils.random(0, Math.PI * 2)
            });
        }
    }

    update(dt) {
        this.changeTargetTimer -= dt;
        if (this.changeTargetTimer <= 0) {
            this.targetX = Utils.random(this.canvasWidth * 0.15, this.canvasWidth * 0.85);
            this.targetY = Utils.random(this.canvasHeight * 0.15, this.canvasHeight * 0.7);
            this.changeTargetTimer = Utils.random(3, 6);
        }

        this.centerX += (this.targetX - this.centerX) * 0.003;
        this.centerY += (this.targetY - this.centerY) * 0.003;

        for (const f of this.fish) {
            f.phase += dt * 5;

            const dx = this.centerX - f.x;
            const dy = this.centerY - f.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                f.vx += (dx / dist) * 0.02;
                f.vy += (dy / dist) * 0.02;
            }

            for (const other of this.fish) {
                if (other === f) continue;
                const odx = f.x - other.x;
                const ody = f.y - other.y;
                const odist = Math.sqrt(odx * odx + ody * ody);
                if (odist > 0 && odist < 30) {
                    f.vx += (odx / odist) * 0.01;
                    f.vy += (ody / odist) * 0.01;
                }
            }

            const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
            if (speed > 1.5) {
                f.vx = (f.vx / speed) * 1.5;
                f.vy = (f.vy / speed) * 1.5;
            }

            f.vx *= 0.98;
            f.vy *= 0.98;

            f.x += f.vx * dt * 60;
            f.y += f.vy * dt * 60;

            f.x = Utils.clamp(f.x, 20, this.canvasWidth - 20);
            f.y = Utils.clamp(f.y, 40, this.canvasHeight - 80);
        }
    }

    render(ctx) {
        for (const f of this.fish) {
            ctx.save();
            ctx.translate(f.x, f.y);

            const angle = Math.atan2(f.vy, f.vx);
            ctx.rotate(angle);

            const wiggle = Math.sin(f.phase) * 0.2;

            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, f.size * 1.5, f.size * 0.8, wiggle, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.moveTo(-f.size * 1.2, 0);
            ctx.lineTo(-f.size * 2, -f.size * 0.6 + wiggle * 2);
            ctx.lineTo(-f.size * 2, f.size * 0.6 + wiggle * 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(f.size * 0.8, -f.size * 0.2, f.size * 0.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}
