class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.flashAlpha = 0;
        this.flashColor = '#000';
        this.backgroundStars = this.createBackgroundStars();
    }

    createBackgroundStars() {
        const stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() * 2 + 1,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinkleOffset: Math.random() * Math.PI * 2,
                parallax: Math.random() * 0.3 + 0.1
            });
        }
        return stars;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    flash(color, duration) {
        this.flashColor = color;
        this.flashAlpha = 1;
        this.flashDuration = duration;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawBackground(time) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e1b4b');
        gradient.addColorStop(1, '#0f172a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.backgroundStars.forEach(star => {
            const y = (star.y + this.cameraY * star.parallax) % CANVAS_HEIGHT;
            const adjustedY = y < 0 ? y + CANVAS_HEIGHT : y;
            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
            const alpha = 0.3 + twinkle * 0.3 + 0.2;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, adjustedY, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    applyCamera() {
        let offsetX = 0;
        let offsetY = 0;

        if (this.shakeDuration > 0) {
            offsetX = (Math.random() - 0.5) * this.shakeIntensity;
            offsetY = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= 0.9;
            this.shakeDuration -= 0.016;
            if (this.shakeDuration <= 0) {
                this.shakeIntensity = 0;
            }
        }

        const scale = Math.min(this.width / CANVAS_WIDTH, this.height / CANVAS_HEIGHT);
        const offsetLeft = (this.width - CANVAS_WIDTH * scale) / 2;
        const offsetTop = (this.height - CANVAS_HEIGHT * scale) / 2;

        this.ctx.save();
        this.ctx.translate(offsetLeft + offsetX, offsetTop + offsetY - this.cameraY * scale);
        this.ctx.scale(scale, scale);
    }

    resetCamera() {
        this.ctx.restore();
    }

    updateCamera(ball, dt) {
        this.targetCameraY = Math.max(0, Math.min(ball.y - this.height / 3, CANVAS_HEIGHT - this.height));
        
        this.cameraY += (this.targetCameraY - this.cameraY) * 5 * dt;

        if (this.flashAlpha > 0) {
            this.flashAlpha -= dt / this.flashDuration;
            if (this.flashAlpha < 0) this.flashAlpha = 0;
        }
    }

    drawBall(ball, time) {
        const skin = ball.skin;

        if (ball.trail.length > 1) {
            for (let i = 1; i < ball.trail.length; i++) {
                const prev = ball.trail[i - 1];
                const curr = ball.trail[i];
                const alpha = curr.alpha * 0.5;
                
                this.ctx.strokeStyle = `rgba(${this.hexToRgb(skin.color1)}, ${alpha})`;
                this.ctx.lineWidth = (ball.radius * 2 * curr.alpha);
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(prev.x, prev.y);
                this.ctx.lineTo(curr.x, curr.y);
                this.ctx.stroke();
            }
        }

        this.ctx.save();
        this.ctx.translate(ball.x, ball.y);
        this.ctx.rotate(ball.rotation);
        this.ctx.scale(ball.stretch, ball.squash);

        if (ball.isInvincible) {
            const pulseSize = ball.radius * (1.3 + Math.sin(time * 10) * 0.1);
            const invincibleGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
            invincibleGradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
            invincibleGradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.2)');
            invincibleGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
            
            this.ctx.fillStyle = invincibleGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (ball.isFlying) {
            const wingGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, ball.radius * 1.8);
            wingGradient.addColorStop(0, 'rgba(147, 51, 234, 0.3)');
            wingGradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
            
            this.ctx.fillStyle = wingGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ball.radius * 1.8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (ball.isDashing) {
            const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, ball.radius * 2);
            glowGradient.addColorStop(0, `rgba(${this.hexToRgb(skin.color1)}, 0.4)`);
            glowGradient.addColorStop(0.5, `rgba(${this.hexToRgb(skin.color2)}, 0.2)`);
            glowGradient.addColorStop(1, `rgba(${this.hexToRgb(skin.color2)}, 0)`);
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ball.radius * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (skin.fire) {
            this.drawFireEffect(ball, time);
        }

        if (skin.transparent) {
            this.ctx.globalAlpha = 0.6;
        }

        const ballGradient = this.ctx.createRadialGradient(-ball.radius * 0.3, -ball.radius * 0.3, 0, 0, 0, ball.radius);
        ballGradient.addColorStop(0, skin.color1);
        ballGradient.addColorStop(0.5, skin.color2);
        ballGradient.addColorStop(1, this.darkenColor(skin.color2, 30));

        this.ctx.fillStyle = ballGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        if (skin.lines) {
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(
                    Math.cos(angle) * ball.radius,
                    Math.sin(angle) * ball.radius
                );
                this.ctx.stroke();
            }
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ball.radius * 0.6, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        if (skin.pattern === 'soccer') {
            this.ctx.fillStyle = '#000';
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                const px = Math.cos(angle) * ball.radius * 0.5;
                const py = Math.sin(angle) * ball.radius * 0.5;
                this.drawPentagon(px, py, ball.radius * 0.25);
            }
        }

        if (skin.eye) {
            this.ctx.restore();
            this.ctx.save();
            this.ctx.translate(ball.x, ball.y);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            const lookX = ball.vx * 0.02;
            const lookY = ball.vy * 0.02;
            const pupilDist = Math.min(ball.radius * 0.4, Math.hypot(lookX, lookY));
            const pupilAngle = Math.atan2(lookY, lookX);
            const pupilX = Math.cos(pupilAngle) * pupilDist;
            const pupilY = Math.sin(pupilAngle) * pupilDist;
            
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(pupilX, pupilY, ball.radius * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(pupilX - ball.radius * 0.1, pupilY - ball.radius * 0.1, ball.radius * 0.12, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            const highlightGradient = this.ctx.createRadialGradient(-ball.radius * 0.4, -ball.radius * 0.4, 0, -ball.radius * 0.3, -ball.radius * 0.3, ball.radius * 0.8);
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(-ball.radius * 0.3, -ball.radius * 0.3, ball.radius * 0.8, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        if (skin.transparent) {
            this.ctx.globalAlpha = 1;
        }

        this.ctx.restore();
    }

    drawFireEffect(ball, time) {
        for (let i = 0; i < 5; i++) {
            const offsetY = -ball.vy * (i + 1) * 0.3;
            const size = ball.radius * (1 - i * 0.15);
            const alpha = 0.6 - i * 0.1;
            
            const fireGradient = this.ctx.createRadialGradient(0, offsetY, 0, 0, offsetY, size * 1.5);
            fireGradient.addColorStop(0, `rgba(251, 191, 36, ${alpha})`);
            fireGradient.addColorStop(0.5, `rgba(249, 115, 22, ${alpha * 0.7})`);
            fireGradient.addColorStop(1, `rgba(239, 68, 68, 0)`);
            
            this.ctx.fillStyle = fireGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, offsetY, size * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawPentagon(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
        }
        return '103, 232, 249';
    }

    darkenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
        const b = Math.max(0, (num & 0x0000FF) - amount);
        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    }

    drawPlatform(platform, time) {
        this.ctx.save();

        if (platform.type === PlatformType.DISAPPEARING && !platform.visible) {
            this.ctx.globalAlpha = 0.2 + Math.sin(time * 5) * 0.1;
        }

        if (platform.type === PlatformType.DISAPPEARING && platform.visible && platform.disappearTimer > 0) {
            this.ctx.globalAlpha = 0.3 + Math.sin(time * 20) * 0.3;
        }

        let colors;
        switch (platform.type) {
            case PlatformType.MOVING:
                colors = { top: '#8b5cf6', mid: '#7c3aed', bottom: '#5b21b6', glow: 'rgba(139, 92, 246, 0.5)' };
                break;
            case PlatformType.DISAPPEARING:
                colors = { top: '#f59e0b', mid: '#d97706', bottom: '#92400e', glow: 'rgba(245, 158, 11, 0.5)' };
                break;
            case PlatformType.BOUNCE_PAD:
                colors = { top: '#22c55e', mid: '#16a34a', bottom: '#15803d', glow: 'rgba(34, 197, 94, 0.5)' };
                break;
            default:
                colors = { top: '#6366f1', mid: '#4f46e5', bottom: '#3730a3', glow: 'rgba(99, 102, 241, 0.5)' };
        }

        const platformGradient = this.ctx.createLinearGradient(
            platform.left, platform.top,
            platform.left, platform.bottom
        );
        platformGradient.addColorStop(0, colors.top);
        platformGradient.addColorStop(0.5, colors.mid);
        platformGradient.addColorStop(1, colors.bottom);

        this.ctx.fillStyle = platformGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(platform.left, platform.top, platform.width, platform.height, 8);
        this.ctx.fill();

        this.ctx.shadowColor = colors.glow;
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = `rgba(${this.hexToRgb(colors.top)}, 0.6)`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        if (platform.type === PlatformType.BOUNCE_PAD) {
            const springOffset = Math.sin(time * 8) * 2;
            this.ctx.strokeStyle = '#86efac';
            this.ctx.lineWidth = 3;
            const springY = platform.top + platform.height / 2 + springOffset;
            for (let i = 0; i < 3; i++) {
                const sx = platform.left + platform.width * (0.25 + i * 0.25);
                this.ctx.beginPath();
                for (let j = 0; j < 4; j++) {
                    const wx = sx + (j % 2 === 0 ? -6 : 6);
                    const wy = springY - 8 + j * 4;
                    if (j === 0) this.ctx.moveTo(wx, wy);
                    else this.ctx.lineTo(wx, wy);
                }
                this.ctx.stroke();
            }
            
            this.ctx.fillStyle = '#4ade80';
            this.ctx.font = 'bold 16px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(34, 197, 94, 0.8)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('↑BOUNCE↑', platform.left + platform.width / 2, platform.top - 10);
            this.ctx.shadowBlur = 0;
        }

        if (platform.type === PlatformType.MOVING) {
            this.ctx.fillStyle = '#c4b5fd';
            this.ctx.font = 'bold 14px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⟷', platform.left + platform.width / 2, platform.top + platform.height / 2 + 5);
        }

        const topGradient = this.ctx.createLinearGradient(
            platform.left, platform.top,
            platform.left, platform.top + 4
        );
        topGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        topGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = topGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(platform.left + 2, platform.top + 2, platform.width - 4, 4, 4);
        this.ctx.fill();

        if (platform.hasSpike) {
            this.drawSpikes(platform);
        }

        this.ctx.globalAlpha = 1;
        this.ctx.restore();
    }

    drawSpikes(platform) {
        const spikeHeight = 18;
        const spikeWidth = 22;
        const spikeCount = platform.spikeCount;

        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
        this.ctx.shadowBlur = 10;

        for (let i = 0; i < spikeCount; i++) {
            const spikeX = platform.left + (i + 0.5) * (platform.width / spikeCount);
            
            this.ctx.beginPath();
            
            if (platform.spikeSide === 'top') {
                this.ctx.moveTo(spikeX - spikeWidth / 2, platform.top);
                this.ctx.lineTo(spikeX, platform.top - spikeHeight);
                this.ctx.lineTo(spikeX + spikeWidth / 2, platform.top);
            } else if (platform.spikeSide === 'bottom') {
                this.ctx.moveTo(spikeX - spikeWidth / 2, platform.bottom);
                this.ctx.lineTo(spikeX, platform.bottom + spikeHeight);
                this.ctx.lineTo(spikeX + spikeWidth / 2, platform.bottom);
            } else if (platform.spikeSide === 'left') {
                const spikeY = platform.top + platform.height / 2;
                this.ctx.moveTo(platform.left, spikeY - spikeHeight / 2);
                this.ctx.lineTo(platform.left - spikeHeight, spikeY);
                this.ctx.lineTo(platform.left, spikeY + spikeHeight / 2);
            } else {
                const spikeY = platform.top + platform.height / 2;
                this.ctx.moveTo(platform.right, spikeY - spikeHeight / 2);
                this.ctx.lineTo(platform.right + spikeHeight, spikeY);
                this.ctx.lineTo(platform.right, spikeY + spikeHeight / 2);
            }
            
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.shadowBlur = 0;
    }

    drawSpinningSaw(saw, time) {
        this.ctx.save();
        this.ctx.translate(saw.x, saw.y);
        this.ctx.rotate(saw.rotation);

        const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, saw.radius * 1.5);
        glowGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        glowGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, saw.radius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        const teethCount = 12;
        this.ctx.fillStyle = '#64748b';
        this.ctx.beginPath();
        
        for (let i = 0; i < teethCount * 2; i++) {
            const angle = (i * Math.PI) / teethCount;
            const radius = i % 2 === 0 ? saw.radius : saw.radius * 0.7;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = '#dc2626';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        const innerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, saw.radius * 0.5);
        innerGradient.addColorStop(0, '#94a3b8');
        innerGradient.addColorStop(1, '#475569');
        
        this.ctx.fillStyle = innerGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, saw.radius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#1e293b';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, saw.radius * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, saw.radius * 0.12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawPowerUp(powerUp, time) {
        this.ctx.save();
        this.ctx.translate(powerUp.x, powerUp.y);
        this.ctx.rotate(time * 2);

        const pulseScale = 1 + Math.sin(time * 5) * 0.1;
        this.ctx.scale(pulseScale, pulseScale);

        let colors;
        let icon;
        switch (powerUp.type) {
            case PowerUpType.FLY:
                colors = { primary: '#a855f7', secondary: '#7c3aed', glow: 'rgba(168, 85, 247, 0.5)' };
                icon = '🪶';
                break;
            case PowerUpType.INVINCIBLE:
                colors = { primary: '#fbbf24', secondary: '#f59e0b', glow: 'rgba(251, 191, 36, 0.5)' };
                icon = '⭐';
                break;
            case PowerUpType.SLOW_MO:
                colors = { primary: '#3b82f6', secondary: '#2563eb', glow: 'rgba(59, 130, 246, 0.5)' };
                icon = '⏱️';
                break;
            default:
                colors = { primary: '#22c55e', secondary: '#16a34a', glow: 'rgba(34, 197, 94, 0.5)' };
                icon = '?';
        }

        const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.radius * 2);
        glowGradient.addColorStop(0, colors.glow);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, powerUp.radius * 2, 0, Math.PI * 2);
        this.ctx.fill();

        const hexGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.radius);
        hexGradient.addColorStop(0, colors.primary);
        hexGradient.addColorStop(1, colors.secondary);
        
        this.ctx.fillStyle = hexGradient;
        this.ctx.shadowColor = colors.glow;
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 - Math.PI / 6;
            const x = Math.cos(angle) * powerUp.radius;
            const y = Math.sin(angle) * powerUp.radius;
            
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.rotate(-time * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(icon, 0, 0);
        this.ctx.shadowBlur = 0;

        this.ctx.restore();
    }

    drawStar(star, time) {
        star.update(time);
        
        this.ctx.save();
        this.ctx.translate(star.x, star.y);
        this.ctx.rotate(star.rotation);
        this.ctx.scale(star.scale, star.scale);

        const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, star.width);
        glowGradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        glowGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, star.width, 0, Math.PI * 2);
        this.ctx.fill();

        const spikeCount = 5;
        const outerRadius = star.width / 2;
        const innerRadius = outerRadius * 0.4;

        const starGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
        starGradient.addColorStop(0, '#fef08a');
        starGradient.addColorStop(0.5, '#fbbf24');
        starGradient.addColorStop(1, '#f59e0b');

        this.ctx.fillStyle = starGradient;
        this.ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();

        for (let i = 0; i < spikeCount * 2; i++) {
            const angle = (i * Math.PI) / spikeCount - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawGem(gem, time) {
        gem.update(time);
        
        this.ctx.save();
        this.ctx.translate(gem.x, gem.y);
        this.ctx.rotate(gem.rotation);

        const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, gem.width);
        glowGradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
        glowGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, gem.width, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = gem.getGradient(this.ctx);
        this.ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
        this.ctx.shadowBlur = 20;

        const size = gem.width / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(size * 0.7, -size * 0.2);
        this.ctx.lineTo(size * 0.5, size);
        this.ctx.lineTo(-size * 0.5, size);
        this.ctx.lineTo(-size * 0.7, -size * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.2, -size * 0.6);
        this.ctx.lineTo(0, -size * 0.8);
        this.ctx.lineTo(size * 0.2, -size * 0.6);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawGoal(goal, time) {
        goal.update(time);
        
        this.ctx.save();

        const glowGradient = this.ctx.createRadialGradient(
            goal.x, goal.y, 0,
            goal.x, goal.y, goal.width
        );
        glowGradient.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
        glowGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(goal.left, goal.top - 20, goal.width, goal.height + 40, 10);
        this.ctx.fill();

        const goalGradient = goal.getGradient(this.ctx);
        
        this.ctx.fillStyle = goalGradient;
        this.ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
        this.ctx.shadowBlur = 30;
        this.ctx.beginPath();
        this.ctx.roundRect(goal.left, goal.top, goal.width, goal.height, 10);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(goal.left + 4, goal.top + 2, goal.width - 8, goal.height / 2 - 2, 4);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText('🏁 终点 🏁', goal.x, goal.y);

        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    drawParticles(particles) {
        particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    drawScorePopups(popups) {
        popups.forEach(popup => {
            this.ctx.save();
            this.ctx.globalAlpha = popup.alpha;
            this.ctx.fillStyle = popup.color;
            this.ctx.font = 'bold 20px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = popup.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(popup.text, popup.x, popup.y);
            this.ctx.restore();
        });
    }

    drawFlash() {
        if (this.flashAlpha > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.flashAlpha;
            this.ctx.fillStyle = this.flashColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
        }
    }

    drawDashLines(ball) {
        if (ball.isDashing && Math.abs(ball.vy) > 10) {
            const lineCount = 8;
            for (let i = 0; i < lineCount; i++) {
                const alpha = 1 - i / lineCount;
                const offsetY = -ball.vy * (i + 1) * 0.5;
                
                this.ctx.strokeStyle = `rgba(${this.hexToRgb(ball.skin.color1)}, ${alpha * 0.6})`;
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(ball.x - 10 + (Math.random() - 0.5) * 20, ball.y - offsetY);
                this.ctx.lineTo(ball.x + 10 + (Math.random() - 0.5) * 20, ball.y - offsetY - 30);
                this.ctx.stroke();
            }
        }
    }

    drawPowerUpHUD(ball) {
        const scale = Math.min(this.width / CANVAS_WIDTH, this.height / CANVAS_HEIGHT);
        const offsetLeft = (this.width - CANVAS_WIDTH * scale) / 2;
        const offsetTop = (this.height - CANVAS_HEIGHT * scale) / 2;
        
        this.ctx.save();
        this.ctx.translate(offsetLeft, offsetTop);
        this.ctx.scale(scale, scale);

        let yOffset = 100;
        
        if (ball.isFlying) {
            this.drawPowerUpBar('🪶 飞行', ball.flyTimer, POWER_UP_DURATION, '#a855f7', yOffset);
            yOffset += 45;
        }
        
        if (ball.isInvincible) {
            this.drawPowerUpBar('⭐ 无敌', ball.invincibleTimer, POWER_UP_DURATION, '#fbbf24', yOffset);
            yOffset += 45;
        }
        
        if (ball.slowMotion) {
            this.drawPowerUpBar('⏱️ 慢动作', ball.slowMoTimer, SLOW_MO_DURATION, '#3b82f6', yOffset);
            yOffset += 45;
        }

        this.ctx.restore();
    }

    drawPowerUpBar(label, timer, maxTime, color, y) {
        const barWidth = 180;
        const barHeight = 30;
        const x = CANVAS_WIDTH - barWidth - 20;
        const progress = Math.max(0, timer / maxTime);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, barWidth, barHeight, 8);
        this.ctx.fill();

        const gradient = this.ctx.createLinearGradient(x, y, x + barWidth, y);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.darkenColor(color, 30));
        
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 3, y + 3, (barWidth - 6) * progress, barHeight - 6, 6);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Orbitron';
        this.ctx.textAlign = 'left';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(`${label} ${timer.toFixed(1)}s`, x + 10, y + 21);
        this.ctx.shadowBlur = 0;
    }

    drawTimer(time) {
        const scale = Math.min(this.width / CANVAS_WIDTH, this.height / CANVAS_HEIGHT);
        const offsetLeft = (this.width - CANVAS_WIDTH * scale) / 2;
        const offsetTop = (this.height - CANVAS_HEIGHT * scale) / 2;
        
        this.ctx.save();
        this.ctx.translate(offsetLeft, offsetTop);
        this.ctx.scale(scale, scale);

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 100);
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.beginPath();
        this.ctx.roundRect(CANVAS_WIDTH / 2 - 80, 80, 160, 40, 8);
        this.ctx.fill();

        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = 'bold 24px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(`⏱️ ${timeStr}`, CANVAS_WIDTH / 2, 108);
        this.ctx.shadowBlur = 0;

        this.ctx.restore();
    }
}
