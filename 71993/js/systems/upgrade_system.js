class UpgradeSystem {
  constructor(saveSystem) {
    this.saveSystem = saveSystem;
    this.currentUpgrades = saveSystem.getUpgrades();
    this.cachedStats = this.calculateStats();
  }

  getCurrentLevel(type) {
    return this.currentUpgrades[type] || 1;
  }

  canUpgrade(type) {
    const currentLevel = this.getCurrentLevel(type);
    if (currentLevel >= 5) return { can: false, reason: '已达最高等级' };

    const price = getUpgradePrice(type, currentLevel);
    const coins = this.saveSystem.getCoins();

    if (coins < price) {
      return { can: false, reason: '金币不足', needed: price - coins };
    }

    return { can: true, price: price };
  }

  purchaseUpgrade(type) {
    const check = this.canUpgrade(type);
    if (!check.can) return { success: false, reason: check.reason };

    if (!this.saveSystem.spendCoins(check.price)) {
      return { success: false, reason: '金币不足' };
    }

    const newLevel = this.getCurrentLevel(type) + 1;
    this.currentUpgrades[type] = newLevel;
    this.saveSystem.setUpgradeLevel(type, newLevel);
    this.cachedStats = this.calculateStats();

    const info = getUpgradeInfo(type, newLevel);
    return {
      success: true,
      newLevel: newLevel,
      info: info,
      remainingCoins: this.saveSystem.getCoins(),
    };
  }

  getUpgradeInfo(type, level) {
    return getUpgradeInfo(type, level || this.getCurrentLevel(type));
  }

  getPrice(type) {
    return getUpgradePrice(type, this.getCurrentLevel(type));
  }

  calculateStats() {
    return getAppliedStats(this.currentUpgrades);
  }

  getStats() {
    return { ...this.cachedStats };
  }

  getMaxSpeed() {
    return this.cachedStats.maxSpeed;
  }

  getAcceleration() {
    return this.cachedStats.acceleration;
  }

  getGrip() {
    return this.cachedStats.grip;
  }

  getRollingResistance() {
    return this.cachedStats.rollingResistance;
  }

  getSuspensionTravel() {
    return this.cachedStats.suspensionTravel;
  }

  getLandingAngleTolerance() {
    return this.cachedStats.landingAngleTolerance;
  }

  getStability() {
    return this.cachedStats.stability;
  }

  getComparison(type) {
    const current = this.getCurrentLevel(type);
    const currentInfo = this.getUpgradeInfo(type, current);
    const nextInfo = current < 5 ? this.getUpgradeInfo(type, current + 1) : null;

    return {
      current: currentInfo,
      next: nextInfo,
      currentLevel: current,
      canUpgrade: current < 5,
      price: this.getPrice(type),
    };
  }

  getAllUpgrades() {
    return {
      engine: this.getComparison('engine'),
      tire: this.getComparison('tire'),
      suspension: this.getComparison('suspension'),
    };
  }

  resetUpgrades() {
    this.currentUpgrades = { engine: 1, tire: 1, suspension: 1 };
    this.saveSystem.setUpgradeLevel('engine', 1);
    this.saveSystem.setUpgradeLevel('tire', 1);
    this.saveSystem.setUpgradeLevel('suspension', 1);
    this.cachedStats = this.calculateStats();
    return this.currentUpgrades;
  }

  getTotalInvestment() {
    let total = 0;
    ['engine', 'tire', 'suspension'].forEach(type => {
      const level = this.getCurrentLevel(type);
      for (let i = 1; i < level; i++) {
        total += UPGRADES[type].levels[i].price;
      }
    });
    return total;
  }
}

window.UpgradeSystem = UpgradeSystem;
