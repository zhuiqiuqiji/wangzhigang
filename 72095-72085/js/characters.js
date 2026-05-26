class Character {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.speed = config.speed;
        this.shootCooldown = config.shootCooldown;
        this.damageMultiplier = config.damageMultiplier;
        this.hitboxRadius = config.hitboxRadius;
        this.initialPowerLevel = config.initialPowerLevel;
        this.primaryColor = config.primaryColor;
        this.attackType = config.attackType;
        this.shoot = config.shoot;
    }
}

function hexToRgba(hex, alpha = 0.5) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

class AttackPatterns {
    static normal(player, currentTime) {
        if (currentTime - player.lastShootTime < player.shootCooldown) {
            return [];
        }
        player.lastShootTime = currentTime;

        const bullets = [];
        const bulletSpeed = 10;
        const damage = player.damageMultiplier || 1;
        const color = player.primaryColor;
        const glowColor = hexToRgba(color, 0.5);

        switch (player.powerLevel) {
            case 1:
                bullets.push(BulletPattern.straight(player.x, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                break;
            case 2:
                bullets.push(BulletPattern.straight(player.x - 10, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 10, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                break;
            case 3:
                bullets.push(BulletPattern.straight(player.x, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x - 15, player.y - player.height / 2, -Math.PI / 2 - 0.1, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 15, player.y - player.height / 2, -Math.PI / 2 + 0.1, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                break;
            case 4:
                bullets.push(BulletPattern.straight(player.x - 10, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 10, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x - 20, player.y - player.height / 2, -Math.PI / 2 - 0.15, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 20, player.y - player.height / 2, -Math.PI / 2 + 0.15, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                break;
            case 5:
                bullets.push(BulletPattern.straight(player.x, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x - 15, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 15, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x - 25, player.y - player.height / 2, -Math.PI / 2 - 0.2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 25, player.y - player.height / 2, -Math.PI / 2 + 0.2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                break;
        }

        bullets.forEach(b => b.damage = damage);
        return bullets;
    }

    static pierce(player, currentTime) {
        if (currentTime - player.lastShootTime < player.shootCooldown) {
            return [];
        }
        player.lastShootTime = currentTime;

        const bullets = [];
        const bulletSpeed = 12;
        const damage = player.damageMultiplier || 1;
        const color = player.primaryColor;
        const glowColor = hexToRgba(color, 0.5);

        switch (player.powerLevel) {
            case 1:
                bullets.push(BulletPattern.straight(player.x, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                break;
            case 2:
                bullets.push(BulletPattern.straight(player.x - 8, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(BulletPattern.straight(player.x + 8, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                break;
            case 3:
                bullets.push(BulletPattern.straight(player.x, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(BulletPattern.straight(player.x - 12, player.y - player.height / 2, -Math.PI / 2 - 0.05, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(BulletPattern.straight(player.x + 12, player.y - player.height / 2, -Math.PI / 2 + 0.05, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                break;
            case 4:
                bullets.push(BulletPattern.straight(player.x - 8, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(BulletPattern.straight(player.x + 8, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(BulletPattern.straight(player.x - 18, player.y - player.height / 2, -Math.PI / 2 - 0.08, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(BulletPattern.straight(player.x + 18, player.y - player.height / 2, -Math.PI / 2 + 0.08, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                break;
            case 5:
                bullets.push(BulletPattern.straight(player.x, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(BulletPattern.straight(player.x - 10, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(BulletPattern.straight(player.x + 10, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(BulletPattern.straight(player.x - 20, player.y - player.height / 2, -Math.PI / 2 - 0.1, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(BulletPattern.straight(player.x + 20, player.y - player.height / 2, -Math.PI / 2 + 0.1, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                break;
        }

        bullets.forEach(b => {
            b.damage = damage;
            b.pierce = true;
            b.pierceCount = 3;
        });
        return bullets;
    }

    static laser(player, currentTime) {
        if (currentTime - player.lastShootTime < player.shootCooldown) {
            return [];
        }
        player.lastShootTime = currentTime;

        const bullets = [];
        const bulletSpeed = 15;
        const damage = player.damageMultiplier || 1;
        const color = player.primaryColor;
        const glowColor = hexToRgba(color, 0.5);

        switch (player.powerLevel) {
            case 1:
                bullets.push(...BulletPattern.laser(player.x, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 3, 1));
                break;
            case 2:
                bullets.push(...BulletPattern.laser(player.x - 10, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 3, 1));
                bullets.push(...BulletPattern.laser(player.x + 10, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 3, 1));
                break;
            case 3:
                bullets.push(...BulletPattern.laser(player.x, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 4, 1.2));
                bullets.push(...BulletPattern.laser(player.x - 15, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 3, 1));
                bullets.push(...BulletPattern.laser(player.x + 15, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 3, 1));
                break;
            case 4:
                bullets.push(...BulletPattern.laser(player.x - 10, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 4, 1.2));
                bullets.push(...BulletPattern.laser(player.x + 10, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 4, 1.2));
                bullets.push(...BulletPattern.laser(player.x - 22, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 3, 1));
                bullets.push(...BulletPattern.laser(player.x + 22, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 3, 1));
                break;
            case 5:
                bullets.push(...BulletPattern.laser(player.x, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 5, 1.5));
                bullets.push(...BulletPattern.laser(player.x - 15, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 4, 1.2));
                bullets.push(...BulletPattern.laser(player.x + 15, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 4, 1.2));
                bullets.push(...BulletPattern.laser(player.x - 25, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 3, 1));
                bullets.push(...BulletPattern.laser(player.x + 25, player.y - player.height / 2, 1, bulletSpeed, -Math.PI / 2, 0, color, glowColor, 3, 1));
                break;
        }

        bullets.forEach(b => {
            b.isPlayerBullet = true;
            b.damage = damage;
        });
        return bullets;
    }

    static homing(player, currentTime) {
        if (currentTime - player.lastShootTime < player.shootCooldown) {
            return [];
        }
        player.lastShootTime = currentTime;

        const bullets = [];
        const bulletSpeed = 8;
        const damage = player.damageMultiplier || 1;
        const color = player.primaryColor;
        const glowColor = hexToRgba(color, 0.5);

        switch (player.powerLevel) {
            case 1:
                bullets.push(BulletPattern.straight(player.x, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                break;
            case 2:
                bullets.push(BulletPattern.straight(player.x - 10, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 10, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                break;
            case 3:
                bullets.push(BulletPattern.straight(player.x, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x - 12, player.y - player.height / 2, -Math.PI / 2 - 0.15, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 12, player.y - player.height / 2, -Math.PI / 2 + 0.15, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                break;
            case 4:
                bullets.push(BulletPattern.straight(player.x - 10, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 10, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x - 18, player.y - player.height / 2, -Math.PI / 2 - 0.2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 18, player.y - player.height / 2, -Math.PI / 2 + 0.2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                break;
            case 5:
                bullets.push(BulletPattern.straight(player.x, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x - 15, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 15, player.y - player.height / 2, -Math.PI / 2, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x - 25, player.y - player.height / 2, -Math.PI / 2 - 0.25, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                bullets.push(BulletPattern.straight(player.x + 25, player.y - player.height / 2, -Math.PI / 2 + 0.25, bulletSpeed, true, color, glowColor, 5, 'normal', 1));
                break;
        }

        bullets.forEach(b => {
            b.damage = damage;
            b.homingStrength = 3;
            b.isPlayerHoming = true;
        });
        return bullets;
    }

    static spread(player, currentTime) {
        if (currentTime - player.lastShootTime < player.shootCooldown) {
            return [];
        }
        player.lastShootTime = currentTime;

        const bullets = [];
        const bulletSpeed = 9;
        const damage = player.damageMultiplier || 1;
        const baseAngle = -Math.PI / 2;
        const color = player.primaryColor;
        const glowColor = hexToRgba(color, 0.5);

        switch (player.powerLevel) {
            case 1:
                bullets.push(...BulletPattern.spread(player.x, player.y - player.height / 2, baseAngle, 3, Math.PI / 3, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                break;
            case 2:
                bullets.push(...BulletPattern.spread(player.x, player.y - player.height / 2, baseAngle, 5, Math.PI / 2.5, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                break;
            case 3:
                bullets.push(...BulletPattern.spread(player.x, player.y - player.height / 2, baseAngle, 5, Math.PI / 2, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(...BulletPattern.spread(player.x - 10, player.y - player.height / 2, baseAngle, 3, Math.PI / 4, bulletSpeed * 0.9, true, color, glowColor, 3, 'normal', 0.8));
                bullets.push(...BulletPattern.spread(player.x + 10, player.y - player.height / 2, baseAngle, 3, Math.PI / 4, bulletSpeed * 0.9, true, color, glowColor, 3, 'normal', 0.8));
                break;
            case 4:
                bullets.push(...BulletPattern.spread(player.x, player.y - player.height / 2, baseAngle, 7, Math.PI / 1.8, bulletSpeed, true, color, glowColor, 4, 'normal', 1));
                bullets.push(...BulletPattern.spread(player.x - 15, player.y - player.height / 2, baseAngle, 5, Math.PI / 3, bulletSpeed * 0.9, true, color, glowColor, 4, 'normal', 0.9));
                bullets.push(...BulletPattern.spread(player.x + 15, player.y - player.height / 2, baseAngle, 5, Math.PI / 3, bulletSpeed * 0.9, true, color, glowColor, 4, 'normal', 0.9));
                break;
            case 5:
                bullets.push(...BulletPattern.spread(player.x, player.y - player.height / 2, baseAngle, 9, Math.PI / 1.5, bulletSpeed, true, color, glowColor, 5, 'normal', 1.2));
                bullets.push(...BulletPattern.spread(player.x - 15, player.y - player.height / 2, baseAngle, 5, Math.PI / 2.5, bulletSpeed * 0.9, true, color, glowColor, 4, 'normal', 1));
                bullets.push(...BulletPattern.spread(player.x + 15, player.y - player.height / 2, baseAngle, 5, Math.PI / 2.5, bulletSpeed * 0.9, true, color, glowColor, 4, 'normal', 1));
                bullets.push(...BulletPattern.spread(player.x - 25, player.y - player.height / 2, baseAngle, 3, Math.PI / 3, bulletSpeed * 0.8, true, color, glowColor, 3, 'normal', 0.8));
                bullets.push(...BulletPattern.spread(player.x + 25, player.y - player.height / 2, baseAngle, 3, Math.PI / 3, bulletSpeed * 0.8, true, color, glowColor, 3, 'normal', 0.8));
                break;
        }

        bullets.forEach(b => b.damage = damage);
        return bullets;
    }
}

class CharacterManager {
    constructor() {
        this.characters = [
            new Character({
                id: 'reimu',
                name: '灵梦',
                description: '平衡型角色，各方面性能均衡，适合新手使用',
                speed: 5,
                shootCooldown: 150,
                damageMultiplier: 1.0,
                hitboxRadius: 8,
                initialPowerLevel: 2,
                primaryColor: '#ff0066',
                attackType: 'normal',
                shoot: (player, currentTime) => AttackPatterns.normal(player, currentTime)
            }),
            new Character({
                id: 'marisa',
                name: '魔理沙',
                description: '攻击型角色，穿透弹可贯穿多个敌人',
                speed: 6,
                shootCooldown: 120,
                damageMultiplier: 1.3,
                hitboxRadius: 10,
                initialPowerLevel: 1,
                primaryColor: '#ffff00',
                attackType: 'pierce',
                shoot: (player, currentTime) => AttackPatterns.pierce(player, currentTime)
            }),
            new Character({
                id: 'sakuya',
                name: '咲夜',
                description: '速度型角色，移动和射击都非常快',
                speed: 7,
                shootCooldown: 100,
                damageMultiplier: 0.9,
                hitboxRadius: 7,
                initialPowerLevel: 2,
                primaryColor: '#66ccff',
                attackType: 'laser',
                shoot: (player, currentTime) => AttackPatterns.laser(player, currentTime)
            }),
            new Character({
                id: 'yuyuko',
                name: '幽幽子',
                description: '追踪型角色，子弹会自动追踪敌人',
                speed: 4,
                shootCooldown: 200,
                damageMultiplier: 1.2,
                hitboxRadius: 9,
                initialPowerLevel: 2,
                primaryColor: '#cc99ff',
                attackType: 'homing',
                shoot: (player, currentTime) => AttackPatterns.homing(player, currentTime)
            }),
            new Character({
                id: 'mokou',
                name: '藤原妹红',
                description: '防御型角色，高伤害广角散射，火力压制强',
                speed: 4,
                shootCooldown: 180,
                damageMultiplier: 1.5,
                hitboxRadius: 12,
                initialPowerLevel: 3,
                primaryColor: '#ff6600',
                attackType: 'spread',
                shoot: (player, currentTime) => AttackPatterns.spread(player, currentTime)
            })
        ];
    }

    getCharacters() {
        return this.characters;
    }

    getCharacter(id) {
        return this.characters.find(c => c.id === id);
    }

    applyCharacterToPlayer(player, characterId) {
        const character = this.getCharacter(characterId);
        if (!character) return;

        player.characterId = character.id;
        player.speed = character.speed;
        player.shootCooldown = character.shootCooldown;
        player.damageMultiplier = character.damageMultiplier;
        player.hitboxRadius = character.hitboxRadius;
        player.powerLevel = character.initialPowerLevel;
        player.primaryColor = character.primaryColor;
        player.attackType = character.attackType;
        player.shoot = (currentTime) => character.shoot(player, currentTime);
    }

    drawCharacterPreview(ctx, character, x, y, size) {
        ctx.save();
        ctx.translate(x, y);

        const scale = size / 50;
        ctx.scale(scale, scale);

        Utils.drawGlow(ctx, 0, 0, 30, hexToRgba(character.primaryColor, 0.3));

        ctx.fillStyle = character.primaryColor;
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(-20, 25);
        ctx.lineTo(-10, 17);
        ctx.lineTo(0, 20);
        ctx.lineTo(10, 17);
        ctx.lineTo(20, 25);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = character.primaryColor.replace(/^#/, '#33');
        ctx.beginPath();
        ctx.ellipse(0, -5, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = character.primaryColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, character.hitboxRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
