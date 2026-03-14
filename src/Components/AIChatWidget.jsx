import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './AIChatWidget.css'
import InstantEMIForm from './InstantEMIForm'
import ProductGrid from './ProductGrid'
import ProductGallery from './ProductGallery'
import VisualResponse from './VisualResponse'
import RecommendationEngine from './RecommendationEngine'
import { products, searchProducts, getProductByName, getSearchMeta } from '../data/products'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Categories data
const categories = [
  {
    id: 'popular',
    title: 'Popular Motorcycles',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    color: '#f59e0b',
    items: [
      { name: 'Hero Splendor Plus', price: '₹77,176', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop', offer: 'Bestseller' },
      { name: 'Hero Glamour', price: '₹85,738', image: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=300&h=300&fit=crop', offer: 'Stylish' },
      { name: 'Hero Xtreme 160R', price: '₹1,11,388', image: 'https://images.unsplash.com/photo-1615172284350-668170a4f2e9?w=300&h=300&fit=crop', offer: 'Performance' },
      { name: 'Hero Xtreme 200S', price: '₹1,39,871', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&h=300&fit=crop', offer: 'Sports' }
    ]
  },
  {
    id: 'scooters',
    title: 'Popular Scooters',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    color: '#10b981',
    items: [
      { name: 'Hero Maestro Edge 125', price: '₹79,468', image: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=300&h=300&fit=crop', offer: 'Premium' },
      { name: 'Hero Pleasure Plus', price: '₹63,750', image: 'https://images.unsplash.com/photo-1589354784757-9229742e666a?w=300&h=300&fit=crop', offer: 'Lightweight' },
      { name: 'Hero Destini 125', price: '₹71,558', image: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=300&h=300&fit=crop', offer: 'Family' },
      { name: 'Hero Duet', price: '₹65,658', image: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=300&h=300&fit=crop', offer: 'Practical' }
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
    color: '#ec4899',
    items: [
      { name: 'Hero Electric Optima', price: '₹67,190', image: 'https://images.unsplash.com/photo-1591123720164-de1348028a82?w=300&h=300&fit=crop', offer: 'Eco' },
      { name: 'Hero Electric Flash', price: '₹59,640', image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&h=300&fit=crop', offer: 'Affordable' },
      { name: 'Hero Electric NYX', price: '₹73,590', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=300&h=300&fit=crop', offer: 'Cargo' },
      { name: 'Hero Electric Atria', price: '₹63,640', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&h=300&fit=crop', offer: 'City' }
    ]
  },
  {
    id: 'adventure',
    title: 'Adventure & Off-Road',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    color: '#ef4444',
    items: [
      { name: 'Hero Xpulse 200', price: '₹1,43,645', image: 'https://images.unsplash.com/photo-1568708160-6eddaf55124b?w=300&h=300&fit=crop', offer: 'Off-Road' },
      { name: 'Hero Passion Xtec', price: '₹81,038', image: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=300&h=300&fit=crop', offer: 'Xtec' },
      { name: 'Hero Passion Plus', price: '₹76,538', image: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=300&h=300&fit=crop', offer: 'Reliable' },
      { name: 'Hero Splendor Plus Xtec', price: '₹79,338', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop', offer: 'Xtec' }
    ]
  }
]

function AIChatWidget() {
  console.log("Re-rendering AIChatWidget")
  const location = useLocation()
  const navigate = useNavigate()
  const [inputMode, setInputMode] = useState('text')
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [activeCategory, setActiveCategory] = useState(0)
  const [searchResults, setSearchResults] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [currentSearch, setCurrentSearch] = useState(null)
  const [showRecommendation, setShowRecommendation] = useState(false)

  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)
  const offersScrollRef = useRef(null)
  const [activeOfferIndex, setActiveOfferIndex] = useState(0)
  const [userInput, setUserInput] = useState({});
  const inputModeRef = useRef('text')
  const locationRef = useRef(location)

  // Extract JSON from AI response (handles markdown code blocks and extra text)
  
  function extractJSON(text) {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch (e) {
      return null;
    }
  }

  useEffect(() => {
    console.log("Input mode changed:", inputMode)
    inputModeRef.current = inputMode;
    if(inputMode != 'speech'){
      setIsListening(false)
    }
  } , [inputMode])

  // Keep location ref updated
  useEffect(() => {
    locationRef.current = location
  }, [location])

  // Clear messages when navigating away from conversation page
  useEffect(() => {
    if (!location.pathname.includes('/conversation')) {
      setMessages([])
      setSearchResults([])
      setCurrentSearch(null)
    }
  }, [location.pathname])

  function speakText(text) {
    console.log("Attempting to speak text:", text)
    if (!("speechSynthesis" in window)) {
      console.error("TTS not supported in this browser");
      return;
    }

    console.log("Speaking text:", text);

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 1;      // speed (0.1 - 10)
    utterance.pitch = 1;     // tone (0 - 2)
    utterance.volume = 1;    // volume (0 - 1)

    window.speechSynthesis.speak(utterance);
  }

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
  }, [messages, searchResults])

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
  } , [isListening])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        console.log("Speech recognition result received:", event)
        const current = event.resultIndex
        const transcriptText = event.results[current][0].transcript

        if (event.results[current].isFinal) {
          sendMessage(transcriptText)
        }
      }

      recognitionRef.current.onerror = (event) => {
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setSpeechSupported(false)
        }
      }

    recognitionRef.current.onend = () => {
      setIsListening(false);
    }
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Search products using AI
  const searchWithAI = async (query) => {
    const searchPrompt = `You are a product search assistant for a two-wheeler dealership. I have a catalog of ${products.length} motorcycles and scooters.

Search Query: "${query}"

Available products:
${products.map(p => `- ID: ${p.id}, Name: ${p.name}, Brand: ${p.brand}, Category: ${p.category}, Price: ₹${p.price}`).join('\n')}

Based on the search query, identify which two-wheelers from our catalog might be relevant. Return a JSON array of product IDs that match the user's intent. If no products match well, return an empty array.

Only return the JSON array of product IDs, nothing else.`

    try {
      const response = await fetch("https://grid.ai.juspay.net/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({
          model: "glm-latest",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: searchPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (content) {
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/)
          const productIds = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
          return productIds.filter(id => products.some(p => p.id === id))
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError)
          return []
        }
      }
      return []
    } catch (error) {
      console.error('AI search error:', error)
      return []
    }
  }

  // Call backend API
  const callBackend = async (userMessage, conversationHistory, imageData = null) => {
    try {
      const contextMessage = `You are a helpful two-wheeler dealership assistant. You have access to a product catalog with ${products.length} motorcycles and scooters.

When users ask about bikes, scooters, motorcycles, or two-wheelers, help them find what they're looking for. If they mention specific models, brands (Hero), types (commuter, sports, scooter, electric), or price ranges, acknowledge their interest and let them know they can click on product cards to see more details.

User message: ${userMessage}`

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
              role: "user",
              content: imageData ? [
                { type: "text", text: contextMessage },
                { type: "image_url", image_url: { url: imageData } }
              ] : contextMessage
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

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
    
    // Navigate to conversation screen on first message
    if (location.pathname === '/chat' && messages.length === 0) {
      navigate('/chat/conversation')
    }

    let nText = text;

    if (location.pathname === '/checkout/user-input') {
      nText =
        `${text}
      Your task is below:
      If you think user is telling personal information, then do as stated below:
      If above text is not about personal information response accordingly in simple text.
      
      Else do below:
      Return structured response in below json format, don't insert random text, only send what's available in description of personal info.
      { 
        "fullName": "my full name",
        "panNumber": "example: LLWPK2329C",
        "dob": "my dob in yyyy-mm-dd",
        "address": "my current address"
      }

      Make sure to strict to this json format and  only send this json, nothing else if it's personal info.

      `
    }

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

    // Search for products
    if (!location.pathname.includes("checkout")) {
      const aiProductIds = await searchWithAI(text)
      let foundProducts = []

      if (aiProductIds.length > 0) {
        foundProducts = aiProductIds.map(id => products.find(p => p.id === id))
      } else {
        // Fallback to basic search
        foundProducts = searchProducts(text)
      }

      setSearchResults(foundProducts)

      // Get search metadata with price constraints
      const searchMeta = getSearchMeta(text)

      setCurrentSearch({
        query: text,
        brand: searchMeta.brand,
        category: searchMeta.category,
        priceConstraint: searchMeta.priceConstraint
      })

      // Only call AI if no products found - otherwise skip text response
      if (foundProducts.length === 0) {
        const response = await callBackend(text, messages, imageData)
        // Only add bot message if still on conversation page (use ref to get current value)
        if (locationRef.current.pathname.includes('/conversation')) {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            text: response,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, botMessage])
          console.log('AI response for product search:', response)
          if (inputModeRef.current == 'speech'){
            speakText(response)
          }
          else{
            console.log("Not speaking AI response because input mode is:", inputMode)
          }
        }
      }
    }

    const response = await callBackend(nText, messages, imageData);

    if (location.pathname === '/checkout/user-input') {
      let output = extractJSON(response)
      setUserInput(output);
      if (output) {
        let res = "Alright, received your input, trying to autofill for you."
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: res,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
        if (inputModeRef.current == 'speech') speakText(res)
      }
      else {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
        console.log("AI response for checkout is not in expected format:", response)
        if (inputModeRef.current == 'speech') {
          console.log("Speaking AI response for checkout:", response)
          speakText(response)
        }

      }
    }
    setIsTyping(false)

  }, [messages, inputMode, location.pathname])

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
    const product = getProductByName(item.name)
    if (product) {
      setSelectedProduct(product)
    } else {
      sendMessage(`Tell me more about ${item.name}`)
    }
  }

  const handleProductCardClick = (product) => {
    setSelectedProduct(product)
  }

  const handleCloseProductDetail = () => {
    setSelectedProduct(null)
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
            <h1>Sana</h1>
            <span className={`ai-status ${isTyping ? 'typing' : ''}`}>
              {isTyping ? 'Typing...' : 'Online'}
            </span>
          </div>
        </div>
        {location.pathname.includes("/conversation") && (
          <button 
            className="ai-close-btn" 
            onClick={() => navigate('/chat')}
            title="Close conversation"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>


      {/* Messages Area */}
      <div className="ai-fullscreen-messages">
        {location.pathname.includes("checkout") && <InstantEMIForm userInput={userInput} />}
        {!location.pathname.includes("checkout") && !location.pathname.includes("/conversation") && (
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
                      onClick={() => handleItemClick(item)}
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
                        <span className="ai-product-price">{item.price}</span>
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

            {/* Recommendation Engine for First-Time Visitors */}
            {!showRecommendation && (
              <div className="ai-recommendation-prompt">
                <div className="recommendation-prompt-content">
                  <span className="recommendation-icon">🤔</span>
                  <div className="recommendation-text">
                    <h4>Not sure which bike to choose?</h4>
                    <p>Answer a few questions and we'll find your perfect match!</p>
                  </div>
                  <button 
                    className="recommendation-start-btn"
                    onClick={() => setShowRecommendation(true)}
                  >
                    Find My Bike →
                  </button>
                </div>
              </div>
            )}
            {showRecommendation && (
              <RecommendationEngine 
                onClose={() => setShowRecommendation(false)}
                onSelectBike={(bikeName) => {
                  setShowRecommendation(false)
                  sendMessage(`Tell me more about ${bikeName}`)
                }}
              />
            )}
          </div>
        )}
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
                {msg.text && <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>}
                <span className="ai-message-time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {/* Display visual response with search results */}
          {searchResults.length > 0 && currentSearch && (
            <div className="ai-visual-results">
              <VisualResponse
                query={currentSearch.query}
                count={searchResults.length}
                brand={currentSearch.brand}
                category={currentSearch.category}
              />
              <ProductGrid
                products={searchResults}
                onProductClick={handleProductCardClick}
              />
            </div>
          )}

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

        {/* Recommendation Bot for Conversation Page */}
        {location.pathname.includes('/conversation') && messages.length > 0 && (
          <div className="recommendation-bot-float">
            <button 
              className="recommendation-bot-btn"
              onClick={() => setShowRecommendation(true)}
            >
              <div className="bot-avatar-small">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </div>
              <div className="bot-message">
                <span className="bot-label">💡 Not sure?</span>
                <span className="bot-text">Let me help you find the perfect bike</span>
              </div>
              <span className="bot-arrow">→</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Input Section */}
      <div className="ai-fullscreen-input-section">
        {/* Input Mode Selector */}
        <div className="ai-mode-selector">
          <button
            className={`ai-mode-btn ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => {
              console.log("Switching to text input mode")
              setInputMode('text')
            }}
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

      {/* Product Gallery Modal */}
      {selectedProduct && (
        <ProductGallery
          product={selectedProduct}
          onBack={handleCloseProductDetail}
        />
      )}
    </div>
  )
}

export default AIChatWidget
