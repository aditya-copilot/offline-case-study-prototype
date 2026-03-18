import type { VoiceConfig, VoiceState } from '../types';

export class VoiceEngine {
  private static instance: VoiceEngine;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private state: VoiceState = 'idle';
  private config: VoiceConfig;
  private onTranscript: ((text: string, confidence: number) => void) | null = null;
  private onStateChange: ((state: VoiceState) => void) | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.synthesis = window.speechSynthesis;
    this.config = {
      mode: 'push-to-talk',
      language: 'en-IN',
      continuousListening: false,
      autoSpeakResponses: true,
      silenceThreshold: 2000,
      noiseSuppression: true
    };
    this.initializeRecognition();
  }

  static getInstance(): VoiceEngine {
    if (!VoiceEngine.instance) {
      VoiceEngine.instance = new VoiceEngine();
    }
    return VoiceEngine.instance;
  }

  private initializeRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = this.config.continuousListening;
    this.recognition.interimResults = true;
    this.recognition.lang = this.config.language;

    this.recognition.onstart = () => {
      this.setState('listening');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript && this.onTranscript) {
        const confidence = event.results[event.results.length - 1][0].confidence;
        this.onTranscript(finalTranscript, confidence);
        this.resetSilenceTimer();
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      this.setState('error');
    };

    this.recognition.onend = () => {
      if (this.config.mode === 'continuous' && this.state === 'listening') {
        this.recognition?.start();
      } else {
        this.setState('idle');
      }
    };
  }

  startListening(
    onTranscript: (text: string, confidence: number) => void,
    onStateChange: (state: VoiceState) => void
  ): void {
    if (!this.recognition) {
      onStateChange('error');
      return;
    }

    this.onTranscript = onTranscript;
    this.onStateChange = onStateChange;

    try {
      this.recognition.start();
      this.resetSilenceTimer();
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.setState('error');
    }
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.clearSilenceTimer();
    this.setState('idle');
  }

  speak(text: string, onEnd?: () => void): void {
    if (!this.config.autoSpeakResponses) return;

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.config.language;
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.setState('speaking');
    };

    utterance.onend = () => {
      this.setState('idle');
      onEnd?.();
    };

    this.synthesis.speak(utterance);
  }

  stopSpeaking(): void {
    this.synthesis.cancel();
  }

  private setState(state: VoiceState): void {
    this.state = state;
    this.onStateChange?.(state);
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer();
    if (this.config.mode === 'continuous') {
      this.silenceTimer = setTimeout(() => {
        this.stopListening();
      }, this.config.silenceThreshold);
    }
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  setConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.recognition) {
      this.recognition.continuous = this.config.continuousListening;
      this.recognition.lang = this.config.language;
    }
  }

  getState(): VoiceState {
    return this.state;
  }

  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}

export const voiceEngine = VoiceEngine.getInstance();
