class TrickSystem {
  constructor() {
    this.trickState = {
      active: false,
      type: null,
      startAngle: 0,
      rotationAccum: 0,
      duration: 0,
      maxSlip: 0,
      progress: 0,
      lastAngle: 0,
    };

    this.completedTricks = [];
    this.currentTrickScore = 0;
    this.lastCompletedTrick = null;
    this.trickHistory = [];
    this.combo = 0;
    this.comboTimer = 0;
    this.totalTrickScore = 0;
  }

  reset() {
    this.trickState = {
      active: false,
      type: null,
      startAngle: 0,
      rotationAccum: 0,
      duration: 0,
      maxSlip: 0,
      progress: 0,
      lastAngle: 0,
    };
    this.completedTricks = [];
    this.currentTrickScore = 0;
    this.lastCompletedTrick = null;
    this.trickHistory = [];
    this.combo = 0;
    this.comboTimer = 0;
    this.totalTrickScore = 0;
  }

  update(moto, dt, terrain) {
    this.trickState.lastAngle = moto.angle;

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    let activeTrick = null;

    for (const trickId in TRICKS) {
      const trick = TRICKS[trickId];

      if (trick.detect(moto, dt, this.trickState)) {
        activeTrick = trick;
        break;
      }
    }

    if (activeTrick) {
      activeTrick.update(moto, dt, this.trickState);
      this.currentTrickScore = this.calculateCurrentScore(activeTrick);

      const completed = activeTrick.complete(moto, this.trickState, terrain);
      if (completed) {
        this.completeTrick(completed);
      }
    } else if (this.trickState.active) {
      const currentTrick = this.trickState.type ? TRICKS[this.trickState.type] : null;
      if (currentTrick) {
        const completed = currentTrick.complete(moto, this.trickState, terrain);
        if (completed) {
          this.completeTrick(completed);
        } else {
          this.cancelTrick();
        }
      } else {
        this.cancelTrick();
      }
    }

    if (moto.justLanded) {
      const landingTrick = TRICKS.perfect_landing.complete(moto, this.trickState, terrain);
      if (landingTrick) {
        this.completeTrick(landingTrick);
      }
    }

    return {
      isActive: this.trickState.active,
      type: this.trickState.type,
      progress: this.trickState.progress,
      score: this.currentTrickScore,
      combo: this.combo,
      comboTimer: this.comboTimer,
    };
  }

  calculateCurrentScore(trick) {
    if (!this.trickState.active || !this.trickState.type) return 0;
    const comboMultiplier = Math.max(1, this.combo);
    return Math.floor(trick.baseScore * this.trickState.progress * comboMultiplier);
  }

  completeTrick(trickResult) {
    const comboMultiplier = Math.max(1, this.combo);
    const score = calculateTrickScore(trickResult, comboMultiplier);

    this.completedTricks.push({
      ...trickResult,
      score: score,
      timestamp: Date.now(),
      combo: comboMultiplier,
    });

    this.trickHistory.push({
      name: trickResult.name,
      score: score,
      quality: trickResult.quality,
      time: Date.now(),
    });

    this.totalTrickScore += score;
    this.lastCompletedTrick = this.completedTricks[this.completedTricks.length - 1];
    this.currentTrickScore = 0;

    this.combo++;
    this.comboTimer = 3;

    this.trickState.active = false;
    this.trickState.type = null;

    return this.lastCompletedTrick;
  }

  cancelTrick() {
    if (this.trickState.type === 'drift' && this.trickState.duration > 0.3) {
      const trick = TRICKS.drift;
      const completed = trick.complete({ isGrounded: true }, this.trickState);
      if (completed) {
        this.completeTrick(completed);
        return;
      }
    }

    this.trickState.active = false;
    this.trickState.type = null;
    this.trickState.progress = 0;
    this.currentTrickScore = 0;
  }

  getTrickName(trickId) {
    return TRICKS[trickId]?.name || '';
  }

  getTrickIcon(trickId) {
    return TRICKS[trickId]?.icon || '';
  }

  getActiveTrick() {
    if (!this.trickState.active) return null;
    return {
      id: this.trickState.type,
      name: this.getTrickName(this.trickState.type),
      icon: this.getTrickIcon(this.trickState.type),
      progress: this.trickState.progress,
      estimatedScore: this.currentTrickScore,
    };
  }

  getStats() {
    return {
      totalTricks: this.completedTricks.length,
      totalScore: this.totalTrickScore,
      maxCombo: Math.max(0, this.combo),
      trickHistory: [...this.trickHistory],
      completedTricks: [...this.completedTricks],
    };
  }

  getTrickSummary() {
    const summary = {};
    this.completedTricks.forEach(t => {
      if (!summary[t.name]) {
        summary[t.name] = { count: 0, totalScore: 0, best: 0 };
      }
      summary[t.name].count++;
      summary[t.name].totalScore += t.score;
      summary[t.name].best = Math.max(summary[t.name].best, t.score);
    });
    return summary;
  }
}

window.TrickSystem = TrickSystem;
