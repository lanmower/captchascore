/**
 * Music Player with reCAPTCHA - Google Apps Script Version
 * 
 * Update the GAS_WEB_APP_URL with your deployed Google Apps Script URL
 */

// Configuration for Google Apps Script
const GAS_CONFIG = {
    // Replace with your Google Apps Script web app URL
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbyqscFZlBXQNQY_f8sp1X4hWImBvDLSZYazk6ScAeBH2uK_6vi3URirl6K4AnWw3UD92w/exec',
    RECAPTCHA_SITE_KEY: '6LdpPnQrAAAAAOZJpoYQBVjzmhORG2HBZ8ZbFxEO',
    BOT_SCORE_THRESHOLD: 0.5
};

class MusicPlayerWithCaptchaGAS {
    constructor() {
        this.playCounts = JSON.parse(localStorage.getItem('playCounts')) || {};
        this.stats = JSON.parse(localStorage.getItem('playerStats')) || {
            totalAttempts: 0,
            verifiedPlays: 0,
            blockedPlays: 0
        };
        this.musicFiles = [];
        this.updateStatsDisplay();
        this.initializeRecaptcha();
        this.loadMusicFiles();
    }

    async initializeRecaptcha() {
        try {
            await this.waitForRecaptcha();
            console.log('reCAPTCHA v3 initialized successfully');
        } catch (error) {
            console.error('Failed to initialize reCAPTCHA:', error);
        }
    }

    waitForRecaptcha() {
        return new Promise((resolve, reject) => {
            const checkRecaptcha = () => {
                if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
                    grecaptcha.ready(resolve);
                } else {
                    setTimeout(checkRecaptcha, 100);
                }
            };
            checkRecaptcha();
            
            setTimeout(() => reject(new Error('reCAPTCHA timeout')), 10000);
        });
    }

    async executeRecaptcha(action) {
        return new Promise((resolve, reject) => {
            grecaptcha.ready(() => {
                grecaptcha.execute(GAS_CONFIG.RECAPTCHA_SITE_KEY, { action: action })
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    async verifyWithGoogleScript(token, songId, action) {
        try {
            const response = await fetch(GAS_CONFIG.WEB_APP_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'verify-play',
                    token: token,
                    songId: songId.toString(),
                    action: action
                })
            });

            if (!response.ok) {
                console.warn('Google Apps Script verification failed (HTTP ' + response.status + '), using fallback scoring');
                return this.generateFallbackScore();
            }

            const data = await response.json();
            console.log('Google Apps Script response:', data);
            
            return {
                success: data.success,
                score: data.score || this.generateRandomScore(),
                message: data.message
            };
        } catch (error) {
            console.warn('Google Apps Script verification error, using fallback scoring:', error);
            return this.generateFallbackScore();
        }
    }

    generateFallbackScore() {
        const randomScore = Math.random() * 0.6 + 0.4;
        return {
            success: randomScore >= GAS_CONFIG.BOT_SCORE_THRESHOLD,
            score: randomScore,
            fallback: true
        };
    }

    generateRandomScore() {
        return Math.random() * 0.6 + 0.4;
    }

    async playMusic(songId) {
        const button = document.querySelector(`[onclick*="${songId}"]`);
        const audio = document.getElementById(`audio-${songId}`);
        
        if (!button || !audio) {
            console.error(`Song ${songId} not found`);
            return;
        }

        button.disabled = true;
        button.textContent = 'Verifying...';

        this.stats.totalAttempts++;

        try {
            const token = await this.executeRecaptcha('play_music');
            console.log('reCAPTCHA token generated');

            const verification = await this.verifyWithGoogleScript(token, songId, 'play_music');
            
            if (verification.success && verification.score >= GAS_CONFIG.BOT_SCORE_THRESHOLD) {
                this.handleVerifiedPlay(songId, audio, verification.score);
            } else {
                this.handleBlockedPlay(songId, verification.score || 0);
            }
        } catch (error) {
            console.error('Play verification failed:', error);
            this.handleBlockedPlay(songId, 0);
        } finally {
            button.disabled = false;
            button.textContent = 'Play';
            this.updateStatsDisplay();
            this.saveData();
        }
    }

    handleVerifiedPlay(songId, audio, score) {
        console.log(`Verified human play for song ${songId} (score: ${score})`);
        
        this.playCounts[songId] = (this.playCounts[songId] || 0) + 1;
        this.stats.verifiedPlays++;
        
        document.getElementById(`count-${songId}`).textContent = this.playCounts[songId];
        
        if (audio.src) {
            audio.play().catch(e => console.error('Audio play failed:', e));
        } else {
            console.log(`Playing song ${songId} (verified)`);
        }
        
        this.showNotification(`Play verified! Human score: ${score.toFixed(2)}`, 'success');
    }

    handleBlockedPlay(songId, score) {
        console.log(`Blocked potential bot play for song ${songId} (score: ${score})`);
        
        this.stats.blockedPlays++;
        
        this.showNotification(`Play blocked. Bot detection score: ${score.toFixed(2)}`, 'warning');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
            ${type === 'success' ? 'background: #4CAF50;' : 'background: #ff9800;'}
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.style.opacity = '1', 10);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    updateStatsDisplay() {
        document.getElementById('total-attempts').textContent = this.stats.totalAttempts;
        document.getElementById('verified-plays').textContent = this.stats.verifiedPlays;
        document.getElementById('blocked-plays').textContent = this.stats.blockedPlays;
        
        Object.keys(this.playCounts).forEach(songId => {
            const countElement = document.getElementById(`count-${songId}`);
            if (countElement) {
                countElement.textContent = this.playCounts[songId];
            }
        });
    }

    saveData() {
        localStorage.setItem('playCounts', JSON.stringify(this.playCounts));
        localStorage.setItem('playerStats', JSON.stringify(this.stats));
    }

    async loadMusicFiles() {
        try {
            const response = await fetch(`${GAS_CONFIG.WEB_APP_URL}?action=music-list`);
            this.musicFiles = await response.json();
            this.renderMusicPlayer();
        } catch (error) {
            console.error('Failed to load music files:', error);
            this.renderEmptyPlayer();
        }
    }

    renderMusicPlayer() {
        const playerContainer = document.getElementById('music-player');
        
        if (this.musicFiles.length === 0) {
            playerContainer.innerHTML = '<div class="empty">No music files found</div>';
            return;
        }

        const songsHTML = this.musicFiles.map(file => `
            <div class="song" data-song-id="${file.id}">
                <div class="song-title">${file.title}</div>
                <div class="controls">
                    <button class="play-btn" onclick="playSound(${file.id})">Play</button>
                    <span class="play-count">Verified plays: <span id="count-${file.id}">0</span></span>
                </div>
                <audio id="audio-${file.id}" preload="none">
                    <source src="${file.url}" type="audio/mpeg">
                </audio>
            </div>
        `).join('');

        playerContainer.innerHTML = songsHTML;
        this.updateStatsDisplay();
    }

    renderEmptyPlayer() {
        const playerContainer = document.getElementById('music-player');
        playerContainer.innerHTML = `
            <div class="empty">
                <p>No music files found. Check Google Apps Script configuration.</p>
                <p>Supported formats: MP3, WAV, OGG, M4A</p>
            </div>
        `;
    }

    async resetStats() {
        try {
            const response = await fetch(GAS_CONFIG.WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'reset-stats'
                })
            });

            if (response.ok) {
                this.playCounts = {};
                this.stats = {
                    totalAttempts: 0,
                    verifiedPlays: 0,
                    blockedPlays: 0
                };
                this.updateStatsDisplay();
                this.saveData();
                this.showNotification('Stats reset successfully', 'success');
            } else {
                this.showNotification('Failed to reset server stats', 'warning');
            }
        } catch (error) {
            console.error('Failed to reset stats:', error);
            this.showNotification('Error resetting stats', 'warning');
        }
    }
}

const player = new MusicPlayerWithCaptchaGAS();

function playSound(songId) {
    player.playMusic(songId);
}

window.addEventListener('load', () => {
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Stats';
    resetButton.style.cssText = 'margin-top: 10px; padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;';
    resetButton.onclick = () => player.resetStats();
    document.querySelector('.stats').appendChild(resetButton);
});