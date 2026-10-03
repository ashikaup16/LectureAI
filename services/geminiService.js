const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Initialize Gemini client
 */
function getClient(apiKey) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

/**
 * Generate full lecture suite (Summary, Cornell Notes, Quiz, Flashcards) using Gemini
 */
async function generateAllWithGemini(apiKey, transcriptData, metadata) {
  const genAI = getClient(apiKey);
  if (!genAI) {
    throw new Error('No Gemini API key provided.');
  }

  // Use fast and efficient gemini-1.5-flash or gemini-2.0-flash
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  });

  const prompt = `
You are LectureAI, a world-class academic tutor and lecture note-taking specialist.
Analyze the following lecture transcript and metadata to generate a comprehensive, highly-structured study packet.

LECTURE METADATA:
Title: "${metadata.title}"
Instructor/Channel: "${metadata.author}"
Duration: ${transcriptData.formattedDuration}

TRANSCRIPT EXCERPTS WITH TIMESTAMPS:
${transcriptData.chunks.slice(0, 30).map(c => `[${c.timestamp}] ${c.text}`).join('\n\n')}

YOU MUST RESPOND WITH STRICT JSON ONLY MATCHING THIS SCHEMA:
{
  "summary": {
    "tldr": "string: 2-3 sentence executive summary of the lecture",
    "keyTakeaways": [
      {
        "icon": "emoji like 🎯, 💡, ⚡, 🔬, 📌",
        "text": "string: concise key takeaway point",
        "timestamp": "MM:SS of when this was discussed"
      }
    ],
    "topics": [
      {
        "topicTitle": "string: section or concept title",
        "timestamp": "MM:SS",
        "overview": "string: clear summary of this section",
        "points": ["string: detailed bullet 1", "string: detailed bullet 2"]
      }
    ],
    "keyConcepts": ["string: term 1", "string: term 2", "string: term 3"],
    "estimatedReadingTime": "string: e.g. '4 min read'"
  },
  "notes": {
    "cornell": {
      "rows": [
        {
          "cue": "string: thought-provoking question or key term",
          "timestamp": "MM:SS",
          "notes": ["string: detailed explanation point 1", "string: detailed explanation point 2"]
        }
      ],
      "summary": "string: cohesive Cornell synthesis summary paragraph"
    },
    "markdown": "string: fully formatted markdown lecture notes with headings, bold terms, bullet points, and code/formulas if applicable"
  },
  "quiz": {
    "quizTitle": "string: Quiz title",
    "totalQuestions": 5,
    "passingScore": 80,
    "questions": [
      {
        "id": 1,
        "question": "string: challenging and clear conceptual multiple choice question based strictly on lecture content",
        "options": ["string: Option A", "string: Option B", "string: Option C", "string: Option D"],
        "correctAnswerIndex": 0,
        "explanation": "string: why this answer is correct, referencing concepts from the lecture",
        "timestamp": "MM:SS"
      }
    ]
  },
  "flashcards": [
    {
      "id": 1,
      "front": "string: Question or Concept",
      "back": "string: Clear concise definition or answer",
      "hint": "string: helpful memory cue",
      "timestamp": "MM:SS"
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const parsed = JSON.parse(responseText);

  // Normalize timestamps to include start seconds for interactive video player seeking
  const timeToSec = (tStr) => {
    if (!tStr) return 0;
    const parts = tStr.split(':').map(Number);
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    return 0;
  };

  if (parsed.summary && parsed.summary.keyTakeaways) {
    parsed.summary.keyTakeaways.forEach(k => k.start = timeToSec(k.timestamp));
  }
  if (parsed.summary && parsed.summary.topics) {
    parsed.summary.topics.forEach(t => t.start = timeToSec(t.timestamp));
  }
  if (parsed.notes && parsed.notes.cornell && parsed.notes.cornell.rows) {
    parsed.notes.cornell.rows.forEach(r => r.start = timeToSec(r.timestamp));
  }
  if (parsed.quiz && parsed.quiz.questions) {
    parsed.quiz.questions.forEach(q => q.start = timeToSec(q.timestamp));
  }
  if (parsed.flashcards) {
    parsed.flashcards.forEach(f => f.start = timeToSec(f.timestamp));
  }

  return parsed;
}

/**
 * Ask Gemini questions about the lecture
 */
async function answerWithGemini(apiKey, query, transcriptText, metadata) {
  const genAI = getClient(apiKey);
  if (!genAI) {
    throw new Error('No Gemini API key provided.');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.3
    }
  });

  const prompt = `
You are the AI Professor and Teaching Assistant for the lecture "${metadata.title}" by ${metadata.author}.
Answer the student's question accurately using the provided transcript as truth.
Provide an encouraging, clear, academic yet accessible answer.
If the answer is discussed at specific moments in the lecture, cite the approximate timestamp (e.g. [04:15]).

TRANSCRIPT:
${transcriptText.slice(0, 15000)}

STUDENT QUESTION:
"${query}"
`;

  const result = await model.generateContent(prompt);
  return {
    answer: result.response.text(),
    query
  };
}

module.exports = {
  generateAllWithGemini,
  answerWithGemini
};
