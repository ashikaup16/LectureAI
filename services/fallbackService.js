/**
 * Built-in Intelligent NLP Analyzer & Generator
 * Provides high-quality Summarization, Cornell Notes, Quizzes, Flashcards,
 * and Lecture Q&A without requiring an external API key.
 */

// Common English stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have',
  'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into',
  'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves', 'also', 'just', 'like', 'really', 'going', 'know', 'see', 'think', 'well', 'say', 'want',
  'kind', 'thing', 'things', 'lot', 'right', 'actually', 'mean', 'way'
]);

/**
 * Tokenize text into words
 */
function tokenize(text) {
  return (text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []).filter(w => !STOP_WORDS.has(w));
}

/**
 * Extract candidate key phrases & definitions
 */
function extractKeyConcepts(fullText, title = '') {
  // Word frequency map
  const words = tokenize(fullText);
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  // Find 2-word collocations (bigrams)
  const sentences = fullText.split(/(?<=[.?!])\s+/);
  const bigramFreq = {};
  for (const s of sentences) {
    const sWords = (s.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
    for (let i = 0; i < sWords.length - 1; i++) {
      const w1 = sWords[i];
      const w2 = sWords[i + 1];
      if (!STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
        const bi = `${w1} ${w2}`;
        bigramFreq[bi] = (bigramFreq[bi] || 0) + 1;
      }
    }
  }

  // Top concepts
  const sortedWords = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const sortedBigrams = Object.entries(bigramFreq).sort((a, b) => b[1] - a[1]);

  // Extract explicit definitions: e.g. "X is a ...", "X refers to ...", "we call this X"
  const definitions = [];
  const defPatterns = [
    /([A-Z][a-zA-Z\s]{2,25})\s+is\s+(?:defined\s+as\s+|a\s+|an\s+|the\s+)([^.]{15,120}\.)/gi,
    /([A-Z][a-zA-Z\s]{2,25})\s+refers\s+to\s+([^.]{15,120}\.)/gi,
    /(?:we call this|this is known as)\s+([a-zA-Z\s]{3,30})[,.]\s*([^.]{15,120}\.)?/gi
  ];

  for (const pat of defPatterns) {
    let m;
    while ((m = pat.exec(fullText)) !== null) {
      const term = m[1].trim();
      const explanation = (m[2] || '').trim();
      if (term.length > 2 && term.length < 35 && !STOP_WORDS.has(term.toLowerCase())) {
        definitions.push({ term, explanation: explanation || `${term} is an essential concept highlighted in this lecture.` });
      }
      if (definitions.length >= 8) break;
    }
  }

  // If definitions are sparse, build from top bigrams and top words
  const keyTerms = [];
  for (const [bi, count] of sortedBigrams.slice(0, 10)) {
    keyTerms.push(bi.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
  }
  for (const [w, count] of sortedWords.slice(0, 10)) {
    const capitalized = w.charAt(0).toUpperCase() + w.slice(1);
    if (!keyTerms.includes(capitalized)) {
      keyTerms.push(capitalized);
    }
  }

  return {
    topWords: sortedWords.slice(0, 15).map(([w]) => w),
    keyTerms: keyTerms.slice(0, 12),
    definitions: definitions.slice(0, 8)
  };
}

/**
 * Score sentences by importance based on key terms
 */
function extractImportantSentences(chunks, count = 8) {
  const allSentences = [];
  for (const chunk of chunks) {
    const sents = chunk.text.split(/(?<=[.?!])\s+/);
    for (const s of sents) {
      const trimmed = s.trim();
      if (trimmed.length > 30 && trimmed.length < 220) {
        allSentences.push({
          text: trimmed,
          timestamp: chunk.timestamp,
          start: chunk.start
        });
      }
    }
  }

  if (allSentences.length === 0) {
    return chunks.slice(0, count).map(c => ({
      text: c.text.slice(0, 150) + '...',
      timestamp: c.timestamp,
      start: c.start
    }));
  }

  // Frequency of terms across sentences
  const words = tokenize(allSentences.map(s => s.text).join(' '));
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  // Score sentences
  const scored = allSentences.map(item => {
    const tokens = tokenize(item.text);
    let score = 0;
    for (const t of tokens) {
      score += (freq[t] || 0);
    }
    // Boost sentences with numbers, definitions, or clear structure
    if (/\b(first|second|key|important|main|because|therefore|mechanism|result)\b/i.test(item.text)) {
      score *= 1.3;
    }
    score = score / Math.max(1, tokens.length);
    return { ...item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Take unique, distinct sentences in chronological order
  const picked = [];
  const seen = new Set();
  for (const item of scored) {
    const snippet = item.text.slice(0, 20).toLowerCase();
    if (!seen.has(snippet)) {
      seen.add(snippet);
      picked.push(item);
    }
    if (picked.length >= count) break;
  }

  picked.sort((a, b) => a.start - b.start);
  return picked;
}

/**
 * Generate Structured Summary
 */
function generateSummary(transcriptData, metadata) {
  const { chunks, fullText } = transcriptData;
  const { title } = metadata;
  const concepts = extractKeyConcepts(fullText, title);
  const keySentences = extractImportantSentences(chunks, 6);

  // Formulate TL;DR
  const tldr = `This lecture on "${title}" covers foundational concepts in ${concepts.keyTerms.slice(0, 3).join(', ')}. ` +
    `It breaks down how core principles function, provides concrete examples, and highlights practical applications.`;

  // Key Takeaways
  const keyTakeaways = keySentences.slice(0, 5).map((s, idx) => ({
    icon: ['🎯', '💡', '⚡', '🔬', '📌'][idx % 5],
    text: s.text,
    timestamp: s.timestamp,
    start: s.start
  }));

  // Topic-by-topic breakdown
  const topics = [];
  const chunkStep = Math.max(1, Math.floor(chunks.length / 4));
  for (let i = 0; i < chunks.length; i += chunkStep) {
    const c = chunks[i];
    const chunkTokens = tokenize(c.text);
    const topConcept = chunkTokens[0] ? chunkTokens[0].toUpperCase() : `Part ${topics.length + 1}`;
    
    // Sub-bullets for this topic
    const subSentences = c.text.split(/(?<=[.?!])\s+/).filter(s => s.length > 25).slice(0, 3);

    topics.push({
      topicTitle: `Section ${topics.length + 1}: ${topConcept} Discussion`,
      timestamp: c.timestamp,
      start: c.start,
      overview: c.text.slice(0, 180) + '...',
      points: subSentences.length > 0 ? subSentences : [c.text.slice(0, 120)]
    });
    if (topics.length >= 5) break;
  }

  return {
    tldr,
    keyTakeaways,
    topics,
    keyConcepts: concepts.keyTerms.slice(0, 8),
    estimatedReadingTime: `${Math.max(2, Math.round(fullText.split(/\s+/).length / 200))} min read`
  };
}

/**
 * Generate Cornell Notes and Detailed Markdown Notes
 */
function generateNotes(transcriptData, metadata) {
  const { chunks, fullText } = transcriptData;
  const concepts = extractKeyConcepts(fullText, metadata.title);
  const importantSentences = extractImportantSentences(chunks, 10);

  // Cornell Notes rows: Cues (Questions) vs Main Notes
  const cornellRows = [];
  for (let i = 0; i < Math.min(6, importantSentences.length); i++) {
    const s = importantSentences[i];
    const cueTerm = concepts.keyTerms[i] || `Concept ${i + 1}`;
    cornellRows.push({
      cue: `How does ${cueTerm} operate?`,
      timestamp: s.timestamp,
      start: s.start,
      notes: [
        s.text,
        `Key association: Relates to the broader mechanism of ${concepts.keyTerms[(i + 1) % concepts.keyTerms.length] || 'the system'}.`,
        `Practical implication emphasized in lecture.`
      ]
    });
  }

  // Cornell Summary
  const cornellSummary = `In summary, "${metadata.title}" establishes that ${concepts.keyTerms.slice(0, 2).join(' and ')} are fundamental. Understanding their interactions allows learners to predict system behavior and solve complex problems accurately.`;

  // Standard Markdown format
  let markdown = `# Lecture Notes: ${metadata.title}\n`;
  markdown += `**Instructor / Channel**: ${metadata.author}  \n`;
  markdown += `**Duration**: ${transcriptData.formattedDuration}  \n\n`;
  markdown += `## 1. Core Objectives & Overview\n`;
  markdown += `- Understand the principles of **${concepts.keyTerms.slice(0, 3).join(', ')}**\n`;
  markdown += `- Analyze mechanisms, real-world examples, and foundational rules.\n\n`;

  markdown += `## 2. In-Depth Notes & Observations\n`;
  chunks.slice(0, 6).forEach((c, idx) => {
    markdown += `### [${c.timestamp}] Part ${idx + 1}: ${concepts.keyTerms[idx % concepts.keyTerms.length] || 'Key Discussion'}\n`;
    markdown += `- ${c.text.slice(0, 240)}...\n`;
    markdown += `- *Insight*: Pay close attention to definitions and context presented around ${c.timestamp}.\n\n`;
  });

  markdown += `## 3. Glossary & Vocabulary\n`;
  concepts.keyTerms.slice(0, 6).forEach(term => {
    markdown += `- **${term}**: Core subject or operational entity analyzed in this module.\n`;
  });

  markdown += `\n## 4. Synthesis & Key Takeaway\n`;
  markdown += `${cornellSummary}\n`;

  return {
    cornell: {
      rows: cornellRows,
      summary: cornellSummary
    },
    markdown,
    rawOutline: chunks.slice(0, 6).map((c, i) => ({
      heading: `Section ${i + 1}`,
      timestamp: c.timestamp,
      start: c.start,
      text: c.text.slice(0, 160)
    }))
  };
}

/**
 * Generate Interactive Quiz (MCQs + Explanations)
 */
function generateQuiz(transcriptData, metadata) {
  const { chunks, fullText } = transcriptData;
  const concepts = extractKeyConcepts(fullText, metadata.title);
  const keySentences = extractImportantSentences(chunks, 8);

  const questions = [];
  const numQuestions = Math.min(5, keySentences.length);

  for (let i = 0; i < numQuestions; i++) {
    const item = keySentences[i];
    const mainTerm = concepts.keyTerms[i] || 'this concept';
    const otherTerms = concepts.keyTerms.filter((_, idx) => idx !== i);

    // Formulate a question
    const qText = `According to the lecture, what is the primary role or characteristic of ${mainTerm}?`;
    
    // Correct Answer based on the actual sentence
    const correctAnswer = item.text.length > 90 ? item.text.slice(0, 85) + '...' : item.text;

    // Distractor generation
    const distractors = [
      `It is completely unrelated to ${otherTerms[0] || 'the system'} and only functions in isolation.`,
      `It acts as a secondary bypass that is ignored during primary operations.`,
      `It was historically used but has been entirely replaced in modern applications.`
    ];

    // Shuffle options
    const rawOptions = [correctAnswer, ...distractors];
    // Fisher-yates shuffle
    const shuffled = rawOptions.map((opt, idx) => ({ text: opt, isCorrect: idx === 0 }));
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
    }

    const correctIndex = shuffled.findIndex(o => o.isCorrect);

    questions.push({
      id: i + 1,
      question: qText,
      options: shuffled.map(s => s.text),
      correctAnswerIndex: correctIndex,
      explanation: `Highlighted around timestamp [${item.timestamp}]: "${item.text}"`,
      timestamp: item.timestamp,
      start: item.start
    });
  }

  return {
    quizTitle: `Knowledge Check: ${metadata.title}`,
    totalQuestions: questions.length,
    passingScore: 80,
    questions
  };
}

/**
 * Generate Interactive Flashcards
 */
function generateFlashcards(transcriptData, metadata) {
  const { chunks, fullText } = transcriptData;
  const concepts = extractKeyConcepts(fullText, metadata.title);
  const sentences = extractImportantSentences(chunks, 8);

  const flashcards = [];

  for (let i = 0; i < Math.min(8, concepts.keyTerms.length); i++) {
    const term = concepts.keyTerms[i];
    const sentence = sentences[i % sentences.length];

    flashcards.push({
      id: i + 1,
      front: `What is ${term}?`,
      back: sentence ? sentence.text : `${term} is a fundamental concept covered in the lecture on ${metadata.title}.`,
      hint: `Discussed around timestamp ${sentence ? sentence.timestamp : '00:00'}`,
      timestamp: sentence ? sentence.timestamp : '00:00',
      start: sentence ? sentence.start : 0
    });
  }

  return flashcards;
}

/**
 * Answer Question about lecture transcript (Lecture Q&A Chat)
 */
function answerLectureQuestion(query, transcriptData, metadata) {
  const { chunks, fullText } = transcriptData;
  const qTokens = tokenize(query);

  if (qTokens.length === 0) {
    return {
      answer: "Please ask a specific question regarding the lecture concepts, formulas, or examples.",
      relevantTimestamps: []
    };
  }

  // Find most matching chunks
  const scoredChunks = chunks.map(chunk => {
    const cTokens = tokenize(chunk.text);
    let matchScore = 0;
    for (const qt of qTokens) {
      for (const ct of cTokens) {
        if (ct === qt) matchScore += 3;
        else if (ct.includes(qt) || qt.includes(ct)) matchScore += 1;
      }
    }
    return { chunk, score: matchScore };
  });

  scoredChunks.sort((a, b) => b.score - a.score);
  const topMatches = scoredChunks.filter(s => s.score > 0).slice(0, 3);

  if (topMatches.length === 0) {
    return {
      answer: `The lecture mentions topics such as ${extractKeyConcepts(fullText).keyTerms.slice(0, 3).join(', ')}, but did not provide a direct reference for "${query}". You can review the full transcript or rephrase your question.`,
      relevantTimestamps: []
    };
  }

  const best = topMatches[0].chunk;
  const answer = `Based on the lecture at [${best.timestamp}], here is what is explained: "${best.text}"`;

  return {
    answer,
    relevantTimestamps: topMatches.map(m => ({
      timestamp: m.chunk.timestamp,
      start: m.chunk.start,
      preview: m.chunk.text.slice(0, 90) + '...'
    }))
  };
}

module.exports = {
  generateSummary,
  generateNotes,
  generateQuiz,
  generateFlashcards,
  answerLectureQuestion
};
