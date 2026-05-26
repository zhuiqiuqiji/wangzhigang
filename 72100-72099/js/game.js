const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const BIRD_TYPES = {
    duck: {
        name: '野鸭',
        score: 10,
        speed: 3,
        width: 60,
        height: 40,
        color: '#8B4513',
        wingColor: '#D2691E',
        bellyColor: '#FFDAB9'
    },
    pigeon: {
        name: '鸽子',
        score: 15,
        speed: 2.5,
        width: 45,
        height: 30,
        color: '#808080',
        wingColor: '#A9A9A9',
        bellyColor: '#D3D3D3'
    },
    eagle: {
        name: '老鹰',
        score: 25,
        speed: 5,
        width: 80,
        height: 50,
        color: '#4A4A4A',
        wingColor: '#696969',
        bellyColor: '#8B7355'
    }
};

let gameState = {
    score: 0,
    bullets: 20,
    maxBullets: 20,
    isGameOver: false,
    isGameStarted: false,
    birds: [],
    bulletsArray: [],
    feathers: [],
    crosshair: {
        x: canvas.width / 2,
        y: canvas.height / 2
    },
    shootEffects: [],
    clouds: []
};

let birdIdCounter = 0;
let bulletIdCounter = 0;

function initClouds() {
    gameState.clouds = [];
    for (let i = 0; i < 5; i++) {
        gameState.clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.4),
            width: 100 + Math.random() * 100,
            speed: 0.3 + Math.random() * 0.5
        });
    }
}

function spawnBird() {
    if (gameState.isGameOver) return;
    
    const types = Object.keys(BIRD_TYPES);
    const weights = [0.5, 0.35, 0.15];
    let random = Math.random();
    let typeIndex = 0;
    for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            typeIndex = i;
            break;
        }
    }
    
    const type = types[typeIndex];
    const birdConfig = BIRD_TYPES[type];
    
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -birdConfig.width : canvas.width + birdConfig.width;
    const startY = 100 + Math.random() * (canvas.height * 0.5);
    
    const baseSpeed = birdConfig.speed * (0.8 + Math.random() * 0.4);
    const speedX = fromLeft ? baseSpeed : -baseSpeed;
    const flightPattern = Math.random();
    
    let speedY;
    if (flightPattern < 0.4) {
        speedY = 0;
    } else if (flightPattern < 0.7) {
        speedY = (Math.random() - 0.5) * 2;
    } else {
        speedY = (Math.random() - 0.5) * 3;
    }
    
    const bird = {
        id: birdIdCounter++,
        type: type,
        x: startX,
        y: startY,
        width: birdConfig.width,
        height: birdConfig.height,
        speedX: speedX,
        speedY: speedY,
        score: birdConfig.score,
        wingPhase: Math.random() * Math.PI * 2,
        isHit: false,
        fallSpeed: 0,
        rotation: 0,
        oscillatePhase: Math.random() * Math.PI * 2,
        oscillateAmplitude: 1 + Math.random() * 2,
        flyAway: false
    };
    
    gameState.birds.push(bird);
}

function shoot(targetX, targetY) {
    if (gameState.bullets <= 0 || gameState.isGameOver) return;
    
    gameState.bullets--;
    updateUI();
    
    const startX = canvas.width / 2;
    const startY = canvas.height;
    
    const bullet = {
        id: bulletIdCounter++,
        x: startX,
        y: startY,
        targetX: targetX,
        targetY: targetY,
        speed: 20,
        isActive: true,
        trail: [],
        lifeTime: 100
    };
    
    gameState.bulletsArray.push(bullet);
    
    gameState.shootEffects.push({
        x: targetX,
        y: targetY,
        radius: 5,
        maxRadius: 40,
        alpha: 1
    });
    
    if (gameState.bullets <= 0) {
        setTimeout(() => {
            endGame();
        }, 1500);
    }
}

function createFeathers(x, y, color) {
    for (let i = 0; i < 8; i++) {
        gameState.feathers.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: -Math.random() * 5 - 2,
            size: 5 + Math.random() * 10,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            alpha: 1,
            color: color
        });
    }
}

function checkCollision(bird, bullet) {
    return bullet.x > bird.x &&
           bullet.x < bird.x + bird.width &&
           bullet.y > bird.y &&
           bullet.y < bird.y + bird.height;
}

function updateBirds() {
    for (let i = gameState.birds.length - 1; i >= 0; i--) {
        const bird = gameState.birds[i];
        
        if (bird.isHit) {
            bird.fallSpeed += 0.5;
            bird.y += bird.fallSpeed;
            bird.rotation += 0.2;
            
            if (bird.y > canvas.height + 100) {
                gameState.birds.splice(i, 1);
            }
        } else {
            bird.wingPhase += 0.2;
            bird.oscillatePhase += 0.05;
            bird.y += Math.sin(bird.oscillatePhase) * bird.oscillateAmplitude;
            
            bird.x += bird.speedX;
            bird.y += bird.speedY;
            
            if (bird.y < 50) {
                bird.y = 50;
                bird.speedY = Math.abs(bird.speedY);
            }
            if (bird.y > canvas.height * 0.7) {
                bird.y = canvas.height * 0.7;
                bird.speedY = -Math.abs(bird.speedY);
            }
            
            if ((bird.speedX > 0 && bird.x > canvas.width + 200) ||
                (bird.speedX < 0 && bird.x < -200)) {
                gameState.birds.splice(i, 1);
            }
        }
    }
}

function updateBullets() {
    for (let i = gameState.bulletsArray.length - 1; i >= 0; i--) {
        const bullet = gameState.bulletsArray[i];
        
        if (!bullet.isActive) continue;
        
        bullet.lifeTime--;
        
        bullet.trail.push({ x: bullet.x, y: bullet.y, alpha: 1 });
        if (bullet.trail.length > 10) {
            bullet.trail.shift();
        }
        
        const dx = bullet.targetX - bullet.x;
        const dy = bullet.targetY - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > bullet.speed) {
            bullet.x += (dx / distance) * bullet.speed;
            bullet.y += (dy / distance) * bullet.speed;
        } else {
            bullet.x = bullet.targetX;
            bullet.y = bullet.targetY;
            bullet.isActive = false;
        }
        
        for (let j = gameState.birds.length - 1; j >= 0; j--) {
            const bird = gameState.birds[j];
            if (!bird.isHit && checkCollision(bird, bullet)) {
                bird.isHit = true;
                bullet.isActive = false;
                
                gameState.score += bird.score;
                updateUI();
                
                const birdConfig = BIRD_TYPES[bird.type];
                createFeathers(bird.x + bird.width / 2, bird.y + bird.height / 2, birdConfig.color);
                
                break;
            }
        }
        
        if (bullet.x < -50 || bullet.x > canvas.width + 50 ||
            bullet.y < -50 || bullet.y > canvas.height + 50) {
            bullet.isActive = false;
        }
        
        if (bullet.lifeTime <= 0) {
            bullet.isActive = false;
        }
        
        if (!bullet.isActive) {
            setTimeout(() => {
                const index = gameState.bulletsArray.indexOf(bullet);
                if (index > -1) {
                    gameState.bulletsArray.splice(index, 1);
                }
            }, 300);
        }
    }
}

function updateFeathers() {
    for (let i = gameState.feathers.length - 1; i >= 0; i--) {
        const feather = gameState.feathers[i];
        feather.vy += 0.15;
        feather.x += feather.vx;
        feather.y += feather.vy;
        feather.rotation += feather.rotationSpeed;
        feather.alpha -= 0.02;
        
        if (feather.alpha <= 0 || feather.y > canvas.height) {
            gameState.feathers.splice(i, 1);
        }
    }
}

function updateShootEffects() {
    for (let i = gameState.shootEffects.length - 1; i >= 0; i--) {
        const effect = gameState.shootEffects[i];
        effect.radius += 3;
        effect.alpha -= 0.08;
        
        if (effect.alpha <= 0) {
            gameState.shootEffects.splice(i, 1);
        }
    }
}

function updateClouds() {
    for (const cloud of gameState.clouds) {
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + cloud.width) {
            cloud.x = -cloud.width;
            cloud.y = Math.random() * (canvas.height * 0.4);
        }
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#4A90D9');
    gradient.addColorStop(1, '#2E7BC4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (const cloud of gameState.clouds) {
        drawCloud(cloud.x, cloud.y, cloud.width);
    }
    
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 50) {
        const y = canvas.height - 50 - Math.sin(x * 0.01) * 30;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
}

function drawCloud(x, y, width) {
    const height = width * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, height * 0.5, 0, Math.PI * 2);
    ctx.arc(x + width * 0.3, y - height * 0.2, height * 0.6, 0, Math.PI * 2);
    ctx.arc(x + width * 0.6, y, height * 0.55, 0, Math.PI * 2);
    ctx.arc(x + width * 0.3, y + height * 0.1, height * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawBird(bird) {
    const config = BIRD_TYPES[bird.type];
    
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    
    if (bird.isHit) {
        ctx.rotate(bird.rotation);
    }
    
    if (bird.speedX < 0) {
        ctx.scale(-1, 1);
    }
    
    const wingFlap = Math.sin(bird.wingPhase) * 0.4;
    
    ctx.fillStyle = config.bellyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width * 0.35, bird.height * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.ellipse(-bird.width * 0.1, -bird.height * 0.1, bird.width * 0.3, bird.height * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.arc(bird.width * 0.25, -bird.height * 0.15, bird.width * 0.18, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(bird.width * 0.35, -bird.height * 0.15);
    ctx.lineTo(bird.width * 0.5, -bird.height * 0.1);
    ctx.lineTo(bird.width * 0.35, -bird.height * 0.05);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.width * 0.3, -bird.height * 0.18, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = config.wingColor;
    ctx.save();
    ctx.translate(0, -bird.height * 0.05);
    ctx.rotate(wingFlap);
    ctx.beginPath();
    ctx.ellipse(0, -bird.height * 0.25, bird.width * 0.25, bird.height * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.fillStyle = config.wingColor;
    ctx.save();
    ctx.translate(0, -bird.height * 0.05);
    ctx.rotate(-wingFlap);
    ctx.beginPath();
    ctx.ellipse(0, -bird.height * 0.25, bird.width * 0.25, bird.height * 0.2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.moveTo(-bird.width * 0.35, 0);
    ctx.lineTo(-bird.width * 0.55, -bird.height * 0.15);
    ctx.lineTo(-bird.width * 0.55, bird.height * 0.15);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawBullet(bullet) {
    for (let i = 0; i < bullet.trail.length; i++) {
        const trail = bullet.trail[i];
        const alpha = (i / bullet.trail.length) * 0.5;
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(bullet.x - 1, bullet.y - 1, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawFeather(feather) {
    ctx.save();
    ctx.translate(feather.x, feather.y);
    ctx.rotate(feather.rotation);
    ctx.globalAlpha = feather.alpha;
    
    ctx.fillStyle = feather.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, feather.size, feather.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-feather.size, 0);
    ctx.lineTo(feather.size, 0);
    ctx.stroke();
    
    ctx.restore();
}

function drawShootEffect(effect) {
    ctx.strokeStyle = `rgba(255, 107, 53, ${effect.alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.stroke();
}

function drawCrosshair() {
    const x = gameState.crosshair.x;
    const y = gameState.crosshair.y;
    const size = 25;
    
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x - size - 10, y);
    ctx.lineTo(x - size + 5, y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + size - 5, y);
    ctx.lineTo(x + size + 10, y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y - size - 10);
    ctx.lineTo(x, y - size + 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y + size - 5);
    ctx.lineTo(x, y + size + 10);
    ctx.stroke();
    
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    
    for (const effect of gameState.shootEffects) {
        drawShootEffect(effect);
    }
    
    for (const bird of gameState.birds) {
        drawBird(bird);
    }
    
    for (const bullet of gameState.bulletsArray) {
        if (bullet.isActive) {
            drawBullet(bullet);
        }
    }
    
    for (const feather of gameState.feathers) {
        drawFeather(feather);
    }
    
    if (gameState.isGameStarted && !gameState.isGameOver) {
        drawCrosshair();
    }
}

function updateUI() {
    document.getElementById('scoreValue').textContent = gameState.score;
    document.getElementById('bulletsValue').textContent = gameState.bullets;
}

function gameLoop() {
    if (gameState.isGameStarted) {
        updateClouds();
        updateBirds();
        updateBullets();
        updateFeathers();
        updateShootEffects();
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    if (spawnBirdInterval) {
        clearInterval(spawnBirdInterval);
        spawnBirdInterval = null;
    }
    
    gameState = {
        score: 0,
        bullets: 20,
        maxBullets: 20,
        isGameOver: false,
        isGameStarted: true,
        birds: [],
        bulletsArray: [],
        feathers: [],
        crosshair: {
            x: canvas.width / 2,
            y: canvas.height / 2
        },
        shootEffects: [],
        clouds: gameState.clouds
    };
    
    updateUI();
    
    document.getElementById('startPanel').classList.add('hidden');
    document.getElementById('gameOverPanel').classList.add('hidden');
    
    spawnBirdInterval = setInterval(() => {
        if (!gameState.isGameOver && gameState.birds.length < 5) {
            spawnBird();
        }
    }, 1500);
    
    for (let i = 0; i < 2; i++) {
        setTimeout(() => spawnBird(), i * 500);
    }
}

function endGame() {
    gameState.isGameOver = true;
    
    if (spawnBirdInterval) {
        clearInterval(spawnBirdInterval);
    }
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOverPanel').classList.remove('hidden');
}

let spawnBirdInterval;

canvas.addEventListener('mousemove', (e) => {
    if (!gameState.isGameStarted || gameState.isGameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    gameState.crosshair.x = e.clientX - rect.left;
    gameState.crosshair.y = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    if (!gameState.isGameStarted || gameState.isGameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;
    
    shoot(targetX, targetY);
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

initClouds();
gameLoop();
