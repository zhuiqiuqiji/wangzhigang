(function () {
    'use strict';

    // =========================================================================
    // 游戏常量配置
    // =========================================================================
    const TABLE = {
        left: 100,
        right: 500,
        top: 50,
        bottom: 750,
        netY: 400,
        width: 400,
        height: 700
    };

    const PADDLE = {
        width: 80,
        height: 12,
        playerY: 710,
        aiY: 90,
        minDistFromNet: 60
    };

    const BALL = {
        radius: 8,
        speedBase: 5,
        speedMax: 11,
        speedIncrement: 0.3
    };

    const WIN_SCORE = 11;
    const STAMINA_MAX = 100;
    const STAMINA_REGEN = 2;

    // 击球方式定义
    const SHOT_TYPES = {
        normal: { name: '普通', speed: 1.0, topspin: 0.3, backspin: 0, sidespin: 0, stamina: 0, arc: 1.0, short: false },
        smash: { name: '扣杀', speed: 1.6, topspin: 0.6, backspin: 0, sidespin: 0, stamina: 25, arc: 0.7, short: false },
        chop: { name: '削球', speed: 0.7, topspin: 0, backspin: 0.8, sidespin: 0, stamina: 10, arc: 1.2, short: false },
        lob: { name: '高吊', speed: 0.6, topspin: 0.2, backspin: 0, sidespin: 0, stamina: 5, arc: 1.8, short: false },
        push: { name: '搓球', speed: 0.5, topspin: 0, backspin: 0.4, sidespin: 0, stamina: 5, arc: 0.8, short: true }
    };

    // AI风格定义
    const AI_STYLES = {
        attack: {
            name: '进攻型',
            positionBias: 0.7,
            moveSpeed: 5.5,
            predictionError: 25,
            smashThreshold: 0.5,
            shotProbabilities: { normal: 0.3, smash: 0.4, chop: 0.1, lob: 0.1, push: 0.1 },
            mistakeRate: 0.08
        },
        defense: {
            name: '防守型',
            positionBias: 0.3,
            moveSpeed: 4.0,
            predictionError: 10,
            smashThreshold: 0.8,
            shotProbabilities: { normal: 0.4, smash: 0.1, chop: 0.3, lob: 0.1, push: 0.1 },
            mistakeRate: 0.02
        },
        chop: {
            name: '削球型',
            positionBias: 0.4,
            moveSpeed: 4.5,
            predictionError: 15,
            smashThreshold: 0.7,
            shotProbabilities: { normal: 0.2, smash: 0.1, chop: 0.5, lob: 0.1, push: 0.1 },
            mistakeRate: 0.04
        }
    };

    // 锦标赛选手
    const TOURNAMENT_PLAYERS = [
        { name: '你', isPlayer: true },
        { name: '王大力', style: 'attack', difficulty: 1.0 },
        { name: '张防守', style: 'defense', difficulty: 0.9 },
        { name: '李旋转', style: 'chop', difficulty: 1.0 },
        { name: '陈快攻', style: 'attack', difficulty: 1.1 },
        { name: '刘稳健', style: 'defense', difficulty: 1.0 },
        { name: '赵削球', style: 'chop', difficulty: 1.1 },
        { name: '孙全面', style: 'attack', difficulty: 1.2 }
    ];

    // =========================================================================
    // 画布和上下文
    // =========================================================================
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // =========================================================================
    // 全局状态管理
    // =========================================================================
    const state = {
        gameMode: 'quick',
        gameState: 'waiting',
        servingPlayer: 'player',
        serveCount: 0,
        playerScore: 0,
        aiScore: 0,
        rallyCount: 0,
        lastHitBy: null,
        winner: null,
        paused: false,
        viewMode: 'top',
        difficulty: 'normal',
        soundEnabled: true,
        replayEnabled: true,

        currentShot: 'normal',
        playerSpin: { topspin: 0, backspin: 0, sidespin: 0 },
        playerStamina: STAMINA_MAX,
        aiStamina: STAMINA_MAX,

        aiStyle: 'attack',

        ball: {
            x: W / 2,
            y: 700,
            vx: 0,
            vy: 0,
            active: false,
            speed: BALL.speedBase,
            topspin: 0,
            backspin: 0,
            sidespin: 0
        },

        playerPaddle: {
            x: W / 2 - PADDLE.width / 2,
            y: PADDLE.playerY,
            width: PADDLE.width,
            height: PADDLE.height
        },

        player2Paddle: {
            x: W / 2 - PADDLE.width / 2,
            y: PADDLE.aiY,
            width: PADDLE.width,
            height: PADDLE.height
        },

        aiPaddle: {
            x: W / 2 - PADDLE.width / 2,
            y: PADDLE.aiY,
            width: PADDLE.width,
            height: PADDLE.height,
            targetX: W / 2 - PADDLE.width / 2,
            targetY: PADDLE.aiY,
            aiUpdateTimer: 0
        },

        currentSide: 'player',
        bounceCount: 0,
        serveTimer: 0,
        pointPauseTimer: 0,
        flashEffect: { x: 0, y: 0, alpha: 0 },

        replay: {
            active: false,
            buffer: [],
            bufferIndex: 0,
            bufferSize: 300,
            playbackIndex: 0,
            playbackSpeed: 0.2,
            triggerReason: null,
            savedState: null
        },

        tournament: {
            active: false,
            players: [],
            groups: [[], []],
            groupStandings: [[], []],
            knockoutStage: [],
            currentMatchIndex: 0,
            currentRound: 'group',
            playerIndex: 0
        },

        network: {
            active: false,
            isHost: false,
            roomCode: null,
            channel: null,
            remoteInput: { left: false, right: false, up: false, down: false, shot: 'normal' },
            connected: false
        },

        keys: {},
        keys2: {},
        touchActive: false,
        touchX: 0,
        touchY: 0
    };

    // =========================================================================
    // 物理模块 - 旋转球系统
    // =========================================================================
    const Physics = {
        applySpinEffects(ball, dt) {
            if (!ball.active) return;

            if (ball.topspin > 0) {
                ball.vy += ball.topspin * 0.15;
            }
            if (ball.backspin > 0) {
                ball.vy -= ball.backspin * 0.12;
            }
            if (Math.abs(ball.sidespin) > 0) {
                ball.vx += ball.sidespin * 0.1;
            }

            const decay = 0.998;
            ball.topspin *= decay;
            ball.backspin *= decay;
            ball.sidespin *= decay;
        },

        applySpinOnBounce(ball, isTableBounce) {
            if (isTableBounce) {
                if (ball.topspin > 0.1) {
                    const speedBoost = 1 + ball.topspin * 0.3;
                    ball.vy *= speedBoost;
                    ball.vx *= speedBoost;
                    const angleReduction = 1 - ball.topspin * 0.2;
                    ball.vy *= angleReduction;
                }
                if (ball.backspin > 0.1) {
                    const speedReduction = 1 - ball.backspin * 0.25;
                    ball.vy *= speedReduction;
                    ball.vx *= speedReduction;
                    const angleIncrease = 1 + ball.backspin * 0.3;
                    ball.vy *= angleIncrease;
                }
                if (Math.abs(ball.sidespin) > 0.1) {
                    ball.vx += ball.sidespin * 2;
                }
            }
        },

        updateBall(ball) {
            if (!ball.active) return;

            ball.x += ball.vx;
            ball.y += ball.vy;

            this.applySpinEffects(ball, 1);

            if (ball.x - BALL.radius <= TABLE.left) {
                ball.x = TABLE.left + BALL.radius;
                ball.vx = Math.abs(ball.vx);
                this.applySpinOnBounce(ball, true);
                createFlash(ball.x, ball.y);
            }
            if (ball.x + BALL.radius >= TABLE.right) {
                ball.x = TABLE.right - BALL.radius;
                ball.vx = -Math.abs(ball.vx);
                this.applySpinOnBounce(ball, true);
                createFlash(ball.x, ball.y);
            }

            if (ball.y - BALL.radius <= TABLE.top) {
                ball.y = TABLE.top + BALL.radius;
                ball.vy = Math.abs(ball.vy);
                this.applySpinOnBounce(ball, true);
                createFlash(ball.x, ball.y);
            }
            if (ball.y + BALL.radius >= TABLE.bottom) {
                ball.y = TABLE.bottom - BALL.radius;
                ball.vy = -Math.abs(ball.vy);
                this.applySpinOnBounce(ball, true);
                createFlash(ball.x, ball.y);
            }
        }
    };

    // =========================================================================
    // 击球系统
    // =========================================================================
    const ShotSystem = {
        calculateHitAngle(ball, paddle, shotType, playerSpin) {
            const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
            const clampedHitPos = Math.max(-1, Math.min(1, hitPos));

            const shot = SHOT_TYPES[shotType];
            let baseAngle = clampedHitPos * (Math.PI / 3);
            baseAngle *= shot.arc;

            return baseAngle;
        },

        applyShot(ball, paddle, shotType, playerSpin, isPlayer) {
            const shot = SHOT_TYPES[shotType];
            const angle = this.calculateHitAngle(ball, paddle, shotType, playerSpin);

            let finalSpeed = ball.speed * shot.speed;
            finalSpeed = Math.min(BALL.speedMax, finalSpeed);

            if (isPlayer) {
                ball.vx = finalSpeed * Math.sin(angle);
                ball.vy = -finalSpeed * Math.cos(angle);
                ball.y = paddle.y - BALL.radius;
            } else {
                ball.vx = finalSpeed * Math.sin(angle);
                ball.vy = finalSpeed * Math.cos(angle);
                ball.y = paddle.y + paddle.height + BALL.radius;
            }

            ball.speed = finalSpeed;
            ball.topspin = shot.topspin + playerSpin.topspin * 0.5;
            ball.backspin = shot.backspin + playerSpin.backspin * 0.5;
            ball.sidespin = playerSpin.sidespin * 0.8;

            if (shot.short) {
                ball.vx *= 0.6;
                ball.vy *= 0.6;
            }

            Physics.applySpinOnBounce(ball, false);
        },

        canUseShot(shotType, stamina) {
            const shot = SHOT_TYPES[shotType];
            return stamina >= shot.stamina;
        },

        consumeStamina(shotType, isPlayer) {
            const shot = SHOT_TYPES[shotType];
            if (isPlayer) {
                state.playerStamina = Math.max(0, state.playerStamina - shot.stamina);
            } else {
                state.aiStamina = Math.max(0, state.aiStamina - shot.stamina);
            }
        }
    };

    // =========================================================================
    // AI模块
    // =========================================================================
    const AIModule = {
        chooseShot(ball, paddle, style, stamina) {
            const aiStyle = AI_STYLES[style];
            const probs = aiStyle.shotProbabilities;

            if (Math.random() < aiStyle.mistakeRate) {
                return 'normal';
            }

            const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            const isSmashOpportunity = ballSpeed > 6 && ball.y > TABLE.netY + 100;

            let availableShots = Object.keys(probs).filter(s => ShotSystem.canUseShot(s, stamina));

            if (isSmashOpportunity && Math.random() < aiStyle.smashThreshold) {
                if (availableShots.includes('smash')) return 'smash';
            }

            const rand = Math.random();
            let cumulative = 0;
            for (const shot of availableShots) {
                cumulative += probs[shot];
                if (rand < cumulative) return shot;
            }

            return 'normal';
        },

        predictBallPosition(ball, paddle, style) {
            const aiStyle = AI_STYLES[style];
            const error = aiStyle.predictionError;

            let timeToReach = Math.abs((paddle.y + paddle.height) - ball.y) / Math.abs(ball.vy || 1);
            let predictedX = ball.x + ball.vx * timeToReach * 0.8;

            predictedX += (Math.random() - 0.5) * error;

            let bounceLeft = 0;
            while (predictedX < TABLE.left + 10 || predictedX > TABLE.right - 10) {
                if (predictedX < TABLE.left + 10) {
                    predictedX = TABLE.left + 10 + (TABLE.left + 10 - predictedX);
                    bounceLeft++;
                }
                if (predictedX > TABLE.right - 10) {
                    predictedX = TABLE.right - 10 - (predictedX - (TABLE.right - 10));
                    bounceLeft++;
                }
            }

            return predictedX - PADDLE.width / 2;
        },

        update(ball, paddle, style) {
            const aiStyle = AI_STYLES[style];

            paddle.aiUpdateTimer++;
            if (paddle.aiUpdateTimer > 6) {
                paddle.aiUpdateTimer = 0;

                if (ball.active && ball.vy < 0) {
                    paddle.targetX = this.predictBallPosition(ball, paddle, style);

                    const idealY = TABLE.netY - PADDLE.minDistFromNet - aiStyle.positionBias * 50;
                    paddle.targetY = Math.max(TABLE.top + 10, idealY);
                } else if (ball.active && ball.vy > 0) {
                    paddle.targetX += (W / 2 - PADDLE.width / 2 - paddle.targetX) * 0.1;
                    paddle.targetY = PADDLE.aiY + (1 - aiStyle.positionBias) * 30;
                } else {
                    paddle.targetX = W / 2 - PADDLE.width / 2 + (Math.random() - 0.5) * 60;
                    paddle.targetY = PADDLE.aiY;
                }
            }

            const diffX = paddle.targetX - paddle.x;
            if (Math.abs(diffX) > aiStyle.moveSpeed) {
                paddle.x += Math.sign(diffX) * aiStyle.moveSpeed;
            } else {
                paddle.x = paddle.targetX;
            }

            const diffY = paddle.targetY - paddle.y;
            const moveY = aiStyle.moveSpeed * 0.5;
            if (Math.abs(diffY) > moveY) {
                paddle.y += Math.sign(diffY) * moveY;
            } else {
                paddle.y = paddle.targetY;
            }

            paddle.x = Math.max(TABLE.left + 10, Math.min(TABLE.right - PADDLE.width - 10, paddle.x));
            paddle.y = Math.max(TABLE.top + 10, Math.min(TABLE.netY - PADDLE.minDistFromNet, paddle.y));
        }
    };

    // =========================================================================
    // 锦标赛模块
    // =========================================================================
    const Tournament = {
        init() {
            state.tournament.players = [...TOURNAMENT_PLAYERS];
            state.tournament.playerIndex = 0;

            const shuffled = [...TOURNAMENT_PLAYERS].sort(() => Math.random() - 0.5);
            state.tournament.groups[0] = shuffled.slice(0, 4);
            state.tournament.groups[1] = shuffled.slice(4, 8);

            for (let g = 0; g < 2; g++) {
                state.tournament.groupStandings[g] = state.tournament.groups[g].map((p, i) => ({
                    player: p,
                    index: i,
                    wins: 0,
                    losses: 0,
                    pointsFor: 0,
                    pointsAgainst: 0
                }));
            }

            state.tournament.currentMatchIndex = 0;
            state.tournament.currentRound = 'group';
            state.tournament.active = true;

            this.generateGroupMatches();
            this.updateBracketUI();
        },

        generateGroupMatches() {
            state.tournament.groupMatches = [[], []];
            for (let g = 0; g < 2; g++) {
                const group = state.tournament.groups[g];
                for (let i = 0; i < group.length; i++) {
                    for (let j = i + 1; j < group.length; j++) {
                        state.tournament.groupMatches[g].push({
                            player1: { ...group[i], score: 0 },
                            player2: { ...group[j], score: 0 },
                            completed: false,
                            groupIndex: g
                        });
                    }
                }
            }

            state.tournament.allMatches = [
                ...state.tournament.groupMatches[0],
                ...state.tournament.groupMatches[1]
            ];
        },

        getCurrentMatch() {
            if (state.tournament.currentRound === 'group') {
                return state.tournament.allMatches[state.tournament.currentMatchIndex];
            } else {
                return state.tournament.knockoutStage[state.tournament.currentMatchIndex];
            }
        },

        isPlayerMatch() {
            const match = this.getCurrentMatch();
            return match && (match.player1.name === '你' || match.player2.name === '你');
        },

        getPlayerOpponent() {
            const match = this.getCurrentMatch();
            if (!match) return null;
            return match.player1.name === '你' ? match.player2 : match.player1;
        },

        recordMatchResult(player1Score, player2Score) {
            const match = this.getCurrentMatch();
            match.player1.score = player1Score;
            match.player2.score = player2Score;
            match.completed = true;

            const winner = player1Score > player2Score ? match.player1 : match.player2;
            const loser = player1Score > player2Score ? match.player2 : match.player1;

            if (state.tournament.currentRound === 'group') {
                for (let g = 0; g < 2; g++) {
                    const standings = state.tournament.groupStandings[g];
                    const w = standings.find(s => s.player.name === winner.name);
                    const l = standings.find(s => s.player.name === loser.name);
                    if (w && l) {
                        w.wins++;
                        w.pointsFor += Math.max(player1Score, player2Score);
                        w.pointsAgainst += Math.min(player1Score, player2Score);
                        l.losses++;
                        l.pointsFor += Math.min(player1Score, player2Score);
                        l.pointsAgainst += Math.max(player1Score, player2Score);
                    }
                }
            }

            this.updateBracketUI();
        },

        advanceToNextMatch() {
            state.tournament.currentMatchIndex++;

            if (state.tournament.currentRound === 'group') {
                const groupMatches = state.tournament.groupMatches[0].length + state.tournament.groupMatches[1].length;
                if (state.tournament.currentMatchIndex >= groupMatches) {
                    this.startKnockoutStage();
                    return;
                }
            } else {
                if (state.tournament.currentMatchIndex >= state.tournament.knockoutStage.length) {
                    state.tournament.currentRound = 'finished';
                    return;
                }
            }
        },

        startKnockoutStage() {
            const qualifiers = [];
            for (let g = 0; g < 2; g++) {
                const sorted = [...state.tournament.groupStandings[g]].sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
                });
                qualifiers.push(sorted[0].player);
                qualifiers.push(sorted[1].player);
            }

            state.tournament.knockoutStage = [
                { player1: { ...qualifiers[0], score: 0 }, player2: { ...qualifiers[3], score: 0 }, completed: false, round: 'semifinal' },
                { player1: { ...qualifiers[1], score: 0 }, player2: { ...qualifiers[2], score: 0 }, completed: false, round: 'semifinal' },
                { player1: { name: '待定', score: 0 }, player2: { name: '待定', score: 0 }, completed: false, round: 'final' }
            ];

            state.tournament.currentRound = 'knockout';
            state.tournament.currentMatchIndex = 0;
            this.updateBracketUI();
        },

        checkPlayerEliminated() {
            if (state.tournament.currentRound === 'group') {
                for (let g = 0; g < 2; g++) {
                    const playerStanding = state.tournament.groupStandings[g].find(s => s.player.name === '你');
                    if (playerStanding && playerStanding.losses >= 2) {
                        return true;
                    }
                }
            } else if (state.tournament.currentRound === 'knockout') {
                const match = state.tournament.knockoutStage[state.tournament.currentMatchIndex];
                if (match && match.completed) {
                    const playerWon = (match.player1.name === '你' && match.player1.score > match.player2.score) ||
                                     (match.player2.name === '你' && match.player2.score > match.player1.score);
                    return !playerWon;
                }
            }
            return false;
        },

        updateBracketUI() {
            const container = document.getElementById('bracketContainer');
            if (!container) return;

            let html = '';

            html += '<div class="bracket-round">小组赛 A组</div>';
            state.tournament.groupMatches[0].forEach((m, i) => {
                html += this.renderMatch(m);
            });

            html += '<div class="bracket-round" style="margin-top: 8px;">小组赛 B组</div>';
            state.tournament.groupMatches[1].forEach((m, i) => {
                html += this.renderMatch(m);
            });

            if (state.tournament.currentRound !== 'group' || state.tournament.knockoutStage.length > 0) {
                html += '<div class="bracket-round" style="margin-top: 12px;">半决赛</div>';
                for (let i = 0; i < 2; i++) {
                    if (state.tournament.knockoutStage[i]) {
                        html += this.renderMatch(state.tournament.knockoutStage[i]);
                    }
                }

                html += '<div class="bracket-round" style="margin-top: 12px;">决赛</div>';
                if (state.tournament.knockoutStage[2]) {
                    html += this.renderMatch(state.tournament.knockoutStage[2]);
                }
            }

            container.innerHTML = html;
        },

        renderMatch(match) {
            const isActive = !match.completed && this.getCurrentMatch() === match;
            const isPlayerMatch = match.player1.name === '你' || match.player2.name === '你';
            let classes = 'bracket-match';
            if (isActive) classes += ' active';
            if (match.completed) classes += ' completed';

            const p1Class = match.player1.name === '你' ? 'bracket-name you' : 'bracket-name';
            const p2Class = match.player2.name === '你' ? 'bracket-name you' : 'bracket-name';

            return `
                <div class="${classes}">
                    <div>
                        <span class="${p1Class}">${match.player1.name}</span>
                        <span class="bracket-score">${match.completed ? match.player1.score : '-'}</span>
                    </div>
                    <div style="margin: 0 8px; color: rgba(255,255,255,0.3);">vs</div>
                    <div>
                        <span class="bracket-score">${match.completed ? match.player2.score : '-'}</span>
                        <span class="${p2Class}">${match.player2.name}</span>
                    </div>
                </div>
            `;
        }
    };

    // =========================================================================
    // 回放系统
    // =========================================================================
    const ReplaySystem = {
        recordFrame() {
            if (state.replay.active) return;

            const frame = {
                ball: { ...state.ball },
                playerPaddle: { ...state.playerPaddle },
                aiPaddle: { ...state.aiPaddle },
                player2Paddle: { ...state.player2Paddle },
                playerScore: state.playerScore,
                aiScore: state.aiScore,
                rallyCount: state.rallyCount,
                flashEffect: { ...state.flashEffect }
            };

            state.replay.buffer[state.replay.bufferIndex] = frame;
            state.replay.bufferIndex = (state.replay.bufferIndex + 1) % state.replay.bufferSize;
        },

        checkForReplayTrigger(winner, isSmash) {
            if (!state.replayEnabled) return false;
            if (state.replay.active) return false;

            let trigger = false;
            let reason = '';

            if (isSmash && winner === 'player') {
                trigger = true;
                reason = '精彩扣杀！';
            } else if (state.rallyCount >= 10) {
                trigger = true;
                reason = `多拍回合 (${state.rallyCount}拍)！`;
            } else if (this.isComebackPoint(winner)) {
                trigger = true;
                reason = '逆转赛点！';
            }

            if (trigger) {
                this.startReplay(reason, winner);
            }

            return trigger;
        },

        isComebackPoint(winner) {
            const playerScore = winner === 'player' ? state.playerScore : state.aiScore;
            const opponentScore = winner === 'player' ? state.aiScore : state.playerScore;

            if (playerScore >= WIN_SCORE - 1 && opponentScore >= WIN_SCORE - 1) {
                return playerScore > opponentScore;
            }
            return false;
        },

        startReplay(reason, winner) {
            state.replay.savedState = {
                gameState: state.gameState,
                playerScore: state.playerScore,
                aiScore: state.aiScore,
                servingPlayer: state.servingPlayer,
                serveCount: state.serveCount,
                rallyCount: state.rallyCount,
                lastHitBy: state.lastHitBy,
                currentSide: state.currentSide,
                ball: { ...state.ball },
                playerPaddle: { ...state.playerPaddle },
                aiPaddle: { ...state.aiPaddle },
                player2Paddle: { ...state.player2Paddle },
                winner: winner
            };

            state.replay.active = true;
            state.replay.triggerReason = reason;
            state.replay.playbackIndex = (state.replay.bufferIndex - 120 + state.replay.bufferSize) % state.replay.bufferSize;

            document.getElementById('replayIndicator').classList.add('active');
            document.getElementById('replayIndicator').querySelector('.replay-text').textContent = `精彩回放: ${reason}`;
        },

        update() {
            if (!state.replay.active) return;

            state.replay.playbackIndex = (state.replay.playbackIndex + 1) % state.replay.bufferSize;

            const frame = state.replay.buffer[state.replay.playbackIndex];
            if (frame) {
                Object.assign(state.ball, frame.ball);
                Object.assign(state.playerPaddle, frame.playerPaddle);
                Object.assign(state.aiPaddle, frame.aiPaddle);
                Object.assign(state.player2Paddle, frame.player2Paddle);
                Object.assign(state.flashEffect, frame.flashEffect);
            }

            if (state.replay.playbackIndex === (state.replay.bufferIndex - 1 + state.replay.bufferSize) % state.replay.bufferSize) {
                this.endReplay();
            }
        },

        endReplay() {
            state.replay.active = false;
            document.getElementById('replayIndicator').classList.remove('active');

            if (state.replay.savedState) {
                const saved = state.replay.savedState;

                state.ball.active = false;
                state.rallyCount = 0;
                state.lastHitBy = saved.lastHitBy;
                state.currentSide = saved.currentSide;

                scorePoint(saved.winner);
            }
        }
    };

    // =========================================================================
    // 网络模块
    // =========================================================================
    const Network = {
        createRoom() {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            state.network.roomCode = code;
            state.network.isHost = true;
            state.network.active = true;

            try {
                state.network.channel = new BroadcastChannel(`pingpong_${code}`);
                this.setupChannelHandlers();

                document.getElementById('roomInfo').style.display = 'block';
                document.getElementById('roomCode').textContent = code;
                document.getElementById('joinRoom').style.display = 'none';

                setTimeout(() => {
                    state.network.connected = true;
                    state.gameMode = 'online';
                    startGame();
                    hideNetworkPanel();
                }, 1000);
            } catch (e) {
                console.error('创建房间失败:', e);
                alert('创建房间失败，请刷新页面重试');
            }
        },

        joinRoom(code) {
            if (!code || code.length !== 6) {
                alert('请输入有效的6位房间号');
                return;
            }

            state.network.roomCode = code;
            state.network.isHost = false;
            state.network.active = true;

            try {
                state.network.channel = new BroadcastChannel(`pingpong_${code}`);
                this.setupChannelHandlers();

                state.network.channel.postMessage({
                    type: 'join',
                    timestamp: Date.now()
                });

                setTimeout(() => {
                    if (state.network.connected) {
                        state.gameMode = 'online';
                        startGame();
                        hideNetworkPanel();
                    } else {
                        alert('未找到房间，请确认房间号');
                        this.close();
                    }
                }, 3000);
            } catch (e) {
                console.error('加入房间失败:', e);
                alert('加入房间失败，请刷新页面重试');
            }
        },

        setupChannelHandlers() {
            state.network.channel.onmessage = (e) => {
                const data = e.data;

                switch (data.type) {
                    case 'join':
                        if (state.network.isHost && !state.network.connected) {
                            state.network.connected = true;
                            state.network.channel.postMessage({ type: 'welcome' });
                        }
                        break;
                    case 'welcome':
                        if (!state.network.isHost) {
                            state.network.connected = true;
                        }
                        break;
                    case 'input':
                        if (state.network.isHost) {
                            state.network.remoteInput = data.input;
                        }
                        break;
                    case 'state':
                        if (!state.network.isHost) {
                            this.syncState(data.state);
                        }
                        break;
                }
            };
        },

        sendInput() {
            if (!state.network.active || state.network.isHost) return;

            state.network.channel.postMessage({
                type: 'input',
                input: {
                    left: state.keys['ArrowLeft'] || state.keys['KeyA'],
                    right: state.keys['ArrowRight'] || state.keys['KeyD'],
                    up: state.keys['ArrowUp'] || state.keys['KeyW'],
                    down: state.keys['ArrowDown'] || state.keys['KeyS'],
                    shot: state.currentShot
                }
            });
        },

        sendState() {
            if (!state.network.active || !state.network.isHost) return;

            state.network.channel.postMessage({
                type: 'state',
                state: {
                    ball: state.ball,
                    playerPaddle: state.playerPaddle,
                    aiPaddle: state.aiPaddle,
                    playerScore: state.playerScore,
                    aiScore: state.aiScore,
                    gameState: state.gameState,
                    servingPlayer: state.servingPlayer
                }
            });
        },

        syncState(remoteState) {
            Object.assign(state.ball, remoteState.ball);
            Object.assign(state.playerPaddle, remoteState.playerPaddle);
            Object.assign(state.aiPaddle, remoteState.aiPaddle);
            state.playerScore = remoteState.playerScore;
            state.aiScore = remoteState.aiScore;
            state.gameState = remoteState.gameState;
            state.servingPlayer = remoteState.servingPlayer;
        },

        close() {
            if (state.network.channel) {
                state.network.channel.close();
                state.network.channel = null;
            }
            state.network.active = false;
            state.network.isHost = false;
            state.network.roomCode = null;
            state.network.connected = false;
        }
    };

    // =========================================================================
    // 游戏核心逻辑
    // =========================================================================
    function resetBall() {
        state.ball.active = false;
        state.ball.speed = BALL.speedBase;
        state.ball.topspin = 0;
        state.ball.backspin = 0;
        state.ball.sidespin = 0;
        state.bounceCount = 0;
        state.lastHitBy = null;
        state.flashEffect.alpha = 0;
        state.serveTimer = 0;
        state.rallyCount = 0;

        if (state.servingPlayer === 'player') {
            state.ball.x = state.playerPaddle.x + PADDLE.width / 2;
            state.ball.y = state.playerPaddle.y - 20;
            state.currentSide = 'player';
        } else {
            state.ball.x = state.aiPaddle.x + PADDLE.width / 2;
            state.ball.y = state.aiPaddle.y + 20;
            state.currentSide = 'ai';
        }

        state.ball.vx = 0;
        state.ball.vy = 0;
    }

    function serve() {
        if (state.servingPlayer === 'player') {
            state.ball.active = true;
            state.ball.speed = BALL.speedBase;
            state.ball.vx = (Math.random() - 0.5) * 2;
            state.ball.vy = -state.ball.speed;
            state.lastHitBy = 'player';
            state.bounceCount = 0;
            state.gameState = 'playing';
            state.serveTimer = 0;
        }
    }

    function aiServe() {
        state.ball.active = true;
        state.ball.speed = BALL.speedBase;
        state.ball.vx = (Math.random() - 0.5) * 2;
        state.ball.vy = state.ball.speed;
        state.lastHitBy = 'ai';
        state.bounceCount = 0;
        state.gameState = 'playing';
    }

    function startGame() {
        hideOverlay();
        state.gameState = 'serving';
        state.servingPlayer = 'player';
        state.serveCount = 0;
        state.playerScore = 0;
        state.aiScore = 0;
        state.playerStamina = STAMINA_MAX;
        state.aiStamina = STAMINA_MAX;
        state.winner = null;
        resetBall();
        updateUI();
    }

    function resetGame() {
        state.playerScore = 0;
        state.aiScore = 0;
        state.winner = null;
        state.serveCount = 0;
        state.playerStamina = STAMINA_MAX;
        state.aiStamina = STAMINA_MAX;
        state.rallyCount = 0;
        updateScoreDisplay();
        startGame();
    }

    function nextPoint() {
        state.gameState = 'serving';
        state.pointPauseTimer = 0;
        resetBall();
        updateServeIndicator();
    }

    function checkNetCollision() {
        const ball = state.ball;
        if (ball.vy < 0 && ball.y - BALL.radius < TABLE.netY && ball.y - BALL.radius > TABLE.netY - 8) {
            if (state.currentSide === 'player' && ball.vy < 0) {
                state.currentSide = 'ai';
                state.bounceCount = 0;
            }
        }
        if (ball.vy > 0 && ball.y + BALL.radius > TABLE.netY && ball.y + BALL.radius < TABLE.netY + 8) {
            if (state.currentSide === 'ai' && ball.vy > 0) {
                state.currentSide = 'player';
                state.bounceCount = 0;
            }
        }
    }

    function checkPaddleCollision() {
        const ball = state.ball;
        const playerPaddle = state.playerPaddle;
        const aiPaddle = state.aiPaddle;
        const player2Paddle = state.player2Paddle;

        if (ball.vy > 0 && state.currentSide === 'player') {
            const hitPaddle = state.gameMode === 'local2p' ? player2Paddle : playerPaddle;
            const paddleY = state.gameMode === 'local2p' ? PADDLE.aiY : PADDLE.playerY;
            const isPlayer = state.gameMode !== 'local2p';

            if (ball.y + BALL.radius >= hitPaddle.y &&
                ball.y + BALL.radius <= hitPaddle.y + hitPaddle.height + 4 &&
                ball.x >= hitPaddle.x - BALL.radius &&
                ball.x <= hitPaddle.x + hitPaddle.width + BALL.radius) {

                let shotType = isPlayer ? state.currentShot : state.currentShot;
                let spin = isPlayer ? state.playerSpin : { topspin: 0, backspin: 0, sidespin: 0 };

                if (!isPlayer && state.gameMode !== 'local2p') {
                    shotType = AIModule.chooseShot(ball, aiPaddle, state.aiStyle, state.aiStamina);
                    spin = { topspin: SHOT_TYPES[shotType].topspin, backspin: SHOT_TYPES[shotType].backspin, sidespin: 0 };
                }

                if (state.gameMode === 'local2p') {
                    spin = { topspin: 0, backspin: 0, sidespin: 0 };
                }

                if (!ShotSystem.canUseShot(shotType, isPlayer ? state.playerStamina : state.aiStamina)) {
                    shotType = 'normal';
                }

                const hitPos = (ball.x - (hitPaddle.x + hitPaddle.width / 2)) / (hitPaddle.width / 2);
                const clampedHitPos = Math.max(-1, Math.min(1, hitPos));
                ball.speed = Math.min(BALL.speedMax, ball.speed + BALL.speedIncrement);

                ShotSystem.applyShot(ball, hitPaddle, shotType, spin, isPlayer);
                ShotSystem.consumeStamina(shotType, isPlayer);

                state.lastHitBy = isPlayer ? 'player' : 'ai';
                state.bounceCount = 0;
                state.rallyCount++;
                createFlash(ball.x, ball.y);

                state.playerSpin = { topspin: 0, backspin: 0, sidespin: 0 };
                updateSpinBars();
            }
        }

        if (ball.vy < 0 && state.currentSide === 'ai') {
            const hitPaddle = state.gameMode === 'local2p' ? playerPaddle : aiPaddle;
            const isPlayer = state.gameMode === 'local2p';

            if (ball.y - BALL.radius <= hitPaddle.y + hitPaddle.height &&
                ball.y - BALL.radius >= hitPaddle.y - 4 &&
                ball.x >= hitPaddle.x - BALL.radius &&
                ball.x <= hitPaddle.x + hitPaddle.width + BALL.radius) {

                let shotType;
                let spin;

                if (state.gameMode === 'local2p') {
                    shotType = state.currentShot;
                    spin = state.playerSpin;
                } else {
                    shotType = AIModule.chooseShot(ball, aiPaddle, state.aiStyle, state.aiStamina);
                    spin = { topspin: SHOT_TYPES[shotType].topspin, backspin: SHOT_TYPES[shotType].backspin, sidespin: 0 };
                }

                if (!ShotSystem.canUseShot(shotType, isPlayer ? state.playerStamina : state.aiStamina)) {
                    shotType = 'normal';
                }

                ball.speed = Math.min(BALL.speedMax, ball.speed + BALL.speedIncrement);
                ShotSystem.applyShot(ball, hitPaddle, shotType, spin, false);
                ShotSystem.consumeStamina(shotType, isPlayer);

                state.lastHitBy = isPlayer ? 'player' : 'ai';
                state.bounceCount = 0;
                state.rallyCount++;
                createFlash(ball.x, ball.y);

                if (isPlayer) {
                    state.playerSpin = { topspin: 0, backspin: 0, sidespin: 0 };
                    updateSpinBars();
                }
            }
        }
    }

    function checkScoring() {
        const ball = state.ball;

        if (ball.active && ball.vy > 0 && state.currentSide === 'player' &&
            ball.y > TABLE.netY + 10 && state.lastHitBy === 'player') {
            state.currentSide = 'ai';
            state.bounceCount = 0;
        }
        if (ball.active && ball.vy < 0 && state.currentSide === 'ai' &&
            ball.y < TABLE.netY - 10 && state.lastHitBy === 'ai') {
            state.currentSide = 'player';
            state.bounceCount = 0;
        }

        let winner = null;
        let isSmash = state.currentShot === 'smash';

        if (ball.y > TABLE.bottom + 50) {
            if (state.lastHitBy === 'ai') {
                winner = 'player';
            } else if (state.lastHitBy === 'player') {
                winner = 'ai';
            } else {
                winner = state.servingPlayer === 'player' ? 'ai' : 'player';
            }
        }

        if (ball.y < TABLE.top - 50) {
            if (state.lastHitBy === 'player') {
                winner = 'ai';
            } else if (state.lastHitBy === 'ai') {
                winner = 'player';
            } else {
                winner = state.servingPlayer === 'ai' ? 'player' : 'ai';
            }
        }

        if (ball.x < TABLE.left - 60 || ball.x > TABLE.right + 60) {
            if (state.lastHitBy === 'player') {
                winner = 'ai';
            } else if (state.lastHitBy === 'ai') {
                winner = 'player';
            } else {
                winner = state.servingPlayer === 'player' ? 'ai' : 'player';
            }
        }

        if (winner) {
            let replayTriggered = false;
            if (state.replayEnabled && state.gameState !== 'pointScored' && !state.replay.active) {
                replayTriggered = ReplaySystem.checkForReplayTrigger(winner, isSmash);
            }
            if (!replayTriggered) {
                scorePoint(winner);
            }
        }
    }

    function scorePoint(winner) {
        state.gameState = 'pointScored';
        state.pointPauseTimer = 60;
        state.ball.active = false;

        if (winner === 'player') {
            state.playerScore++;
        } else {
            state.aiScore++;
        }
        updateScoreDisplay();

        state.serveCount++;
        if (state.serveCount >= 2) {
            state.serveCount = 0;
            state.servingPlayer = (state.servingPlayer === 'player') ? 'ai' : 'player';
        }

        if (state.playerScore >= WIN_SCORE || state.aiScore >= WIN_SCORE) {
            const diff = Math.abs(state.playerScore - state.aiScore);
            if (diff >= 2) {
                state.gameState = 'gameOver';
                state.winner = (state.playerScore > state.aiScore) ? 'player' : 'ai';

                if (state.tournament.active) {
                    const match = Tournament.getCurrentMatch();
                    if (match) {
                        const p1Score = match.player1.name === '你' ? state.playerScore : state.aiScore;
                        const p2Score = match.player1.name === '你' ? state.aiScore : state.playerScore;
                        Tournament.recordMatchResult(p1Score, p2Score);

                        if (Tournament.checkPlayerEliminated() || state.tournament.currentRound === 'finished') {
                            const title = state.winner === 'player' ? '🏆 锦标赛结束！' : '😔 你被淘汰了';
                            const msg = state.winner === 'player' ?
                                `恭喜你获得锦标赛冠军！比分 ${state.playerScore} : ${state.aiScore}` :
                                `你在比赛中被淘汰，最终比分 ${state.playerScore} : ${state.aiScore}`;
                            showOverlay(title, msg);
                            state.tournament.active = false;
                            return;
                        }

                        Tournament.advanceToNextMatch();

                        if (Tournament.isPlayerMatch()) {
                            const opponent = Tournament.getPlayerOpponent();
                            showOverlay('下一场比赛', `你的对手是：${opponent.name}\n按 空格键 继续`);
                            state.aiStyle = opponent.style || 'attack';
                            updateAIStyleButtons();
                        } else {
                            simulateAIvsAI();
                            return;
                        }
                    }
                } else {
                    const winTitle = state.winner === 'player' ? '🎉 你赢了！' : '😔 电脑获胜';
                    const winMsg = `比分 ${state.playerScore} : ${state.aiScore}，按 空格键 重新开始`;
                    showOverlay(winTitle, winMsg);
                }
                return;
            }
        }

        setTimeout(function () {
            if (state.gameState === 'pointScored') {
                nextPoint();
            }
        }, 800);
    }

    function simulateAIvsAI() {
        const match = Tournament.getCurrentMatch();
        if (!match) return;

        setTimeout(() => {
            const p1 = match.player1;
            const p2 = match.player2;
            const p1Score = Math.floor(Math.random() * 4) + 9;
            let p2Score = p1Score - (Math.random() > 0.5 ? 1 : 2);
            if (p2Score < 0) p2Score = 0;

            Tournament.recordMatchResult(p1Score, p2Score);
            Tournament.advanceToNextMatch();

            if (state.tournament.currentRound === 'finished') {
                showOverlay('锦标赛结束', '锦标赛已结束，按 空格键 返回菜单');
                state.tournament.active = false;
                return;
            }

            if (Tournament.isPlayerMatch()) {
                const opponent = Tournament.getPlayerOpponent();
                showOverlay('下一场比赛', `你的对手是：${opponent.name}\n按 空格键 继续`);
                state.aiStyle = opponent.style || 'attack';
                updateAIStyleButtons();
            } else {
                simulateAIvsAI();
            }
        }, 1000);
    }

    function createFlash(x, y) {
        state.flashEffect.x = x;
        state.flashEffect.y = y;
        state.flashEffect.alpha = 1;
    }

    // =========================================================================
    // 更新函数
    // =========================================================================
    let lastTime = 0;
    let staminaTimer = 0;

    function update(currentTime) {
        if (state.paused) return;
        if (state.replay.active) {
            ReplaySystem.update();
            return;
        }

        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        staminaTimer += deltaTime;
        if (staminaTimer >= 1) {
            staminaTimer = 0;
            state.playerStamina = Math.min(STAMINA_MAX, state.playerStamina + STAMINA_REGEN);
            state.aiStamina = Math.min(STAMINA_MAX, state.aiStamina + STAMINA_REGEN);
            updateStaminaBars();
            updateShotButtons();
        }

        if (state.gameState === 'waiting' || state.gameState === 'gameOver') return;

        if (state.gameState === 'serving') {
            if (state.servingPlayer === 'player') {
                state.ball.x = state.playerPaddle.x + PADDLE.width / 2;
                state.ball.y = state.playerPaddle.y - 20;
            } else {
                state.serveTimer++;
                if (state.serveTimer > 40) {
                    if (state.gameMode === 'local2p') {
                    } else {
                        aiServe();
                    }
                }
            }
            return;
        }

        if (state.gameState === 'pointScored') {
            state.pointPauseTimer--;
            return;
        }

        updatePlayerPaddle();
        if (state.gameMode === 'local2p') {
            updatePlayer2Paddle();
        } else if (state.gameMode === 'online' && !state.network.isHost) {
        } else {
            AIModule.update(state.ball, state.aiPaddle, state.aiStyle);
        }

        if (state.network.active && state.network.isHost) {
            updateRemotePaddle();
        }

        Physics.updateBall(state.ball);
        checkNetCollision();
        checkPaddleCollision();
        checkScoring();

        ReplaySystem.recordFrame();

        if (state.network.active) {
            Network.sendInput();
            Network.sendState();
        }
    }

    function updatePlayerPaddle() {
        const paddle = state.playerPaddle;
        const speed = 6;

        if (state.keys['ArrowLeft']) {
            paddle.x -= speed;
        }
        if (state.keys['ArrowRight']) {
            paddle.x += speed;
        }
        if (state.keys['ArrowUp']) {
            paddle.y -= speed;
        }
        if (state.keys['ArrowDown']) {
            paddle.y += speed;
        }

        paddle.x = Math.max(TABLE.left + 10, Math.min(TABLE.right - PADDLE.width - 10, paddle.x));
        const minY = TABLE.netY + PADDLE.minDistFromNet;
        const maxY = TABLE.bottom - PADDLE.height - 10;
        paddle.y = Math.max(minY, Math.min(maxY, paddle.y));
    }

    function updatePlayer2Paddle() {
        const paddle = state.player2Paddle;
        const speed = 6;

        if (state.keys2['KeyA']) {
            paddle.x -= speed;
        }
        if (state.keys2['KeyD']) {
            paddle.x += speed;
        }
        if (state.keys2['KeyW']) {
            paddle.y += speed;
        }
        if (state.keys2['KeyS']) {
            paddle.y -= speed;
        }

        paddle.x = Math.max(TABLE.left + 10, Math.min(TABLE.right - PADDLE.width - 10, paddle.x));
        const minY = TABLE.top + 10;
        const maxY = TABLE.netY - PADDLE.minDistFromNet;
        paddle.y = Math.max(minY, Math.min(maxY, paddle.y));
    }

    function updateRemotePaddle() {
        const paddle = state.aiPaddle;
        const speed = 6;
        const input = state.network.remoteInput;

        if (input.left) paddle.x -= speed;
        if (input.right) paddle.x += speed;
        if (input.up) paddle.y += speed;
        if (input.down) paddle.y -= speed;

        paddle.x = Math.max(TABLE.left + 10, Math.min(TABLE.right - PADDLE.width - 10, paddle.x));
        const minY = TABLE.top + 10;
        const maxY = TABLE.netY - PADDLE.minDistFromNet;
        paddle.y = Math.max(minY, Math.min(maxY, paddle.y));
    }

    // =========================================================================
    // 渲染函数
    // =========================================================================
    function draw() {
        ctx.clearRect(0, 0, W, H);

        drawTable();
        drawNet();
        drawCenterLine();
        drawPaddles();
        drawBall();
        drawFlashEffect();
        drawServeHint();
    }

    function drawTable() {
        const gradient = ctx.createRadialGradient(W / 2, TABLE.netY, 50, W / 2, TABLE.netY, 400);
        gradient.addColorStop(0, '#1e7a3a');
        gradient.addColorStop(1, '#0d4f1f');

        ctx.fillStyle = gradient;
        ctx.fillRect(TABLE.left - 20, TABLE.top - 20, TABLE.width + 40, TABLE.height + 40);

        ctx.fillStyle = '#0a3a15';
        ctx.fillRect(TABLE.left - 20, TABLE.top - 20, TABLE.width + 40, TABLE.height + 40);

        const tableGrad = ctx.createLinearGradient(TABLE.left, 0, TABLE.right, 0);
        tableGrad.addColorStop(0, '#1a6b30');
        tableGrad.addColorStop(0.5, '#1e7a3a');
        tableGrad.addColorStop(1, '#1a6b30');

        ctx.fillStyle = tableGrad;
        ctx.fillRect(TABLE.left, TABLE.top, TABLE.width, TABLE.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 3;
        ctx.strokeRect(TABLE.left, TABLE.top, TABLE.width, TABLE.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        const halfWidth = TABLE.width / 2;
        ctx.beginPath();
        ctx.moveTo(TABLE.left + halfWidth, TABLE.top);
        ctx.lineTo(TABLE.left + halfWidth, TABLE.netY - 20);
        ctx.moveTo(TABLE.left + halfWidth, TABLE.netY + 20);
        ctx.lineTo(TABLE.left + halfWidth, TABLE.bottom);
        ctx.stroke();

        const markSize = 15;
        const markColor = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeStyle = markColor;
        ctx.lineWidth = 1;
        const marks = [TABLE.top + 80, TABLE.top + 200, TABLE.bottom - 80, TABLE.bottom - 200];
        for (let i = 0; i < marks.length; i++) {
            const my = marks[i];
            ctx.beginPath();
            ctx.moveTo(TABLE.left + 30, my);
            ctx.lineTo(TABLE.left + 30 + markSize, my);
            ctx.moveTo(TABLE.right - 30 - markSize, my);
            ctx.lineTo(TABLE.right - 30, my);
            ctx.stroke();
        }
    }

    function drawNet() {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(TABLE.left, TABLE.netY);
        ctx.lineTo(TABLE.right, TABLE.netY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let x = TABLE.left + 10; x < TABLE.right; x += 12) {
            ctx.fillRect(x, TABLE.netY - 3, 8, 6);
        }

        const postGrad = ctx.createLinearGradient(0, TABLE.netY - 10, 0, TABLE.netY + 10);
        postGrad.addColorStop(0, '#888');
        postGrad.addColorStop(0.5, '#ccc');
        postGrad.addColorStop(1, '#888');

        ctx.fillStyle = postGrad;
        ctx.fillRect(TABLE.left - 25, TABLE.netY - 5, 12, 10);
        ctx.fillRect(TABLE.right + 13, TABLE.netY - 5, 12, 10);
    }

    function drawCenterLine() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(W / 2, TABLE.top - 10);
        ctx.lineTo(W / 2, TABLE.bottom + 10);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawPaddles() {
        if (state.gameMode === 'local2p') {
            drawPaddle(state.playerPaddle, '#4fc3f7', '#0288d1', '#01579b');
            drawPaddle(state.player2Paddle, '#ab47bc', '#7b1fa2', '#4a148c');
        } else {
            drawPaddle(state.playerPaddle, '#4fc3f7', '#0288d1', '#01579b');
            drawPaddle(state.aiPaddle, '#ef5350', '#c62828', '#b71c1c');
        }
    }

    function drawPaddle(paddle, mainColor, midColor, shadowColor) {
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(paddle.x + 3, paddle.y + 4, paddle.width, paddle.height);

        const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
        grad.addColorStop(0, mainColor);
        grad.addColorStop(0.5, midColor);
        grad.addColorStop(1, shadowColor);

        ctx.fillStyle = grad;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(paddle.x + 4, paddle.y + 2, paddle.width - 8, 3);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);

        const midGrad = ctx.createLinearGradient(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y);
        midGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
        midGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = midGrad;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height / 2);

        ctx.restore();
    }

    function drawBall() {
        const ball = state.ball;
        if (!ball.active && state.gameState !== 'serving') {
            if (state.gameState === 'pointScored' || state.gameState === 'gameOver') return;
        }

        ctx.save();

        const shadowY = ball.y + 15;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(ball.x + 2, shadowY, BALL.radius * 0.8, BALL.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        const ballGrad = ctx.createRadialGradient(
            ball.x - 2, ball.y - 2, 0,
            ball.x, ball.y, BALL.radius
        );
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.3, '#ffe0b2');
        ballGrad.addColorStop(1, '#ff9800');

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL.radius, 0, Math.PI * 2);
        ctx.fill();

        if (ball.topspin > 0.1 || ball.backspin > 0.1 || Math.abs(ball.sidespin) > 0.1) {
            ctx.strokeStyle = ball.topspin > 0.1 ? 'rgba(255, 87, 34, 0.6)' :
                              ball.backspin > 0.1 ? 'rgba(33, 150, 243, 0.6)' :
                              'rgba(156, 39, 176, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const rotation = (Date.now() / 50) * (ball.topspin - ball.backspin + ball.sidespin);
            ctx.arc(ball.x, ball.y, BALL.radius + 2, rotation, rotation + Math.PI);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(ball.x - 2, ball.y - 2, BALL.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawFlashEffect() {
        if (state.flashEffect.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = state.flashEffect.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(state.flashEffect.x, state.flashEffect.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        state.flashEffect.alpha -= 0.08;
    }

    function drawServeHint() {
        if (state.gameState !== 'serving') return;

        let text = '';
        if (state.servingPlayer === 'player') {
            text = '按 空格键 或 轻触屏幕 发球';
        } else if (state.gameMode === 'local2p') {
            text = '玩家2 按 空格键 发球';
        } else {
            text = '电脑准备发球...';
        }

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, W / 2, TABLE.bottom + 30);
        ctx.restore();
    }

    // =========================================================================
    // UI更新函数
    // =========================================================================
    function updateUI() {
        updateScoreDisplay();
        updateServeIndicator();
        updateStaminaBars();
        updateShotButtons();
        updateSpinBars();
        updateGameModeDisplay();
    }

    function updateScoreDisplay() {
        document.getElementById('playerScore').textContent = state.playerScore;
        document.getElementById('aiScore').textContent = state.aiScore;
    }

    function updateServeIndicator() {
        const indicator = document.getElementById('serveIndicator');
        const text = document.getElementById('serveText');
        if (state.servingPlayer === 'player') {
            indicator.className = 'serve-indicator player-serve';
            text.textContent = '玩家发球';
        } else {
            indicator.className = 'serve-indicator ai-serve';
            text.textContent = state.gameMode === 'local2p' ? '玩家2发球' : '电脑发球';
        }
    }

    function updateStaminaBars() {
        document.getElementById('playerStamina').style.width = state.playerStamina + '%';
        document.getElementById('aiStamina').style.width = state.aiStamina + '%';
    }

    function updateShotButtons() {
        document.querySelectorAll('.shot-btn').forEach(btn => {
            const shot = btn.dataset.shot;
            const shotData = SHOT_TYPES[shot];
            const canUse = state.playerStamina >= shotData.stamina;
            btn.disabled = !canUse;
            btn.classList.toggle('active', state.currentShot === shot);
        });

        if (!ShotSystem.canUseShot(state.currentShot, state.playerStamina)) {
            state.currentShot = 'normal';
            updateShotButtons();
        }
    }

    function updateSpinBars() {
        const totalSpin = state.playerSpin.topspin + state.playerSpin.backspin + Math.abs(state.playerSpin.sidespin);
        const normalized = Math.min(1, totalSpin);
        document.getElementById('topspinBar').style.width = (state.playerSpin.topspin * 100) + '%';
        document.getElementById('backspinBar').style.width = (state.playerSpin.backspin * 100) + '%';
        document.getElementById('sidespinBar').style.width = (Math.abs(state.playerSpin.sidespin) * 100) + '%';
    }

    function updateGameModeDisplay() {
        const modeNames = {
            quick: '快速对战',
            tournament: '锦标赛',
            local2p: '本地双人',
            online: '在线对战'
        };
        document.getElementById('gameMode').textContent = modeNames[state.gameMode] || '快速对战';

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === state.gameMode);
        });

        const bracket = document.getElementById('tournamentBracket');
        if (bracket) {
            bracket.style.display = state.gameMode === 'tournament' ? 'block' : 'none';
        }
    }

    function updateAIStyleButtons() {
        document.querySelectorAll('.ai-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ai === state.aiStyle);
        });
    }

    function showOverlay(title, message) {
        const overlay = document.getElementById('overlay');
        const titleEl = document.getElementById('overlayTitle');
        const msgEl = document.getElementById('overlayMessage');
        titleEl.textContent = title;
        msgEl.textContent = message;
        document.getElementById('rulesSection').style.display = 'block';
        document.getElementById('tutorialSection').style.display = 'none';
        document.getElementById('settingsSection').style.display = 'none';
        overlay.classList.remove('hidden');
    }

    function hideOverlay() {
        document.getElementById('overlay').classList.add('hidden');
    }

    function showNetworkPanel() {
        document.getElementById('networkPanel').style.display = 'flex';
        document.getElementById('roomInfo').style.display = 'none';
        document.getElementById('joinRoom').style.display = 'none';
    }

    function hideNetworkPanel() {
        document.getElementById('networkPanel').style.display = 'none';
    }

    // =========================================================================
    // 事件处理
    // =========================================================================
    function handleKeyDown(e) {
        const isPlayer2Key = ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code);

        if (state.gameMode === 'local2p' && isPlayer2Key) {
            state.keys2[e.code] = true;
        } else {
            state.keys[e.code] = true;
        }

        if (e.code === 'Space') {
            e.preventDefault();
            handleSpacePress();
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }

        if (state.gameMode !== 'local2p') {
            if (e.code === 'Digit1') setShot('normal');
            if (e.code === 'Digit2') setShot('smash');
            if (e.code === 'Digit3') setShot('chop');
            if (e.code === 'Digit4') setShot('lob');
            if (e.code === 'Digit5') setShot('push');

            if (e.code === 'KeyQ') {
                state.playerSpin.topspin = Math.min(1, state.playerSpin.topspin + 0.2);
                updateSpinBars();
            }
            if (e.code === 'KeyE') {
                state.playerSpin.sidespin = Math.max(-1, Math.min(1, state.playerSpin.sidespin + 0.2));
                updateSpinBars();
            }
            if (e.code === 'KeyR') {
                state.playerSpin.backspin = Math.min(1, state.playerSpin.backspin + 0.2);
                updateSpinBars();
            }
        }

        if (e.code === 'KeyP') togglePause();
        if (e.code === 'KeyC') toggleView();
    }

    function handleKeyUp(e) {
        const isPlayer2Key = ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code);

        if (state.gameMode === 'local2p' && isPlayer2Key) {
            state.keys2[e.code] = false;
        } else {
            state.keys[e.code] = false;
        }
    }

    function handleMouseMove(e) {
        if (state.gameState === 'playing' || state.gameState === 'serving') {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
            state.playerPaddle.x = mx - PADDLE.width / 2;
            state.playerPaddle.x = Math.max(TABLE.left + 10, Math.min(TABLE.right - PADDLE.width - 10, state.playerPaddle.x));

            const my = (e.clientY - rect.top) * (canvas.height / rect.height);
            const targetY = my - PADDLE.height / 2;
            const minY = TABLE.netY + PADDLE.minDistFromNet;
            const maxY = TABLE.bottom - PADDLE.height - 10;
            state.playerPaddle.y = Math.max(minY, Math.min(maxY, targetY));
        }
    }

    function handleTouchStart(e) {
        e.preventDefault();
        state.touchActive = true;
        if (state.gameState === 'waiting') {
            startGame();
        } else if (state.gameState === 'serving' && state.servingPlayer === 'player') {
            serve();
        } else if (state.gameState === 'pointScored') {
            nextPoint();
        } else if (state.gameState === 'gameOver') {
            resetGame();
        } else {
            updateTouch(e);
        }
    }

    function handleTouchMove(e) {
        e.preventDefault();
        updateTouch(e);
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        state.touchActive = false;
    }

    function updateTouch(e) {
        if (!state.touchActive || !e.touches[0]) return;
        const rect = canvas.getBoundingClientRect();
        const tx = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
        const ty = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);

        if (state.gameState === 'playing' || state.gameState === 'serving') {
            state.playerPaddle.x = tx - PADDLE.width / 2;
            state.playerPaddle.x = Math.max(TABLE.left + 10, Math.min(TABLE.right - PADDLE.width - 10, state.playerPaddle.x));

            const targetY = ty - PADDLE.height / 2;
            const minY = TABLE.netY + PADDLE.minDistFromNet;
            const maxY = TABLE.bottom - PADDLE.height - 10;
            state.playerPaddle.y = Math.max(minY, Math.min(maxY, targetY));
        }
    }

    function handleSpacePress() {
        if (state.paused) {
            togglePause();
            return;
        }

        if (state.gameState === 'waiting') {
            startGame();
        } else if (state.gameState === 'serving' && state.servingPlayer === 'player') {
            serve();
        } else if (state.gameState === 'serving' && state.servingPlayer === 'ai' && state.gameMode === 'local2p') {
            state.ball.active = true;
            state.ball.speed = BALL.speedBase;
            state.ball.vx = (Math.random() - 0.5) * 2;
            state.ball.vy = state.ball.speed;
            state.lastHitBy = 'ai';
            state.bounceCount = 0;
            state.gameState = 'playing';
        } else if (state.gameState === 'pointScored') {
            nextPoint();
        } else if (state.gameState === 'gameOver') {
            if (state.tournament.active && Tournament.checkPlayerEliminated()) {
                state.tournament.active = false;
                showOverlay('乒乓球对战', '选择游戏模式开始');
            } else {
                resetGame();
            }
        }
    }

    function setShot(shotType) {
        if (ShotSystem.canUseShot(shotType, state.playerStamina)) {
            state.currentShot = shotType;
            updateShotButtons();
        }
    }

    function togglePause() {
        state.paused = !state.paused;
        document.getElementById('pauseOverlay').classList.toggle('active', state.paused);
    }

    function toggleView() {
        const modes = ['top', 'side', 'auto'];
        const currentIndex = modes.indexOf(state.viewMode);
        state.viewMode = modes[(currentIndex + 1) % modes.length];
    }

    // =========================================================================
    // 事件绑定
    // =========================================================================
    function bindEvents() {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        document.querySelectorAll('.shot-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setShot(btn.dataset.shot);
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => btn.style.transform = '', 100);
            });
        });

        document.querySelectorAll('.ai-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.aiStyle = btn.dataset.ai;
                updateAIStyleButtons();
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => btn.style.transform = '', 100);
            });
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.gameMode = btn.dataset.mode;
                if (state.gameMode === 'tournament') {
                    Tournament.init();
                } else {
                    state.tournament.active = false;
                }
                if (state.gameMode === 'online') {
                    showNetworkPanel();
                }
                updateGameModeDisplay();
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => btn.style.transform = '', 100);
            });
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            if (state.gameMode === 'tournament') {
                Tournament.init();
            }
            startGame();
        });

        document.getElementById('tutorialBtn').addEventListener('click', () => {
            document.getElementById('rulesSection').style.display = 'none';
            document.getElementById('tutorialSection').style.display = 'block';
            document.getElementById('settingsSection').style.display = 'none';
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('rulesSection').style.display = 'none';
            document.getElementById('tutorialSection').style.display = 'none';
            document.getElementById('settingsSection').style.display = 'block';
        });

        document.getElementById('resumeBtn').addEventListener('click', togglePause);
        document.getElementById('quitBtn').addEventListener('click', () => {
            state.paused = false;
            document.getElementById('pauseOverlay').classList.remove('active');
            state.gameState = 'waiting';
            showOverlay('乒乓球对战', '选择游戏模式开始');
        });

        document.getElementById('hostBtn').addEventListener('click', () => {
            Network.createRoom();
        });

        document.getElementById('joinBtn').addEventListener('click', () => {
            document.getElementById('joinRoom').style.display = 'flex';
            document.getElementById('roomInfo').style.display = 'none';
        });

        document.getElementById('confirmJoinBtn').addEventListener('click', () => {
            const code = document.getElementById('roomInput').value.trim();
            Network.joinRoom(code);
        });

        document.getElementById('closeNetworkBtn').addEventListener('click', () => {
            Network.close();
            hideNetworkPanel();
            state.gameMode = 'quick';
            updateGameModeDisplay();
        });

        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            state.difficulty = e.target.value;
        });

        document.getElementById('viewSelect').addEventListener('change', (e) => {
            state.viewMode = e.target.value;
        });

        document.getElementById('soundToggle').addEventListener('change', (e) => {
            state.soundEnabled = e.target.checked;
        });

        document.getElementById('replayToggle').addEventListener('change', (e) => {
            state.replayEnabled = e.target.checked;
        });
    }

    // =========================================================================
    // 主游戏循环
    // =========================================================================
    function gameLoop(timestamp) {
        update(timestamp);
        draw();
        requestAnimationFrame(gameLoop);
    }

    // =========================================================================
    // 初始化
    // =========================================================================
    function init() {
        bindEvents();
        updateUI();
        showOverlay('乒乓球对战 专业版', '选择游戏模式开始');
        requestAnimationFrame(gameLoop);
    }

    init();
})();