import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOffer } from '../../context/OfferContext'
import { useToast } from '../../context/ToastContext'
import { twowheelers } from '../../data/bike/twowheelerProducts'
import {
  parseUserIntent,
  getVehicleType,
  getPowerDisplay,
  getEfficiencyDisplay,
  getVehicleAvailability,
  calculateEMI,
  getVehicleOffers,
  showroomConfig,
  searchVehicles
} from '../../data/bike/recommendationEngine'
import './AIAssistantEnhanced.css'

const CONVERSATION_CONTEXT = {
  STAGES: {
    WELCOME: 'welcome',
    BUDGET_INQUIRY: 'budget_inquiry',
    USE_CASE: 'use_case',
    RECOMMENDATIONS: 'recommendations',
    COMPARISON: 'comparison',
    DETAILS: 'details',
    LOAN_CALCULATION: 'loan_calculation',
    APPLICATION: 'application'
  }
}

const QUICK_ACTIONS = [
  { id: 'budget', label: 'Find by Budget', icon: '💰', description: 'Set your price range' },
  { id: 'compare', label: 'Compare Bikes', icon: '⚖️', description: 'Side-by-side comparison' },
  { id: 'emi', label: 'Calculate EMI', icon: '📊', description: 'Monthly payment estimate' },
  { id: 'offers', label: 'Current Offers', icon: '🎁', description: 'Latest deals' },
  { id: 'electric', label: 'Electric Bikes', icon: '⚡', description: 'Eco-friendly options' },
  { id: 'scooter', label: 'Scooters', icon: '🛵', description: 'Family-friendly' }
]

const WELCOME_MESSAGE = {
  id: 'welcome',
  type: 'bot',
  text: "👋 Hi! I'm your AI assistant. I can help you find the perfect 2-wheeler, compare bikes, calculate EMIs, and even help with your loan application. What would you like to do?",
  timestamp: new Date(),
  actions: ['budget', 'compare', 'electric', 'offers']
}

export default function AIAssistantEnhanced({ onClose }) {
  const navigate = useNavigate()
  const { selectProduct } = useOffer()
  const { showToast } = useToast()
  
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [stage, setStage] = useState(CONVERSATION_CONTEXT.STAGES.WELCOME)
  const [userPreferences, setUserPreferences] = useState({
    budget: null,
    useCase: null,
    brand: null,
    vehicleType: null
  })
  const [comparisonList, setComparisonList] = useState([])
  const [showComparison, setShowComparison] = useState(false)
  const [typingDots, setTypingDots] = useState(0)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  // Typing animation
  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        setTypingDots(prev => (prev + 1) % 4)
      }, 400)
      return () => clearInterval(interval)
    }
  }, [isTyping])
  
  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }
  
  const addMessage = (message) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }])
  }
  
  const simulateTyping = async (text, delay = 30) => {
    setIsTyping(true)
    const words = text.split(' ')
    let currentText = ''
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i]
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    setIsTyping(false)
    return currentText
  }
  
  const handleQuickAction = async (actionId) => {
    switch (actionId) {
      case 'budget':
        addMessage({
          type: 'user',
          text: 'I want to find a bike within my budget'
        })
        setStage(CONVERSATION_CONTEXT.STAGES.BUDGET_INQUIRY)
        
        setTimeout(() => {
          addMessage({
            type: 'bot',
            text: 'Great! What\'s your budget range?\n\n💡 You can say things like:\n• "Under 1 lakh"\n• "1 to 1.5 lakhs"\n• "Around 80,000"',
            quickReplies: ['Under ₹50K', '₹50K - ₹1L', '₹1L - ₹1.5L', 'Above ₹1.5L']
          })
        }, 500)
        break
        
      case 'compare':
        addMessage({
          type: 'user',
          text: 'I want to compare bikes'
        })
        setStage(CONVERSATION_CONTEXT.STAGES.COMPARISON)
        
        setTimeout(() => {
          addMessage({
            type: 'bot',
            text: 'I can help you compare up to 3 bikes side-by-side! 🏍️\n\nTell me which bikes you want to compare, or I can suggest popular comparisons:',
            quickReplies: ['Pulsar vs Apache', 'Activa vs Jupiter', 'Electric options']
          })
        }, 500)
        break
        
      case 'emi':
        addMessage({
          type: 'user',
          text: 'Calculate EMI'
        })
        setStage(CONVERSATION_CONTEXT.STAGES.LOAN_CALCULATION)
        
        setTimeout(() => {
          addMessage({
            type: 'bot',
            text: 'I can calculate EMI for any bike! Which bike are you interested in, or would you like to see sample calculations?',
            quickReplies: ['Honda CB Shine', 'Royal Enfield', 'Electric bikes', 'Show me examples']
          })
        }, 500)
        break
        
      case 'electric':
        addMessage({
          type: 'user',
          text: 'Show me electric bikes'
        })
        handleElectricRequest()
        break
        
      case 'offers':
        addMessage({
          type: 'user',
          text: 'What offers are available?'
        })
        handleOffersRequest()
        break
        
      case 'scooter':
        addMessage({
          type: 'user',
          text: 'Show me scooters'
        })
        handleScooterRequest()
        break
    }
  }
  
  const handleElectricRequest = () => {
    const electricBikes = twowheelers.filter(v => 
      v.vehicle_type_slug === 'electric+vehicles'
    ).slice(0, 6)
    
    setTimeout(() => {
      addMessage({
        type: 'bot',
        text: `⚡ Here are the top ${electricBikes.length} electric bikes available:\n\nThese eco-friendly options come with:\n✓ Low running costs\n✓ Government subsidies\n✓ Zero emissions`,
        vehicles: electricBikes,
        actions: ['compare', 'emi']
      })
    }, 800)
  }
  
  const handleOffersRequest = () => {
    const bikesWithOffers = twowheelers.filter(v => {
      const offers = getVehicleOffers(v)
      return offers.length > 0
    }).slice(0, 6)
    
    setTimeout(() => {
      addMessage({
        type: 'bot',
        text: `🎁 Great news! I found ${bikesWithOffers.length} bikes with special offers:\n\n• Cashback offers\n• Exchange bonuses\n• Low EMI options\n• Festival discounts`,
        vehicles: bikesWithOffers,
        actions: ['emi', 'budget']
      })
    }, 800)
  }
  
  const handleScooterRequest = () => {
    const scooters = twowheelers.filter(v => 
      v.vehicle_type_slug === 'scooters'
    ).slice(0, 6)
    
    setTimeout(() => {
      addMessage({
        type: 'bot',
        text: `🛵 Here are the best scooters for family use:\n\nThese scooters offer:\n✓ Excellent mileage\n✓ Comfortable seating\n✓ Large storage space\n✓ Easy to handle`,
        vehicles: scooters,
        actions: ['compare', 'emi']
      })
    }, 800)
  }
  
  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return
    
    addMessage({ type: 'user', text })
    setInputText('')
    
    // Parse intent
    const intent = parseUserIntent(text)
    
    // Handle budget queries
    if (text.toLowerCase().includes('lakh') || text.toLowerCase().includes('budget') || /\d+/.test(text)) {
      const budget = extractBudget(text)
      if (budget) {
        handleBudgetResponse(budget)
        return
      }
    }
    
    // Handle comparison
    if (text.toLowerCase().includes('compare') || text.toLowerCase().includes('vs') || text.toLowerCase().includes('versus')) {
      handleComparisonQuery(text)
      return
    }
    
    // Handle EMI calculation
    if (text.toLowerCase().includes('emi') || text.toLowerCase().includes('monthly') || text.toLowerCase().includes('installment')) {
      handleEMIQuery(text)
      return
    }
    
    // Handle specific bike queries
    const matchingBikes = searchVehicles(text, twowheelers)
    if (matchingBikes.length > 0) {
      handleVehicleResults(matchingBikes, text)
      return
    }
    
    // Default response
    setTimeout(() => {
      addMessage({
        type: 'bot',
        text: 'I can help you with:\n\n🏍️ Finding bikes by budget\n⚡ Electric vehicle options\n📊 EMI calculations\n⚖️ Bike comparisons\n🎁 Current offers\n\nWhat would you like to explore?',
        quickReplies: ['Under 1 lakh', 'Electric bikes', 'Compare bikes', 'Calculate EMI']
      })
    }, 600)
  }
  
  const extractBudget = (text) => {
    const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*lakh/i)
    if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000
    
    const thousandMatch = text.match(/(\d+)\s*(?:k|thousand)/i)
    if (thousandMatch) return parseInt(thousandMatch[1]) * 1000
    
    const numberMatch = text.match(/(\d+)/)
    if (numberMatch) {
      const num = parseInt(numberMatch[1])
      return num < 10000 ? num * 1000 : num
    }
    
    return null
  }
  
  const handleBudgetResponse = (budget) => {
    const maxBudget = budget * 1.2 // 20% buffer
    const matchingBikes = twowheelers.filter(v => 
      v.ex_showroom_price <= maxBudget
    ).sort((a, b) => b.rating - a.rating).slice(0, 6)
    
    setTimeout(() => {
      if (matchingBikes.length > 0) {
        addMessage({
          type: 'bot',
          text: `Perfect! I found ${matchingBikes.length} bikes within your budget of ${formatPrice(budget)}:\n\nThese are sorted by customer rating and include options with special offers.`,
          vehicles: matchingBikes,
          actions: ['compare', 'emi']
        })
      } else {
        addMessage({
          type: 'bot',
          text: `I couldn't find bikes within ${formatPrice(budget)}. Would you like to:\n\n• Increase your budget\n• Check used bikes\n• See bikes with lowest down payment options`,
          quickReplies: ['Show all bikes', 'Lowest down payment', 'Under 50,000']
        })
      }
    }, 800)
  }
  
  const handleComparisonQuery = (text) => {
    // Extract bike names from text
    const bikeNames = text.split(/vs|versus|compare|and/i).map(s => s.trim()).filter(Boolean)
    
    if (bikeNames.length >= 2) {
      const bikesToCompare = bikeNames.map(name => {
        return twowheelers.find(v => 
          v.display_name.toLowerCase().includes(name.toLowerCase()) ||
          v.make_slug.toLowerCase().includes(name.toLowerCase())
        )
      }).filter(Boolean).slice(0, 3)
      
      if (bikesToCompare.length >= 2) {
        setTimeout(() => {
          addMessage({
            type: 'bot',
            text: `Here's a detailed comparison of ${bikesToCompare.length} bikes:\n\n🏆 Best for: Value\n⚡ Best for: Performance\n💰 Best for: Mileage`,
            comparison: bikesToCompare,
            actions: ['emi', 'view_details']
          })
        }, 1000)
        return
      }
    }
    
    // Show popular comparisons
    setTimeout(() => {
      addMessage({
        type: 'bot',
        text: 'Here are some popular comparisons:\n\n🏍️ Honda CB Shine vs Bajaj Pulsar\n⚡ Ather 450X vs Ola S1 Pro\n🛵 Activa 6G vs TVS Jupiter',
        quickReplies: ['Honda vs Bajaj', 'Electric comparison', 'Scooter comparison']
      })
    }, 600)
  }
  
  const handleEMIQuery = (text) => {
    const bikeMatch = twowheelers.find(v => 
      text.toLowerCase().includes(v.display_name.toLowerCase()) ||
      text.toLowerCase().includes(v.make_slug.toLowerCase())
    )
    
    if (bikeMatch) {
      const emi = calculateEMI(bikeMatch.ex_showroom_price * 0.9, 36, 10)
      
      setTimeout(() => {
        addMessage({
          type: 'bot',
          text: `📊 EMI Calculation for ${bikeMatch.display_name}:\n\n💰 Ex-showroom: ${formatPrice(bikeMatch.ex_showroom_price)}\n💵 Down payment (10%): ${formatPrice(bikeMatch.ex_showroom_price * 0.1)}\n📈 Loan amount: ${formatPrice(bikeMatch.ex_showroom_price * 0.9)}\n\n✨ Monthly EMI: ${formatPrice(emi)}/month for 3 years`,
          emiDetails: {
            vehicle: bikeMatch,
            emi,
            downPayment: bikeMatch.ex_showroom_price * 0.1,
            tenure: 36,
            rate: 10
          },
          actions: ['apply_loan', 'different_tenure']
        })
      }, 800)
    } else {
      setTimeout(() => {
        addMessage({
          type: 'bot',
          text: 'Which bike would you like me to calculate EMI for?\n\nOr tell me your preferred:\n• Down payment amount\n• Monthly EMI budget\n• Loan tenure (1-5 years)',
          quickReplies: ['Honda CB Shine', 'Electric bike EMI', 'Lowest EMI option']
        })
      }, 600)
    }
  }
  
  const handleVehicleResults = (vehicles, query) => {
    setTimeout(() => {
      addMessage({
        type: 'bot',
        text: `I found ${vehicles.length} bikes matching "${query}":`,
        vehicles: vehicles.slice(0, 6),
        actions: ['compare', 'emi', 'filter']
      })
    }, 600)
  }
  
  const handleVehicleClick = (vehicle) => {
    selectProduct({
      id: vehicle.model_slug,
      name: vehicle.display_name,
      brand: vehicle.make_slug,
      price: vehicle.ex_showroom_price,
      image: vehicle.model_image,
      category: 'Two Wheeler',
      rating: vehicle.rating,
      specs: {
        power: vehicle.cc?.value + ' ' + vehicle.cc?.unit,
        mileage: vehicle.mileage?.value + ' ' + vehicle.mileage?.unit,
        range: vehicle.range,
        topSpeed: vehicle.top_speed
      }
    }, 'bike')
    
    showToast(`${vehicle.display_name} selected! Apply for loan now.`, 'success')
    navigate('/offer')
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  return (
    <div className="ai-assistant-overlay" onClick={onClose}>
      <div className="ai-assistant-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-header">
          <div className="ai-header-left">
            <div className="ai-avatar">
              <span>🤖</span>
              <div className="ai-status-indicator online" />
            </div>
            <div className="ai-header-info">
              <h2>HyperCredit AI</h2>
              <span className="ai-status">
                {isTyping ? `Typing${'.'.repeat(typingDots)}` : 'Online'}
              </span>
            </div>
          </div>
          <button className="ai-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Messages */}
        <div className="ai-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-message ${msg.type}`}>
              {msg.type === 'bot' && (
                <div className="ai-message-avatar">
                  <span>🤖</span>
                </div>
              )}
              <div className="ai-message-content">
                <div className="ai-message-bubble">
                  <p>{msg.text}</p>
                  
                  {/* Quick Replies */}
                  {msg.quickReplies && (
                    <div className="ai-quick-replies">
                      {msg.quickReplies.map((reply, i) => (
                        <button
                          key={i}
                          className="ai-quick-reply"
                          onClick={() => handleSendMessage(reply)}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Vehicle Cards */}
                  {msg.vehicles && (
                    <div className="ai-vehicle-grid">
                      {msg.vehicles.map(vehicle => (
                        <div
                          key={vehicle.model_slug}
                          className="ai-vehicle-card"
                          onClick={() => handleVehicleClick(vehicle)}
                        >
                          <img src={vehicle.model_image} alt={vehicle.display_name} />
                          <div className="ai-vehicle-info">
                            <h4>{vehicle.display_name}</h4>
                            <span className="ai-vehicle-price">
                              {formatPrice(vehicle.ex_showroom_price)}
                            </span>
                            <span className="ai-vehicle-rating">
                              ⭐ {vehicle.rating}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {msg.actions && (
                    <div className="ai-action-buttons">
                      {msg.actions.includes('compare') && (
                        <button className="ai-action-btn compare">
                          ⚖️ Compare
                        </button>
                      )}
                      {msg.actions.includes('emi') && (
                        <button className="ai-action-btn emi">
                          📊 Calculate EMI
                        </button>
                      )}
                      {msg.actions.includes('apply_loan') && (
                        <button className="ai-action-btn primary">
                          🚀 Apply for Loan
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <span className="ai-message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="ai-message bot typing">
              <div className="ai-message-avatar">
                <span>🤖</span>
              </div>
              <div className="ai-message-bubble typing">
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
        
        {/* Quick Actions */}
        {stage === CONVERSATION_CONTEXT.STAGES.WELCOME && messages.length === 1 && (
          <div className="ai-quick-actions">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.id}
                className="ai-quick-action"
                onClick={() => handleQuickAction(action.id)}
              >
                <span className="ai-quick-action-icon">{action.icon}</span>
                <span className="ai-quick-action-label">{action.label}</span>
                <span className="ai-quick-action-desc">{action.description}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Input */}
        <div className="ai-input-area">
          <div className="ai-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message or ask about bikes, EMI, offers..."
              disabled={isTyping}
            />
            <button
              className="ai-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="ai-input-hint">
            Try: "Show me bikes under 1 lakh" or "Compare Honda vs Bajaj"
          </p>
        </div>
      </div>
    </div>
  )
}
