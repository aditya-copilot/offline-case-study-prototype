import { useState, useEffect } from 'react'
import './EMICalculator.css'

export default function EMICalculator({ bike, onClose }) {
  const [downPayment, setDownPayment] = useState(20000)
  const [tenure, setTenure] = useState(24)
  const [interestRate, setInterestRate] = useState(10)
  const [emi, setEmi] = useState(0)
  const [totalInterest, setTotalInterest] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)

  const onRoadPrice = bike?.onRoadPrice || (bike?.price || 75000) * 1.2
  const loanAmount = onRoadPrice - downPayment

  useEffect(() => {
    const r = interestRate / 100 / 12
    const n = tenure
    const emiCalc = loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    const totalPayable = emiCalc * n
    const totalInt = totalPayable - loanAmount

    setEmi(Math.round(emiCalc))
    setTotalInterest(Math.round(totalInt))
    setTotalAmount(Math.round(totalPayable))
  }, [downPayment, tenure, interestRate, loanAmount])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const tenureOptions = [12, 18, 24, 36, 48]

  return (
    <div className="emi-overlay" onClick={onClose}>
      <div className="emi-modal" onClick={e => e.stopPropagation()}>
        <div className="emi-header">
          <h2>EMI Calculator</h2>
          <button className="emi-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="emi-bike-info">
          <h3>{bike?.name}</h3>
          <p className="emi-onroad">On-Road Price: {formatPrice(onRoadPrice)}</p>
        </div>

        <div className="emi-calculator">
          {/* Down Payment Slider */}
          <div className="emi-section">
            <div className="emi-label-row">
              <label>Down Payment</label>
              <span className="emi-value">{formatPrice(downPayment)}</span>
            </div>
            <input
              type="range"
              min="10000"
              max={onRoadPrice * 0.5}
              step="5000"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="emi-slider"
            />
            <div className="emi-range-labels">
              <span>₹10,000</span>
              <span>{formatPrice(onRoadPrice * 0.5)}</span>
            </div>
          </div>

          {/* Loan Amount */}
          <div className="emi-loan-amount">
            <span className="emi-loan-label">Loan Amount</span>
            <span className="emi-loan-value">{formatPrice(loanAmount)}</span>
          </div>

          {/* Tenure Selection */}
          <div className="emi-section">
            <label className="emi-label">Loan Tenure (Months)</label>
            <div className="emi-tenure-options">
              {tenureOptions.map(months => (
                <button
                  key={months}
                  className={`emi-tenure-btn ${tenure === months ? 'active' : ''}`}
                  onClick={() => setTenure(months)}
                >
                  {months}
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate */}
          <div className="emi-section">
            <div className="emi-label-row">
              <label>Interest Rate</label>
              <span className="emi-value">{interestRate}% p.a.</span>
            </div>
            <input
              type="range"
              min="8"
              max="18"
              step="0.5"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="emi-slider"
            />
          </div>
        </div>

        {/* EMI Result */}
        <div className="emi-result">
          <div className="emi-amount">
            <span className="emi-amount-label">Monthly EMI</span>
            <span className="emi-amount-value">{formatPrice(emi)}</span>
          </div>
          <div className="emi-breakdown">
            <div className="emi-breakdown-item">
              <span>Principal Amount</span>
              <span>{formatPrice(loanAmount)}</span>
            </div>
            <div className="emi-breakdown-item">
              <span>Total Interest Payable</span>
              <span>{formatPrice(totalInterest)}</span>
            </div>
            <div className="emi-breakdown-item total">
              <span>Total Amount Payable</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="emi-footer">
          <button className="emi-apply-btn" onClick={onClose}>
            Apply for Loan
          </button>
        </div>
      </div>
    </div>
  )
}
