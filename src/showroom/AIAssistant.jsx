import { useState, useRef, useEffect } from 'react'
import { getBikeRecommendations } from '../data/bikes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './AIAssistant.css'

export default function AIAssistant({ context, bikes, onClose, onBikeSelect }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [inputMode, setInputMode] = useState('text')
  const [isListening, setIsListening] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [showRecommendations, setShowRecommendations] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  // Initialize with welcome message based on context
  useEffect(() => {
    let welcomeMsg = "Hello! I'm your AI Bike Assistant. How can I help you today?"
    
    if (context?.type === 'recommendation') {
      welcomeMsg = "I'd be happy to help you find the perfect bike! What's your budget range and preferred mileage?"
      setShowRecommendations(true)
    } else if (context?.type === 'bike' && context?.bike) {
      welcomeMsg = `I can tell you all about the ${context.bike.name}. What would you like to know?`
    } else if (context?.type === 'checkout' && context?.bike) {
      welcomeMsg = `I can help you with offers and financing options for the ${context.bike.name}. What information do you need?`
    }

    setMessages([{
      id: Date.now(),
      type: 'bot',
      text: welcomeMsg
    }])
  }, [context])

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex
        const transcript = event.results[current][0].transcript
        if (event.results[current].isFinal) {
          setInput(transcript)
          sendMessage(transcript)
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Check for budget/mileage in message for recommendations
    const budgetMatch = text.match(/(\d+)\s*(k|thousand|lakh|lac)?/i)
    const mileageMatch = text.match(/(\d+)\s*(kmpl|mileage|km)/i)

    if (budgetMatch || mileageMatch || showRecommendations) {
      const budget = budgetMatch ? parseInt(budgetMatch[1]) * (budgetMatch[2]?.toLowerCase().includes('l') ? 100000 : 1000) : null
      const mileage = mileageMatch ? parseInt(mileageMatch[1]) : null

      const recs = getBikeRecommendations({ budget, mileage })
      if (recs.length > 0) {
        setRecommendations(recs)
      }
    }

    // Call AI backend
    try {
      const contextPrompt = context?.bike 
        ? `User is asking about ${context.bike.name} bike. Price: ₹${context.bike.price}, Mileage: ${context.bike.mileage}, Engine: ${context.bike.engine}. `
        : ''

      const response = await fetch("https://grid.ai.juspay.net/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 4096,
          messages: [
            {
              role: "system",
              content: `You are a helpful bike showroom assistant. You help customers with bike recommendations, specifications, pricing, EMI options, test ride bookings, and general queries about bikes in the showroom. Be friendly, concise, and helpful. Available bikes include Hero Splendor, Hero HF Deluxe, and other Hero models with prices ranging from ₹50,000 to ₹1,50,000.`
            },
            {
              role: "user",
              content: contextPrompt + text
            }
          ]
        })
      })

      const data = await response.json()
      const aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. How else can I help you?"

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: aiResponse
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('AI Error:', error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "I'm having trouble connecting. But I can still help you browse our bikes! What are you looking for?"
      }])
    }

    setIsTyping(false)
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const speakText = (text) => {
    if (!window.speechSynthesis) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-header-info">
            <div className="ai-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="5"/>
                <path d="M20 21a8 8 0 1 0-16 0"/>
              </svg>
            </div>
            <div>
              <h2>AI Bike Assistant</h2>
              <span className="ai-status">{isTyping ? 'Typing...' : 'Online'}</span>
            </div>
          </div>
          <button className="ai-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="ai-recommendations">
              <p className="ai-rec-title">Recommended for you:</p>
              <div className="ai-rec-grid">
                {recommendations.map(bike => (
                  <div 
                    key={bike.id} 
                    className="ai-rec-card"
                    onClick={() => onBikeSelect(bike)}
                  >
                    <div className="ai-rec-image">
                      {bike.image ? (
                        <img src={bike.image} alt={bike.name} />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="5.5" cy="17.5" r="3.5"/>
                          <circle cx="18.5" cy="17.5" r="3.5"/>
                          <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>
                        </svg>
                      )}
                    </div>
                    <span className="ai-rec-name">{bike.name}</span>
                    <span className="ai-rec-price">{bike.formattedPrice}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map(msg => (
            <div key={msg.id} className={`ai-message ${msg.type}`}>
              {msg.type === 'bot' && (
                <div className="ai-msg-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M20 21a8 8 0 1 0-16 0"/>
                  </svg>
                </div>
              )}
              <div className="ai-msg-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                {msg.type === 'bot' && (
                  <button 
                    className="ai-speak-btn"
                    onClick={() => speakText(msg.text)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="ai-message bot">
              <div className="ai-msg-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="5"/>
                  <path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
              </div>
              <div className="ai-msg-content">
                <div className="ai-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="ai-input-section">
          {/* Mode Toggle */}
          <div className="ai-mode-toggle">
            <button 
              className={inputMode === 'text' ? 'active' : ''}
              onClick={() => setInputMode('text')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
              </svg>
              Text
            </button>
            <button 
              className={inputMode === 'speech' ? 'active' : ''}
              onClick={() => setInputMode('speech')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              Voice
            </button>
          </div>

          {/* Input Area */}
          {inputMode === 'text' ? (
            <div className="ai-text-input">
              <input
                type="text"
                placeholder="Ask me about bikes, prices, EMI, test rides..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                className="ai-send"
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="ai-speech-input">
              <button 
                className={`ai-mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <p>{isListening ? 'Listening...' : 'Tap to speak'}</p>
              {isListening && (
                <div className="ai-waveform">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="ai-quick-actions">
            <button onClick={() => sendMessage("What's the best bike under 1 lakh?")}>
              Best under ₹1L
            </button>
            <button onClick={() => sendMessage("Which bike has the best mileage?")}>
              Best mileage
            </button>
            <button onClick={() => sendMessage("Tell me about EMI options")}>
              EMI options
            </button>
            <button onClick={() => sendMessage("Book a test ride")}>
              Test ride
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
