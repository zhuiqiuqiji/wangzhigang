class CheckpointManager {
    constructor(track) {
        this.track = track;
        this._initCheckpoints(track.getCheckpoints());
        this.currentCheckpoint = 0;
        this.totalCheckpoints = this.checkpoints.length;
        this.checkpointRadius = 40;
    }
    
    _initCheckpoints(trackCheckpoints) {
        this.checkpoints = [];
        for (let i = 0; i < trackCheckpoints.length; i++) {
            const cp = trackCheckpoints[i];
            this.checkpoints.push({
                index: cp.index,
                x: cp.x,
                y: cp.y,
                innerX: cp.innerX,
                innerY: cp.innerY,
                outerX: cp.outerX,
                outerY: cp.outerY,
                passed: false
            });
        }
    }

    checkCarCheckpoint(car) {
        const currentCP = this.checkpoints[this.currentCheckpoint];
        if (!currentCP || currentCP.passed) return false;
        
        const dist = Utils.distance(car.x, car.y, currentCP.x, currentCP.y);
        
        if (dist < this.checkpointRadius) {
            this.passCheckpoint(this.currentCheckpoint);
            return true;
        }
        return false;
    }

    passCheckpoint(index) {
        this.checkpoints[index].passed = true;
        this.currentCheckpoint = (this.currentCheckpoint + 1) % this.totalCheckpoints;
    }

    isLapComplete() {
        return this.currentCheckpoint === 0 && this.checkpoints.every(cp => cp.passed);
    }

    getPassedCount() {
        return this.checkpoints.filter(cp => cp.passed).length;
    }

    getCurrentCheckpointIndex() {
        return this.currentCheckpoint;
    }

    reset() {
        this.checkpoints.forEach(cp => cp.passed = false);
        this.currentCheckpoint = 0;
    }

    getProgress() {
        const passed = this.getPassedCount();
        return {
            current: passed,
            total: this.totalCheckpoints,
            percentage: (passed / this.totalCheckpoints) * 100
        };
    }
}
