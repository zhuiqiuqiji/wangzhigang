class PhysicsEngine {
    constructor(gameMode = null) {
        this.ball = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 20,
            rotation: 0,
            spin: 0,
            hook: 0,
            spinVelocity: 0,
            hookVelocity: 0,
            rotationSpeed: 0,
            skin: 'classic'
        };
        
        this.pins = [];
        this.pinRadius = 12;
        this.pinHeight = 40;
        this.friction = 0.98;
        this.pinFriction = 0.95;
        this.gravity = 0.3;
        this.pinType = 'standard';
        
        if (gameMode) {
            this.setGameMode(gameMode);
        }
    }

    setGameMode(gameMode) {
        this.ball.radius = gameMode.ballRadius;
        this.pinRadius = gameMode.pinRadius;
        this.pinHeight = gameMode.pinHeight;
        this.pinType = gameMode.pinType;
    }

    initPins(centerX, startY, arrangement = null, pinType = null) {
        this.pins = [];
        const mode = gameModes.getCurrentMode();
        const positions = arrangement || gameModes.getPinArrangement(mode.id);
        this.pinType = pinType || mode.pinType;
        
        positions.forEach(pos => {
            this.pins.push({
                x: centerX + pos.rowOffsetX,
                y: startY + pos.rowOffsetY,
                knocked: false,
                vx: 0,
                vy: 0,
                rotation: 0,
                angularVel: 0,
                index: pos.index,
                type: this.pinType
            });
        });
    }

    resetBall(startX, startY) {
        this.ball.x = startX;
        this.ball.y = startY;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.rotation = 0;
        this.ball.spin = 0;
        this.ball.hook = 0;
        this.ball.spinVelocity = 0;
        this.ball.hookVelocity = 0;
        this.ball.rotationSpeed = 0;
    }

    resetPins() {
        for (const pin of this.pins) {
            pin.knocked = false;
            pin.vx = 0;
            pin.vy = 0;
            pin.rotation = 0;
            pin.angularVel = 0;
        }
    }

    removeKnockedPins() {
        this.pins = this.pins.filter(pin => !pin.knocked);
    }

    applySpinEffect() {
        if (this.ball.hookVelocity) {
            this.ball.vx += this.ball.hookVelocity;
            this.ball.hookVelocity *= 0.995;
        }
        
        if (this.ball.spinVelocity) {
            this.ball.rotation += this.ball.spinVelocity;
            this.ball.spinVelocity *= 0.98;
        }
        
        if (this.ball.rotationSpeed) {
            this.ball.rotation += this.ball.rotationSpeed;
            this.ball.rotationSpeed *= 0.99;
        }
    }

    checkBallPinCollision() {
        for (const pin of this.pins) {
            if (pin.knocked) continue;
            
            const dx = this.ball.x - pin.x;
            const dy = this.ball.y - pin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = this.ball.radius + this.pinRadius;
            
            if (distance < minDist) {
                const force = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
                
                const nx = dx / distance;
                const ny = dy / distance;
                
                const dvx = this.ball.vx - pin.vx;
                const dvy = this.ball.vy - pin.vy;
                const dvn = dvx * nx + dvy * ny;
                
                if (dvn > 0) continue;
                
                let spinMultiplier = 1;
                let angleOffset = 0;
                
                if (this.ball.spin !== 0) {
                    const spinFactor = Math.abs(this.ball.spin);
                    spinMultiplier = 1 + spinFactor * 0.5;
                    angleOffset = this.ball.spin * 0.3;
                }
                
                const restitution = 0.6;
                const impulse = -(1 + restitution) * dvn / 2 * spinMultiplier;
                
                this.ball.vx += impulse * nx;
                this.ball.vy += impulse * ny;
                
                const collisionAngle = Math.atan2(dy, dx) + angleOffset;
                pin.vx = -Math.cos(collisionAngle) * force * 0.8 * spinMultiplier;
                pin.vy = -Math.sin(collisionAngle) * force * 0.8 * spinMultiplier;
                pin.angularVel = (Math.random() - 0.5) * 15 + this.ball.spin * 5;
                
                const knockThreshold = this.getPinKnockThreshold(pin.type);
                if (force > knockThreshold) {
                    pin.knocked = true;
                }
                
                const overlap = minDist - distance;
                this.ball.x += nx * overlap / 2;
                this.ball.y += ny * overlap / 2;
                pin.x -= nx * overlap / 2;
                pin.y -= ny * overlap / 2;
            }
        }
    }

    getPinKnockThreshold(pinType) {
        switch (pinType) {
            case 'candle': return 1.5;
            case 'duck': return 3;
            default: return 2;
        }
    }

    checkPinPinCollision() {
        for (let i = 0; i < this.pins.length; i++) {
            for (let j = i + 1; j < this.pins.length; j++) {
                const pin1 = this.pins[i];
                const pin2 = this.pins[j];
                
                const dx = pin1.x - pin2.x;
                const dy = pin1.y - pin2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = this.pinRadius * 2;
                
                if (distance < minDist && distance > 0) {
                    const nx = dx / distance;
                    const ny = dy / distance;
                    
                    const dvx = pin1.vx - pin2.vx;
                    const dvy = pin1.vy - pin2.vy;
                    const dvn = dvx * nx + dvy * ny;
                    
                    if (dvn > 0) continue;
                    
                    const restitution = 0.5;
                    const impulse = -(1 + restitution) * dvn / 2;
                    
                    const force1 = Math.sqrt(pin1.vx * pin1.vx + pin1.vy * pin1.vy);
                    const force2 = Math.sqrt(pin2.vx * pin2.vx + pin2.vy * pin2.vy);
                    
                    pin1.vx += impulse * nx;
                    pin1.vy += impulse * ny;
                    pin2.vx -= impulse * nx;
                    pin2.vy -= impulse * ny;
                    
                    const chainReactionThreshold = this.getChainReactionThreshold(pin1.type);
                    if (pin1.knocked || pin2.knocked || 
                        force1 > chainReactionThreshold || force2 > chainReactionThreshold) {
                        pin1.knocked = true;
                        pin2.knocked = true;
                    }
                    
                    const overlap = (minDist - distance) / 2;
                    pin1.x += nx * overlap;
                    pin1.y += ny * overlap;
                    pin2.x -= nx * overlap;
                    pin2.y -= ny * overlap;
                }
            }
        }
    }

    getChainReactionThreshold(pinType) {
        switch (pinType) {
            case 'candle': return 1;
            case 'duck': return 2.5;
            default: return 1.5;
        }
    }

    applyPinChainReaction() {
        const standingPins = this.pins.filter(p => !p.knocked);
        const knockedPins = this.pins.filter(p => p.knocked);
        
        for (const knocked of knockedPins) {
            const knockForce = Math.sqrt(knocked.vx * knocked.vx + knocked.vy * knocked.vy);
            if (knockForce < 1) continue;
            
            for (const standing of standingPins) {
                const dx = knocked.x - standing.x;
                const dy = knocked.y - standing.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.pinRadius * 4) {
                    const proximityFactor = 1 - (distance / (this.pinRadius * 4));
                    const transferForce = knockForce * proximityFactor * 0.3;
                    
                    if (transferForce > 0.5) {
                        const angle = Math.atan2(dy, dx);
                        standing.vx = -Math.cos(angle) * transferForce;
                        standing.vy = -Math.sin(angle) * transferForce;
                        standing.angularVel = (Math.random() - 0.5) * 8;
                        
                        if (transferForce > this.getPinKnockThreshold(standing.type) * 0.5) {
                            standing.knocked = true;
                        }
                    }
                }
            }
        }
    }

    updateBall(bounds) {
        this.applySpinEffect();
        
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        this.ball.rotation += this.ball.vx * 0.05;
        
        this.ball.vx *= this.friction;
        this.ball.vy *= this.friction;
        
        if (this.ball.x - this.ball.radius < bounds.left) {
            this.ball.x = bounds.left + this.ball.radius;
            this.ball.vx *= -0.5;
        }
        if (this.ball.x + this.ball.radius > bounds.right) {
            this.ball.x = bounds.right - this.ball.radius;
            this.ball.vx *= -0.5;
        }
    }

    updatePins(bounds) {
        for (const pin of this.pins) {
            if (!pin.knocked) continue;
            
            pin.x += pin.vx;
            pin.y += pin.vy;
            pin.rotation += pin.angularVel;
            pin.angularVel *= 0.95;
            
            pin.vy += this.gravity;
            
            pin.vx *= this.pinFriction;
            pin.vy *= this.pinFriction;
            
            if (pin.x - this.pinRadius < bounds.left) {
                pin.x = bounds.left + this.pinRadius;
                pin.vx *= -0.5;
            }
            if (pin.x + this.pinRadius > bounds.right) {
                pin.x = bounds.right - this.pinRadius;
                pin.vx *= -0.5;
            }
        }
    }

    update(bounds) {
        this.updateBall(bounds);
        this.updatePins(bounds);
        this.checkBallPinCollision();
        this.checkPinPinCollision();
        this.applyPinChainReaction();
    }

    isBallMoving() {
        const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        return speed > 0.5;
    }

    arePinsMoving() {
        for (const pin of this.pins) {
            if (pin.knocked) {
                const speed = Math.sqrt(pin.vx * pin.vx + pin.vy * pin.vy);
                if (speed > 0.5) return true;
            }
        }
        return false;
    }

    getKnockedPinsCount() {
        return this.pins.filter(pin => pin.knocked).length;
    }

    getStandingPinsCount() {
        return this.pins.filter(pin => !pin.knocked).length;
    }
}
