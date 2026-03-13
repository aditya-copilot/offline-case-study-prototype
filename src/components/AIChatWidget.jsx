import { useState, useRef, useEffect, useCallback } from 'react'
import './AIChatWidget.css'

// Backend API endpoint - configure this to your backend URL
const API_ENDPOINT = '/api/chat'

function AIChatWidget() {
  const [inputMode, setInputMode] = useState('text')
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [uploadedImage, setUploadedImage] = useState(null)

  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex
        const transcriptText = event.results[current][0].transcript

        if (event.results[current].isFinal) {
          // Auto-send immediately when speech is final
          sendMessage(transcriptText)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setSpeechSupported(false)
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } else {
      setSpeechSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Call backend API
  const callBackend = async (userMessage, conversationHistory, imageData = null) => {
    try {
      const payload = {
        message: userMessage,
        history: conversationHistory.slice(-10).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        image: imageData
      }

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      // Handle different response formats
      if (data.response) {
        return data.response
      } else if (data.message) {
        return data.message
      } else if (data.answer) {
        return data.answer
      } else if (data.text) {
        return data.text
      } else if (typeof data === 'string') {
        return data
      } else {
        return JSON.stringify(data)
      }

    } catch (error) {
      console.error('API error:', error)

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return "Unable to connect to the server. Please check your connection and try again."
      }

      return `Sorry, I encountered an error: ${error.message}`
    }
  }

  // Send message and get bot response
  const sendMessage = useCallback(async (text, imageData = null) => {
    if (!text.trim() && !imageData) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text,
      image: imageData,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setUploadedImage(null)
    setIsTyping(true)

    // Get AI response from backend
    const response = await callBackend(text, messages, imageData)

    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      text: response,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, botMessage])
    setIsTyping(false)
  }, [messages])

  const handleSend = () => {
    if (message.trim() || uploadedImage) {
      sendMessage(message, uploadedImage)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="ai-fullscreen-container">
      {/* Header */}
      <div className="ai-fullscreen-header">
        <div className="ai-header-left">
          <div className="ai-bot-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          </div>
          <div className="ai-header-info">
            <h1>AI Assistant</h1>
            <span className={`ai-status ${isTyping ? 'typing' : ''}`}>
              {isTyping ? 'Typing...' : 'Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="ai-fullscreen-messages">
        {messages.length === 0 ? (
          <div className="ai-welcome-fullscreen">
            <div className="ai-welcome-icon-large">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09z" />
              </svg>
            </div>

          </div>
        ) : (
          <div className="ai-messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message ${msg.type}`}>
                {msg.type === 'bot' && (
                  <div className="ai-bot-msg-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="5" />
                      <path d="M20 21a8 8 0 1 0-16 0" />
                    </svg>
                  </div>
                )}
                <div className="ai-message-content">
                  {msg.image && (
                    <div className="ai-message-image">
                      <img src={msg.image} alt="Uploaded" />
                    </div>
                  )}
                  {msg.text && <p>{msg.text}</p>}
                  <span className="ai-message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="ai-message bot">
                <div className="ai-bot-msg-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 1 0-16 0" />
                  </svg>
                </div>
                <div className="ai-message-content">
                  <div className="ai-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Section */}
      <div className="ai-fullscreen-input-section">
        {/* Input Mode Selector */}
        <div className="ai-mode-selector">
          <button
            className={`ai-mode-btn ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => setInputMode('text')}
            title="Text Input"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7V4h16v3M9 20h6M12 4v16" />
            </svg>
            <span>Text</span>
          </button>
          <button
            className={`ai-mode-btn ${inputMode === 'speech' ? 'active' : ''}`}
            onClick={() => setInputMode('speech')}
            title="Speech to Text"
            disabled={!speechSupported}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <span>Speech</span>
          </button>
          <button
            className={`ai-mode-btn ${inputMode === 'ocr' ? 'active' : ''}`}
            onClick={() => setInputMode('ocr')}
            title="OCR - Image to Text"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span>OCR</span>
          </button>
        </div>

        {/* Input Area */}
        <div className="ai-fullscreen-input-area">
          {inputMode === 'text' && (
            <div className="ai-text-input">
              {uploadedImage && (
                <div className="ai-image-preview">
                  <img src={uploadedImage} alt="Preview" />
                  <button className="ai-remove-image" onClick={clearImage}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="ai-input-row">
                <label className="ai-attach-btn" title="Attach image">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    hidden
                  />
                </label>
                <textarea
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={1}
                />
                <button className="ai-send-btn" onClick={handleSend} disabled={!message.trim() && !uploadedImage}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {inputMode === 'speech' && (
            <div className="ai-speech-input">
              {!speechSupported ? (
                <p className="ai-error">Speech recognition is not supported in your browser. Please use Chrome or Edge.</p>
              ) : (
                <>
                  <button
                    className={`ai-mic-btn ${isListening ? 'listening' : ''}`}
                    onClick={toggleListening}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>
                  <p>{isListening ? 'Listening... Speech will be sent automatically' : 'Tap to start speaking'}</p>
                  {isListening && (
                    <div className="ai-waveform">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {inputMode === 'ocr' && (
            <div className="ai-ocr-input">
              {uploadedImage ? (
                <div className="ai-ocr-preview">
                  <img src={uploadedImage} alt="Preview" />
                  <div className="ai-ocr-actions">
                    <button
                      className="ai-ocr-send-btn"
                      onClick={() => sendMessage('Please analyze this image and extract any text from it.', uploadedImage)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      Analyze Image
                    </button>
                    <button className="ai-ocr-clear-btn" onClick={clearImage}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <label className="ai-upload-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Upload Image</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      hidden
                    />
                  </label>
                  <p className="ai-ocr-hint">Upload an image to analyze and extract text</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIChatWidget
