/**
 * Google Apps Script Server for Music Player with reCAPTCHA Bot Detection
 * 
 * Deploy this as a web app in Google Apps Script:
 * 1. Go to script.google.com
 * 2. Create new project
 * 3. Paste this code
 * 4. Deploy as web app with execute permissions for "Anyone"
 * 5. Copy the web app URL to use in your frontend
 */

// Configuration - Update these values
const CONFIG = {
  RECAPTCHA_SECRET_KEY: '6LdpPnQrAAAAAPEfm0nN97g-u7dP1f8hRm2kjoAO',
  BOT_SCORE_THRESHOLD: 0.5,
  
  // Sample music files - replace with your actual music metadata
  MUSIC_FILES: [
    {
      id: 1,
      filename: '1-bigman.mp3',
      title: 'Big Man',
      url: '/music/1-bigman.mp3'
    },
    {
      id: 2,
      filename: '2-cryochill.mp3', 
      title: 'Cryo Chill',
      url: '/music/2-cryochill.mp3'
    },
    {
      id: 3,
      filename: '3-yourface.mp3',
      title: 'Your Face',
      url: '/music/3-yourface.mp3'
    }
  ]
};

// Global stats storage using PropertiesService
function getStats() {
  const props = PropertiesService.getScriptProperties();
  const statsJson = props.getProperty('playStats');
  
  if (!statsJson) {
    const defaultStats = {
      totalVerifications: 0,
      verifiedPlays: 0,
      blockedPlays: 0,
      songStats: {}
    };
    props.setProperty('playStats', JSON.stringify(defaultStats));
    return defaultStats;
  }
  
  return JSON.parse(statsJson);
}

function saveStats(stats) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('playStats', JSON.stringify(stats));
}

// Main entry point for web app
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'verify-play':
        return handleVerifyPlay(data);
      case 'reset-stats':
        return handleResetStats();
      default:
        return createResponse(400, { error: 'Invalid action' });
    }
  } catch (error) {
    console.error('doPost error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch (action) {
      case 'music-list':
        return handleMusicList();
      case 'stats':
        return handleGetStats();
      case 'song-stats':
        return handleSongStats(e.parameter.songId);
      default:
        return createResponse(400, { error: 'Invalid action' });
    }
  } catch (error) {
    console.error('doGet error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

function handleVerifyPlay(data) {
  const { token, songId, action: expectedAction } = data;
  
  if (!token || !songId || !expectedAction) {
    return createResponse(400, {
      success: false,
      error: 'Missing required parameters'
    });
  }
  
  const stats = getStats();
  stats.totalVerifications++;
  
  try {
    const verification = verifyRecaptchaToken(token, expectedAction);
    
    if (!verification.success) {
      stats.blockedPlays++;
      saveStats(stats);
      
      return createResponse(200, {
        success: false,
        score: verification.score,
        error: verification.error
      });
    }
    
    const score = verification.score;
    const isHuman = score >= CONFIG.BOT_SCORE_THRESHOLD;
    
    // Initialize song stats if needed
    if (!stats.songStats[songId]) {
      stats.songStats[songId] = {
        totalAttempts: 0,
        verifiedPlays: 0,
        blockedPlays: 0,
        scoreHistory: []
      };
    }
    
    stats.songStats[songId].totalAttempts++;
    stats.songStats[songId].scoreHistory.push({
      score: score,
      timestamp: new Date().toISOString(),
      verified: isHuman
    });
    
    // Keep only last 50 scores to prevent storage bloat
    if (stats.songStats[songId].scoreHistory.length > 50) {
      stats.songStats[songId].scoreHistory = stats.songStats[songId].scoreHistory.slice(-50);
    }
    
    if (isHuman) {
      stats.verifiedPlays++;
      stats.songStats[songId].verifiedPlays++;
      
      console.log(`Verified play for song ${songId} - Score: ${score}`);
      
      saveStats(stats);
      
      return createResponse(200, {
        success: true,
        score: score,
        message: 'Play verified as human'
      });
    } else {
      stats.blockedPlays++;
      stats.songStats[songId].blockedPlays++;
      
      console.log(`Blocked potential bot play for song ${songId} - Score: ${score}`);
      
      saveStats(stats);
      
      return createResponse(200, {
        success: false,
        score: score,
        message: `Play blocked - bot score too low (${score})`
      });
    }
    
  } catch (error) {
    console.error('Verification error:', error);
    stats.blockedPlays++;
    saveStats(stats);
    
    return createResponse(500, {
      success: false,
      score: 0,
      error: 'Internal server error'
    });
  }
}

function verifyRecaptchaToken(token, expectedAction) {
  try {
    const url = 'https://www.google.com/recaptcha/api/siteverify';
    const payload = {
      'secret': CONFIG.RECAPTCHA_SECRET_KEY,
      'response': token
    };
    
    const options = {
      'method': 'POST',
      'payload': payload
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    
    const { success, score, action, challenge_ts, hostname, 'error-codes': errorCodes } = data;
    
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
      score: score || 0.5, // Default score if not provided
      action: action,
      timestamp: challenge_ts,
      hostname: hostname
    };
    
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, score: 0, error: 'Network error' };
  }
}

function handleMusicList() {
  return createResponse(200, CONFIG.MUSIC_FILES);
}

function handleGetStats() {
  const stats = getStats();
  const detailedStats = {
    ...stats,
    threshold: CONFIG.BOT_SCORE_THRESHOLD,
    verificationRate: stats.totalVerifications > 0 
      ? (stats.verifiedPlays / stats.totalVerifications * 100).toFixed(2) + '%'
      : '0%'
  };
  
  return createResponse(200, detailedStats);
}

function handleSongStats(songId) {
  if (!songId) {
    return createResponse(400, { error: 'Song ID required' });
  }
  
  const stats = getStats();
  const songStats = stats.songStats[songId];
  
  if (!songStats) {
    return createResponse(404, { error: 'Song not found' });
  }
  
  const recentScores = songStats.scoreHistory
    .slice(-10)
    .map(entry => ({
      score: entry.score,
      timestamp: entry.timestamp,
      verified: entry.verified
    }));
  
  const response = {
    songId: songId,
    ...songStats,
    recentScores: recentScores,
    averageScore: songStats.scoreHistory.length > 0
      ? (songStats.scoreHistory.reduce((sum, entry) => sum + entry.score, 0) / songStats.scoreHistory.length).toFixed(3)
      : 0
  };
  
  return createResponse(200, response);
}

function handleResetStats() {
  const defaultStats = {
    totalVerifications: 0,
    verifiedPlays: 0,
    blockedPlays: 0,
    songStats: {}
  };
  
  saveStats(defaultStats);
  
  return createResponse(200, {
    success: true,
    message: 'Stats reset successfully'
  });
}

function createResponse(statusCode, data) {
  const response = ContentService.createTextOutput(JSON.stringify(data));
  response.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  if (statusCode !== 200) {
    // For non-200 responses, we still return 200 but include error info in body
    // This is because Google Apps Script web apps always return 200
    return response;
  }
  
  return response;
}

// Utility function to test the script
function testScript() {
  console.log('Testing Google Apps Script server...');
  
  // Test music list
  const musicResponse = handleMusicList();
  console.log('Music list:', musicResponse.getContent());
  
  // Test stats
  const statsResponse = handleGetStats();
  console.log('Stats:', statsResponse.getContent());
  
  console.log('Test completed');
}

/**
 * Setup instructions:
 * 
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Replace the default code with this script
 * 4. Update CONFIG.MUSIC_FILES with your actual music metadata
 * 5. Save the project
 * 6. Click "Deploy" > "New deployment"
 * 7. Choose type: "Web app"
 * 8. Execute as: "Me"
 * 9. Who has access: "Anyone"
 * 10. Click "Deploy"
 * 11. Copy the web app URL
 * 12. Update your frontend to use this URL instead of the Node.js server
 * 
 * Example frontend API calls:
 * - GET: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=music-list
 * - GET: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=stats
 * - POST: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
 *   Body: {"action": "verify-play", "token": "...", "songId": "1", "action": "play_music"}
 */