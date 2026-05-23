const Utils = {
    lerp: function(a, b, t) {
        return a + (b - a) * t;
    },

    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    distance: function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    pointToLineDistance: function(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
    },

    formatTime: function(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    },

    getOrdinalSuffix: function(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    },

    randomRange: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    degToRad: function(deg) {
        return deg * Math.PI / 180;
    },

    radToDeg: function(rad) {
        return rad * 180 / Math.PI;
    },

    normalizeAngle: function(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
};

class Timer {
    constructor() {
        this.startTime = 0;
        this.elapsed = 0;
        this.running = false;
        this.lapTimes = [];
        this.lastLapTime = 0;
    }

    start() {
        this.startTime = performance.now();
        this.lastLapTime = this.startTime;
        this.running = true;
    }

    lap() {
        const now = performance.now();
        const lapTime = now - this.lastLapTime;
        this.lapTimes.push(lapTime);
        this.lastLapTime = now;
        return lapTime;
    }

    stop() {
        if (this.running) {
            this.elapsed = performance.now() - this.startTime;
            this.running = false;
        }
        return this.elapsed;
    }

    getElapsed() {
        if (this.running) {
            return performance.now() - this.startTime;
        }
        return this.elapsed;
    }

    getCurrentLapTime() {
        if (this.running) {
            return performance.now() - this.lastLapTime;
        }
        return 0;
    }

    getLapTimes() {
        return [...this.lapTimes];
    }

    reset() {
        this.startTime = 0;
        this.elapsed = 0;
        this.running = false;
        this.lapTimes = [];
        this.lastLapTime = 0;
    }
}
