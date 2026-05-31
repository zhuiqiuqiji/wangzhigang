class Character {
    constructor(id, name, ability, unlockCondition, color, modifiers) {
        this.id = id;
        this.name = name;
        this.ability = ability;
        this.unlockCondition = unlockCondition;
        this.color = color;
        this.modifiers = modifiers;
        this.unlocked = false;
    }

    static getAllCharacters() {
        return [
            new Character(
                'spongebob',
                '海绵宝宝',
                '平衡型角色，无特殊加成',
                '初始解锁',
                '#ffd700',
                { health: 1.0, oxygen: 1.0, score: 1.0, speed: 1.0 }
            ),
            new Character(
                'patrick',
                '派大星',
                '防御力 +50%，掉血减半',
                '通过第 2 关解锁',
                '#ff9966',
                { health: 0.5, oxygen: 1.0, score: 1.0, speed: 1.0 }
            ),
            new Character(
                'squidward',
                '章鱼哥',
                '氧气消耗 -30%',
                '通过第 3 关解锁',
                '#98d8c8',
                { health: 1.0, oxygen: 0.7, score: 1.0, speed: 1.0 }
            ),
            new Character(
                'krabs',
                '蟹老板',
                '收集金币分数 ×2',
                '通过第 5 关解锁',
                '#c9a800',
                { health: 1.0, oxygen: 1.0, score: 2.0, speed: 1.0 }
            ),
            new Character(
                'sandy',
                '珊迪',
                '移动速度 +25%',
                '通过第 7 关解锁',
                '#d4a574',
                { health: 1.0, oxygen: 1.0, score: 1.0, speed: 1.25 }
            )
        ];
    }

    static getCharacterById(id) {
        const chars = Character.getAllCharacters();
        return chars.find(c => c.id === id) || chars[0];
    }

    render(ctx, x, y, size = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size, size);

        switch (this.id) {
            case 'spongebob':
                this._renderSpongeBob(ctx);
                break;
            case 'patrick':
                this._renderPatrick(ctx);
                break;
            case 'squidward':
                this._renderSquidward(ctx);
                break;
            case 'krabs':
                this._renderKrabs(ctx);
                break;
            case 'sandy':
                this._renderSandy(ctx);
                break;
        }

        ctx.restore();
    }

    _renderSpongeBob(ctx) {
        const grad = ctx.createLinearGradient(-14, -18, 14, 18);
        grad.addColorStop(0, '#ffe135');
        grad.addColorStop(1, '#e6c200');
        ctx.fillStyle = grad;
        this._roundRect(ctx, -14, -18, 28, 32, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-6, -8, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -8, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.arc(-6, -7, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6, -7, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-5.5, -6.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6.5, -6.5, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff8a80';
        ctx.beginPath();
        ctx.ellipse(0, 0, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#c9a800';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(2, 2, 5, 0.1, Math.PI * 0.8);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-13, 4, 26, 12);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-13, 10, 26, 10);
    }

    _renderPatrick(ctx) {
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
        grad.addColorStop(0, '#ffb399');
        grad.addColorStop(1, '#ff7744');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff9966';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(-8 + (i % 3) * 8, -4 + Math.floor(i / 3) * 8, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-5, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -6, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6, -6, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 5, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.ellipse(-3, 2, 1.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(3, 2, 1.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderSquidward(ctx) {
        const grad = ctx.createLinearGradient(0, -20, 0, 20);
        grad.addColorStop(0, '#98d8c8');
        grad.addColorStop(1, '#5fb8a5');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-10, -20);
        ctx.quadraticCurveTo(-14, -5, -12, 10);
        ctx.lineTo(-8, 18);
        ctx.lineTo(8, 18);
        ctx.lineTo(12, 10);
        ctx.quadraticCurveTo(14, -5, 10, -20);
        ctx.quadraticCurveTo(0, -22, -10, -20);
        ctx.fill();

        ctx.fillStyle = '#e8f5f2';
        ctx.beginPath();
        ctx.ellipse(-5, -8, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -8, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-5, -7, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -7, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#3a5a5a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-8, -14);
        ctx.lineTo(-2, -13);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, -14);
        ctx.lineTo(2, -13);
        ctx.stroke();

        ctx.strokeStyle = '#4a7a6a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3, 8);
        ctx.lineTo(3, 8);
        ctx.stroke();

        ctx.strokeStyle = '#5fb8a5';
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-8 + i * 16, 18);
            ctx.lineTo(-10 + i * 20, 24);
            ctx.stroke();
        }
    }

    _renderKrabs(ctx) {
        const grad = ctx.createLinearGradient(0, -15, 0, 15);
        grad.addColorStop(0, '#e6b800');
        grad.addColorStop(1, '#b38f00');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c9a800';
        ctx.beginPath();
        ctx.ellipse(-16, -5, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(16, -5, 5, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#a08500';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(-14, -8 + i * 4, 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-5, -5, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -5, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-5, -4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6, -5, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 8, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#a08500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 10, 4, 0.3, Math.PI - 0.3);
        ctx.stroke();
    }

    _renderSandy(ctx) {
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.ellipse(0, 2, 13, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, -10, 14, 8, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-14, -10, 28, 3);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -8, 10, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 6px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TEXAS', 0, -4);

        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.ellipse(-13, -2, 3, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(13, -2, 3, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(-5, 0, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, 0, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -1, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6, -1, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 8, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 10, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    renderCard(ctx, x, y, selected, unlocked) {
        const w = 120;
        const h = 160;

        ctx.save();

        if (selected) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;
        }

        const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
        if (unlocked) {
            bgGrad.addColorStop(0, 'rgba(30, 60, 90, 0.9)');
            bgGrad.addColorStop(1, 'rgba(10, 30, 50, 0.9)');
        } else {
            bgGrad.addColorStop(0, 'rgba(40, 40, 50, 0.8)');
            bgGrad.addColorStop(1, 'rgba(20, 20, 30, 0.8)');
        }
        ctx.fillStyle = bgGrad;
        this._roundRect(ctx, x, y, w, h, 12);
        ctx.fill();

        ctx.strokeStyle = selected ? this.color : (unlocked ? 'rgba(0, 229, 255, 0.3)' : 'rgba(100, 100, 120, 0.3)');
        ctx.lineWidth = selected ? 3 : 1.5;
        ctx.stroke();

        ctx.shadowBlur = 0;

        if (!unlocked) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this._roundRect(ctx, x, y, w, h, 12);
            ctx.fill();

            ctx.fillStyle = '#888';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', x + w / 2, y + 60);

            ctx.fillStyle = '#aaa';
            ctx.font = '11px Nunito, sans-serif';
            ctx.fillText(this.unlockCondition, x + w / 2, y + 100);
        }

        this.render(ctx, x + w / 2, y + 55, 1.4);

        ctx.fillStyle = unlocked ? '#ffffff' : '#666';
        ctx.font = 'bold 14px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, x + w / 2, y + 100);

        if (unlocked) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
            ctx.font = '10px Nunito, sans-serif';
            ctx.fillText(this.ability, x + w / 2, y + 125);
        }

        ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
}
