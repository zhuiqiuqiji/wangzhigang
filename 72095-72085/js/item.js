class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 14;
        this.active = true;
        this.vy = 1.5;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.1;
        this.attractSpeed = 5;
        this.attractRadius = 120;
        this.time = 0;
        this.rotation = 0;

        this.setTypeProperties();
    }

    setTypeProperties() {
        switch (this.type) {
            case 'coin':
                this.color = '#ffd700';
                this.glowColor = 'rgba(255, 215, 0, 0.5)';
                this.value = 10;
                this.symbol = '◆';
                this.radius = 10;
                break;
            case 'health':
                this.color = '#00ff88';
                this.glowColor = 'rgba(0, 255, 136, 0.5)';
                this.value = 1;
                this.symbol = '+';
                this.radius = 12;
                break;
            case 'power':
                this.color = '#ff00ff';
                this.glowColor = 'rgba(255, 0, 255, 0.5)';
                this.value = 1;
                this.symbol = '★';
                this.radius = 12;
                break;
            case 'shield':
                this.color = '#00aaff';
                this.glowColor = 'rgba(0, 170, 255, 0.5)';
                this.duration = 8000;
                this.symbol = '🛡';
                this.radius = 14;
                break;
            case 'bomb':
                this.color = '#ff6600';
                this.glowColor = 'rgba(255, 102, 0, 0.5)';
                this.symbol = '💣';
                this.radius = 14;
                break;
            case 'slow':
                this.color = '#6666ff';
                this.glowColor = 'rgba(102, 102, 255, 0.5)';
                this.duration = 5000;
                this.symbol = '❄';
                this.radius = 14;
                break;
            case 'score':
                this.color = '#ffff00';
                this.glowColor = 'rgba(255, 255, 0, 0.5)';
                this.value = 500;
                this.symbol = '✨';
                this.radius = 12;
                break;
        }
    }

    update(player, canvas) {
        this.bobOffset += this.bobSpeed;
        this.time++;
        this.rotation += 0.03;

        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        if (dist < this.attractRadius) {
            const angle = Utils.angle(this.x, this.y, player.x, player.y);
            const attractForce = (1 - dist / this.attractRadius) * this.attractSpeed;
            this.x += Math.cos(angle) * attractForce;
            this.y += Math.sin(angle) * attractForce;
        } else {
            this.y += this.vy;
        }

        if (this.y > canvas.height + 50) {
            this.active = false;
        }
    }

    draw(ctx) {
        const bobY = this.y + Math.sin(this.bobOffset) * 4;

        ctx.save();
        ctx.translate(this.x, bobY);

        Utils.drawGlow(ctx, 0, 0, this.radius * 2.5, this.glowColor);

        const pulse = 1 + Math.sin(this.time * 0.1) * 0.1;
        ctx.rotate(this.rotation);
        ctx.scale(pulse, pulse);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${this.radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 1);

        ctx.restore();
    }

    collect(player, game) {
        this.active = false;

        switch (this.type) {
            case 'coin':
                player.coins += this.value;
                break;
            case 'health':
                player.lives = Math.min(player.lives + this.value, player.maxLives);
                break;
            case 'power':
                player.powerLevel = Math.min(player.powerLevel + this.value, player.maxPowerLevel);
                break;
            case 'shield':
                player.activateShield(this.duration);
                break;
            case 'bomb':
                if (game) {
                    game.triggerScreenClear();
                    game.bombCount = Math.min(game.bombCount + 1, 5);
                }
                break;
            case 'slow':
                if (game) {
                    game.activateSlowField(this.duration);
                }
                break;
            case 'score':
                if (game) {
                    game.score += this.value;
                }
                break;
        }
    }
}

class ItemManager {
    constructor() {
        this.items = [];
    }

    spawn(x, y, type) {
        this.items.push(new Item(x, y, type));
    }

    spawnRandomDrop(x, y) {
        const rand = Math.random();
        if (rand < 0.4) {
            this.spawn(x, y, 'coin');
        } else if (rand < 0.5) {
            this.spawn(x, y, 'power');
        } else if (rand < 0.55) {
            this.spawn(x, y, 'health');
        } else if (rand < 0.6) {
            this.spawn(x, y, 'shield');
        } else if (rand < 0.65) {
            this.spawn(x, y, 'bomb');
        } else if (rand < 0.7) {
            this.spawn(x, y, 'slow');
        } else if (rand < 0.8) {
            this.spawn(x, y, 'score');
        }
    }

    spawnBossDrop(x, y) {
        this.spawn(x, y, 'health');
        this.spawn(x - 30, y, 'power');
        this.spawn(x + 30, y, 'power');
        this.spawn(x - 15, y - 20, 'shield');
        this.spawn(x + 15, y - 20, 'score');
    }

    update(player, canvas) {
        this.items.forEach(item => item.update(player, canvas));
        this.items = this.items.filter(item => item.active);
    }

    draw(ctx) {
        this.items.forEach(item => item.draw(ctx));
    }

    checkCollision(player, particles, game) {
        this.items.forEach(item => {
            if (Utils.circleCollision(item.x, item.y, item.radius, player.x, player.y, player.hitboxRadius)) {
                item.collect(player, game);
                particles.emit(item.x, item.y, item.color, 15, 4, 25, 4);
            }
        });
    }

    clear() {
        this.items = [];
    }
}