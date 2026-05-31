class OxygenSystem {
    constructor(max = 100, drainRate = 0.8) {
        this.current = max;
        this.max = max;
        this.drainRate = drainRate;
        this.lowThreshold = 20;
        this.pulsePhase = 0;
    }

    update(dt, oxygenModifier = 1.0) {
        this.current -= this.drainRate * dt * oxygenModifier;
        this.current = Utils.clamp(this.current, 0, this.max);
        this.pulsePhase += dt * 4;
    }

    replenish(amount) {
        this.current = Math.min(this.current + amount, this.max);
    }

    isLow() {
        return this.current <= this.lowThreshold;
    }

    isEmpty() {
        return this.current <= 0;
    }

    getPercentage() {
        return this.current / this.max;
    }

    render(ctx, x, y, width, height) {
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this._roundRect(ctx, x - 3, y - 3, width + 6, height + 6, 8);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this._roundRect(ctx, x, y, width, height, 6);
        ctx.fill();

        const fillHeight = height * this.getPercentage();

        let color1, color2;
        if (this.isLow()) {
            const pulse = 0.5 + Math.sin(this.pulsePhase) * 0.5;
            color1 = `rgba(255, ${80 + pulse * 40}, 80, 1)`;
            color2 = `rgba(200, ${30 + pulse * 30}, 30, 1)`;
        } else {
            color1 = '#4fc3f7';
            color2 = '#0288d1';
        }

        const grad = ctx.createLinearGradient(x, y + height - fillHeight, x, y + height);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        this._roundRect(ctx, x, y + height - fillHeight, width, fillHeight, 6);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(x + 2, y + height - fillHeight + 2, width / 3, Math.max(2, fillHeight - 4));

        const bubbleY = y + height - fillHeight + 10;
        for (let i = 0; i < 3; i++) {
            const bx = x + 6 + i * (width / 3);
            const by = bubbleY + Math.sin(this.pulsePhase * 0.5 + i) * 4;
            if (by < y + height - 5) {
                ctx.fillStyle = 'rgba(200, 240, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(bx, by, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.strokeStyle = this.isLow() ? 'rgba(255, 100, 100, 0.5)' : 'rgba(0, 229, 255, 0.3)';
        ctx.lineWidth = 1;
        this._roundRect(ctx, x, y, width, height, 6);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('氧气', x + width / 2, y - 14);

        ctx.fillStyle = this.isLow() ? '#ff6b6b' : '#b3e5fc';
        ctx.font = 'bold 10px Nunito, sans-serif';
        ctx.fillText(`${Math.ceil(this.current)}%`, x + width / 2, y + height + 14);

        ctx.restore();
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
