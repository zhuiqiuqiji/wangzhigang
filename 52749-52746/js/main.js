let game;
let ui;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    game = new Game(canvas);
    ui = new UIController(game);
    game.start();

    const heroInfoPanel = document.getElementById('heroInfo');
    if (heroInfoPanel) {
        heroInfoPanel.style.display = 'none';
    }

    game.onWaveComplete = () => {
        ui.updateStartWaveButton();
    };

    setInterval(() => {
        if (game.hero && !game.hero.isDead) {
            ui.updateHeroInfo();
        }
    }, 100);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'q' || e.key === 'Q') {
            game.useSkill('freeze');
            ui.updateSkillCooldown('freeze');
        } else if (e.key === 'w' || e.key === 'W') {
            game.useSkill('meteor');
            ui.updateSkillCooldown('meteor');
        } else if (e.key === 'e' || e.key === 'E') {
            game.useSkill('goldRain');
            ui.updateSkillCooldown('goldRain');
        } else if (e.key === ' ') {
            e.preventDefault();
            game.useHeroSkill();
        } else if (e.key === '1') {
            selectTowerByIndex(0);
        } else if (e.key === '2') {
            selectTowerByIndex(1);
        } else if (e.key === '3') {
            selectTowerByIndex(2);
        } else if (e.key === '4') {
            selectTowerByIndex(3);
        } else if (e.key === '5') {
            selectTowerByIndex(4);
        } else if (e.key === '6') {
            selectTowerByIndex(5);
        }
    });
});

function selectTowerByIndex(index) {
    const towerTypes = Object.keys(TOWER_TYPES);
    if (index < towerTypes.length) {
        const type = towerTypes[index];
        const card = document.querySelector(`[data-tower-type="${type}"]`);
        if (card) {
            ui.selectTowerType(type, card);
        }
    }
}
