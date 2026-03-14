import { useState } from 'react'
import './RecommendationEngine.css'

const questions = [
  {
    id: 'usage',
    question: 'What will you mainly use the bike for?',
    options: [
      { id: 'commute', label: 'Daily Commute', icon: '🏢', description: 'Office, college, city travel' },
      { id: 'family', label: 'Family Use', icon: '👨‍👩‍👧‍👦', description: 'Shopping, school drop, errands' },
      { id: 'adventure', label: 'Weekend Rides', icon: '🏔️', description: 'Long trips, touring, fun' },
      { id: 'delivery', label: 'Business/Delivery', icon: '📦', description: 'Courier, food delivery' }
    ]
  },
  {
    id: 'budget',
    question: 'What is your budget range?',
    options: [
      { id: 'budget', label: 'Under ₹80,000', icon: '💰', description: 'Most economical' },
      { id: 'mid', label: '₹80,000 - ₹1,20,000', icon: '💰💰', description: 'Good balance' },
      { id: 'premium', label: 'Above ₹1,20,000', icon: '💰💰💰', description: 'Premium features' }
    ]
  },
  {
    id: 'fuel',
    question: 'Fuel preference?',
    options: [
      { id: 'petrol', label: 'Petrol', icon: '⛽', description: 'Traditional, longer range' },
      { id: 'electric', label: 'Electric', icon: '⚡', description: 'Eco-friendly, low running cost' }
    ]
  }
]

const recommendations = {
  'commute-budget-petrol': {
    title: 'Economy Commuter',
    bikes: ['Hero Splendor Plus', 'Hero Passion Plus'],
    reason: 'Easy to ride, excellent mileage (60+ kmpl), low maintenance'
  },
  'commute-mid-petrol': {
    title: 'Smart Commuter',
    bikes: ['Hero Splendor Plus Xtec', 'Hero Passion Xtec'],
    reason: 'Digital features, great mileage, modern styling'
  },
  'commute-premium-petrol': {
    title: 'Performance Commuter',
    bikes: ['Hero Xtreme 160R'],
    reason: 'Powerful 160cc engine, sporty looks, great for city & highway'
  },
  'family-budget-petrol': {
    title: 'Family Friendly',
    bikes: ['Hero Splendor Plus', 'Hero Passion Plus'],
    reason: 'Stable, comfortable for two, easy handling'
  },
  'family-mid-petrol': {
    title: 'Comfortable Family Bike',
    bikes: ['Hero Glamour', 'Hero Passion Xtec'],
    reason: 'Spacious seat, good suspension, reliable'
  },
  'family-premium-petrol': {
    title: 'Premium Family Ride',
    bikes: ['Hero Glamour', 'Hero Maestro Edge 125'],
    reason: '125cc power, comfortable seating, stylish design'
  },
  'adventure-budget-petrol': {
    title: 'Budget Adventure',
    bikes: ['Hero Xtreme 160R'],
    reason: 'Good power, affordable, versatile for city and light touring'
  },
  'adventure-mid-petrol': {
    title: 'Weekend Explorer',
    bikes: ['Hero Xtreme 160R'],
    reason: 'Versatile, comfortable, good for short trips'
  },
  'adventure-premium-petrol': {
    title: 'Adventure Ready',
    bikes: ['Hero Xpulse 200', 'Hero Xtreme 200S'],
    reason: 'Long travel suspension, off-road capable, touring friendly'
  },
  'delivery-budget-petrol': {
    title: 'Delivery Workhorse',
    bikes: ['Hero Splendor Plus'],
    reason: 'Lowest running cost, highest mileage, durable'
  },
  'delivery-mid-petrol': {
    title: 'Delivery Pro',
    bikes: ['Hero Splendor Plus', 'Hero Passion Plus'],
    reason: 'Reliable, good load capacity, low maintenance'
  },
  'delivery-budget-electric': {
    title: 'Electric Delivery',
    bikes: ['Hero Electric NYX', 'Hero Electric Flash'],
    reason: 'Very low running cost, no fuel needed, eco-friendly'
  },
  'delivery-mid-electric': {
    title: 'Electric Business',
    bikes: ['Hero Electric NYX'],
    reason: 'Cargo capacity, low running cost, city-friendly'
  },
  'commute-budget-electric': {
    title: 'Electric Commuter',
    bikes: ['Hero Electric Optima', 'Hero Electric Atria'],
    reason: 'Easy to ride, very low cost per km, no gear hassle'
  },
  'commute-mid-electric': {
    title: 'Premium Electric',
    bikes: ['Hero Electric Optima'],
    reason: 'Good range, modern features, zero emissions'
  },
  'family-budget-electric': {
    title: 'Eco-Friendly Family',
    bikes: ['Hero Electric Optima'],
    reason: 'Quiet, clean, perfect for short city trips'
  },
  'family-mid-electric': {
    title: 'Family Electric',
    bikes: ['Hero Electric Optima', 'Hero Electric NYX'],
    reason: 'Spacious, economical, easy to handle'
  }
}

function RecommendationEngine({ onClose, onSelectBike }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)

  const handleAnswer = (questionId, optionId) => {
    const newAnswers = { ...answers, [questionId]: optionId }
    setAnswers(newAnswers)
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setShowResults(true)
    }
  }

  const getRecommendation = () => {
    const key = `${answers.usage}-${answers.budget}-${answers.fuel}`
    return recommendations[key] || recommendations['commute-budget-petrol']
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setAnswers({})
    setShowResults(false)
  }

  const handleBikeClick = (bikeName) => {
    onSelectBike(bikeName)
  }

  if (showResults) {
    const recommendation = getRecommendation()
    return (
      <div className="recommendation-engine">
        <div className="recommendation-header">
          <h3>Your Perfect Match!</h3>
          <button className="recommendation-close" onClick={onClose}>×</button>
        </div>
        <div className="recommendation-content">
          <div className="recommendation-card">
            <h4>{recommendation.title}</h4>
            <p className="recommendation-reason">{recommendation.reason}</p>
            <div className="recommended-bikes">
              {recommendation.bikes.map((bike, idx) => (
                <button
                  key={idx}
                  className="recommended-bike-btn"
                  onClick={() => handleBikeClick(bike)}
                >
                  <span className="bike-icon">🏍️</span>
                  <span className="bike-name">{bike}</span>
                  <span className="bike-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
          <button className="restart-btn" onClick={handleRestart}>
            🔄 Start Over
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  return (
    <div className="recommendation-engine">
      <div className="recommendation-header">
        <h3>Find Your Perfect Bike</h3>
        <button className="recommendation-close" onClick={onClose}>×</button>
      </div>
      <div className="recommendation-progress">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="recommendation-content">
        <div className="question-step">
          <span className="step-indicator">Question {currentStep + 1} of {questions.length}</span>
          <h4 className="question-text">{currentQuestion.question}</h4>
        </div>
        <div className="options-grid">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              className="option-card"
              onClick={() => handleAnswer(currentQuestion.id, option.id)}
            >
              <span className="option-icon">{option.icon}</span>
              <span className="option-label">{option.label}</span>
              <span className="option-description">{option.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RecommendationEngine
