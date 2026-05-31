class CombatSystem {
    constructor() {
        this.damageNumbers = [];
        this.combatMode = 'realtime';
        this.turnState = null;
    }

    isPlayerTurn() {
        return !this.turnState || this.turnState.turn === 'player';
    }

    playerAttack(player, enemy) {
        if (!enemy || enemy.dead) return null;
        if (this.isTurnBased() && !this.isPlayerTurn()) return null;
        const baseDamage = player.attack;
        const variance = Math.floor(Math.random() * 5) - 2;
        const damage = Math.max(1, baseDamage + variance);
        const killed = enemy.takeDamage(damage);
        this.addDamageNumber(enemy.getPixelX() + 16, enemy.getPixelY(), damage, '#ffd700');
        player.isAttacking = true;
        setTimeout(() => { player.isAttacking = false; }, 200);
        return { damage, killed, enemy };
    }

    playerSkillAttack(player, skill, enemies) {
        if (!skill) return { success: false };
        if (this.isTurnBased() && !this.isPlayerTurn()) return { success: false };
        const baseDamage = player.attack;
        const damage = Math.max(1, Math.floor(baseDamage * (skill.damageMultiplier || 1)));
        const results = [];

        if (skill.buff) {
            player.mp -= skill.mpCost;
            player.skillSystem.useSkill(skill.id);
            player.isAttacking = true;
            setTimeout(() => { player.isAttacking = false; }, 300);
            return { success: true, isBuff: true, results: [] };
        }

        if (skill.aoe) {
            for (const enemy of enemies) {
                if (enemy.dead) continue;
                const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
                const range = skill.range || 2;
                if (dist <= range) {
                    const dmg = skill.ignoreDefense ? damage : Math.max(1, damage);
                    const killed = enemy.takeDamage(dmg);
                    this.addDamageNumber(enemy.getPixelX() + 16, enemy.getPixelY(), dmg, player.classData.color);
                    results.push({ enemy, damage: dmg, killed });
                }
            }
        } else {
            let targetEnemy = null;
            let attackX = player.x, attackY = player.y;
            switch (player.direction) {
                case 'up': attackY--; break;
                case 'down': attackY++; break;
                case 'left': attackX--; break;
                case 'right': attackX++; break;
            }
            const range = skill.range || 1;
            for (const enemy of enemies) {
                if (enemy.dead) continue;
                const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
                if (dist <= range) {
                    if (enemy.x === attackX && enemy.y === attackY) { targetEnemy = enemy; break; }
                    if (!targetEnemy) targetEnemy = enemy;
                }
            }
            if (targetEnemy) {
                const dmg = skill.ignoreDefense ? damage : Math.max(1, damage);
                const killed = targetEnemy.takeDamage(dmg);
                this.addDamageNumber(targetEnemy.getPixelX() + 16, targetEnemy.getPixelY(), dmg, player.classData.color);
                if (skill.stun) targetEnemy.stunned = skill.stun;
                if (skill.dot) { targetEnemy.dotDamage = skill.dot.damage; targetEnemy.dotDuration = skill.dot.duration; }
                results.push({ enemy: targetEnemy, damage: dmg, killed });
            }
        }

        if (results.length === 0 && !skill.aoe) {
            return { success: false, results: [] };
        }

        player.mp -= skill.mpCost;
        player.skillSystem.useSkill(skill.id);
        player.isAttacking = true;
        setTimeout(() => { player.isAttacking = false; }, 300);
        return { success: true, results };
    }

    enemyAttack(enemy, player) {
        if (player.invincible) return null;
        const baseDamage = enemy.attack;
        const variance = Math.floor(Math.random() * 3) - 1;
        const damage = Math.max(1, baseDamage + variance);
        const actualDamage = player.takeDamage(damage);
        if (actualDamage > 0) {
            this.addDamageNumber(player.getPixelX() + 16, player.getPixelY(), actualDamage, '#ff4444');
        }
        return { damage: actualDamage };
    }

    handleKill(player, enemy) {
        const expGain = enemy.exp;
        const goldGain = enemy.gold;
        player.gold += goldGain;
        const leveledUp = player.gainExp(expGain);
        return { expGain, goldGain, leveledUp };
    }

    startTurnBasedCombat(player, enemy) {
        this.combatMode = 'turnbased';
        this.turnState = {
            player,
            enemy,
            turn: 'player',
            playerActed: false,
            enemyActed: false
        };
    }

    endTurnBasedCombat() {
        this.combatMode = 'realtime';
        this.turnState = null;
    }

    isTurnBased() { return this.combatMode === 'turnbased'; }

    toggleCombatMode() {
        if (this.combatMode === 'realtime') {
            this.combatMode = 'turnbased';
        } else {
            this.combatMode = 'realtime';
            this.turnState = null;
        }
    }

    addDamageNumber(x, y, damage, color) {
        this.damageNumbers.push({ x, y, damage, color, life: 60, vy: -2 });
    }

    update() {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.y += dn.vy;
            dn.life--;
            if (dn.life <= 0) this.damageNumbers.splice(i, 1);
        }
    }

    render(ctx) {
        for (const dn of this.damageNumbers) {
            const alpha = dn.life / 60;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = dn.color;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(dn.damage.toString(), dn.x, dn.y);
            ctx.fillText(dn.damage.toString(), dn.x, dn.y);
            ctx.restore();
        }
    }
}

class ParticleSystem {
    constructor() { this.particles = []; }

    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 30 + Math.random() * 20, maxLife: 50, size: 3 + Math.random() * 4, color });
        }
    }

    createLevelUpEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            this.particles.push({ x, y, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3, life: 40, maxLife: 40, size: 5, color: '#ffd700' });
        }
        for (let i = 0; i < 15; i++) {
            this.particles.push({ x: x + (Math.random() - 0.5) * 20, y, vx: 0, vy: -2 - Math.random() * 2, life: 50, maxLife: 50, size: 4, color: '#fff' });
        }
    }

    createCollectEffect(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.particles.push({ x, y, vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2, life: 25, maxLife: 25, size: 4, color });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }
}
