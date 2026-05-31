const Storage = {
  STORAGE_KEY: 'moto_stunt_v2_',

  get: function(key, defaultValue) {
    try {
      const item = localStorage.getItem(this.STORAGE_KEY + key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (e) {
      console.warn('Storage get error:', e);
      return defaultValue;
    }
  },

  set: function(key, value) {
    try {
      localStorage.setItem(this.STORAGE_KEY + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage set error:', e);
      return false;
    }
  },

  remove: function(key) {
    try {
      localStorage.removeItem(this.STORAGE_KEY + key);
      return true;
    } catch (e) {
      console.warn('Storage remove error:', e);
      return false;
    }
  },

  clear: function() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.STORAGE_KEY)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (e) {
      console.warn('Storage clear error:', e);
      return false;
    }
  },

  exists: function(key) {
    return localStorage.getItem(this.STORAGE_KEY + key) !== null;
  },

  getPlayerProfile: function() {
    return this.get('player_profile', {
      name: 'Player',
      total_coins: 0,
      total_stars: 0,
      career_tier: 0,
      upgrades: { engine: 1, tire: 1, suspension: 1 },
    });
  },

  savePlayerProfile: function(profile) {
    return this.set('player_profile', profile);
  },

  getCareerProgress: function() {
    return this.get('career_progress', {});
  },

  saveCareerProgress: function(progress) {
    return this.set('career_progress', progress);
  },

  getLeaderboard: function(trackId) {
    return this.get('leaderboard_' + trackId, []);
  },

  saveLeaderboard: function(trackId, data) {
    return this.set('leaderboard_' + trackId, data);
  },

  getGhostData: function(trackId, rank) {
    return this.get('ghost_' + trackId + '_' + rank, null);
  },

  saveGhostData: function(trackId, rank, data) {
    return this.set('ghost_' + trackId + '_' + rank, data);
  },

  getCustomTracks: function() {
    return this.get('custom_tracks', {});
  },

  saveCustomTrack: function(name, data) {
    const tracks = this.getCustomTracks();
    tracks[name] = data;
    return this.set('custom_tracks', tracks);
  },

  getSettings: function() {
    return this.get('settings', {
      soundEnabled: true,
      musicEnabled: true,
      difficulty: 'normal',
    });
  },

  saveSettings: function(settings) {
    return this.set('settings', settings);
  },
};

window.Storage = Storage;
