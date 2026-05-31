var CircuitGame = window.CircuitGame || {};

CircuitGame.Renderer = function(canvas, grid) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.grid = grid;
    this.cellSize = 64;
    this.padding = 20;
    this.particles = [];
    this.animFrame = null;
    this.time = 0;
    this.hoverCell = null;
    this.ghostComponent = null;
    this.ghostRotation = 0;
    this.faultFlash = 0;
    this.shortCircuit = false;
    this.resize();
};

CircuitGame.Renderer.prototype.resize = function() {
    var totalW = this.grid.cols * this.cellSize + this.padding * 2;
    var totalH = this.grid.rows * this.cellSize + this.padding * 2;
    var dpr = window.devicePixelRatio || 1;
    this.canvas.width = totalW * dpr;
    this.canvas.height = totalH * dpr;
    this.canvas.style.width = totalW + "px";
    this.canvas.style.height = totalH + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

CircuitGame.Renderer.prototype.getCellCenter = function(row, col) {
    return {
        x: this.padding + col * this.cellSize + this.cellSize / 2,
        y: this.padding + row * this.cellSize + this.cellSize / 2
    };
};

CircuitGame.Renderer.prototype.getCellFromPos = function(x, y) {
    var col = Math.floor((x - this.padding) / this.cellSize);
    var row = Math.floor((y - this.padding) / this.cellSize);
    if (row >= 0 && row < this.grid.rows && col >= 0 && col < this.grid.cols) {
        return { row: row, col: col };
    }
    return null;
};

CircuitGame.Renderer.prototype.start = function() {
    var self = this;
    function loop() {
        self.time += 0.016;
        self.draw();
        self.animFrame = requestAnimationFrame(loop);
    }
    loop();
};

CircuitGame.Renderer.prototype.stop = function() {
    if (this.animFrame) {
        cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
    }
};

CircuitGame.Renderer.prototype.draw = function() {
    var ctx = this.ctx;
    var w = this.canvas.width / (window.devicePixelRatio || 1);
    var h = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);

    this.drawBackground(ctx, w, h);
    this.drawGrid(ctx);

    for (var r = 0; r < this.grid.rows; r++) {
        for (var c = 0; c < this.grid.cols; c++) {
            var comp = this.grid.getComponent(r, c);
            if (comp) {
                this.drawComponent(ctx, r, c, comp);
            }
        }
    }

    this.drawSelection(ctx);
    this.drawHoverGhost(ctx);

    if (this.shortCircuit) {
        this.faultFlash = (this.faultFlash + 0.05) % (Math.PI * 2);
    }

    this.drawParticles(ctx);
};

CircuitGame.Renderer.prototype.drawBackground = function(ctx, w, h) {
    ctx.fillStyle = "#080c20";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#0d1530";
    ctx.lineWidth = 0.5;
    for (var x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (var y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
};

CircuitGame.Renderer.prototype.drawGrid = function(ctx) {
    for (var r = 0; r < this.grid.rows; r++) {
        for (var c = 0; c < this.grid.cols; c++) {
            var x = this.padding + c * this.cellSize;
            var y = this.padding + r * this.cellSize;

            ctx.fillStyle = "#0b1025";
            ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

            ctx.strokeStyle = "#162040";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, this.cellSize - 1, this.cellSize - 1);
        }
    }
};

CircuitGame.Renderer.prototype.drawComponent = function(ctx, row, col, comp) {
    var center = this.getCellCenter(row, col);
    var cx = center.x;
    var cy = center.y;
    var s = this.cellSize * 0.4;
    var typeDef = CircuitGame.COMPONENT_TYPES[comp.type];
    var color = typeDef ? typeDef.color : "#00ff88";
    var powered = comp.powered;

    if (this.shortCircuit && powered) {
        var flash = Math.sin(this.faultFlash * 8) * 0.5 + 0.5;
        color = this.lerpColor(color, "#ff3344", flash * 0.5);
    }

    ctx.save();
    ctx.translate(cx, cy);

    switch (comp.type) {
        case "power":
            this.drawPower(ctx, s, color, powered);
            break;
        case "wire":
            this.drawWire(ctx, s, color, powered, comp.rotation);
            break;
        case "wire-corner":
            this.drawWireCorner(ctx, s, color, powered, comp.rotation);
            break;
        case "wire-t":
            this.drawWireT(ctx, s, color, powered, comp.rotation);
            break;
        case "wire-cross":
            this.drawWireCross(ctx, s, color, powered);
            break;
        case "switch":
            this.drawSwitch(ctx, s, comp.state === "on", powered, comp.rotation);
            break;
        case "bulb":
            this.drawBulb(ctx, s, powered);
            break;
        case "resistor":
            this.drawResistor(ctx, s, color, powered, comp.rotation);
            break;
    }

    if (comp.fixed) {
        ctx.strokeStyle = "#ffffff18";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(-s * 0.85, -s * 0.85, s * 1.7, s * 1.7);
        ctx.setLineDash([]);
    }

    ctx.restore();
};

CircuitGame.Renderer.prototype.drawPower = function(ctx, s, color, powered) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 0.35, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(s * 0.35, 0);
    ctx.lineTo(s, 0);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, -s * 0.45);
    ctx.lineTo(-s * 0.35, s * 0.45);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s * 0.35, -s * 0.25);
    ctx.lineTo(s * 0.35, s * 0.25);
    ctx.stroke();

    ctx.font = "bold " + (s * 0.4) + "px Rajdhani";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ff4444";
    ctx.fillText("+", s * 0.6, 0);
    ctx.fillStyle = "#4488ff";
    ctx.fillText("−", -s * 0.6, 0);

    if (powered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = color + "44";
        ctx.lineWidth = 1;
        ctx.strokeRect(-s * 0.9, -s * 0.65, s * 1.8, s * 1.3);
        ctx.shadowBlur = 0;
    }
};

CircuitGame.Renderer.prototype.drawWire = function(ctx, s, color, powered, rotation) {
    ctx.save();
    ctx.rotate(rotation * Math.PI / 180);

    ctx.strokeStyle = powered ? color : "#2a4a3a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    if (powered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
};

CircuitGame.Renderer.prototype.drawWireCorner = function(ctx, s, color, powered, rotation) {
    ctx.save();
    ctx.rotate(rotation * Math.PI / 180);

    ctx.strokeStyle = powered ? color : "#2a4a3a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    if (powered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
};

CircuitGame.Renderer.prototype.drawWireT = function(ctx, s, color, powered, rotation) {
    ctx.save();
    ctx.rotate(rotation * Math.PI / 180);

    ctx.strokeStyle = powered ? color : "#2a4a3a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    if (powered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, s);
    ctx.stroke();

    ctx.fillStyle = powered ? color : "#2a4a3a";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
};

CircuitGame.Renderer.prototype.drawWireCross = function(ctx, s, color, powered) {
    ctx.strokeStyle = powered ? color : "#2a4a3a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    if (powered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
    ctx.stroke();

    ctx.fillStyle = powered ? color : "#2a4a3a";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
};

CircuitGame.Renderer.prototype.drawSwitch = function(ctx, s, isOn, powered, rotation) {
    ctx.save();
    ctx.rotate(rotation * Math.PI / 180);

    var activeColor = powered ? "#ff8800" : "#6a4a1a";
    var dimColor = "#3a2a1a";

    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    ctx.strokeStyle = activeColor;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 0.3, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(s * 0.3, 0);
    ctx.lineTo(s, 0);
    ctx.stroke();

    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.arc(-s * 0.3, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isOn ? activeColor : dimColor;
    ctx.beginPath();
    ctx.arc(s * 0.3, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    if (isOn) {
        if (powered) {
            ctx.shadowColor = "#ff8800";
            ctx.shadowBlur = 8;
        }
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, 0);
        ctx.lineTo(s * 0.3, 0);
        ctx.stroke();
    } else {
        ctx.strokeStyle = "#ff880088";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, 0);
        ctx.lineTo(s * 0.1, -s * 0.4);
        ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
};

CircuitGame.Renderer.prototype.drawBulb = function(ctx, s, powered) {
    var activeColor = "#ffcc00";
    var dimColor = "#4a4a2a";

    ctx.strokeStyle = dimColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 0.45, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(s * 0.45, 0);
    ctx.lineTo(s, 0);
    ctx.stroke();

    if (powered) {
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 25;

        var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.8);
        gradient.addColorStop(0, "#ffcc0044");
        gradient.addColorStop(0.5, "#ffcc0018");
        gradient.addColorStop(1, "#ffcc0000");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = powered ? activeColor : dimColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.38, 0, Math.PI * 2);
    ctx.stroke();

    if (powered) {
        ctx.fillStyle = "#ffcc0033";
        ctx.fill();

        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.18, -s * 0.18);
        ctx.lineTo(s * 0.18, s * 0.18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s * 0.18, -s * 0.18);
        ctx.lineTo(-s * 0.18, s * 0.18);
        ctx.stroke();
    } else {
        ctx.strokeStyle = dimColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-s * 0.12, -s * 0.12);
        ctx.lineTo(s * 0.12, s * 0.12);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s * 0.12, -s * 0.12);
        ctx.lineTo(-s * 0.12, s * 0.12);
        ctx.stroke();
    }

    ctx.shadowBlur = 0;
};

CircuitGame.Renderer.prototype.drawResistor = function(ctx, s, color, powered, rotation) {
    ctx.save();
    ctx.rotate(rotation * Math.PI / 180);

    ctx.strokeStyle = powered ? "#ff6b6b" : "#3a2020";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (powered) {
        ctx.shadowColor = "#ff6b6b";
        ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 0.5, 0);

    var zigCount = 6;
    var zigWidth = s / zigCount;
    var zigHeight = s * 0.35;
    var zx = -s * 0.5;
    for (var i = 0; i < zigCount; i++) {
        var peakY = (i % 2 === 0) ? -zigHeight : zigHeight;
        zx += zigWidth * 0.5;
        ctx.lineTo(zx, peakY);
        zx += zigWidth * 0.5;
        if (i === zigCount - 1) {
            ctx.lineTo(zx, 0);
        } else {
            var nextPeakY = ((i + 1) % 2 === 0) ? -zigHeight : zigHeight;
            ctx.lineTo(zx, nextPeakY === peakY ? 0 : nextPeakY);
        }
    }

    ctx.lineTo(s * 0.5, 0);
    ctx.lineTo(s, 0);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
};

CircuitGame.Renderer.prototype.drawSelection = function(ctx) {
    if (!this.grid.selectedCell) return;
    var sel = this.grid.selectedCell;
    var x = this.padding + sel.col * this.cellSize;
    var y = this.padding + sel.row * this.cellSize;

    ctx.strokeStyle = "#4488ff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#4488ff";
    ctx.shadowBlur = 10;
    ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
    ctx.shadowBlur = 0;
};

CircuitGame.Renderer.prototype.drawHoverGhost = function(ctx) {
    if (!this.hoverCell || !this.ghostComponent) return;
    var comp = {
        type: this.ghostComponent,
        rotation: this.ghostRotation || 0,
        powered: false,
        state: "off",
        fixed: false
    };

    if (this.grid.getComponent(this.hoverCell.row, this.hoverCell.col)) return;

    ctx.globalAlpha = 0.4;
    this.drawComponent(ctx, this.hoverCell.row, this.hoverCell.col, comp);
    ctx.globalAlpha = 1.0;
};

CircuitGame.Renderer.prototype.drawParticles = function(ctx) {
    for (var r = 0; r < this.grid.rows; r++) {
        for (var c = 0; c < this.grid.cols; c++) {
            var comp = this.grid.getComponent(r, c);
            if (comp && comp.powered && !this.shortCircuit) {
                this.drawCurrentParticles(ctx, r, c, comp);
            }
        }
    }
};

CircuitGame.Renderer.prototype.drawCurrentParticles = function(ctx, row, col, comp) {
    var center = this.getCellCenter(row, col);
    var s = this.cellSize * 0.4;
    var conns = this.grid.getConnections(row, col);
    var color = "#00ff88";
    if (comp.type === "switch") color = "#ff8800";
    if (comp.type === "bulb") color = "#ffcc00";
    if (comp.type === "resistor") color = "#ff6b6b";

    for (var i = 0; i < conns.length; i++) {
        var dir = conns[i];
        var offset = CircuitGame.directionToOffset(dir);
        var ex = center.x + offset[1] * s;
        var ey = center.y + offset[0] * s;

        for (var p = 0; p < 2; p++) {
            var t = ((this.time * 1.5 + i * 0.3 + row * 0.5 + col * 0.7 + p * 0.5) % 1);
            var px = center.x + (ex - center.x) * t;
            var py = center.y + (ey - center.y) * t;

            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
};

CircuitGame.Renderer.prototype.lerpColor = function(c1, c2, t) {
    var r1 = parseInt(c1.substr(1, 2), 16);
    var g1 = parseInt(c1.substr(3, 2), 16);
    var b1 = parseInt(c1.substr(5, 2), 16);
    var r2 = parseInt(c2.substr(1, 2), 16);
    var g2 = parseInt(c2.substr(3, 2), 16);
    var b2 = parseInt(c2.substr(5, 2), 16);
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var b = Math.round(b1 + (b2 - b1) * t);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

CircuitGame.Renderer.prototype.drawComponentPreview = function(targetCanvas, type, rotation) {
    var ctx = targetCanvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var size = 48;
    targetCanvas.width = size * dpr;
    targetCanvas.height = size * dpr;
    targetCanvas.style.width = size + "px";
    targetCanvas.style.height = size + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    var s = size * 0.35;

    switch (type) {
        case "power":
            this.drawPower(ctx, s, "#00ff88", false);
            break;
        case "wire":
            this.drawWire(ctx, s, "#2a6a4a", false, rotation || 0);
            break;
        case "wire-corner":
            this.drawWireCorner(ctx, s, "#2a6a4a", false, rotation || 0);
            break;
        case "wire-t":
            this.drawWireT(ctx, s, "#2a6a4a", false, rotation || 0);
            break;
        case "wire-cross":
            this.drawWireCross(ctx, s, "#2a6a4a", false);
            break;
        case "switch":
            this.drawSwitch(ctx, s, true, false, rotation || 0);
            break;
        case "bulb":
            this.drawBulb(ctx, s, false);
            break;
        case "resistor":
            this.drawResistor(ctx, s, "#5a3030", false, rotation || 0);
            break;
    }

    ctx.restore();
};
