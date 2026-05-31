class SeededRNG {
    constructor(seed) {
        this.seed = seed;
        this.state = this.hashSeed(seed);
    }

    hashSeed(seed) {
        let hash = 0;
        const str = String(seed);
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash) || 1;
    }

    next() {
        this.state ^= this.state << 13;
        this.state ^= this.state >> 17;
        this.state ^= this.state << 5;
        return Math.abs(this.state);
    }

    random() {
        return (this.next() >>> 0) / 4294967296;
    }

    nextInt(max) {
        return Math.floor(this.random() * max);
    }

    nextIntRange(min, max) {
        return min + this.nextInt(max - min);
    }

    nextBool(probability = 0.5) {
        return this.random() < probability;
    }

    pick(array) {
        return array[this.nextInt(array.length)];
    }

    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.nextInt(i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    static generateSeed() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let seed = '';
        for (let i = 0; i < 8; i++) {
            seed += chars[Math.floor(Math.random() * chars.length)];
        }
        return seed;
    }
}
