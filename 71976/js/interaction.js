class PendulumInteraction {
    constructor(canvas, physics, getScale, getBobInfo) {
        this.canvas = canvas;
        this.physics = physics;
        this.getScale = getScale;
        this.getBobInfo = getBobInfo;
        this.isDragging = false;
        this.onDragStart = null;
        this.onDragEnd = null;
        this.onDragging = null;

        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleEnd(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleEnd(e));

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd(e);
        }, { passive: false });
    }

    getCanvasPos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    handleStart(event) {
        const pos = this.getCanvasPos(event);
        const info = this.getBobInfo();
        if (!info) return;

        const dx = pos.x - info.bobX;
        const dy = pos.y - info.bobY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = Math.max(20, info.bobRadius + 10);

        if (dist <= hitRadius) {
            this.isDragging = true;
            this.physics.isRunning = false;
            this.physics.omega = 0;
            this.physics.trail = [];
            if (this.onDragStart) this.onDragStart();
        }
    }

    handleMove(event) {
        if (!this.isDragging) return;

        const pos = this.getCanvasPos(event);
        const info = this.getBobInfo();
        if (!info) return;

        const dx = pos.x - info.pivotX;
        const dy = pos.y - info.pivotY;

        let angle = Math.atan2(dx, dy);
        angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle));

        this.physics.theta = angle;
        this.physics.omega = 0;
        if (this.onDragging) this.onDragging();
    }

    handleEnd(event) {
        if (!this.isDragging) return;
        this.isDragging = false;
        if (Math.abs(this.physics.theta) > 0.01) {
            this.physics.isRunning = true;
            this.physics.time = 0;
            this.physics.lastCrossTime = null;
            this.physics.measuredPeriod = 0;
            this.physics.prevTheta = this.physics.theta;
        }
        if (this.onDragEnd) this.onDragEnd();
    }

    getIsDragging() {
        return this.isDragging;
    }
}

window.PendulumInteraction = PendulumInteraction;
