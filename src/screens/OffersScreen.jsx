import { useState } from 'react'
import './OffersScreen.css'

const product = {
  image: '📱',
  name: 'iPhone 15 Pro',
  items: ['256GB Storage', 'Natural Titanium', '1 Year Warranty'],
  price: '₹1,20,000'
}

const lenderOffers = [
  {
    id: 1,
    lenderName: 'ICICI Bank',
    lenderLogo: '🏦',
    amount: '₹1,20,000',
    interestRate: '0%',
    term: '3 Years',
    monthlyPayment: '₹3,333',
    features: ['Instant approval', 'Zero foreclosure charges', 'Flexible EMI'],
    expiresIn: '5 days',
    isRecommended: true,
    isNoCostEMI: true
  },
  {
    id: 2,
    lenderName: 'HDB Financial',
    lenderLogo: '🏛️',
    amount: '₹1,20,000',
    interestRate: '12.99%',
    term: '2 Years',
    monthlyPayment: '₹5,600',
    features: ['Quick disbursement', 'Minimal documentation'],
    expiresIn: '12 days',
    isRecommended: false,
    isNoCostEMI: false
  },
  {
    id: 3,
    lenderName: 'TVS Credit',
    lenderLogo: '🏍️',
    amount: '₹1,20,000',
    interestRate: '0%',
    term: '2 Years',
    monthlyPayment: '₹5,000',
    features: ['Low interest', 'Easy EMIs', 'Fast processing'],
    expiresIn: '8 days',
    isRecommended: false,
    isNoCostEMI: true
  },
  {
    id: 4,
    lenderName: 'Fibe',
    lenderLogo: '💰',
    amount: '₹1,20,000',
    interestRate: '14.99%',
    term: '1 Year',
    monthlyPayment: '₹10,400',
    features: ['100% digital', 'Money in 10 mins', 'No collateral'],
    expiresIn: '15 days',
    isRecommended: false,
    isNoCostEMI: false
  },
  {
    id: 5,
    lenderName: 'Bajaj Finserv',
    lenderLogo: '🏢',
    amount: '₹1,20,000',
    interestRate: '0%',
    term: '3 Years',
    monthlyPayment: '₹3,333',
    features: ['Flexible tenure', 'Pre-approved'],
    expiresIn: '20 days',
    isRecommended: false,
    isNoCostEMI: true
  }
]

function OffersScreen() {
  const [selectedOffer, setSelectedOffer] = useState(null)

  const handleSelectOffer = (offer) => {
    setSelectedOffer(offer)
  }

  const handleCloseModal = () => {
    setSelectedOffer(null)
  }

  return (
    <div className="offers-screen-container">
      {/* Header */}
      <div className="offers-header">
        <div className="offers-header-left">
          <div className="offers-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="offers-header-info">
            <h1>Your Loan Offers</h1>
            <p>AI-powered recommendations</p>
          </div>
        </div>
      </div>

      <div className="offers-content">
        {/* Product Section - Sticky on Top */}
        <div className="product-section-container">
          <div className="product-section">
            <div className="product-image">{product.image}</div>
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <div className="product-items">
                {product.items.map((item, index) => (
                  <span key={index} className="product-item">
                    <span className="item-bullet">•</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="product-price">
              <span className="price-label">Price</span>
              <span className="price-value">{product.price}</span>
            </div>
          </div>
        </div>

        {/* Offers List */}
        <div className="offers-list">
          {lenderOffers.map((offer) => (
            <div
              key={offer.id}
              className={`offer-card ${offer.isRecommended ? 'recommended' : ''}`}
              onClick={() => handleSelectOffer(offer)}
            >
              {/* Card Header */}
              <div className="offer-card-header">
                <div className="offer-bank-info">
                  <span className="offer-bank-logo">{offer.lenderLogo}</span>
                  <div>
                    <h3 className="offer-bank-name">{offer.lenderName}</h3>
                  </div>
                </div>
                {offer.isRecommended && (
                  <div className="ai-badge">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    <span>AI Pick</span>
                  </div>
                )}
              </div>

              {/* Key Details Grid */}
              <div className="offer-details-grid">
                <div className="detail-item">
                  <div className="detail-icon">📅</div>
                  <div className="detail-content">
                    <span className="detail-value">{offer.term}</span>
                    <span className="detail-label">Duration</span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">📈</div>
                  <div className="detail-content">
                    <span className="detail-value">{offer.interestRate}</span>
                    <span className="detail-label">Interest</span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">💳</div>
                  <div className="detail-content">
                    <span className="detail-value">{offer.monthlyPayment}</span>
                    <span className="detail-label">/month</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="offer-features-row">
                {offer.isNoCostEMI && (
                  <span className="feature-pill no-cost-emi">
                    <span className="feature-dot">⚡</span>
                    No Cost EMI
                  </span>
                )}
                {offer.features.slice(0, offer.isNoCostEMI ? 1 : 2).map((feature, index) => (
                  <span key={index} className="feature-pill">
                    <span className="feature-dot">✓</span>
                    {feature}
                  </span>
                ))}
              </div>

              {/* Apply Button */}
              <button className="offer-cta-button">
                Apply Now
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Offer Detail Modal */}
      {selectedOffer && (
        <div className="offer-modal-overlay" onClick={handleCloseModal}>
          <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="offer-modal-header">
              <div className="modal-bank-info">
                <span className="modal-bank-logo">{selectedOffer.lenderLogo}</span>
                <div>
                  <h2>{selectedOffer.lenderName}</h2>
                  <span className="modal-loan-type">{selectedOffer.offerType}</span>
                </div>
              </div>
              <button className="offer-modal-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="offer-modal-content">
              <div className="modal-amount-section">
                <span className="modal-amount-label">Loan Amount</span>
                <span className="modal-amount-value">{selectedOffer.amount}</span>
              </div>
              <div className="modal-details-grid">
                <div className="modal-detail-box">
                  <span className="modal-detail-icon">📅</span>
                  <span className="modal-detail-label">Tenure</span>
                  <span className="modal-detail-value">{selectedOffer.term}</span>
                </div>
                <div className="modal-detail-box">
                  <span className="modal-detail-icon">📈</span>
                  <span className="modal-detail-label">Interest Rate</span>
                  <span className="modal-detail-value">{selectedOffer.interestRate}</span>
                </div>
                <div className="modal-detail-box">
                  <span className="modal-detail-icon">💳</span>
                  <span className="modal-detail-label">Monthly EMI</span>
                  <span className="modal-detail-value">{selectedOffer.monthlyPayment}</span>
                </div>
              </div>
              <div className="modal-features">
                <h4>Key Benefits</h4>
                <div className="modal-features-list">
                  {selectedOffer.features.map((feature, index) => (
                    <div key={index} className="modal-feature-item">
                      <span className="check-icon">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="offer-modal-actions">
              <button className="offer-modal-btn primary">
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
