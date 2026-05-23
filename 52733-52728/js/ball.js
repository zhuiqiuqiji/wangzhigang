class Ball {
    static RADIUS = 12;

    static COLORS = {
        0: '#FFFFFF',
        1: '#FFD700',
        2: '#0000FF',
        3: '#FF0000',
        4: '#800080',
        5: '#FF8C00',
        6: '#006400',
        7: '#8B0000',
        8: '#000000',
        9: '#FFD700',
        10: '#0000FF',
        11: '#FF0000',
        12: '#800080',
        13: '#FF8C00',
        14: '#006400',
        15: '#8B0000'
    };

    constructor(number, x, y) {
        this.number = number;
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.radius = Ball.RADIUS;
        this.potted = false;
        this.color = Ball.COLORS[number];
        this.isStriped = number >= 9;
        this.spin = { x: 0, y: 0 };
    }

    draw(ctx) {
        if (this.potted) return;

        const x = this.position.x;
        const y = this.position.y;
        const r = this.radius;

        ctx.save();

        ctx.beginPath();
        ctx.arc(x + 2, y + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        const gradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        gradient.addColorStop(0, this.getLightColor());
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, this.getDarkColor());

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        if (this.isStriped) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.clip();

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x - r, y - r * 0.4, r * 2, r * 0.8);

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }

        if (this.number > 0 && this.number <= 15) {
            const circleRadius = r * 0.45;
            ctx.beginPath();
            ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#000000';
            ctx.font = `bold ${r * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.number.toString(), x, y);
        }

        const highlightGradient = ctx.createRadialGradient(
            x - r * 0.4, y - r * 0.4, 0,
            x - r * 0.4, y - r * 0.4, r * 0.4
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = highlightGradient;
        ctx.fill();

        ctx.restore();
    }

    getLightColor() {
        const colors = {
            0: '#FFFFFF',
            1: '#FFFF99',
            2: '#6666FF',
            3: '#FF6666',
            4: '#CC66CC',
            5: '#FFCC66',
            6: '#339933',
            7: '#CC3333',
            8: '#444444',
            9: '#FFFF99',
            10: '#6666FF',
            11: '#FF6666',
            12: '#CC66CC',
            13: '#FFCC66',
            14: '#339933',
            15: '#CC3333'
        };
        return colors[this.number] || this.color;
    }

    getDarkColor() {
        const colors = {
            0: '#CCCCCC',
            1: '#B8860B',
            2: '#00008B',
            3: '#8B0000',
            4: '#4B0082',
            5: '#CC6600',
            6: '#004400',
            7: '#5C0000',
            8: '#000000',
            9: '#B8860B',
            10: '#00008B',
            11: '#8B0000',
            12: '#4B0082',
            13: '#CC6600',
            14: '#004400',
            15: '#5C0000'
        };
        return colors[this.number] || this.color;
    }

    getType() {
        if (this.number === 0) return 'cue';
        if (this.number === 8) return 'eight';
        if (this.number >= 1 && this.number <= 7) return 'solid';
        if (this.number >= 9 && this.number <= 15) return 'striped';
        return 'unknown';
    }
}
