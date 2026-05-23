const Utils = {
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    weightedRandom(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item;
            }
        }
        return items[items.length - 1];
    },

    circleCollision(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    },

    drawFishBody(ctx, x, y, width, height, color, tailAngle = 0) {
        ctx.save();
        ctx.translate(x, y);
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const tailWidth = width * 0.4;
        const tailHeight = height * 0.6;
        ctx.save();
        ctx.translate(-width / 2 - tailWidth * 0.3, 0);
        ctx.rotate(tailAngle);
        ctx.beginPath();
        ctx.moveTo(0, -tailHeight / 2);
        ctx.lineTo(-tailWidth, 0);
        ctx.lineTo(0, tailHeight / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        const finWidth = width * 0.25;
        const finHeight = height * 0.3;
        ctx.save();
        ctx.translate(width * 0.1, -height * 0.3);
        ctx.rotate(-0.3 + tailAngle * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-finWidth / 2, -finHeight, -finWidth, -finHeight * 0.5);
        ctx.quadraticCurveTo(-finWidth / 2, 0, 0, 0);
        ctx.fill();
        ctx.restore();
        
        const eyeX = width * 0.25;
        const eyeY = -height * 0.1;
        const eyeRadius = height * 0.15;
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(eyeX + eyeRadius * 0.2, eyeY, eyeRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(eyeX + eyeRadius * 0.1, eyeY - eyeRadius * 0.2, eyeRadius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },

    drawNet(ctx, x, y, radius, level, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.getNetColor(level);
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        const innerRadius = radius * 0.85;
        ctx.beginPath();
        ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        const gridLines = 8;
        for (let i = 0; i < gridLines; i++) {
            const angle = (i / gridLines) * Math.PI * 2;
            const innerX = x + Math.cos(angle) * innerRadius;
            const innerY = y + Math.sin(angle) * innerRadius;
            const outerX = x + Math.cos(angle) * radius;
            const outerY = y + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.moveTo(innerX, innerY);
            ctx.lineTo(outerX, outerY);
            ctx.stroke();
        }
        
        ctx.restore();
    },

    getNetColor(level) {
        const colors = [
            '#87ceeb',
            '#98fb98',
            '#ffd700',
            '#ff7f50',
            '#ff69b4',
            '#9b59b6',
            '#e74c3c'
        ];
        return colors[level - 1] || colors[0];
    },

    drawBubble(ctx, x, y, radius, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },

    drawCoin(ctx, x, y, radius) {
        ctx.save();
        ctx.translate(x, y);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, '#fff7e0');
        gradient.addColorStop(0.5, '#ffd700');
        gradient.addColorStop(1, '#b8860b');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#b8860b';
        ctx.font = `bold ${radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
        
        ctx.restore();
    },

    drawSeaweed(ctx, x, y, height, waveOffset) {
        ctx.save();
        ctx.translate(x, y);
        
        const segments = 8;
        const segmentHeight = height / segments;
        const waveAmplitude = 15;
        
        ctx.strokeStyle = '#228b22';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        for (let i = 1; i <= segments; i++) {
            const y = -i * segmentHeight;
            const wave = Math.sin(waveOffset + i * 0.5) * waveAmplitude * (i / segments);
            ctx.lineTo(wave, y);
        }
        
        ctx.stroke();
        
        ctx.strokeStyle = '#32cd32';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        for (let i = 1; i <= segments; i++) {
            const y = -i * segmentHeight;
            const wave = Math.sin(waveOffset + i * 0.5) * waveAmplitude * (i / segments);
            ctx.lineTo(wave, y);
        }
        
        ctx.stroke();
        
        ctx.restore();
    },

    roundRect(ctx, x, y, width, height, radius) {
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, radius);
            return;
        }
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
};
