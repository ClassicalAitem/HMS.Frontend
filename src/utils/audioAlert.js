/**
 * Web Audio API synthesizer for hospital medication due alerts.
 * Generates an authentic, gentle electronic medical alert chime (C5 - E5 - G5 - C6)
 * repeating periodically without relying on external MP3 downloads or CDNs.
 */

class MedicationAlertAudio {
  constructor() {
    this.audioCtx = null;
    this.intervalId = null;
    this.isPlaying = false;
    this.isMuted = false;
  }

  getAudioContext() {
    try {
      if (!this.audioCtx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
    return this.audioCtx;
  }

  playChimeTone() {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Medical chime melody: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
      const notes = [
        { freq: 523.25, start: 0, duration: 0.14 },
        { freq: 659.25, start: 0.15, duration: 0.14 },
        { freq: 783.99, start: 0.30, duration: 0.18 },
        { freq: 1046.50, start: 0.48, duration: 0.40 },
      ];

      notes.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        // Smooth envelope to avoid clicks
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration + 0.05);
      });
    } catch (e) {
      console.warn('Medication chime playback failed:', e);
    }
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.getAudioContext();
    this.playChimeTone();

    // Repeat alert chime every 4.5 seconds while open
    this.intervalId = setInterval(() => {
      if (this.isPlaying && !this.isMuted) {
        this.playChimeTone();
      }
    }, 4500);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (!this.isMuted && this.isPlaying) {
      this.playChimeTone();
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }
}

export const audioAlert = new MedicationAlertAudio();
export default audioAlert;

