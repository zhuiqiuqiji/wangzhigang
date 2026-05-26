class EventSystem {
  constructor(store) {
    this.store = store;
  }

  getSeasonalEvents() {
    return SEASONAL_EVENTS;
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

  getActiveEventBonus() {
    const event = this.getCurrentActiveEvent();
    return event?.bonusMultiplier || 1;
  }

  isEventActive(eventId) {
    const event = this.getCurrentActiveEvent();
    return event?.id === eventId;
  }

  getDailyChallenges() {
    return DAILY_CHALLENGES;
  }

  getTodayChallenges() {
    const state = this.store.getState();
    const today = new Date().toDateString();

    if (state.dailyChallenges?.date === today) {
      return state.dailyChallenges.challenges;
    }

    const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3).map(c => ({
      ...c,
      completed: false,
      progress: 0
    }));

    this.store.setState({
      dailyChallenges: {
        date: today,
        challenges: selected
      }
    });

    return selected;
  }

  updateDailyChallenge(challengeId, progressData) {
    const challenges = this.getTodayChallenges();
    const challenge = challenges.find(c => c.id === challengeId);

    if (!challenge || challenge.completed) return;

    let completed = false;
    let progress = 0;

    switch (challengeId) {
      case 'daily_1':
        progress = progressData.movesUsed || 0;
        completed = progress <= 20 && progressData.completed;
        break;
      case 'daily_2':
        progress = progressData.redCollected || 0;
        completed = progress >= 30;
        break;
      case 'daily_3':
        progress = progressData.combo || 0;
        completed = progress >= 5;
        break;
      case 'daily_4':
        completed = progressData.noItems && progressData.completed;
        break;
      case 'daily_5':
        progress = progressData.decorationsPlaced || 0;
        completed = progress >= 3;
        break;
    }

    if (completed && !challenge.completed) {
      challenge.completed = true;
      challenge.progress = 100;

      const state = this.store.getState();
      this.store.setState({
        coins: state.coins + challenge.reward.coins,
        stars: state.stars + challenge.reward.stars,
        dailyChallenges: {
          ...state.dailyChallenges,
          challenges: challenges
        }
      });

      return { completed: true, reward: challenge.reward, challenge };
    }

    challenge.progress = Math.min(100, Math.floor((progress / (challenge.target?.moves || challenge.target?.red || 20)) * 100));

    const state = this.store.getState();
    this.store.setState({
      dailyChallenges: {
        ...state.dailyChallenges,
        challenges: challenges
      }
    });

    return { completed: false, progress: challenge.progress };
  }

  isDailyChallengeCompleted(challengeId) {
    const challenges = this.getTodayChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    return challenge?.completed || false;
  }

  getLimitedTimeEvent() {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const eventWeek = Math.floor(dayOfYear / 7) % 4;

    const events = [
      {
        id: 'weekly_challenge',
        name: '周挑战',
        description: '完成指定关卡获得额外奖励！',
        targetLevel: 5 + eventWeek * 3,
        reward: { coins: 300, stars: 3 },
        duration: '7天'
      },
      {
        id: 'collection_event',
        name: '收集活动',
        description: '收集指定数量的方块获得奖励！',
        target: 100 + eventWeek * 50,
        reward: { coins: 200, stars: 2 },
        duration: '7天'
      },
      {
        id: 'decoration_event',
        name: '装饰活动',
        description: '放置新装饰获得额外奖励！',
        target: 3 + eventWeek,
        reward: { coins: 400, stars: 4 },
        duration: '7天'
      }
    ];

    return events[eventWeek % events.length];
  }

  getEventProgress() {
    const state = this.store.getState();
    return state.eventProgress || {};
  }

  updateEventProgress(eventId, data) {
    const progress = this.getEventProgress();
    progress[eventId] = {
      ...progress[eventId],
      ...data,
      lastUpdated: new Date().toISOString()
    };

    this.store.setState({ eventProgress: progress });
  }

  getLimitedTimeChallenges() {
    return [
      {
        id: 'ltc_1',
        name: '极速通关',
        description: '在15步内完成任意关卡',
        target: 15,
        reward: { coins: 500, stars: 5 },
        timeLimit: '24小时'
      },
      {
        id: 'ltc_2',
        name: '连击达人',
        description: '达成10次连续消除',
        target: 10,
        reward: { coins: 600, stars: 6 },
        timeLimit: '24小时'
      },
      {
        id: 'ltc_3',
        name: '完美主义',
        description: '不使用道具完成3个关卡',
        target: 3,
        reward: { coins: 800, stars: 8 },
        timeLimit: '48小时'
      }
    ];
  }

  claimDailyReward() {
    const state = this.store.getState();
    const today = new Date().toDateString();

    if (state.lastDailyReward === today) {
      return { success: false, message: '今日已领取' };
    }

    const rewards = [
      { coins: 100, stars: 1, day: 1 },
      { coins: 150, stars: 1, day: 2 },
      { coins: 200, stars: 2, day: 3 },
      { coins: 250, stars: 2, day: 4 },
      { coins: 300, stars: 3, day: 5 },
      { coins: 400, stars: 3, day: 6 },
      { coins: 500, stars: 5, day: 7 }
    ];

    const lastRewardDay = state.lastDailyRewardDay || 0;
    const nextRewardDay = lastRewardDay >= 7 ? 1 : lastRewardDay + 1;
    const reward = rewards[nextRewardDay - 1];

    this.store.setState({
      coins: state.coins + reward.coins,
      stars: state.stars + reward.stars,
      lastDailyReward: today,
      lastDailyRewardDay: nextRewardDay
    });

    return {
      success: true,
      message: `第${nextRewardDay}天签到奖励！`,
      reward: reward,
      day: nextRewardDay
    };
  }

  canClaimDailyReward() {
    const state = this.store.getState();
    const today = new Date().toDateString();
    return state.lastDailyReward !== today;
  }
}
