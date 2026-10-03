require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { extractVideoId, fetchVideoMetadata, fetchTranscript } = require('./services/youtubeService');
const { generateSummary, generateNotes, generateQuiz, generateFlashcards, answerLectureQuestion } = require('./services/fallbackService');
const { generateAllWithGemini, answerWithGemini } = require('./services/geminiService');
const { SAMPLE_LECTURES } = require('./data/samples');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// In-memory cache for fast reloads of recent analyses
const lectureCache = new Map();

/**
 * Health check & status
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasEnvGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

/**
 * Get sample curated lectures
 */
app.get('/api/samples', (req, res) => {
  res.json({
    success: true,
    samples: SAMPLE_LECTURES
  });
});

/**
 * Main Analysis Endpoint: Processes YouTube link or raw text
 */
app.post('/api/extract', async (req, res) => {
  try {
    const { url, text, title: customTitle, apiKey } = req.body;
    const clientApiKey = apiKey || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

    let videoId = null;
    let metadata = {
      title: customTitle || 'Custom Lecture Notes',
      author: 'Academic Presenter',
      authorUrl: '',
      thumbnailUrl: '',
      fallbackThumbnailUrl: '',
      videoId: null
    };

    let transcriptData = null;

    if (url) {
      videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid YouTube URL. Please provide a valid YouTube link (e.g., https://www.youtube.com/watch?v=... or youtu.be/...)'
        });
      }

      // Check cache first
      if (lectureCache.has(videoId)) {
        const cached = lectureCache.get(videoId);
        return res.json({
          success: true,
          cached: true,
          ...cached
        });
      }

      // Fetch oEmbed metadata and transcript in parallel
      const [metaResult, transcriptResult] = await Promise.allSettled([
        fetchVideoMetadata(videoId),
        fetchTranscript(videoId)
      ]);

      if (metaResult.status === 'fulfilled') {
        metadata = metaResult.value;
      }

      if (transcriptResult.status === 'rejected') {
        return res.status(422).json({
          success: false,
          error: transcriptResult.reason.message || 'Could not extract transcript from YouTube.',
          metadata
        });
      }

      transcriptData = transcriptResult.value;
    } else if (text && text.trim().length > 50) {
      // Process custom text or offline transcript
      const cleanText = text.trim();
      const sentences = cleanText.split(/(?<=[.?!])\s+/);
      const totalWords = cleanText.split(/\s+/).length;
      const estimatedSecs = Math.round((totalWords / 150) * 60);

      // Create synthetic chunks
      const chunkSize = Math.max(3, Math.floor(sentences.length / 5));
      const chunks = [];
      for (let i = 0; i < sentences.length; i += chunkSize) {
        const slice = sentences.slice(i, i + chunkSize).join(' ');
        const startSec = Math.round((i / sentences.length) * estimatedSecs);
        const mm = Math.floor(startSec / 60).toString().padStart(2, '0');
        const ss = (startSec % 60).toString().padStart(2, '0');
        chunks.push({
          start: startSec,
          timestamp: `${mm}:${ss}`,
          text: slice
        });
      }

      transcriptData = {
        videoId: null,
        totalSegments: sentences.length,
        durationSeconds: estimatedSecs,
        formattedDuration: `${Math.floor(estimatedSecs / 60)}m ${estimatedSecs % 60}s`,
        segments: chunks.map((c, i) => ({ index: i, start: c.start, end: c.start + 30, timestamp: c.timestamp, text: c.text })),
        chunks,
        fullText: cleanText
      };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a valid YouTube URL or lecture text.'
      });
    }

    let summary, notes, quiz, flashcards, provider;

    // Try Gemini AI if API key is provided
    if (clientApiKey) {
      try {
        const geminiResult = await generateAllWithGemini(clientApiKey, transcriptData, metadata);
        summary = geminiResult.summary;
        notes = geminiResult.notes;
        quiz = geminiResult.quiz;
        flashcards = geminiResult.flashcards;
        provider = 'Google Gemini 1.5 Flash';
      } catch (geminiErr) {
        console.warn('Gemini generation failed or quota reached, gracefully falling back to Built-In NLP engine:', geminiErr.message);
        summary = generateSummary(transcriptData, metadata);
        notes = generateNotes(transcriptData, metadata);
        quiz = generateQuiz(transcriptData, metadata);
        flashcards = generateFlashcards(transcriptData, metadata);
        provider = 'LectureAI Neural NLP Engine (Fallback)';
      }
    } else {
      // Use built-in NLP engine
      summary = generateSummary(transcriptData, metadata);
      notes = generateNotes(transcriptData, metadata);
      quiz = generateQuiz(transcriptData, metadata);
      flashcards = generateFlashcards(transcriptData, metadata);
      provider = 'LectureAI Neural NLP Engine';
    }

    const payload = {
      metadata,
      transcript: transcriptData,
      summary,
      notes,
      quiz,
      flashcards,
      provider
    };

    // Cache if it's a YouTube video
    if (videoId) {
      lectureCache.set(videoId, payload);
    }

    res.json({
      success: true,
      ...payload
    });

  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred while analyzing the lecture.'
    });
  }
});

/**
 * Ask AI question about current lecture
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { query, transcriptText, metadata, apiKey } = req.body;
    const clientApiKey = apiKey || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query is required.' });
    }

    if (clientApiKey && transcriptText) {
      try {
        const aiResponse = await answerWithGemini(clientApiKey, query, transcriptText, metadata || {});
        return res.json({
          success: true,
          answer: aiResponse.answer,
          provider: 'Gemini'
        });
      } catch (err) {
        console.warn('Gemini chat failed, using fallback keyword answerer:', err.message);
      }
    }

    // Fallback Q&A
    const transcriptData = {
      chunks: (req.body.chunks || []),
      fullText: transcriptText || ''
    };
    const response = answerLectureQuestion(query, transcriptData, metadata || {});
    res.json({
      success: true,
      answer: response.answer,
      relevantTimestamps: response.relevantTimestamps,
      provider: 'NLP Engine'
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to process question.'
    });
  }
});

// Fallback to index.html for SPA-style routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 LectureAI server running at: http://localhost:${PORT}`);
  console.log(`   AI Summaries, Cornell Notes, Quizzes, Flashcards & Q&A`);
  console.log(`=======================================================`);
});
