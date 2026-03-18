import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle, Settings } from 'lucide-react';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import type { VoiceState } from '../types';

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }
}

interface VoiceInterfaceProps {
  onStateChange?: (state: VoiceState) => void;
}

export function VoiceInterface({ onStateChange }: VoiceInterfaceProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupported(supported);

    if (supported) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onstart = () => {
        setState('listening');
        onStateChange?.('listening');
      };

      recognitionRef.current.onresult = (event) => {
        let final = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (final) {
          setTranscript((prev) => prev + ' ' + final);
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event) => {
        let errorMessage = 'Something went wrong';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking louder or closer to the microphone.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not available. Please check your device settings.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone permissions.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'aborted':
            errorMessage = 'Voice input was interrupted. Please try again.';
            break;
          default:
            errorMessage = 'Voice recognition error. Please try again or type your query.';
        }
        setError(errorMessage);
        setState('error');
        onStateChange?.('error');
      };

      recognitionRef.current.onend = () => {
        if (state === 'listening') {
          setState('idle');
          onStateChange?.('idle');
        }
      };
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [onStateChange]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && state === 'idle') {
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      try {
        recognitionRef.current.start();
      } catch {
        setError('Failed to start speech recognition');
      }
    }
  }, [state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state === 'listening') {
      recognitionRef.current.stop();
      setState('idle');
      onStateChange?.('idle');
    }
  }, [state, onStateChange]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const speakResponse = useCallback((text: string) => {
    if (!autoSpeak) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => v.lang.includes('en-IN')) || voices.find((v) => v.lang.includes('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setState('speaking');
      onStateChange?.('speaking');
    };

    utterance.onend = () => {
      setState('idle');
      onStateChange?.('idle');
    };

    window.speechSynthesis.speak(utterance);
  }, [autoSpeak, onStateChange]);

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <MicOff className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="font-semibold mb-2">Voice Not Supported</h3>
        <p className="text-sm text-muted-foreground">
          Speech recognition is not available in your browser. Try using Chrome or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Mic className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Voice Assistant</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Tap and hold the microphone button to speak
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-full bg-muted">Try:</span>
                <span className="px-2 py-1 rounded-full bg-muted">Find bikes under 1 lakh</span>
                <span className="px-2 py-1 rounded-full bg-muted">Best electric scooters</span>
              </div>
            </motion.div>
          )}

          {state === 'listening' && (
            <motion.div
              key="listening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-6">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{
                      scale: [1, 1.5 + i * 0.2],
                      opacity: [0.8, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeOut'
                    }}
                  />
                ))}
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.1, 1],
                    backgroundColor: ['rgba(var(--primary), 0.2)', 'rgba(var(--primary), 0.3)', 'rgba(var(--primary), 0.2)']
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <Mic className="w-10 h-10 text-primary" />
                </motion.div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Listening...</h3>
              <p className="text-sm text-muted-foreground">
                Speak clearly about bikes you are looking for
              </p>
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <motion.div
                  className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <h3 className="font-semibold text-lg mb-2">Processing...</h3>
              <p className="text-sm text-muted-foreground">
                Analyzing your request
              </p>
            </motion.div>
          )}

          {state === 'speaking' && (
            <motion.div
              key="speaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <motion.div
                  className="flex items-end gap-1 h-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-primary rounded-full"
                      animate={{
                        height: [8, 24, 8]
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1
                      }}
                    />
                  ))}
                </motion.div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Speaking...</h3>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Voice Input Issue</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                {error || 'Something went wrong. Please try again.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="default" onClick={startListening} className="gap-2">
                  <Mic className="w-4 h-4" />
                  Try Voice Again
                </Button>
                <Button variant="outline" onClick={() => setState('idle')}>
                  Switch to Text Input
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t bg-card">
        <AnimatePresence>
          {(transcript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-lg bg-muted"
            >
              <p className="text-sm">
                {transcript}
                <span className="text-muted-foreground">{interimTranscript}</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs"
                onClick={clearTranscript}
              >
                Clear
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setAutoSpeak(!autoSpeak)}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          <motion.button
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center shadow-lg',
              state === 'listening'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-primary text-primary-foreground'
            )}
            whileTap={{ scale: 0.95 }}
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            disabled={state === 'processing' || state === 'speaking'}
          >
            {state === 'listening' ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </motion.button>

          <div className="w-20" />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3">
          {state === 'listening' ? 'Release to stop' : 'Press and hold to speak'}
        </p>
      </div>
    </div>
  );
}
