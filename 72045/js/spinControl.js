class SpinControl {
    constructor() {
        this.spin = 0;
        this.hook = 0;
        this.rotation = 0;
        this.spinTypes = [
            {
                id: 'straight',
                name: '直线球',
                description: '球笔直前进，适合初学者',
                spin: 0,
                hook: 0,
                difficulty: 1
            },
            {
                id: 'hook',
                name: '弧线球',
                description: '球在前进过程中向左弯曲',
                spin: -0.6,
                hook: 0.8,
                difficulty: 3
            },
            {
                id: 'reverse_hook',
                name: '反弧线球',
                description: '球在前进过程中向右弯曲',
                spin: 0.6,
                hook: 0.8,
                difficulty: 3
            },
            {
                id: 'frisbee',
                name: '飞碟球',
                description: '球高速旋转，撞击后球瓶四散',
                spin: 1,
                hook: 0.3,
                difficulty: 4
            },
            {
                id: 'curve',
                name: '大曲球',
                description: '大幅度弧线，适合刁钻角度',
                spin: -0.8,
                hook: 1.2,
                difficulty: 5
            }
        ];
        
        this.currentSpinType = 'straight';
        this.manualSpin = 0;
    }

    getSpinTypes() {
        return this.spinTypes;
    }

    getCurrentSpinType() {
        return this.spinTypes.find(s => s.id === this.currentSpinType) || this.spinTypes[0];
    }

    setSpinType(spinTypeId) {
        const spinType = this.spinTypes.find(s => s.id === spinTypeId);
        if (spinType) {
            this.currentSpinType = spinTypeId;
            this.spin = spinType.spin;
            this.hook = spinType.hook;
            return true;
        }
        return false;
    }

    setManualSpin(spinValue) {
        this.manualSpin = spinValue;
        this.spin = spinValue * 0.01;
        this.hook = Math.abs(this.spin) * 1.5;
    }

    getSpinValue() {
        return this.spin;
    }

    getHookValue() {
        return this.hook;
    }

    getSpinName() {
        if (this.manualSpin !== 0) {
            if (this.manualSpin < -30) return '强左曲';
            if (this.manualSpin < -10) return '左曲';
            if (this.manualSpin > 30) return '强右曲';
            if (this.manualSpin > 10) return '右曲';
            return '微曲';
        }
        return this.getCurrentSpinType().name;
    }

    applySpinToBall(ball, speed) {
        const spinEffect = this.spin * speed * 0.02;
        const hookEffect = this.hook * speed * 0.001;
        
        ball.spin = this.spin;
        ball.hook = this.hook;
        ball.spinVelocity = spinEffect;
        ball.hookVelocity = hookEffect;
        ball.rotationSpeed = this.spin * 0.5;
    }

    updateBallSpin(ball, deltaTime = 1) {
        if (ball.hookVelocity) {
            ball.vx += ball.hookVelocity * deltaTime;
            ball.hookVelocity *= 0.995;
        }
        
        if (ball.spinVelocity) {
            ball.rotation += ball.spinVelocity * deltaTime;
            ball.spinVelocity *= 0.98;
        }
        
        if (ball.rotationSpeed) {
            ball.rotation += ball.rotationSpeed * deltaTime;
            ball.rotationSpeed *= 0.99;
        }
    }

    getTrajectoryPreview(startX, startY, angle, speed, steps = 50) {
        const points = [];
        let x = startX;
        let y = startY;
        let vx = Math.cos(angle - Math.PI / 2) * speed;
        let vy = -Math.sin(angle - Math.PI / 2) * speed;
        let hookV = this.hook * speed * 0.001;
        
        for (let i = 0; i < steps; i++) {
            points.push({ x, y });
            
            vx += hookV;
            hookV *= 0.995;
            
            x += vx;
            y += vy;
            
            vx *= 0.99;
            vy *= 0.99;
            
            if (y < 0) break;
        }
        
        return points;
    }

    getCollisionEffect(ball, pin) {
        const spinFactor = Math.abs(this.spin);
        const baseForce = 1;
        
        if (this.currentSpinType === 'frisbee') {
            return {
                forceMultiplier: 1.3,
                scatterAngle: Math.PI / 3,
                spinTransfer: 0.8
            };
        } else if (this.currentSpinType === 'hook' || this.currentSpinType === 'curve') {
            return {
                forceMultiplier: 1.1,
                scatterAngle: Math.PI / 6,
                spinTransfer: 0.5
            };
        }
        
        return {
            forceMultiplier: baseForce,
            scatterAngle: Math.PI / 8,
            spinTransfer: 0.2
        };
    }

    setupSliderListener(sliderId, valueDisplayId) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(valueDisplayId);
        
        if (slider) {
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.setManualSpin(value);
                
                if (display) {
                    display.textContent = this.getSpinName();
                }
            });
        }
    }

    reset() {
        this.spin = 0;
        this.hook = 0;
        this.manualSpin = 0;
        this.currentSpinType = 'straight';
        
        const slider = document.getElementById('spinSlider');
        if (slider) {
            slider.value = 0;
        }
        
        const display = document.getElementById('spinValue');
        if (display) {
            display.textContent = '直线球';
        }
    }

    renderControls() {
        this.setupSliderListener('spinSlider', 'spinValue');
    }

    getCurrentSpin() {
        return {
            type: this.manualSpin !== 0 ? 'manual' : this.currentSpinType,
            spin: this.spin,
            hook: this.hook
        };
    }
}

const spinControl = new SpinControl();
