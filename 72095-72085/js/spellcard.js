const SPELL_CARDS = [
    {
        id: 'dream_seal',
        name: '梦想封印',
        spellName: '梦想封印',
        type: 'bomb',
        duration: 1000,
        cooldown: 15000,
        damage: 0,
        color: '#ff00ff',
        activate(player, game) {
            game.bulletManager.enemyBullets.forEach(b => {
                game.particles.emit(b.x, b.y, '#ff00ff', 3, 2, 20, 3);
                b.active = false;
            });
            game.bulletManager.enemyBullets = [];
            game.flashColor = '#ff00ff';
            game.flashAlpha = 0.4;
        }
    },
    {
        id: 'extreme_spark',
        name: '极限火花',
        spellName: '极限火花',
        type: 'barrage',
        duration: 3000,
        cooldown: 20000,
        damage: 2,
        color: '#ff6600',
        activate(player, game) {
            this.timer = 0;
        },
        update(player, game, deltaTime) {
            this.timer += deltaTime;
            if (this.timer >= 200) {
                this.timer = 0;
                const bullets = BulletPattern.create({
                    type: 'ring',
                    x: player.x,
                    y: player.y,
                    count: 24,
                    speed: 6,
                    color: '#ff6600',
                    radius: 5,
                    size: 1.2
                });
                bullets.forEach(b => {
                    b.isPlayerBullet = true;
                    b.damage = this.damage;
                    b.glowColor = 'rgba(255, 102, 0, 0.5)';
                });
                game.bulletManager.addPlayerBullets(bullets);
            }
        },
        draw(ctx, player, game) {
            Utils.drawGlow(ctx, player.x, player.y, 80, 'rgba(255, 102, 0, 0.3)');
        }
    },
    {
        id: 'dream_born',
        name: '符之一: 梦想天生',
        spellName: '梦想天生',
        type: 'shield',
        duration: 5000,
        cooldown: 25000,
        damage: 0,
        color: '#00ffff',
        activate(player, game) {
            player.invincible = true;
            player.invincibleTimer = this.duration;
            game.flashColor = '#00ffff';
            game.flashAlpha = 0.3;
        },
        draw(ctx, player, game) {
            ctx.save();
            ctx.translate(player.x, player.y);
            const time = Date.now() * 0.003;
            for (let i = 0; i < 3; i++) {
                const radius = 40 + i * 10 + Math.sin(time + i) * 5;
                ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 - i * 0.15})`;
                ctx.lineWidth = 3 - i;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
    },
    {
        id: 'light_cannon',
        name: '符之二: 流光炮击',
        spellName: '流光炮击',
        type: 'laser',
        duration: 2000,
        cooldown: 18000,
        damage: 5,
        color: '#ffff00',
        activate(player, game) {
            this.timer = 0;
            game.flashColor = '#ffff00';
            game.flashAlpha = 0.3;
        },
        update(player, game, deltaTime) {
            this.timer += deltaTime;
            if (this.timer >= 100) {
                this.timer = 0;
                const bullets = BulletPattern.create({
                    type: 'laser',
                    x: player.x,
                    y: player.y - player.height / 2,
                    count: 3,
                    speed: 15,
                    rotation: -Math.PI / 2,
                    spreadAngle: 0.2,
                    color: '#ffff00',
                    radius: 8,
                    size: 1.5
                });
                bullets.forEach(b => {
                    b.isPlayerBullet = true;
                    b.damage = this.damage;
                    b.life = 60;
                    b.glowColor = 'rgba(255, 255, 0, 0.5)';
                });
                game.bulletManager.addPlayerBullets(bullets);
            }
        },
        draw(ctx, player, game) {
            Utils.drawGlow(ctx, player.x, player.y - 30, 60, 'rgba(255, 255, 0, 0.4)');
        }
    },
    {
        id: 'lunar_clock',
        name: '符之三: 月时计',
        spellName: '月时计',
        type: 'slow',
        duration: 8000,
        cooldown: 30000,
        damage: 0,
        color: '#6666ff',
        activate(player, game) {
            game.bulletManager.enemyBullets.forEach(b => {
                b.vx *= 0.5;
                b.vy *= 0.5;
            });
            this.slowFactor = 0.5;
            game.flashColor = '#6666ff';
            game.flashAlpha = 0.2;
        },
        update(player, game, deltaTime) {
            game.bulletManager.enemyBullets.forEach(b => {
                b.vx *= 0.999;
                b.vy *= 0.999;
            });
        },
        draw(ctx, player, game) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#6666ff';
            ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
            ctx.restore();

            const time = Date.now() * 0.001;
            ctx.save();
            ctx.translate(game.canvas.width - 80, 80);
            ctx.rotate(time);
            ctx.strokeStyle = 'rgba(102, 102, 255, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * 25, Math.sin(angle) * 25);
                ctx.lineTo(Math.cos(angle) * 35, Math.sin(angle) * 35);
                ctx.stroke();
            }
            ctx.restore();
        }
    },
    {
        id: 'killer_barrage',
        name: '符之四: 死符「杀人弹幕」',
        spellName: '死符「杀人弹幕」',
        type: 'barrage',
        duration: 4000,
        cooldown: 22000,
        damage: 3,
        color: '#ff0000',
        activate(player, game) {
            this.timer = 0;
            this.rotation = 0;
        },
        update(player, game, deltaTime) {
            this.timer += deltaTime;
            this.rotation += 0.02;
            if (this.timer >= 150) {
                this.timer = 0;
                const bullets1 = BulletPattern.create({
                    type: 'circle',
                    x: player.x,
                    y: player.y,
                    count: 16,
                    speed: 5,
                    rotation: this.rotation,
                    color: '#ff0000',
                    radius: 6,
                    size: 1.1
                });
                const bullets2 = BulletPattern.create({
                    type: 'circle',
                    x: player.x,
                    y: player.y,
                    count: 12,
                    speed: 3.5,
                    rotation: -this.rotation * 1.5,
                    color: '#ff6666',
                    radius: 5,
                    size: 0.9
                });
                [...bullets1, ...bullets2].forEach(b => {
                    b.isPlayerBullet = true;
                    b.damage = this.damage;
                    b.glowColor = b.color.replace(')', ', 0.5)').replace('rgb', 'rgba');
                });
                game.bulletManager.addPlayerBullets([...bullets1, ...bullets2]);
            }
        },
        draw(ctx, player, game) {
            Utils.drawGlow(ctx, player.x, player.y, 70, 'rgba(255, 0, 0, 0.3)');
        }
    },
    {
        id: 'oni_kanabou',
        name: '符之五: 鬼符「鬼金棒」',
        spellName: '鬼符「鬼金棒」',
        type: 'power',
        duration: 10000,
        cooldown: 28000,
        damage: 0,
        color: '#ff8800',
        activate(player, game) {
            this.originalPower = player.powerLevel;
            player.powerLevel = Math.min(player.maxPowerLevel, player.powerLevel + 2);
            this.damageMultiplier = 2;
            game.flashColor = '#ff8800';
            game.flashAlpha = 0.3;
        },
        deactivate(player, game) {
            player.powerLevel = this.originalPower;
        },
        draw(ctx, player, game) {
            const time = Date.now() * 0.005;
            ctx.save();
            ctx.translate(player.x, player.y);
            for (let i = 0; i < 2; i++) {
                const offset = (time + i * Math.PI) % (Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 136, 0, ${0.6 - i * 0.3})`;
                ctx.lineWidth = 4 - i * 2;
                ctx.beginPath();
                ctx.arc(0, 0, 35 + Math.sin(offset) * 8, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.fillStyle = '#ff8800';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('x2', 0, -45);
            ctx.restore();
        }
    },
    {
        id: 'dream_seal_scatter',
        name: '符之六: 灵符「梦想封印 散」',
        spellName: '灵符「梦想封印 散」',
        type: 'bomb',
        duration: 1500,
        cooldown: 30000,
        damage: 10,
        color: '#ff00ff',
        activate(player, game) {
            game.bulletManager.enemyBullets.forEach(b => {
                game.particles.emit(b.x, b.y, '#ff00ff', 5, 3, 25, 4);
                b.active = false;
            });
            game.bulletManager.enemyBullets = [];

            game.enemyManager.enemies.forEach(enemy => {
                if (enemy.active) {
                    const killed = enemy.takeDamage(this.damage, game.particles);
                    if (killed && !(enemy instanceof Boss)) {
                        game.itemManager.spawnRandomDrop(enemy.x, enemy.y);
                    }
                }
            });

            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const bullets = BulletPattern.create({
                        type: 'circle',
                        x: player.x,
                        y: player.y,
                        count: 20,
                        speed: 7 + i,
                        rotation: i * 0.3,
                        color: '#ff00ff',
                        radius: 6,
                        size: 1.3
                    });
                    bullets.forEach(b => {
                        b.isPlayerBullet = true;
                        b.damage = 2;
                        b.glowColor = 'rgba(255, 0, 255, 0.5)';
                    });
                    game.bulletManager.addPlayerBullets(bullets);
                }, i * 100);
            }

            game.flashColor = '#ff00ff';
            game.flashAlpha = 0.6;
            game.screenShake = 15;
        }
    },
    {
        id: 'extreme_spark_love',
        name: '符之七: 恋符「极限火花」',
        spellName: '恋符「极限火花」',
        type: 'laser',
        duration: 2500,
        cooldown: 25000,
        damage: 4,
        color: '#ff66cc',
        activate(player, game) {
            this.timer = 0;
            this.angle = 0;
            game.flashColor = '#ff66cc';
            game.flashAlpha = 0.4;
        },
        update(player, game, deltaTime) {
            this.timer += deltaTime;
            this.angle += 0.08;
            if (this.timer >= 120) {
                this.timer = 0;
                const bullets = [];
                for (let i = 0; i < 8; i++) {
                    const angle = this.angle + (i / 8) * Math.PI * 2;
                    const bullet = BulletPattern.straight(
                        player.x, player.y,
                        angle, 12, true,
                        '#ff66cc', 'rgba(255, 102, 204, 0.5)',
                        10, 'laser', 1.5
                    );
                    bullet.damage = this.damage;
                    bullet.life = 45;
                    bullets.push(bullet);
                }
                game.bulletManager.addPlayerBullets(bullets);
            }
        },
        draw(ctx, player, game) {
            Utils.drawGlow(ctx, player.x, player.y, 100, 'rgba(255, 102, 204, 0.4)');
            const time = Date.now() * 0.003;
            ctx.save();
            ctx.translate(player.x, player.y);
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + time;
                ctx.strokeStyle = `rgba(255, 102, 204, ${0.3 + Math.sin(angle * 2) * 0.2})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * 80, Math.sin(angle) * 80);
                ctx.stroke();
            }
            ctx.restore();
        }
    },
    {
        id: 'orrery_solar_system',
        name: '符之八: 天仪「Orrery\'s Solar System」',
        spellName: '天仪「Orrery\'s Solar System」',
        type: 'barrage',
        duration: 5000,
        cooldown: 35000,
        damage: 2,
        color: '#88ccff',
        activate(player, game) {
            this.timer = 0;
            this.planets = [];
            const colors = ['#ffcc00', '#ff6600', '#66ccff', '#ff4444', '#ffaa00', '#aa88ff', '#88ddff', '#cccccc'];
            for (let i = 0; i < 8; i++) {
                this.planets.push({
                    angle: (i / 8) * Math.PI * 2,
                    radius: 60 + i * 25,
                    speed: 0.03 + (7 - i) * 0.005,
                    color: colors[i],
                    size: 8 + Math.sin(i) * 4
                });
            }
            game.flashColor = '#88ccff';
            game.flashAlpha = 0.3;
        },
        update(player, game, deltaTime) {
            this.timer += deltaTime;
            this.planets.forEach(p => {
                p.angle += p.speed;
            });
            if (this.timer >= 300) {
                this.timer = 0;
                const bullets = [];
                this.planets.forEach(p => {
                    const px = player.x + Math.cos(p.angle) * p.radius;
                    const py = player.y + Math.sin(p.angle) * p.radius;
                    const bullet = BulletPattern.straight(
                        px, py,
                        p.angle, 4, true,
                        p.color, p.color.replace(')', ', 0.5)').replace('rgb', 'rgba'),
                        p.size * 0.6, 'normal', p.size * 0.15
                    );
                    bullet.damage = this.damage;
                    bullets.push(bullet);
                });
                game.bulletManager.addPlayerBullets(bullets);
            }
        },
        draw(ctx, player, game) {
            ctx.save();
            ctx.translate(player.x, player.y);
            this.planets.forEach(p => {
                const px = Math.cos(p.angle) * p.radius;
                const py = Math.sin(p.angle) * p.radius;
                ctx.strokeStyle = 'rgba(136, 204, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.stroke();
                Utils.drawGlow(ctx, px, py, p.size * 3, p.color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(px, py, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px - p.size * 0.3, py - p.size * 0.3, p.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            });
            Utils.drawGlow(ctx, 0, 0, 25, 'rgba(255, 204, 0, 0.6)');
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
];

class SpellCardSystem {
    constructor(game) {
        this.game = game;
        this.spellCards = SPELL_CARDS;
        this.activeCard = null;
        this.activeTimer = 0;
        this.cooldowns = {};
        this.spellCards.forEach(card => {
            this.cooldowns[card.id] = 0;
        });
    }

    useSpellCard(cardId, player) {
        if (this.activeCard) return false;
        if (this.cooldowns[cardId] > 0) return false;

        const card = this.spellCards.find(c => c.id === cardId);
        if (!card) return false;

        this.activeCard = card;
        this.activeTimer = card.duration;
        this.cooldowns[cardId] = card.cooldown;

        if (card.activate) {
            card.activate(player, this.game);
        }

        return true;
    }

    update(deltaTime) {
        Object.keys(this.cooldowns).forEach(id => {
            if (this.cooldowns[id] > 0) {
                this.cooldowns[id] -= deltaTime;
                if (this.cooldowns[id] < 0) this.cooldowns[id] = 0;
            }
        });

        if (this.activeCard) {
            this.activeTimer -= deltaTime;
            if (this.activeCard.update) {
                this.activeCard.update(this.game.player, this.game, deltaTime);
            }
            if (this.activeTimer <= 0) {
                if (this.activeCard.deactivate) {
                    this.activeCard.deactivate(this.game.player, this.game);
                }
                this.activeCard = null;
            }
        }
    }

    isActive() {
        return this.activeCard !== null;
    }

    getActiveCard() {
        return this.activeCard;
    }

    getCooldown(cardId) {
        return this.cooldowns[cardId] || 0;
    }

    isReady(cardId) {
        return this.cooldowns[cardId] <= 0;
    }

    draw(ctx) {
        if (this.activeCard && this.activeCard.draw) {
            this.activeCard.draw(ctx, this.game.player, this.game);
        }
    }

    clearAll() {
        if (this.activeCard && this.activeCard.deactivate) {
            this.activeCard.deactivate(this.game.player, this.game);
        }
        this.activeCard = null;
        this.activeTimer = 0;
        Object.keys(this.cooldowns).forEach(id => {
            this.cooldowns[id] = 0;
        });
    }
}
