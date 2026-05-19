class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.isSlicing = false;
        this.trailPoints = [];
        this.maxTrailLength = 20;
        this.lastPoint = null;
        this.currentPoint = null;
        this.trailEffect = 'normal';
        this.glowIntensity = 1;

        this.bindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onSliceStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.onSliceMove(e));
        this.canvas.addEventListener('mouseup', () => this.onSliceEnd());
        this.canvas.addEventListener('mouseleave', () => this.onSliceEnd());

        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', () => this.onSliceEnd());
    }

    getCanvasPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    onSliceStart(e) {
        e.preventDefault();
        this.isSlicing = true;
        this.trailPoints = [];
        const pos = this.getCanvasPosition(e);
        this.trailPoints.push(pos);
        this.lastPoint = pos;
        this.currentPoint = pos;
    }

    onSliceMove(e) {
        if (!this.isSlicing) return;
        e.preventDefault();

        const pos = this.getCanvasPosition(e);
        this.lastPoint = this.currentPoint;
        this.currentPoint = pos;

        if (this.lastPoint) {
            const dist = Utils.distance(this.lastPoint.x, this.lastPoint.y, pos.x, pos.y);
            if (dist > 2) {
                this.trailPoints.push(pos);
                if (this.trailPoints.length > this.maxTrailLength) {
                    this.trailPoints.shift();
                }
            }
        }
    }

    onSliceEnd() {
        this.isSlicing = false;
        this.lastPoint = null;
        this.currentPoint = null;
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.onSliceStart(e);
        }
    }

    onTouchMove(e) {
        if (e.touches.length === 1) {
            this.onSliceMove(e);
        }
    }

    getTrailPoints() {
        return this.trailPoints;
    }

    clearTrail() {
        this.trailPoints = [];
    }

    update() {
        if (!this.isSlicing && this.trailPoints.length > 0) {
            this.trailPoints = [];
        }
    }

    drawTrail(ctx) {
        if (this.trailPoints.length < 2) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < this.trailPoints.length; i++) {
            const alpha = (i / this.trailPoints.length) * this.glowIntensity;
            const width = 2 + alpha * 6;

            if (this.trailEffect === 'rainbow') {
                const hue = (i * 20 + Date.now() * 0.1) % 360;
                ctx.beginPath();
                ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha * 0.8})`;
                ctx.lineWidth = width + 8;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha})`;
                ctx.lineWidth = width;
                ctx.stroke();
            } else if (this.trailEffect === 'fire') {
                ctx.beginPath();
                ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                ctx.strokeStyle = `rgba(255, 100, 0, ${alpha * 0.6})`;
                ctx.lineWidth = width + 10;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                ctx.strokeStyle = `rgba(255, 200, 0, ${alpha * 0.8})`;
                ctx.lineWidth = width + 4;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                ctx.strokeStyle = `rgba(255, 255, 200, ${alpha})`;
                ctx.lineWidth = width;
                ctx.stroke();
            } else if (this.trailEffect === 'ice') {
                ctx.beginPath();
                ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.5})`;
                ctx.lineWidth = width + 10;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                ctx.strokeStyle = `rgba(150, 230, 255, ${alpha * 0.8})`;
                ctx.lineWidth = width + 4;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = width;
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                ctx.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.5})`;
                ctx.lineWidth = width + 6;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
                ctx.lineWidth = width;
                ctx.stroke();
            }
        }

        if (this.trailPoints.length >= 3) {
            const last = this.trailPoints[this.trailPoints.length - 1];
            const prev = this.trailPoints[this.trailPoints.length - 2];
            const angle = Math.atan2(last.y - prev.y, last.x - prev.x);

            for (let j = 0; j < 3; j++) {
                const sparkAngle = angle + Utils.random(-0.5, 0.5);
                const sparkDist = Utils.random(5, 15);
                ctx.beginPath();
                ctx.arc(
                    last.x + Math.cos(sparkAngle) * sparkDist,
                    last.y + Math.sin(sparkAngle) * sparkDist,
                    Utils.random(1, 3),
                    0, Math.PI * 2
                );
                ctx.fillStyle = `rgba(255, 255, 255, ${Utils.random(0.3, 0.8)})`;
                ctx.fill();
            }
        }

        ctx.restore();
    }
}
