class MapSystem {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.currentMapIndex = 0;
        this.selectedIndex = 0;
        this.maps = [
            {
                id: 'reef',
                name: '珊瑚礁',
                description: '阳光明媚的浅海区域，充满多彩珊瑚',
                difficulty: '★☆☆☆☆',
                bgColors: ['#0a3d5c', '#0d4a6e', '#0f5c8a', '#084c6e'],
                enemyTypes: { jellyfish: 3, shark: 1, octopus: 0 }
            },
            {
                id: 'trench',
                name: '深海沟',
                description: '幽暗的深海峡谷，发光生物的家园',
                difficulty: '★★☆☆☆',
                bgColors: ['#1a0a2e', '#2c1654', '#1a237e', '#0d1b3a'],
                enemyTypes: { jellyfish: 2, shark: 2, octopus: 2 }
            },
            {
                id: 'shipwreck',
                name: '沉船区',
                description: '古老的沉船残骸，隐藏着无数宝藏',
                difficulty: '★★★☆☆',
                bgColors: ['#2a1f14', '#3d2e1f', '#556b2f', '#1a1a14'],
                enemyTypes: { jellyfish: 1, shark: 3, octopus: 2 }
            },
            {
                id: 'volcano',
                name: '火山口',
                description: '炙热的海底火山，危险与财富并存',
                difficulty: '★★★★☆',
                bgColors: ['#3a0f0f', '#5c1a10', '#8b2500', '#2a0a05'],
                enemyTypes: { jellyfish: 2, shark: 2, octopus: 3 }
            }
        ];
    }

    getCurrentMap() {
        return this.maps[this.currentMapIndex];
    }

    getSelectedMap() {
        return this.maps[this.selectedIndex];
    }

    selectMap(index) {
        this.selectedIndex = index;
    }

    confirmSelection() {
        this.currentMapIndex = this.selectedIndex;
        return this.getCurrentMap();
    }

    handleInput(keyCode) {
        const cols = 2;
        const total = this.maps.length;

        if (keyCode === 'ArrowLeft' && this.selectedIndex % cols > 0) {
            this.selectedIndex--;
        } else if (keyCode === 'ArrowRight' && this.selectedIndex % cols < cols - 1 && this.selectedIndex + 1 < total) {
            this.selectedIndex++;
        } else if (keyCode === 'ArrowUp' && this.selectedIndex >= cols) {
            this.selectedIndex -= cols;
        } else if (keyCode === 'ArrowDown' && this.selectedIndex + cols < total) {
            this.selectedIndex += cols;
        }
    }

    render(ctx, time, unlockedMaps) {
        const cx = this.canvasWidth / 2;
        const cy = this.canvasHeight / 2;

        ctx.save();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 15;
        ctx.font = 'bold 32px Fredoka, Comic Sans MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('选择地图', cx, cy - 150);
        ctx.shadowBlur = 0;

        const cols = 2;
        const rows = 2;
        const cardW = 180;
        const cardH = 120;
        const gap = 30;
        const startX = cx - (cols * cardW + (cols - 1) * gap) / 2 + cardW / 2;
        const startY = cy - (rows * cardH + (rows - 1) * gap) / 2 + cardH / 2 - 30;

        for (let i = 0; i < this.maps.length; i++) {
            const map = this.maps[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gap);
            const y = startY + row * (cardH + gap);
            const selected = i === this.selectedIndex;
            const unlocked = unlockedMaps.includes(map.id);

            this._renderMapCard(ctx, x - cardW / 2, y - cardH / 2, cardW, cardH, map, selected, unlocked, time);
        }

        const pulse = 0.6 + Math.sin(time * 3) * 0.4;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 18px Nunito, sans-serif';
        ctx.fillText('按空格键或点击确认', cx, cy + 130);
        ctx.globalAlpha = 1;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Nunito, sans-serif';
        ctx.fillText('方向键选择地图', cx, cy + 170);

        ctx.restore();
    }

    _renderMapCard(ctx, x, y, w, h, map, selected, unlocked, time) {
        ctx.save();

        if (selected) {
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 25;
        }

        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, map.bgColors[0]);
        grad.addColorStop(0.5, map.bgColors[1]);
        grad.addColorStop(1, map.bgColors[2]);

        ctx.fillStyle = grad;
        this._roundRect(ctx, x, y, w, h, 12);
        ctx.fill();

        if (!unlocked) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this._roundRect(ctx, x, y, w, h, 12);
            ctx.fill();
        }

        ctx.strokeStyle = selected ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = selected ? 3 : 1.5;
        ctx.stroke();

        ctx.shadowBlur = 0;

        if (!unlocked) {
            ctx.fillStyle = '#888';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', x + w / 2, y + h / 2 - 10);
            ctx.fillStyle = '#aaa';
            ctx.font = '11px Nunito, sans-serif';
            ctx.fillText('通关前一张地图解锁', x + w / 2, y + h / 2 + 15);
        } else {
            this._renderMapDecorations(ctx, x, y, w, h, map, time);
        }

        ctx.fillStyle = unlocked ? '#ffffff' : '#666';
        ctx.font = 'bold 16px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(map.name, x + w / 2, y + h + 20);

        ctx.fillStyle = unlocked ? '#ffd93d' : '#555';
        ctx.font = '12px Nunito, sans-serif';
        ctx.fillText(map.difficulty, x + w / 2, y + h + 38);

        ctx.restore();
    }

    _renderMapDecorations(ctx, x, y, w, h, map, time) {
        const cx = x + w / 2;
        const cy = y + h / 2;

        ctx.save();

        if (map.id === 'reef') {
            const colors = ['#ff6b9d', '#ff9ff3', '#feca57', '#2ecc71'];
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = colors[i % colors.length];
                const dx = x + 20 + (i * 35) % (w - 40);
                const dy = y + h - 30 + Math.sin(time * 2 + i) * 3;
                ctx.beginPath();
                ctx.arc(dx, dy, 6 + Math.sin(time + i) * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (map.id === 'trench') {
            for (let i = 0; i < 8; i++) {
                const dx = x + 15 + i * 20;
                const dy = y + 20 + (i % 3) * 25;
                const glow = 0.5 + Math.sin(time * 3 + i) * 0.5;
                ctx.fillStyle = `rgba(0, 229, 255, ${0.3 + glow * 0.4})`;
                ctx.beginPath();
                ctx.arc(dx, dy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (map.id === 'shipwreck') {
            ctx.fillStyle = '#5c4a3a';
            ctx.fillRect(x + 30, y + 40, w - 60, 40);
            ctx.fillStyle = '#3d2e1f';
            ctx.fillRect(x + 30, y + 35, w - 60, 8);
            ctx.fillStyle = '#5c4a3a';
            ctx.fillRect(x + 50, y + 25, 8, 15);
            ctx.fillRect(x + w - 58, y + 25, 8, 15);
        } else if (map.id === 'volcano') {
            const grad = ctx.createRadialGradient(cx, y + h - 20, 5, cx, y + h - 20, 50);
            const lavaGlow = 0.5 + Math.sin(time * 2) * 0.5;
            grad.addColorStop(0, `rgba(255, ${80 + lavaGlow * 60}, 30, 0.8)`);
            grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, y + h - 20, 50, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3a2010';
            ctx.beginPath();
            ctx.moveTo(x + 20, y + h - 10);
            ctx.lineTo(cx - 15, y + 25);
            ctx.lineTo(cx, y + 15);
            ctx.lineTo(cx + 15, y + 25);
            ctx.lineTo(x + w - 20, y + h - 10);
            ctx.closePath();
            ctx.fill();
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
