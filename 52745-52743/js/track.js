class Track {
    constructor(canvas, themeType = 'neon') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.themeType = themeType;
        this.theme = TrackThemes[themeType] || TrackThemes.neon;
        
        this.trackWidth = 80;
        this.innerPoints = [];
        this.outerPoints = [];
        this.centerPoints = [];
        this.checkpoints = [];
        
        this.generateTrack();
    }
    
    setTheme(themeType) {
        this.themeType = themeType;
        this.theme = TrackThemes[themeType] || TrackThemes.neon;
    }

    generateTrack() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const baseRadius = Math.min(this.width, this.height) * 0.35;
        
        const numPoints = 60;
        const angles = [];
        
        for (let i = 0; i < numPoints; i++) {
            angles.push((i / numPoints) * Math.PI * 2);
        }
        
        const radiusVariations = [
            1.0, 1.02, 1.05, 1.08, 1.10, 1.12, 1.15, 1.18,
            1.20, 1.22, 1.25, 1.28, 1.30, 1.28, 1.25, 1.22,
            1.20, 1.18, 1.15, 1.12, 1.10, 1.08, 1.05, 1.02,
            1.0, 0.98, 0.95, 0.92, 0.90, 0.88, 0.85, 0.82,
            0.80, 0.78, 0.75, 0.72, 0.70, 0.68, 0.65, 0.62,
            0.60, 0.62, 0.65, 0.68, 0.70, 0.72, 0.75, 0.78,
            0.80, 0.82, 0.85, 0.88, 0.90, 0.92, 0.95, 0.98,
            1.0, 1.0, 1.0, 1.0
        ];
        
        for (let i = 0; i < numPoints; i++) {
            const angle = angles[i];
            const variation = radiusVariations[i];
            const radius = baseRadius * variation;
            
            const wobble = Math.sin(angle * 3) * 15;
            
            const x = centerX + Math.cos(angle) * (radius + wobble);
            const y = centerY + Math.sin(angle) * (radius + wobble);
            
            this.centerPoints.push({ x, y });
        }
        
        for (let i = 0; i < numPoints; i++) {
            const curr = this.centerPoints[i];
            const next = this.centerPoints[(i + 1) % numPoints];
            const prev = this.centerPoints[(i - 1 + numPoints) % numPoints];
            
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len;
            const ny = dx / len;
            
            this.innerPoints.push({
                x: curr.x - nx * (this.trackWidth / 2),
                y: curr.y - ny * (this.trackWidth / 2)
            });
            
            this.outerPoints.push({
                x: curr.x + nx * (this.trackWidth / 2),
                y: curr.y + ny * (this.trackWidth / 2)
            });
        }
        
        this.generateCheckpoints();
    }

    generateCheckpoints() {
        const numCheckpoints = 8;
        const step = Math.floor(this.centerPoints.length / numCheckpoints);
        
        for (let i = 0; i < numCheckpoints; i++) {
            const idx = (i * step) % this.centerPoints.length;
            const center = this.centerPoints[idx];
            const inner = this.innerPoints[idx];
            const outer = this.outerPoints[idx];
            
            this.checkpoints.push({
                index: i,
                x: center.x,
                y: center.y,
                innerX: inner.x,
                innerY: inner.y,
                outerX: outer.x,
                outerY: outer.y
            });
        }
    }

    isOnTrack(x, y) {
        if (this.isPointInPolygon(x, y, this.innerPoints)) {
            return false;
        }
        
        if (!this.isPointInPolygon(x, y, this.outerPoints)) {
            return false;
        }
        
        return true;
    }

    isPointInPolygon(x, y, polygon) {
        let inside = false;
        const n = polygon.length;
        
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    getStartPosition() {
        const startPoint = this.centerPoints[0];
        const nextPoint = this.centerPoints[1];
        const angle = Math.atan2(nextPoint.y - startPoint.y, nextPoint.x - startPoint.x);
        
        return {
            x: startPoint.x,
            y: startPoint.y,
            angle: angle
        };
    }

    getCheckpoints() {
        return this.checkpoints;
    }

    draw(playerCheckpointStates = null) {
        const ctx = this.ctx;
        
        this.drawGround();
        this.drawOuterBorder();
        this.drawTrackSurface();
        this.drawInnerBorder();
        this.drawTrackDecorations();
        this.drawCheckpoints(playerCheckpointStates);
        this.drawStartLine();
    }

    drawGround() {
        const ctx = this.ctx;
        
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width / 2
        );
        gradient.addColorStop(0, this.theme.groundColor2);
        gradient.addColorStop(1, this.theme.groundColor1);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.strokeStyle = this.theme.gridColor;
        ctx.lineWidth = 1;
        
        const gridSize = 40;
        for (let x = 0; x < this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    drawTrackSurface() {
        const ctx = this.ctx;
        
        ctx.beginPath();
        ctx.moveTo(this.outerPoints[0].x, this.outerPoints[0].y);
        for (let i = 1; i < this.outerPoints.length; i++) {
            ctx.lineTo(this.outerPoints[i].x, this.outerPoints[i].y);
        }
        ctx.closePath();
        
        ctx.moveTo(this.innerPoints[0].x, this.innerPoints[0].y);
        for (let i = 1; i < this.innerPoints.length; i++) {
            ctx.lineTo(this.innerPoints[i].x, this.innerPoints[i].y);
        }
        ctx.closePath();
        
        const trackGradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        trackGradient.addColorStop(0, this.theme.trackColor1);
        trackGradient.addColorStop(0.5, this.theme.trackColor2);
        trackGradient.addColorStop(1, this.theme.trackColor1);
        
        ctx.fillStyle = trackGradient;
        ctx.fill('evenodd');
        
        ctx.strokeStyle = this.adjustColorOpacity(this.theme.outerBorderColor, 0.3);
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        ctx.moveTo(this.centerPoints[0].x, this.centerPoints[0].y);
        for (let i = 1; i < this.centerPoints.length; i++) {
            ctx.lineTo(this.centerPoints[i].x, this.centerPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    adjustColorOpacity(color, opacity) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    }

    drawOuterBorder() {
        const ctx = this.ctx;
        
        ctx.shadowColor = this.theme.outerBorderColor;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(this.outerPoints[0].x, this.outerPoints[0].y);
        for (let i = 1; i < this.outerPoints.length; i++) {
            ctx.lineTo(this.outerPoints[i].x, this.outerPoints[i].y);
        }
        ctx.closePath();
        
        ctx.strokeStyle = this.theme.outerBorderColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

    drawInnerBorder() {
        const ctx = this.ctx;
        
        ctx.shadowColor = this.theme.innerBorderColor;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(this.innerPoints[0].x, this.innerPoints[0].y);
        for (let i = 1; i < this.innerPoints.length; i++) {
            ctx.lineTo(this.innerPoints[i].x, this.innerPoints[i].y);
        }
        ctx.closePath();
        
        ctx.strokeStyle = this.theme.innerBorderColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

    drawTrackDecorations() {
        const ctx = this.ctx;
        
        for (let i = 0; i < this.outerPoints.length; i += 3) {
            const p1 = this.outerPoints[i];
            const p2 = this.outerPoints[(i + 1) % this.outerPoints.length];
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len;
            const ny = dx / len;
            
            ctx.fillStyle = i % 6 === 0 ? this.theme.innerBorderColor : '#ffffff';
            ctx.beginPath();
            ctx.rect(p1.x + nx * 5, p1.y + ny * 5, 8, 8);
            ctx.fill();
        }
    }

    drawCheckpoints(playerCheckpointStates = null) {
        const ctx = this.ctx;
        
        this.checkpoints.forEach((cp, index) => {
            const passed = playerCheckpointStates ? playerCheckpointStates[index] : false;
            const color = passed ? this.theme.checkpointPassedColor : this.theme.checkpointColor;
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            
            ctx.shadowBlur = 10;
            ctx.lineWidth = 4;
            
            ctx.beginPath();
            ctx.moveTo(cp.innerX, cp.innerY);
            ctx.lineTo(cp.outerX, cp.outerY);
            ctx.stroke();
            
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = color;
            ctx.font = 'bold 14px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText((index + 1).toString(), cp.x, cp.y - 15);
        });
    }

    drawStartLine() {
        const ctx = this.ctx;
        const start = this.centerPoints[0];
        const inner = this.innerPoints[0];
        const outer = this.outerPoints[0];
        
        ctx.strokeStyle = this.theme.startLineColor;
        ctx.lineWidth = 6;
        ctx.shadowColor = this.theme.startLineColor;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(inner.x, inner.y);
        ctx.lineTo(outer.x, outer.y);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = this.theme.outerBorderColor;
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('START', start.x, start.y - 25);
    }

    resetCheckpoints() {
    }
}
