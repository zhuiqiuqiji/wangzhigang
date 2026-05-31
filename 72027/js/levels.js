var Levels = (function () {
    var levels = [
        {
            id: 'bridge',
            name: '高架桥',
            description: '穿越城市天际线的高空挑战',
            difficulty: 1,
            unlocked: true,
            accentColor: '#ff8c42',
            trackColor: 0x8899aa,
            trackEmissive: 0x112233,
            width: 1.4,
            friction: 1.0,
            starThresholds: [0, 150, 100],
            bgColor: 0x1a0e0a,
            fogColor: 0x1a0e0a,
            fogDensity: 0.002,
            ambientColor: 0x443322,
            ambientIntensity: 0.5,
            dirLightColor: 0xffaa66,
            dirLightIntensity: 1.0,
            pointLightColors: [0xff8c42, 0xff6b35, 0xffaa66, 0xffeedd, 0xff8c42],
            points: [
                [0, 0, 0], [0, 0, -15], [0, 0, -30],
                [4, 0, -48], [10, 0, -65], [12, 0, -82],
                [8, 1, -100], [2, 3, -118], [-2, 5, -135],
                [-8, 6, -152], [-14, 6, -168], [-10, 5, -182],
                [-2, 4, -195], [6, 3, -210], [12, 2, -225],
                [8, 0, -240], [2, -1, -255], [0, 0, -270],
                [0, 0, -288], [0, 0, -310]
            ],
            collectibles: [
                { type: 'coin', t: 0.05, offset: 0 },
                { type: 'coin', t: 0.1, offset: 0 },
                { type: 'coin', t: 0.15, offset: 0.3 },
                { type: 'gem', t: 0.2, offset: -0.5 },
                { type: 'coin', t: 0.25, offset: 0 },
                { type: 'coin', t: 0.32, offset: 0.4 },
                { type: 'gem', t: 0.4, offset: 0.5 },
                { type: 'coin', t: 0.48, offset: 0 },
                { type: 'coin', t: 0.55, offset: -0.3 },
                { type: 'energy', t: 0.6, offset: 0 },
                { type: 'coin', t: 0.65, offset: 0.2 },
                { type: 'gem', t: 0.72, offset: -0.4 },
                { type: 'coin', t: 0.78, offset: 0 },
                { type: 'coin', t: 0.85, offset: 0.3 },
                { type: 'gem', t: 0.9, offset: 0.5 },
                { type: 'coin', t: 0.95, offset: 0 }
            ]
        },
        {
            id: 'snow',
            name: '雪山索道',
            description: '在冰封雪山间穿梭的极限挑战',
            difficulty: 2,
            unlocked: false,
            unlockCondition: '高架桥获得至少1星',
            accentColor: '#4fc3f7',
            trackColor: 0xaaccee,
            trackEmissive: 0x112244,
            width: 1.2,
            friction: 0.6,
            starThresholds: [0, 180, 130],
            bgColor: 0x0a1628,
            fogColor: 0x0a1628,
            fogDensity: 0.004,
            ambientColor: 0x334466,
            ambientIntensity: 0.7,
            dirLightColor: 0xccddff,
            dirLightIntensity: 0.9,
            pointLightColors: [0x4fc3f7, 0x4fc3f7, 0x81d4fa, 0xffffff, 0x4fc3f7],
            points: [
                [0, 5, 0], [0, 5, -18], [2, 6, -36],
                [6, 9, -55], [10, 13, -75], [8, 16, -95],
                [2, 18, -115], [-4, 19, -135], [-10, 18, -155],
                [-14, 15, -172], [-10, 12, -188], [-4, 10, -202],
                [4, 11, -218], [10, 14, -235], [6, 16, -252],
                [0, 15, -268], [-4, 12, -285], [-2, 8, -300],
                [0, 5, -318], [0, 3, -340]
            ],
            collectibles: [
                { type: 'coin', t: 0.04, offset: 0 },
                { type: 'coin', t: 0.1, offset: 0.2 },
                { type: 'gem', t: 0.18, offset: -0.45 },
                { type: 'coin', t: 0.25, offset: 0 },
                { type: 'coin', t: 0.3, offset: -0.3 },
                { type: 'energy', t: 0.38, offset: 0 },
                { type: 'gem', t: 0.45, offset: 0.4 },
                { type: 'coin', t: 0.52, offset: 0 },
                { type: 'coin', t: 0.58, offset: 0.35 },
                { type: 'gem', t: 0.65, offset: -0.5 },
                { type: 'coin', t: 0.72, offset: 0 },
                { type: 'coin', t: 0.78, offset: -0.2 },
                { type: 'energy', t: 0.82, offset: 0 },
                { type: 'gem', t: 0.88, offset: 0.45 },
                { type: 'coin', t: 0.93, offset: 0 },
                { type: 'coin', t: 0.97, offset: 0 }
            ]
        },
        {
            id: 'scifi',
            name: '科幻管道',
            description: '未来科技世界的极速穿梭',
            difficulty: 3,
            unlocked: false,
            unlockCondition: '雪山索道获得至少1星',
            accentColor: '#b388ff',
            trackColor: 0x6633cc,
            trackEmissive: 0x220066,
            width: 1.0,
            friction: 0.8,
            starThresholds: [0, 200, 150],
            bgColor: 0x050010,
            fogColor: 0x050010,
            fogDensity: 0.003,
            ambientColor: 0x220044,
            ambientIntensity: 0.4,
            dirLightColor: 0xb388ff,
            dirLightIntensity: 0.8,
            pointLightColors: [0xb388ff, 0xb388ff, 0xff6bff, 0x4488ff, 0xb388ff],
            points: [
                [0, 0, 0], [0, 0, -12], [3, 0, -25],
                [10, 2, -40], [16, 5, -58], [12, 8, -75],
                [4, 6, -90], [-4, 3, -105], [-12, 0, -120],
                [-18, -2, -138], [-14, -5, -155], [-6, -3, -170],
                [4, 0, -185], [14, 4, -202], [18, 8, -220],
                [12, 5, -238], [4, 2, -252], [-2, 0, -268],
                [0, -2, -285], [0, 0, -305]
            ],
            collectibles: [
                { type: 'coin', t: 0.03, offset: 0 },
                { type: 'coin', t: 0.08, offset: 0.3 },
                { type: 'gem', t: 0.14, offset: -0.35 },
                { type: 'energy', t: 0.2, offset: 0 },
                { type: 'coin', t: 0.26, offset: -0.2 },
                { type: 'gem', t: 0.33, offset: 0.4 },
                { type: 'coin', t: 0.4, offset: 0 },
                { type: 'coin', t: 0.46, offset: 0.35 },
                { type: 'gem', t: 0.52, offset: -0.4 },
                { type: 'energy', t: 0.58, offset: 0 },
                { type: 'coin', t: 0.64, offset: 0 },
                { type: 'gem', t: 0.7, offset: 0.45 },
                { type: 'coin', t: 0.76, offset: -0.3 },
                { type: 'coin', t: 0.82, offset: 0 },
                { type: 'gem', t: 0.88, offset: -0.35 },
                { type: 'coin', t: 0.94, offset: 0 }
            ]
        },
        {
            id: 'volcano',
            name: '火山熔岩',
            description: '炽热岩浆上的死亡挑战',
            difficulty: 4,
            unlocked: false,
            unlockCondition: '科幻管道获得至少2星',
            accentColor: '#ff5722',
            trackColor: 0x8b2500,
            trackEmissive: 0x331100,
            width: 0.9,
            friction: 0.7,
            starThresholds: [0, 220, 160],
            bgColor: 0x1a0500,
            fogColor: 0x1a0500,
            fogDensity: 0.005,
            ambientColor: 0x442211,
            ambientIntensity: 0.4,
            dirLightColor: 0xff6633,
            dirLightIntensity: 1.2,
            pointLightColors: [0xff5722, 0xff9800, 0xff3d00, 0xffeb3b, 0xff5722],
            points: [
                [0, 2, 0], [-3, 3, -15], [-8, 5, -32],
                [-12, 8, -50], [-8, 12, -68], [-2, 15, -85],
                [6, 14, -102], [14, 10, -120], [16, 6, -138],
                [10, 4, -155], [2, 6, -172], [-6, 10, -190],
                [-14, 8, -208], [-10, 4, -225], [-2, 2, -242],
                [8, 3, -260], [12, 6, -278], [8, 4, -295],
                [2, 2, -312], [0, 0, -330]
            ],
            collectibles: [
                { type: 'coin', t: 0.05, offset: 0 },
                { type: 'gem', t: 0.12, offset: 0.3 },
                { type: 'coin', t: 0.2, offset: -0.25 },
                { type: 'energy', t: 0.28, offset: 0 },
                { type: 'gem', t: 0.35, offset: 0.3 },
                { type: 'coin', t: 0.42, offset: 0 },
                { type: 'coin', t: 0.5, offset: -0.3 },
                { type: 'gem', t: 0.58, offset: 0.25 },
                { type: 'energy', t: 0.66, offset: 0 },
                { type: 'coin', t: 0.74, offset: -0.2 },
                { type: 'gem', t: 0.82, offset: 0.35 },
                { type: 'coin', t: 0.9, offset: 0 }
            ]
        }
    ];

    function getAll() {
        return levels.slice();
    }

    function getById(id) {
        for (var i = 0; i < levels.length; i++) {
            if (levels[i].id === id) return levels[i];
        }
        return levels[0];
    }

    function getIndexById(id) {
        for (var i = 0; i < levels.length; i++) {
            if (levels[i].id === id) return i;
        }
        return 0;
    }

    function getPointsForLevel(levelId) {
        var level = getById(levelId);
        var pts = [];
        for (var i = 0; i < level.points.length; i++) {
            pts.push(new THREE.Vector3(
                level.points[i][0],
                level.points[i][1],
                level.points[i][2]
            ));
        }
        return pts;
    }

    function getStarThresholds(levelId) {
        var level = getById(levelId);
        return level.starThresholds;
    }

    function calculateStar(levelId, time) {
        var thresholds = getStarThresholds(levelId);
        if (time <= thresholds[2]) return 3;
        if (time <= thresholds[1]) return 2;
        return 1;
    }

    function isUnlocked(levelId) {
        var level = getById(levelId);
        if (level.unlocked) return true;
        try {
            var data = JSON.parse(localStorage.getItem('bb_levels_unlocked') || '[]');
            return data.indexOf(levelId) !== -1;
        } catch (e) { return false; }
    }

    function unlockLevel(levelId) {
        try {
            var data = JSON.parse(localStorage.getItem('bb_levels_unlocked') || '[]');
            if (data.indexOf(levelId) === -1) {
                data.push(levelId);
                localStorage.setItem('bb_levels_unlocked', JSON.stringify(data));
                return true;
            }
        } catch (e) { }
        return false;
    }

    function getUnlockedList() {
        var list = [];
        for (var i = 0; i < levels.length; i++) {
            if (isUnlocked(levels[i].id)) {
                list.push(levels[i]);
            }
        }
        return list;
    }

    function getLevelProgress(levelId) {
        try {
            var data = JSON.parse(localStorage.getItem('bb_level_progress') || '{}');
            return data[levelId] || { bestTime: null, bestStars: 0, attempts: 0, completions: 0 };
        } catch (e) {
            return { bestTime: null, bestStars: 0, attempts: 0, completions: 0 };
        }
    }

    function saveLevelProgress(levelId, time, stars, completed) {
        try {
            var data = JSON.parse(localStorage.getItem('bb_level_progress') || '{}');
            if (!data[levelId]) {
                data[levelId] = { bestTime: null, bestStars: 0, attempts: 0, completions: 0 };
            }
            
            data[levelId].attempts++;
            
            if (completed) {
                data[levelId].completions++;
                if (!data[levelId].bestTime || time < data[levelId].bestTime) {
                    data[levelId].bestTime = time;
                }
                if (stars > data[levelId].bestStars) {
                    data[levelId].bestStars = stars;
                }
            }
            
            localStorage.setItem('bb_level_progress', JSON.stringify(data));
            
            var levelIndex = getIndexById(levelId);
            if (completed && stars >= 1 && levelIndex < levels.length - 1) {
                unlockLevel(levels[levelIndex + 1].id);
            }
            
            return data[levelId];
        } catch (e) {
            return null;
        }
    }

    function getTotalStars() {
        var total = 0;
        for (var i = 0; i < levels.length; i++) {
            var progress = getLevelProgress(levels[i].id);
            total += progress.bestStars;
        }
        return total;
    }

    function getTotalScore() {
        var total = 0;
        for (var i = 0; i < levels.length; i++) {
            var progress = getLevelProgress(levels[i].id);
            if (progress.bestTime) {
                total += (4 - progress.bestStars) * 50 + Math.max(0, 300 - progress.bestTime);
            }
        }
        return Math.floor(total);
    }

    return {
        getAll: getAll,
        getById: getById,
        getIndexById: getIndexById,
        getPointsForLevel: getPointsForLevel,
        getStarThresholds: getStarThresholds,
        calculateStar: calculateStar,
        isUnlocked: isUnlocked,
        unlockLevel: unlockLevel,
        getUnlockedList: getUnlockedList,
        getLevelProgress: getLevelProgress,
        saveLevelProgress: saveLevelProgress,
        getTotalStars: getTotalStars,
        getTotalScore: getTotalScore
    };
})();
