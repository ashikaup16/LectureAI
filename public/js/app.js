/**
 * Main Application Controller for LectureAI
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentLectureData = null;
  let activeTab = 'tab-summary';
  let activeNotesView = 'cornell';

  // DOM Elements
  const heroSection = document.getElementById('hero-section');
  const loadingSection = document.getElementById('loading-section');
  const workspaceSection = document.getElementById('workspace-section');
  const errorBanner = document.getElementById('error-banner');
  const errorTitle = document.getElementById('error-title');
  const errorMessage = document.getElementById('error-message');
  const btnCloseError = document.getElementById('btn-close-error');

  // Input Tabs
  const tabYtBtn = document.getElementById('tab-yt-btn');
  const tabTextBtn = document.getElementById('tab-text-btn');
  const panelYoutube = document.getElementById('panel-youtube');
  const panelText = document.getElementById('panel-text');

  // Forms & Inputs
  const formYoutube = document.getElementById('form-youtube');
  const inputYoutubeUrl = document.getElementById('input-youtube-url');
  const btnAnalyzeYoutube = document.getElementById('btn-analyze-youtube');

  const formText = document.getElementById('form-text');
  const inputCustomTitle = document.getElementById('input-custom-title');
  const inputCustomText = document.getElementById('input-custom-text');
  const btnAnalyzeText = document.getElementById('btn-analyze-text');
  const wordCounter = document.getElementById('word-counter');

  // Samples
  const samplesGrid = document.getElementById('samples-grid');

  // Settings Modal
  const modalSettings = document.getElementById('modal-settings');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnClearSettings = document.getElementById('btn-clear-settings');
  const inputApiKey = document.getElementById('input-api-key');
  const btnToggleKeyVis = document.getElementById('btn-toggle-key-vis');
  const aiStatusText = document.getElementById('ai-status-text');

  // Video Controls
  const btnToggleVideoPlayer = document.getElementById('btn-toggle-video-player');
  const btnClosePlayer = document.getElementById('btn-close-player');
  const videoThumbPreview = document.getElementById('video-preview-thumb');

  // Export Menu
  const btnExportMenu = document.getElementById('btn-export-menu');
  const exportMenu = document.getElementById('export-menu');
  const optExportPdf = document.getElementById('opt-export-pdf');
  const optExportMd = document.getElementById('opt-export-md');
  const optExportTxt = document.getElementById('opt-export-txt');
  const optCopyAll = document.getElementById('opt-copy-all');

  // Notes View Switcher
  const btnViewCornell = document.getElementById('btn-view-cornell');
  const btnViewMarkdown = document.getElementById('btn-view-markdown');
  const cornellViewContainer = document.getElementById('cornell-view-container');
  const markdownViewContainer = document.getElementById('markdown-view-container');
  const btnCopyNotes = document.getElementById('btn-copy-notes');
  const btnPrintNotes = document.getElementById('btn-print-notes');

  // Chat
  const formChat = document.getElementById('form-chat');
  const inputChatQuery = document.getElementById('input-chat-query');
  const chatMessages = document.getElementById('chat-messages');
  const chatSuggestions = document.getElementById('chat-suggestions');

  // Transcript Search
  const inputTranscriptSearch = document.getElementById('input-transcript-search');

  // ==========================================
  // Toast Notification System
  // ==========================================
  window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => container.removeChild(toast), 300);
    }, 3200);
  };

  // ==========================================
  // Settings & API Key Handling
  // ==========================================
  function loadStoredApiKey() {
    const saved = localStorage.getItem('lectureai_gemini_key') || '';
    if (inputApiKey) inputApiKey.value = saved;
    updateAiBadge(Boolean(saved));
  }

  function updateAiBadge(hasCustomKey) {
    if (aiStatusText) {
      if (hasCustomKey) {
        aiStatusText.textContent = 'Gemini AI Active';
      } else {
        aiStatusText.textContent = 'Neural NLP Engine Ready';
      }
    }
  }

  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', () => {
      loadStoredApiKey();
      modalSettings.classList.remove('hidden');
    });
  }

  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
      modalSettings.classList.add('hidden');
    });
  }

  if (btnToggleKeyVis) {
    btnToggleKeyVis.addEventListener('click', () => {
      inputApiKey.type = inputApiKey.type === 'password' ? 'text' : 'password';
    });
  }

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const key = inputApiKey.value.trim();
      if (key) {
        localStorage.setItem('lectureai_gemini_key', key);
        window.showToast('Gemini API Key saved successfully!', 'success');
      } else {
        localStorage.removeItem('lectureai_gemini_key');
        window.showToast('API key cleared. Using built-in NLP engine.', 'info');
      }
      updateAiBadge(Boolean(key));
      modalSettings.classList.add('hidden');
    });
  }

  if (btnClearSettings) {
    btnClearSettings.addEventListener('click', () => {
      localStorage.removeItem('lectureai_gemini_key');
      inputApiKey.value = '';
      updateAiBadge(false);
      window.showToast('API key cleared.', 'info');
      modalSettings.classList.add('hidden');
    });
  }

  // Close modal on outside click
  modalSettings.addEventListener('click', (e) => {
    if (e.target === modalSettings) {
      modalSettings.classList.add('hidden');
    }
  });

  // ==========================================
  // Tab Switching (YouTube vs Custom Text)
  // ==========================================
  tabYtBtn.addEventListener('click', () => {
    tabYtBtn.classList.add('active');
    tabTextBtn.classList.remove('active');
    panelYoutube.classList.add('active');
    panelText.classList.remove('active');
  });

  tabTextBtn.addEventListener('click', () => {
    tabTextBtn.classList.add('active');
    tabYtBtn.classList.remove('active');
    panelText.classList.add('active');
    panelYoutube.classList.remove('active');
  });

  // Word counter for text area
  if (inputCustomText && wordCounter) {
    inputCustomText.addEventListener('input', () => {
      const words = inputCustomText.value.trim().split(/\s+/).filter(Boolean).length;
      wordCounter.textContent = `${words} words`;
    });
  }

  // ==========================================
  // Feature Navigation Tabs
  // ==========================================
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      switchFeatureTab(targetId);
    });
  });

  function switchFeatureTab(tabId) {
    activeTab = tabId;
    navTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabId));
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.toggle('active', c.id === tabId);
    });
  }

  // ==========================================
  // Sample Lecture Chips Click
  // ==========================================
  const sampleChips = document.querySelectorAll('.sample-chip');
  sampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const videoId = chip.getAttribute('data-video-id');
      if (videoId) {
        inputYoutubeUrl.value = `https://www.youtube.com/watch?v=${videoId}`;
        tabYtBtn.click();
        processLecture({ url: inputYoutubeUrl.value });
      }
    });
  });

  // ==========================================
  // Form Submissions
  // ==========================================
  formYoutube.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = inputYoutubeUrl.value.trim();
    if (!url) {
      showError('Please enter a valid YouTube video URL.');
      return;
    }
    processLecture({ url });
  });

  btnAnalyzeYoutube.addEventListener('click', () => {
    formYoutube.dispatchEvent(new Event('submit'));
  });

  formText.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = inputCustomText.value.trim();
    const title = inputCustomTitle.value.trim() || 'Custom Lecture';
    if (!text || text.split(/\s+/).filter(Boolean).length < 20) {
      showError('Please enter at least 20 words of lecture text or transcript.');
      return;
    }
    processLecture({ text, title });
  });

  btnAnalyzeText.addEventListener('click', () => {
    formText.dispatchEvent(new Event('submit'));
  });

  // Close Error Banner
  if (btnCloseError) {
    btnCloseError.addEventListener('click', () => {
      errorBanner.classList.add('hidden');
    });
  }

  function showError(msg, title = 'Processing Error') {
    if (errorTitle) errorTitle.textContent = title;
    if (errorMessage) errorMessage.textContent = msg;
    if (errorBanner) {
      errorBanner.classList.remove('hidden');
      errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    hideLoading();
  }

  function hideError() {
    if (errorBanner) errorBanner.classList.add('hidden');
  }

  // ==========================================
  // Progress & Loading Animation
  // ==========================================
  let progressInterval = null;

  function showLoading() {
    hideError();
    loadingSection.classList.remove('hidden');
    workspaceSection.classList.add('hidden');
    loadingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const fill = document.getElementById('progress-bar-fill');
    const steps = ['step-fetch', 'step-analyze', 'step-notes', 'step-quiz'];
    let pct = 15;
    let stepIndex = 0;

    steps.forEach((s, idx) => {
      const el = document.getElementById(s);
      if (el) {
        el.className = idx === 0 ? 'step-item active' : 'step-item';
      }
    });

    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (pct < 90) {
        pct += Math.floor(Math.random() * 8) + 4;
        if (fill) fill.style.width = `${pct}%`;

        const newStepIndex = Math.min(3, Math.floor(pct / 25));
        if (newStepIndex !== stepIndex) {
          const prevEl = document.getElementById(steps[stepIndex]);
          if (prevEl) prevEl.className = 'step-item done';
          stepIndex = newStepIndex;
          const curEl = document.getElementById(steps[stepIndex]);
          if (curEl) curEl.className = 'step-item active';
        }
      }
    }, 600);
  }

  function hideLoading() {
    if (progressInterval) clearInterval(progressInterval);
    const fill = document.getElementById('progress-bar-fill');
    if (fill) fill.style.width = '100%';
    setTimeout(() => {
      loadingSection.classList.add('hidden');
    }, 300);
  }

  // ==========================================
  // API Call & Processing
  // ==========================================
  async function processLecture(payload) {
    showLoading();

    const storedKey = localStorage.getItem('lectureai_gemini_key');
    if (storedKey) {
      payload.apiKey = storedKey;
    }

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process lecture.');
      }

      currentLectureData = data;
      renderLectureResults(data);
      hideLoading();

      // Show workspace & scroll to it
      workspaceSection.classList.remove('hidden');
      workspaceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      window.showToast('Lecture successfully synthesized!', 'success');

    } catch (err) {
      hideLoading();
      showError(err.message);
    }
  }

  // ==========================================
  // Render Full Results
  // ==========================================
  function renderLectureResults(data) {
    const { metadata, summary, notes, quiz, flashcards, provider, transcript } = data;

    // 1. Meta Card
    renderMetaCard(metadata, transcript, provider);

    // 2. Summary Tab
    renderSummaryTab(summary);

    // 3. Notes Tab
    renderNotesTab(notes);

    // 4. Interactive Quiz
    if (window.QuizEngine && quiz) {
      window.QuizEngine.init(quiz);
      const quizBadge = document.getElementById('badge-quiz-count');
      if (quizBadge && quiz.questions) {
        quizBadge.textContent = `${quiz.questions.length} Qs`;
      }
    }

    // 5. Flashcards
    if (window.FlashcardsEngine && flashcards) {
      window.FlashcardsEngine.init(flashcards);
      const cardBadge = document.getElementById('badge-card-count');
      if (cardBadge) {
        cardBadge.textContent = `${flashcards.length} Cards`;
      }
    }

    // 6. Transcript
    renderTranscriptTab(transcript);

    // Default to summary tab
    switchFeatureTab('tab-summary');
  }

  // Render Metadata Card
  function renderMetaCard(metadata, transcript, provider) {
    const titleEl = document.getElementById('meta-title');
    const authorEl = document.getElementById('meta-author');
    const durationEl = document.getElementById('meta-duration');
    const providerEl = document.getElementById('meta-provider');
    const thumbImg = document.getElementById('meta-thumb-img');

    if (titleEl) titleEl.textContent = metadata.title;
    if (authorEl) authorEl.textContent = `Presenter: ${metadata.author}`;
    if (durationEl) durationEl.textContent = transcript ? transcript.formattedDuration : 'Lecture';
    if (providerEl) providerEl.textContent = provider || 'AI Synthesized';

    if (thumbImg) {
      thumbImg.src = metadata.thumbnailUrl || metadata.fallbackThumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80';
      thumbImg.onerror = () => {
        thumbImg.src = metadata.fallbackThumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80';
      };
    }

    // Initialize player if YouTube video
    if (metadata.videoId && window.PlayerManager) {
      window.PlayerManager.currentVideoId = metadata.videoId;
      window.PlayerManager.loadVideo(metadata.videoId);
    }
  }

  // Render Summary Tab
  function renderSummaryTab(summary) {
    if (!summary) return;

    const tldrEl = document.getElementById('summary-tldr');
    const readTimeEl = document.getElementById('summary-reading-time');
    const conceptsEl = document.getElementById('summary-concepts-chips');
    const takeawaysEl = document.getElementById('summary-takeaways-grid');
    const topicsEl = document.getElementById('summary-topics-timeline');

    if (tldrEl) tldrEl.textContent = summary.tldr;
    if (readTimeEl) readTimeEl.textContent = summary.estimatedReadingTime || '3 min read';

    // Key Concepts
    if (conceptsEl) {
      conceptsEl.innerHTML = '';
      (summary.keyConcepts || []).forEach(c => {
        const chip = document.createElement('span');
        chip.className = 'concept-chip';
        chip.textContent = c;
        conceptsEl.appendChild(chip);
      });
    }

    // Takeaways Grid
    if (takeawaysEl) {
      takeawaysEl.innerHTML = '';
      (summary.keyTakeaways || []).forEach(k => {
        const card = document.createElement('div');
        card.className = 'takeaway-card';
        card.innerHTML = `
          <div class="takeaway-icon">${k.icon || '📌'}</div>
          <div class="takeaway-body">
            <p class="takeaway-text">${escapeHTML(k.text)}</p>
            ${k.timestamp ? `
              <button class="time-jump-pill" onclick="window.PlayerManager && window.PlayerManager.seekTo(${k.start || 0})">
                ⏱️ ${k.timestamp}
              </button>
            ` : ''}
          </div>
        `;
        takeawaysEl.appendChild(card);
      });
    }

    // Topics Timeline
    if (topicsEl) {
      topicsEl.innerHTML = '';
      (summary.topics || []).forEach(t => {
        const item = document.createElement('div');
        item.className = 'topic-item';

        let pointsHTML = '';
        if (t.points && t.points.length > 0) {
          pointsHTML = '<ul class="topic-points">' + t.points.map(p => `<li>${escapeHTML(p)}</li>`).join('') + '</ul>';
        }

        item.innerHTML = `
          <div class="topic-header">
            <h4 class="topic-title">${escapeHTML(t.topicTitle)}</h4>
            ${t.timestamp ? `
              <button class="time-jump-pill" onclick="window.PlayerManager && window.PlayerManager.seekTo(${t.start || 0})">
                ⏱️ ${t.timestamp}
              </button>
            ` : ''}
          </div>
          <p class="topic-overview">${escapeHTML(t.overview)}</p>
          ${pointsHTML}
        `;
        topicsEl.appendChild(item);
      });
    }
  }

  // Render Cornell Notes & Markdown
  function renderNotesTab(notes) {
    if (!notes) return;

    // Cornell Rows
    const cornellRowsContainer = document.getElementById('cornell-rows-container');
    const cornellSummaryText = document.getElementById('cornell-summary-text');
    const markdownContent = document.getElementById('markdown-rendered-content');

    if (cornellRowsContainer && notes.cornell) {
      cornellRowsContainer.innerHTML = '';
      (notes.cornell.rows || []).forEach(r => {
        const row = document.createElement('div');
        row.className = 'cornell-row';

        const bullets = (r.notes || []).map(n => `<li>${escapeHTML(n)}</li>`).join('');

        row.innerHTML = `
          <div class="cornell-cue-col">
            <div class="cornell-cue-title">${escapeHTML(r.cue)}</div>
            ${r.timestamp ? `
              <button class="time-jump-pill" onclick="window.PlayerManager && window.PlayerManager.seekTo(${r.start || 0})">
                ⏱️ ${r.timestamp}
              </button>
            ` : ''}
          </div>
          <div class="cornell-notes-col">
            <ul class="cornell-bullet-list">
              ${bullets}
            </ul>
          </div>
        `;
        cornellRowsContainer.appendChild(row);
      });

      if (cornellSummaryText) {
        cornellSummaryText.textContent = notes.cornell.summary || '';
      }
    }

    // Markdown view
    if (markdownContent && notes.markdown) {
      markdownContent.innerHTML = formatMarkdownToHTML(notes.markdown);
    }
  }

  // Simple Markdown to HTML formatter for the preview
  function formatMarkdownToHTML(md) {
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/gim, '<p></p>')
      .replace(/\n/gim, '<br>');
  }

  // Render Transcript Tab
  function renderTranscriptTab(transcript) {
    const listEl = document.getElementById('transcript-segments-container');
    const countEl = document.getElementById('transcript-count-label');

    if (!transcript || !transcript.chunks || transcript.chunks.length === 0) {
      if (listEl) listEl.innerHTML = '<p class="empty-hint">No transcript available.</p>';
      return;
    }

    if (countEl) countEl.textContent = `${transcript.chunks.length} sections (${transcript.totalSegments || 0} captions)`;

    if (listEl) {
      listEl.innerHTML = '';
      transcript.chunks.forEach(c => {
        const line = document.createElement('div');
        line.className = 'transcript-line';
        line.innerHTML = `
          <span class="t-time">${c.timestamp}</span>
          <span class="t-text">${escapeHTML(c.text)}</span>
        `;
        line.addEventListener('click', () => {
          if (window.PlayerManager) {
            window.PlayerManager.seekTo(c.start);
          }
        });
        listEl.appendChild(line);
      });
    }
  }

  // Transcript live search filter
  if (inputTranscriptSearch) {
    inputTranscriptSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const lines = document.querySelectorAll('.transcript-line');
      lines.forEach(line => {
        const text = line.querySelector('.t-text').textContent.toLowerCase();
        if (!q || text.includes(q)) {
          line.classList.remove('hidden');
        } else {
          line.classList.add('hidden');
        }
      });
    });
  }

  // ==========================================
  // Notes View Toggle (Cornell vs Markdown)
  // ==========================================
  btnViewCornell.addEventListener('click', () => {
    btnViewCornell.classList.add('active');
    btnViewMarkdown.classList.remove('active');
    cornellViewContainer.classList.remove('hidden');
    markdownViewContainer.classList.add('hidden');
    activeNotesView = 'cornell';
  });

  btnViewMarkdown.addEventListener('click', () => {
    btnViewMarkdown.classList.add('active');
    btnViewCornell.classList.remove('active');
    markdownViewContainer.classList.remove('hidden');
    cornellViewContainer.classList.add('hidden');
    activeNotesView = 'markdown';
  });

  // Copy Notes
  btnCopyNotes.addEventListener('click', () => {
    if (!currentLectureData) return;
    const md = window.ExportManager.generateFullMarkdown(currentLectureData);
    window.ExportManager.copyToClipboard(md, 'Lecture notes copied to clipboard!');
  });

  // Print Notes
  btnPrintNotes.addEventListener('click', () => {
    window.ExportManager.exportPDF();
  });

  // ==========================================
  // Export Dropdown Actions
  // ==========================================
  btnExportMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    exportMenu.classList.add('hidden');
  });

  optExportPdf.addEventListener('click', () => {
    exportMenu.classList.add('hidden');
    window.ExportManager.exportPDF();
  });

  optExportMd.addEventListener('click', () => {
    exportMenu.classList.add('hidden');
    if (!currentLectureData) return;
    const md = window.ExportManager.generateFullMarkdown(currentLectureData);
    const safeTitle = (currentLectureData.metadata.title || 'lecture-notes').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    window.ExportManager.downloadFile(`${safeTitle}.md`, md, 'text/markdown;charset=utf-8;');
  });

  optExportTxt.addEventListener('click', () => {
    exportMenu.classList.add('hidden');
    if (!currentLectureData) return;
    const md = window.ExportManager.generateFullMarkdown(currentLectureData);
    const txt = md.replace(/[*#_`]/g, '');
    const safeTitle = (currentLectureData.metadata.title || 'lecture-notes').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    window.ExportManager.downloadFile(`${safeTitle}.txt`, txt, 'text/plain;charset=utf-8;');
  });

  optCopyAll.addEventListener('click', () => {
    exportMenu.classList.add('hidden');
    if (!currentLectureData) return;
    const md = window.ExportManager.generateFullMarkdown(currentLectureData);
    window.ExportManager.copyToClipboard(md, 'Full study kit copied to clipboard!');
  });

  // ==========================================
  // Video Player Controls
  // ==========================================
  btnToggleVideoPlayer.addEventListener('click', () => {
    if (window.PlayerManager) window.PlayerManager.toggleDrawer();
  });

  btnClosePlayer.addEventListener('click', () => {
    if (window.PlayerManager) window.PlayerManager.hideDrawer();
  });

  videoThumbPreview.addEventListener('click', () => {
    if (window.PlayerManager) window.PlayerManager.toggleDrawer();
  });

  // ==========================================
  // AI Tutor Chat
  // ==========================================
  formChat.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = inputChatQuery.value.trim();
    if (!query) return;
    sendChatMessage(query);
    inputChatQuery.value = '';
  });

  // Suggestion chips
  if (chatSuggestions) {
    chatSuggestions.addEventListener('click', (e) => {
      const chip = e.target.closest('.sugg-chip');
      if (chip) {
        const prompt = chip.getAttribute('data-prompt');
        sendChatMessage(prompt);
      }
    });
  }

  async function sendChatMessage(query) {
    if (!currentLectureData) {
      window.showToast('Please analyze a lecture first.', 'error');
      return;
    }

    // Append user bubble
    appendChatBubble(query, 'user');

    // Append loading bot bubble
    const loadingBubble = appendChatBubble('Analyzing lecture transcript...', 'bot', true);

    try {
      const storedKey = localStorage.getItem('lectureai_gemini_key');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          transcriptText: currentLectureData.transcript ? currentLectureData.transcript.fullText : '',
          metadata: currentLectureData.metadata,
          chunks: currentLectureData.transcript ? currentLectureData.transcript.chunks : [],
          apiKey: storedKey || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get answer.');
      }

      loadingBubble.querySelector('.bubble-text').textContent = data.answer;
      loadingBubble.classList.remove('loading-bubble');

    } catch (err) {
      loadingBubble.querySelector('.bubble-text').textContent = `Sorry, I was unable to answer: ${err.message}`;
      loadingBubble.classList.remove('loading-bubble');
    }
  }

  function appendChatBubble(text, sender = 'bot', isLoading = false) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender === 'user' ? 'user-msg' : 'bot-msg'} ${isLoading ? 'loading-bubble' : ''}`;
    bubble.innerHTML = `
      <div class="bubble-sender">${sender === 'user' ? 'You' : 'LectureAI Tutor'}</div>
      <div class="bubble-text">${escapeHTML(text)}</div>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  // Quiz completion buttons
  const btnRetakeFinished = document.getElementById('btn-retake-finished');
  const btnResetQuiz = document.getElementById('btn-reset-quiz');
  const btnReviewFlashcards = document.getElementById('btn-review-flashcards');

  if (btnRetakeFinished) {
    btnRetakeFinished.addEventListener('click', () => {
      if (window.QuizEngine) window.QuizEngine.reset();
    });
  }

  if (btnResetQuiz) {
    btnResetQuiz.addEventListener('click', () => {
      if (window.QuizEngine) window.QuizEngine.reset();
    });
  }

  if (btnReviewFlashcards) {
    btnReviewFlashcards.addEventListener('click', () => {
      switchFeatureTab('tab-flashcards');
    });
  }

  // Helper escapeHTML
  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);
  }

  // Initial load
  loadStoredApiKey();
});
