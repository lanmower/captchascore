const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const CONFIG = require('./config');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));
app.use('/music', express.static('music'));

const playStats = {
    totalVerifications: 0,
    verifiedPlays: 0,
    blockedPlays: 0,
    songStats: {}
};

async function verifyRecaptchaToken(token, expectedAction) {
    try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: CONFIG.RECAPTCHA_SECRET_KEY,
                response: token
            }
        });

        const { success, score, action, challenge_ts, hostname, 'error-codes': errorCodes } = response.data;

        if (!success) {
            console.log('reCAPTCHA verification failed:', errorCodes);
            return { success: false, score: 0, error: 'Verification failed' };
        }

        if (action !== expectedAction) {
            console.log(`Action mismatch: expected ${expectedAction}, got ${action}`);
            return { success: false, score: 0, error: 'Action mismatch' };
        }

        return {
            success: true,
            score: score,
            action: action,
            timestamp: challenge_ts,
            hostname: hostname
        };
    } catch (error) {
        console.error('reCAPTCHA verification error:', error.message);
        return { success: false, score: 0, error: 'Network error' };
    }
}

app.post('/api/verify-play', async (req, res) => {
    const { token, songId, action } = req.body;

    if (!token || !songId || !action) {
        return res.status(400).json({
            success: false,
            error: 'Missing required parameters'
        });
    }

    playStats.totalVerifications++;

    try {
        const verification = await verifyRecaptchaToken(token, action);
        
        if (!verification.success) {
            playStats.blockedPlays++;
            return res.json({
                success: false,
                score: verification.score,
                error: verification.error
            });
        }

        const score = verification.score;
        const isHuman = score >= CONFIG.BOT_SCORE_THRESHOLD;

        if (!playStats.songStats[songId]) {
            playStats.songStats[songId] = {
                totalAttempts: 0,
                verifiedPlays: 0,
                blockedPlays: 0,
                scoreHistory: []
            };
        }

        playStats.songStats[songId].totalAttempts++;
        playStats.songStats[songId].scoreHistory.push({
            score: score,
            timestamp: new Date().toISOString(),
            verified: isHuman
        });

        if (isHuman) {
            playStats.verifiedPlays++;
            playStats.songStats[songId].verifiedPlays++;
            
            console.log(`Verified play for song ${songId} - Score: ${score}`);
            
            res.json({
                success: true,
                score: score,
                message: 'Play verified as human'
            });
        } else {
            playStats.blockedPlays++;
            playStats.songStats[songId].blockedPlays++;
            
            console.log(`Blocked potential bot play for song ${songId} - Score: ${score}`);
            
            res.json({
                success: false,
                score: score,
                message: `Play blocked - bot score too low (${score})`
            });
        }

    } catch (error) {
        console.error('Verification error:', error);
        playStats.blockedPlays++;
        
        res.status(500).json({
            success: false,
            score: 0,
            error: 'Internal server error'
        });
    }
});

app.get('/api/stats', (req, res) => {
    const detailedStats = {
        ...playStats,
        threshold: CONFIG.BOT_SCORE_THRESHOLD,
        verificationRate: playStats.totalVerifications > 0 
            ? (playStats.verifiedPlays / playStats.totalVerifications * 100).toFixed(2) + '%'
            : '0%'
    };

    res.json(detailedStats);
});

app.get('/api/song-stats/:songId', (req, res) => {
    const songId = req.params.songId;
    const songStats = playStats.songStats[songId];

    if (!songStats) {
        return res.status(404).json({
            error: 'Song not found'
        });
    }

    const recentScores = songStats.scoreHistory
        .slice(-10)
        .map(entry => ({
            score: entry.score,
            timestamp: entry.timestamp,
            verified: entry.verified
        }));

    res.json({
        songId: songId,
        ...songStats,
        recentScores: recentScores,
        averageScore: songStats.scoreHistory.length > 0
            ? (songStats.scoreHistory.reduce((sum, entry) => sum + entry.score, 0) / songStats.scoreHistory.length).toFixed(3)
            : 0
    });
});

app.get('/api/reset-stats', (req, res) => {
    playStats.totalVerifications = 0;
    playStats.verifiedPlays = 0;
    playStats.blockedPlays = 0;
    playStats.songStats = {};
    
    res.json({
        success: true,
        message: 'Stats reset successfully'
    });
});

async function getMusicFiles() {
    try {
        const musicDir = path.join(__dirname, 'music');
        const files = await fs.readdir(musicDir);
        
        const musicFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
        });

        return musicFiles.map((file, index) => ({
            id: index + 1,
            filename: file,
            title: path.basename(file, path.extname(file)),
            url: `/music/${file}`
        }));
    } catch (error) {
        console.error('Error reading music directory:', error);
        return [];
    }
}

app.get('/api/music-list', async (req, res) => {
    const musicFiles = await getMusicFiles();
    res.json(musicFiles);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Music player server running on port ${port}`);
    console.log(`Bot detection threshold: ${CONFIG.BOT_SCORE_THRESHOLD}`);
    console.log('Make sure to set your reCAPTCHA keys in config.js');
});