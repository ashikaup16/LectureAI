/**
 * 3D Interactive Flashcards Controller for LectureAI
 */

const FlashcardsEngine = {
  cards: [],
  currentIndex: 0,
  isFlipped: false,
  masteredSet: new Set(),
  reviewSet: new Set(),

  init(cardsData) {
    this.cards = cardsData || [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.masteredSet.clear();
    this.reviewSet.clear();

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Avoid double binding
    if (this._eventsBound) return;
    this._eventsBound = true;

    const inner = document.getElementById('flashcard-inner');
    if (inner) {
      inner.addEventListener('click', () => this.flip());
    }

    const flipBtn = document.getElementById('btn-flip-card');
    if (flipBtn) {
      flipBtn.addEventListener('click', () => this.flip());
    }

    const prevBtn = document.getElementById('btn-prev-card');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prev());
    }

    const nextBtn = document.getElementById('btn-next-card');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }

    const masteredBtn = document.getElementById('btn-mark-mastered');
    if (masteredBtn) {
      masteredBtn.addEventListener('click', () => this.markMastered());
    }

    const reviewBtn = document.getElementById('btn-mark-review');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => this.markReview());
    }

    const seekBtn = document.getElementById('btn-card-seek');
    if (seekBtn) {
      seekBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = this.cards[this.currentIndex];
        if (card && window.PlayerManager) {
          window.PlayerManager.seekTo(card.start || 0);
        }
      });
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      // Only handle if flashcards tab is active and not typing in an input
      const flashTab = document.getElementById('tab-flashcards');
      if (!flashTab || !flashTab.classList.contains('active')) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.flip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.next();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      }
    });
  },

  render() {
    if (!this.cards || this.cards.length === 0) {
      return;
    }

    const card = this.cards[this.currentIndex];
    const frontEl = document.getElementById('card-front-text');
    const backEl = document.getElementById('card-back-text');
    const curNumEl = document.getElementById('current-card-num');
    const totNumEl = document.getElementById('total-card-num');
    const tsCueEl = document.getElementById('card-timestamp-cue');
    const inner = document.getElementById('flashcard-inner');
    const prevBtn = document.getElementById('btn-prev-card');
    const nextBtn = document.getElementById('btn-next-card');
    const masteredEl = document.getElementById('mastered-count');
    const reviewEl = document.getElementById('review-count');

    // Reset flip state on new card
    this.isFlipped = false;
    if (inner) inner.classList.remove('is-flipped');

    if (frontEl) frontEl.textContent = card.front;
    if (backEl) backEl.textContent = card.back;
    if (curNumEl) curNumEl.textContent = this.currentIndex + 1;
    if (totNumEl) totNumEl.textContent = this.cards.length;
    if (tsCueEl) tsCueEl.textContent = `⏱️ ${card.timestamp || '00:00'}`;

    if (prevBtn) prevBtn.disabled = (this.currentIndex === 0);
    if (nextBtn) nextBtn.disabled = (this.currentIndex === this.cards.length - 1);

    if (masteredEl) masteredEl.textContent = this.masteredSet.size;
    if (reviewEl) reviewEl.textContent = this.reviewSet.size;
  },

  flip() {
    const inner = document.getElementById('flashcard-inner');
    if (!inner) return;
    this.isFlipped = !this.isFlipped;
    inner.classList.toggle('is-flipped', this.isFlipped);
  },

  next() {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.render();
    }
  },

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
    }
  },

  markMastered() {
    this.masteredSet.add(this.currentIndex);
    this.reviewSet.delete(this.currentIndex);
    if (window.showToast) window.showToast('Marked as Mastered! 🎉', 'success');
    this.render();
    if (this.currentIndex < this.cards.length - 1) {
      setTimeout(() => this.next(), 250);
    }
  },

  markReview() {
    this.reviewSet.add(this.currentIndex);
    this.masteredSet.delete(this.currentIndex);
    if (window.showToast) window.showToast('Added to Review list 📌', 'info');
    this.render();
    if (this.currentIndex < this.cards.length - 1) {
      setTimeout(() => this.next(), 250);
    }
  }
};

window.FlashcardsEngine = FlashcardsEngine;
