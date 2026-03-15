import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import './AIChatWidget.css'
import InstantEMIForm from './InstantEMIForm'
import ProductGrid from './ProductGrid'
import ProductGallery from './ProductGallery'
import VisualResponse from './VisualResponse'
import { products, searchProducts, getProductByName, getSearchMeta } from '../data/products'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
      { name: 'Apple iPhone 15', price: '₹54,900', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop', offer: '20% OFF' },
      { name: 'Samsung Galaxy S23', price: '₹64,999', image: 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=300&h=300&fit=crop', offer: 'Bestseller' },
      { name: 'Apple Watch Series 9', price: '₹41,999', image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=300&h=300&fit=crop', offer: 'Buy 2 Get 1' },
      { name: 'Sony PlayStation 5', price: '₹54,990', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=300&fit=crop', offer: 'Limited' }
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
      { name: 'Apple AirPods Pro 2', price: '₹22,999', image: 'https://images.unsplash.com/photo-1603351154351-5cfb3d04ef32?w=300&h=300&fit=crop', offer: 'New' },
      { name: 'Samsung 55 inch TV', price: '₹42,490', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop', offer: 'Hot' },
      { name: 'MacBook Air M2', price: '₹99,990', image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&h=300&fit=crop', offer: '-30%' },
      { name: 'JBL Flip 6', price: '₹10,999', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop', offer: 'Sale' }
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
      { name: 'LG 1.5 Ton AC', price: '₹45,999', image: 'https://images.unsplash.com/photo-1617103893393-277579601d36?w=300&h=300&fit=crop', offer: 'Sale' },
      { name: 'Samsung Refrigerator', price: '₹26,999', image: 'https://images.unsplash.com/photo-1571175443880-49e1d58b794a?w=300&h=300&fit=crop', offer: '-25%' },
      { name: 'Samsung Washing Machine', price: '₹32,999', image: 'https://images.unsplash.com/photo-1626806775351-538068a21838?w=300&h=300&fit=crop', offer: 'Deal' },
      { name: 'Sony Bravia TV', price: '₹67,999', image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=300&h=300&fit=crop', offer: 'Hot' }
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
      { name: 'Xiaomi 13 Pro', price: '₹69,999', originalPrice: '₹79,999', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?w=300&h=300&fit=crop', offer: '-50%' },
      { name: 'iPad 10th Gen', price: '₹44,900', originalPrice: '₹49,900', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop', offer: 'Sale' },
      { name: 'Xbox Series X', price: '₹52,990', originalPrice: '₹55,990', image: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=300&h=300&fit=crop', offer: '-40%' },
      { name: 'Marshall Speaker', price: '₹14,999', originalPrice: '₹17,999', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop', offer: 'Deal' }
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
  const [searchResults, setSearchResults] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [currentSearch, setCurrentSearch] = useState(null)

  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)
  const offersScrollRef = useRef(null)
  const [activeOfferIndex, setActiveOfferIndex] = useState(0)
  const [userInput, setUserInput] = useState({});
  const inputModeRef = useRef('text')

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

  function speakText(text) {
    console.log("Attempting to speak text:", text)
    if (!("speechSynthesis" in window)) {
      console.error("TTS not supported in this browser");
      return;
    }

    console.log("Speaking text:", text);

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 1.6;      // speed (0.1 - 10)
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
    const searchPrompt = `You are a product search assistant. I have a catalog of ${products.length} electronics products. 

The user is looking for: "${query}"

Based on the search query, identify which products from our catalog might be relevant. Return a JSON array of product IDs that match the user's intent. If no products match well, return an empty array.

Product catalog includes: smartphones, laptops, TVs, earbuds, smartwatches, refrigerators, washing machines, tablets, speakers, printers, gaming consoles, accessories, and air conditioners from brands like Apple, Samsung, Sony, OnePlus, Xiaomi, HP, Dell, LG, etc.

Only return the JSON array of product IDs, nothing else.`

    try {
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
      const contextMessage = `You are a helpful shopping assistant. You have access to a product catalog with ${products.length} electronics products.
        When users ask about products, help them find what they're looking for. If they mention specific products, brands, or categories, acknowledge their interest and let them know they can click on product cards to see more details.

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

    
    if (location.pathname === '/checkout/user-input') {
      const response = await callBackend(nText, messages, imageData);
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
            <h1>Shopping Assistant</h1>
            <span className={`ai-status ${isTyping ? 'typing' : ''}`}>
              {isTyping ? 'Typing...' : 'Online'}
            </span>
          </div>
        </div>
      </div>


      {/* Messages Area */}
      <div className="ai-fullscreen-messages">
        {location.pathname == ("/checkout/user-input") && <InstantEMIForm userInput={userInput} />}
        {!location.pathname.includes("checkout") && (
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
