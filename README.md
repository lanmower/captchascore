# Music Player with reCAPTCHA v3 Bot Detection

A static music player that uses Google reCAPTCHA v3 to detect and filter bot plays, designed to run on GitHub Pages.

## Features

- **Bot Detection**: Uses reCAPTCHA v3 to score user interactions (0.0 = bot, 1.0 = human)
- **Score-based Filtering**: Only counts plays above configurable threshold (default: 0.5)
- **Static Site**: Runs entirely on GitHub Pages with no server required
- **Real-time Stats**: Track verified plays vs blocked bot attempts
- **Supported Formats**: MP3, WAV, OGG, M4A

## GitHub Pages Setup

1. **Fork this repository**

2. **Configure reCAPTCHA:**
   - Get reCAPTCHA v3 keys from [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
   - Edit `config.js` and replace `YOUR_RECAPTCHA_SITE_KEY_HERE` with your site key
   - Edit `index.html` and replace `YOUR_SITE_KEY` with your site key

3. **Add your music files:**
   - Upload your music files to the `music/` directory
   - Update `music-list.json` with your song information:
   ```json
   [
     {
       "id": 1,
       "filename": "your-song.mp3",
       "title": "Your Song Title",
       "url": "./music/your-song.mp3"
     }
   ]
   ```

4. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Save

5. **Access your site:**
   ```
   https://yourusername.github.io/captchascore
   ```

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run local server:**
   ```bash
   npm start
   ```

3. **Access locally:**
   ```
   http://localhost:3000
   ```

## Configuration

Edit `config.js` to customize:
- `RECAPTCHA_SITE_KEY`: Your reCAPTCHA v3 site key
- `BOT_SCORE_THRESHOLD`: Minimum score to count as human play (0.0-1.0)

## How It Works

1. User clicks play button
2. reCAPTCHA v3 generates a score (0.0-1.0) indicating bot likelihood
3. Client-side verification with fallback scoring for GitHub Pages
4. If score ≥ threshold: Play counts and music starts
5. If score < threshold: Play is blocked as potential bot

## File Structure

```
captchascore/
├── .github/workflows/  # GitHub Actions for deployment
├── music/             # Put your music files here
├── config.js          # reCAPTCHA configuration
├── index.html         # Main player interface
├── music-player.js    # Client-side player logic
├── music-list.json    # List of available music files
├── _config.yml        # Jekyll configuration
└── README.md          # This file
``` 
