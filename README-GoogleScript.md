# Music Player with reCAPTCHA - Google Apps Script Version

This version uses Google Apps Script as the backend server instead of Node.js, making it completely serverless and free to host.

## Files

- `google-apps-script.js` - The server-side code to deploy in Google Apps Script
- `music-player-gas.js` - Frontend JavaScript that communicates with Google Apps Script
- `index-gas.html` - HTML page that uses the Google Apps Script version

## Setup Instructions

### 1. Deploy Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Click "New project"
3. Replace the default `Code.gs` content with the code from `google-apps-script.js`
4. Update the `MUSIC_FILES` array in the script with your actual music metadata:
   ```javascript
   MUSIC_FILES: [
     {
       id: 1,
       filename: 'your-song.mp3',
       title: 'Your Song Title',
       url: '/music/your-song.mp3'  // or full URL to your music files
     }
     // Add more songs...
   ]
   ```
5. Save the project (Ctrl+S)
6. Click "Deploy" > "New deployment"
7. Choose type: "Web app"
8. Description: "Music Player API"
9. Execute as: "Me"
10. Who has access: "Anyone"
11. Click "Deploy"
12. Copy the web app URL (looks like: `https://script.google.com/macros/s/ABC123.../exec`)

### 2. Update Frontend Configuration

1. Open `music-player-gas.js`
2. Replace `YOUR_SCRIPT_ID` in the `WEB_APP_URL` with your actual Google Apps Script URL:
   ```javascript
   const GAS_CONFIG = {
       WEB_APP_URL: 'https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec',
       // ... rest of config
   };
   ```

### 3. Host the Frontend

You can host the frontend files (`index-gas.html`, `music-player-gas.js`) on:

- **GitHub Pages**: Push to a repository and enable Pages
- **Netlify**: Drag and drop the files
- **Vercel**: Deploy from GitHub or upload files
- **Any static hosting service**

## Features

- ✅ reCAPTCHA v3 bot detection
- ✅ Play statistics tracking
- ✅ Persistent storage using Google Apps Script Properties
- ✅ No server costs (runs on Google's infrastructure)
- ✅ Automatic CORS handling
- ✅ Real-time verification with Google's reCAPTCHA API

## API Endpoints

The Google Apps Script provides these endpoints:

### GET Requests
- `?action=music-list` - Get list of available music files
- `?action=stats` - Get play statistics
- `?action=song-stats&songId=1` - Get stats for specific song

### POST Requests
- Body: `{"action": "verify-play", "token": "...", "songId": "1", "action": "play_music"}`
- Body: `{"action": "reset-stats"}`

## Configuration

In `google-apps-script.js`, you can modify:

- `RECAPTCHA_SECRET_KEY` - Your reCAPTCHA secret key
- `BOT_SCORE_THRESHOLD` - Minimum score to allow play (0.0-1.0)
- `MUSIC_FILES` - Array of your music file metadata

## Advantages over Node.js Version

1. **No server costs** - Runs on Google's free tier
2. **No server maintenance** - Google handles all infrastructure
3. **Built-in scaling** - Automatically handles traffic spikes
4. **Persistent storage** - Uses Google's PropertiesService for stats
5. **Easy deployment** - Just copy/paste code and click deploy

## Limitations

1. **6 minutes execution timeout** per request (plenty for this use case)
2. **Music files must be hosted elsewhere** (Google Drive, CDN, etc.)
3. **20 concurrent executions** on free tier
4. **Daily quotas** apply but are generous for typical usage

## Testing

You can test the Google Apps Script directly:

1. In the script editor, click "Run" > "testScript"
2. Check the execution log for test results
3. Test API endpoints using the web app URL

## Troubleshooting

- **"Script function not found"**: Make sure you deployed as a web app, not as an API executable
- **CORS errors**: Google Apps Script automatically handles CORS for web apps
- **"Authorization required"**: Set execute permissions to "Anyone" in deployment settings
- **Empty music list**: Update the MUSIC_FILES array in the Google Apps Script