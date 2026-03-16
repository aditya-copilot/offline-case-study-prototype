import { useState, useEffect } from 'react'
import './Onboarding.css'

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Pick Your Motors',
    description: 'Your AI-powered 2-wheeler showroom with instant loan approvals. Let\'s show you around!',
    icon: '🏍️',
    image: null
  },
  {
    id: 'search',
    title: 'Smart Search',
    description: 'Search by brand, budget, CC, or type. Try "electric under 1 lakh" or "Honda 150cc".',
    icon: '🔍',
    target: '.hero-search'
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Get personalized recommendations, compare bikes, and calculate EMIs with our smart AI.',
    icon: '🤖',
    target: '.ai-assistant-trigger'
  },
  {
    id: 'filters',
    title: 'Smart Filters',
    description: 'Filter by category, price range, and more. Find your perfect ride in seconds.',
    icon: '⚡',
    target: '.category-tabs'
  },
  {
    id: 'loan',
    title: 'Instant Loans',
    description: 'Select any bike and apply for loan from multiple banks in minutes.',
    icon: '💰',
    target: '.vehicle-card'
  }
]

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  
  useEffect(() => {
    const seen = localStorage.getItem('hypercredit_onboarding_seen')
    if (seen) {
      setHasSeenOnboarding(true)
      setIsVisible(false)
    }
  }, [])
  
  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeOnboarding()
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }
  
  const handleSkip = () => {
    completeOnboarding()
  }
  
  const completeOnboarding = () => {
    localStorage.setItem('hypercredit_onboarding_seen', 'true')
    setIsVisible(false)
    onComplete?.()
  }
  
  if (!isVisible || hasSeenOnboarding) return null
  
  const step = ONBOARDING_STEPS[currentStep]
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100
  
  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <button className="onboarding-skip" onClick={handleSkip}>
          Skip tour
        </button>
        
        <div className="onboarding-content">
          <div className="onboarding-icon">{step.icon}</div>
          <h2>{step.title}</h2>
          <p>{step.description}</p>
        </div>
        
        <div className="onboarding-progress">
          <div className="onboarding-progress-bar">
            <div 
              className="onboarding-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="onboarding-step-count">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </span>
        </div>
        
        <div className="onboarding-dots">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              className={`onboarding-dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>
        
        <div className="onboarding-actions">
          <button 
            className="onboarding-btn secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </button>
          <button 
            className="onboarding-btn primary"
            onClick={handleNext}
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
