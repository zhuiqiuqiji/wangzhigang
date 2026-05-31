class TimeController {
  constructor() {
    this.speed = 1;
    this.isPaused = false;
    this.elapsedDays = 0;
    this.speedOptions = [0.25, 0.5, 1, 2, 5, 10, 50, 100];
    this.speedIndex = 2;
    this.onSpeedChange = null;
    this.DAYS_PER_SECOND = 10;
  }

  getEffectiveSpeed() {
    return this.isPaused ? 0 : this.speed;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.onSpeedChange) this.onSpeedChange(this.getEffectiveSpeed(), this.isPaused);
  }

  faster() {
    if (this.speedIndex < this.speedOptions.length - 1) {
      this.speedIndex++;
      this.speed = this.speedOptions[this.speedIndex];
      if (this.isPaused) this.isPaused = false;
      if (this.onSpeedChange) this.onSpeedChange(this.getEffectiveSpeed(), this.isPaused);
    }
  }

  slower() {
    if (this.speedIndex > 0) {
      this.speedIndex--;
      this.speed = this.speedOptions[this.speedIndex];
      if (this.isPaused) this.isPaused = false;
      if (this.onSpeedChange) this.onSpeedChange(this.getEffectiveSpeed(), this.isPaused);
    }
  }

  reset() {
    this.speedIndex = 2;
    this.speed = 1;
    this.isPaused = false;
    this.elapsedDays = 0;
    if (this.onSpeedChange) this.onSpeedChange(this.getEffectiveSpeed(), this.isPaused);
  }

  update(dt) {
    if (!this.isPaused) {
      this.elapsedDays += (dt / 1000) * this.speed * this.DAYS_PER_SECOND;
    }
  }

  getElapsedInfo() {
    const days = Math.floor(this.elapsedDays);
    const years = (this.elapsedDays / 365.25).toFixed(2);
    return { days, years };
  }

  getSpeedLabel() {
    if (this.isPaused) return '暂停';
    if (this.speed === 1) return '×1';
    if (this.speed < 1) return `×${this.speed}`;
    return `×${this.speed}`;
  }
}
