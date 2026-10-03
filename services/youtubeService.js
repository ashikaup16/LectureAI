const { YoutubeTranscript } = require('youtube-transcript');

/**
 * Extracts 11-character YouTube video ID from various URL formats.
 */
function extractVideoId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If already 11 characters alphanumeric/dashes/underscores
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex patterns for YouTube URLs
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    /^https?:\/\/(?:www\.)?youtube\.com\/live\/([\w-]{11})/,
    /^https?:\/\/(?:www\.)?youtube\.com\/clip\/([\w-]+)/
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }

  return null;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds) {
  const secNum = Math.floor(seconds);
  const hours = Math.floor(secNum / 3600);
  const minutes = Math.floor((secNum % 3600) / 60);
  const secs = secNum % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Fetch video metadata via YouTube oEmbed
 */
async function fetchVideoMetadata(videoId) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) {
      throw new Error(`oEmbed failed with status: ${res.status}`);
    }
    const data = await res.json();
    return {
      title: data.title || 'Untitled Lecture',
      author: data.author_name || 'YouTube Educator',
      authorUrl: data.author_url || '',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      fallbackThumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoId
    };
  } catch (err) {
    return {
      title: `Lecture Video (${videoId})`,
      author: 'YouTube Educator',
      authorUrl: '',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      fallbackThumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoId
    };
  }
}

/**
 * Fetch transcript with language fallback
 */
async function fetchTranscript(videoId) {
  let segments = [];
  try {
    // Try English first
    segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  } catch (err) {
    // Fallback without language constraint
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (fallbackErr) {
      throw new Error(
        `Could not retrieve transcript for video "${videoId}". The video might have subtitles disabled or be unavailable. ` +
        `You can also paste the transcript or notes directly in the "Custom Text" tab.`
      );
    }
  }

  if (!segments || segments.length === 0) {
    throw new Error('No transcript content found for this video.');
  }

  // Clean and format segments
  const formattedSegments = segments.map((seg, idx) => {
    // Decode HTML entities if any
    const text = (seg.text || '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, ' ')
      .trim();

    const startSeconds = Math.round((seg.offset || 0) / 1000);
    const durationSeconds = Math.round((seg.duration || 0) / 1000);

    return {
      index: idx,
      start: startSeconds,
      end: startSeconds + durationSeconds,
      timestamp: formatTime(startSeconds),
      text
    };
  }).filter(s => s.text.length > 0);

  // Group into logical paragraphs / time chunks (~30-60 seconds each)
  const chunks = [];
  let currentChunk = {
    start: formattedSegments[0].start,
    timestamp: formattedSegments[0].timestamp,
    text: ''
  };

  for (const seg of formattedSegments) {
    if (seg.start - currentChunk.start > 60 && currentChunk.text.length > 150) {
      chunks.push({ ...currentChunk, text: currentChunk.text.trim() });
      currentChunk = {
        start: seg.start,
        timestamp: seg.timestamp,
        text: seg.text + ' '
      };
    } else {
      currentChunk.text += seg.text + ' ';
    }
  }
  if (currentChunk.text.trim()) {
    chunks.push({ ...currentChunk, text: currentChunk.text.trim() });
  }

  const fullText = formattedSegments.map(s => s.text).join(' ');

  return {
    videoId,
    totalSegments: formattedSegments.length,
    durationSeconds: formattedSegments[formattedSegments.length - 1].end,
    formattedDuration: formatTime(formattedSegments[formattedSegments.length - 1].end),
    segments: formattedSegments,
    chunks,
    fullText
  };
}

module.exports = {
  extractVideoId,
  formatTime,
  fetchVideoMetadata,
  fetchTranscript
};
