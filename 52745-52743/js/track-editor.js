class TrackEditor {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.controlPoints = [];
        this.curvePoints = [];
        this.selectedPoint = null;
        this.isDragging = false;
        this.isEditing = false;
        
        this.trackWidth = 80;
        this.innerPoints = [];
        this.outerPoints = [];
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
    }

    onMouseDown(e) {
        if (!this.isEditing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        for (let i = 0; i < this.controlPoints.length; i++) {
            const dist = Utils.distance(x, y, this.controlPoints[i].x, this.controlPoints[i].y);
            if (dist < 15) {
                this.selectedPoint = i;
                this.isDragging = true;
                return;
            }
        }
    }

    onMouseMove(e) {
        if (!this.isEditing || !this.isDragging || this.selectedPoint === null) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.controlPoints[this.selectedPoint] = { x, y };
        this.generateCurve();
    }

    onMouseUp(e) {
        this.isDragging = false;
        this.selectedPoint = null;
    }

    onDoubleClick(e) {
        if (!this.isEditing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        for (let i = 0; i < this.controlPoints.length; i++) {
            const dist = Utils.distance(x, y, this.controlPoints[i].x, this.controlPoints[i].y);
            if (dist < 15) {
                this.controlPoints.splice(i, 1);
                this.generateCurve();
                return;
            }
        }
        
        this.controlPoints.push({ x, y });
        this.generateCurve();
    }

    startEdit(existingPoints = null) {
        this.isEditing = true;
        if (existingPoints) {
            this.controlPoints = [...existingPoints];
        } else {
            this.createDefaultTrack();
        }
        this.generateCurve();
    }

    stopEdit() {
        this.isEditing = false;
    }

    createDefaultTrack() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) * 0.3;
        
        const numPoints = 8;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const variation = 1 + Math.sin(angle * 2) * 0.2;
            this.controlPoints.push({
                x: centerX + Math.cos(angle) * radius * variation,
                y: centerY + Math.sin(angle) * radius * variation
            });
        }
    }

    generateCurve() {
        if (this.controlPoints.length < 3) return;
        
        this.curvePoints = [];
        const points = [...this.controlPoints];
        
        if (this.isClosedLoop()) {
            points.push(points[0], points[1], points[2]);
        }
        
        for (let i = 0; i < points.length - 3; i++) {
            for (let t = 0; t < 1; t += 0.05) {
                const p = this.catmullRom(
                    points[i],
                    points[i + 1],
                    points[i + 2],
                    points[i + 3],
                    t
                );
                this.curvePoints.push(p);
            }
        }
        
        this.generateTrackBorders();
    }

    catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        return {
            x: 0.5 * (
                2 * p1.x +
                (-p0.x + p2.x) * t +
                (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
            ),
            y: 0.5 * (
                2 * p1.y +
                (-p0.y + p2.y) * t +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
            )
        };
    }

    isClosedLoop() {
        if (this.controlPoints.length < 3) return false;
        const first = this.controlPoints[0];
        const last = this.controlPoints[this.controlPoints.length - 1];
        return Utils.distance(first.x, first.y, last.x, last.y) < 100;
    }

    generateTrackBorders() {
        if (this.curvePoints.length < 3) return;
        
        this.innerPoints = [];
        this.outerPoints = [];
        
        for (let i = 0; i < this.curvePoints.length; i++) {
            const curr = this.curvePoints[i];
            const prev = this.curvePoints[(i - 1 + this.curvePoints.length) % this.curvePoints.length];
            const next = this.curvePoints[(i + 1) % this.curvePoints.length];
            
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
    }

    draw() {
        if (!this.isEditing) return;
        
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.outerPoints.length > 0 && this.innerPoints.length > 0) {
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
            
            ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.fill('evenodd');
        }
        
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        if (this.curvePoints.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.curvePoints[0].x, this.curvePoints[0].y);
            for (let i = 1; i < this.curvePoints.length; i++) {
                ctx.lineTo(this.curvePoints[i].x, this.curvePoints[i].y);
            }
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
        if (this.controlPoints.length > 1) {
            ctx.strokeStyle = 'rgba(255, 0, 110, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.controlPoints[0].x, this.controlPoints[0].y);
            for (let i = 1; i < this.controlPoints.length; i++) {
                ctx.lineTo(this.controlPoints[i].x, this.controlPoints[i].y);
            }
            ctx.stroke();
        }
        
        this.controlPoints.forEach((point, index) => {
            ctx.fillStyle = index === this.selectedPoint ? '#00ff88' : '#ff006e';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((index + 1).toString(), point.x, point.y + 4);
        });
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText('编辑器模式: 双击添加/删除点, 拖拽移动点', 20, 30);
        ctx.fillText(`控制点: ${this.controlPoints.length}`, 20, 50);
    }

    getTrackData() {
        return {
            controlPoints: [...this.controlPoints],
            curvePoints: [...this.curvePoints],
            innerPoints: [...this.innerPoints],
            outerPoints: [...this.outerPoints],
            trackWidth: this.trackWidth
        };
    }
}
