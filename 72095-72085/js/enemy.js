class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.shootTimer = 0;
        this.moveTimer = 0;
        this.startX = x;
        this.startY = y;
        this.rotation = 0;

        this.setTypeProperties();
    }

    setTypeProperties() {
        switch (this.type) {
            case 'basic':
                this.width = 35;
                this.height = 35;
                this.hp = 2;
                this.maxHp = 2;
                this.speed = 1;
                this.shootInterval = 1500;
                this.points = 100;
                this.color = '#ff00ff';
                this.glowColor = 'rgba(255, 0, 255, 0.5)';
                this.bulletPattern = 'single';
                this.movePattern = 'sine';
                break;
            case 'fast':
                this.width = 25;
                this.height = 25;
                this.hp = 1;
                this.maxHp = 1;
                this.speed = 2.5;
                this.shootInterval = 1000;
                this.points = 150;
                this.color = '#ffff00';
                this.glowColor = 'rgba(255, 255, 0, 0.5)';
                this.bulletPattern = 'single';
                this.movePattern = 'zigzag';
                break;
            case 'heavy':
                this.width = 50;
                this.height = 50;
                this.hp = 5;
                this.maxHp = 5;
                this.speed = 0.5;
                this.shootInterval = 2000;
                this.points = 300;
                this.color = '#ff4444';
                this.glowColor = 'rgba(255, 68, 68, 0.5)';
                this.bulletPattern = 'spread';
                this.movePattern = 'straight';
                break;
            case 'sniper':
                this.width = 30;
                this.height = 30;
                this.hp = 2;
                this.maxHp = 2;
                this.speed = 0.8;
                this.shootInterval = 2500;
                this.points = 200;
                this.color = '#00ff88';
                this.glowColor = 'rgba(0, 255, 136, 0.5)';
                this.bulletPattern = 'aimed';
                this.movePattern = 'hover';
                break;
            case 'boss':
                this.width = 80;
                this.height = 80;
                this.hp = 30;
                this.maxHp = 30;
                this.speed = 0.3;
                this.shootInterval = 800;
                this.points = 1000;
                this.color = '#ff0000';
                this.glowColor = 'rgba(255, 0, 0, 0.5)';
                this.bulletPattern = 'circle';
                this.movePattern = 'hover';
                break;
        }
    }

    update(player, canvas, deltaTime) {
        this.moveTimer += deltaTime;
        this.shootTimer += deltaTime;
        this.rotation += 0.02;

        switch (this.movePattern) {
            case 'straight':
                this.y += this.speed;
                break;
            case 'sine':
                this.y += this.speed * 0.5;
                this.x = this.startX + Math.sin(this.moveTimer * 0.002) * 50;
                break;
            case 'zigzag':
                this.y += this.speed;
                this.x = this.startX + Math.sin(this.moveTimer * 0.005) * 80;
                break;
            case 'hover':
                if (this.y < 120) {
                    this.y += this.speed;
                } else {
                    this.x = this.startX + Math.sin(this.moveTimer * 0.001) * 100;
                }
                break;
        }

        this.x = Utils.clamp(this.x, this.width / 2, canvas.width - this.width / 2);

        if (this.y > canvas.height + 50) {
            this.active = false;
        }
    }

    shoot(playerX, playerY) {
        if (this.shootTimer < this.shootInterval) {
            return [];
        }
        this.shootTimer = 0;

        const bullets = [];
        const bulletSpeed = 4;

        switch (this.bulletPattern) {
            case 'single':
                bullets.push(BulletPattern.straight(this.x, this.y + this.height / 2, Math.PI / 2, bulletSpeed, false, this.color, this.glowColor, 6, 'normal', 1));
                break;
            case 'spread':
                bullets.push(...BulletPattern.spread(this.x, this.y + this.height / 2, Math.PI / 2, 5, Math.PI / 3, bulletSpeed, false, this.color, this.glowColor, 6, 'normal', 1));
                break;
            case 'aimed':
                bullets.push(BulletPattern.aimed(this.x, this.y + this.height / 2, playerX, playerY, bulletSpeed * 1.5, false, this.color, this.glowColor, 6, 0, 'normal', 1));
                break;
            case 'circle':
                bullets.push(...BulletPattern.circle(this.x, this.y + this.height / 2, 12, bulletSpeed, false, this.color, this.glowColor, 6, 'normal', 1));
                break;
        }

        return bullets;
    }

    takeDamage(damage, particles) {
        this.hp -= damage;
        particles.emit(this.x, this.y, this.color, 5, 2, 15, 3);

        if (this.hp <= 0) {
            this.active = false;
            particles.emit(this.x, this.y, this.color, 25, 4, 30, 5);
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        Utils.drawGlow(ctx, 0, 0, this.width, this.glowColor);

        ctx.fillStyle = this.color;
        ctx.beginPath();

        if (this.type === 'boss') {
            this.drawBossShape(ctx);
        } else {
            this.drawEnemyShape(ctx);
        }

        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (this.type === 'boss') {
            this.drawBossEyes(ctx);
        }

        if (this.hp < this.maxHp) {
            const barWidth = this.width;
            const barHeight = 4;
            const barY = -this.height / 2 - 10;

            ctx.fillStyle = '#333';
            ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-barWidth / 2, barY, barWidth * (this.hp / this.maxHp), barHeight);
        }

        ctx.restore();
    }

    drawEnemyShape(ctx) {
        const w = this.width / 2;
        const h = this.height / 2;

        ctx.moveTo(0, h);
        ctx.lineTo(-w, -h / 2);
        ctx.lineTo(-w / 2, -h);
        ctx.lineTo(0, -h / 2);
        ctx.lineTo(w / 2, -h);
        ctx.lineTo(w, -h / 2);
        ctx.closePath();
    }

    drawBossShape(ctx) {
        const w = this.width / 2;
        const h = this.height / 2;

        ctx.moveTo(0, h);
        ctx.lineTo(-w, 0);
        ctx.lineTo(-w * 0.8, -h * 0.5);
        ctx.lineTo(-w * 0.5, -h);
        ctx.lineTo(0, -h * 0.7);
        ctx.lineTo(w * 0.5, -h);
        ctx.lineTo(w * 0.8, -h * 0.5);
        ctx.lineTo(w, 0);
        ctx.closePath();
    }

    drawBossEyes(ctx) {
        const w = this.width / 2;
        const h = this.height / 2;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-w * 0.3, -h * 0.2, 8, 0, Math.PI * 2);
        ctx.arc(w * 0.3, -h * 0.2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-w * 0.3, -h * 0.2, 4, 0, Math.PI * 2);
        ctx.arc(w * 0.3, -h * 0.2, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Boss extends Enemy {
    constructor(x, y, bossData) {
        super(x, y, 'boss');
        this.bossId = bossData.id;
        this.name = bossData.name;
        this.stages = bossData.stages;
        this.currentStage = 0;
        this.stageTransitionTimer = 0;
        this.isTransitioning = false;
        this.shootAngle = 0;
        this.patternTimer = 0;
        this.currentPatternIndex = 0;
        this.spawnedMinions = [];

        this.applyStage(0);
    }

    applyStage(stageIndex) {
        if (stageIndex >= this.stages.length) return;

        const stage = this.stages[stageIndex];
        this.currentStage = stageIndex;
        this.currentStageData = stage;
        this.maxHp = stage.hp;
        this.hp = stage.hp;
        this.speed = stage.speed;
        this.shootInterval = stage.shootInterval;
        this.patterns = stage.patterns;
        this.currentPatternIndex = 0;
        this.patternTimer = 0;
        this.shootAngle = 0;
        this.color = stage.color || '#ff0000';
        this.glowColor = stage.glowColor || 'rgba(255, 0, 0, 0.5)';
        this.width = stage.size || 80;
        this.height = stage.size || 80;
        this.stageName = stage.name || `阶段 ${stageIndex + 1}`;

        if (stage.spawnMinions) {
            this.spawnMinionsConfig = stage.spawnMinions;
        }
    }

    update(player, canvas, deltaTime) {
        if (this.isTransitioning) {
            this.stageTransitionTimer -= deltaTime;
            if (this.stageTransitionTimer <= 0) {
                this.isTransitioning = false;
                this.applyStage(this.currentStage + 1);
            }
            return;
        }

        this.moveTimer += deltaTime;
        this.shootTimer += deltaTime;
        this.patternTimer += deltaTime;
        this.rotation += 0.02;

        if (this.y < 120) {
            this.y += this.speed;
        } else {
            this.x = canvas.width / 2 + Math.sin(this.moveTimer * 0.001) * (canvas.width * 0.3);
            this.y = 120 + Math.sin(this.moveTimer * 0.002) * 20;
        }

        this.x = Utils.clamp(this.x, this.width / 2 + 50, canvas.width - this.width / 2 - 50);

        if (this.patterns && this.currentPatternIndex < this.patterns.length) {
            const pattern = this.patterns[this.currentPatternIndex];
            if (this.patternTimer >= pattern.duration) {
                this.currentPatternIndex = (this.currentPatternIndex + 1) % this.patterns.length;
                this.patternTimer = 0;
                this.shootAngle = 0;
            }
        }
    }

    shoot(playerX, playerY, canvas) {
        if (this.isTransitioning) return [];
        if (this.shootTimer < this.shootInterval) return [];

        this.shootTimer = 0;
        this.shootAngle += 0.15;

        if (!this.patterns || this.patterns.length === 0) {
            return super.shoot(playerX, playerY);
        }

        const pattern = this.patterns[this.currentPatternIndex];
        const bullets = [];
        const config = {
            x: this.x,
            y: this.y + this.height / 2,
            count: pattern.count,
            speed: pattern.speed,
            color: this.color,
            glowColor: this.glowColor,
            radius: pattern.radius || 6,
            size: pattern.size || 1,
            rotation: this.shootAngle * (pattern.rotationDir || 1),
            angle: pattern.angle || Math.PI / 2,
            spreadAngle: pattern.spreadAngle || Math.PI * 2,
            targetX: playerX,
            targetY: playerY,
            homingStrength: pattern.homingStrength || 0,
            waveAmplitude: pattern.waveAmplitude || 0,
            waveFrequency: pattern.waveFrequency || 0,
            layers: pattern.layers || 1,
            layerOffset: pattern.layerOffset || 0.3,
            bulletType: pattern.bulletType || 'normal'
        };

        const patternBullets = BulletPattern.create({ type: pattern.type, ...config });
        bullets.push(...patternBullets);

        return bullets;
    }

    takeDamage(damage, particles) {
        if (this.isTransitioning) return false;

        this.hp -= damage;
        particles.emit(this.x, this.y, this.color, 3, 2, 12, 2);

        if (this.hp <= 0) {
            if (this.currentStage < this.stages.length - 1) {
                this.isTransitioning = true;
                this.stageTransitionTimer = 1500;
                particles.emit(this.x, this.y, this.color, 40, 6, 50, 6);
                return false;
            } else {
                this.active = false;
                particles.emit(this.x, this.y, this.color, 50, 8, 60, 8);
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isTransitioning) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
        }

        Utils.drawGlow(ctx, 0, 0, this.width * 1.2, this.glowColor);

        ctx.rotate(this.rotation);

        ctx.fillStyle = this.color;
        ctx.beginPath();

        const w = this.width / 2;
        const h = this.height / 2;
        const points = this.currentStage + 5;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
            const r = (i % 2 === 0) ? w : w * 0.6;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.rotate(-this.rotation);

        const eyeCount = this.currentStage + 2;
        for (let i = 0; i < eyeCount; i++) {
            const eyeAngle = (i / eyeCount) * Math.PI * 2;
            const eyeDist = w * 0.4;
            const ex = Math.cos(eyeAngle) * eyeDist;
            const ey = Math.sin(eyeAngle) * eyeDist;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex, ey, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(ex, ey, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        const barWidth = this.width * 1.5;
        const barHeight = 8;
        const barY = -this.height / 2 - 25;

        ctx.fillStyle = '#333';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

        const hpPercent = this.hp / this.maxHp;
        const gradient = ctx.createLinearGradient(-barWidth / 2, 0, barWidth / 2, 0);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.5, '#ffaa00');
        gradient.addColorStop(1, '#00ff00');
        ctx.fillStyle = gradient;
        ctx.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.name} - ${this.stageName}`, 0, barY - 8);

        ctx.restore();
    }
}

const BOSS_DATA = [
    {
        id: 'flandre',
        name: '芙兰朵露',
        stages: [
            {
                name: '第一形態',
                hp: 40,
                speed: 0.4,
                shootInterval: 600,
                color: '#ff4444',
                glowColor: 'rgba(255, 68, 68, 0.5)',
                size: 70,
                patterns: [
                    { type: 'circle', count: 8, speed: 4, duration: 3000, rotationDir: 1 },
                    { type: 'spiral', count: 12, speed: 3.5, duration: 4000, rotationDir: 1 },
                    { type: 'aimed', count: 1, speed: 6, duration: 2000, homingStrength: 2 }
                ]
            },
            {
                name: '第二形態',
                hp: 60,
                speed: 0.5,
                shootInterval: 500,
                color: '#ff0066',
                glowColor: 'rgba(255, 0, 102, 0.5)',
                size: 80,
                patterns: [
                    { type: 'flower', count: 16, speed: 3.5, duration: 4000, rotationDir: 1 },
                    { type: 'spread', count: 12, speed: 4, spreadAngle: Math.PI, duration: 3000 },
                    { type: 'ring', count: 20, speed: 4, duration: 3500, rotationDir: -1 },
                    { type: 'doubleCircle', count: 10, speed: 4, duration: 4000, rotationDir: 1 }
                ]
            },
            {
                name: '最終形態',
                hp: 80,
                speed: 0.6,
                shootInterval: 400,
                color: '#ff00ff',
                glowColor: 'rgba(255, 0, 255, 0.5)',
                size: 90,
                patterns: [
                    { type: 'laser', count: 5, speed: 10, duration: 2500, rotationDir: 1, size: 1.2 },
                    { type: 'heart', count: 16, speed: 3, duration: 3500, rotationDir: 1 },
                    { type: 'circle', count: 24, speed: 5, duration: 3000, rotationDir: -1 },
                    { type: 'zigzag', count: 10, speed: 4, duration: 3500, waveAmplitude: 4, waveFrequency: 3 }
                ]
            }
        ]
    },
    {
        id: 'remilia',
        name: '蕾米莉亚',
        stages: [
            {
                name: '第一形態',
                hp: 35,
                speed: 0.5,
                shootInterval: 700,
                color: '#8844ff',
                glowColor: 'rgba(136, 68, 255, 0.5)',
                size: 65,
                patterns: [
                    { type: 'circle', count: 10, speed: 4, duration: 3000, rotationDir: -1 },
                    { type: 'wave', count: 8, speed: 4, duration: 3500, waveAmplitude: 3, waveFrequency: 2 }
                ]
            },
            {
                name: '第二形態',
                hp: 55,
                speed: 0.7,
                shootInterval: 500,
                color: '#aa00ff',
                glowColor: 'rgba(170, 0, 255, 0.5)',
                size: 75,
                patterns: [
                    { type: 'spiral', count: 16, speed: 3.5, duration: 4000, rotationDir: 1 },
                    { type: 'cross', count: 1, speed: 5, duration: 3000, rotationDir: 1 },
                    { type: 'aimed', count: 3, speed: 7, duration: 2500, homingStrength: 3 }
                ]
            },
            {
                name: '最終形態',
                hp: 75,
                speed: 0.8,
                shootInterval: 350,
                color: '#ff00aa',
                glowColor: 'rgba(255, 0, 170, 0.5)',
                size: 85,
                patterns: [
                    { type: 'flower', count: 20, speed: 4, duration: 3500, rotationDir: 1 },
                    { type: 'doubleCircle', count: 12, speed: 5, duration: 3000, rotationDir: -1 },
                    { type: 'laser', count: 8, speed: 12, duration: 2500, rotationDir: 1, size: 1.3 },
                    { type: 'ring', count: 30, speed: 4.5, duration: 3000, rotationDir: 1 }
                ]
            }
        ]
    },
    {
        id: 'yukari',
        name: '八云紫',
        stages: [
            {
                name: '第一形態',
                hp: 45,
                speed: 0.3,
                shootInterval: 550,
                color: '#44ffff',
                glowColor: 'rgba(68, 255, 255, 0.5)',
                size: 72,
                patterns: [
                    { type: 'circle', count: 16, speed: 3.5, duration: 3500, rotationDir: 1 },
                    { type: 'random', count: 10, speed: 4, duration: 3000, spreadAngle: Math.PI }
                ]
            },
            {
                name: '第二形態',
                hp: 65,
                speed: 0.5,
                shootInterval: 450,
                color: '#00aaff',
                glowColor: 'rgba(0, 170, 255, 0.5)',
                size: 82,
                patterns: [
                    { type: 'spiral', count: 20, speed: 4, duration: 4500, rotationDir: 1 },
                    { type: 'wave', count: 12, speed: 4, duration: 3500, waveAmplitude: 5, waveFrequency: 2 },
                    { type: 'flower', count: 14, speed: 4, duration: 4000, rotationDir: -1 }
                ]
            },
            {
                name: '最終形態',
                hp: 90,
                speed: 0.6,
                shootInterval: 300,
                color: '#0088ff',
                glowColor: 'rgba(0, 136, 255, 0.5)',
                size: 95,
                patterns: [
                    { type: 'laser', count: 10, speed: 14, duration: 2000, rotationDir: 1, size: 1.4 },
                    { type: 'doubleCircle', count: 16, speed: 5, duration: 3500, rotationDir: -1 },
                    { type: 'heart', count: 20, speed: 4, duration: 3000, rotationDir: 1 },
                    { type: 'ring', count: 36, speed: 5, duration: 3000, rotationDir: 1 },
                    { type: 'zigzag', count: 12, speed: 5, duration: 3500, waveAmplitude: 5, waveFrequency: 4 }
                ]
            }
        ]
    }
];

class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500;
        this.difficultyTimer = 0;
        this.bossSpawned = false;
        this.boss = null;
        this.bossIndex = 0;
        this.minionTimer = 0;
    }

    reset() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500;
        this.difficultyTimer = 0;
        this.bossSpawned = false;
        this.boss = null;
        this.bossIndex = 0;
        this.minionTimer = 0;
    }

    spawn(canvas) {
        const types = ['basic', 'fast', 'heavy', 'sniper'];
        const weights = [3, 3, 1, 2];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let typeIndex = 0;
        for (let i = 0; i < types.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                typeIndex = i;
                break;
            }
        }
        const type = types[typeIndex];
        const x = Utils.random(50, canvas.width - 50);
        const y = -50;

        this.enemies.push(new Enemy(x, y, type));
    }

    spawnBoss(canvas) {
        if (this.bossSpawned) return;
        this.bossSpawned = true;

        const bossData = BOSS_DATA[this.bossIndex % BOSS_DATA.length];
        this.boss = new Boss(canvas.width / 2, -100, bossData);
        this.enemies.push(this.boss);
        this.bossIndex++;
    }

    spawnMinion(canvas, type) {
        const x = Utils.random(80, canvas.width - 80);
        const y = -30;
        this.enemies.push(new Enemy(x, y, type));
    }

    update(player, canvas, deltaTime, bulletManager, particles, game) {
        this.difficultyTimer += deltaTime;
        this.spawnInterval = Math.max(500, 1500 - this.difficultyTimer * 0.008);

        if (this.difficultyTimer > 60000 && !this.bossSpawned) {
            this.spawnBoss(canvas);
        }

        if (!this.bossSpawned) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnInterval && this.enemies.length < 12) {
                this.spawn(canvas);
                this.spawnTimer = 0;
            }
        }

        this.minionTimer += deltaTime;
        if (this.boss && this.boss.active && this.boss.spawnMinionsConfig) {
            const config = this.boss.spawnMinionsConfig;
            if (this.minionTimer >= config.interval) {
                this.minionTimer = 0;
                for (let i = 0; i < config.count; i++) {
                    this.spawnMinion(canvas, config.type || 'basic');
                }
            }
        }

        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            enemy.update(player, canvas, deltaTime);
            if (enemy instanceof Boss) {
                const newBullets = enemy.shoot(player.x, player.y, canvas);
                newBullets.forEach(b => bulletManager.addEnemyBullet(b));
            } else {
                const newBullets = enemy.shoot(player.x, player.y);
                newBullets.forEach(b => bulletManager.addEnemyBullet(b));
            }
        });

        this.enemies.forEach(enemy => {
            if (!enemy.active && enemy === this.boss) {
                if (game && game.onBossDefeated) {
                    game.onBossDefeated(enemy);
                }
                this.boss = null;
            }
        });

        this.enemies = this.enemies.filter(e => e.active);

        if (this.bossSpawned && !this.boss && this.enemies.length === 0) {
            this.bossSpawned = false;
            this.difficultyTimer = 0;
        }
    }

    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }

    checkCollision(bullet, particles, itemManager) {
        for (let enemy of this.enemies) {
            if (!enemy.active) continue;
            if (Utils.circleCollision(
                bullet.x, bullet.y, bullet.radius * bullet.size,
                enemy.x, enemy.y, Math.max(enemy.width, enemy.height) / 2
            )) {
                const killed = enemy.takeDamage(bullet.damage, particles);
                if (bullet.pierce && bullet.pierceCount > 0) {
                    bullet.pierceCount--;
                    if (bullet.pierceCount <= 0) {
                        bullet.active = false;
                    }
                } else {
                    bullet.active = false;
                }
                if (killed && itemManager) {
                    if (!(enemy instanceof Boss)) {
                        itemManager.spawnRandomDrop(enemy.x, enemy.y);
                    }
                }
                return killed ? enemy.points : 0;
            }
        }
        return 0;
    }

    checkPlayerCollision(player, particles) {
        for (let enemy of this.enemies) {
            if (Utils.circleCollision(
                player.x, player.y, player.hitboxRadius,
                enemy.x, enemy.y, Math.max(enemy.width, enemy.height) / 2
            )) {
                return player.takeDamage(particles);
            }
        }
        return false;
    }

    hasActiveBoss() {
        return this.boss && this.boss.active;
    }

    getBossData() {
        return this.boss;
    }
}