import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './TwoWheelerChatWidget.css'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useOffer } from '../../context/OfferContext'
import { twowheelers } from '../../data/bike/twowheelerProducts'
import {
  parseUserIntent,
  getVehicleType,
  getPowerDisplay,
  getEfficiencyDisplay,
  getVehicleAvailability,
  calculateEMI,
  getVehicleOffers,
  showroomConfig
} from '../../data/bike/recommendationEngine'
import { bikeAIRecommendationService } from '../../services/BikeAIRecommendationService'

const VEHICLE_TYPE_ICON = {
  bikes: '🏍️',
  scooters: '🛵',
  'electric+vehicles': '⚡'
}

// Categories data for carousel
const categories = [
  {
    id: 'popular',
    title: 'Popular Bikes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    color: '#f59e0b',
    items: [
      { name: 'Honda CB Shine', price: '₹52,900', image: 'https://assets.otocapital.in/staging/09403d52-dac4-4521-9b83-491fa84bb52d.jpeg', offer: 'Best Seller' },
      { name: 'Bajaj Pulsar 125', price: '₹83,245', image: 'https://assets.otocapital.in/production/bc47bd65-5e3b-46fb-a3ff-8d7e24c8cbd2.png', offer: 'Popular' },
      { name: 'TVS Apache RTR 160', price: '₹1,09,240', image: 'https://assets.otocapital.in/staging/58b3df8d-3a95-42b4-a3b4-478e1d6423c4.jpeg', offer: 'Top Rated' },
      { name: 'Royal Enfield Hunter 350', price: '₹1,43,776', image: 'https://assets.otocapital.in/staging/d930b6d1-8c00-49af-8593-737749500d7e.jpeg', offer: 'Trending' }
    ]
  },
  {
    id: 'electric',
    title: 'Electric Vehicles',
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
    color: '#10b981',
    items: [
      { name: 'Ather 450S', price: '₹1,11,016', image: 'https://assets.otocapital.in/production/ather-450s-image.png', offer: '⚡ EV' },
      { name: 'Ola Electric S1 X', price: '₹67,795', image: 'https://assets.otocapital.in/production/29ac283a-2a6a-4e9a-8d77-5b3fd79870f8.png', offer: '⚡ EV' },
      { name: 'Ola Electric S1', price: '₹80,507', image: 'https://assets.otocapital.in/production/anthracite-grey-ola-electric-s1-image.jpeg', offer: '⚡ EV' },
      { name: 'Vida V1', price: '₹1,19,900', image: 'https://assets.otocapital.in/production/b2c15319-e05c-4897-84ed-27df2985a852.png', offer: '⚡ EV' }
    ]
  },
  {
    id: 'scooters',
    title: 'Best Scooters',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    color: '#ec4899',
    items: [
      { name: 'Honda Activa 6G', price: '₹76,234', image: 'https://assets.otocapital.in/staging/b4f53b89-0a51-48a5-808a-f3d87c8722c7.jpeg', offer: 'Family' },
      { name: 'TVS Jupiter', price: '₹73,340', image: 'https://assets.otocapital.in/staging/8ff6681b-1e5e-4c60-bf4b-7df7c96c9cdf.jpeg', offer: 'Mileage' },
      { name: 'Suzuki Access 125', price: '₹78,564', image: 'https://assets.otocapital.in/staging/10d01e19-1ecd-43ce-8f67-7532d9eef955.webp', offer: 'Reliable' },
      { name: 'TVS NTorq 125', price: '₹84,536', image: 'https://assets.otocapital.in/staging/e4c8adef-f06e-456c-9d80-7f5bedf1fef9.png', offer: 'Sporty' }
    ]
  },
  {
    id: 'premium',
    title: 'Premium Bikes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    color: '#ef4444',
    items: [
      { name: 'Royal Enfield Classic 350', price: '₹1,93,080', image: 'https://assets.otocapital.in/staging/d930b6d1-8c00-49af-8593-737749500d7e.jpeg', offer: 'Iconic' },
      { name: 'Yamaha R15 V4', price: '₹1,82,856', image: 'https://assets.otocapital.in/staging/1367373b-b781-418a-bb6f-08f210b3b64d.jpeg', offer: 'Racing' },
      { name: 'KTM Duke 200', price: '₹1,96,620', image: 'https://assets.otocapital.in/staging/59ae8c86-5c96-4864-98f2-c9438c11bd4c.jpeg', offer: 'Power' },
      { name: 'Bajaj Dominar 400', price: '₹2,22,385', image: 'https://assets.otocapital.in/staging/7d6900af-430d-4ed8-96d8-2876accda34a.jpeg', offer: 'Touring' }
    ]
  }
]

const WELCOME_MESSAGES = [
  "👋 Welcome to HyperCredit 2-Wheeler Showroom!",
  "I'm your AI assistant, here to help you find the perfect ride!"
]

const SUGGESTED_PROMPTS = [
  "Show me electric bikes under 1 lakh",
  "Best scooter for family use",
  "Honda bikes below 1.5 lakh",
  "Compare Pulsar vs Apache",
  "Top rated bikes under 80000"
]

export default function TwoWheelerChatWidget({ toolCallUtils }) {
  const navigate = useNavigate()
  const { selectProduct } = useOffer()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [searchResults, setSearchResults] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [userPreferences, setUserPreferences] = useState({})
  const [conversationStage, setConversationStage] = useState('welcome')
  const [typingText, setTypingText] = useState('')
  const [inputMode, setInputMode] = useState('text')
  const [activeCategory, setActiveCategory] = useState(0)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [speechSupported, setSpeechSupported] = useState(true)
  
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const hasShownWelcome = useRef(false)
  const inputModeRef = useRef('text')

  useEffect(() => {
    inputModeRef.current = inputMode
    if(inputMode !== 'speech'){
      setIsListening(false)
    }
  }, [inputMode])

  useEffect(() => {
    initSpeechRecognition()
    if (!hasShownWelcome.current) {
      hasShownWelcome.current = true
      showWelcomeMessages()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingText])

  // Auto-swipe carousel every 3 seconds
  useEffect(() => {
    if (messages.length > 0) return
    const timer = setInterval(() => {
      setActiveCategory(prev => (prev + 1) % categories.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [messages.length])

  useEffect(() => {
    if(!isListening){
      window.speechSynthesis.cancel()
    }
  }, [isListening])

  useEffect(() => {
    document.body.style.overflow = selectedVehicle ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedVehicle])

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
          handleSendMessage(transcriptText)
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

  const showWelcomeMessages = async () => {
    for (const msg of WELCOME_MESSAGES) {
      await typeMessage(msg, 'bot')
    }
  }

  const typeMessage = async (text, type) => {
    setIsTyping(true)
    setTypingText('')
    
    for (let i = 0; i <= text.length; i++) {
      setTypingText(text.slice(0, i))
      await new Promise(r => setTimeout(r, 20))
    }
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      type,
      text,
      timestamp: new Date()
    }])
    setTypingText('')
    setIsTyping(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return

    const userMsg = text.trim()
    setInputText('')
    setUploadedImage(null)
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: userMsg,
      timestamp: new Date()
    }])

    await processUserMessage(userMsg)
  }

  const processUserMessage = async (message) => {
    setIsTyping(true)
    const intent = parseUserIntent(message)
    console.log('User message:', message)
    console.log('Parsed intent:', intent)
    const newPrefs = { ...userPreferences }
    if (intent.filters.priceRange) {
      newPrefs.priceRange = intent.filters.priceRange
    }
    Object.keys(intent.filters).forEach(key => {
      if (key !== 'priceRange') {
        newPrefs[key] = intent.filters[key]
      }
    })
    console.log('New preferences:', newPrefs)
    setUserPreferences(newPrefs)

    if (intent.action === 'emi_query') {
      await handleEMIQuery(newPrefs)
    } else if (intent.action === 'availability_query') {
      await handleAvailabilityQuery(newPrefs)
    } else if (intent.action === 'recommendation' || Object.keys(intent.filters).length > 0) {
      await handleRecommendationQuery(newPrefs, message)
    } else {
      await handleGeneralQuery(message, newPrefs)
    }
    
    setIsTyping(false)
  }

  const handleRecommendationQuery = async (prefs, originalMessage = '') => {
    console.log('handleRecommendationQuery prefs:', JSON.stringify(prefs, null, 2))
    
    const aiPrefs = {
      purpose: prefs.purpose || 'General use',
      budget: prefs.priceRange ? 
        `₹${prefs.priceRange.min || 0} - ₹${prefs.priceRange.max === Infinity ? '+' : prefs.priceRange.max.toLocaleString()}` : 
        'Not specified',
      type: prefs.vehicleType === 'EV' ? 'Electric' : 
            prefs.vehicleCategory === 'scooters' ? 'Scooter' : 
            prefs.vehicleCategory === 'bikes' ? 'Motorcycle' : 'Any',
      brand: prefs.brand || undefined,
      additionalContext: originalMessage
    }
    
    setIsTyping(true)
    const result = await bikeAIRecommendationService.getRecommendations(aiPrefs)
    setIsTyping(false)
    
    console.log('AI recommendations result:', result)
    const recommendations = result.success ? result.vehicles.map(v => v.vehicleData).filter(Boolean) : []
    const msg = originalMessage.toLowerCase()
    
    const filterDescriptions = []
    if (prefs.vehicleType === 'EV') filterDescriptions.push('electric')
    if (prefs.vehicleType === 'ICE') filterDescriptions.push('petrol')
    if (prefs.vehicleCategory === 'scooters') filterDescriptions.push('scooters')
    if (prefs.vehicleCategory === 'bikes') filterDescriptions.push('bikes')
    if (prefs.brand) filterDescriptions.push(prefs.brand)
    if (prefs.priceRange?.max && prefs.priceRange.max < Infinity) {
      filterDescriptions.push(`under ₹${prefs.priceRange.max.toLocaleString()}`)
    }
    if (prefs.model) filterDescriptions.push(prefs.model)
    
    const filterText = filterDescriptions.length > 0 ? filterDescriptions.join(' ') : ''
    
    if (recommendations.length === 0) {
      const typeText = filterText || 'vehicles'
      await typeMessage(`I couldn't find any ${typeText} matching your criteria. Let me show you some popular options instead! 🏍️`, 'bot')
      setSearchResults(twowheelers.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6))
    } else {
      const count = recommendations.length
      let messageText = `🤖 Perfect! I found ${count} ${filterText} vehicle${count > 1 ? 's' : ''} for you`
      
      if (msg.includes('best') || msg.includes('top')) {
        messageText = `🤖 Here are the top ${filterText} options based on AI analysis! ⭐`
      } else if (msg.includes('cheap') || msg.includes('affordable')) {
        messageText = `🤖 Here are the most affordable ${filterText} options! 💰`
      }
      
      if (result.verdict?.bestChoice) {
        messageText += `\n\n🏆 **Top Pick: ${result.verdict.bestChoice}**`
      }
      
      await typeMessage(messageText + '\n\n👇 Here are your personalized recommendations:', 'bot')
      setSearchResults(recommendations.slice(0, 6))
    }
    
    setShowWelcome(false)
    setConversationStage('results')
  }

  const handleEMIQuery = async (prefs) => {
    const price = prefs.priceRange?.max || 100000
    const emiDetails = calculateEMI(price, 0, 36, 8.5)
    
    const emiMessage = `📊 **EMI Calculation**

Vehicle Price: ₹${price.toLocaleString()}
💰 Down Payment: ₹0
📅 Monthly EMI: ₹${emiDetails.emi.toLocaleString()}
⏱️ Duration: ${emiDetails.tenureMonths} months
📈 Interest: ${emiDetails.interestRate}%

Showing bikes in this budget...`

    await typeMessage(emiMessage, 'bot')
    
    const budgetBikes = twowheelers.filter(v => 
      v.ex_showroom_price >= price * 0.8 && 
      v.ex_showroom_price <= price * 1.2
    ).sort((a, b) => b.rating - a.rating)
    
    setSearchResults(budgetBikes.slice(0, 6))
    setShowWelcome(false)
    setConversationStage('results')
  }

  const handleAvailabilityQuery = async (prefs) => {
    const availableNow = twowheelers.filter(v => {
      const avail = getVehicleAvailability(v.model_slug)
      return avail && (avail.code === 'in_stock' || avail.code === 'fast')
    })
    
    if (availableNow.length === 0) {
      await typeMessage("I'm checking our latest inventory... Here are our most popular bikes available for quick delivery! 🚀", 'bot')
      setSearchResults(twowheelers.filter(v => v.rating >= 4.3).slice(0, 6))
    } else {
      await typeMessage(`Great! Found ${availableNow.length} bikes ready for delivery within 2-3 days. Book your test ride now! 🏍️`, 'bot')
      setSearchResults(availableNow.slice(0, 6))
    }
    setShowWelcome(false)
    setConversationStage('results')
  }

  const handleGeneralQuery = async (message, prefs) => {
    try {
      const response = await fetch("https://grid.ai.juspay.net/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          messages: [
            {
              role: "system",
              content: `You are a helpful 2-wheeler showroom assistant. You have access to ${twowheelers.length} vehicles ranging from ₹${Math.min(...twowheelers.map(v => v.ex_showroom_price)).toLocaleString()} to ₹${Math.max(...twowheelers.map(v => v.ex_showroom_price)).toLocaleString()}. Keep responses friendly, concise, and ask follow-up questions to help narrow down preferences.`
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      })

      const data = await response.json()
      const aiResponse = data.choices?.[0]?.message?.content || "I'm here to help you find the perfect 2-wheeler! What type are you looking for?"
      
      await typeMessage(aiResponse, 'bot')
    } catch (error) {
      await typeMessage("I'm here to help you find the perfect 2-wheeler! You can ask about budget options, electric vehicles, or specific brands. What would you like to explore? 🏍️", 'bot')
    }
  }

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle)
    // Store selected product in context
    selectProduct({
      id: vehicle.model_slug,
      name: vehicle.display_name,
      brand: vehicle.make_slug,
      price: vehicle.ex_showroom_price,
      image: vehicle.model_image,
      category: vehicle.vehicle_type_slug === 'electric+vehicles' ? 'Electric Vehicle' : 'Two Wheeler',
      rating: vehicle.rating,
      offers: getVehicleOffers(vehicle)
    }, 'bike')
  }

  const closeVehicleDetail = () => {
    setSelectedVehicle(null)
  }

  const handleBookTestRide = async (vehicle) => {
    setSelectedVehicle(null)
    await typeMessage(`🎉 Test ride booked for **${vehicle.display_name}**! Our showroom executive will call you within 30 minutes to confirm your slot. Get ready for an exciting ride!`, 'bot')
  }

  const handleCalculateEMI = async (vehicle, emiDetails) => {
    setSelectedVehicle(null)
    await typeMessage(`📊 **EMI for ${vehicle.display_name}**

💰 Loan Amount: ${formatPrice(vehicle.ex_showroom_price)}
📅 Monthly EMI: ₹${emiDetails.emi.toLocaleString()}
⏱️ Tenure: ${emiDetails.tenureMonths} months

You can apply for loan at checkout. Would you like to proceed with booking?`, 'bot')
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser')
      return
    }

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
    const vehicle = twowheelers.find(v => v.display_name === item.name)
    if (vehicle) {
      handleVehicleClick(vehicle)
    } else {
      handleSendMessage(`Tell me more about ${item.name}`)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const getVehicleBadges = (vehicle) => {
    const badges = []
    const type = getVehicleType(vehicle)

    if (type === 'EV') {
      badges.push({ text: 'EV', color: '#10b981', icon: '⚡' })
    }

    if (vehicle.rating >= 4.5) {
      badges.push({ text: 'Top Rated', color: '#f59e0b', icon: '⭐' })
    }

    const avail = getVehicleAvailability(vehicle.model_slug)
    if (avail.code === 'in_stock') {
      badges.push({ text: 'In Stock', color: '#3b82f6', icon: '✅' })
    }

    return badges
  }

  return (
    <div className="tw-chat-container">
      {/* Header */}
      <div className="tw-chat-header">
        <div className="tw-header-content">
          <div className="tw-bot-avatar">
            <span className="tw-avatar-icon">🏍️</span>
            <div className="tw-avatar-pulse"></div>
          </div>
          <div className="tw-header-info">
            <h1>HyperCredit Showroom</h1>
            <span className={`tw-status ${isTyping ? 'typing' : ''}`}>
              {isTyping ? 'Typing...' : isListening ? 'Listening...' : 'Online'}
            </span>
          </div>
        </div>
        <div className="tw-showroom-badge">
          <span>🕐 {showroomConfig.openingHours}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="tw-messages-area">
        {/* Welcome Section with Carousel */}
        {showWelcome && messages.length === 0 && (
          <div className="tw-welcome-section">
            {/* Category Carousel */}
            <div className="tw-shop-carousel">
              {/* Category Tabs */}
              <div className="tw-category-tabs">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    className={`tw-category-tab ${activeCategory === index ? 'active' : ''}`}
                    onClick={() => setActiveCategory(index)}
                    style={{ '--tab-color': category.color }}
                  >
                    <div className="tw-tab-icon">
                      {category.icon}
                    </div>
                    <span>{category.title}</span>
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="tw-products-space">
                <div className="tw-products-grid" key={categories[activeCategory].id}>
                  {categories[activeCategory].items.slice(0, 2).map((item, index) => (
                    <button
                      key={index}
                      className="tw-product-card"
                      onClick={() => handleItemClick(item)}
                      style={{ '--accent-color': categories[activeCategory].color }}
                    >
                      <div className="tw-product-image">
                        {item.offer && (
                          <span className="tw-product-offer">{item.offer}</span>
                        )}
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                        />
                      </div>
                      <div className="tw-product-info">
                        <span className="tw-product-name">{item.name}</span>
                        <span className="tw-product-price">{item.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Carousel Dots */}
              <div className="tw-carousel-dots">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    className={`tw-carousel-dot ${activeCategory === index ? 'active' : ''}`}
                    onClick={() => setActiveCategory(index)}
                    style={{ '--dot-color': category.color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="tw-suggested-prompts">
              <h4>Try asking:</h4>
              <div className="tw-prompts-list">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    className="tw-prompt-chip"
                    onClick={() => {
                      setInputText(prompt)
                      handleSendMessage(prompt)
                    }}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="tw-messages-list">
          {messages.map((msg) => (
            <div key={msg.id} className={`tw-message ${msg.type}`}>
              {msg.type === 'bot' && (
                <div className="tw-message-avatar">
                  <span>🏍️</span>
                </div>
              )}
              <div className="tw-message-bubble">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>
                <span className="tw-message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {typingText && (
            <div className="tw-message bot">
              <div className="tw-message-avatar">
                <span>🏍️</span>
              </div>
              <div className="tw-message-bubble typing">
                {typingText}
                <span className="tw-cursor">|</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="tw-results-section">
            <div className="tw-results-header">
              <h3>Recommended for You</h3>
              <span className="tw-results-count">{searchResults.length} vehicles found</span>
            </div>
            <div className="tw-vehicles-grid">
              {searchResults.map((vehicle, index) => {
                const availability = getVehicleAvailability(vehicle.model_slug)
                const badges = getVehicleBadges(vehicle)
                const offers = getVehicleOffers(vehicle)
                
                return (
                  <div
                    key={vehicle.model_slug}
                    className="tw-vehicle-card"
                    onClick={() => handleVehicleClick(vehicle)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="tw-card-image">
                      <img
                        src={vehicle.model_image}
                        alt={vehicle.display_name}
                        loading="lazy"
                      />
                      <div className="tw-card-badges">
                        {badges.map((badge, i) => (
                          <span
                            key={i}
                            className="tw-badge"
                            style={{ background: badge.color }}
                          >
                            {badge.icon} {badge.text}
                          </span>
                        ))}
                      </div>
                      <div className="tw-availability-badge" style={{ background: availability.color }}>
                        {availability.badge} {availability.deliveryTime}
                      </div>
                    </div>
                    
                    <div className="tw-card-info">
                      <h4 className="tw-vehicle-name">{vehicle.display_name}</h4>
                      <div className="tw-vehicle-specs">
                        <span className="tw-spec">
                          <span className="tw-spec-icon">⚡</span>
                          {getPowerDisplay(vehicle)}
                        </span>
                        <span className="tw-spec">
                          <span className="tw-spec-icon">⛽</span>
                          {getEfficiencyDisplay(vehicle)}
                        </span>
                        <span className="tw-spec">
                          <span className="tw-spec-icon">⭐</span>
                          {vehicle.rating}
                        </span>
                      </div>
                      <div className="tw-price-row">
                        <span className="tw-price">{formatPrice(vehicle.ex_showroom_price)}</span>
                        <span className="tw-ex-showroom">Ex-Showroom</span>
                      </div>
                      {offers.length > 0 && (
                        <div className="tw-offers-row">
                          <span className="tw-offer-tag">
                            {offers[0].title}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {searchResults.length > 6 && (
              <button className="tw-view-more-btn">
                View More Vehicles ({searchResults.length - 6} more)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input Section with Mode Selector */}
      <div className="tw-input-section">
        {/* Input Mode Selector */}
        <div className="tw-mode-selector">
          <button
            className={`tw-mode-btn ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => setInputMode('text')}
            title="Text Input"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7V4h16v3M9 20h6M12 4v16" />
            </svg>
            <span>Text</span>
          </button>
          <button
            className={`tw-mode-btn ${inputMode === 'speech' ? 'active' : ''}`}
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
            className={`tw-mode-btn ${inputMode === 'ocr' ? 'active' : ''}`}
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
        <div className="tw-input-container">
          {inputMode === 'text' && (
            <>
              {uploadedImage && (
                <div className="tw-image-preview">
                  <img src={uploadedImage} alt="Preview" />
                  <button className="tw-remove-image" onClick={clearImage}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="tw-input-row">
                <label className="tw-attach-btn" title="Attach image">
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
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about bikes, budget, EMI, or availability..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="tw-text-input"
                />
                <button
                  className="tw-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isTyping}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {inputMode === 'speech' && (
            <div className="tw-speech-input">
              {!speechSupported ? (
                <p className="tw-error">Speech recognition is not supported in your browser. Please use Chrome or Edge.</p>
              ) : (
                <>
                  <button
                    className={`tw-mic-btn ${isListening ? 'listening' : ''}`}
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
                    <div className="tw-waveform">
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
            <div className="tw-ocr-input">
              {uploadedImage ? (
                <div className="tw-ocr-preview">
                  <img src={uploadedImage} alt="Preview" />
                  <div className="tw-ocr-actions">
                    <button
                      className="tw-ocr-send-btn"
                      onClick={() => handleSendMessage('Please analyze this image and extract any text from it.')}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      Analyze Image
                    </button>
                    <button className="tw-ocr-clear-btn" onClick={clearImage}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <label className="tw-upload-btn">
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
                  <p className="tw-ocr-hint">Upload an image to analyze and extract text</p>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="tw-input-hints">
          <span>Try: "Show me electric bikes under 1 lakh" or "What's the EMI for Pulsar?"</span>
        </div>
      </div>

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          onClose={closeVehicleDetail}
          formatPrice={formatPrice}
          onBookTestRide={handleBookTestRide}
          onCalculateEMI={handleCalculateEMI}
          navigate={navigate}
        />
      )}
    </div>
  )
}

function VehicleDetailModal({ vehicle, onClose, formatPrice, onBookTestRide, onCalculateEMI, navigate }) {
  const [emiDetails, setEmiDetails] = useState(null)
  const [showTestRideForm, setShowTestRideForm] = useState(false)
  const [testRideBooked, setTestRideBooked] = useState(false)
  const [showEMIDetails, setShowEMIDetails] = useState(false)
  const [tenure, setTenure] = useState(36)
  const availability = getVehicleAvailability(vehicle.model_slug)
  const offers = getVehicleOffers(vehicle)
  const type = getVehicleType(vehicle)
  
  useEffect(() => {
    const emi = calculateEMI(vehicle.ex_showroom_price, 0, tenure, 8.5)
    setEmiDetails(emi)
  }, [vehicle, tenure])

  const handleTestRideSubmit = (e) => {
    e.preventDefault()
    setTestRideBooked(true)
    setTimeout(() => {
      onBookTestRide(vehicle)
    }, 1500)
  }

  const handleProceedToLoan = () => {
    // Navigate to loan application flow with form input
    navigate('/checkout/user-input')
  }

  if (testRideBooked) {
    return (
      <div className="tw-modal-overlay" onClick={onClose}>
        <div className="tw-modal-content" onClick={e => e.stopPropagation()}>
          <div className="tw-success-state">
            <div className="tw-success-icon">✅</div>
            <h2>Test Ride Booked!</h2>
            <p>Your test ride for <strong>{vehicle.display_name}</strong> has been scheduled.</p>
            <p className="tw-success-detail">Our executive will call you within 30 minutes to confirm the time slot.</p>
            <button className="tw-btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  if (showTestRideForm) {
    return (
      <div className="tw-modal-overlay" onClick={onClose}>
        <div className="tw-modal-content" onClick={e => e.stopPropagation()}>
          <button className="tw-modal-close" onClick={() => setShowTestRideForm(false)}>×</button>
          <div className="tw-form-header">
            <h2>Book Test Ride</h2>
            <p>{vehicle.display_name}</p>
          </div>
          <form className="tw-test-ride-form" onSubmit={handleTestRideSubmit}>
            <div className="tw-form-group">
              <label>Your Name</label>
              <input type="text" placeholder="Enter your name" required />
            </div>
            <div className="tw-form-group">
              <label>Mobile Number</label>
              <input type="tel" placeholder="+91 XXXXX XXXXX" required />
            </div>
            <div className="tw-form-group">
              <label>Preferred Date</label>
              <input type="date" required />
            </div>
            <div className="tw-form-group">
              <label>Preferred Time Slot</label>
              <select required>
                <option value="">Select time slot</option>
                <option value="morning">Morning (10 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                <option value="evening">Evening (4 PM - 7 PM)</option>
              </select>
            </div>
            <button type="submit" className="tw-btn-primary tw-form-submit">
              Confirm Test Ride
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (showEMIDetails) {
    return (
      <div className="tw-modal-overlay" onClick={onClose}>
        <div className="tw-modal-content" onClick={e => e.stopPropagation()}>
          <button className="tw-modal-close" onClick={() => setShowEMIDetails(false)}>×</button>
          <div className="tw-form-header">
            <h2>EMI Calculator</h2>
            <p>{vehicle.display_name} • {formatPrice(vehicle.ex_showroom_price)}</p>
          </div>
          <div className="tw-emi-calculator">
            <div className="tw-emi-slider-group">
              <label>Tenure</label>
              <div className="tw-tenure-options">
                {[12, 24, 36, 48].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`tw-tenure-btn ${tenure === t ? 'active' : ''}`}
                    onClick={() => setTenure(t)}
                  >
                    {t} months
                  </button>
                ))}
              </div>
            </div>
            
            <div className="tw-emi-result">
              <div className="tw-emi-amount">
                <span className="tw-emi-label">Monthly EMI</span>
                <span className="tw-emi-value">₹{emiDetails?.emi?.toLocaleString()}</span>
              </div>
              <div className="tw-emi-breakdown">
                <div className="tw-breakdown-row">
                  <span>Principal Amount</span>
                  <span>{formatPrice(vehicle.ex_showroom_price)}</span>
                </div>
                <div className="tw-breakdown-row">
                  <span>Total Interest</span>
                  <span>₹{emiDetails?.totalInterest?.toLocaleString()}</span>
                </div>
                <div className="tw-breakdown-row total">
                  <span>Total Amount</span>
                  <span>₹{emiDetails?.totalPayment?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <button 
              className="tw-btn-primary tw-form-submit" 
              onClick={() => {
                setShowEMIDetails(false)
                onCalculateEMI(vehicle, emiDetails)
              }}
            >
              Apply for Loan
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tw-modal-overlay" onClick={onClose}>
      <div className="tw-modal-content" onClick={e => e.stopPropagation()}>
        <button className="tw-modal-close" onClick={onClose}>×</button>
        
        <div className="tw-modal-header">
          <img src={vehicle.model_image} alt={vehicle.display_name} />
          <div className="tw-modal-badges">
            {type === 'EV' && <span className="tw-badge ev">⚡ Electric</span>}
            <span className="tw-badge rating">⭐ {vehicle.rating}</span>
            <span className="tw-badge availability" style={{ background: availability.color }}>
              {availability.badge} {availability.label}
            </span>
          </div>
        </div>
        
        <div className="tw-modal-body">
          <h2>{vehicle.display_name}</h2>
          
          <div className="tw-specs-grid">
            <div className="tw-spec-item">
              <span className="tw-spec-label">Power</span>
              <span className="tw-spec-value">{getPowerDisplay(vehicle)}</span>
            </div>
            <div className="tw-spec-item">
              <span className="tw-spec-label">{type === 'EV' ? 'Range' : 'Mileage'}</span>
              <span className="tw-spec-value">{getEfficiencyDisplay(vehicle)}</span>
            </div>
            {vehicle.top_speed && (
              <div className="tw-spec-item">
                <span className="tw-spec-label">Top Speed</span>
                <span className="tw-spec-value">{vehicle.top_speed}</span>
              </div>
            )}
            {vehicle.charging_time && (
              <div className="tw-spec-item">
                <span className="tw-spec-label">Charging Time</span>
                <span className="tw-spec-value">{vehicle.charging_time}</span>
              </div>
            )}
          </div>
          
          <div className="tw-price-section">
            <div className="tw-ex-showroom-price">
              <span className="tw-label">Ex-Showroom Price</span>
              <span className="tw-value">{formatPrice(vehicle.ex_showroom_price)}</span>
            </div>
            
            {emiDetails && (
              <div className="tw-emi-info">
                <span className="tw-label">EMI Starting from</span>
                <span className="tw-value">₹{emiDetails.emi.toLocaleString()}/month</span>
                <span className="tw-emi-tenure">for {emiDetails.tenureMonths} months @ {emiDetails.interestRate}%</span>
              </div>
            )}
          </div>
          
          {offers.length > 0 && (
            <div className="tw-offers-section">
              <h4>Available Offers</h4>
              <div className="tw-offers-list">
                {offers.map((offer, i) => (
                  <div key={i} className="tw-offer-item">
                    <span className="tw-offer-icon">
                      {offer.type === 'cashback' && '💰'}
                      {offer.type === 'exchange' && '🔄'}
                      {offer.type === 'emi' && '📊'}
                      {offer.type === 'subsidy' && '🏛️'}
                    </span>
                    <div className="tw-offer-details">
                      <span className="tw-offer-title">{offer.title}</span>
                      <span className="tw-offer-desc">{offer.description}</span>
                    </div>
                    {offer.value > 0 && (
                      <span className="tw-offer-value">₹{offer.value.toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="tw-delivery-info">
            <span className="tw-delivery-icon">🚚</span>
            <div className="tw-delivery-details">
              <span className="tw-delivery-label">Delivery Timeline</span>
              <span className="tw-delivery-value">{availability.deliveryTime}</span>
            </div>
          </div>
          
          <div className="tw-modal-actions">
            <button className="tw-btn-primary" onClick={() => setShowTestRideForm(true)}>Book Test Ride</button>
            <button className="tw-btn-secondary" onClick={() => setShowEMIDetails(true)}>Calculate EMI</button>
            <button className="tw-btn-primary" onClick={handleProceedToLoan} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              Apply for Loan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
