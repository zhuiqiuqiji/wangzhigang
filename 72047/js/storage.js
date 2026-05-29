(function () {
  'use strict';

  var LB_KEY = 'tower_stack_leaderboard';
  var MAX_ENTRIES = 10;
  var DAILY_KEY_PREFIX = 'tower_stack_daily_';

  function getTodayKey() {
    var d = new Date();
    return DAILY_KEY_PREFIX + d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function getLeaderboard() {
    try {
      var data = localStorage.getItem(LB_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLeaderboard(entries) {
    try {
      localStorage.setItem(LB_KEY, JSON.stringify(entries));
    } catch (e) {}
  }

  function addScore(score, height, perfectCount, mode, theme) {
    var entries = getLeaderboard();
    entries.push({
      score: score,
      height: height,
      perfectCount: perfectCount,
      mode: mode,
      theme: theme,
      date: new Date().toLocaleDateString('zh-CN')
    });

    entries.sort(function (a, b) { return b.score - a.score; });

    if (entries.length > MAX_ENTRIES) {
      entries = entries.slice(0, MAX_ENTRIES);
    }

    saveLeaderboard(entries);

    var topScore = entries.length > 0 ? entries[0].score : 0;
    return score >= topScore && entries.filter(function (e) { return e.score === score; }).length === 1;
  }

  function getDailyHeight() {
    try {
      var key = getTodayKey();
      var data = localStorage.getItem(key);
      return data ? parseInt(data, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  function updateDailyHeight(height) {
    try {
      var key = getTodayKey();
      var current = getDailyHeight();
      if (height > current) {
        localStorage.setItem(key, String(height));
        return true;
      }
    } catch (e) {}
    return false;
  }

  function clearLeaderboard() {
    try {
      localStorage.removeItem(LB_KEY);
    } catch (e) {}
  }

  function formatMode(mode) {
    switch (mode) {
      case 'endless': return '无尽';
      case 'timed': return '限时';
      case 'target': return '目标';
      default: return mode;
    }
  }

  function formatTheme(theme) {
    if (window.GameThemes && window.GameThemes[theme]) {
      return window.GameThemes[theme].name;
    }
    return theme;
  }

  window.GameStorage = {
    getLeaderboard: getLeaderboard,
    addScore: addScore,
    getDailyHeight: getDailyHeight,
    updateDailyHeight: updateDailyHeight,
    clearLeaderboard: clearLeaderboard,
    formatMode: formatMode,
    formatTheme: formatTheme
  };
})();
