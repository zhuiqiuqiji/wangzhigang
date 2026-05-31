const ROMAJI_MAP = {
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'n': 'ん',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ'
};

const JAPANESE_WORDS = [
    { romaji: 'konnichiwa', display: 'こんにちは' },
    { romaji: 'arigatou', display: 'ありがとう' },
    { romaji: 'sayounara', display: 'さようなら' },
    { romaji: 'sumimasen', display: 'すみません' },
    { romaji: 'gomennasai', display: 'ごめんなさい' },
    { romaji: 'ohayou', display: 'おはよう' },
    { romaji: 'konbanwa', display: 'こんばんは' },
    { romaji: 'oyasumi', display: 'おやすみ' },
    { romaji: 'hai', display: 'はい' },
    { romaji: 'iie', display: 'いいえ' },
    { romaji: 'sugoi', display: 'すごい' },
    { romaji: 'kirei', display: 'きれい' },
    { romaji: 'oishii', display: 'おいしい' },
    { romaji: 'tanoshii', display: 'たのしい' },
    { romaji: 'ureshii', display: 'うれしい' },
    { romaji: 'kanashii', display: 'かなしい' },
    { romaji: 'samishii', display: 'さみしい' },
    { romaji: 'daijoubu', display: 'だいじょうぶ' },
    { romaji: 'wakarimashita', display: 'わかりました' },
    { romaji: 'shitsureishimasu', display: 'しつれいします' }
];

const FRENCH_WORDS = [
    'bonjour', 'merci', 'au revoir', 'sil vous plait', 'de rien',
    'oui', 'non', 'bonsoir', 'bonne nuit', 'excusez-moi',
    'comment allez-vous', 'je ne sais pas', 'je suis', 'je ne comprends pas',
    'parlez-vous anglais', 'combien ça coûte', 'où est', 'je voudrais',
    's il vous plaît', 'merci beaucoup', 'de rien du tout', 'pas de problème',
    'à tout à l heure', 'à bientôt', 'au revoir', 'adieu', 'salut',
    'bonjour monsieur', 'bonjour madame', 'comment vous appelez-vous',
    'enchanté', 'ravi de vous rencontrer', 'comment ça va', 'ça va bien',
    'ça va mal', 'très bien', 'pas mal', 'super', 'génial',
    'parfait', 'excellent', 'très bon', 'délicieux', 'incroyable',
    'fantastique', 'magnifique', 'beau', 'belle', 'joli'
];

const DAILY_THEMES = [
    { name: '编程日', words: CODE_SNIPPETS.patterns, icon: '💻' },
    { name: '动物日', words: ['cat', 'dog', 'bird', 'fish', 'elephant', 'tiger', 'lion', 'bear', 'wolf', 'fox'], icon: '🦁' },
    { name: '美食日', words: ['apple', 'banana', 'orange', 'pizza', 'burger', 'sushi', 'pasta', 'bread', 'cheese', 'chocolate'], icon: '🍕' },
    { name: '自然日', words: ['sun', 'moon', 'star', 'tree', 'flower', 'river', 'mountain', 'ocean', 'forest', 'cloud'], icon: '🌿' },
    { name: '科技日', words: ['computer', 'keyboard', 'monitor', 'internet', 'software', 'hardware', 'algorithm', 'database', 'network', 'server'], icon: '🚀' },
    { name: '情感日', words: ['love', 'happy', 'sad', 'angry', 'excited', 'peaceful', 'grateful', 'hopeful', 'proud', 'brave'], icon: '❤️' },
    { name: '旅行日', words: ['airport', 'airplane', 'hotel', 'beach', 'mountain', 'city', 'village', 'adventure', 'journey', 'explore'], icon: '✈️' }
];

if (typeof window !== 'undefined') {
    window.ROMAJI_MAP = ROMAJI_MAP;
    window.JAPANESE_WORDS = JAPANESE_WORDS;
    window.FRENCH_WORDS = FRENCH_WORDS;
    window.DAILY_THEMES = DAILY_THEMES;
}
