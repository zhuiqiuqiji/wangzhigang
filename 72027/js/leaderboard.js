var Leaderboard = (function () {
    var MAX_ENTRIES = 10;
    var PLAYER_NAME_KEY = 'bb_player_name';
    var LEADERBOARD_KEY = 'bb_leaderboard';

    function getPlayerName() {
        try {
            return localStorage.getItem(PLAYER_NAME_KEY) || '匿名玩家';
        } catch (e) {
            return '匿名玩家';
        }
    }

    function setPlayerName(name) {
        try {
            localStorage.setItem(PLAYER_NAME_KEY, name);
            return true;
        } catch (e) {
            return false;
        }
    }

    function getAll() {
        try {
            var data = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
            return data.sort(function (a, b) {
                return a.time - b.time;
            }).slice(0, MAX_ENTRIES);
        } catch (e) {
            return [];
        }
    }

    function getByLevel(levelId) {
        try {
            var data = JSON.parse(localStorage.getItem(LEADERBOARD_KEY + '_' + levelId) || '[]');
            return data.sort(function (a, b) {
                return a.time - b.time;
            }).slice(0, MAX_ENTRIES);
        } catch (e) {
            return [];
        }
    }

    function addEntry(levelId, time, stars, score) {
        var playerName = getPlayerName();
        var entry = {
            name: playerName,
            time: time,
            stars: stars,
            score: score || 0,
            levelId: levelId,
            timestamp: Date.now()
        };

        try {
            var allData = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
            allData.push(entry);
            allData.sort(function (a, b) { return a.time - b.time; });
            allData = allData.slice(0, MAX_ENTRIES);
            localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(allData));

            var levelData = JSON.parse(localStorage.getItem(LEADERBOARD_KEY + '_' + levelId) || '[]');
            levelData.push(entry);
            levelData.sort(function (a, b) { return a.time - b.time; });
            levelData = levelData.slice(0, MAX_ENTRIES);
            localStorage.setItem(LEADERBOARD_KEY + '_' + levelId, JSON.stringify(levelData));

            return getRank(levelId, time);
        } catch (e) {
            return -1;
        }
    }

    function getRank(levelId, time) {
        var data = getByLevel(levelId);
        for (var i = 0; i < data.length; i++) {
            if (time <= data[i].time) {
                return i + 1;
            }
        }
        return data.length + 1;
    }

    function isNewRecord(levelId, time) {
        var data = getByLevel(levelId);
        if (data.length === 0) return true;
        return time < data[0].time;
    }

    function clearAll() {
        try {
            localStorage.removeItem(LEADERBOARD_KEY);
            var levels = Levels.getAll();
            for (var i = 0; i < levels.length; i++) {
                localStorage.removeItem(LEADERBOARD_KEY + '_' + levels[i].id);
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    function formatRank(rank) {
        if (rank === 1) return '🥇 第1名';
        if (rank === 2) return '🥈 第2名';
        if (rank === 3) return '🥉 第3名';
        return '第' + rank + '名';
    }

    function generateSampleData() {
        var sampleNames = ['速度之王', '平衡大师', '钢丝舞者', '暗夜骑士', '光速侠'];
        var levels = Levels.getAll();

        for (var l = 0; l < levels.length; l++) {
            var levelId = levels[l].id;
            var thresholds = levels[l].starThresholds;
            var data = [];

            for (var i = 0; i < 5; i++) {
                var baseTime = thresholds[2] + i * 15 + Math.random() * 10;
                var stars = 3 - Math.floor(i / 2);
                data.push({
                    name: sampleNames[i],
                    time: Math.round(baseTime * 10) / 10,
                    stars: Math.max(1, stars),
                    score: Math.round((300 - baseTime) * (stars / 2)),
                    levelId: levelId,
                    timestamp: Date.now() - i * 86400000
                });
            }

            data.sort(function (a, b) { return a.time - b.time; });
            try {
                localStorage.setItem(LEADERBOARD_KEY + '_' + levelId, JSON.stringify(data));
            } catch (e) { }
        }
    }

    return {
        getPlayerName: getPlayerName,
        setPlayerName: setPlayerName,
        getAll: getAll,
        getByLevel: getByLevel,
        addEntry: addEntry,
        getRank: getRank,
        isNewRecord: isNewRecord,
        clearAll: clearAll,
        formatRank: formatRank,
        generateSampleData: generateSampleData,
        MAX_ENTRIES: MAX_ENTRIES
    };
})();
