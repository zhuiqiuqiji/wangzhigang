class SaveSystem {
  constructor() {
    this.playerProfile = Storage.getPlayerProfile();
    this.careerProgress = Storage.getCareerProgress();
    this.autoSaveInterval = 30000;
    this.lastAutoSave = 0;
    this.isDirty = false;
  }

  getProfile() {
    return { ...this.playerProfile };
  }

  getCoins() {
    return this.playerProfile.total_coins;
  }

  getTotalStars() {
    return this.playerProfile.total_stars;
  }

  getCareerTier() {
    return this.playerProfile.career_tier;
  }

  getUpgrades() {
    return { ...this.playerProfile.upgrades };
  }

  getUpgradeLevel(type) {
    return this.playerProfile.upgrades[type] || 1;
  }

  addCoins(amount) {
    this.playerProfile.total_coins += amount;
    this.isDirty = true;
    return this.playerProfile.total_coins;
  }

  spendCoins(amount) {
    if (this.playerProfile.total_coins >= amount) {
      this.playerProfile.total_coins -= amount;
      this.isDirty = true;
      return true;
    }
    return false;
  }

  addStars(amount) {
    this.playerProfile.total_stars += amount;
    this.checkTierUnlock();
    this.isDirty = true;
    return this.playerProfile.total_stars;
  }

  setUpgradeLevel(type, level) {
    if (level >= 1 && level <= 5) {
      this.playerProfile.upgrades[type] = level;
      this.isDirty = true;
      return true;
    }
    return false;
  }

  checkTierUnlock() {
    const currentStars = this.playerProfile.total_stars;
    let newTier = 0;
    if (currentStars >= 24) newTier = 3;
    else if (currentStars >= 14) newTier = 2;
    else if (currentStars >= 6) newTier = 1;
    if (newTier > this.playerProfile.career_tier) {
      this.playerProfile.career_tier = newTier;
      return newTier;
    }
    return this.playerProfile.career_tier;
  }

  getEventProgress(eventId) {
    return this.careerProgress[eventId] || {
      best_score: 0,
      best_time: Infinity,
      stars: 0,
      completed: false,
    };
  }

  completeEvent(eventId, score, time, stars) {
    const current = this.getEventProgress(eventId);
    const improved = score > current.best_score || time < current.best_time || stars > current.stars;

    if (improved) {
      this.careerProgress[eventId] = {
        best_score: Math.max(current.best_score, score),
        best_time: Math.min(current.best_time, time),
        stars: Math.max(current.stars, stars),
        completed: true,
        last_played: Date.now(),
      };
      this.isDirty = true;
      return true;
    }
    return false;
  }

  saveAll() {
    const profileSaved = Storage.savePlayerProfile(this.playerProfile);
    const progressSaved = Storage.saveCareerProgress(this.careerProgress);
    this.isDirty = false;
    return profileSaved && progressSaved;
  }

  autoSave(currentTime) {
    if (this.isDirty && currentTime - this.lastAutoSave > this.autoSaveInterval) {
      this.saveAll();
      this.lastAutoSave = currentTime;
      return true;
    }
    return false;
  }

  resetProgress() {
    this.playerProfile = {
      name: 'Player',
      total_coins: 0,
      total_stars: 0,
      career_tier: 0,
      upgrades: { engine: 1, tire: 1, suspension: 1 },
    };
    this.careerProgress = {};
    this.isDirty = true;
    this.saveAll();
  }

  resetCareerProgress() {
    this.careerProgress = {};
    this.isDirty = true;
    this.saveAll();
  }

  exportSave() {
    return {
      playerProfile: this.playerProfile,
      careerProgress: this.careerProgress,
      exportTime: Date.now(),
      version: 1,
    };
  }

  importSave(data) {
    if (data && data.playerProfile && data.careerProgress) {
      this.playerProfile = { ...data.playerProfile };
      this.careerProgress = { ...data.careerProgress };
      this.isDirty = true;
      this.saveAll();
      return true;
    }
    return false;
  }
}

window.SaveSystem = SaveSystem;
