class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.coins = 100;
        this.cannonLevel = 1;
        
        this.minCoinsForWelfare = 20;
        this.welfareInterval = 10000;
        this.welfareAmount = 10;
        this.welfareTimer = 0;
        this.isWelfareActive = false;
        
        this.fishes = [];
        this.bullets = [];
        this.particles = [];
        this.bubbles = [];
        this.seaweeds = [];
        this.backgroundLayers = [];
        this.lightRays = [];
        
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        
        this.cannon = new Cannon(this.canvas.width / 2, this.canvas.height - 60);
        
        this.lastTime = 0;
        this.firstFrame = true;
        this.fishSpawnTimer = 0;
        this.fishSpawnInterval = 1200;
        this.maxFishes = 25;
        
        this.skills = {
            lock: {
                cooldown: 0,
                maxCooldown: 15000,
                duration: 3000,
                active: false,
                activeTimer: 0,
                targetFish: null
            },
            freeze: {
                cooldown: 0,
                maxCooldown: 20000,
                duration: 5000,
                active: false,
                activeTimer: 0
            },
            crit: {
                cooldown: 0,
                maxCooldown: 30000,
                ready: false,
                active: false
            }
        };
        
        this.bossSpawnTimer = 0;
        this.bossSpawnInterval = 60000;
        this.bossActive = false;
        
        this.initBackgroundLayers();
        this.initLightRays();
        this.initSeaweeds();
        this.initBubbles();
        this.bindEvents();
        
        this.updateUI();
        this.updateSkillUI();
        
        this.gameLoop(0);
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.cannon) {
            this.cannon.x = this.canvas.width / 2;
            this.cannon.y = this.canvas.height - 60;
        }
        
        if (this.backgroundLayers.length > 0) {
            this.initBackgroundLayers();
            this.initLightRays();
            this.initSeaweeds();
        }
    }
    
    initBackgroundLayers() {
        this.backgroundLayers = [
            { y: 0, speed: 0.1, color: '#0a1628', opacity: 1 },
            { y: this.canvas.height * 0.3, speed: 0.3, color: '#0d2137', opacity: 0.8 },
            { y: this.canvas.height * 0.6, speed: 0.5, color: '#1a2a4a', opacity: 0.6 }
        ];
    }
    
    initLightRays() {
        this.lightRays = [];
        for (let i = 0; i < 5; i++) {
            this.lightRays.push({
                x: Utils.random(0, this.canvas.width),
                width: Utils.random(50, 150),
                opacity: Utils.random(0.05, 0.15),
                speed: Utils.random(0.01, 0.03),
                phase: Utils.random(0, Math.PI * 2)
            });
        }
    }
    
    initSeaweeds() {
        this.seaweeds = [];
        const seaweedCount = 10;
        for (let i = 0; i < seaweedCount; i++) {
            this.seaweeds.push({
                x: (i + 0.5) * (this.canvas.width / seaweedCount),
                y: this.canvas.height,
                height: Utils.random(80, 150),
                waveOffset: Utils.random(0, Math.PI * 2),
                layer: i % 3
            });
        }
    }
    
    initBubbles() {
        this.bubbles = [];
        const bubbleCount = 30;
        for (let i = 0; i < bubbleCount; i++) {
            this.bubbles.push({
                x: Utils.random(0, this.canvas.width),
                y: Utils.random(0, this.canvas.height),
                radius: Utils.random(2, 10),
                speed: Utils.random(0.5, 2.5),
                alpha: Utils.random(0.2, 0.6),
                wobble: Utils.random(0, Math.PI * 2),
                wobbleSpeed: Utils.random(0.01, 0.03),
                layer: i % 3
            });
        }
    }
    
    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            
            if (!this.skills.lock.active) {
                this.cannon.aimAt(this.mouseX, this.mouseY);
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.shoot();
        });
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.target.dataset.level);
                this.setCannonLevel(level);
            });
        });
        
        document.querySelectorAll('.skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skill = e.currentTarget.dataset.skill;
                this.useSkill(skill);
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '7') {
                this.setCannonLevel(parseInt(e.key));
            }
            if (e.key === 'q' || e.key === 'Q') {
                this.useSkill('lock');
            }
            if (e.key === 'w' || e.key === 'W') {
                this.useSkill('freeze');
            }
            if (e.key === 'e' || e.key === 'E') {
                this.useSkill('crit');
            }
        });
    }
    
    setCannonLevel(level) {
        this.cannonLevel = level;
        this.cannon.setLevel(level);
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === level);
        });
        
        this.updateUI();
    }
    
    useSkill(skillName) {
        const skill = this.skills[skillName];
        if (!skill || skill.cooldown > 0) return;
        
        if (skillName === 'lock') {
            skill.active = true;
            skill.activeTimer = skill.duration;
            skill.cooldown = skill.maxCooldown;
            this.findNearestFish();
        } else if (skillName === 'freeze') {
            skill.active = true;
            skill.activeTimer = skill.duration;
            skill.cooldown = skill.maxCooldown;
            document.getElementById('freeze-overlay').classList.add('active');
        } else if (skillName === 'crit') {
            skill.ready = true;
            skill.active = true;
            skill.cooldown = skill.maxCooldown;
        }
        
        this.updateSkillUI();
    }
    
    findNearestFish() {
        let nearest = null;
        let nearestDist = Infinity;
        
        for (const fish of this.fishes) {
            if (!fish.alive || fish.caught) continue;
            
            const dist = Utils.distance(this.cannon.x, this.cannon.y, fish.x, fish.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = fish;
            }
        }
        
        this.skills.lock.targetFish = nearest;
        return nearest;
    }
    
    shoot() {
        const cost = this.cannon.getCost();
        
        if (this.coins < cost) {
            this.showInsufficientCoins();
            return;
        }
        
        this.coins -= cost;
        this.updateUI();
        
        let targetFish = null;
        if (this.skills.lock.active && this.skills.lock.targetFish && this.skills.lock.targetFish.alive) {
            targetFish = this.skills.lock.targetFish;
            this.cannon.aimAt(targetFish.x, targetFish.y);
        }
        
        const bullet = this.cannon.shoot();
        if (targetFish) {
            bullet.targetFish = targetFish;
            bullet.homing = true;
        }
        
        if (this.skills.crit.ready && this.skills.crit.active) {
            bullet.isCrit = true;
        }
        
        this.bullets.push(bullet);
        
        this.createMuzzleFlash(bullet.x, bullet.y);
    }
    
    showInsufficientCoins() {
        const tip = document.getElementById('welfare-tip');
        tip.classList.remove('hidden');
        
        if (!this.isWelfareActive) {
            this.startWelfare();
        }
    }
    
    startWelfare() {
        this.isWelfareActive = true;
        this.welfareTimer = this.welfareInterval;
    }
    
    updateWelfare(deltaTime) {
        if (!this.isWelfareActive) {
            if (this.coins < this.minCoinsForWelfare) {
                this.startWelfare();
            }
            return;
        }
        
        this.welfareTimer -= deltaTime;
        
        const countdown = Math.ceil(this.welfareTimer / 1000);
        document.getElementById('welfare-countdown').textContent = countdown;
        
        if (this.welfareTimer <= 0) {
            this.coins += this.welfareAmount;
            this.welfareTimer = this.welfareInterval;
            this.updateUI();
            
            if (this.coins >= this.minCoinsForWelfare) {
                this.isWelfareActive = false;
                document.getElementById('welfare-tip').classList.add('hidden');
            }
        }
    }
    
    updateSkills(deltaTime) {
        for (const [name, skill] of Object.entries(this.skills)) {
            if (skill.cooldown > 0) {
                skill.cooldown -= deltaTime;
                if (skill.cooldown < 0) skill.cooldown = 0;
            }
            
            if (skill.activeTimer !== undefined && skill.activeTimer > 0) {
                skill.activeTimer -= deltaTime;
                if (skill.activeTimer <= 0) {
                    skill.active = false;
                    if (name === 'freeze') {
                        document.getElementById('freeze-overlay').classList.remove('active');
                    }
                }
            }
            
            if (name === 'lock' && skill.active) {
                if (!skill.targetFish || !skill.targetFish.alive || skill.targetFish.caught) {
                    this.findNearestFish();
                }
                if (skill.targetFish && skill.targetFish.alive) {
                    this.cannon.aimAt(skill.targetFish.x, skill.targetFish.y);
                }
            }
        }
        
        this.updateSkillUI();
    }
    
    updateSkillUI() {
        for (const [name, skill] of Object.entries(this.skills)) {
            const btn = document.getElementById(`skill-${name}`);
            const cooldownBar = document.getElementById(`cooldown-${name}`);
            const cooldownText = document.getElementById(`cooldown-text-${name}`);
            
            if (btn) {
                btn.disabled = skill.cooldown > 0;
                btn.classList.toggle('active', skill.active || skill.ready);
            }
            
            if (cooldownBar && cooldownText) {
                if (skill.cooldown > 0) {
                    const percent = (skill.cooldown / skill.maxCooldown) * 100;
                    cooldownBar.style.height = `${percent}%`;
                    cooldownText.textContent = Math.ceil(skill.cooldown / 1000);
                } else {
                    cooldownBar.style.height = '0%';
                    cooldownText.textContent = '';
                }
            }
        }
    }
    
    spawnFish() {
        const aliveFishes = this.fishes.filter(f => f.alive).length;
        if (aliveFishes >= this.maxFishes) return;
        
        if (this.bossActive) {
            const hasBoss = this.fishes.some(f => f.alive && f.special === 'boss');
            if (hasBoss) return;
        }
        
        const fish = new Fish(this.canvas.width, this.canvas.height);
        
        if (fish.special === 'boss' && this.bossActive) {
            return;
        }
        
        this.fishes.push(fish);
        
        if (fish.special === 'boss') {
            this.bossActive = true;
            this.showBossWarning();
        }
    }
    
    showBossWarning() {
        const warning = document.getElementById('boss-warning');
        warning.classList.remove('hidden');
        setTimeout(() => {
            warning.classList.add('hidden');
        }, 2000);
    }
    
    createMuzzleFlash(x, y) {
        const color = Utils.getNetColor(this.cannonLevel);
        for (let i = 0; i < 8; i++) {
            const particle = new Particle(x, y, color, 'spark');
            particle.size = Utils.random(4, 10);
            particle.decay = 0.05;
            this.particles.push(particle);
        }
    }
    
    createCatchEffect(fish, coinMultiplier = 1) {
        for (let i = 0; i < 15; i++) {
            const particle = new Particle(fish.x, fish.y, fish.color);
            particle.size = Utils.random(5, 12);
            this.particles.push(particle);
        }
        
        for (let i = 0; i < 10; i++) {
            const particle = new Particle(fish.x, fish.y, '#ffd700', 'spark');
            particle.size = Utils.random(3, 8);
            this.particles.push(particle);
        }
        
        const actualCoins = fish.coins * coinMultiplier;
        const coinParticle = new Particle(fish.x, fish.y, '#ffd700', 'coin');
        coinParticle.coinValue = actualCoins;
        coinParticle.size = 15;
        this.particles.push(coinParticle);
    }
    
    createExplosion(x, y, radius, color) {
        for (let i = 0; i < 30; i++) {
            const particle = new Particle(x, y, color, 'spark');
            const angle = (i / 30) * Math.PI * 2;
            const speed = Utils.random(5, 15);
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = Utils.random(4, 12);
            particle.decay = 0.02;
            this.particles.push(particle);
        }
    }
    
    triggerGoldenFishEffect(caughtFish) {
        let totalReward = caughtFish.coins;
        
        for (const fish of this.fishes) {
            if (fish === caughtFish || !fish.alive || fish.caught) continue;
            if (fish.special === 'boss') continue;
            
            totalReward += Math.floor(fish.coins * 0.5);
            fish.caught = true;
            fish.catchAnimation = 0;
            this.createCatchEffect(fish, 0.5);
        }
        
        this.coins += totalReward;
        this.updateUI();
        
        const goldenEffect = document.createElement('div');
        goldenEffect.className = 'golden-effect';
        document.querySelector('.game-container').appendChild(goldenEffect);
        setTimeout(() => goldenEffect.remove(), 500);
    }
    
    triggerBombEffect(bombFish) {
        this.createExplosion(bombFish.x, bombFish.y, 200, '#ff4500');
        
        let totalReward = 0;
        for (const fish of this.fishes) {
            if (fish === bombFish || !fish.alive || fish.caught) continue;
            if (fish.special === 'boss') continue;
            
            totalReward += fish.coins;
            fish.caught = true;
            fish.catchAnimation = 0;
            this.createCatchEffect(fish);
        }
        
        this.coins += totalReward;
        this.updateUI();
    }
    
    checkCollisions() {
        for (const bullet of this.bullets) {
            if (!bullet.active || bullet.collided) continue;
            
            const bulletBounds = bullet.getBounds();
            
            for (const fish of this.fishes) {
                if (!fish.alive || fish.caught) continue;
                
                const fishBounds = fish.getBounds();
                
                if (Utils.circleCollision(
                    bulletBounds.centerX, bulletBounds.centerY, bulletBounds.radius,
                    fishBounds.centerX, fishBounds.centerY, fishBounds.radius
                )) {
                    const catchResult = fish.tryCatch(bullet.catchBonus);
                    
                    if (catchResult === 'boss_hit') {
                        bullet.hitFish = true;
                        this.coins += 50;
                        this.createCatchEffect(fish, 0.2);
                        this.updateUI();
                    } else if (catchResult === true) {
                        bullet.hitFish = true;
                        let coinMultiplier = 1;
                        if (this.skills.crit.ready && this.skills.crit.active) {
                            coinMultiplier = 2;
                            this.skills.crit.ready = false;
                            this.skills.crit.active = false;
                            this.updateSkillUI();
                        }
                        
                        if (fish.special === 'screen_reward') {
                            this.triggerGoldenFishEffect(fish);
                        } else if (fish.special === 'bomb') {
                            this.triggerBombEffect(fish);
                        } else {
                            this.coins += fish.coins * coinMultiplier;
                            this.createCatchEffect(fish, coinMultiplier);
                            this.updateUI();
                        }
                        
                        if (fish.special === 'boss') {
                            this.bossActive = false;
                            this.coins += 500;
                            this.createExplosion(fish.x, fish.y, 300, '#ffd700');
                            this.updateUI();
                        }
                    }
                    
                    bullet.onCollision();
                    break;
                }
            }
        }
    }
    
    updateUI() {
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('cost').textContent = this.cannon.getCost();
    }
    
    update(deltaTime) {
        this.cannon.update(deltaTime);
        this.updateSkills(deltaTime);
        
        this.fishSpawnTimer += deltaTime;
        if (this.fishSpawnTimer >= this.fishSpawnInterval) {
            this.fishSpawnTimer = 0;
            this.spawnFish();
        }
        
        if (!this.bossActive) {
            this.bossSpawnTimer += deltaTime;
            if (this.bossSpawnTimer >= this.bossSpawnInterval) {
                this.bossSpawnTimer = 0;
                const hasBoss = this.fishes.some(f => f.alive && f.special === 'boss');
                if (!hasBoss) {
                    const bossFish = new Fish(this.canvas.width, this.canvas.height, FishTypes.DRAGON_BOSS);
                    this.fishes.push(bossFish);
                    this.bossActive = true;
                    this.showBossWarning();
                }
            }
        }
        
        const freezeMultiplier = this.skills.freeze.active ? 0.5 : 1;
        this.fishes.forEach(fish => {
            if (fish.special === 'boss') {
                fish.update(deltaTime, this.bullets, this.fishes);
            } else {
                fish.update(deltaTime * freezeMultiplier, this.bullets, this.fishes);
            }
        });
        
        const hadBoss = this.fishes.some(f => f.alive && f.special === 'boss');
        this.fishes = this.fishes.filter(fish => fish.alive);
        
        if (this.bossActive && hadBoss) {
            const stillHasBoss = this.fishes.some(f => f.special === 'boss');
            if (!stillHasBoss) {
                this.bossActive = false;
                this.bossSpawnTimer = 0;
            }
        }
        
        this.bullets.forEach(bullet => bullet.update(deltaTime, this.canvas.width, this.canvas.height));
        
        const inactiveCritBullets = this.bullets.filter(b => !b.active && b.isCrit && !b.hitFish);
        if (inactiveCritBullets.length > 0 && this.skills.crit.ready && this.skills.crit.active) {
            this.skills.crit.ready = false;
            this.skills.crit.active = false;
            this.updateSkillUI();
        }
        
        this.bullets = this.bullets.filter(bullet => bullet.active);
        
        this.checkCollisions();
        
        this.particles.forEach(particle => particle.update(deltaTime, this.canvas.height));
        this.particles = this.particles.filter(p => p.life > 0);
        
        this.bubbles.forEach(bubble => {
            bubble.y -= bubble.speed * (deltaTime / 16.67);
            bubble.wobble += bubble.wobbleSpeed;
            bubble.x += Math.sin(bubble.wobble) * 0.5;
            
            if (bubble.y < -bubble.radius * 2) {
                bubble.y = this.canvas.height + bubble.radius;
                bubble.x = Utils.random(0, this.canvas.width);
            }
        });
        
        this.seaweeds.forEach(seaweed => {
            seaweed.waveOffset += 0.02 * (deltaTime / 16.67);
        });
        
        this.lightRays.forEach(ray => {
            ray.phase += ray.speed;
            ray.x += Math.sin(ray.phase) * 0.2;
        });
        
        this.updateWelfare(deltaTime);
    }
    
    renderBackground() {
        this.ctx.fillStyle = '#0a1628';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.backgroundLayers.forEach((layer, index) => {
            const gradient = this.ctx.createLinearGradient(0, layer.y, 0, this.canvas.height);
            gradient.addColorStop(0, layer.color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = layer.opacity;
            this.ctx.fillRect(0, layer.y, this.canvas.width, this.canvas.height - layer.y);
            this.ctx.globalAlpha = 1;
        });
        
        this.lightRays.forEach(ray => {
            const gradient = this.ctx.createLinearGradient(ray.x, 0, ray.x + ray.width, this.canvas.height * 0.7);
            gradient.addColorStop(0, `rgba(200, 230, 255, ${ray.opacity})`);
            gradient.addColorStop(1, 'rgba(200, 230, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(ray.x - ray.width * 0.3, 0);
            this.ctx.lineTo(ray.x + ray.width * 0.3, 0);
            this.ctx.lineTo(ray.x + ray.width, this.canvas.height * 0.7);
            this.ctx.lineTo(ray.x - ray.width * 0.5, this.canvas.height * 0.7);
            this.ctx.closePath();
            this.ctx.fill();
        });
        
        this.bubbles.filter(b => b.layer === 0).forEach(bubble => {
            Utils.drawBubble(this.ctx, bubble.x, bubble.y, bubble.radius, bubble.alpha * 0.5);
        });
        
        this.seaweeds.filter(s => s.layer === 0).forEach(seaweed => {
            Utils.drawSeaweed(this.ctx, seaweed.x, seaweed.y, seaweed.height * 0.7, seaweed.waveOffset);
        });
    }
    
    renderMidground() {
        this.bubbles.filter(b => b.layer === 1).forEach(bubble => {
            Utils.drawBubble(this.ctx, bubble.x, bubble.y, bubble.radius, bubble.alpha);
        });
        
        this.seaweeds.filter(s => s.layer === 1).forEach(seaweed => {
            Utils.drawSeaweed(this.ctx, seaweed.x, seaweed.y, seaweed.height, seaweed.waveOffset);
        });
    }
    
    renderForeground() {
        this.bubbles.filter(b => b.layer === 2).forEach(bubble => {
            Utils.drawBubble(this.ctx, bubble.x, bubble.y, bubble.radius, bubble.alpha * 1.5);
        });
        
        this.seaweeds.filter(s => s.layer === 2).forEach(seaweed => {
            Utils.drawSeaweed(this.ctx, seaweed.x, seaweed.y, seaweed.height * 1.3, seaweed.waveOffset);
        });
        
        const sandGradient = this.ctx.createLinearGradient(0, this.canvas.height - 50, 0, this.canvas.height);
        sandGradient.addColorStop(0, 'rgba(194, 178, 128, 0)');
        sandGradient.addColorStop(1, 'rgba(194, 178, 128, 0.4)');
        
        this.ctx.fillStyle = sandGradient;
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.renderBackground();
        this.renderMidground();
        
        this.fishes.forEach(fish => fish.render(this.ctx));
        
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        
        this.particles.forEach(particle => particle.render(this.ctx));
        
        this.cannon.render(this.ctx);
        
        this.renderForeground();
        
        if (this.skills.lock.active && this.skills.lock.targetFish && this.skills.lock.targetFish.alive) {
            const fish = this.skills.lock.targetFish;
            this.ctx.save();
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(fish.x, fish.y, Math.max(fish.width, fish.height) * 0.7, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.restore();
        }
    }
    
    gameLoop(currentTime) {
        if (this.firstFrame) {
            this.firstFrame = false;
            this.lastTime = currentTime;
            this.render();
            requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        let deltaTime = currentTime - this.lastTime;
        deltaTime = Math.min(deltaTime, 100);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

window.addEventListener('load', () => {
    new Game();
});
