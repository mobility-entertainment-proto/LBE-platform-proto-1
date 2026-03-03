// core/audio.js  音声管理（iOS Autoplay Policy対応）

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.speechSynth = window.speechSynthesis || null;
  }

  // ユーザージェスチャー後に呼ぶ（iOS対応必須）
  unlock() {
    if (this.unlocked) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.unlocked = true;
    } catch (e) { console.warn('[AudioManager] unlock failed', e); }
  }

  getContext() { return this.ctx; }

  // HTMLAudioElement を Web Audio API に接続して返す
  connectAudio(audioEl) {
    if (!this.ctx) return null;
    const src = this.ctx.createMediaElementSource(audioEl);
    src.connect(this.ctx.destination);
    return src;
  }

  // 効果音 (type: 'tap'|'correct'|'wrong'|'start')
  playSFX(type) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const dst = this.ctx.destination;

    const tone = (freq, dur, vol = 0.3, wave = 'sine', delay = 0) => {
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
      g.connect(dst);
      const o = this.ctx.createOscillator();
      o.type = wave; o.frequency.value = freq;
      o.connect(g); o.start(t + delay); o.stop(t + delay + dur + 0.01);
    };

    if (type === 'tap') {
      tone(440, 0.08, 0.25);
    } else if (type === 'correct') {
      tone(523, 0.15, 0.3, 'sine', 0);
      tone(659, 0.15, 0.3, 'sine', 0.1);
      tone(784, 0.2, 0.3, 'sine', 0.2);
    } else if (type === 'wrong') {
      tone(150, 0.3, 0.35, 'sawtooth');
    } else if (type === 'start') {
      // クラッカー風
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.06, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const s = this.ctx.createBufferSource(); s.buffer = buf;
      const g = this.ctx.createGain(); g.gain.setValueAtTime(1.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      s.connect(g); g.connect(dst); s.start(t);
      tone(2200, 0.4, 0.35, 'sine', 0.03);
    }
  }

  // Web Speech API テキスト読み上げ
  speak(text, options = {}) {
    return new Promise(resolve => {
      if (!this.speechSynth) { resolve(); return; }

      // 再生中なら停止してから開始
      if (this.speechSynth.speaking || this.speechSynth.pending) {
        this.speechSynth.cancel();
      }
      // paused 状態の場合は resume（Chromium bug 対策）
      if (this.speechSynth.paused) this.speechSynth.resume();

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = options.lang || 'ja-JP';
      utt.rate = options.rate || 0.9;
      utt.pitch = options.pitch || 1.0;

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(maxTimer);
        clearTimeout(startCheck);
        resolve();
      };

      // 【最大タイムアウト】onend が発火しない Chrome bug 対策
      const maxMs = Math.min(5000, Math.max(3000, text.length * 150 + 1500));
      const maxTimer = setTimeout(finish, maxMs);

      // 【起動確認】speak() 後 300ms で speaking=false なら音声エンジンが
      // 起動しなかった（日本語音声未インストール等）→ 即解決
      const startCheck = setTimeout(() => {
        if (!this.speechSynth.speaking && !this.speechSynth.pending) finish();
      }, 300);

      utt.onend  = finish;
      utt.onerror = finish;

      this.speechSynth.speak(utt);
    });
  }

  stopSpeech() {
    if (this.speechSynth) this.speechSynth.cancel();
  }
}
