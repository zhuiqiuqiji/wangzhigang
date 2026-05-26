const STORAGE_KEY = 'garden_match3_game';
const CLOUD_STORAGE_KEY = 'garden_match3_cloud';
const EXPORT_KEY = 'garden_match3_export';

class Storage {
  static getDefaultState() {
    return {
      coins: 100,
      stars: 0,
      currentLevel: 1,
      levelsCompleted: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      energy: 5,
      maxEnergy: 5,
      lastEnergyTime: Date.now(),
      garden: {
        grid: Array(5).fill(null).map(() => Array(5).fill(null)),
        decorations: {}
      },
      items: {},
      buffs: [],
      unlockedChapters: [1],
      completedChapters: [],
      friends: [],
      giftsSent: {},
      dailyChallenges: null,
      lastDailyReward: null,
      lastDailyRewardDay: 0,
      eventProgress: {},
      statistics: {
        totalMatches: 0,
        totalCoins: 0,
        totalLevels: 0,
        itemsUsed: 0,
        decorationsPlaced: 0
      }
    };
  }

  static save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('保存失败:', e);
    }
  }

  static load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const savedState = JSON.parse(data);
        const defaultState = this.getDefaultState();

        if (Array.isArray(savedState.garden?.decorations)) {
          const oldDecorations = savedState.garden.decorations;
          savedState.garden.decorations = {};
          oldDecorations.forEach(id => {
            savedState.garden.decorations[id] = 1;
          });
        }

        return {
          ...defaultState,
          ...savedState,
          garden: {
            ...defaultState.garden,
            ...savedState.garden,
            grid: savedState.garden?.grid || defaultState.garden.grid
          },
          statistics: {
            ...defaultState.statistics,
            ...savedState.statistics
          }
        };
      }
    } catch (e) {
      console.error('加载失败:', e);
    }
    return this.getDefaultState();
  }

  static reset() {
    localStorage.removeItem(STORAGE_KEY);
    return this.getDefaultState();
  }

  static exportSave() {
    try {
      const state = this.load();
      const exportData = {
        version: '1.0',
        timestamp: Date.now(),
        data: state
      };
      const jsonStr = JSON.stringify(exportData);
      return btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (e) {
      console.error('导出失败:', e);
      return null;
    }
  }

  static importSave(encodedData) {
    try {
      const jsonStr = decodeURIComponent(escape(atob(encodedData)));
      const importData = JSON.parse(jsonStr);

      if (!importData.data || !importData.version) {
        return { success: false, message: '存档数据格式错误' };
      }

      const defaultState = this.getDefaultState();
      const importedState = importData.data;

      const mergedState = {
        ...defaultState,
        ...importedState,
        garden: {
          ...defaultState.garden,
          ...importedState.garden,
          grid: importedState.garden?.grid || defaultState.garden.grid
        },
        statistics: {
          ...defaultState.statistics,
          ...importedState.statistics
        }
      };

      this.save(mergedState);
      return { success: true, message: '存档导入成功！' };
    } catch (e) {
      console.error('导入失败:', e);
      return { success: false, message: '存档导入失败' };
    }
  }

  static saveToCloud(state) {
    try {
      const cloudData = {
        version: '1.0',
        timestamp: Date.now(),
        deviceId: this.getDeviceId(),
        data: state
      };
      localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(cloudData));
      return { success: true, message: '云存档保存成功！' };
    } catch (e) {
      console.error('云存档失败:', e);
      return { success: false, message: '云存档保存失败' };
    }
  }

  static loadFromCloud() {
    try {
      const data = localStorage.getItem(CLOUD_STORAGE_KEY);
      if (!data) {
        return { success: false, message: '没有找到云存档' };
      }

      const cloudData = JSON.parse(data);
      if (!cloudData.data) {
        return { success: false, message: '云存档数据损坏' };
      }

      return {
        success: true,
        message: '云存档加载成功！',
        state: cloudData.data,
        timestamp: cloudData.timestamp,
        deviceId: cloudData.deviceId
      };
    } catch (e) {
      console.error('云存档加载失败:', e);
      return { success: false, message: '云存档加载失败' };
    }
  }

  static getDeviceId() {
    let deviceId = localStorage.getItem('garden_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('garden_device_id', deviceId);
    }
    return deviceId;
  }

  static getSaveInfo() {
    const state = this.load();
    return {
      coins: state.coins,
      stars: state.stars,
      levelsCompleted: state.levelsCompleted,
      currentLevel: state.currentLevel,
      decorationsPlaced: this.countDecorations(state),
      lastSaved: Date.now()
    };
  }

  static countDecorations(state) {
    const grid = state.garden?.grid || [];
    let count = 0;
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell) count++;
      });
    });
    return count;
  }

  static mergeSaves(localState, cloudState) {
    if (!cloudState) return localState;

    const localLevels = localState.levelsCompleted || 0;
    const cloudLevels = cloudState.levelsCompleted || 0;
    const localCoins = localState.coins || 0;
    const cloudCoins = cloudState.coins || 0;
    const localStars = localState.stars || 0;
    const cloudStars = cloudState.stars || 0;

    return {
      ...localState,
      ...cloudState,
      coins: Math.max(localCoins, cloudCoins),
      stars: Math.max(localStars, cloudStars),
      levelsCompleted: Math.max(localLevels, cloudLevels),
      currentLevel: Math.max(localState.currentLevel || 1, cloudState.currentLevel || 1),
      unlockedChapters: Array.from(new Set([
        ...(localState.unlockedChapters || []),
        ...(cloudState.unlockedChapters || [])
      ])),
      completedChapters: Array.from(new Set([
        ...(localState.completedChapters || []),
        ...(cloudState.completedChapters || [])
      ]))
    };
  }
}
