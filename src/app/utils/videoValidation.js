// src/app/utils/videoValidation.js - Video Validation Utility

/**
 * Validates and cleans YouTube video URLs to prevent "Video isn't on a watch page" errors
 */

export function isValidYouTubeVideoId(videoId) {
  if (!videoId || typeof videoId !== 'string') return false;
  
  // YouTube video IDs are 11 characters long
  if (videoId.length !== 11) return false;
  
  // Check for problematic IDs that cause errors
  const problematicIds = [
    '4Aq7szgycT4', // Known problematic ID
    'undefined',
    'null',
    ''
  ];
  
  if (problematicIds.includes(videoId)) return false;
  
  // Check if it contains only valid YouTube ID characters
  const validPattern = /^[a-zA-Z0-9_-]{11}$/;
  return validPattern.test(videoId);
}

export function cleanYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Remove duplicações de protocolo
  url = url.replace(/https:\/\/www\.youtube\.com\/watch\?v=https:\/\//, 'https://');
  url = url.replace(/https:\/\/www\.youtube\.com\/embed\/https:\/\//, 'https://');
  
  // Remove parâmetros inválidos
  url = url.replace(/\?si=.*$/, '');
  
  // Corrige embed URLs mal formadas
  if (url.includes('/embed/https://youtu.be/')) {
    const match = url.match(/\/embed\/https:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }
  }
  
  // Remove URLs que são apenas canais ou playlists
  const invalidPatterns = [
    '/@', '/channel/', '/user/', '/c/', 
    'UC3TnMJs2iCksc46bTQyd-fw',
    '3quadras_imobiliaria',
    'poweredbypilar',
    'ganzaroli.imoveis',
    'avereimoveis',
    '/playlist'
  ];
  
  for (const pattern of invalidPatterns) {
    if (url.includes(pattern)) {
      console.log('❌ URL inválida detectada (canal/playlist):', url);
      return null;
    }
  }
  
  // Verifica se é apenas URL base sem ID
  if (url === 'https://www.youtube.com/watch?v=' || 
      url === 'https://www.youtube.com/embed/' ||
      url === 'https://youtu.be/') {
    console.log('❌ URL sem ID de vídeo:', url);
    return null;
  }
  
  // Verifica se contém ID problemático específico
  if (url.includes('4Aq7szgycT4')) {
    console.log('❌ ID problemático detectado:', url);
    return null;
  }
  
  return url;
}

export function extractYouTubeVideoId(url) {
  const cleanedUrl = cleanYouTubeUrl(url);
  if (!cleanedUrl) return null;
  
  // Extract from watch URL
  const watchMatch = cleanedUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    const videoId = watchMatch[1];
    return isValidYouTubeVideoId(videoId) ? videoId : null;
  }
  
  // Extract from embed URL
  const embedMatch = cleanedUrl.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) {
    const videoId = embedMatch[1];
    return isValidYouTubeVideoId(videoId) ? videoId : null;
  }
  
  // Extract from youtu.be URL
  const shortMatch = cleanedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) {
    const videoId = shortMatch[1];
    return isValidYouTubeVideoId(videoId) ? videoId : null;
  }
  
  return null;
}

export function generateVideoMetaTags(videoId) {
  if (!isValidYouTubeVideoId(videoId)) return {};
  
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  
  return {
    openGraph: {
      videos: [{
        url: watchUrl,
        secureUrl: watchUrl,
        type: 'text/html',
        width: 1280,
        height: 720,
      }],
    },
    twitter: {
      card: "player",
      players: [{
        playerUrl: watchUrl,
        streamUrl: watchUrl,
        width: 1280,
        height: 720,
      }],
    },
    other: {
      'og:video': watchUrl,
      'og:video:url': watchUrl,
      'og:video:secure_url': watchUrl,
      'og:video:type': 'text/html',
      'og:video:width': '1280',
      'og:video:height': '720',
      'twitter:player': watchUrl,
      'twitter:player:width': '1280',
      'twitter:player:height': '720',
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": "Tour virtual do imóvel",
      "description": "Vídeo de apresentação do imóvel",
      "thumbnailUrl": [
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
      ],
      "uploadDate": new Date().toISOString(),
      "duration": 'PT3M',
      "contentUrl": watchUrl,
      "embedUrl": embedUrl,
      "potentialAction": {
        "@type": "WatchAction",
        "target": watchUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": "NPI Consultoria",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.npiconsultoria.com.br/logo.png",
          "width": 600,
          "height": 60
        }
      },
      "author": {
        "@type": "Organization",
        "name": "NPI Consultoria",
        "url": "https://www.npiconsultoria.com.br"
      }
    }
  };
}
