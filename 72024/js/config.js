(function () {
    'use strict';

    window.GameConfig = {
        GAME_DURATION: 120,
        MAX_LIVES: 5,
        EGG_WIDTH: 32,
        EGG_HEIGHT: 38,
        HEN_SPEED: 2,
        BASKET_SPEED: 7,
        BASKET_WIDTH: 80,
        BASKET_COLLISION_PADDING: 6,
        BASKET_EDGE_TOLERANCE: 3,
        BASKET_CENTER_OVERLAP_THRESHOLD: 12,
        EGG_INTERVAL_MIN: 1500,
        EGG_INTERVAL_MAX: 2500,
        BASE_FALL_SPEED: 2,
        GROUND_HEIGHT: 50,
        ROOF_HEIGHT: 60,
        HEN_TOP_OFFSET: 62,
        DIFFICULTY_THRESHOLD: 50,
        COIN_TO_SCORE_RATIO: 0.1,

        DROP_ITEMS: {
            normal: {
                emoji: '\u{1F95A}',
                score: 10,
                lifeChange: 0,
                probability: 0.65,
                minFarmLevel: 1,
                isPowerup: false,
                className: 'normal-egg',
                name: '\u666E\u901A\u86CB',
                color: '#F5F0E0'
            },
            golden: {
                emoji: '\u{1FA99}',
                score: 50,
                lifeChange: 0,
                probability: 0.05,
                minFarmLevel: 2,
                isPowerup: false,
                className: 'golden-egg',
                name: '\u91D1\u86CB',
                color: '#FFD700'
            },
            surprise: {
                emoji: '\u{1F381}',
                score: 0,
                lifeChange: 0,
                probability: 0.03,
                minFarmLevel: 3,
                isPowerup: true,
                className: 'surprise-egg',
                name: '\u5F69\u86CB',
                color: '#9B59B6'
            },
            chick: {
                emoji: '\u{1F424}',
                score: 25,
                lifeChange: 0,
                probability: 0.02,
                minFarmLevel: 4,
                isPowerup: false,
                className: 'chick-egg',
                name: '\u5C0F\u9E21',
                color: '#FFD93D'
            },
            poop: {
                emoji: '\u{1F4A9}',
                score: -20,
                lifeChange: 0,
                probability: 0.15,
                minFarmLevel: 1,
                isPowerup: false,
                className: 'bad-egg',
                name: '\u7CAA\u4FBF',
                color: '#8B6914'
            },
            bomb: {
                emoji: '\u{1F4A3}',
                score: 0,
                lifeChange: -1,
                probability: 0.08,
                minFarmLevel: 1,
                isPowerup: false,
                className: 'bomb-egg',
                name: '\u70B8\u5F39',
                color: '#E74C3C'
            },
            heart: {
                emoji: '\u2764\uFE0F',
                score: 0,
                lifeChange: 1,
                probability: 0.02,
                minFarmLevel: 5,
                isPowerup: false,
                className: 'heart-egg',
                name: '\u7231\u5FC3',
                color: '#FF6B6B'
            }
        },

        POWERUP_TYPES: {
            speed: {
                emoji: '\u26A1',
                name: '\u6781\u901F\u79FB\u52A8',
                duration: 8000,
                color: '#3498DB',
                description: '\u7B50\u5B50\u901F\u5EA6+50%'
            },
            wide: {
                emoji: '\u{1F4CF}',
                name: '\u8D85\u5BBD\u7B50\u5B50',
                duration: 10000,
                color: '#2ECC71',
                description: '\u7B50\u5B50\u5BBD\u5EA6+50%'
            },
            magnet: {
                emoji: '\u{1F9F2}',
                name: '\u78C1\u529B\u5438\u9644',
                duration: 6000,
                color: '#E67E22',
                description: '\u9E21\u86CB\u81EA\u52A8\u5438\u5F15'
            },
            shield: {
                emoji: '\u{1F6E1}\uFE0F',
                name: '\u65E0\u654C\u62A4\u76FE',
                duration: 5000,
                color: '#9B59B6',
                description: '\u514D\u75AB\u8D1F\u9762\u6548\u679C'
            },
            slowmo: {
                emoji: '\u23F8\uFE0F',
                name: '\u65F6\u95F4\u51CF\u901F',
                duration: 7000,
                color: '#1ABC9C',
                description: '\u6389\u843D\u901F\u5EA6-50%'
            }
        },

        FARM_LEVELS: {
            1: {
                level: 1,
                name: '\u57FA\u7840\u9E21\u7A9D',
                cost: 0,
                henCount: 1,
                eggIntervalMultiplier: 1.0,
                unlockedItems: ['normal', 'poop', 'bomb']
            },
            2: {
                level: 2,
                name: '\u5347\u7EA7\u9E21\u7A9D',
                cost: 500,
                henCount: 1,
                eggIntervalMultiplier: 0.85,
                unlockedItems: ['normal', 'poop', 'bomb', 'golden']
            },
            3: {
                level: 3,
                name: '\u8C6A\u534E\u9E21\u7A9D',
                cost: 1500,
                henCount: 2,
                eggIntervalMultiplier: 0.75,
                unlockedItems: ['normal', 'poop', 'bomb', 'golden', 'surprise']
            },
            4: {
                level: 4,
                name: '\u9EC4\u91D1\u9E21\u7A9D',
                cost: 4000,
                henCount: 2,
                eggIntervalMultiplier: 0.70,
                unlockedItems: ['normal', 'poop', 'bomb', 'golden', 'surprise', 'chick']
            },
            5: {
                level: 5,
                name: '\u4F20\u8BF4\u9E21\u7A9D',
                cost: 10000,
                henCount: 3,
                eggIntervalMultiplier: 0.60,
                unlockedItems: ['normal', 'poop', 'bomb', 'golden', 'surprise', 'chick', 'heart']
            }
        },

        LEVELS: {
            1: {
                id: 1,
                name: '\u6625\u65E5\u519C\u573A',
                backgroundGradient: 'linear-gradient(180deg, #B0E0F0 0%, #87CEEB 35%, #A8D8A8 85%, #5CB85C 95%, #3E8E41 100%)',
                weather: 'sunny',
                dropSpeedModifier: 1.0,
                goldenEggBonus: 0,
                roofColor: '#8B4513',
                groundColor: '#5CB85C'
            },
            2: {
                id: 2,
                name: '\u590F\u65E5\u7267\u573A',
                backgroundGradient: 'linear-gradient(180deg, #FFE4B5 0%, #FFD700 20%, #87CEEB 50%, #7CCD7C 85%, #5CB85C 95%, #3E8E41 100%)',
                weather: 'windy',
                dropSpeedModifier: 1.0,
                goldenEggBonus: 0,
                windStrength: 0.8,
                roofColor: '#A0522D',
                groundColor: '#6B8E23'
            },
            3: {
                id: 3,
                name: '\u79CB\u65E5\u679C\u56ED',
                backgroundGradient: 'linear-gradient(180deg, #D4A574 0%, #CD853F 25%, #DAA520 50%, #B8860B 75%, #8B7355 90%, #6B5B3E 100%)',
                weather: 'rain',
                dropSpeedModifier: 1.0,
                goldenEggBonus: 0.02,
                roofColor: '#8B6914',
                groundColor: '#8B7355'
            },
            4: {
                id: 4,
                name: '\u51AC\u65E5\u96EA\u539F',
                backgroundGradient: 'linear-gradient(180deg, #E8E8E8 0%, #D0D0D0 30%, #B8C8D8 60%, #C8D8C8 85%, #E8E8E8 95%, #D0D0D0 100%)',
                weather: 'snow',
                dropSpeedModifier: 0.8,
                goldenEggBonus: 0,
                roofColor: '#696969',
                groundColor: '#E0E0E0'
            },
            5: {
                id: 5,
                name: '\u96F7\u7535\u519C\u573A',
                backgroundGradient: 'linear-gradient(180deg, #2C2C2C 0%, #3C3C3C 30%, #4A4A4A 60%, #5A5A5A 85%, #3C3C3C 95%, #2C2C2C 100%)',
                weather: 'lightning',
                dropSpeedModifier: 1.2,
                goldenEggBonus: 0.03,
                roofColor: '#2C2C2C',
                groundColor: '#3C3C3C'
            }
        },

        ACHIEVEMENTS: [
            { id: 'first_egg', name: '\u521D\u6B21\u63A5\u86CB', description: '\u63A5\u4F4F\u7B2C\u4E00\u4E2A\u9E21\u86CB', icon: '\u{1F95A}', condition: function (s) { return s.totalEggsCaught >= 1; } },
            { id: 'egg_100', name: '\u63A5\u86CB\u65B0\u624B', description: '\u7D2F\u8BA1\u63A5\u4F4F100\u4E2A\u9E21\u86CB', icon: '\u{1F423}', condition: function (s) { return s.totalEggsCaught >= 100; } },
            { id: 'egg_500', name: '\u63A5\u86CB\u9AD8\u624B', description: '\u7D2F\u8BA1\u63A5\u4F4F500\u4E2A\u9E21\u86CB', icon: '\u{1F425}', condition: function (s) { return s.totalEggsCaught >= 500; } },
            { id: 'egg_1000', name: '\u63A5\u86CB\u5927\u5E08', description: '\u7D2F\u8BA1\u63A5\u4F4F1000\u4E2A\u9E21\u86CB', icon: '\u{1F41F}', condition: function (s) { return s.totalEggsCaught >= 1000; } },
            { id: 'golden_1', name: '\u91D1\u86CB\u730E\u624B', description: '\u63A5\u4F4F\u7B2C\u4E00\u4E2A\u91D1\u86CB', icon: '\u{1FA99}', condition: function (s) { return s.goldenEggsCaught >= 1; } },
            { id: 'golden_10', name: '\u91D1\u86CB\u6536\u96C6\u5BB6', description: '\u7D2F\u8BA1\u63A5\u4F4F10\u4E2A\u91D1\u86CB', icon: '\u2728', condition: function (s) { return s.goldenEggsCaught >= 10; } },
            { id: 'score_500', name: '\u5C0F\u6709\u6210\u5C31', description: '\u5355\u5C40\u5F97\u5206500\u5206', icon: '\u{1F3C6}', condition: function (s) { return s.bestScore >= 500; } },
            { id: 'score_1000', name: '\u5343\u5206\u5927\u5173', description: '\u5355\u5C40\u5F97\u52061000\u5206', icon: '\u{1F31F}', condition: function (s) { return s.bestScore >= 1000; } },
            { id: 'score_2000', name: '\u4F20\u5947\u5F97\u5206', description: '\u5355\u5C40\u5F97\u52062000\u5206', icon: '\u{1F48E}', condition: function (s) { return s.bestScore >= 2000; } },
            { id: 'chick_1', name: '\u5C0F\u9E21\u6551\u661F', description: '\u63A5\u4F4F\u7B2C\u4E00\u53EA\u5C0F\u9E21', icon: '\u{1F424}', condition: function (s) { return s.chicksCaught >= 1; } },
            { id: 'use_powerup', name: '\u9053\u5177\u521D\u4F53\u9A8C', description: '\u4F7F\u7528\u7B2C\u4E00\u4E2A\u9053\u5177', icon: '\u{1F381}', condition: function (s) { return s.powerupsUsed >= 1; } },
            { id: 'farm_3', name: '\u5C0F\u5BCC\u519C\u573A', description: '\u5347\u7EA7\u519C\u573A\u5230\u7B49\u7EA73', icon: '\u{1F3E1}', condition: function (s) { return s.farmLevel >= 3; } },
            { id: 'farm_5', name: '\u4F20\u8BF4\u519C\u573A\u4E3B', description: '\u5347\u7EA7\u519C\u573A\u5230\u6700\u9AD8\u7B49\u7EA7', icon: '\u{1F451}', condition: function (s) { return s.farmLevel >= 5; } },
            { id: 'no_miss', name: '\u5B8C\u7F8E\u63A5\u86CB', description: '\u5355\u5C40\u65E0\u6389\u86CB\u5B8C\u6210\u6E38\u620F', icon: '\u{1F3C5}', condition: function (s) { return s.perfectGames >= 1; } },
            { id: 'coop_play', name: '\u53CC\u4EBA\u534F\u4F5C', description: '\u5B8C\u6210\u4E00\u5C40\u53CC\u4EBA\u6A21\u5F0F', icon: '\u{1F91D}', condition: function (s) { return s.coopGamesPlayed >= 1; } }
        ],

        DAILY_TASK_TEMPLATES: [
            { id: 'catch_30', description: '\u63A5\u4F4F30\u4E2A\u9E21\u86CB', target: 30, reward: 50, statKey: 'eggsThisSession' },
            { id: 'score_300', description: '\u5355\u5C40\u5F97\u5206\u8FBE\u5230300', target: 300, reward: 80, statKey: 'scoreThisGame' },
            { id: 'golden_3', description: '\u63A5\u4F4F3\u4E2A\u91D1\u86CB', target: 3, reward: 100, statKey: 'goldenThisSession' },
            { id: 'use_2_powerups', description: '\u4F7F\u75282\u4E2A\u9053\u5177', target: 2, reward: 60, statKey: 'powerupsThisSession' },
            { id: 'play_3', description: '\u6E38\u73A93\u5C40\u6E38\u620F', target: 3, reward: 40, statKey: 'gamesThisSession' },
            { id: 'catch_50', description: '\u63A5\u4F4F50\u4E2A\u9E21\u86CB', target: 50, reward: 80, statKey: 'eggsThisSession' },
            { id: 'score_500', description: '\u5355\u5C40\u5F97\u5206\u8FBE\u5230500', target: 500, reward: 120, statKey: 'scoreThisGame' },
            { id: 'no_miss_20', description: '\u8FDE\u7EED\u63A5\u4F4F20\u4E2A\u4E0D\u6389', target: 20, reward: 100, statKey: 'maxComboThisSession' }
        ],

        COLLECTION_ITEMS: [
            { id: 'normal', name: '\u767D\u86CB', emoji: '\u{1F95A}', description: '\u666E\u901A\u7684\u767D\u8272\u9E21\u86CB' },
            { id: 'brown', name: '\u68D5\u86CB', emoji: '\u{1F95A}', description: '\u68D5\u8272\u7684\u519C\u5BB6\u86CB', style: 'filter: hue-rotate(30deg);' },
            { id: 'golden', name: '\u91D1\u86CB', emoji: '\u{1FA99}', description: '\u95EA\u4EAE\u7684\u91D1\u8272\u9E21\u86CB' },
            { id: 'surprise', name: '\u5F69\u86CB', emoji: '\u{1F381}', description: '\u795E\u79D8\u7684\u5F69\u8272\u86CB' },
            { id: 'chick', name: '\u5C0F\u9E21\u86CB', emoji: '\u{1F424}', description: '\u5DF2\u5B75\u5316\u7684\u5C0F\u9E21' },
            { id: 'heart', name: '\u7231\u5FC3\u86CB', emoji: '\u2764\uFE0F', description: '\u5145\u6EE1\u7231\u7684\u7279\u6B8A\u86CB' },
            { id: 'poop', name: '\u7CAA\u4FBF', emoji: '\u{1F4A9}', description: '\u2026\u2026\u4E0D\u662F\u86CB' },
            { id: 'bomb', name: '\u70B8\u5F39', emoji: '\u{1F4A3}', description: '\u5371\u9669\u7684\u7206\u70B8\u7269' },
            { id: 'speed', name: '\u95EA\u7535\u9053\u5177', emoji: '\u26A1', description: '\u6781\u901F\u79FB\u52A8\u9053\u5177' },
            { id: 'shield', name: '\u62A4\u76FE\u9053\u5177', emoji: '\u{1F6E1}\uFE0F', description: '\u65E0\u654C\u62A4\u76FE\u9053\u5177' }
        ]
    };
})();
