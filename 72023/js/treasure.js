class Treasure {
    constructor(x, y, type, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        switch (type) {
            case 'pearl':
                this.value = 10;
                this.width = 22;
                this.height = 22;
                break;
            case 'coin':
                this.value = 20;
                this.width = 20;
                this.height = 20;
                break;
            case 'rarePearl':
                this.value = 50;
                this.width = 28;
                this.height = 28;
                break;
            case 'oxygenTank':
                this.value = 0;
                this.oxygenAmount = 30;
                this.width = 20;
                this.height = 30;
                break;
        }

        this.collected = false;
        this.bobOffset = Utils.random(0, Math.PI * 2);
        this.bobSpeed = Utils.random(1.5, 2.5);
        this.shimmerPhase = Utils.random(0, Math.PI * 2);
    }

    resize(newCanvasWidth, newCanvasHeight) {
        const widthRatio = newCanvasWidth / this.canvasWidth;
        const heightRatio = newCanvasHeight / this.canvasHeight;

        this.canvasWidth = newCanvasWidth;
        this.canvasHeight = newCanvasHeight;

        this.x = Utils.clamp(this.x * widthRatio, 20, this.canvasWidth - this.width - 20);
        this.y = Utils.clamp(this.y * heightRatio, 60, this.canvasHeight - this.height - 40);
    }

    update(dt, time) {
        this.bobOffset += this.bobSpeed * dt;
        this.shimmerPhase += 3 * dt;
    }

    getDisplayY() {
        return this.y + Math.sin(this.bobOffset) * 5;
    }

    render(ctx, time) {
        if (this.collected) return;
        const dy = this.getDisplayY();

        ctx.save();
        if (this.type === 'pearl') {
            this._renderPearl(ctx, this.x, dy, this.width / 2);
        } else if (this.type === 'rarePearl') {
            this._renderRarePearl(ctx, this.x, dy, this.width / 2);
        } else if (this.type === 'coin') {
            this._renderCoin(ctx, this.x, dy, this.width / 2);
        } else if (this.type === 'oxygenTank') {
            this._renderOxygenTank(ctx, this.x, dy, this.width, this.height);
        }
        ctx.restore();
    }

    _renderPearl(ctx, x, y, r) {
        const shimmer = 0.5 + 0.5 * Math.sin(this.shimmerPhase);
        const cx = x + r;
        const cy = y + r;

        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
        glow.addColorStop(0, `rgba(200, 230, 255, ${0.2 + shimmer * 0.15})`);
        glow.addColorStop(1, 'rgba(200, 230, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#e8f0ff');
        grad.addColorStop(0.8, '#b8ccee');
        grad.addColorStop(1, '#8eaad4');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + shimmer * 0.4})`;
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 4, r * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + shimmer * 0.3})`;
        ctx.beginPath();
        ctx.arc(cx + 2, cy - 2, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderRarePearl(ctx, x, y, r) {
        const shimmer = 0.5 + 0.5 * Math.sin(this.shimmerPhase * 1.5);
        const cx = x + r;
        const cy = y + r;
        const colors = ['#ff6b9d', '#00e5ff', '#ffd93d'];
        const colorIdx = Math.floor(this.shimmerPhase) % colors.length;
        const color = colors[colorIdx];

        const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
        outerGlow.addColorStop(0, `rgba(255, 200, 100, ${0.3 + shimmer * 0.2})`);
        outerGlow.addColorStop(0.5, `rgba(255, 100, 150, ${0.2 + shimmer * 0.1})`);
        outerGlow.addColorStop(1, 'rgba(150, 100, 255, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(cx - 4, cy - 4, 1, cx, cy, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#e8e8ff');
        grad.addColorStop(0.6, '#b8a8ff');
        grad.addColorStop(1, '#9966ff');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 1 + Math.sin(this.shimmerPhase * 3) * 2, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 4; i++) {
            const angle = this.shimmerPhase + (i * Math.PI / 2);
            const len = r * 1.5 + Math.sin(this.shimmerPhase * 2 + i) * 3;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + shimmer * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * (r + 3), cy + Math.sin(angle) * (r + 3));
            ctx.lineTo(cx + Math.cos(angle) * (r + 3 + len * 0.5), cy + Math.sin(angle) * (r + 3 + len * 0.5));
            ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 5, r * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(cx + 3, cy - 3, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderCoin(ctx, x, y, r) {
        const cx = x + r;
        const cy = y + r;
        const scaleX = Math.abs(Math.cos(this.shimmerPhase * 0.5));

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(Math.max(0.2, scaleX), 1);

        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2);
        glow.addColorStop(0, 'rgba(255, 217, 61, 0.3)');
        glow.addColorStop(1, 'rgba(255, 217, 61, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(-3, -3, 1, 0, 0, r);
        grad.addColorStop(0, '#ffe566');
        grad.addColorStop(0.5, '#ffd93d');
        grad.addColorStop(1, '#c4991a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        if (scaleX > 0.4) {
            ctx.fillStyle = '#b8860b';
            ctx.font = `bold ${Math.floor(r * 0.9)}px Fredoka, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 1);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-3, -4, r * 0.25, r * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _renderOxygenTank(ctx, x, y, w, h) {
        const shimmer = 0.5 + 0.5 * Math.sin(this.shimmerPhase * 2);
        const cx = x + w / 2;
        const cy = y + h / 2;

        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 1.2);
        glow.addColorStop(0, `rgba(79, 195, 247, ${0.25 + shimmer * 0.15})`);
        glow.addColorStop(1, 'rgba(79, 195, 247, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(w, h) * 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a237e';
        ctx.beginPath();
        this._roundRect(ctx, x + 2, y + 4, w - 4, h - 8, 4);
        ctx.fill();

        const fillGrad = ctx.createLinearGradient(x, y + 4, x, y + h - 4);
        fillGrad.addColorStop(0, '#4fc3f7');
        fillGrad.addColorStop(0.5, '#29b6f6');
        fillGrad.addColorStop(1, '#0288d1');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        this._roundRect(ctx, x + 3, y + 5, w - 6, h - 10, 3);
        ctx.fill();

        ctx.fillStyle = '#555';
        ctx.fillRect(x + 5, y, w - 10, 6);
        ctx.fillStyle = '#444';
        ctx.fillRect(x + 7, y - 2, w - 14, 3);

        ctx.fillStyle = `rgba(200, 240, 255, ${0.5 + shimmer * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(x + 5, y + 10, 2, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        const bubbleY = y + h - 12 + Math.sin(this.shimmerPhase * 2) * 2;
        ctx.fillStyle = 'rgba(200, 240, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(cx - 2, bubbleY, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, bubbleY + 3, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('O₂', cx, cy);

        ctx.strokeStyle = `rgba(100, 200, 255, ${0.3 + shimmer * 0.3})`;
        ctx.lineWidth = 1;
        this._roundRect(ctx, x + 2, y + 4, w - 4, h - 8, 4);
        ctx.stroke();
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
