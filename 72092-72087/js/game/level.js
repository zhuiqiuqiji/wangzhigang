class LevelSystem {
  constructor(store) {
    this.store = store;
    this.currentLevel = null;
    this.movesLeft = 0;
    this.timeLeft = 0;
    this.progress = {};
    this.score = 0;
    this.obstacles = [];
    this.dropItems = [];
    this.collectOrder = [];
    this.currentOrderIndex = 0;
    this.onComplete = null;
    this.onFail = null;
    this.isTimeLimit = false;
    this.timerInterval = null;
    this.buffsActive = [];
  }

  startLevel(levelId, selectedBuffs = []) {
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) return false;

    this.currentLevel = level;
    this.movesLeft = level.moves || 30;
    this.timeLeft = level.timeLimit || 0;
    this.isTimeLimit = level.goalType === LEVEL_GOAL_TYPES.TIME_LIMIT;
    this.progress = {};
    this.score = 0;
    this.obstacles = level.obstacles ? level.obstacles.map(o => ({ ...o, hits: undefined })) : [];
    this.dropItems = level.dropItems ? level.dropItems.map(d => ({ ...d })) : [];
    this.collectOrder = level.collectOrder ? [...level.collectOrder] : [];
    this.currentOrderIndex = 0;
    this.buffsActive = [...selectedBuffs];

    Object.keys(level.target).forEach(key => {
      this.progress[key] = 0;
    });

    this.applyStartBuffs(selectedBuffs);

    return true;
  }

  applyStartBuffs(buffs) {
    buffs.forEach(buffId => {
      const buff = START_BUFFS.find(b => b.id === buffId);
      if (!buff) return;

      switch (buffId) {
        case 'color_blast':
          this.score += 200;
          break;
        case 'lucky_start':
          this.score += 100;
          const state = this.store.getState();
          this.store.setState({ coins: state.coins + 100 });
          break;
        case 'move_plus':
          this.movesLeft += 3;
          break;
      }
    });
  }

  useMove() {
    if (this.isTimeLimit) return true;
    if (this.movesLeft > 0) {
      this.movesLeft--;
      return true;
    }
    return false;
  }

  addMoves(count) {
    this.movesLeft += count;
  }

  addTime(seconds) {
    if (this.isTimeLimit) {
      this.timeLeft += seconds;
    }
  }

  startTimer(onTick) {
    if (!this.isTimeLimit || this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        if (onTick) onTick(this.timeLeft);
      } else {
        this.stopTimer();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  addProgress(type, count) {
    if (this.progress.hasOwnProperty(type)) {
      this.progress[type] += count;
      this.score += count * 10;
    }

    if (this.dropItems.length > 0) {
      this.dropItems.forEach(item => {
        if (item.type === type && !item.dropped) {
          item.dropped = true;
          this.score += 50;
        }
      });
    }
  }

  processMatchGroup(matches) {
    if (this.collectOrder.length === 0 || this.currentOrderIndex >= this.collectOrder.length) {
      return;
    }

    const matchTypes = new Set(matches.map(m => m.type));
    const expectedType = this.collectOrder[this.currentOrderIndex];

    const hasExpected = matchTypes.has(expectedType);
    const hasOtherOrderTypes = Array.from(matchTypes).some(t => 
      t !== expectedType && this.collectOrder.includes(t)
    );

    if (hasOtherOrderTypes) {
      this.currentOrderIndex = 0;
    } else if (hasExpected) {
      this.currentOrderIndex++;
    }
  }

  addScore(points) {
    this.score += points;
  }

  getObstacles() {
    return this.obstacles;
  }

  hitObstacle(row, col) {
    const index = this.obstacles.findIndex(o => o.row === row && o.col === col);
    if (index === -1) return null;

    const obstacle = this.obstacles[index];
    const obstacleType = OBSTACLE_TYPES.find(t => t.id === obstacle.type);
    if (!obstacleType) return null;

    const currentHits = obstacle.hits !== undefined ? obstacle.hits : obstacleType.hits;
    obstacle.hits = currentHits - 1;

    if (obstacle.hits <= 0) {
      this.obstacles.splice(index, 1);
      this.addProgress(obstacle.type, 1);
      return { destroyed: true, type: obstacle.type };
    }

    return { destroyed: false, type: obstacle.type, remainingHits: obstacle.hits };
  }

  checkWin() {
    if (!this.currentLevel) return false;

    const goalType = this.currentLevel.goalType || LEVEL_GOAL_TYPES.COLLECT;

    if (goalType === LEVEL_GOAL_TYPES.SCORE) {
      return this.score >= (this.currentLevel.targetScore || 0);
    }

    if (goalType === LEVEL_GOAL_TYPES.TIME_LIMIT) {
      return this.score >= (this.currentLevel.targetScore || 0);
    }

    if (goalType === LEVEL_GOAL_TYPES.COLLECT_ORDER) {
      return this.currentOrderIndex >= this.collectOrder.length;
    }

    if (goalType === LEVEL_GOAL_TYPES.DROP_ITEMS) {
      return this.dropItems.every(item => item.dropped);
    }

    return Object.entries(this.currentLevel.target).every(
      ([key, target]) => (this.progress[key] || 0) >= target
    );
  }

  checkLose() {
    if (this.isTimeLimit) {
      return this.timeLeft <= 0 && !this.checkWin();
    }
    return this.movesLeft <= 0 && !this.checkWin();
  }

  getProgress() {
    return {
      level: this.currentLevel,
      movesLeft: this.movesLeft,
      timeLeft: this.timeLeft,
      isTimeLimit: this.isTimeLimit,
      progress: this.progress,
      score: this.score,
      obstacles: this.obstacles,
      dropItems: this.dropItems,
      collectOrder: this.collectOrder,
      currentOrderIndex: this.currentOrderIndex
    };
  }

  getReward() {
    if (!this.currentLevel) return { coins: 0, stars: 0 };

    const baseReward = this.currentLevel.reward || { coins: 0, stars: 0 };
    const bonusMultiplier = this.getBonusMultiplier();

    return {
      coins: Math.floor(baseReward.coins * bonusMultiplier),
      stars: baseReward.stars
    };
  }

  getBonusMultiplier() {
    const activeEvent = this.getCurrentActiveEvent();
    return activeEvent?.bonusMultiplier || 1;
  }

  getCurrentActiveEvent() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    for (const event of SEASONAL_EVENTS) {
      if (event.id === 'spring_festival' && month >= 3 && month <= 5) return event;
      if (event.id === 'summer_event' && month >= 6 && month <= 8) return event;
      if (event.id === 'autumn_harvest' && month >= 9 && month <= 11) return event;
      if (event.id === 'winter_wonderland' && (month === 12 || month <= 2)) return event;
      if (event.id === 'anniversary' && day >= 25 && day <= 28) return event;
    }
    return null;
  }

  getGoalType() {
    return this.currentLevel?.goalType || LEVEL_GOAL_TYPES.COLLECT;
  }

  getCurrentLevelId() {
    return this.currentLevel?.id || 1;
  }

  getNextLevelId() {
    const currentId = this.currentLevel?.id || 0;
    const nextLevel = LEVELS.find(l => l.id === currentId + 1);
    return nextLevel ? nextLevel.id : currentId;
  }

  hasNextLevel() {
    const currentId = this.currentLevel?.id || 0;
    return LEVELS.some(l => l.id === currentId + 1);
  }

  getStory() {
    return this.currentLevel?.story || '';
  }

  getLevelById(id) {
    return LEVELS.find(l => l.id === id);
  }
}
