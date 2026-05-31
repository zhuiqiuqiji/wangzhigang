class Leaderboard {
  constructor() {
    this.maxEntries = 10;
  }

  getTopScores(trackId, limit = 10) {
    const scores = Storage.getLeaderboard(trackId);
    const limited = scores.slice(0, Math.min(limit, this.maxEntries));
    return limited.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  addScore(trackId, score, time, playerName = 'Player') {
    const entry = {
      name: playerName,
      score: score,
      time: time,
      date: new Date().toISOString(),
      ghostAvailable: false,
    };

    const scores = Storage.getLeaderboard(trackId);
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);

    const topScores = scores.slice(0, this.maxEntries);
    const rank = topScores.findIndex(s =>
      s.score === entry.score && s.time === entry.time && s.date === entry.date
    ) + 1;

    if (rank > 0 && rank <= this.maxEntries) {
      Storage.saveLeaderboard(trackId, topScores);
      entry.rank = rank;
      entry.ghostAvailable = rank <= 3;
      return {
        isNewRecord: rank <= 3,
        rank: rank,
        entry: entry,
      };
    }

    return {
      isNewRecord: false,
      rank: null,
      entry: entry,
    };
  }

  getPlayerRank(trackId, score) {
    const scores = Storage.getLeaderboard(trackId);
    let rank = 1;
    for (const s of scores) {
      if (s.score > score) rank++;
    }
    return rank;
  }

  clearScores(trackId) {
    Storage.saveLeaderboard(trackId, []);
  }

  getBestScore(trackId) {
    const scores = Storage.getLeaderboard(trackId);
    return scores.length > 0 ? scores[0] : null;
  }

  getBestTime(trackId) {
    const scores = Storage.getLeaderboard(trackId);
    if (scores.length === 0) return null;
    return scores.reduce((best, s) => s.time < best.time ? s : best);
  }

  getAllTracksBest() {
    const result = {};
    for (const theme in TRACK_THEMES) {
      result[theme] = {
        bestScore: this.getBestScore(theme),
        bestTime: this.getBestTime(theme),
      };
    }
    return result;
  }

  hasGhost(trackId, rank) {
    return Storage.exists('ghost_' + trackId + '_' + rank);
  }

  setGhostAvailable(trackId, rank, available) {
    const scores = Storage.getLeaderboard(trackId);
    if (scores[rank - 1]) {
      scores[rank - 1].ghostAvailable = available;
      Storage.saveLeaderboard(trackId, scores);
    }
  }
}

window.Leaderboard = Leaderboard;
