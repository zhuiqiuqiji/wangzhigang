class GhostRecorder {
  constructor() {
    this.isRecording = false;
    this.frames = [];
    this.startTime = 0;
    this.recordInterval = 0.05;
    this.lastRecordTime = 0;
    this.inputFrame = [];
  }

  start() {
    this.isRecording = true;
    this.frames = [];
    this.inputFrame = [];
    this.startTime = performance.now();
    this.lastRecordTime = 0;
  }

  record(moto, input, currentTime) {
    if (!this.isRecording) return;

    const elapsed = (currentTime - this.startTime) / 1000;
    if (elapsed - this.lastRecordTime >= this.recordInterval) {
      this.frames.push({
        t: Math.round(elapsed * 100) / 100,
        x: Math.round(moto.x * 100) / 100,
        y: Math.round(moto.y * 100) / 100,
        a: Math.round(moto.angle * 1000) / 1000,
        vx: Math.round(moto.velocityX * 10) / 10,
        vy: Math.round(moto.velocityY * 10) / 10,
      });
      this.lastRecordTime = elapsed;
    }
  }

  stop(score) {
    if (!this.isRecording) return null;
    this.isRecording = false;

    const totalTime = (performance.now() - this.startTime) / 1000;
    const compressedFrames = this.compressFrames(this.frames);

    return {
      version: 1,
      totalTime: totalTime,
      score: score,
      frameCount: compressedFrames.length,
      frames: compressedFrames,
      recordedAt: Date.now(),
    };
  }

  compressFrames(frames) {
    if (frames.length <= 2) return frames;

    const compressed = [frames[0]];
    for (let i = 1; i < frames.length - 1; i++) {
      const prev = compressed[compressed.length - 1];
      const curr = frames[i];
      const next = frames[i + 1];

      const isRedundant =
        Math.abs(curr.x - prev.x) < 1 &&
        Math.abs(curr.y - prev.y) < 1 &&
        Math.abs(curr.a - prev.a) < 0.05 &&
        Math.abs(curr.x - next.x) < 1 &&
        Math.abs(curr.y - next.y) < 1 &&
        Math.abs(curr.a - next.a) < 0.05;

      if (!isRedundant) {
        compressed.push(curr);
      }
    }
    compressed.push(frames[frames.length - 1]);
    return compressed;
  }

  save(trackId, rank) {
    const data = this.frames;
    if (data.length > 0) {
      Storage.saveGhostData(trackId, rank, data);
      return true;
    }
    return false;
  }

  getRecordingData() {
    return this.frames;
  }

  isActive() {
    return this.isRecording;
  }
}

class GhostPlayer {
  constructor() {
    this.ghostData = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.currentFrameIndex = 0;
    this.position = { x: 0, y: 0, angle: 0, velocityX: 0, velocityY: 0 };
    this.trackId = null;
    this.rank = null;
    this.alpha = 0.5;
    this.color = '#00ff88';
  }

  load(trackId, rank) {
    const data = Storage.getGhostData(trackId, rank);
    if (!data) return false;

    this.ghostData = data;
    this.trackId = trackId;
    this.rank = rank;
    this.reset();
    return true;
  }

  reset() {
    this.currentTime = 0;
    this.currentFrameIndex = 0;
    this.isPlaying = true;
    if (this.ghostData && this.ghostData.length > 0) {
      const firstFrame = this.ghostData[0];
      this.position = {
        x: firstFrame.x,
        y: firstFrame.y,
        angle: firstFrame.a,
        velocityX: firstFrame.vx || 0,
        velocityY: firstFrame.vy || 0,
      };
    }
  }

  update(dt) {
    if (!this.isPlaying || !this.ghostData) return null;

    this.currentTime += dt;

    while (
      this.currentFrameIndex < this.ghostData.length - 1 &&
      this.ghostData[this.currentFrameIndex + 1].t <= this.currentTime
    ) {
      this.currentFrameIndex++;
    }

    if (this.currentFrameIndex >= this.ghostData.length - 1) {
      this.isPlaying = false;
      return this.position;
    }

    const currFrame = this.ghostData[this.currentFrameIndex];
    const nextFrame = this.ghostData[this.currentFrameIndex + 1];

    const frameTime = nextFrame.t - currFrame.t;
    const t = frameTime > 0 ? (this.currentTime - currFrame.t) / frameTime : 0;

    this.position = {
      x: this.lerp(currFrame.x, nextFrame.x, t),
      y: this.lerp(currFrame.y, nextFrame.y, t),
      angle: this.lerpAngle(currFrame.a, nextFrame.a, t),
      velocityX: this.lerp(currFrame.vx || 0, nextFrame.vx || 0, t),
      velocityY: this.lerp(currFrame.vy || 0, nextFrame.vy || 0, t),
    };

    return this.position;
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  getPosition() {
    return { ...this.position };
  }

  getTotalTime() {
    if (!this.ghostData || this.ghostData.length === 0) return 0;
    return this.ghostData[this.ghostData.length - 1].t;
  }

  getProgress() {
    const totalTime = this.getTotalTime();
    if (totalTime === 0) return 0;
    return Math.min(1, this.currentTime / totalTime);
  }

  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  setColor(color) {
    this.color = color;
  }

  stop() {
    this.isPlaying = false;
  }

  hasData() {
    return this.ghostData !== null && this.ghostData.length > 0;
  }

  isActive() {
    return this.isPlaying;
  }

  clear() {
    this.ghostData = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.currentFrameIndex = 0;
  }
}

window.GhostRecorder = GhostRecorder;
window.GhostPlayer = GhostPlayer;
