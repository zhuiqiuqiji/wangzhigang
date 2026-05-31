const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1200;

function generateDailyChallenge() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    const platforms = [];
    const stars = [];
    const gems = [];
    const powerUps = [];
    const spinningSaws = [];
    
    let y = 200;
    for (let i = 0; i < 15; i++) {
        const width = 100 + ((seed * (i + 1)) % 200);
        const x = 100 + ((seed * (i + 2)) % (CANVAS_WIDTH - 200));
        const hasSpike = ((seed * (i + 3)) % 5) === 0;
        const isMoving = ((seed * (i + 4)) % 4) === 0;
        const isDisappearing = ((seed * (i + 5)) % 6) === 0;
        const isBouncePad = ((seed * (i + 6)) % 7) === 0;
        
        let type = PlatformType.NORMAL;
        let extraData = {};
        
        if (isMoving) {
            type = PlatformType.MOVING;
            extraData = { moveRange: 80 + ((seed * i) % 60), moveSpeed: 0.8 + ((seed * i) % 5) * 0.2 };
        } else if (isDisappearing) {
            type = PlatformType.DISAPPEARING;
            extraData = { disappearDelay: 1.5 + ((seed * i) % 10) * 0.1, reappearDuration: 2 + ((seed * i) % 10) * 0.1 };
        } else if (isBouncePad) {
            type = PlatformType.BOUNCE_PAD;
            extraData = { bounceMultiplier: 1.8 + ((seed * i) % 5) * 0.2 };
        }
        
        platforms.push({
            x, y, width, height: 20,
            hasSpike, spikeSide: 'top',
            platformType: type,
            extraData
        });
        
        if (((seed * (i + 7)) % 3) === 0) {
            stars.push({ x, y: y - 50 });
        }
        if (((seed * (i + 8)) % 8) === 0) {
            gems.push({ x, y: y - 60, color: ['purple', 'green', 'blue', 'pink'][i % 4] });
        }
        if (((seed * (i + 9)) % 12) === 0) {
            powerUps.push({ x, y: y - 70, type: [PowerUpType.FLY, PowerUpType.INVINCIBLE, PowerUpType.SLOW_MO][i % 3] });
        }
        if (((seed * (i + 10)) % 5) === 0 && i > 2) {
            spinningSaws.push({
                x: 100 + ((seed * i) % (CANVAS_WIDTH - 200)),
                y: y - 30,
                radius: 22,
                moveData: ((seed * i) % 2) === 0 ? { axis: 'x', range: 60, speed: 1 } : null
            });
        }
        
        y += 90 + ((seed * i) % 30);
    }
    
    return {
        id: 999,
        name: "每日挑战",
        startPos: { x: 400, y: 100 },
        targetTime: 45,
        platforms,
        stars,
        gems,
        powerUps,
        spinningSaws,
        goal: { x: 400, y: Math.min(y + 80, CANVAS_HEIGHT - 60), width: 300, height: 40 }
    };
}

const levels = [
    {
        id: 1,
        name: "初次冒险",
        targetTime: 60,
        startPos: { x: 400, y: 100 },
        platforms: [
            { x: 400, y: 200, width: 600, height: 20, hasSpike: false },
            { x: 200, y: 320, width: 250, height: 20, hasSpike: false },
            { x: 600, y: 320, width: 250, height: 20, hasSpike: false },
            { x: 400, y: 440, width: 500, height: 20, hasSpike: false },
            { x: 250, y: 560, width: 200, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 550, y: 560, width: 200, height: 20, hasSpike: false },
            { x: 400, y: 680, width: 400, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 1.5 } },
            { x: 200, y: 800, width: 200, height: 20, hasSpike: false },
            { x: 600, y: 800, width: 200, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 400, y: 920, width: 500, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 100, moveSpeed: 1.5, moveAxis: 'x' } },
            { x: 300, y: 1040, width: 200, height: 20, hasSpike: false },
            { x: 500, y: 1040, width: 200, height: 20, hasSpike: false },
        ],
        stars: [
            { x: 200, y: 260 },
            { x: 600, y: 260 },
            { x: 400, y: 380 },
            { x: 550, y: 500 },
            { x: 400, y: 620 },
            { x: 200, y: 740 },
            { x: 400, y: 860 },
            { x: 300, y: 980 },
        ],
        gems: [
            { x: 250, y: 500, color: 'purple' },
            { x: 600, y: 740, color: 'green' },
        ],
        powerUps: [
            { x: 400, y: 600, type: PowerUpType.INVINCIBLE }
        ],
        spinningSaws: [],
        goal: { x: 400, y: 1150, width: 300, height: 40 }
    },
    {
        id: 2,
        name: "尖刺陷阱",
        targetTime: 75,
        startPos: { x: 400, y: 100 },
        platforms: [
            { x: 400, y: 180, width: 500, height: 20, hasSpike: false },
            { x: 150, y: 280, width: 180, height: 20, hasSpike: false },
            { x: 400, y: 280, width: 180, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 650, y: 280, width: 180, height: 20, hasSpike: false },
            { x: 250, y: 380, width: 200, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 2, reappearTime: 3 } },
            { x: 550, y: 380, width: 200, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 2.5, reappearTime: 2.5 } },
            { x: 400, y: 480, width: 150, height: 20, hasSpike: false },
            { x: 150, y: 580, width: 200, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 650, y: 580, width: 200, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 400, y: 580, width: 150, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 120, moveSpeed: 1.2, moveAxis: 'y' } },
            { x: 250, y: 680, width: 180, height: 20, hasSpike: false },
            { x: 550, y: 680, width: 180, height: 20, hasSpike: false },
            { x: 150, y: 780, width: 150, height: 20, hasSpike: false },
            { x: 400, y: 780, width: 200, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 650, y: 780, width: 150, height: 20, hasSpike: false },
            { x: 300, y: 880, width: 200, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 1.8 } },
            { x: 500, y: 880, width: 200, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 1.8 } },
            { x: 400, y: 980, width: 500, height: 20, hasSpike: false },
            { x: 400, y: 1080, width: 600, height: 20, hasSpike: false },
        ],
        stars: [
            { x: 150, y: 220 },
            { x: 650, y: 220 },
            { x: 250, y: 320 },
            { x: 550, y: 320 },
            { x: 400, y: 420 },
            { x: 250, y: 620 },
            { x: 550, y: 620 },
            { x: 150, y: 720 },
            { x: 650, y: 720 },
            { x: 400, y: 920 },
        ],
        gems: [
            { x: 400, y: 220, color: 'purple' },
            { x: 400, y: 520, color: 'green' },
            { x: 400, y: 820, color: 'blue' },
        ],
        powerUps: [
            { x: 250, y: 480, type: PowerUpType.SLOW_MO },
            { x: 550, y: 480, type: PowerUpType.FLY }
        ],
        spinningSaws: [
            { x: 400, y: 520, radius: 25 }
        ],
        goal: { x: 400, y: 1150, width: 300, height: 40 }
    },
    {
        id: 3,
        name: "终极挑战",
        targetTime: 90,
        startPos: { x: 400, y: 100 },
        platforms: [
            { x: 400, y: 170, width: 400, height: 20, hasSpike: false },
            { x: 120, y: 260, width: 140, height: 20, hasSpike: false },
            { x: 280, y: 260, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 450, y: 260, width: 140, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 80, moveSpeed: 2, moveAxis: 'x' } },
            { x: 650, y: 260, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 200, y: 350, width: 150, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 400, y: 350, width: 100, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1.5, reappearTime: 2 } },
            { x: 600, y: 350, width: 150, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 100, y: 440, width: 120, height: 20, hasSpike: false },
            { x: 280, y: 440, width: 120, height: 20, hasSpike: false },
            { x: 460, y: 440, width: 120, height: 20, hasSpike: false },
            { x: 680, y: 440, width: 120, height: 20, hasSpike: false },
            { x: 400, y: 530, width: 200, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 150, y: 620, width: 120, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 2 } },
            { x: 350, y: 620, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 500, y: 620, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 650, y: 620, width: 120, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 2 } },
            { x: 250, y: 710, width: 100, height: 20, hasSpike: false },
            { x: 400, y: 710, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 550, y: 710, width: 100, height: 20, hasSpike: false },
            { x: 150, y: 800, width: 150, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 100, moveSpeed: 1.5, moveAxis: 'y' } },
            { x: 400, y: 800, width: 100, height: 20, hasSpike: false },
            { x: 650, y: 800, width: 150, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 100, moveSpeed: 1.5, moveAxis: 'y', movePhase: Math.PI } },
            { x: 280, y: 890, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 520, y: 890, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 400, y: 980, width: 300, height: 20, hasSpike: false },
            { x: 200, y: 1070, width: 150, height: 20, hasSpike: false },
            { x: 600, y: 1070, width: 150, height: 20, hasSpike: false },
        ],
        stars: [
            { x: 120, y: 200 },
            { x: 680, y: 200 },
            { x: 400, y: 290 },
            { x: 200, y: 380 },
            { x: 600, y: 380 },
            { x: 100, y: 380 },
            { x: 680, y: 380 },
            { x: 280, y: 470 },
            { x: 520, y: 470 },
            { x: 150, y: 560 },
            { x: 650, y: 560 },
            { x: 250, y: 650 },
            { x: 550, y: 650 },
            { x: 150, y: 740 },
            { x: 650, y: 740 },
            { x: 400, y: 830 },
            { x: 200, y: 920 },
            { x: 600, y: 920 },
            { x: 400, y: 1010 },
        ],
        gems: [
            { x: 400, y: 290, color: 'purple' },
            { x: 400, y: 560, color: 'green' },
            { x: 400, y: 830, color: 'blue' },
            { x: 250, y: 650, color: 'pink' },
            { x: 550, y: 650, color: 'pink' },
        ],
        powerUps: [
            { x: 400, y: 380, type: PowerUpType.INVINCIBLE },
            { x: 400, y: 750, type: PowerUpType.FLY }
        ],
        spinningSaws: [
            { x: 400, y: 450, radius: 25, moveData: { axis: 'x', range: 150, speed: 1.5 } },
            { x: 200, y: 750, radius: 20 },
            { x: 600, y: 750, radius: 20 }
        ],
        goal: { x: 400, y: 1150, width: 300, height: 40 }
    },
    {
        id: 4,
        name: "机械迷宫",
        targetTime: 100,
        startPos: { x: 400, y: 100 },
        platforms: [
            { x: 400, y: 180, width: 600, height: 20, hasSpike: false },
            { x: 200, y: 280, width: 150, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 150, moveSpeed: 2, moveAxis: 'x' } },
            { x: 600, y: 280, width: 150, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 150, moveSpeed: 2, moveAxis: 'x', movePhase: Math.PI } },
            { x: 400, y: 380, width: 250, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 150, y: 480, width: 120, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1, reappearTime: 2 } },
            { x: 320, y: 480, width: 120, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1, reappearTime: 2, movePhase: 0.5 } },
            { x: 490, y: 480, width: 120, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1, reappearTime: 2, movePhase: 1 } },
            { x: 660, y: 480, width: 120, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1, reappearTime: 2, movePhase: 1.5 } },
            { x: 400, y: 580, width: 200, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 2.2 } },
            { x: 150, y: 680, width: 200, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 650, y: 680, width: 200, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 400, y: 680, width: 100, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 100, moveSpeed: 3, moveAxis: 'y' } },
            { x: 250, y: 780, width: 150, height: 20, hasSpike: false },
            { x: 550, y: 780, width: 150, height: 20, hasSpike: false },
            { x: 400, y: 880, width: 400, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 200, moveSpeed: 1.5, moveAxis: 'x' } },
            { x: 200, y: 980, width: 150, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 2, reappearTime: 2 } },
            { x: 600, y: 980, width: 150, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 2, reappearTime: 2, movePhase: Math.PI } },
            { x: 400, y: 1080, width: 500, height: 20, hasSpike: false },
        ],
        stars: [
            { x: 200, y: 220 },
            { x: 600, y: 220 },
            { x: 400, y: 320 },
            { x: 150, y: 420 },
            { x: 320, y: 420 },
            { x: 490, y: 420 },
            { x: 660, y: 420 },
            { x: 400, y: 520 },
            { x: 150, y: 620 },
            { x: 650, y: 620 },
            { x: 250, y: 720 },
            { x: 550, y: 720 },
            { x: 400, y: 820 },
            { x: 200, y: 920 },
            { x: 600, y: 920 },
            { x: 400, y: 1020 },
        ],
        gems: [
            { x: 400, y: 320, color: 'purple' },
            { x: 400, y: 620, color: 'green' },
            { x: 400, y: 920, color: 'blue' },
        ],
        powerUps: [
            { x: 400, y: 420, type: PowerUpType.SLOW_MO },
            { x: 400, y: 720, type: PowerUpType.INVINCIBLE },
            { x: 400, y: 1000, type: PowerUpType.FLY }
        ],
        spinningSaws: [
            { x: 400, y: 230, radius: 25, moveData: { axis: 'x', range: 200, speed: 2 } },
            { x: 200, y: 580, radius: 20 },
            { x: 600, y: 580, radius: 20 },
            { x: 400, y: 780, radius: 25, moveData: { axis: 'y', range: 80, speed: 1.5 } }
        ],
        goal: { x: 400, y: 1150, width: 300, height: 40 }
    },
    {
        id: 5,
        name: "生死时速",
        targetTime: 120,
        startPos: { x: 400, y: 100 },
        platforms: [
            { x: 400, y: 160, width: 500, height: 20, hasSpike: false },
            { x: 200, y: 240, width: 120, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1, reappearTime: 2.5 } },
            { x: 400, y: 240, width: 120, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 600, y: 240, width: 120, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1, reappearTime: 2.5, movePhase: 0.7 } },
            { x: 300, y: 320, width: 100, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 80, moveSpeed: 2.5, moveAxis: 'y' } },
            { x: 500, y: 320, width: 100, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 80, moveSpeed: 2.5, moveAxis: 'y', movePhase: Math.PI } },
            { x: 400, y: 400, width: 150, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 2.5 } },
            { x: 150, y: 480, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 300, y: 480, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 500, y: 480, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 650, y: 480, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 400, y: 480, width: 80, height: 20, hasSpike: false },
            { x: 250, y: 560, width: 150, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 100, moveSpeed: 3, moveAxis: 'x' } },
            { x: 550, y: 560, width: 150, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 100, moveSpeed: 3, moveAxis: 'x', movePhase: Math.PI } },
            { x: 400, y: 640, width: 200, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 150, y: 720, width: 120, height: 20, hasSpike: false },
            { x: 650, y: 720, width: 120, height: 20, hasSpike: false },
            { x: 400, y: 720, width: 100, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1.5, reappearTime: 1.5 } },
            { x: 250, y: 800, width: 100, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 2 } },
            { x: 550, y: 800, width: 100, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 2 } },
            { x: 150, y: 880, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 320, y: 880, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 490, y: 880, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 660, y: 880, width: 100, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 400, y: 880, width: 80, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 60, moveSpeed: 4, moveAxis: 'y' } },
            { x: 400, y: 960, width: 300, height: 20, hasSpike: false },
            { x: 200, y: 1040, width: 120, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 2, reappearTime: 2 } },
            { x: 600, y: 1040, width: 120, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 2, reappearTime: 2, movePhase: Math.PI } },
            { x: 400, y: 1100, width: 400, height: 20, hasSpike: false },
        ],
        stars: [
            { x: 200, y: 180 },
            { x: 600, y: 180 },
            { x: 300, y: 260 },
            { x: 500, y: 260 },
            { x: 400, y: 340 },
            { x: 150, y: 420 },
            { x: 650, y: 420 },
            { x: 400, y: 500 },
            { x: 250, y: 600 },
            { x: 550, y: 600 },
            { x: 150, y: 660 },
            { x: 650, y: 660 },
            { x: 250, y: 740 },
            { x: 550, y: 740 },
            { x: 400, y: 840 },
            { x: 150, y: 920 },
            { x: 650, y: 920 },
            { x: 400, y: 1000 },
            { x: 200, y: 1080 },
            { x: 600, y: 1080 },
        ],
        gems: [
            { x: 400, y: 340, color: 'purple' },
            { x: 400, y: 600, color: 'green' },
            { x: 400, y: 840, color: 'blue' },
            { x: 250, y: 740, color: 'pink' },
            { x: 550, y: 740, color: 'pink' },
        ],
        powerUps: [
            { x: 400, y: 340, type: PowerUpType.INVINCIBLE },
            { x: 400, y: 500, type: PowerUpType.SLOW_MO },
            { x: 400, y: 760, type: PowerUpType.FLY },
            { x: 400, y: 1000, type: PowerUpType.INVINCIBLE }
        ],
        spinningSaws: [
            { x: 400, y: 180, radius: 25, moveData: { axis: 'x', range: 180, speed: 2.5 } },
            { x: 200, y: 400, radius: 20, moveData: { axis: 'y', range: 60, speed: 2 } },
            { x: 600, y: 400, radius: 20, moveData: { axis: 'y', range: 60, speed: 2, movePhase: Math.PI } },
            { x: 400, y: 680, radius: 25, moveData: { axis: 'x', range: 150, speed: 3 } },
            { x: 250, y: 920, radius: 20 },
            { x: 550, y: 920, radius: 20 }
        ],
        goal: { x: 400, y: 1150, width: 300, height: 40 }
    },
    {
        id: 6,
        name: "地狱之门",
        targetTime: 150,
        startPos: { x: 400, y: 100 },
        platforms: [
            { x: 400, y: 150, width: 400, height: 20, hasSpike: false },
            { x: 150, y: 220, width: 100, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 0.8, reappearTime: 2 } },
            { x: 300, y: 220, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 450, y: 220, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 650, y: 220, width: 100, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 0.8, reappearTime: 2, movePhase: 0.5 } },
            { x: 250, y: 290, width: 100, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 60, moveSpeed: 3, moveAxis: 'x' } },
            { x: 550, y: 290, width: 100, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 60, moveSpeed: 3, moveAxis: 'x', movePhase: Math.PI } },
            { x: 400, y: 360, width: 120, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 2.8 } },
            { x: 150, y: 430, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 300, y: 430, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 500, y: 430, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 650, y: 430, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 400, y: 430, width: 60, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 50, moveSpeed: 4, moveAxis: 'y' } },
            { x: 200, y: 500, width: 100, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1, reappearTime: 2 } },
            { x: 600, y: 500, width: 100, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1, reappearTime: 2, movePhase: 0.6 } },
            { x: 400, y: 570, width: 150, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 150, y: 640, width: 100, height: 20, hasSpike: false },
            { x: 650, y: 640, width: 100, height: 20, hasSpike: false },
            { x: 400, y: 640, width: 100, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 80, moveSpeed: 3.5, moveAxis: 'y' } },
            { x: 250, y: 710, width: 80, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 2.2 } },
            { x: 550, y: 710, width: 80, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 2.2 } },
            { x: 150, y: 780, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 300, y: 780, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 500, y: 780, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 650, y: 780, width: 80, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 400, y: 780, width: 60, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1.2, reappearTime: 1.5 } },
            { x: 250, y: 850, width: 100, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 80, moveSpeed: 3, moveAxis: 'x' } },
            { x: 550, y: 850, width: 100, height: 20, hasSpike: false, platformType: PlatformType.MOVING, extraData: { moveRange: 80, moveSpeed: 3, moveAxis: 'x', movePhase: Math.PI } },
            { x: 400, y: 920, width: 200, height: 20, hasSpike: true, spikeSide: 'top' },
            { x: 200, y: 990, width: 100, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1.5, reappearTime: 2 } },
            { x: 600, y: 990, width: 100, height: 20, hasSpike: false, platformType: PlatformType.DISAPPEARING, extraData: { disappearTime: 1.5, reappearTime: 2, movePhase: 0.8 } },
            { x: 400, y: 1060, width: 300, height: 20, hasSpike: false, platformType: PlatformType.BOUNCE_PAD, extraData: { bounceMultiplier: 1.5 } },
        ],
        stars: [
            { x: 150, y: 170 },
            { x: 650, y: 170 },
            { x: 250, y: 240 },
            { x: 550, y: 240 },
            { x: 400, y: 310 },
            { x: 150, y: 380 },
            { x: 650, y: 380 },
            { x: 400, y: 460 },
            { x: 200, y: 530 },
            { x: 600, y: 530 },
            { x: 400, y: 600 },
            { x: 150, y: 670 },
            { x: 650, y: 670 },
            { x: 250, y: 740 },
            { x: 550, y: 740 },
            { x: 400, y: 810 },
            { x: 250, y: 880 },
            { x: 550, y: 880 },
            { x: 200, y: 950 },
            { x: 600, y: 950 },
            { x: 400, y: 1020 },
        ],
        gems: [
            { x: 400, y: 310, color: 'purple' },
            { x: 400, y: 600, color: 'green' },
            { x: 400, y: 880, color: 'blue' },
            { x: 250, y: 740, color: 'pink' },
            { x: 550, y: 740, color: 'pink' },
            { x: 400, y: 1020, color: 'purple' },
        ],
        powerUps: [
            { x: 400, y: 310, type: PowerUpType.INVINCIBLE },
            { x: 400, y: 460, type: PowerUpType.SLOW_MO },
            { x: 400, y: 680, type: PowerUpType.FLY },
            { x: 400, y: 810, type: PowerUpType.INVINCIBLE },
            { x: 400, y: 1020, type: PowerUpType.SLOW_MO }
        ],
        spinningSaws: [
            { x: 400, y: 160, radius: 25, moveData: { axis: 'x', range: 200, speed: 3 } },
            { x: 200, y: 360, radius: 20, moveData: { axis: 'y', range: 50, speed: 2.5 } },
            { x: 600, y: 360, radius: 20, moveData: { axis: 'y', range: 50, speed: 2.5, movePhase: Math.PI } },
            { x: 400, y: 550, radius: 25, moveData: { axis: 'x', range: 120, speed: 3.5 } },
            { x: 150, y: 720, radius: 20 },
            { x: 650, y: 720, radius: 20 },
            { x: 400, y: 850, radius: 25, moveData: { axis: 'y', range: 40, speed: 4 } },
            { x: 250, y: 950, radius: 20 },
            { x: 550, y: 950, radius: 20 }
        ],
        goal: { x: 400, y: 1150, width: 300, height: 40 }
    }
];

function createLevelEntities(levelData) {
    const entities = {
        platforms: [],
        stars: [],
        gems: [],
        powerUps: [],
        spinningSaws: [],
        goal: null
    };

    if (levelData.platforms) {
        levelData.platforms.forEach(p => {
            entities.platforms.push(new Platform(
                p.x, p.y, p.width, p.height,
                p.hasSpike, p.spikeSide || 'top',
                p.platformType || PlatformType.NORMAL,
                p.extraData || {}
            ));
        });
    }

    if (levelData.stars) {
        levelData.stars.forEach(s => {
            entities.stars.push(new Star(s.x, s.y));
        });
    }

    if (levelData.gems) {
        levelData.gems.forEach(g => {
            entities.gems.push(new Gem(g.x, g.y, g.color));
        });
    }

    if (levelData.powerUps) {
        levelData.powerUps.forEach(p => {
            entities.powerUps.push(new PowerUp(p.x, p.y, p.type));
        });
    }

    if (levelData.spinningSaws) {
        levelData.spinningSaws.forEach(s => {
            entities.spinningSaws.push(new SpinningSaw(s.x, s.y, s.radius, s.moveData));
        });
    }

    if (levelData.goal) {
        entities.goal = new Goal(
            levelData.goal.x,
            levelData.goal.y,
            levelData.goal.width,
            levelData.goal.height
        );
    }

    return entities;
}
