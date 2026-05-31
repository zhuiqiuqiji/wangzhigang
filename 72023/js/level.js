class Level {
    constructor(levelNumber, mapType, canvasWidth, canvasHeight) {
        this.levelNumber = levelNumber;
        this.mapType = mapType;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        const base = levelNumber - 1;
        this.requiredTreasures = 6 + base * 2;
        this.pearlCount = 5 + base * 2;
        this.coinCount = 3 + base * 2;
        this.oxygenTankCount = 2 + Math.floor(base / 2);
        this.patrolEnemyCount = 2 + Math.floor(base / 2);
        this.chaseEnemyCount = Math.min(base, 3);
        this.ambushEnemyCount = Math.min(Math.max(0, base - 1), 2);

        this.seaweeds = [];
        this.corals = [];
        this.specialDecorations = [];
        this._generateScenery();

        this._setupBossType();
    }

    _setupBossType() {
        switch (this.mapType) {
            case 'reef':
                this.bossType = 'giantJellyfish';
                break;
            case 'trench':
                this.bossType = 'anglerfish';
                break;
            case 'shipwreck':
                this.bossType = 'kraken';
                break;
            case 'volcano':
                this.bossType = 'lavacrab';
                break;
            default:
                this.bossType = 'giantJellyfish';
        }
    }

    _generateScenery() {
        this.seaweeds = [];
        this.corals = [];
        this.specialDecorations = [];

        const seaweedCount = Utils.randomInt(6, 10);
        for (let i = 0; i < seaweedCount; i++) {
            this.seaweeds.push({
                x: Utils.random(20, this.canvasWidth - 20),
                height: Utils.random(40, 100),
                segments: Utils.randomInt(4, 7),
                phase: Utils.random(0, Math.PI * 2),
                speed: Utils.random(1, 2),
                color: this._getSeaweedColor()
            });
        }

        const coralCount = Utils.randomInt(3, 6);
        for (let i = 0; i < coralCount; i++) {
            this.corals.push({
                x: Utils.random(30, this.canvasWidth - 30),
                type: Utils.randomInt(0, 2),
                color: this._getCoralColor(),
                size: Utils.random(15, 30)
            });
        }

        this._generateSpecialDecorations();
    }

    _getSeaweedColor() {
        const colors = {
            reef: ['#2ecc71', '#27ae60', '#1abc9c'],
            trench: ['#8e44ad', '#9b59b6', '#3498db'],
            shipwreck: ['#556b2f', '#6b8e23', '#556b2f'],
            volcano: ['#c0392b', '#e74c3c', '#d35400']
        };
        const mapColors = colors[this.mapType] || colors.reef;
        return mapColors[Utils.randomInt(0, mapColors.length - 1)];
    }

    _getCoralColor() {
        const colors = {
            reef: ['#ff6b6b', '#ff9ff3', '#feca57', '#ff9f43'],
            trench: ['#9b59b6', '#8e44ad', '#3498db', '#2980b9'],
            shipwreck: ['#a0522d', '#8b4513', '#654321', '#cd853f'],
            volcano: ['#e74c3c', '#c0392b', '#d35400', '#e67e22']
        };
        const mapColors = colors[this.mapType] || colors.reef;
        return mapColors[Utils.randomInt(0, mapColors.length - 1)];
    }

    _generateSpecialDecorations() {
        switch (this.mapType) {
            case 'reef':
                for (let i = 0; i < 3; i++) {
                    this.specialDecorations.push({
                        type: 'anemone',
                        x: Utils.random(50, this.canvasWidth - 50),
                        y: this.canvasHeight - 35,
                        size: Utils.random(20, 35),
                        color: ['#ff6b9d', '#ff85a2', '#ffb3c1'][Utils.randomInt(0, 2)],
                        phase: Utils.random(0, Math.PI * 2)
                    });
                }
                break;
            case 'trench':
                for (let i = 0; i < 5; i++) {
                    this.specialDecorations.push({
                        type: 'glowingPlant',
                        x: Utils.random(30, this.canvasWidth - 30),
                        y: Utils.random(this.canvasHeight * 0.3, this.canvasHeight - 50),
                        size: Utils.random(8, 15),
                        color: ['#00e5ff', '#7c4dff', '#b388ff'][Utils.randomInt(0, 2)],
                        phase: Utils.random(0, Math.PI * 2)
                    });
                }
                break;
            case 'shipwreck':
                this.specialDecorations.push({
                    type: 'shipwreck',
                    x: this.canvasWidth * 0.6,
                    y: this.canvasHeight - 60,
                    width: Utils.random(120, 160),
                    height: Utils.random(50, 70)
                });
                for (let i = 0; i < 4; i++) {
                    this.specialDecorations.push({
                        type: 'barnacle',
                        x: Utils.random(40, this.canvasWidth - 40),
                        y: this.canvasHeight - 40,
                        size: Utils.random(6, 12)
                    });
                }
                break;
            case 'volcano':
                for (let i = 0; i < 3; i++) {
                    this.specialDecorations.push({
                        type: 'lavaVent',
                        x: Utils.random(80, this.canvasWidth - 80),
                        y: this.canvasHeight - 30,
                        size: Utils.random(15, 25),
                        phase: Utils.random(0, Math.PI * 2)
                    });
                }
                for (let i = 0; i < 6; i++) {
                    this.specialDecorations.push({
                        type: 'rock',
                        x: Utils.random(30, this.canvasWidth - 30),
                        y: this.canvasHeight - 35,
                        size: Utils.random(10, 20),
                        color: ['#4a4a4a', '#5a5a5a', '#3a3a3a'][Utils.randomInt(0, 2)]
                    });
                }
                break;
        }
    }

    generateEnemies() {
        const enemies = [];
        const margin = 60;

        for (let i = 0; i < this.patrolEnemyCount; i++) {
            const types = ['jellyfish', 'shark', 'octopus'];
            const type = types[Utils.randomInt(0, types.length - 1)];
            enemies.push(new Enemy(
                Utils.random(margin, this.canvasWidth - margin),
                Utils.random(margin, this.canvasHeight - margin),
                type,
                'patrol',
                this.canvasWidth,
                this.canvasHeight
            ));
        }

        for (let i = 0; i < this.chaseEnemyCount; i++) {
            const types = ['shark', 'octopus'];
            const type = types[Utils.randomInt(0, types.length - 1)];
            enemies.push(new Enemy(
                Utils.random(margin, this.canvasWidth - margin),
                Utils.random(margin, this.canvasHeight - margin),
                type,
                'chase',
                this.canvasWidth,
                this.canvasHeight
            ));
        }

        for (let i = 0; i < this.ambushEnemyCount; i++) {
            const types = ['octopus', 'jellyfish'];
            const type = types[Utils.randomInt(0, types.length - 1)];
            enemies.push(new Enemy(
                Utils.random(margin, this.canvasWidth - margin),
                Utils.random(margin, this.canvasHeight - margin),
                type,
                'ambush',
                this.canvasWidth,
                this.canvasHeight
            ));
        }

        return enemies;
    }

    generateTreasures() {
        const treasures = [];
        const margin = 50;

        for (let i = 0; i < this.pearlCount; i++) {
            treasures.push(new Treasure(
                Utils.random(margin, this.canvasWidth - margin),
                Utils.random(margin + 30, this.canvasHeight - margin),
                'pearl',
                this.canvasWidth,
                this.canvasHeight
            ));
        }

        for (let i = 0; i < this.coinCount; i++) {
            treasures.push(new Treasure(
                Utils.random(margin, this.canvasWidth - margin),
                Utils.random(margin + 30, this.canvasHeight - margin),
                'coin',
                this.canvasWidth,
                this.canvasHeight
            ));
        }

        for (let i = 0; i < this.oxygenTankCount; i++) {
            treasures.push(new Treasure(
                Utils.random(margin, this.canvasWidth - margin),
                Utils.random(margin + 30, this.canvasHeight - margin),
                'oxygenTank',
                this.canvasWidth,
                this.canvasHeight
            ));
        }

        return treasures;
    }

    getBossType() {
        return this.bossType;
    }

    isComplete(collectedCount) {
        return collectedCount >= this.requiredTreasures;
    }

    renderBackground(ctx, time) {
        this._renderBaseBackground(ctx);
        this._renderLightRays(ctx, time);
        this._renderSpecialDecorations(ctx, time);
        this._renderCorals(ctx);
        this._renderSeaweeds(ctx, time);
        this._renderSandFloor(ctx);
    }

    _renderBaseBackground(ctx) {
        const bgColors = {
            reef: ['#0a3d5c', '#0d4a6e', '#0f5c8a', '#084c6e'],
            trench: ['#1a0a2e', '#2c1654', '#1a237e', '#0d1b3a'],
            shipwreck: ['#2a1f14', '#3d2e1f', '#4a3828', '#1a1a14'],
            volcano: ['#3a0f0f', '#5c1a10', '#8b2500', '#2a0a05']
        };
        const colors = bgColors[this.mapType] || bgColors.reef;

        const grad = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(0.3, colors[1]);
        grad.addColorStop(0.6, colors[2]);
        grad.addColorStop(0.85, colors[3]);
        grad.addColorStop(1, colors[3]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        if (this.mapType === 'trench') {
            for (let i = 0; i < 20; i++) {
                const px = Utils.random(0, this.canvasWidth);
                const py = Utils.random(0, this.canvasHeight);
                const alpha = 0.3 + Math.sin(time * 2 + i) * 0.2;
                ctx.fillStyle = `rgba(100, 150, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (this.mapType === 'volcano') {
            for (let i = 0; i < 3; i++) {
                const gx = this.canvasWidth * 0.2 + i * this.canvasWidth * 0.3;
                const grd = ctx.createRadialGradient(gx, this.canvasHeight, 10, gx, this.canvasHeight, 150);
                const intensity = 0.3 + Math.sin(time * 1.5 + i) * 0.1;
                grd.addColorStop(0, `rgba(255, 100, 30, ${intensity})`);
                grd.addColorStop(1, 'rgba(255, 50, 0, 0)');
                ctx.fillStyle = grd;
                ctx.fillRect(gx - 150, this.canvasHeight - 150, 300, 150);
            }
        }
    }

    _renderLightRays(ctx, time) {
        if (this.mapType === 'trench' || this.mapType === 'volcano') return;

        ctx.save();
        const alpha = this.mapType === 'reef' ? 0.08 : 0.05;
        ctx.globalAlpha = alpha;
        for (let i = 0; i < 5; i++) {
            const x = this.canvasWidth * 0.15 + i * this.canvasWidth * 0.18;
            const sway = Math.sin(time * 0.3 + i * 1.2) * 20;
            const grad = ctx.createLinearGradient(x + sway, 0, x + sway + 40, this.canvasHeight);
            grad.addColorStop(0, '#00e5ff');
            grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x + sway - 15, 0);
            ctx.lineTo(x + sway + 25, 0);
            ctx.lineTo(x + sway + 60, this.canvasHeight);
            ctx.lineTo(x + sway - 50, this.canvasHeight);
            ctx.fill();
        }
        ctx.restore();
    }

    _renderSpecialDecorations(ctx, time) {
        for (const dec of this.specialDecorations) {
            switch (dec.type) {
                case 'anemone':
                    this._renderAnemone(ctx, dec, time);
                    break;
                case 'glowingPlant':
                    this._renderGlowingPlant(ctx, dec, time);
                    break;
                case 'shipwreck':
                    this._renderShipwreck(ctx, dec);
                    break;
                case 'barnacle':
                    this._renderBarnacle(ctx, dec);
                    break;
                case 'lavaVent':
                    this._renderLavaVent(ctx, dec, time);
                    break;
                case 'rock':
                    this._renderRock(ctx, dec);
                    break;
            }
        }
    }

    _renderAnemone(ctx, dec, time) {
        ctx.save();
        ctx.translate(dec.x, dec.y);

        const baseGlow = ctx.createRadialGradient(0, -dec.size / 2, 2, 0, -dec.size / 2, dec.size * 1.5);
        baseGlow.addColorStop(0, 'rgba(255, 150, 180, 0.3)');
        baseGlow.addColorStop(1, 'rgba(255, 100, 150, 0)');
        ctx.fillStyle = baseGlow;
        ctx.beginPath();
        ctx.arc(0, -dec.size / 2, dec.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = dec.color;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const wave = Math.sin(time * 2 + i * 0.8 + dec.phase) * 5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                Math.cos(angle) * (dec.size * 0.5 + wave),
                -dec.size * 0.4 + wave,
                Math.cos(angle) * dec.size * 0.7,
                -dec.size + wave
            );
            ctx.quadraticCurveTo(
                Math.cos(angle) * (dec.size * 0.5 - wave),
                -dec.size * 0.4 - wave,
                0,
                0
            );
            ctx.fill();
        }

        ctx.fillStyle = dec.color;
        ctx.beginPath();
        ctx.arc(0, 0, dec.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _renderGlowingPlant(ctx, dec, time) {
        ctx.save();
        const glow = 0.5 + Math.sin(time * 2 + dec.phase) * 0.5;
        const glowGrad = ctx.createRadialGradient(dec.x, dec.y, 1, dec.x, dec.y, dec.size * 3);
        glowGrad.addColorStop(0, dec.color);
        glowGrad.addColorStop(0.3, `rgba(${hexToRgb(dec.color)}, ${0.5 + glow * 0.3})`);
        glowGrad.addColorStop(1, 'rgba(100, 50, 255, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(dec.x, dec.y, dec.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = dec.color;
        ctx.beginPath();
        ctx.ellipse(dec.x, dec.y, dec.size * 0.4, dec.size, Math.sin(time + dec.phase) * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _renderShipwreck(ctx, dec) {
        ctx.save();
        ctx.translate(dec.x, dec.y);

        ctx.fillStyle = '#5c4a3a';
        ctx.fillRect(-dec.width / 2, -dec.height, dec.width, dec.height * 0.6);
        ctx.fillStyle = '#4a3828';
        ctx.fillRect(-dec.width / 2, -dec.height * 0.4, dec.width, dec.height * 0.4);

        ctx.fillStyle = '#3d2e1f';
        ctx.fillRect(-dec.width / 3, -dec.height * 1.1, dec.width * 0.1, dec.height * 0.4);
        ctx.fillRect(dec.width / 3 - dec.width * 0.1, -dec.height * 1.1, dec.width * 0.1, dec.height * 0.4);

        ctx.fillStyle = '#1a1a2e';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-dec.width / 3 + i * dec.width / 4, -dec.height * 0.8, 12, 15);
        }

        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(-dec.width / 2 + i * dec.width / 4, -dec.height);
            ctx.lineTo(-dec.width / 2 + i * dec.width / 4, 0);
            ctx.stroke();
        }

        ctx.fillStyle = '#6b5344';
        ctx.beginPath();
        ctx.moveTo(dec.width / 2, 0);
        ctx.lineTo(dec.width / 2 + 20, -15);
        ctx.lineTo(dec.width / 2 + 25, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    _renderBarnacle(ctx, dec) {
        ctx.save();
        ctx.fillStyle = '#c9a880';
        ctx.beginPath();
        ctx.moveTo(dec.x - dec.size / 2, dec.y);
        ctx.lineTo(dec.x - dec.size / 3, dec.y - dec.size);
        ctx.lineTo(dec.x + dec.size / 3, dec.y - dec.size);
        ctx.lineTo(dec.x + dec.size / 2, dec.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#b8956c';
        ctx.beginPath();
        ctx.arc(dec.x, dec.y - dec.size / 2, dec.size / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _renderLavaVent(ctx, dec, time) {
        ctx.save();
        const intensity = 0.5 + Math.sin(time * 3 + dec.phase) * 0.5;

        const glow = ctx.createRadialGradient(dec.x, dec.y - dec.size / 2, 2, dec.x, dec.y - dec.size / 2, dec.size * 3);
        glow.addColorStop(0, `rgba(255, 150, 50, ${0.6 + intensity * 0.3})`);
        glow.addColorStop(0.5, `rgba(255, 80, 20, ${0.3 + intensity * 0.2})`);
        glow.addColorStop(1, 'rgba(255, 30, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(dec.x, dec.y - dec.size / 2, dec.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3a2010';
        ctx.beginPath();
        ctx.ellipse(dec.x, dec.y, dec.size, dec.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, ${80 + intensity * 80}, 20, 0.9)`;
        ctx.beginPath();
        ctx.ellipse(dec.x, dec.y - 2, dec.size * 0.6, dec.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 3; i++) {
            const by = dec.y - dec.size * 0.5 - (time * 30 + i * 20) % 50;
            const bx = dec.x + Math.sin(time * 2 + i) * dec.size * 0.3;
            const bs = 2 + Math.sin(time + i) * 1.5;
            ctx.fillStyle = `rgba(255, 150, 50, ${0.7 - (by - (dec.y - 50)) / 50})`;
            ctx.beginPath();
            ctx.arc(bx, by, bs, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    _renderRock(ctx, dec) {
        ctx.save();
        ctx.fillStyle = dec.color;
        ctx.beginPath();
        ctx.moveTo(dec.x - dec.size / 2, dec.y);
        ctx.lineTo(dec.x - dec.size / 3, dec.y - dec.size * 0.8);
        ctx.lineTo(dec.x + dec.size / 4, dec.y - dec.size * 0.9);
        ctx.lineTo(dec.x + dec.size / 2, dec.y - dec.size * 0.3);
        ctx.lineTo(dec.x + dec.size / 2, dec.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(dec.x - dec.size / 4, dec.y - dec.size * 0.2);
        ctx.lineTo(dec.x + dec.size / 4, dec.y - dec.size * 0.3);
        ctx.lineTo(dec.x + dec.size / 3, dec.y);
        ctx.lineTo(dec.x - dec.size / 3, dec.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    _renderCorals(ctx) {
        for (const coral of this.corals) {
            const x = coral.x;
            const y = this.canvasHeight - 30;
            const s = coral.size;

            ctx.fillStyle = coral.color;
            ctx.globalAlpha = 0.7;

            if (coral.type === 0) {
                ctx.beginPath();
                ctx.arc(x, y - s * 0.5, s * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x - s * 0.3, y - s * 0.3, s * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + s * 0.3, y - s * 0.2, s * 0.35, 0, Math.PI * 2);
                ctx.fill();
            } else if (coral.type === 1) {
                for (let j = 0; j < 3; j++) {
                    ctx.beginPath();
                    ctx.moveTo(x + j * s * 0.3 - s * 0.3, y);
                    ctx.lineTo(x + j * s * 0.3 - s * 0.15, y - s);
                    ctx.lineTo(x + j * s * 0.3 + s * 0.15, y - s * 0.7);
                    ctx.lineTo(x + j * s * 0.3 + s * 0.3, y);
                    ctx.fill();
                }
            } else {
                ctx.beginPath();
                ctx.ellipse(x, y - s * 0.3, s * 0.5, s * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(x - s * 0.08, y - s * 0.6, s * 0.16, s * 0.3);
            }

            ctx.globalAlpha = 1;
        }
    }

    _renderSeaweeds(ctx, time) {
        for (const sw of this.seaweeds) {
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.6;

            const baseY = this.canvasHeight - 30;
            ctx.beginPath();
            ctx.moveTo(sw.x, baseY);

            for (let j = 1; j <= sw.segments; j++) {
                const t = j / sw.segments;
                const segY = baseY - sw.height * t;
                const sway = Math.sin(time * sw.speed + sw.phase + t * 3) * (8 * t);
                ctx.lineTo(sw.x + sway, segY);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    _renderSandFloor(ctx) {
        const y = this.canvasHeight - 30;
        const sandColors = {
            reef: ['#f4d03f', '#d4ac0d', '#b7950b'],
            trench: ['#34495e', '#2c3e50', '#1a252f'],
            shipwreck: ['#7f8c8d', '#95a5a6', '#717d7e'],
            volcano: ['#5d4037', '#4e342e', '#3e2723']
        };
        const colors = sandColors[this.mapType] || sandColors.reef;

        const grad = ctx.createLinearGradient(0, y, 0, this.canvasHeight);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(0.4, colors[1]);
        grad.addColorStop(1, colors[2]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, this.canvasWidth, 30);

        ctx.fillStyle = `rgba(0, 0, 0, ${this.mapType === 'reef' ? 0.2 : 0.3})`;
        for (let i = 0; i < 15; i++) {
            const sx = (i * 73 + 17) % this.canvasWidth;
            const sy = y + 5 + (i * 13) % 18;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getMapName() {
        const names = {
            reef: '珊瑚礁',
            trench: '深海沟',
            shipwreck: '沉船区',
            volcano: '火山口'
        };
        return names[this.mapType] || '珊瑚礁';
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '255, 255, 255';
}
