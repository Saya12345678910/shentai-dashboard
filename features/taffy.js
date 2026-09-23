/* ==== 功能：塔菲休闲游戏 START ==== */
const Taffy = {
  initialized: false,

  render() {
    if (this.initialized) return;
    this.initialized = true;
    this.stage = document.getElementById('taffyStage');
    this.video = document.getElementById('taffyVideo');
    this.audio = new Audio('assets/taffy/laugh.m4a');
    this.audio.preload = 'metadata';
    this.hint = document.getElementById('taffyHint');
    this.audio.addEventListener('ended', () => this.stop());
    this.video.addEventListener('error', () => this.stage.classList.add('fallback'));
    this.video.addEventListener('ended', () => this.stage.classList.add('fallback'));
  },

  async play() {
    this.render();
    if (this.stage.classList.contains('playing')) return;

    this.stage.classList.remove('fallback');
    this.stage.classList.add('playing');
    this.hint.textContent = '塔菲正在笑…';
    this.audio.currentTime = 0;
    this.video.currentTime = 0;

    const sound = this.audio.play();
    this.video.play().catch(() => this.stage.classList.add('fallback'));
    try {
      await sound;
    } catch {
      this.stop();
      this.hint.textContent = '声音未能播放，请再点一次塔菲';
    }
  },

  stop() {
    if (!this.initialized) return;
    this.audio.pause();
    this.video.pause();
    this.stage.classList.remove('playing', 'fallback');
    this.hint.textContent = '点击塔菲，听一次糖笑';
  }
};
/* ==== 功能：塔菲休闲游戏 END ==== */
