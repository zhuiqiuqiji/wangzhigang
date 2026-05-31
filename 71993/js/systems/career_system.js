class CareerSystem {
  constructor(saveSystem) {
    this.saveSystem = saveSystem;
    this.currentEvent = null;
    this.eventResult = null;
  }

  getAvailableEvents() {
    const totalStars = this.saveSystem.getTotalStars();
    const currentTier = this.saveSystem.getCareerTier();

    return CAREER_EVENTS
      .filter(event => {
        if (event.tier > currentTier + 1) return false;
        if (event.unlockRequirement > totalStars) return false;
        return true;
      })
      .map(event => ({
        ...event,
        progress: this.saveSystem.getEventProgress(event.id),
        isUnlocked: event.unlockRequirement <= totalStars && event.tier <= currentTier,
        tierName: CAREER_TIER_NAMES[event.tier],
        tierColor: CAREER_TIER_COLORS[event.tier],
      }));
  }

  getEventsByTier(tier) {
    const totalStars = this.saveSystem.getTotalStars();

    return CAREER_EVENTS
      .filter(e => e.tier === tier)
      .map(event => ({
        ...event,
        progress: this.saveSystem.getEventProgress(event.id),
        isUnlocked: event.unlockRequirement <= totalStars,
        tierName: CAREER_TIER_NAMES[tier],
        tierColor: CAREER_TIER_COLORS[tier],
      }));
  }

  getAllEvents() {
    const totalStars = this.saveSystem.getTotalStars();

    return CAREER_EVENTS.map(event => ({
      ...event,
      progress: this.saveSystem.getEventProgress(event.id),
      isUnlocked: event.unlockRequirement <= totalStars,
      tierName: CAREER_TIER_NAMES[event.tier],
      tierColor: CAREER_TIER_COLORS[event.tier],
    }));
  }

  startEvent(eventId) {
    const event = getEventById(eventId);
    if (!event) return { success: false, reason: '赛事不存在' };

    const progress = this.saveSystem.getEventProgress(eventId);
    if (event.unlockRequirement > this.saveSystem.getTotalStars()) {
      return { success: false, reason: '星数不足，未解锁' };
    }

    this.currentEvent = event;
    this.eventResult = null;

    return {
      success: true,
      event: event,
      progress: progress,
      trackTheme: event.trackTheme,
    };
  }

  completeEvent(score, time) {
    if (!this.currentEvent) return { success: false, reason: '没有进行中的赛事' };

    const event = this.currentEvent;
    const stars = getStarRating(event, score, time);

    const currentProgress = this.saveSystem.getEventProgress(event.id);
    const isNewBest = score > currentProgress.best_score || time < currentProgress.best_time;
    const isNewStar = stars > currentProgress.stars;

    const rewardCoins = event.rewardCoins * (stars / 3);
    const actualReward = Math.floor(rewardCoins);
    const earnedStars = Math.max(0, stars - currentProgress.stars);

    this.saveSystem.completeEvent(event.id, score, time, stars);

    if (actualReward > 0 && isNewBest) {
      this.saveSystem.addCoins(actualReward);
    }

    const oldTier = this.saveSystem.getCareerTier();

    if (earnedStars > 0) {
      this.saveSystem.addStars(earnedStars);
    }

    this.saveSystem.checkTierUnlock();
    const newTier = this.saveSystem.getCareerTier();
    const tierUp = newTier > oldTier;

    this.eventResult = {
      event: event,
      score: score,
      time: time,
      stars: stars,
      earnedCoins: isNewBest ? actualReward : 0,
      earnedStars: earnedStars,
      isNewBest: isNewBest,
      isNewStar: isNewStar,
      tierUp: tierUp,
      newTier: tierUp ? newTier : null,
    };

    const result = { ...this.eventResult };
    this.currentEvent = null;

    return result;
  }

  getEventProgress(eventId) {
    return this.saveSystem.getEventProgress(eventId);
  }

  getCurrentTier() {
    return this.saveSystem.getCareerTier();
  }

  getCurrentTierName() {
    return CAREER_TIER_NAMES[this.getCurrentTier()];
  }

  getTierProgress() {
    const currentTier = this.getCurrentTier();
    const currentStars = this.saveSystem.getTotalStars();
    const nextTier = currentTier + 1;

    const tierRequirements = {
      0: 6,
      1: 14,
      2: 24,
      3: Infinity,
    };

    const required = tierRequirements[currentTier];
    const nextRequired = tierRequirements[nextTier] || Infinity;

    return {
      currentTier: currentTier,
      currentTierName: CAREER_TIER_NAMES[currentTier],
      currentTierColor: CAREER_TIER_COLORS[currentTier],
      currentStars: currentStars,
      starsForNextTier: nextRequired,
      progress: Math.min(1, (currentStars - required) / (nextRequired - required)) || 0,
    };
  }

  getTotalProgress() {
    const totalEvents = CAREER_EVENTS.length;
    let completedEvents = 0;
    let totalStars = 0;
    let maxStars = 0;

    CAREER_EVENTS.forEach(event => {
      const progress = this.saveSystem.getEventProgress(event.id);
      if (progress.completed) completedEvents++;
      totalStars += progress.stars;
      maxStars += 3;
    });

    return {
      completedEvents: completedEvents,
      totalEvents: totalEvents,
      totalStars: totalStars,
      maxStars: maxStars,
      completionPercent: (completedEvents / totalEvents) * 100,
      starPercent: (totalStars / maxStars) * 100,
    };
  }

  canPlayEvent(eventId) {
    const event = getEventById(eventId);
    if (!event) return false;
    return event.unlockRequirement <= this.saveSystem.getTotalStars();
  }

  getEvent(eventId) {
    return getEventById(eventId);
  }

  getActiveEvent() {
    return this.currentEvent;
  }

  getLastResult() {
    return this.eventResult;
  }
}

window.CareerSystem = CareerSystem;
