/**
 * Interactive Quiz Engine for LectureAI
 * Immediate feedback, explanations, score tracking & celebration confetti
 */

const QuizEngine = {
  currentQuiz: null,
  userAnswers: {},
  score: 0,

  init(quizData) {
    this.currentQuiz = quizData;
    this.userAnswers = {};
    this.score = 0;
    this.render();
  },

  render() {
    const listEl = document.getElementById('questions-list');
    const titleEl = document.getElementById('quiz-title');
    const scoreEl = document.getElementById('quiz-score-display');
    const bannerEl = document.getElementById('quiz-completion-banner');

    if (!this.currentQuiz || !this.currentQuiz.questions || this.currentQuiz.questions.length === 0) {
      if (listEl) listEl.innerHTML = '<p class="empty-hint">No quiz generated for this lecture.</p>';
      return;
    }

    if (titleEl) titleEl.textContent = this.currentQuiz.quizTitle || 'Knowledge Assessment';
    if (scoreEl) scoreEl.textContent = `0 / ${this.currentQuiz.questions.length}`;
    if (bannerEl) bannerEl.classList.add('hidden');

    listEl.innerHTML = '';

    this.currentQuiz.questions.forEach((q, qIndex) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.id = `q-card-${qIndex}`;

      const topBar = `
        <div class="question-top">
          <span class="question-num-tag">Question ${qIndex + 1} of ${this.currentQuiz.questions.length}</span>
          ${q.timestamp ? `<button class="time-jump-pill" onclick="window.PlayerManager && window.PlayerManager.seekTo(${q.start || 0})">⏱️ ${q.timestamp}</button>` : ''}
        </div>
      `;

      const qText = `<h4 class="question-text">${this.escapeHTML(q.question)}</h4>`;

      let optionsHTML = '<div class="options-grid">';
      q.options.forEach((opt, optIndex) => {
        const letter = String.fromCharCode(65 + optIndex);
        optionsHTML += `
          <button 
            type="button" 
            class="option-btn" 
            id="opt-btn-${qIndex}-${optIndex}"
            onclick="QuizEngine.selectOption(${qIndex}, ${optIndex})"
          >
            <span class="opt-letter">${letter}</span>
            <span class="opt-text">${this.escapeHTML(opt)}</span>
          </button>
        `;
      });
      optionsHTML += '</div>';

      const expHTML = `
        <div class="explanation-box hidden" id="exp-${qIndex}">
          <strong>Explanation:</strong> ${this.escapeHTML(q.explanation)}
        </div>
      `;

      card.innerHTML = topBar + qText + optionsHTML + expHTML;
      listEl.appendChild(card);
    });
  },

  selectOption(qIndex, selectedOptIndex) {
    if (this.userAnswers[qIndex] !== undefined) return; // Already answered

    const question = this.currentQuiz.questions[qIndex];
    const isCorrect = (selectedOptIndex === question.correctAnswerIndex);
    this.userAnswers[qIndex] = { selected: selectedOptIndex, isCorrect };

    const card = document.getElementById(`q-card-${qIndex}`);
    const selectedBtn = document.getElementById(`opt-btn-${qIndex}-${selectedOptIndex}`);
    const correctBtn = document.getElementById(`opt-btn-${qIndex}-${question.correctAnswerIndex}`);
    const expBox = document.getElementById(`exp-${qIndex}`);

    if (isCorrect) {
      this.score++;
      card.classList.add('answered-correct');
      selectedBtn.classList.add('selected-correct');
    } else {
      card.classList.add('answered-wrong');
      selectedBtn.classList.add('selected-wrong');
      if (correctBtn) correctBtn.classList.add('reveal-correct');
    }

    // Disable all options for this question
    question.options.forEach((_, idx) => {
      const btn = document.getElementById(`opt-btn-${qIndex}-${idx}`);
      if (btn) btn.disabled = true;
    });

    if (expBox) expBox.classList.remove('hidden');

    this.updateScoreDisplay();
    this.checkCompletion();
  },

  updateScoreDisplay() {
    const scoreEl = document.getElementById('quiz-score-display');
    if (scoreEl && this.currentQuiz) {
      scoreEl.textContent = `${this.score} / ${this.currentQuiz.questions.length}`;
    }
  },

  checkCompletion() {
    const total = this.currentQuiz.questions.length;
    const answeredCount = Object.keys(this.userAnswers).length;

    if (answeredCount === total) {
      const banner = document.getElementById('quiz-completion-banner');
      const titleEl = document.getElementById('completion-title');
      const descEl = document.getElementById('completion-desc');
      const iconEl = document.getElementById('completion-icon');

      const pct = Math.round((this.score / total) * 100);

      if (banner) {
        banner.classList.remove('hidden');
        banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (pct >= 80) {
        if (iconEl) iconEl.textContent = '🎉';
        if (titleEl) titleEl.textContent = 'Outstanding Mastery!';
        if (descEl) descEl.textContent = `You scored ${this.score} out of ${total} (${pct}%). Exceptional comprehension of the lecture material!`;
        
        // Trigger celebratory confetti
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else if (pct >= 50) {
        if (iconEl) iconEl.textContent = '👍';
        if (titleEl) titleEl.textContent = 'Good Effort!';
        if (descEl) descEl.textContent = `You scored ${this.score} out of ${total} (${pct}%). Review the Cornell notes and flashcards to master the missed concepts!`;
      } else {
        if (iconEl) iconEl.textContent = '📚';
        if (titleEl) titleEl.textContent = 'Keep Studying!';
        if (descEl) descEl.textContent = `You scored ${this.score} out of ${total} (${pct}%). Consider rewatching key sections using the timestamp links!`;
      }
    }
  },

  reset() {
    if (this.currentQuiz) {
      this.init(this.currentQuiz);
      if (window.showToast) {
        window.showToast('Quiz reset. Ready for a new attempt!', 'info');
      }
    }
  },

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);
  }
};

window.QuizEngine = QuizEngine;
