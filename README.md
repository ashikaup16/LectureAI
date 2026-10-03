# 🎓 LectureAI — AI-Powered Lecture Summarization, Notes & Quiz System

An intelligent multi-modal academic platform that converts any YouTube class recording, university lecture, or custom transcript into executive summaries, Cornell study notes, interactive quizzes, flashcards, and an interactive AI tutor chat.

---

## 🚀 Live Local Application Link

Open your browser and navigate to:

👉 **[http://localhost:5000](http://localhost:5000)**

---

## ✨ Key Features

1. **YouTube & Class Video Extraction**:
   - Paste any YouTube class link (`https://www.youtube.com/watch?v=...`, `youtu.be/...`, shorts, or live recordings).
   - Automatically retrieves full caption transcripts with timestamps.
   - Fetches video metadata (title, presenter/channel, HD thumbnail) without requiring YouTube API keys.

2. **Paste Transcript / Lecture Text Option**:
   - Support for offline lectures, meetings, textbook chapters, or videos without subtitles.

3. **1-Click Curated Sample Lectures**:
   - Test immediately with preloaded lectures from **3Blue1Brown (Neural Networks)**, **freeCodeCamp (Algorithms & Big O)**, **MIT (Quantum Mechanics)**, and **Huberman Lab (Focus & Memory)**.

4. **Executive Summary & Key Takeaways**:
   - Concise TL;DR summary and estimated reading time.
   - Core concept pills and essential takeaways with clickable timestamp jump links.
   - Chronological topic-by-topic breakdown.

5. **Authentic Cornell Notes & Markdown View**:
   - **Cornell Format**: Two-column layout with Cues/Questions on the left, detailed notes on the right, and synthesis summary at the bottom.
   - **Markdown View**: Standard academic document format.
   - **Interactive Timestamps**: Click any timestamp pill to jump the embedded video directly to that exact moment!

6. **Interactive Knowledge Assessment Quiz**:
   - Conceptual Multiple Choice Questions (MCQs) with options A, B, C, D.
   - Instant visual feedback (emerald green for correct, rose red for incorrect).
   - Real-time score counter and detailed explanation citing transcript timestamps.
   - Confetti celebration animation on high scores (>= 80%).
   - Retake quiz and review modes.

7. **3D Interactive Flashcards**:
   - Flip cards with smooth 3D perspective animations.
   - Track **Mastered** vs. **Need Review** status.
   - Full keyboard navigation: <kbd>Space</kbd> to flip, <kbd>&larr;</kbd> Previous, <kbd>&rarr;</kbd> Next.

8. **AI Lecture Tutor Chat**:
   - Ask any conceptual question, formula clarification, or example from the lecture.
   - Direct answers with citations from the transcript.

9. **Export & Sharing**:
   - **Print / Save as PDF** (clean printer-friendly CSS stylesheet).
   - **Download Markdown (`.md`)** file.
   - **Download Plain Text (`.txt`)** file.
   - **Copy to Clipboard** with one click.

10. **Dual AI Intelligence**:
    - **Google Gemini Integration**: Supports free Gemini API keys (configurable directly in the UI modal or in `.env`).
    - **Built-in Neural NLP Engine**: If no API key is provided or quota is exceeded, the built-in deterministic NLP engine handles all summarization, Cornell notes, quiz questions, and flashcards instantly.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, `youtube-transcript`, `@google/generative-ai`, `dotenv`, `cors`.
- **Frontend**: Semantic HTML5, Vanilla Modern CSS with Glassmorphism, JavaScript (ES6+), Canvas Confetti.
- **Embedded Player**: YouTube IFrame API integration with bidirectional timestamp seeking.

---

## 💻 Running the Project

```bash
# Install dependencies
npm install

# Start the server
npm start
# or
node server.js
```

Open **[http://localhost:5000](http://localhost:5000)** in any browser.
