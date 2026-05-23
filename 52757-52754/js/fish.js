const FishTypes = {
    CLOWNFISH: {
        name: '小丑鱼',
        width: 40,
        height: 25,
        speed: 3.0,
        catchRate: 0.8,
        coins: 1,
        color: '#ff6347',
        weight: 20,
        special: null
    },
    BLUE_TANG: {
        name: '蓝唐王鱼',
        width: 55,
        height: 35,
        speed: 2.2,
        catchRate: 0.65,
        coins: 3,
        color: '#1e90ff',
        weight: 15,
        special: null
    },
    ANGELFISH: {
        name: '神仙鱼',
        width: 60,
        height: 45,
        speed: 1.8,
        catchRate: 0.55,
        coins: 5,
        color: '#ffd700',
        weight: 12,
        special: null
    },
    BUTTERFLYFISH: {
        name: '蝴蝶鱼',
        width: 45,
        height: 30,
        speed: 2.5,
        catchRate: 0.6,
        coins: 4,
        color: '#ff69b4',
        weight: 12,
        special: null
    },
    LIONFISH: {
        name: '狮子鱼',
        width: 65,
        height: 50,
        speed: 1.5,
        catchRate: 0.45,
        coins: 8,
        color: '#dc143c',
        weight: 8,
        special: 'poison'
    },
    TUNA: {
        name: '金枪鱼',
        width: 80,
        height: 40,
        speed: 3.5,
        catchRate: 0.4,
        coins: 10,
        color: '#4682b4',
        weight: 8,
        special: 'sprint'
    },
    LANTERNFISH: {
        name: '灯笼鱼',
        width: 55,
        height: 35,
        speed: 1.6,
        catchRate: 0.55,
        coins: 6,
        color: '#4b0082',
        weight: 8,
        special: 'glow'
    },
    OCTOPUS: {
        name: '章鱼',
        width: 90,
        height: 70,
        speed: 1.2,
        catchRate: 0.3,
        coins: 15,
        color: '#9932cc',
        weight: 5,
        special: 'ink'
    },
    SHARK: {
        name: '鲨鱼',
        width: 120,
        height: 55,
        speed: 2.0,
        catchRate: 0.25,
        coins: 30,
        color: '#708090',
        weight: 5,
        special: null
    },
    MERMAID: {
        name: '美人鱼',
        width: 70,
        height: 80,
        speed: 2.3,
        catchRate: 0.2,
        coins: 50,
        color: '#20b2aa',
        weight: 3,
        special: 'dodge'
    },
    GOLDEN_FISH: {
        name: '黄金鱼',
        width: 60,
        height: 40,
        speed: 3.2,
        catchRate: 0.15,
        coins: 100,
        color: '#ffd700',
        weight: 2,
        special: 'screen_reward'
    },
    BOMB_FISH: {
        name: '炸弹鱼',
        width: 55,
        height: 45,
        speed: 2.0,
        catchRate: 0.35,
        coins: 0,
        color: '#2f4f4f',
        weight: 1,
        special: 'bomb'
    },
    DRAGON_BOSS: {
        name: '龙鱼',
        width: 200,
        height: 100,
        speed: 0.8,
        catchRate: 0.08,
        coins: 500,
        color: '#8b0000',
        weight: 0.5,
        special: 'boss'
    }
};

class Fish {
    constructor(canvasWidth, canvasHeight, type = null) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        if (!type) {
            const typeList = Object.values(FishTypes);
            const weightedTypes = typeList.map(t => ({ type: t, weight: t.weight }));
            const selected = Utils.weightedRandom(weightedTypes);
            type = selected.type;
        }
        
        this.type = type;
        this.width = type.width;
        this.height = type.height;
        this.baseSpeed = type.speed;
        this.catchRate = type.catchRate;
        this.coins = type.coins;
        this.color = type.color;
        this.name = type.name;
        this.special = type.special;
        
        this.direction = Math.random() > 0.5 ? 1 : -1;
        
        if (this.direction === 1) {
            this.x = -this.width;
        } else {
            this.x = canvasWidth + this.width;
        }
        
        const minY = 100;
        const maxY = canvasHeight - 200;
        this.y = Utils.random(minY, maxY);
        
        this.speed = this.baseSpeed * Utils.random(0.8, 1.2);
        this.angle = 0;
        this.tailAngle = 0;
        this.tailSpeed = Utils.random(8, 15);
        this.wobbleAmplitude = Utils.random(0.5, 1.5);
        this.wobbleSpeed = Utils.random(0.02, 0.04);
        this.wobbleOffset = Utils.random(0, Math.PI * 2);
        this.baseY = this.y;
        
        this.alive = true;
        this.caught = false;
        this.catchAnimation = 0;
        this.alpha = 1;
        
        this.health = this.special === 'boss' ? 3 : 1;
        this.maxHealth = this.health;
        
        this.sprinting = false;
        this.sprintTimer = 0;
        this.sprintCooldown = 0;
        
        this.dodgeCooldown = 0;
        this.dodging = false;
        this.dodgeAngle = 0;
        
        this.inkTimer = 0;
        
        this.glowPhase = 0;
        
        this.tendencyAngle = 0;
        this.flockTimer = 0;
    }
    
    update(deltaTime, bullets = [], allFishes = []) {
        if (!this.alive) return;
        
        const timeFactor = deltaTime / 16.67;
        
        if (this.caught) {
            this.catchAnimation += deltaTime * 0.005;
            this.alpha = Math.max(0, 1 - this.catchAnimation);
            this.y -= 2 * timeFactor;
            
            if (this.catchAnimation >= 1) {
                this.alive = false;
            }
            return;
        }
        
        this.updateAI(deltaTime, bullets, allFishes, timeFactor);
        
        let currentSpeed = this.speed;
        if (this.sprinting) {
            currentSpeed *= 2;
            this.sprintTimer -= deltaTime;
            if (this.sprintTimer <= 0) {
                this.sprinting = false;
                this.sprintCooldown = Utils.random(3000, 6000);
            }
        } else if (this.sprintCooldown > 0) {
            this.sprintCooldown -= deltaTime;
        } else if (this.special === 'sprint' && Math.random() < 0.002) {
            this.sprinting = true;
            this.sprintTimer = Utils.random(1500, 3000);
        }
        
        if (this.special === 'glow') {
            this.glowPhase += deltaTime * 0.003;
        }
        
        if (this.inkTimer > 0) {
            this.inkTimer -= deltaTime;
        }
        
        if (this.dodgeCooldown > 0) {
            this.dodgeCooldown -= deltaTime;
        }
        
        if (this.dodging) {
            this.tendencyAngle = this.dodgeAngle;
            this.dodging = false;
        } else {
            this.tendencyAngle *= 0.95;
        }
        
        const moveAngle = this.tendencyAngle;
        this.x += Math.cos(moveAngle) * currentSpeed * this.direction * timeFactor;
        this.y += Math.sin(moveAngle) * currentSpeed * timeFactor;
        this.baseY += Math.sin(moveAngle) * currentSpeed * timeFactor * 0.5;
        
        this.wobbleOffset += this.wobbleSpeed * timeFactor;
        this.y = this.baseY + Math.sin(this.wobbleOffset) * this.wobbleAmplitude * 10;
        
        this.tailAngle = Math.sin(Date.now() * 0.001 * this.tailSpeed) * 0.3;
        
        if (this.direction === 1) {
            this.angle = Math.atan2(this.y - this.baseY, this.speed * 10) * 0.1 + moveAngle * 0.3;
        } else {
            this.angle = Math.atan2(this.y - this.baseY, -this.speed * 10) * 0.1 + moveAngle * 0.3;
        }
        
        this.baseY = Utils.clamp(this.baseY, 80, this.canvasHeight - 180);
        
        if (this.x < -this.width * 2 || this.x > this.canvasWidth + this.width * 2) {
            this.alive = false;
        }
    }
    
    updateAI(deltaTime, bullets, allFishes, timeFactor) {
        if (this.special === 'dodge' && this.dodgeCooldown <= 0) {
            for (const bullet of bullets) {
                if (!bullet.active || bullet.collided) continue;
                
                const dist = Utils.distance(this.x, this.y, bullet.x, bullet.y);
                if (dist < 150) {
                    const bulletAngle = Math.atan2(bullet.vy, bullet.vx);
                    const perpAngle = bulletAngle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
                    this.dodgeAngle = perpAngle;
                    this.dodging = true;
                    this.dodgeCooldown = 1000;
                    break;
                }
            }
        }
        
        if (this.flockTimer <= 0) {
            this.flockTimer = 500;
            let avgAngle = 0;
            let neighborCount = 0;
            
            for (const fish of allFishes) {
                if (fish === this || !fish.alive || fish.caught) continue;
                if (fish.type !== this.type) continue;
                
                const dist = Utils.distance(this.x, this.y, fish.x, fish.y);
                if (dist < 200) {
                    const angleToFish = Utils.angle(this.x, this.y, fish.x, fish.y);
                    avgAngle += angleToFish;
                    neighborCount++;
                }
            }
            
            if (neighborCount > 0) {
                avgAngle /= neighborCount;
                this.tendencyAngle = Utils.lerp(this.tendencyAngle, avgAngle * 0.3, 0.05);
            }
        } else {
            this.flockTimer -= deltaTime;
        }
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        if (this.special === 'glow') {
            const glowIntensity = (Math.sin(this.glowPhase) + 1) / 2;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20 + glowIntensity * 30;
        }
        
        if (this.special === 'screen_reward') {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 30;
        }
        
        if (this.special === 'boss') {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 40;
        }
        
        ctx.translate(this.x, this.y);
        
        if (this.direction === -1) {
            ctx.scale(-1, 1);
        }
        
        ctx.rotate(this.angle);
        
        if (this.caught) {
            ctx.globalAlpha = this.alpha * 0.5;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = this.alpha;
        }
        
        this.drawFish(ctx);
        
        ctx.restore();
        
        if (this.special === 'boss' && this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }
        
        if (this.inkTimer > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(0.6, this.inkTimer / 1000);
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    drawFish(ctx) {
        switch (this.special) {
            case 'boss':
                this.drawDragon(ctx);
                break;
            case 'bomb':
                this.drawBombFish(ctx);
                break;
            case 'screen_reward':
                this.drawGoldenFish(ctx);
                break;
            case 'glow':
                this.drawLanternFish(ctx);
                break;
            case 'poison':
                this.drawLionFish(ctx);
                break;
            case 'sprint':
                this.drawTuna(ctx);
                break;
            case 'ink':
                this.drawOctopus(ctx);
                break;
            case 'dodge':
                this.drawMermaid(ctx);
                break;
            default:
                Utils.drawFishBody(ctx, 0, 0, this.width, this.height, this.color, this.tailAngle);
                this.drawSpeciesDetails(ctx);
        }
    }
    
    drawSpeciesDetails(ctx) {
        if (this.type === FishTypes.CLOWNFISH) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(-this.width * 0.2, -this.height * 0.4, this.width * 0.15, this.height * 0.8);
            ctx.fillRect(this.width * 0.1, -this.height * 0.4, this.width * 0.15, this.height * 0.8);
        } else if (this.type === FishTypes.SHARK) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(-this.width * 0.1, -this.height * 0.5);
            ctx.lineTo(-this.width * 0.3, -this.height * 1.2);
            ctx.lineTo(-this.width * 0.5, -this.height * 0.5);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.fillRect(-this.width * 0.3, this.height * 0.2, this.width * 0.6, this.height * 0.25);
            
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(-this.width * 0.2 + i * this.width * 0.1, this.height * 0.2);
                ctx.lineTo(-this.width * 0.15 + i * this.width * 0.1, this.height * 0.45);
                ctx.lineTo(-this.width * 0.1 + i * this.width * 0.1, this.height * 0.2);
                ctx.closePath();
                ctx.fill();
            }
        } else if (this.type === FishTypes.BUTTERFLYFISH) {
            ctx.fillStyle = '#000';
            ctx.fillRect(-this.width * 0.25, -this.height * 0.45, this.width * 0.08, this.height * 0.9);
            ctx.fillRect(this.width * 0.05, -this.height * 0.45, this.width * 0.08, this.height * 0.9);
        } else if (this.type === FishTypes.ANGELFISH) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.width * 0.2, -this.height * 0.3);
            ctx.lineTo(this.width * 0.4, -this.height * 0.8);
            ctx.lineTo(this.width * 0.1, -this.height * 0.4);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    drawLionFish(ctx) {
        Utils.drawFishBody(ctx, 0, 0, this.width, this.height, this.color, this.tailAngle);
        
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 7; i++) {
            const x = -this.width * 0.3 + i * this.width * 0.1;
            ctx.beginPath();
            ctx.moveTo(x, -this.height * 0.3);
            ctx.lineTo(x - 5, -this.height * 1.2);
            ctx.lineTo(x + 5, -this.height * 1.2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = '#ff4500';
        for (let i = 0; i < 5; i++) {
            const x = -this.width * 0.2 + i * this.width * 0.12;
            ctx.beginPath();
            ctx.moveTo(x, this.height * 0.2);
            ctx.lineTo(x - 3, this.height * 0.7);
            ctx.lineTo(x + 3, this.height * 0.7);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    drawTuna(ctx) {
        Utils.drawFishBody(ctx, 0, 0, this.width, this.height, this.color, this.tailAngle);
        
        ctx.fillStyle = '#2f4f4f';
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.1, -this.height * 0.4);
        ctx.lineTo(-this.width * 0.2, -this.height * 0.9);
        ctx.lineTo(-this.width * 0.3, -this.height * 0.4);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(-this.width * 0.25, this.height * 0.15, this.width * 0.5, this.height * 0.2);
        
        if (this.sprinting) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-this.width * 0.6 - i * 15, -this.height * 0.1);
                ctx.lineTo(-this.width * 0.4 - i * 15, 0);
                ctx.lineTo(-this.width * 0.6 - i * 15, this.height * 0.1);
                ctx.stroke();
            }
        }
    }
    
    drawLanternFish(ctx) {
        Utils.drawFishBody(ctx, 0, 0, this.width, this.height, this.color, this.tailAngle);
        
        const glowIntensity = (Math.sin(this.glowPhase) + 1) / 2;
        ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + glowIntensity * 0.5})`;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20 + glowIntensity * 20;
        ctx.beginPath();
        ctx.arc(this.width * 0.3, -this.height * 0.5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.width * 0.3, -this.height * 0.4);
        ctx.quadraticCurveTo(this.width * 0.4, -this.height * 0.7, this.width * 0.3, -this.height * 0.5);
        ctx.stroke();
    }
    
    drawOctopus(ctx) {
        const time = Date.now() * 0.003;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width * 0.4, this.height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const tentacleLength = this.height * 0.6;
            const wave = Math.sin(time + i * 0.5) * 10;
            
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * this.width * 0.3, Math.sin(angle) * this.height * 0.4);
            ctx.quadraticCurveTo(
                Math.cos(angle) * (this.width * 0.5 + wave),
                Math.sin(angle) * (this.height * 0.6 + wave),
                Math.cos(angle) * tentacleLength,
                Math.sin(angle) * tentacleLength + wave
            );
            ctx.stroke();
        }
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-this.width * 0.1, -this.height * 0.1, 8, 0, Math.PI * 2);
        ctx.arc(this.width * 0.1, -this.height * 0.1, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-this.width * 0.1, -this.height * 0.1, 4, 0, Math.PI * 2);
        ctx.arc(this.width * 0.1, -this.height * 0.1, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawMermaid(ctx) {
        ctx.fillStyle = '#20b2aa';
        ctx.beginPath();
        ctx.ellipse(0, this.height * 0.1, this.width * 0.25, this.height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const tailTime = Date.now() * 0.005;
        ctx.fillStyle = '#00ced1';
        ctx.save();
        ctx.translate(-this.width * 0.2, this.height * 0.3);
        ctx.rotate(Math.sin(tailTime) * 0.3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-this.width * 0.2, this.height * 0.2, -this.width * 0.3, this.height * 0.1);
        ctx.quadraticCurveTo(-this.width * 0.4, 0, -this.width * 0.3, -this.height * 0.1);
        ctx.quadraticCurveTo(-this.width * 0.2, -this.height * 0.2, 0, 0);
        ctx.fill();
        ctx.restore();
        
        ctx.fillStyle = '#ffe4c4';
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.2, this.width * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 5; i++) {
            const starAngle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const starX = Math.cos(starAngle) * this.width * 0.2;
            const starY = -this.height * 0.35 + Math.sin(starAngle) * this.height * 0.1;
            this.drawStar(ctx, starX, starY, 5, 6, 3);
        }
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-this.width * 0.05, -this.height * 0.22, 3, 0, Math.PI * 2);
        ctx.arc(this.width * 0.05, -this.height * 0.22, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.15, 5, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    }
    
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
    
    drawGoldenFish(ctx) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#fff7e0');
        gradient.addColorStop(0.5, '#ffd700');
        gradient.addColorStop(1, '#b8860b');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width * 0.3 - i * 8, this.height * 0.3 - i * 5, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        const tailWidth = this.width * 0.4;
        const tailHeight = this.height * 0.6;
        ctx.save();
        ctx.translate(-this.width / 2 - tailWidth * 0.3, 0);
        ctx.rotate(this.tailAngle);
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(0, -tailHeight / 2);
        ctx.lineTo(-tailWidth, 0);
        ctx.lineTo(0, tailHeight / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        const eyeX = this.width * 0.25;
        const eyeY = -this.height * 0.1;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, this.height * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(eyeX + 2, eyeY, this.height * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        const sparkleTime = Date.now() * 0.005;
        for (let i = 0; i < 4; i++) {
            const angle = sparkleTime + i * Math.PI / 2;
            const dist = this.width * 0.4 + Math.sin(sparkleTime * 2 + i) * 10;
            const sx = Math.cos(angle) * dist;
            const sy = Math.sin(angle) * dist;
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawBombFish(ctx) {
        ctx.fillStyle = '#2f4f4f';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width * 0.35 - i * 6, this.height * 0.35 - i * 4, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-3, -this.height * 0.55, 6, this.height * 0.2);
        
        const fuseTime = Date.now() * 0.01;
        ctx.fillStyle = Math.sin(fuseTime) > 0 ? '#ff4500' : '#ffff00';
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.6, 6, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeX = this.width * 0.2;
        const eyeY = -this.height * 0.1;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, this.height * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, this.height * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY + this.height * 0.2, this.height * 0.1, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
    }
    
    drawDragon(ctx) {
        const time = Date.now() * 0.002;
        
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width * 0.4, this.height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#b22222';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time * 0.5;
            const scaleX = 1 + Math.sin(time + i) * 0.1;
            const scaleY = 1 + Math.cos(time + i) * 0.1;
            
            ctx.save();
            ctx.translate(Math.cos(angle) * this.width * 0.3, Math.sin(angle) * this.height * 0.3);
            ctx.scale(scaleX, scaleY);
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 5; i++) {
            const x = -this.width * 0.3 + i * this.width * 0.15;
            ctx.beginPath();
            ctx.moveTo(x, -this.height * 0.35);
            ctx.lineTo(x - this.width * 0.05, -this.height * 0.55);
            ctx.lineTo(x + this.width * 0.05, -this.height * 0.55);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.ellipse(this.width * 0.35, 0, this.width * 0.2, this.height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const hornWave = Math.sin(time * 2) * 5;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(this.width * 0.4, -this.height * 0.3);
        ctx.lineTo(this.width * 0.5, -this.height * 0.6 + hornWave);
        ctx.lineTo(this.width * 0.45, -this.height * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.width * 0.5, -this.height * 0.3);
        ctx.lineTo(this.width * 0.6, -this.height * 0.55 - hornWave);
        ctx.lineTo(this.width * 0.55, -this.height * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.width * 0.42, -this.height * 0.08, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width * 0.42, -this.height * 0.08, 4, 0, Math.PI * 2);
        ctx.fill();
        
        const tailWave = Math.sin(time * 3) * 15;
        ctx.fillStyle = '#8b0000';
        ctx.save();
        ctx.translate(-this.width * 0.4, 0);
        ctx.rotate(Math.sin(time) * 0.2);
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.3);
        ctx.lineTo(-this.width * 0.3, -this.height * 0.4 + tailWave);
        ctx.lineTo(-this.width * 0.35, 0);
        ctx.lineTo(-this.width * 0.3, this.height * 0.4 - tailWave);
        ctx.lineTo(0, this.height * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        const whiskerWave = Math.sin(time * 4) * 8;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.width * 0.55, this.height * 0.1);
        ctx.quadraticCurveTo(this.width * 0.7, this.height * 0.2 + whiskerWave, this.width * 0.75, this.height * 0.05);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.width * 0.55, this.height * 0.15);
        ctx.quadraticCurveTo(this.width * 0.7, this.height * 0.3 - whiskerWave, this.width * 0.75, this.height * 0.25);
        ctx.stroke();
    }
    
    drawHealthBar(ctx) {
        const barWidth = this.width * 0.8;
        const barHeight = 8;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height * 0.8;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        let healthColor = '#ff0000';
        if (healthPercent > 0.6) healthColor = '#00ff00';
        else if (healthPercent > 0.3) healthColor = '#ffff00';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
    
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height,
            centerX: this.x,
            centerY: this.y,
            radius: Math.max(this.width, this.height) / 2
        };
    }
    
    tryCatch(catchBonus = 0) {
        const actualCatchRate = Math.min(0.95, this.catchRate + catchBonus);
        
        if (this.special === 'boss') {
            if (Math.random() < actualCatchRate * 0.5) {
                this.health--;
                if (this.health <= 0) {
                    this.caught = true;
                    return true;
                }
                return 'boss_hit';
            }
            return false;
        }
        
        if (Math.random() < actualCatchRate) {
            if (this.special === 'ink') {
                this.inkTimer = 2000;
            }
            this.caught = true;
            return true;
        }
        return false;
    }
    
    releaseInk() {
        this.inkTimer = 2000;
    }
}
