const Themes = (function() {
    const themes = {
        wood: {
            name: '木质',
            boardBackground: 'linear-gradient(145deg, #dcb35c 0%, #c9a227 50%, #b8960f 100%)',
            boardLineColor: '#5a4a3a',
            starPointColor: '#3d2914',
            bodyBackground: 'linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 100%)',
            buttonBackground: 'linear-gradient(145deg, #8b6914, #6b4f0f)',
            buttonHover: 'linear-gradient(145deg, #9d7818, #7d5c12)',
            textColor: '#3d2914',
            settingsBg: 'rgba(255, 255, 255, 0.6)'
        },
        classic: {
            name: '经典',
            boardBackground: 'linear-gradient(145deg, #f0e6d2 0%, #e6d9c0 50%, #d4c4a8 100%)',
            boardLineColor: '#333333',
            starPointColor: '#222222',
            bodyBackground: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            buttonBackground: 'linear-gradient(145deg, #495057, #343a40)',
            buttonHover: 'linear-gradient(145deg, #5a6268, #3d4246)',
            textColor: '#212529',
            settingsBg: 'rgba(255, 255, 255, 0.8)'
        },
        ocean: {
            name: '海洋',
            boardBackground: 'linear-gradient(145deg, #a8dadc 0%, #457b9d 50%, #1d3557 100%)',
            boardLineColor: '#1d3557',
            starPointColor: '#0d1b2a',
            bodyBackground: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
            buttonBackground: 'linear-gradient(145deg, #0077b6, #023e8a)',
            buttonHover: 'linear-gradient(145deg, #0096c7, #0077b6)',
            textColor: '#1d3557',
            settingsBg: 'rgba(255, 255, 255, 0.7)'
        },
        matcha: {
            name: '抹茶',
            boardBackground: 'linear-gradient(145deg, #d4e4bc 0%, #9dc08b 50%, #709775 100%)',
            boardLineColor: '#415d43',
            starPointColor: '#2d4a2e',
            bodyBackground: 'linear-gradient(135deg, #f1f7ed 0%, #e8f5e0 100%)',
            buttonBackground: 'linear-gradient(145deg, #6a994e, #386641)',
            buttonHover: 'linear-gradient(145deg, #84a98c, #52796f)',
            textColor: '#2d4a2e',
            settingsBg: 'rgba(255, 255, 255, 0.7)'
        }
    };

    let currentTheme = 'wood';

    function applyTheme(themeName) {
        if (!themes[themeName]) return;

        currentTheme = themeName;
        const theme = themes[themeName];

        document.body.style.background = theme.bodyBackground;
        document.body.style.setProperty('--board-bg', theme.boardBackground);
        document.body.style.setProperty('--board-line-color', theme.boardLineColor);
        document.body.style.setProperty('--star-point-color', theme.starPointColor);
        document.body.style.setProperty('--text-color', theme.textColor);
        document.body.style.setProperty('--settings-bg', theme.settingsBg);
        document.body.style.setProperty('--btn-bg', theme.buttonBackground);
        document.body.style.setProperty('--btn-hover', theme.buttonHover);

        const styleId = 'dynamic-theme-styles';
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = `
            .board { background: ${theme.boardBackground} !important; }
            .intersection::before, .intersection::after { background: ${theme.boardLineColor} !important; }
            .star-point { background: ${theme.starPointColor} !important; }
            .title, .subtitle, .label { color: ${theme.textColor} !important; }
            .game-settings, .game-info { background: ${theme.settingsBg} !important; }
            .btn { background: ${theme.buttonBackground} !important; }
            .btn:hover { background: ${theme.buttonHover} !important; }
            .panel-section h3 { color: ${theme.textColor} !important; }
        `;
    }

    function getCurrentTheme() {
        return currentTheme;
    }

    function getThemeList() {
        return Object.keys(themes).map(key => ({
            id: key,
            name: themes[key].name
        }));
    }

    return {
        applyTheme,
        getCurrentTheme,
        getThemeList
    };
})();
