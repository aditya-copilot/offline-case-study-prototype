import { useState, useEffect, useRef } from 'react'
import './VoiceInput.css'

export default function VoiceInput({ onResult, onClose }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const current = event.resultIndex
      const transcriptText = event.results[current][0].transcript
      setTranscript(transcriptText)

      if (event.results[current].isFinal) {
        onResult(transcriptText)
      }
    }

    recognition.onerror = (event) => {
      setError('Error: ' + event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    
    const timer = setTimeout(() => {
      try {
        recognition.start()
        setIsListening(true)
        setError(null)
      } catch (err) {
        setError('Failed to start speech recognition')
        setIsListening(false)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
      setIsListening(true)
      setError(null)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
    if (transcript) {
      onResult(transcript)
    }
  }

  return (
    <div className="voice-input-overlay" onClick={onClose}>
      <div className="voice-input-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-voice" onClick={onClose}>×</button>
        
        <div className="voice-content">
          <div className={`voice-wave ${isListening ? 'listening' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          
          <h3>{isListening ? 'Listening...' : 'Tap to speak'}</h3>
          
          {transcript && (
            <p className="transcript-preview">"{transcript}"</p>
          )}
          
          {error && (
            <p className="voice-error">{error}</p>
          )}
          
          <div className="voice-actions">
            {isListening ? (
              <button className="stop-btn" onClick={stopListening}>
                <span className="stop-icon"></span>
                Stop
              </button>
            ) : (
              <button className="start-btn" onClick={startListening}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Tap to Speak
              </button>
            )}
          </div>
          
          <p className="voice-hint">
            Try saying: "Electric bikes under 1 lakh" or "Best scooter for family"
          </p>
        </div>
      </div>
    </div>
  )
}
