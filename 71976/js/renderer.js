class PendulumRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.resize();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.ctx.resetTransform();
        this.ctx.scale(this.dpr, this.dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0e1a');
        gradient.addColorStop(1, '#0f1629');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
        this.ctx.lineWidth = 1;
        const spacing = 40;
        for (let x = 0; x < this.width; x += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawAngleArc(pivotX, pivotY, radius, angle) {
        if (Math.abs(angle) < 0.001) return;
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        this.ctx.lineWidth = 1.5;
        const startAngle = Math.PI / 2;
        const endAngle = Math.PI / 2 - angle;
        if (angle > 0) {
            this.ctx.arc(pivotX, pivotY, radius, endAngle, startAngle);
        } else {
            this.ctx.arc(pivotX, pivotY, radius, startAngle, endAngle);
        }
        this.ctx.stroke();

        const labelAngle = (startAngle + endAngle) / 2;
        const labelR = radius + 18;
        const lx = pivotX + labelR * Math.cos(labelAngle);
        const ly = pivotY - labelR * Math.sin(labelAngle) + 4;
        this.ctx.font = '12px "JetBrains Mono", monospace';
        this.ctx.fillStyle = 'rgba(0, 212, 255, 0.7)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText((angle * 180 / Math.PI).toFixed(1) + '°', lx, ly);
    }

    drawAngleTicks(pivotX, pivotY, radius) {
        for (let deg = -90; deg <= 90; deg += 15) {
            const rad = deg * Math.PI / 180;
            const inner = radius - 5;
            const outer = radius + (deg % 30 === 0 ? 8 : 4);
            const x1 = pivotX + inner * Math.sin(rad);
            const y1 = pivotY + inner * Math.cos(rad);
            const x2 = pivotX + outer * Math.sin(rad);
            const y2 = pivotY + outer * Math.cos(rad);
            this.ctx.beginPath();
            this.ctx.strokeStyle = deg % 30 === 0 ? 'rgba(0, 212, 255, 0.25)' : 'rgba(0, 212, 255, 0.1)';
            this.ctx.lineWidth = deg % 30 === 0 ? 1.5 : 1;
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }

    drawPivot(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        const grad = this.ctx.createRadialGradient(x - 1, y - 1, 0, x, y, 6);
        grad.addColorStop(0, '#4a5568');
        grad.addColorStop(1, '#1a202c');
        this.ctx.fillStyle = grad;
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x - 30, y);
        this.ctx.lineTo(x + 30, y);
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawRope(pivotX, pivotY, bobX, bobY) {
        this.ctx.beginPath();
        this.ctx.moveTo(pivotX, pivotY);
        this.ctx.lineTo(bobX, bobY);
        this.ctx.strokeStyle = 'rgba(200, 220, 255, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        const glow = this.ctx.createLinearGradient(pivotX, pivotY, bobX, bobY);
        glow.addColorStop(0, 'rgba(0, 212, 255, 0)');
        glow.addColorStop(0.5, 'rgba(0, 212, 255, 0.05)');
        glow.addColorStop(1, 'rgba(0, 212, 255, 0)');
        this.ctx.beginPath();
        this.ctx.moveTo(pivotX, pivotY);
        this.ctx.lineTo(bobX, bobY);
        this.ctx.strokeStyle = glow;
        this.ctx.lineWidth = 6;
        this.ctx.stroke();
    }

    drawBob(x, y, radius) {
        const grad = this.ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
        grad.addColorStop(0, '#ff9a5c');
        grad.addColorStop(0.5, '#ff6b35');
        grad.addColorStop(1, '#c44200');
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        const highlight = this.ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.25, 0, x - radius * 0.25, y - radius * 0.25, radius * 0.4);
        highlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = highlight;
        this.ctx.fill();
    }

    drawTrail(trail) {
        for (let i = 0; i < trail.length; i++) {
            const point = trail[i];
            const alpha = Math.max(0, 1 - point.age / 60) * 0.5;
            const size = Math.max(1, 3 * (1 - point.age / 60));
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 107, 53, ${alpha})`;
            this.ctx.fill();
        }
    }

    drawDashedLine(pivotX, pivotY, length) {
        this.ctx.beginPath();
        this.ctx.setLineDash([6, 4]);
        this.ctx.moveTo(pivotX, pivotY);
        this.ctx.lineTo(pivotX, pivotY + length);
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawVelocityVector(bobX, bobY, vx, vy) {
        const scale = 20;
        const endX = bobX + vx * scale;
        const endY = bobY + vy * scale;
        if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001) return;
        this.ctx.beginPath();
        this.ctx.moveTo(bobX, bobY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        const angle = Math.atan2(endY - bobY, endX - bobX);
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - 8 * Math.cos(angle - 0.4), endY - 8 * Math.sin(angle - 0.4));
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - 8 * Math.cos(angle + 0.4), endY - 8 * Math.sin(angle + 0.4));
        this.ctx.stroke();
    }

    render(physics, scale, isDragging) {
        this.clear();
        this.drawGrid();

        const pivotX = this.width / 2;
        const pivotY = this.height * 0.12;
        const bobRadius = Math.max(12, 8 + physics.mass * 4);
        const bobPos = physics.getBobPosition(pivotX, pivotY, scale);

        this.drawDashedLine(pivotX, pivotY, physics.length * scale);
        this.drawAngleTicks(pivotX, pivotY, physics.length * scale * 0.4);
        this.drawAngleArc(pivotX, pivotY, physics.length * scale * 0.4, physics.theta);

        if (physics.isRunning) {
            physics.addTrailPoint(pivotX, pivotY, scale);
        }
        this.drawTrail(physics.trail);

        this.drawRope(pivotX, pivotY, bobPos.x, bobPos.y);
        this.drawPivot(pivotX, pivotY);
        this.drawBob(bobPos.x, bobPos.y, bobRadius);

        if (physics.isRunning) {
            const v = physics.getLinearVelocity();
            const vx = v * Math.cos(physics.theta);
            const vy = -v * Math.sin(physics.theta);
            this.drawVelocityVector(bobPos.x, bobPos.y, vx, vy);
        }

        if (isDragging) {
            this.ctx.beginPath();
            this.ctx.setLineDash([4, 4]);
            this.ctx.moveTo(pivotX, pivotY);
            this.ctx.lineTo(bobPos.x, bobPos.y);
            this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        return { pivotX, pivotY, bobX: bobPos.x, bobY: bobPos.y, bobRadius };
    }
}

window.PendulumRenderer = PendulumRenderer;
