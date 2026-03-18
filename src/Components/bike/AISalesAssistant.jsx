import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { twowheelers } from '../../data/bike/twowheelerProducts'
import { bikeAIRecommendationService } from '../../services/BikeAIRecommendationService'
import VehicleComparison from './VehicleComparison'
import './AISalesAssistant.css'

const WELCOME_MESSAGES = [
  { type: 'bot', text: '👋 Welcome to Pick Your Motors!' },
  { type: 'bot', text: 'I\'m your AI Sales Assistant. I can help you find the perfect bike with just a few questions.' }
]

const QUICK_QUESTIONS = [
  { icon: '💰', text: 'Under ₹1 lakh', prefs: { budget: 'Under ₹1 lakh' } },
  { icon: '⚡', text: 'Electric bikes', prefs: { type: 'Electric' } },
  { icon: '👨‍👩‍👧‍👦', text: 'Family scooter', prefs: { type: 'Scooter', purpose: 'Family Use' } },
  { icon: '🏢', text: 'Daily commute', prefs: { purpose: 'Daily Commute' } },
  { icon: '🎯', text: 'Best mileage', prefs: { purpose: 'Best Mileage' } },
  { icon: '✨', text: 'Premium bikes', prefs: { budget: 'Above ₹1.5L' } }
]

const GUIDED_QUESTIONS = [
  {
    id: 'purpose',
    question: 'What will you mainly use the bike for?',
    options: [
      { icon: '🏢', text: 'Daily Commute', value: 'Daily Commute' },
      { icon: '🛣️', text: 'Long Rides', value: 'Long Rides' },
      { icon: '🏁', text: 'Sports Riding', value: 'Sports Riding' },
      { icon: '👨‍👩‍👧‍👦', text: 'Family Use', value: 'Family Use' },
      { icon: '🌱', text: 'Eco Friendly', value: 'Eco Friendly' }
    ]
  },
  {
    id: 'budget',
    question: 'What\'s your budget range?',
    options: [
      { icon: '💰', text: 'Under ₹70K', value: 'Under ₹70K' },
      { icon: '💵', text: '₹70K - ₹1L', value: '₹70K - ₹1L' },
      { icon: '💎', text: '₹1L - ₹1.5L', value: '₹1L - ₹1.5L' },
      { icon: '🏆', text: 'Above ₹1.5L', value: 'Above ₹1.5L' }
    ]
  },
  {
    id: 'type',
    question: 'Which type do you prefer?',
    options: [
      { icon: '🏍️', text: 'Motorcycle', value: 'Motorcycle' },
      { icon: '🛵', text: 'Scooter', value: 'Scooter' },
      { icon: '⚡', text: 'Electric', value: 'Electric' },
      { icon: '🤷', text: 'Any Type', value: 'Any' }
    ]
  }
]

export default function AISalesAssistant({ onClose, onVehicleSelect, onBuyNow, toolCallUtils }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState(WELCOME_MESSAGES)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [step, setStep] = useState('welcome')
  const [guidedStep, setGuidedStep] = useState(0)
  const [userPreferences, setUserPreferences] = useState({})
  const [showGuided, setShowGuided] = useState(false)
  const [recommendations, setRecommendations] = useState(null)
  const [compareVehicles, setCompareVehicles] = useState([])
  const [inputMode, setInputMode] = useState('text')
  const [isListening, setIsListening] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [speechSupported, setSpeechSupported] = useState(true)
  
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)
  const inputModeRef = useRef('text')

  useEffect(() => {
    inputModeRef.current = inputMode
    if (inputMode !== 'speech') {
      setIsListening(false)
    }
  }, [inputMode])

  useEffect(() => {
    initSpeechRecognition()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex
        const transcriptText = event.results[current][0].transcript
        setInputText(transcriptText)

        if (event.results[current].isFinal) {
          handleSend(transcriptText)
          setIsListening(false)
        }
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } else {
      setSpeechSupported(false)
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

  const addMessage = (text, type = 'bot') => {
    setMessages(prev => [...prev, { type, text, timestamp: new Date() }])
  }

  const handleQuickQuestion = (question) => {
    addMessage(question.text, 'user')
    setIsTyping(true)
    
    const prefs = {
      purpose: question.prefs.purpose || 'General use',
      budget: question.prefs.budget || question.text,
      type: question.prefs.type || 'Any'
    }
    
    setUserPreferences(prefs)
    fetchRecommendations(prefs)
  }

  const startGuidedFlow = () => {
    setShowGuided(true)
    setGuidedStep(0)
    setTimeout(() => {
      addMessage(GUIDED_QUESTIONS[0].question)
      setStep('guided')
    }, 500)
  }

  const handleGuidedOption = (option) => {
    const currentQuestion = GUIDED_QUESTIONS[guidedStep]
    addMessage(option.text, 'user')
    
    const newPrefs = { ...userPreferences }
    
    if (currentQuestion.id === 'purpose') {
      newPrefs.purpose = option.value
    } else if (currentQuestion.id === 'budget') {
      newPrefs.budget = option.value
    } else if (currentQuestion.id === 'type') {
      newPrefs.type = option.value
    }
    
    setUserPreferences(newPrefs)
    
    if (guidedStep < GUIDED_QUESTIONS.length - 1) {
      setIsTyping(true)
      setTimeout(() => {
        setGuidedStep(guidedStep + 1)
        addMessage(GUIDED_QUESTIONS[guidedStep + 1].question)
        setIsTyping(false)
      }, 600)
    } else {
      fetchRecommendations(newPrefs)
    }
  }

  const fetchRecommendations = async (prefs) => {
    setIsTyping(true)
    
    try {
      const result = await bikeAIRecommendationService.getRecommendations(prefs)
      
      if (result.success && result.vehicles.length >= 2) {
        setRecommendations(result)
        setCompareVehicles(result.vehicles)
        addMessage(`🤖 Perfect! I found the best ${result.vehicles.length} bikes for you based on AI analysis. Here's my comparison:`)
      } else if (result.vehicles.length === 1) {
        addMessage(`🤖 I found 1 great match for you. Let me show you the details.`)
        setTimeout(() => {
          onClose()
          setTimeout(() => onVehicleSelect(result.vehicles[0]), 150)
        }, 1000)
      } else {
        addMessage(`🤔 I couldn't find exact matches. Let me show you some popular options instead.`)
        const popular = twowheelers.slice(0, 2).map(v => ({
          ...v,
          model_slug: v.model_details?.model_masking_name || v.model_slug,
          display_name: v.bike_name || v.model_details?.model_name,
          ex_showroom_price: v.ex_showroom_price || v.variants?.[0]?.ex_showroom_price || 0,
          make_slug: v.model_details?.make_masking_name || v.make_slug
        }))
        setCompareVehicles(popular)
      }
    } catch (error) {
      console.error('Recommendation error:', error)
      addMessage(`🤔 Let me show you some popular options instead.`)
    }
    
    setIsTyping(false)
  }

  const handleSend = (text = inputText) => {
    if (!text.trim() && !uploadedImage) return
    
    addMessage(text, 'user')
    setInputText('')
    setUploadedImage(null)
    setIsTyping(true)
    
    const prefs = {
      purpose: text,
      budget: 'Not specified',
      type: 'Any',
      additionalContext: text
    }
    
    fetchRecommendations(prefs)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleSelectVehicle = (vehicle) => {
    onClose()
    setTimeout(() => onVehicleSelect(vehicle), 150)
  }

  const handleBuyVehicle = (vehicle) => {
    onClose()
    setTimeout(() => onBuyNow(vehicle), 150)
  }

  const removeFromCompare = (vehicle) => {
    setCompareVehicles(prev => prev.filter(v => v.model_slug !== vehicle.model_slug))
  }

  return (
    <div className="ai-sales-assistant">
      <div className="ai-header">
        <div className="ai-brand">
          <span className="ai-avatar">🤖</span>
          <div>
            <h3>AI Sales Assistant</h3>
            <span className="ai-status">Online</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="ai-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            {msg.type === 'bot' && <span className="bot-avatar">🤖</span>}
            <div className="message-content">
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot typing">
            <span className="bot-avatar">🤖</span>
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {step === 'welcome' && !showGuided && (
          <div className="quick-questions">
            <p className="quick-title">What are you looking for?</p>
            <div className="question-grid">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button key={idx} className="question-btn" onClick={() => handleQuickQuestion(q)}>
                  <span className="q-icon">{q.icon}</span>
                  <span className="q-text">{q.text}</span>
                </button>
              ))}
            </div>
            <div className="guided-flow-prompt">
              <p>Not sure what you want?</p>
              <button className="guided-btn" onClick={startGuidedFlow}>
                <span>✨</span> Let AI guide me
              </button>
            </div>
          </div>
        )}

        {step === 'guided' && (
          <div className="guided-options">
            <div className="options-grid">
              {GUIDED_QUESTIONS[guidedStep]?.options.map((option, idx) => (
                <button 
                  key={idx} 
                  className="option-btn"
                  onClick={() => handleGuidedOption(option)}
                >
                  <span className="opt-icon">{option.icon}</span>
                  <span className="opt-text">{option.text}</span>
                </button>
              ))}
            </div>
            <div className="progress-dots">
              {GUIDED_QUESTIONS.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`dot ${idx === guidedStep ? 'active' : ''} ${idx < guidedStep ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        {compareVehicles.length >= 2 && (
          <div className="ai-recommendation-preview">
            <div className="preview-header">
              <span className="ai-badge">🤖 AI Recommended</span>
              <h3>Top {compareVehicles.length} Picks for You</h3>
              {recommendations?.verdict && (
                <p className="verdict-text">{recommendations.verdict}</p>
              )}
            </div>
            
            <div className="vehicle-preview-cards">
              {compareVehicles.map((vehicle, idx) => (
                <div key={vehicle.model_slug} className="preview-card">
                  <div className="preview-rank">#{idx + 1}</div>
                  <img 
                    src={vehicle.model_image || vehicle.model_details?.image_path || '/products/bikes/default-bike.png'} 
                    alt={vehicle.display_name}
                  />
                  <h4>{vehicle.display_name}</h4>
                  <p className="preview-price">{formatPrice(vehicle.ex_showroom_price)}</p>
                  <p className="preview-reason">
                    {recommendations?.recommendations?.[idx]?.reasoning?.substring(0, 100)}...
                  </p>
                  <div className="preview-actions">
                    <button 
                      className="btn-view"
                      onClick={() => handleSelectVehicle(vehicle)}
                    >
                      View Details
                    </button>
                    <button 
                      className="btn-buy"
                      onClick={() => handleBuyVehicle(vehicle)}
                    >
                      Check Offers
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              className="btn-full-comparison"
              onClick={() => setStep('comparison')}
            >
              ⚖️ See Full Side-by-Side Comparison
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!recommendations && (
        <>
          <div className="ai-mode-switcher">
            <button
              className={`ai-mode-btn ${inputMode === 'text' ? 'active' : ''}`}
              onClick={() => setInputMode('text')}
              title="Text input"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
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

          <div className="ai-input-area">
            {inputMode === 'text' && (
              <>
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
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about bikes, budget, EMI, or availability..."
                    className="ai-text-input"
                  />
                  <button 
                    className="ai-send-btn" 
                    onClick={() => handleSend()} 
                    disabled={(!inputText.trim() && !uploadedImage) || isTyping}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </>
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
                        <span></span><span></span><span></span><span></span><span></span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {inputMode === 'ocr' && (
              <div className="ai-ocr-input">
                <label className="ai-ocr-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span>Click to upload image for OCR</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    hidden
                  />
                </label>
                {uploadedImage && (
                  <div className="ai-ocr-preview">
                    <img src={uploadedImage} alt="OCR Preview" />
                    <button className="ai-send-ocr" onClick={() => handleSend()} disabled={isTyping}>
                      Analyze Image
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {step === 'comparison' && compareVehicles.length >= 2 && (
        <VehicleComparison
          vehicles={compareVehicles}
          onClose={() => setStep('results')}
          onRemove={removeFromCompare}
          formatPrice={formatPrice}
        />
      )}
    </div>
  )
}
