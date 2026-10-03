/**
 * Embedded YouTube Player Controller
 * Enables interactive timestamp seeking from notes, summaries, and transcripts.
 */

const PlayerManager = {
  currentVideoId: null,
  iframeElement: null,
  isOpen: false,

  /**
   * Mount or update YouTube player
   */
  loadVideo(videoId, startSeconds = 0) {
    if (!videoId) return;
    this.currentVideoId = videoId;
    const mount = document.getElementById('yt-player-iframe-mount');
    if (!mount) return;

    const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&start=${startSeconds}&origin=${window.location.origin}`;

    mount.innerHTML = `
      <iframe 
        id="yt-player-iframe"
        width="100%" 
        height="100%" 
        src="${embedUrl}" 
        title="Lecture Video Player" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen>
      </iframe>
    `;

    this.iframeElement = document.getElementById('yt-player-iframe');
    this.showDrawer();
  },

  /**
   * Jump to specific second in video
   */
  seekTo(seconds) {
    if (!this.currentVideoId) return;

    this.showDrawer();

    const indicator = document.getElementById('player-time-indicator');
    if (indicator) {
      const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
      const ss = (seconds % 60).toString().padStart(2, '0');
      indicator.textContent = `Playing at ${mm}:${ss}`;
    }

    if (this.iframeElement && this.iframeElement.contentWindow) {
      // Use YouTube iframe API postMessage command
      this.iframeElement.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seconds, true]
      }), '*');

      this.iframeElement.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'playVideo',
        args: []
      }), '*');
    }

    // Scroll smoothly to player
    const drawer = document.getElementById('video-drawer-container');
    if (drawer) {
      drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  showDrawer() {
    const drawer = document.getElementById('video-drawer-container');
    const toggleBtn = document.getElementById('player-toggle-text');
    if (drawer) {
      drawer.classList.remove('hidden');
      this.isOpen = true;
    }
    if (toggleBtn) {
      toggleBtn.textContent = 'Hide Video';
    }
  },

  hideDrawer() {
    const drawer = document.getElementById('video-drawer-container');
    const toggleBtn = document.getElementById('player-toggle-text');
    if (drawer) {
      drawer.classList.add('hidden');
      this.isOpen = false;
    }
    if (toggleBtn) {
      toggleBtn.textContent = 'Show Video';
    }
  },

  toggleDrawer() {
    if (this.isOpen) {
      this.hideDrawer();
    } else {
      if (!this.iframeElement && this.currentVideoId) {
        this.loadVideo(this.currentVideoId);
      } else {
        this.showDrawer();
      }
    }
  }
};

window.PlayerManager = PlayerManager;
