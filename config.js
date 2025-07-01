const CONFIG = {
    RECAPTCHA_SITE_KEY: 'YOUR_RECAPTCHA_SITE_KEY_HERE',
    RECAPTCHA_SECRET_KEY: 'YOUR_RECAPTCHA_SECRET_KEY_HERE',
    
    BOT_SCORE_THRESHOLD: 0.5,
    
    GITHUB_PAGES_MODE: true
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}