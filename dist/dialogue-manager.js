/**
 * dialogue-manager.js
 * WARD00 — The Monsoon Protocol
 * Manages audio playback, browser SpeechSynthesis fallback, captions,
 * soundtrack ducking, queueing, skipping, and Tara character integration.
 */

import { TARA_DIALOGUE } from './tara-dialogue.js';

export class DialogueManager {
  /**
   * @param {Object} options
   * @param {import('./tara-character.js').TaraCharacter} options.character
   * @param {import('./audio.js').Soundtrack} options.soundtrack
   * @param {Object} [options.settings]
   * @param {Function} [options.onTimerPause] - Callback to pause/resume emergency countdown
   */
  constructor(options = {}) {
    this.character = options.character;
    this.soundtrack = options.soundtrack;
    this.settings = options.settings || { voiceVolume: 1.0, voiceEngine: 'bundled' };
    this.onTimerPause = options.onTimerPause || null;

    this.manifest = TARA_DIALOGUE;
    this.currentLine = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.activeAudio = null;
    this.activeUtterance = null;
    this.playedIds = new Set();
    this.activeTimerPause = false;
    this.wasReplay = false;
    this.generation = 0;
    this.captionTimer = null;
    this.fallbackGeneration = -1;

    // SpeechSynthesis setup
    this.synth = typeof window !== 'undefined' ? (window.speechSynthesis || null) : null;
    this.voices = [];
    this.selectedVoice = null;
    if (this.synth) {
      this.initSpeechSynthesis();
    }

    // Volume ducking tracking
    this.baseMusicVolume = this.soundtrack?.volume ?? 0.32;
    this.isDucked = false;

    // Create audio element for bundled playback
    this.audioEl = typeof Audio !== 'undefined' ? new Audio() : null;
    if (this.audioEl) {
      this.audioEl.preload = 'auto';
      this.bindAudioEvents();
    }
  }

  initSpeechSynthesis() {
    if (!this.synth) return;
    const updateVoices = () => {
      this.voices = this.synth.getVoices();
      // Prefer Indian English voice if available, then other natural English voices
      this.selectedVoice = this.voices.find(v => v.name === this.settings.voiceName) || this.voices.find(v => v.lang === 'en-IN') ||
        this.voices.find(v => v.lang.startsWith('en') && (v.name.includes('India') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Female'))) ||
        this.voices.find(v => v.lang.startsWith('en')) ||
        this.voices[0] || null;
    };
    updateVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = updateVoices;
    }
  }

  bindAudioEvents() {
    const audio=this.audioEl, generation=this.generation;
    audio.addEventListener('ended', () => {
      if(generation===this.generation&&audio===this.audioEl)this.onSpeechEnd();
    });
    audio.addEventListener('error', () => {
      if(generation!==this.generation||audio!==this.audioEl||!this.isPlaying)return;
      if (this.currentLine) {
        this.playWithSpeechSynthesis(this.currentLine);
      } else {
        this.onSpeechEnd();
      }
    });
  }

  /**
   * Play a dialogue line by ID
   * @param {string} id - Key in TARA_DIALOGUE
   * @param {Object} [opts]
   * @param {boolean} [opts.force=false] - Force play even if already played once
   * @param {boolean} [opts.isReplay=false] - If manual replay by user
   * @param {boolean} [opts.isMandatory=false] - Pauses countdown timer
   */
  async play(id, opts = {}) {
    const line = this.manifest[id];
    if (!line) return;

    if (!opts.force && this.playedIds.has(id)) {
      // Already played, update character idle expression without repeating audio
      if (this.character) this.character.setExpression(line.expression);
      return;
    }

    // Cancel any ongoing dialogue line
    this.cancel();

    this.currentLine = line;
    this.isPlaying = true;
    this.wasReplay = Boolean(opts.isReplay);
    this.playedIds.add(id);

    // Update Tara's expression
    if (this.character) {
      this.character.setExpression(line.expression);
    }

    // Render dialogue HUD
    this.renderDialogueCard(line);

    // Pause countdown timer during mandatory lines (only on first play, not replay exploit)
    if (opts.isMandatory && !this.wasReplay && this.onTimerPause) {
      this.activeTimerPause = true;
      this.onTimerPause(true);
    }

    // Check if sound is globally enabled in game
    const soundEnabled = this.soundtrack?.on && !this.isMuted && (this.settings.voiceVolume > 0);

    if (!soundEnabled) {
      // Display captioned text without voice playback
      this.character?.setSpeaking(false, 0);
      this.isPlaying=false;
      this.renderDialogueCard(line);
      // Keep a bounded reading pause for captions when sound is off.
      if(this.activeTimerPause)this.captionTimer=setTimeout(()=>this.onSpeechEnd(),Math.min(10000,line.duration*1000));
      return;
    }

    // Duck background soundtrack
    this.duckSoundtrack(true);

    // Voice playback path
    const engine = this.settings.voiceEngine || 'bundled';
    if (engine === 'speechSynthesis' && this.synth) {
      this.playWithSpeechSynthesis(line);
    } else {
      this.playBundledAudio(line);
    }
  }

  playBundledAudio(line) {
    if (!this.audioEl) {
      this.playWithSpeechSynthesis(line);
      return;
    }
    this.audioEl=new Audio();
    this.audioEl.preload='auto';
    this.bindAudioEvents();
    const generation=this.generation,audio=this.audioEl;
    const src = this.audioEl.canPlayType('audio/webm; codecs="opus"') ? line.audioWebm : line.audioMp3;
    this.audioEl.src = src;
    this.audioEl.volume = Math.max(0, Math.min(1, this.settings.voiceVolume ?? 1.0));

    this.audioEl.play().then(() => {
      if(generation!==this.generation||audio!==this.audioEl||!this.isPlaying)return;
      if (this.character) {
        this.character.setSpeaking(true, 0.5);
        this.character.syncWithAudio(
          () => audio.currentTime,
          line.envelope,
          line.duration
        );
      }
    }).catch(err => {
      if(generation!==this.generation||audio!==this.audioEl||!this.isPlaying)return;
      this.playWithSpeechSynthesis(line);
    });
  }

  playWithSpeechSynthesis(line) {
    if(this.currentLine!==line||!this.isPlaying||this.isMuted)return;
    if(this.fallbackGeneration===this.generation)return;
    this.fallbackGeneration=this.generation;
    const generation=this.generation;
    this.audioEl?.pause();
    if (!this.synth) {
      this.onSpeechEnd();
      return;
    }
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(line.text);
    if (this.selectedVoice) utterance.voice = this.selectedVoice;
    utterance.volume = Math.max(0, Math.min(1, this.settings.voiceVolume ?? 1.0));
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    this.activeUtterance = utterance;

    utterance.onstart = () => {
      if(generation!==this.generation)return;
      if (this.character) this.character.setSpeaking(true, 0.45);
    };

    utterance.onboundary = (e) => {
      // Simulate viseme burst at word boundaries
      if (generation===this.generation && this.character && this.isPlaying) {
        this.character.setSpeaking(true, 0.6);
        setTimeout(() => {
          if (generation===this.generation && this.isPlaying) this.character.setSpeaking(true, 0.15);
        }, 80);
      }
    };

    utterance.onend = () => {
      if(generation===this.generation)this.onSpeechEnd();
    };

    utterance.onerror = () => {
      if(generation===this.generation)this.onSpeechEnd();
    };

    this.synth.speak(utterance);
  }

  duckSoundtrack(duck) {
    if (!this.soundtrack) return;
    if(this.soundtrack.duck){this.isDucked=duck;this.soundtrack.duck(duck);return;}
    if (duck && !this.isDucked) {
      this.isDucked = true;
      this.baseMusicVolume = this.soundtrack.volume;
      this.soundtrack.setVolume(this.baseMusicVolume * 0.28);
    } else if (!duck && this.isDucked) {
      this.isDucked = false;
      this.soundtrack.setVolume(this.baseMusicVolume);
    }
  }

  onSpeechEnd() {
    clearTimeout(this.captionTimer);this.captionTimer=null;
    this.isPlaying = false;
    if (this.character) {
      this.character.setSpeaking(false, 0);
      this.character.stopSyncLoop();
    }
    this.duckSoundtrack(false);

    // Restore timer if it was paused for this line
    if (this.activeTimerPause && this.onTimerPause) {
      this.activeTimerPause = false;
      this.onTimerPause(false);
    }

    if (typeof document !== 'undefined') {
      const card = document.querySelector('#tara-dialogue-card');
      if (card) {
        card.classList.remove('speaking');
        const wave = card.querySelector('.dialogue-waveform');
        if (wave) wave.classList.remove('active');
      }
    }
  }

  /**
   * Cancel ongoing speech immediately
   */
  cancel() {
    this.generation++;
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    if (this.synth) this.synth.cancel();

    this.onSpeechEnd();
    this.currentLine = null;
  }

  /**
   * Replay the current active or last line
   */
  replay() {
    if (this.currentLine) {
      this.play(this.currentLine.id, { force: true, isReplay: true });
    }
  }

  /**
   * Skip the current speaking line
   */
  skip() {
    this.silence();
  }

  /**
   * Toggle voice mute independently of game soundtrack
   */
  toggleVoiceMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      const line=this.currentLine;this.cancel();this.currentLine=line;
    } else if (this.currentLine) {
      this.replay();
    }
    this.updateControlsUI();
  }

  silence() {const line=this.currentLine;this.cancel();this.currentLine=line;}

  setVoiceVolume(vol) {
    this.settings.voiceVolume = Math.max(0, Math.min(1, vol));
    if (this.audioEl) this.audioEl.volume = this.settings.voiceVolume;
  }

  setVoiceEngine(engine) {
    this.settings.voiceEngine = engine;
  }

  /**
   * Render the frosted-glass dialogue card
   */
  renderDialogueCard(line) {
    if (typeof document === 'undefined') return;
    const slot = document.querySelector('#tara-dialogue-slot');
    if (!slot) return;

    slot.innerHTML = `
      <div class="tara-dialogue-card frosted ${this.isPlaying ? 'speaking' : ''}" id="tara-dialogue-card" role="region" aria-label="Tara's speech" data-line-id="${line.id}">
        <div class="dialogue-card-head">
          <div class="speaker-meta">
            <span class="speaker-name">TARA NAIK</span>
            <span class="speaker-tag">${line.tag || 'COMMUNITY EVIDENCE'}</span>
          </div>
          <div class="dialogue-waveform ${this.isPlaying ? 'active' : ''}" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>

        <p class="dialogue-caption" id="dialogue-caption" aria-live="polite">
          ${line.text}
        </p>

        <div class="dialogue-actions-bar">
          <button class="dlg-btn" id="dlg-replay-btn" aria-label="Replay Tara's voice" title="Replay voice">
            ↺ <span>REPLAY</span>
          </button>
          <button class="dlg-btn" id="dlg-skip-btn" aria-label="Skip Tara's voice" title="Skip voice">
            ⏭ <span>SKIP</span>
          </button>
          <button class="dlg-btn ${this.isMuted ? 'muted' : ''}" id="dlg-mute-btn" aria-label="${this.isMuted ? 'Unmute voice' : 'Mute voice'}" title="Toggle voice mute">
            ${this.isMuted ? '🔇' : '🔊'} <span>${this.isMuted ? 'MUTED' : 'VOICE'}</span>
          </button>
        </div>
      </div>
    `;

    this.bindDialogueCardEvents();
  }

  bindDialogueCardEvents() {
    if (typeof document === 'undefined') return;
    const replayBtn = document.querySelector('#dlg-replay-btn');
    const skipBtn = document.querySelector('#dlg-skip-btn');
    const muteBtn = document.querySelector('#dlg-mute-btn');

    if (replayBtn) replayBtn.onclick = () => this.replay();
    if (skipBtn) skipBtn.onclick = () => this.skip();
    if (muteBtn) muteBtn.onclick = () => this.toggleVoiceMute();
  }

  updateControlsUI() {
    if (typeof document === 'undefined') return;
    const muteBtn = document.querySelector('#dlg-mute-btn');
    if (muteBtn) {
      muteBtn.classList.toggle('muted', this.isMuted);
      muteBtn.setAttribute('aria-label',this.isMuted?'Unmute voice':'Mute voice');
      muteBtn.innerHTML = `${this.isMuted ? '🔇' : '🔊'} <span>${this.isMuted ? 'MUTED' : 'VOICE'}</span>`;
    }
  }
}
