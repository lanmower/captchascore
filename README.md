# Music Player with reCAPTCHA v3 Bot Detection

A music player that uses Google reCAPTCHA v3 to detect and filter bot plays, ensuring accurate play counts by multiplying by the human detection score.

## Features

- **Bot Detection**: Uses reCAPTCHA v3 to score user interactions (0.0 = bot, 1.0 = human)
- **Score-based Filtering**: Only counts plays above configurable threshold (default: 0.5)
- **Dynamic Playlist**: Automatically loads music files from the `music/` directory
- **Real-time Stats**: Track verified plays vs blocked bot attempts
- **Supported Formats**: MP3, WAV, OGG, M4A

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure reCAPTCHA:**
   - Get reCAPTCHA v3 keys from [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
   - Update `config.js` with your site key and secret key
   - Update `index.html` to replace `YOUR_SITE_KEY` with your actual site key

3. **Add music files:**
   ```bash
   # Put your music files in the music directory
   cp *.mp3 music/
   ```

4. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Configuration

Edit `config.js` to customize:

- `RECAPTCHA_SITE_KEY`: Your reCAPTCHA v3 site key
- `RECAPTCHA_SECRET_KEY`: Your reCAPTCHA v3 secret key  
- `BOT_SCORE_THRESHOLD`: Minimum score to count as human play (0.0-1.0)

## How It Works

1. User clicks play button
2. reCAPTCHA v3 generates a score (0.0-1.0) indicating bot likelihood
3. Server verifies the token and checks score against threshold
4. If score ≥ threshold: Play counts and music starts
5. If score < threshold: Play is blocked as potential bot

## API Endpoints

- `POST /api/verify-play` - Verify reCAPTCHA token and score
- `GET /api/music-list` - Get list of available music files
- `GET /api/stats` - Get overall statistics
- `GET /api/song-stats/:songId` - Get stats for specific song
- `GET /api/reset-stats` - Reset all statistics

## File Structure

```
captchascore/
├── music/              # Put your music files here
├── config.js          # reCAPTCHA configuration
├── index.html         # Main player interface
├── music-player.js    # Client-side player logic
├── server.js          # Express server with verification
├── package.json       # Dependencies
└── README.md         # This file
```"# captchascore" 
