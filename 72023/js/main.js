(function () {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);

    window.addEventListener('resize', () => {
        game.resize();
    });

    requestAnimationFrame((t) => game.loop(t));
})();
