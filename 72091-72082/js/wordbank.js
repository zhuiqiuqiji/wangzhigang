const wordBank = {
    english: {
        programming: [
            { word: 'JAVASCRIPT', clue: 'Web programming language' },
            { word: 'PYTHON', clue: 'Snake-named language' },
            { word: 'HTML', clue: 'Web markup language' },
            { word: 'CSS', clue: 'Web styling language' },
            { word: 'REACT', clue: 'Facebook UI framework' },
            { word: 'ANGULAR', clue: 'Google UI framework' },
            { word: 'VUE', clue: 'Evan You framework' },
            { word: 'NODE', clue: 'Server-side JS runtime' },
            { word: 'GIT', clue: 'Version control system' },
            { word: 'RUBY', clue: 'Elegant programming language' },
            { word: 'JAVA', clue: 'Sun Microsystems language' },
            { word: 'CPLUS', clue: 'C with classes' },
            { word: 'CSHARP', clue: 'Microsoft .NET language' },
            { word: 'PHP', clue: 'Web scripting language' },
            { word: 'SWIFT', clue: 'Apple programming language' },
            { word: 'KOTLIN', clue: 'JVM language by JetBrains' },
            { word: 'RUST', clue: 'Mozilla systems language' },
            { word: 'GO', clue: 'Google programming language' },
            { word: 'DOCKER', clue: 'Container platform' },
            { word: 'LINUX', clue: 'Open-source OS' }
        ],
        animals: [
            { word: 'ELEPHANT', clue: 'Largest land mammal' },
            { word: 'GIRAFFE', clue: 'Tallest land animal' },
            { word: 'PENGUIN', clue: 'Flightless Antarctic bird' },
            { word: 'DOLPHIN', clue: 'Intelligent marine mammal' },
            { word: 'KANGAROO', clue: 'Australian hopper' },
            { word: 'BUTTERFLY', clue: 'Colorful winged insect' },
            { word: 'CROCODILE', clue: 'Large aquatic reptile' },
            { word: 'HAMSTER', clue: 'Small furry pet' },
            { word: 'LEOPARD', clue: 'Spotted big cat' },
            { word: 'OCTOPUS', clue: 'Eight-armed sea creature' }
        ],
        fruits: [
            { word: 'STRAWBERRY', clue: 'Red berry with seeds' },
            { word: 'WATERMELON', clue: 'Large green summer fruit' },
            { word: 'PINEAPPLE', clue: 'Tropical fruit with crown' },
            { word: 'BLUEBERRY', clue: 'Small blue antioxidant fruit' },
            { word: 'POMEGRANATE', clue: 'Red seedy fruit' },
            { word: 'RASPBERRY', clue: 'Red tart berry' },
            { word: 'GRAPEFRUIT', clue: 'Large citrus fruit' },
            { word: 'DRAGONFRUIT', clue: 'Exotic cactus fruit' }
        ]
    },
    chinese: {
        technology: [
            { word: 'JISUANJI', clue: '处理数据的电子设备' },
            { word: 'WANGLUO', clue: '连接全球的系统' },
            { word: 'RUANJIAN', clue: '计算机程序集合' },
            { word: 'YINGJIAN', clue: '计算机物理组件' },
            { word: 'SHUJU', clue: '信息的载体' },
            { word: 'SHOUJI', clue: '便携式通讯设备' },
            { word: 'DIANNAO', clue: '个人计算设备' },
            { word: 'ZHINENG', clue: '具有智慧能力的' },
            { word: 'YUNJISUAN', clue: '网络计算服务' },
            { word: 'DAIMA', clue: '程序员编写的内容' }
        ],
        animals: [
            { word: 'DAXINGMAO', clue: '中国国宝动物' },
            { word: 'LAOHU', clue: '森林之王' },
            { word: 'SHIZI', clue: '草原之王' },
            { word: 'DAXIANG', clue: '长鼻子动物' },
            { word: 'CHANGJINGLU', clue: '脖子最长的动物' },
            { word: 'HAITUN', clue: '聪明的海洋动物' },
            { word: 'QIE', clue: '南极不会飞的鸟' },
            { word: 'HUDIE', clue: '美丽的飞虫' }
        ],
        nature: [
            { word: 'TAIYANG', clue: '太阳系中心' },
            { word: 'YUEQIANG', clue: '地球的卫星' },
            { word: 'XINGXING', clue: '夜空中闪烁的' },
            { word: 'YUNDUO', clue: '天上的棉花糖' },
            { word: 'DAYU', clue: '从云中落下的水' },
            { word: 'CAIHONG', clue: '雨后的七彩桥' },
            { word: 'SHANLIN', clue: '树木茂盛的地方' },
            { word: 'HAIYANG', clue: '蓝色的广阔水域' }
        ]
    },
    mixed: [
        { word: 'HELLO', clue: '英文问候语' },
        { word: 'WORLD', clue: '我们生活的地方' },
        { word: 'ZHONGGUO', clue: '东方文明古国' },
        { word: 'KEJI', clue: '第一生产力' },
        { word: 'CHUANGXIN', clue: '发展的动力' },
        { word: 'DREAM', clue: '心中的愿望' },
        { word: 'FUTURE', clue: '将要到来的时间' },
        { word: 'XINGFU', clue: '快乐的感觉' },
        { word: 'FRIEND', clue: '亲密的伙伴' },
        { word: 'JIAYOU', clue: '鼓励的话语' }
    ]
};

function getWordsByCategory(language, category, count = 10) {
    let words = [];
    
    if (language === 'mixed') {
        words = [...wordBank.mixed];
    } else if (wordBank[language]) {
        if (wordBank[language][category]) {
            words = [...wordBank[language][category]];
        } else {
            const categories = Object.keys(wordBank[language]);
            if (categories.length > 0) {
                words = [...wordBank[language][categories[0]]];
            }
        }
    }
    
    if (words.length === 0) {
        words = [...wordBank.mixed];
    }
    
    return shuffleArray(words).slice(0, count);
}

function getAllWords(language = null) {
    let allWords = [];
    if (language === 'mixed' || !language) {
        allWords = [...wordBank.mixed];
    }
    if (language && language !== 'mixed' && wordBank[language]) {
        Object.values(wordBank[language]).forEach(categoryWords => {
            allWords = [...allWords, ...categoryWords];
        });
    }
    if (!language) {
        Object.keys(wordBank).forEach(lang => {
            if (lang !== 'mixed') {
                Object.values(wordBank[lang]).forEach(categoryWords => {
                    allWords = [...allWords, ...categoryWords];
                });
            }
        });
        allWords = [...allWords, ...wordBank.mixed];
    }
    return shuffleArray(allWords);
}

function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
