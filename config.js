const CONFIG = {
    RECAPTCHA_SITE_KEY: '6LdpPnQrAAAAAOZJpoYQBVjzmhORG2HBZ8ZbFxEO',
    RECAPTCHA_SECRET_KEY: '6LdpPnQrAAAAAPEfm0nN97g-u7dP1f8hRm2kjoAO',
    
    BOT_SCORE_THRESHOLD: 0.5,
    
    GITHUB_PAGES_MODE: true
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}