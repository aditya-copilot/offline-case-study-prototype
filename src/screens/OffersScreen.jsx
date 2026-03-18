import { useState , useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOffer } from '../context/OfferContext'
import { getVehicleOffers } from '../data/bike/recommendationEngine'
import './OffersScreen.css'

const calculateEMI = (principal, tenureMonths, interestRate) => {
  const monthlyRate = interestRate / 12 / 100
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  return Math.round(emi)
}

const generateDynamicOffers = (product) => {
  const productPrice = product?.price || 120000
  const isBike = product?.category?.includes('Two') || product?.category?.includes('Bike')
  const isEV = product?.category?.includes('Electric')
  const brand = product?.brand?.toLowerCase() || ''
  
  const downpayment = Math.max(2000, Math.round(productPrice * 0.02))
  const loanAmount = productPrice - downpayment
  
  const offers = [
    {
      id: 1,
      lenderName: 'ICICI Bank',
      lenderLogo: '🏦',
      lenderColor: '#1B5E20',
      amount: `₹${loanAmount.toLocaleString()}`,
      amountValue: loanAmount,
      interestRate: '0%',
      interestRateValue: 0,
      term: '36 Months',
      termMonths: 36,
      termDisplay: '3 Years',
      monthlyPayment: `₹${Math.round(loanAmount / 36).toLocaleString()}`,
      monthlyPaymentValue: Math.round(loanAmount / 36),
      downpayment: downpayment,
      processingFee: Math.round(loanAmount * 0.01),
      processingFeePercent: 1,
      totalInterest: 0,
      totalPayable: loanAmount + downpayment + Math.round(loanAmount * 0.01),
      features: ['Instant approval', 'Zero foreclosure charges', 'Flexible EMI'],
      expiresIn: '5 days',
      isRecommended: productPrice > 100000,
      isNoCostEMI: true,
      badge: 'AI Pick'
    },
    {
      id: 2,
      lenderName: 'HDB Financial',
      lenderLogo: '🏛️',
      lenderColor: '#1565C0',
      amount: `₹${loanAmount.toLocaleString()}`,
      amountValue: loanAmount,
      interestRate: '12.99%',
      interestRateValue: 12.99,
      term: '24 Months',
      termMonths: 24,
      termDisplay: '2 Years',
      monthlyPayment: `₹${calculateEMI(loanAmount, 24, 12.99).toLocaleString()}`,
      monthlyPaymentValue: calculateEMI(loanAmount, 24, 12.99),
      downpayment: downpayment,
      processingFee: Math.round(loanAmount * 0.01),
      processingFeePercent: 1,
      totalInterest: Math.round(calculateEMI(loanAmount, 24, 12.99) * 24 - loanAmount),
      totalPayable: downpayment + calculateEMI(loanAmount, 24, 12.99) * 24 + Math.round(loanAmount * 0.01),
      features: ['Quick disbursement', 'Minimal documentation'],
      expiresIn: '12 days',
      isRecommended: false,
      isNoCostEMI: false,
      badge: null
    }
  ]
  
  if (isBike && (brand.includes('tvs') || brand.includes('bajaj'))) {
    offers.push({
      id: 3,
      lenderName: 'TVS Credit',
      lenderLogo: '🏍️',
      lenderColor: '#E65100',
      amount: `₹${loanAmount.toLocaleString()}`,
      amountValue: loanAmount,
      interestRate: '0%',
      interestRateValue: 0,
      term: '24 Months',
      termMonths: 24,
      termDisplay: '2 Years',
      monthlyPayment: `₹${Math.round(loanAmount / 24).toLocaleString()}`,
      monthlyPaymentValue: Math.round(loanAmount / 24),
      downpayment: downpayment,
      processingFee: 0,
      processingFeePercent: 0,
      totalInterest: 0,
      totalPayable: loanAmount + downpayment,
      features: ['Zero processing fee', 'Easy EMIs', 'Fast processing'],
      expiresIn: '8 days',
      isRecommended: false,
      isNoCostEMI: true,
      badge: 'Brand Special'
    })
  }
  
  if (isEV) {
    offers.push({
      id: 4,
      lenderName: 'Fibe',
      lenderLogo: '⚡',
      lenderColor: '#2E7D32',
      amount: `₹${loanAmount.toLocaleString()}`,
      amountValue: loanAmount,
      interestRate: '14.99%',
      interestRateValue: 14.99,
      term: '12 Months',
      termMonths: 12,
      termDisplay: '1 Year',
      monthlyPayment: `₹${calculateEMI(loanAmount, 12, 14.99).toLocaleString()}`,
      monthlyPaymentValue: calculateEMI(loanAmount, 12, 14.99),
      downpayment: downpayment,
      processingFee: Math.round(loanAmount * 0.01),
      processingFeePercent: 1,
      totalInterest: Math.round(calculateEMI(loanAmount, 12, 14.99) * 12 - loanAmount),
      totalPayable: downpayment + calculateEMI(loanAmount, 12, 14.99) * 12 + Math.round(loanAmount * 0.01),
      features: ['100% digital', 'Money in 10 mins', 'No collateral', '₹15,000 EV subsidy included'],
      expiresIn: '15 days',
      isRecommended: false,
      isNoCostEMI: false,
      badge: 'EV Special'
    })
  }
  
  offers.push({
    id: 5,
    lenderName: 'Bajaj Finserv',
    lenderLogo: '🏢',
    lenderColor: '#0066B3',
    amount: `₹${loanAmount.toLocaleString()}`,
    amountValue: loanAmount,
    interestRate: '0%',
    interestRateValue: 0,
    term: '36 Months',
    termMonths: 36,
    termDisplay: '3 Years',
    monthlyPayment: `₹${Math.round(loanAmount / 36).toLocaleString()}`,
    monthlyPaymentValue: Math.round(loanAmount / 36),
    downpayment: downpayment,
    processingFee: Math.round(loanAmount * 0.01),
    processingFeePercent: 1,
    totalInterest: 0,
    totalPayable: loanAmount + downpayment + Math.round(loanAmount * 0.01),
    features: ['Flexible tenure', 'Pre-approved', 'No documentation'],
    expiresIn: '20 days',
    isRecommended: false,
    isNoCostEMI: true,
    badge: null
  })
  
  return offers.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0))
}

function OffersScreen({toolCallUtils}) {

  toolCallUtils.getFullPrompt = (text) => {
    let str = `
     User is currently in the loan offer viewing page.
     These are the offers:
     ${JSON.stringify(lenderOffers)}
     This is user's query: ${text}
     If user is querying about the offer then return the result in json format in below format:
    {
      "index": index of offer user queried in integer,
      "response": "your response to explain that offer to user query in text, also ask user if they want to go ahead with this offer or not"
    }
    

    If user is asking you to go ahead with one of the offers, then output:
    {
      "selectedOfferIndex": index of selected offer in integer,
      "response": "your response to user (say something like, ok, going ahead with the offer"
    }
    Make sure to only send json and no other text. Also, strictly no emojis and TTS friendly outputs for "response" field. Keep responses super short. Make sure numerical values are written in english text only. Hundred for 100 and one point two for 1.2 etc.
    `
    return str
  }

function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    return null;
  }
}

  toolCallUtils.getDisplayResponse = (res) => {
    let obj = extractJSON(res);
    if (obj && obj.response){
      return obj.response
    }
    else return res
  }

  toolCallUtils.handleResponse = (res) => {
    let obj = extractJSON(res)
    if (obj){
      if(obj.selectedOfferIndex !== undefined){
        handleApplyNow(lenderOffers[obj.selectedOfferIndex])
      }
      else if(obj.index !== undefined && obj.index >= 0 && obj.index < lenderOffers.length){
        handleSelectOffer(lenderOffers[obj.index])
      }
    }
    else return
  }

  useEffect(() => {
    
  } , [])

  const navigate = useNavigate()
  const { selectedOffer, setSelectedOffer, selectedProduct, productType } = useOffer()
  const [modalOffer, setModalOffer] = useState(null)
  const [lenderOffers, setLenderOffers] = useState([])
  const [selectedTenure, setSelectedTenure] = useState(36)
  const [loading, setLoading] = useState(true)

  const handleGoBack = () => {
    navigate(-1)
  }

  const product = selectedProduct || {
    image: 'https://assets.otocapital.in/staging/09403d52-dac4-4521-9b83-491fa84bb52d.jpeg',
    name: 'Honda CB Shine',
    items: ['125cc Engine', '65 kmpl Mileage', '1 Year Warranty', 'Electric Start'],
    price: 120000,
    brand: 'Honda',
    category: 'Two Wheeler',
    specs: { power: '125 cc', mileage: '65 kmpl' },
    rating: 4.2
  }

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      const offers = generateDynamicOffers(product)
      setLenderOffers(offers)
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [selectedProduct])

  useEffect(() => {
    document.body.style.overflow = modalOffer ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [modalOffer])

  const handleSelectOffer = (offer) => {
    setModalOffer(offer)
  }

  const handleCloseModal = () => {
    setModalOffer(null)
  }

  const handleApplyNow = (offer) => {
    setSelectedOffer(offer)
    navigate('/checkout/cykc')
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="offers-screen-container">
        <div className="offers-loading">
          <div className="loading-spinner"></div>
          <p>Finding the best loan offers for you...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="offers-screen-container">
      <div className="offers-header">
        <div className="offers-header-content">
          <button className="back-btn" onClick={handleGoBack} aria-label="Go back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="offers-brand">
            <div className="offers-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="offers-title">
              <h1>Your Loan Offers</h1>
              <p>AI-powered recommendations for {product.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="offers-content">
        <div className="product-section-card">
          <div className="product-image-wrapper">
            <img src={product.image} alt={product.name} />
            {product.rating && (
              <div className="product-rating">
                <span>⭐</span>
                <span>{product.rating}</span>
              </div>
            )}
          </div>
          <div className="product-details">
            <div className="product-header">
              <h3 className="product-name">{product.name}</h3>
              <span className="product-brand">{product.brand}</span>
            </div>
            <div className="product-specs">
              {product.items?.slice(0, 3).map((item, index) => (
                <span key={index} className="spec-chip">{item}</span>
              ))}
            </div>
          </div>
          <div className="product-price-section">
            <span className="price-label">Ex-Showroom Price</span>
            <span className="price-value">{formatPrice(product.price)}</span>
          </div>
        </div>

        <div className="offers-grid">
          {lenderOffers.map((offer) => (
            <div
              key={offer.id}
              className={`offer-card ${offer.isRecommended ? 'recommended' : ''}`}
              onClick={() => handleSelectOffer(offer)}
            >
              {offer.isRecommended && (
                <div className="recommended-badge">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  AI Recommended
                </div>
              )}
              
              {offer.badge && !offer.isRecommended && (
                <div className="special-badge" style={{ background: offer.lenderColor }}>
                  {offer.badge}
                </div>
              )}
              
              <div className="offer-header">
                <div className="lender-info">
                  <span className="lender-logo" style={{ background: offer.lenderColor }}>
                    {offer.lenderLogo}
                  </span>
                  <div>
                    <h3 className="lender-name">{offer.lenderName}</h3>
                    <span className="loan-type">
                      {offer.isNoCostEMI ? 'No Cost EMI' : 'Standard Loan'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="offer-stats">
                <div className="stat-item">
                  <span className="stat-icon">📅</span>
                  <div className="stat-content">
                    <span className="stat-value">{offer.term}</span>
                    <span className="stat-label">Duration</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📈</span>
                  <div className="stat-content">
                    <span className="stat-value">{offer.interestRate}</span>
                    <span className="stat-label">Interest</span>
                  </div>
                </div>
                <div className="stat-item highlight">
                  <span className="stat-icon">💳</span>
                  <div className="stat-content">
                    <span className="stat-value">{offer.monthlyPayment}</span>
                    <span className="stat-label">per month</span>
                  </div>
                </div>
              </div>

              <div className="offer-features">
                {offer.features.slice(0, 2).map((feature, index) => (
                  <span key={index} className="feature-tag">
                    <span className="feature-dot">✓</span>
                    {feature}
                  </span>
                ))}
              </div>

              <div className="offer-footer">
                <span className="expires">⏰ Expires in {offer.expiresIn}</span>
                <button className="apply-btn">
                  Apply Now
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOffer && (
        <div className="offer-modal-overlay" onClick={handleCloseModal}>
          <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-lender">
                <span className="modal-logo" style={{ background: modalOffer.lenderColor }}>
                  {modalOffer.lenderLogo}
                </span>
                <div>
                  <h2>{modalOffer.lenderName}</h2>
                  <span className="modal-type">
                    {modalOffer.isNoCostEMI ? 'No Cost EMI' : 'Standard Loan'}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              <div className="loan-summary">
                <div className="summary-row">
                  <span className="summary-label">Loan Amount</span>
                  <span className="summary-value">{modalOffer.amount}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Down Payment</span>
                  <span className="summary-value">₹{modalOffer.downpayment.toLocaleString()}</span>
                </div>
              </div>
              <div className="modal-breakup">
                <div className="modal-breakup-head">
                  <h4>Offer Breakup</h4>
                  <span className="breakup-chip">{modalOffer.expiresIn || 'Valid this week'}</span>
                </div>
                <div className="modal-breakup-grid">
                  <div className="modal-breakup-item">
                    <span className="label">Loan Amount</span>
                    <span className="value">{modalOffer.amount}</span>
                  </div>
                  <div className="modal-breakup-item">
                    <span className="label">Processing Fee</span>
                    <span className="value">₹{modalOffer.processingFee?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="modal-breakup-item">
                    <span className="label">Down Payment</span>
                    <span className="value">₹{modalOffer.downpayment?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="modal-breakup-item">
                    <span className="label">Total Interest</span>
                    <span className="value">₹{modalOffer.totalInterest?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="modal-breakup-item">
                    <span className="label">Total Payable</span>
                    <span className="value">₹{modalOffer.totalPayable?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
              <div className="modal-features">
                <h4>Key Benefits</h4>
                <div className="features-list">
                  {modalOffer.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <span className="check-icon">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={() => handleApplyNow(modalOffer)}>
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OffersScreen
