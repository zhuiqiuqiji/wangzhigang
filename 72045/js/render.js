class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.laneColor = '#8B4513';
        this.laneBorderColor = '#5D4037';
        this.gutterColor = '#2d3436';
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawLane(theme = null) {
        const laneX = this.width * 0.15;
        const laneY = 50;
        const laneWidth = this.width * 0.7;
        const laneHeight = this.height - 100;
        
        const laneTheme = theme || skinSystem.getCurrentLaneTheme();
        
        this.ctx.fillStyle = laneTheme.gutterColor;
        this.ctx.fillRect(0, laneY, this.width, laneHeight);
        
        const gradient = this.ctx.createLinearGradient(laneX, 0, laneX + laneWidth, 0);
        gradient.addColorStop(0, laneTheme.laneGradient[0]);
        gradient.addColorStop(0.5, laneTheme.laneGradient[1]);
        gradient.addColorStop(1, laneTheme.laneGradient[2]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(laneX, laneY, laneWidth, laneHeight);
        
        if (laneTheme.special === 'neon') {
            this.ctx.shadowColor = laneTheme.borderColor;
            this.ctx.shadowBlur = 20;
        }
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const x = laneX + (laneWidth / 20) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, laneY);
            this.ctx.lineTo(x, laneY + laneHeight);
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
        
        this.ctx.fillStyle = laneTheme.borderColor;
        this.ctx.fillRect(laneX - 10, laneY, 10, laneHeight);
        this.ctx.fillRect(laneX + laneWidth, laneY, 10, laneHeight);
        
        this.ctx.strokeStyle = '#feca57';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(laneX, laneY + laneHeight - 50);
        this.ctx.lineTo(laneX + laneWidth, laneY + laneHeight - 50);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#1B5E20';
        this.ctx.fillRect(laneX, laneY, laneWidth, 80);
        
        const arrowPoints = [
            { x: laneX + laneWidth / 2 - 15, y: laneY + 20 },
            { x: laneX + laneWidth / 2 + 15, y: laneY + 20 },
            { x: laneX + laneWidth / 2, y: laneY + 50 }
        ];
        this.ctx.fillStyle = laneTheme.arrowColor;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowPoints[0].x, arrowPoints[0].y);
        this.ctx.lineTo(arrowPoints[1].x, arrowPoints[1].y);
        this.ctx.lineTo(arrowPoints[2].x, arrowPoints[2].y);
        this.ctx.closePath();
        this.ctx.fill();
        
        if (laneTheme.special === 'stars') {
            this.drawStars(laneX, laneY, laneWidth, laneHeight);
        }
        
        return { left: laneX, right: laneX + laneWidth, top: laneY, bottom: laneY + laneHeight };
    }

    drawStars(x, y, width, height) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 30; i++) {
            const starX = x + Math.random() * width;
            const starY = y + Math.random() * height;
            const size = Math.random() * 2 + 1;
            this.ctx.beginPath();
            this.ctx.arc(starX, starY, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawPin(pin) {
        const { x, y, rotation, knocked, type = 'standard' } = pin;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        
        if (knocked) {
            this.ctx.globalAlpha = 0.7;
        }
        
        if (type === 'candle') {
            this.drawCandlePin(pin);
        } else if (type === 'duck') {
            this.drawDuckPin(pin);
        } else {
            this.drawStandardPin(pin);
        }
        
        this.ctx.restore();
    }

    drawStandardPin(pin) {
        const pinHeight = 40;
        const pinRadius = 12;
        
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, pinRadius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, '#e0e0e0');
        gradient.addColorStop(1, '#bdbdbd');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, pinRadius, pinHeight / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#9e9e9e';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#e53935';
        this.ctx.fillRect(-pinRadius + 2, -pinHeight / 4, pinRadius * 2 - 4, 6);
        
        this.ctx.fillStyle = '#1565c0';
        this.ctx.fillRect(-pinRadius + 2, pinHeight / 4 - 3, pinRadius * 2 - 4, 6);
    }

    drawCandlePin(pin) {
        const pinHeight = 50;
        const pinRadius = 8;
        
        const gradient = this.ctx.createLinearGradient(-pinRadius, 0, pinRadius, 0);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#f0f0f0');
        gradient.addColorStop(1, '#e0e0e0');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-pinRadius, -pinHeight / 2, pinRadius * 2, pinHeight);
        
        this.ctx.beginPath();
        this.ctx.ellipse(0, -pinHeight / 2, pinRadius, pinRadius / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.ellipse(0, pinHeight / 2, pinRadius, pinRadius / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#9e9e9e';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-pinRadius, -pinHeight / 2, pinRadius * 2, pinHeight);
        
        this.ctx.fillStyle = '#e53935';
        this.ctx.fillRect(-pinRadius + 1, -pinHeight / 4, pinRadius * 2 - 2, 5);
        
        this.ctx.fillStyle = '#1565c0';
        this.ctx.fillRect(-pinRadius + 1, pinHeight / 4 - 2, pinRadius * 2 - 2, 5);
    }

    drawDuckPin(pin) {
        const pinHeight = 30;
        const pinRadius = 15;
        
        const gradient = this.ctx.createRadialGradient(0, -pinHeight / 4, 0, 0, 0, pinRadius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, '#e0e0e0');
        gradient.addColorStop(1, '#bdbdbd');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, pinRadius, pinHeight / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#9e9e9e';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#e53935';
        this.ctx.fillRect(-pinRadius + 2, -pinHeight / 6, pinRadius * 2 - 4, 5);
        
        this.ctx.fillStyle = '#1565c0';
        this.ctx.fillRect(-pinRadius + 2, pinHeight / 6 - 2, pinRadius * 2 - 4, 5);
    }

    drawPins(pins) {
        for (const pin of pins) {
            this.drawPin(pin);
        }
    }

    drawBall(ball, skin = null) {
        const { x, y, radius, rotation } = ball;
        const ballSkin = skin || skinSystem.getCurrentBallSkin();
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        
        let gradient;
        
        if (ballSkin.special === 'rainbow') {
            gradient = this.ctx.createLinearGradient(-radius, -radius, radius, radius);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(0.25, '#feca57');
            gradient.addColorStop(0.5, '#48dbfb');
            gradient.addColorStop(0.75, '#ff9ff3');
            gradient.addColorStop(1, '#5f27cd');
        } else if (ballSkin.special === 'disco') {
            gradient = this.ctx.createRadialGradient(-radius / 3, -radius / 3, 0, 0, 0, radius);
            gradient.addColorStop(0, ballSkin.color1);
            gradient.addColorStop(0.5, ballSkin.color2);
            gradient.addColorStop(1, ballSkin.color3);
        } else {
            gradient = this.ctx.createRadialGradient(-radius / 3, -radius / 3, 0, 0, 0, radius);
            gradient.addColorStop(0, ballSkin.color1);
            gradient.addColorStop(0.5, ballSkin.color2);
            gradient.addColorStop(1, ballSkin.color3);
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        const holePositions = [
            { x: -radius * 0.3, y: -radius * 0.2 },
            { x: radius * 0.1, y: -radius * 0.35 },
            { x: radius * 0.35, y: -radius * 0.1 }
        ];
        
        this.ctx.fillStyle = '#000';
        for (const hole of holePositions) {
            this.ctx.beginPath();
            this.ctx.arc(hole.x, hole.y, radius * 0.15, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    drawAimLine(startX, startY, endX, endY, power) {
        this.ctx.save();
        
        this.ctx.setLineDash([10, 10]);
        this.ctx.strokeStyle = `rgba(254, 202, 87, ${0.3 + power * 0.7})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowSize = 15;
        
        this.ctx.fillStyle = '#feca57';
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawSpinTrajectory(points, power) {
        if (points.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = `rgba(72, 219, 251, ${0.3 + power * 0.5})`;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawText(text, x, y, size = 24, color = '#fff', align = 'center') {
        this.ctx.save();
        this.ctx.font = `bold ${size}px 'Bangers', cursive`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    drawResultMessage(message, x, y) {
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        
        this.ctx.font = `bold 48px "Bangers", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const gradient = this.ctx.createLinearGradient(x - 150, y, x + 150, y);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#feca57');
        gradient.addColorStop(1, '#48dbfb');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillText(message, x, y);
        
        this.ctx.restore();
    }

    drawAITurnIndicator(isAITurn, opponentName) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawText(`${opponentName} 正在思考...`, this.width / 2, this.height / 2, 36, '#feca57');
        
        const dots = Math.floor(Date.now() / 500) % 4;
        this.drawText('.'.repeat(dots), this.width / 2 + 150, this.height / 2, 36, '#feca57');
        
        this.ctx.restore();
    }

    getLaneBounds() {
        const laneX = this.width * 0.15;
        const laneY = 50;
        const laneWidth = this.width * 0.7;
        const laneHeight = this.height - 100;
        
        return { 
            left: laneX, 
            right: laneX + laneWidth, 
            top: laneY, 
            bottom: laneY + laneHeight,
            centerX: laneX + laneWidth / 2
        };
    }
}
