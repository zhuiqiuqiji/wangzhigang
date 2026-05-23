class Car {
    constructor(x, y, angle, configType = 'balanced', isPlayer = true, aiStyle = null, difficulty = 'normal') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        
        this.vx = 0;
        this.vy = 0;
        this.speed = 0;
        this.angularVelocity = 0;
        
        this.isPlayer = isPlayer;
        this.configType = configType;
        
        const config = CarConfigs[configType] || CarConfigs.balanced;
        this.carName = config.name;
        this.baseMaxSpeed = config.maxSpeed;
        this.baseAcceleration = config.acceleration;
        this.friction = config.friction;
        this.turnSpeed = config.turnSpeed;
        this.driftFactor = config.driftFactor;
        this.grip = config.grip;
        this.mass = config.mass;
        this.color = config.color;
        this.nitroEfficiency = config.nitroEfficiency;
        
        this.aiStyle = aiStyle;
        this.difficulty = difficulty;
        if (aiStyle && AIStyles[aiStyle]) {
            this.aiConfig = AIStyles[aiStyle];
            this.difficultyConfig = DifficultyLevels[difficulty] || DifficultyLevels.normal;
        }
        
        this.width = 25;
        this.height = 45;
        this.collisionDeceleration = 0.5;
        
        this.isColliding = false;
        this.driftAngle = 0;
        this.driftTrails = [];
        this.maxTrails = 30;
        
        this.nitro = 0;
        this.maxNitro = 100;
        this.nitroActive = false;
        this.nitroMultiplier = 1.8;
        this.nitroDrainRate = 1.5;
        this.driftNitroGain = 0.3;
        
        this.damage = 0;
        this.maxDamage = 100;
        this.damageDeceleration = 1;
        
        this.centrifugalForce = 0;
        this.loadTransfer = 0;
        
        this.wheelAngle = 0;
        this.maxWheelAngle = 0.6;
        
        this.particleSystem = null;
    }

    setParticleSystem(system) {
        this.particleSystem = system;
    }

    update(keys, deltaTime, track, checkpointManager = null) {
        if (this.isPlayer) {
            this.handlePlayerInput(keys, deltaTime);
        } else {
            this.handleAI(track, checkpointManager, deltaTime);
        }
        
        this.applyPhysics(deltaTime);
        this.checkCollision(track);
        this.updateNitro(deltaTime);
        this.updateDamage(deltaTime);
        this.updateDriftTrails(deltaTime);
        
        if (this.particleSystem) {
            this.emitParticles(deltaTime);
        }
    }

    handlePlayerInput(keys, deltaTime) {
        const dt = deltaTime * 60;
        const forward = Math.cos(this.angle);
        const right = Math.sin(this.angle);
        
        let effectiveMaxSpeed = this.baseMaxSpeed * (1 - this.damage * 0.003);
        let effectiveAcceleration = this.baseAcceleration * (1 - this.damage * 0.002);
        
        if (this.nitroActive && this.nitro > 0) {
            effectiveMaxSpeed *= this.nitroMultiplier;
            effectiveAcceleration *= this.nitroMultiplier;
        }
        
        if (keys.up) {
            this.vx += forward * effectiveAcceleration * dt;
            this.vy += right * effectiveAcceleration * dt;
        }
        if (keys.down) {
            this.vx -= forward * effectiveAcceleration * 0.6 * dt;
            this.vy -= right * effectiveAcceleration * 0.6 * dt;
        }
        
        if (keys.nitro && this.nitro > 0) {
            this.nitroActive = true;
        } else {
            this.nitroActive = false;
        }
        
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const turnFactor = Utils.clamp(speed / 3, 0.2, 1);
        const gripFactor = Utils.clamp(this.grip * (1 - this.damage * 0.002), 0.5, 1.5);
        
        const targetWheelAngle = this.maxWheelAngle * turnFactor * gripFactor;
        
        const lerpAmount = 1 - Math.pow(0.7, dt);
        const lerpAmountZero = 1 - Math.pow(0.8, dt);
        
        if (keys.left && speed > 0.3) {
            this.wheelAngle = Utils.lerp(this.wheelAngle, -targetWheelAngle, lerpAmount);
        } else if (keys.right && speed > 0.3) {
            this.wheelAngle = Utils.lerp(this.wheelAngle, targetWheelAngle, lerpAmount);
        } else {
            this.wheelAngle = Utils.lerp(this.wheelAngle, 0, lerpAmountZero);
        }
        
        this.angle += this.wheelAngle * turnFactor * dt;
        
        if (speed > effectiveMaxSpeed) {
            this.vx = (this.vx / speed) * effectiveMaxSpeed;
            this.vy = (this.vy / speed) * effectiveMaxSpeed;
        }
        
        if (Math.abs(this.driftAngle) > 0.3 && speed > 2) {
            this.nitro = Math.min(this.maxNitro, this.nitro + Math.abs(this.driftAngle) * this.driftNitroGain * this.nitroEfficiency * dt);
        }
    }

    handleAI(track, checkpointManager, deltaTime) {
        if (!checkpointManager) return;
        
        const dt = deltaTime * 60;
        
        const checkpoints = checkpointManager.checkpoints;
        const currentIdx = checkpointManager.currentCheckpoint;
        const nextCheckpoint = checkpoints[currentIdx];
        
        if (!nextCheckpoint) return;
        
        const lookAhead = Math.floor(this.speed * 3);
        const futureIdx = (currentIdx + lookAhead) % checkpoints.length;
        const futureCheckpoint = checkpoints[futureIdx] || nextCheckpoint;
        
        const targetX = Utils.lerp(nextCheckpoint.x, futureCheckpoint.x, this.aiConfig.idealLineBias);
        const targetY = Utils.lerp(nextCheckpoint.y, futureCheckpoint.y, this.aiConfig.idealLineBias);
        
        const targetAngle = Math.atan2(targetY - this.y, targetX - this.x);
        let angleDiff = targetAngle - this.angle;
        
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.random() < this.aiConfig.mistakeChance * this.difficultyConfig.mistakeMultiplier * dt) {
            angleDiff += (Math.random() - 0.5) * 0.5;
        }
        
        const speed = this.speed;
        const turnFactor = Utils.clamp(speed / 3, 0.2, 1);
        const gripFactor = Utils.clamp(this.grip, 0.5, 1.5);
        
        const aiTurnSpeed = this.turnSpeed * this.aiConfig.turnMultiplier * this.difficultyConfig.speedMultiplier;
        
        const targetWheelAngle = this.maxWheelAngle * turnFactor * gripFactor;
        
        if (angleDiff < -0.05) {
            this.wheelAngle = Utils.lerp(this.wheelAngle, -targetWheelAngle, 0.25 * dt);
        } else if (angleDiff > 0.05) {
            this.wheelAngle = Utils.lerp(this.wheelAngle, targetWheelAngle, 0.25 * dt);
        } else {
            this.wheelAngle = Utils.lerp(this.wheelAngle, 0, 0.2 * dt);
        }
        
        this.angle += this.wheelAngle * turnFactor * this.difficultyConfig.speedMultiplier * dt;
        
        const forward = Math.cos(this.angle);
        const right = Math.sin(this.angle);
        
        const distToCheckpoint = Utils.distance(this.x, this.y, nextCheckpoint.x, nextCheckpoint.y);
        const shouldBrake = Math.abs(angleDiff) > this.aiConfig.brakeThreshold && distToCheckpoint < 150;
        
        if (Math.abs(this.driftAngle) > 0.3 && speed > 2) {
            this.nitro = Math.min(this.maxNitro, this.nitro + Math.abs(this.driftAngle) * this.driftNitroGain * this.nitroEfficiency * dt);
        }
        
        let nitroBoost = 1;
        if (this.nitroActive && this.nitro > 0) {
            nitroBoost = this.nitroMultiplier;
        }
        
        const effectiveAcceleration = this.baseAcceleration * this.aiConfig.accelerationMultiplier * this.difficultyConfig.speedMultiplier * nitroBoost;
        const effectiveMaxSpeed = this.baseMaxSpeed * this.difficultyConfig.speedMultiplier * nitroBoost;
        
        if (!shouldBrake) {
            this.vx += forward * effectiveAcceleration * dt;
            this.vy += right * effectiveAcceleration * dt;
        } else {
            const brakeFactor = Math.pow(0.97, dt);
            this.vx *= brakeFactor;
            this.vy *= brakeFactor;
        }
        
        if (speed > effectiveMaxSpeed) {
            this.vx = (this.vx / speed) * effectiveMaxSpeed;
            this.vy = (this.vy / speed) * effectiveMaxSpeed;
        }
        
        if (this.nitro > 0) {
            if (this.aiConfig.nitroUsage === 'aggressive' && speed > effectiveMaxSpeed * 0.7 && Math.abs(angleDiff) < 0.3) {
                this.nitroActive = true;
            } else if (this.aiConfig.nitroUsage === 'drift' && Math.abs(this.driftAngle) > 0.5) {
                this.nitroActive = true;
            } else if (this.aiConfig.nitroUsage === 'balanced' && speed > effectiveMaxSpeed * 0.6 && Math.abs(angleDiff) < 0.35) {
                this.nitroActive = true;
            } else if (this.aiConfig.nitroUsage === 'conservative' && speed > effectiveMaxSpeed * 0.5 && Math.abs(angleDiff) < 0.4) {
                this.nitroActive = true;
            } else {
                this.nitroActive = false;
            }
        } else {
            this.nitroActive = false;
        }
    }

    applyPhysics(deltaTime) {
        const dt = deltaTime * 60;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.speed = speed;
        
        const forward = Math.cos(this.angle);
        const right = Math.sin(this.angle);
        
        const forwardVelocity = this.vx * forward + this.vy * right;
        const rightVelocity = -this.vx * right + this.vy * forward;
        
        this.driftAngle = rightVelocity / (forwardVelocity + 0.1);
        
        const lateralG = Math.abs(rightVelocity) / 10;
        this.centrifugalForce = lateralG * this.mass * 0.001;
        
        const effectiveGrip = Utils.clamp(this.grip - this.centrifugalForce * 0.1, 0.3, 1.5);
        const newRightVelocity = rightVelocity * (this.driftFactor / effectiveGrip);
        
        this.vx = forward * forwardVelocity - right * newRightVelocity;
        this.vy = right * forwardVelocity + forward * newRightVelocity;
        
        const rollingResistance = Math.pow(0.995, dt);
        const airResistance = Math.pow(Math.max(0.998 - speed * 0.001, 0.98), dt);
        const totalFriction = Math.pow(this.friction, dt) * rollingResistance * airResistance;
        
        this.vx *= totalFriction;
        this.vy *= totalFriction;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.loadTransfer = Math.abs(forwardVelocity) * 0.05;
    }

    checkCollision(track) {
        const corners = this.getCorners();
        let onTrack = true;
        let collisionPoint = null;
        
        for (const corner of corners) {
            if (!track.isOnTrack(corner.x, corner.y)) {
                onTrack = false;
                collisionPoint = corner;
                break;
            }
        }
        
        if (!onTrack && !this.isColliding) {
            this.isColliding = true;
            
            const impactSpeed = this.speed;
            this.vx *= this.collisionDeceleration;
            this.vy *= this.collisionDeceleration;
            
            this.damage = Math.min(this.maxDamage, this.damage + impactSpeed * 2);
            
            if (this.particleSystem && collisionPoint) {
                this.particleSystem.emitCollision(collisionPoint.x, collisionPoint.y, this.angle);
            }
        } else if (onTrack) {
            this.isColliding = false;
        }
    }

    updateNitro(deltaTime) {
        const dt = deltaTime * 60;
        if (this.nitroActive && this.nitro > 0) {
            this.nitro = Math.max(0, this.nitro - this.nitroDrainRate * dt);
        }
        
        if (this.nitro <= 0) {
            this.nitroActive = false;
        }
    }

    updateDamage(deltaTime) {
        this.damageDeceleration = 1 - (this.damage / this.maxDamage) * 0.3;
    }

    getCorners() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        const hw = this.width / 2;
        const hh = this.height / 2;
        
        return [
            { x: this.x + cos * hh - sin * hw, y: this.y + sin * hh + cos * hw },
            { x: this.x + cos * hh + sin * hw, y: this.y + sin * hh - cos * hw },
            { x: this.x - cos * hh + sin * hw, y: this.y - sin * hh - cos * hw },
            { x: this.x - cos * hh - sin * hw, y: this.y - sin * hh + cos * hw }
        ];
    }

    updateDriftTrails(deltaTime) {
        const dt = deltaTime * 60;
        
        if (this.speed > 2 && Math.abs(this.driftAngle) > 0.25) {
            const cos = Math.cos(this.angle);
            const sin = Math.sin(this.angle);
            
            const leftX = this.x - cos * (this.height / 2) - sin * (this.width / 2);
            const leftY = this.y - sin * (this.height / 2) + cos * (this.width / 2);
            const rightX = this.x - cos * (this.height / 2) + sin * (this.width / 2);
            const rightY = this.y - sin * (this.height / 2) - cos * (this.width / 2);
            
            this.driftTrails.push({
                x1: leftX,
                y1: leftY,
                x2: rightX,
                y2: rightY,
                alpha: 1,
                intensity: Math.abs(this.driftAngle)
            });
            
            if (this.particleSystem && Math.random() < 0.3 * dt) {
                this.particleSystem.emitDriftSmoke(leftX, leftY);
                this.particleSystem.emitDriftSmoke(rightX, rightY);
            }
            
            if (this.driftTrails.length > this.maxTrails) {
                this.driftTrails.shift();
            }
        }
        
        this.driftTrails = this.driftTrails.filter(trail => {
            trail.alpha -= 0.03 * dt;
            return trail.alpha > 0;
        });
    }

    emitParticles(deltaTime) {
        const dt = deltaTime * 60;
        
        if (this.nitroActive && this.nitro > 0) {
            this.particleSystem.emitNitro(this.x, this.y, this.angle);
        } else if (this.speed > 1) {
            if (Math.random() < 0.2 * dt) {
                this.particleSystem.emitSmoke(this.x, this.y, this.angle);
            }
        }
        
        if (this.isColliding && this.particleSystem) {
            this.particleSystem.emitSparks(this.x, this.y, this.angle);
        }
    }

    draw(ctx) {
        this.drawDriftTrails(ctx);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        if (this.isPlayer || this.speed > 1) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = this.nitroActive ? 30 : 15;
        }
        
        const bodyColor = this.damage > 50 ? this.darkenColor(this.color, this.damage * 0.3) : this.color;
        
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, bodyColor);
        gradient.addColorStop(0.5, this.lightenColor(bodyColor, 20));
        gradient.addColorStop(1, bodyColor);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, -this.height / 4);
        ctx.lineTo(this.width / 2, this.height / 3);
        ctx.lineTo(this.width / 3, this.height / 2);
        ctx.lineTo(-this.width / 3, this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 3);
        ctx.lineTo(-this.width / 2, -this.height / 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = this.isColliding ? '#ff0000' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.save();
        ctx.translate(0, 0);
        ctx.rotate(this.wheelAngle * 0.5);
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 6, this.width / 3, this.height / 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        if (this.damage > 0) {
            ctx.fillStyle = `rgba(50, 50, 50, ${this.damage / 200})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const flameIntensity = Utils.clamp(this.speed / this.baseMaxSpeed, 0, 1);
        const nitroIntensity = this.nitroActive ? 1.5 : 1;
        
        if (this.speed > 1 || this.nitroActive) {
            const flameColor = this.nitroActive ? '0, 255, 255' : '255, 150, 0';
            
            ctx.fillStyle = `rgba(${flameColor}, ${flameIntensity * nitroIntensity * 0.8})`;
            ctx.beginPath();
            ctx.moveTo(-this.width / 4, this.height / 2);
            ctx.lineTo(0, this.height / 2 + flameIntensity * 25 * nitroIntensity);
            ctx.lineTo(this.width / 4, this.height / 2);
            ctx.closePath();
            ctx.fill();
            
            if (this.nitroActive) {
                ctx.fillStyle = `rgba(255, 255, 255, ${flameIntensity * 0.6})`;
                ctx.beginPath();
                ctx.moveTo(-this.width / 6, this.height / 2);
                ctx.lineTo(0, this.height / 2 + flameIntensity * 15);
                ctx.lineTo(this.width / 6, this.height / 2);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        if (this.isPlayer) {
            this.drawNitroBar(ctx);
        }
    }

    drawNitroBar(ctx) {
        const barWidth = 50;
        const barHeight = 6;
        const x = this.x - barWidth / 2;
        const y = this.y - this.height - 15;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        const nitroRatio = this.nitro / this.maxNitro;
        const nitroColor = nitroRatio > 0.3 ? '#00ffff' : '#ff6600';
        
        ctx.fillStyle = nitroColor;
        ctx.shadowColor = nitroColor;
        ctx.shadowBlur = this.nitroActive ? 10 : 5;
        ctx.fillRect(x, y, barWidth * nitroRatio, barHeight);
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    drawDriftTrails(ctx) {
        this.driftTrails.forEach(trail => {
            const alpha = trail.alpha * Utils.clamp(trail.intensity, 0.3, 1);
            ctx.strokeStyle = `rgba(40, 40, 40, ${alpha})`;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(trail.x1, trail.y1);
            ctx.lineTo(trail.x2, trail.y2);
            ctx.stroke();
        });
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        return this.lightenColor(color, -percent);
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getAngle() {
        return this.angle;
    }

    getNitroPercentage() {
        return (this.nitro / this.maxNitro) * 100;
    }

    getDamagePercentage() {
        return (this.damage / this.maxDamage) * 100;
    }

    repair(amount = 20) {
        this.damage = Math.max(0, this.damage - amount);
    }

    reset(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.vx = 0;
        this.vy = 0;
        this.speed = 0;
        this.isColliding = false;
        this.driftTrails = [];
        this.nitro = 0;
        this.nitroActive = false;
        this.damage = 0;
        this.wheelAngle = 0;
    }
}
