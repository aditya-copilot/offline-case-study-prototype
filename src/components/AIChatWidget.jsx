import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import './AIChatWidget.css'
import InstantEMIForm from './InstantEMIForm'

// Backend API endpoint - configure this to your backend URL

// Categories data
const categories = [
  {
    id: 'popular',
    title: 'Popular Products',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    color: '#f59e0b',
    items: [
      { name: 'Wireless Earbuds', price: '$49.99', image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=300&h=300&fit=crop', offer: '20% OFF' },
      { name: 'Smart Watch', price: '$199.99', image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=300&h=300&fit=crop', offer: 'Bestseller' },
      { name: 'Laptop Stand', price: '$34.99', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop', offer: 'Buy 2 Get 1' },
      { name: 'USB-C Hub', price: '$29.99', image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=300&h=300&fit=crop', offer: 'Limited' }
    ]
  },
  {
    id: 'trending',
    title: 'Trending Items',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    color: '#10b981',
    items: [
      { name: 'AI Speaker', price: '$129.99', image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=300&h=300&fit=crop', offer: 'New' },
      { name: 'Smart Home Kit', price: '$89.99', image: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=300&h=300&fit=crop', offer: 'Hot' },
      { name: 'Fitness Tracker', price: '$59.99', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300&h=300&fit=crop', offer: '-30%' },
      { name: 'LED Strip Lights', price: '$19.99', image: 'https://images.unsplash.com/photo-1550985543-49bee3167284?w=300&h=300&fit=crop', offer: 'Sale' }
    ]
  },
  {
    id: 'seasonal',
    title: 'Seasonal Recommendations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    color: '#ec4899',
    items: [
      { name: 'Air Purifier', price: '$149.99', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&h=300&fit=crop', offer: 'Sale' },
      { name: 'Humidifier', price: '$39.99', image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300&h=300&fit=crop', offer: '-25%' },
      { name: 'Cozy Blanket', price: '$24.99', image: 'https://images.unsplash.com/photo-1580301762395-21ce6d555b43?w=300&h=300&fit=crop', offer: 'Deal' },
      { name: 'Hot Drink Maker', price: '$69.99', image: 'https://images.unsplash.com/photo-1517256673644-36ad11246d21?w=300&h=300&fit=crop', offer: 'Hot' }
    ]
  },
  {
    id: 'deals',
    title: 'Best Deals',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    color: '#ef4444',
    items: [
      { name: 'Headphones 50% Off', price: '$39.99', originalPrice: '$79.99', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', offer: '-50%' },
      { name: 'Tablet Sale', price: '$249.99', originalPrice: '$399.99', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop', offer: 'Sale' },
      { name: 'Keyboard Bundle', price: '$59.99', originalPrice: '$99.99', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop', offer: '-40%' },
      { name: 'Monitor Deal', price: '$299.99', originalPrice: '$499.99', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop', offer: 'Deal' }
    ]
  }
]

function AIChatWidget() {
  const location = useLocation()
  const [inputMode, setInputMode] = useState('text')
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [activeCategory, setActiveCategory] = useState(0)

  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)
  const offersScrollRef = useRef(null)
  const [activeOfferIndex, setActiveOfferIndex] = useState(0)

  // Offers data for carousel
  const offers = [
    { color: '#3b82f6', bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', icon: 'card', tag: 'Bank Offer', desc: '10% off on XYZ Bank Credit Cards, up to ₹750', link: 'T&C' },
    { color: '#3b82f6', bg: 'linear-gradient(135deg, #60a5fa, #3b82f6)', icon: 'card', tag: 'Bank Offer', desc: '10% off on XYZ Bank Debit Cards, up to ₹500', link: 'T&C' },
    { color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: 'star', tag: 'Special Price', desc: 'Get extra 5% off (price inclusive of cashback/coupon)', link: 'T&C' },
    { color: '#8b5cf6', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', icon: 'user', tag: 'Partner Offer', desc: 'Sign-up for Pay Later & get free Times Prime Benefits worth ₹10,000', link: 'Know More' },
    { color: '#10b981', bg: 'linear-gradient(135deg, #10b981, #059669)', icon: 'rupee', tag: 'No Cost EMI', desc: 'Starting from ₹1,500/month. Easy installments available.', link: 'View Plans' }
  ]

  // Initialize first offer as active
  useEffect(() => {
    if (offersScrollRef.current && messages.length === 0) {
      const container = offersScrollRef.current
      container.scrollLeft = 0
    }
  }, [messages])


  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-swipe carousel every 3 seconds
  useEffect(() => {
    if (messages.length > 0) return
    const timer = setInterval(() => {
      setActiveCategory(prev => (prev + 1) % categories.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [messages.length])

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

      const response = await fetch("https://grid.ai.juspay.net/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({
          model: "kimi-latest",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      // Handle OpenAI-compatible response format
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content
      } else if (data.response) {
        return data.response
      } else if (data.message) {
        return data.message
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

  const handleItemClick = (item) => {
    sendMessage(`Tell me more about ${item}`)
  }

  // Handle offers scroll to update active center card
  const handleOffersScroll = useCallback(() => {
    if (!offersScrollRef.current) return
    const container = offersScrollRef.current
    const scrollLeft = container.scrollLeft
    const cardWidth = 152 // 140px card + 12px gap
    const centerIndex = Math.round(scrollLeft / cardWidth)
    setActiveOfferIndex(Math.max(0, Math.min(centerIndex, offers.length - 1)))
  }, [offers.length])

  // Fallback placeholder for broken images
  const placeholderImage = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="300" fill="#e2e8f0"/>
      <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="40" fill="#94a3b8" text-anchor="middle">📷</text>
      <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Product Image</text>
    </svg>
  `)

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
            <h1>Shopping Assistant</h1>
            <span className={`ai-status ${isTyping ? 'typing' : ''}`}>
              {isTyping ? 'Typing...' : 'Online'}
            </span>
          </div>
        </div>
      </div>


      {/* Messages Area */}
      <div className="ai-fullscreen-messages">
        {location.pathname === '/checkout/user-input' && <InstantEMIForm />}
        {messages.length === 0 ? (
          <div className="ai-welcome-container">
            {/* Single Carousel Space */}
            <div className="ai-shop-carousel">
              {/* Category Tabs */}
              <div className="ai-category-tabs">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    className={`ai-category-tab ${activeCategory === index ? 'active' : ''}`}
                    onClick={() => setActiveCategory(index)}
                    style={{ '--tab-color': category.color }}
                  >
                    <div className="ai-tab-icon">
                      {category.icon}
                    </div>
                    <span>{category.title}</span>
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="ai-products-space">
                <div className="ai-products-grid" key={categories[activeCategory].id}>
                  {categories[activeCategory].items.slice(0, 2).map((item, index) => (
                    <button
                      key={index}
                      className="ai-product-card"
                      onClick={() => handleItemClick(item.name)}
                      style={{ '--accent-color': categories[activeCategory].color }}
                    >
                      <div className="ai-product-image">
                        {item.offer && (
                          <span className="ai-product-offer">{item.offer}</span>
                        )}
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = placeholderImage
                            e.target.onerror = null
                          }}
                        />
                      </div>
                      <div className="ai-product-info">
                        <span className="ai-product-name">{item.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Carousel Dots */}
              <div className="ai-carousel-dots">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    className={`ai-carousel-dot ${activeCategory === index ? 'active' : ''}`}
                    onClick={() => setActiveCategory(index)}
                    style={{ '--dot-color': category.color }}
                  />
                ))}
              </div>
            </div>

            {/* Offers Section - Swipeable Cards */}
            <div className="ai-offers-section">
              <div className="ai-offers-header">
                <svg className="ai-offers-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <h3 className="ai-offers-title">Available Offers</h3>
              </div>
              <div
                className="ai-offers-scroll"
                ref={offersScrollRef}
                onScroll={handleOffersScroll}
              >
                {offers.map((offer, index) => (
                  <div
                    key={index}
                    className={`ai-offer-card ${activeOfferIndex === index ? 'active' : ''}`}
                    style={{ '--offer-color': offer.color, '--offer-bg': offer.bg }}
                  >
                    <div className="ai-offer-card-icon">
                      {offer.icon === 'card' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                      )}
                      {offer.icon === 'star' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      )}
                      {offer.icon === 'user' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      )}
                      {offer.icon === 'rupee' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      )}
                    </div>
                    <span className="ai-offer-card-tag">{offer.tag}</span>
                    <p className="ai-offer-card-desc">{offer.desc}</p>
                    <a href="#" className="ai-offer-card-link">{offer.link}</a>
                  </div>
                ))}
              </div>
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
