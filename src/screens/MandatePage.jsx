import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffer } from '../context/OfferContext';
import './MandatePage.css';

function MandatePage({toolCallUtils}) {
  if (toolCallUtils) {
    toolCallUtils.getFullPrompt = (text) => text;
    toolCallUtils.getDisplayResponse = (res) => res;
    toolCallUtils.handleResponse = (res) => res;
  }

  const navigate = useNavigate();
  const { selectedOffer } = useOffer();
  const [step, setStep] = useState('vpa');
  const [vpa, setVpa] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [username, setUsername] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [customBank, setCustomBank] = useState('');
  const [errors, setErrors] = useState({});

  const bankOptions = [
    { value: 'hdfcbank', label: '@hdfcbank' },
    { value: 'icici', label: '@icici' },
    { value: 'sbi', label: '@sbi' },
    { value: 'axisbank', label: '@axisbank' },
    { value: 'kotak', label: '@kotak' },
    { value: 'yesbank', label: '@yesbank' },
    { value: 'pnb', label: '@pnb' },
    { value: 'bob', label: '@bob' },
    { value: 'custom', label: 'Custom (Enter manually)' }
  ];

  useEffect(() => {
    if (!selectedOffer) {
      navigate('/checkout/offer');
    }
  }, [selectedOffer, navigate]);

  if (!selectedOffer) return null;

  const offer = {
    downpayment: selectedOffer.downpayment || 2000,
    mandateAmount: selectedOffer.monthlyPaymentValue || 3333,
    tenure: selectedOffer.termMonths || 12,
    loanAmount: selectedOffer.amountValue || 120000,
    interestRate: selectedOffer.interestRateValue || 0,
    processingFee: selectedOffer.processingFee || 1200,
    totalInterest: selectedOffer.totalInterest || 0,
    totalPayable: selectedOffer.totalPayable || 121200,
    lenderName: selectedOffer.lenderName || 'Lender',
  };

  const validateVPA = (vpaValue) => {
    const errors = {};
    if (!vpaValue || !vpaValue.includes('@')) {
      errors.vpa = 'Please enter a valid UPI ID (e.g., name@bank)';
    }
    return errors;
  };

  const handleVpaSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateVPA(vpa);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStep('combined');
  };

  const handleCombinedSubmit = (e) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirmPayment = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
      setTimeout(() => {
        navigate('/checkout/kfs');
      }, 1500);
    }, 2500);
  };

  const handleGoBack = () => {
    navigate('/checkout/cykc');
  };

  const handleBankChange = (e) => {
    const value = e.target.value;
    setSelectedBank(value);
    setErrors(prev => ({ ...prev, bank: null }));
    if (value !== 'custom') {
      setVpa(username + '@' + value);
    } else {
      setVpa(username + '@' + customBank);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    setErrors(prev => ({ ...prev, username: null }));
    if (selectedBank === 'custom') {
      setVpa(value + '@' + customBank);
    } else if (selectedBank) {
      setVpa(value + '@' + selectedBank);
    }
  };

  const handleCustomBankChange = (e) => {
    const value = e.target.value;
    setCustomBank(value);
    setErrors(prev => ({ ...prev, customBank: null }));
    if (value) {
      setVpa(username + '@' + value);
    }
  };

  const renderVpaStep = () => (
    <div className="mandate-section">
      <div className="section-header">
        <h2>Enter UPI ID</h2>
        <p>We will use this for both mandate setup and downpayment</p>
      </div>

      <form onSubmit={handleVpaSubmit} className="payment-form">
        <div className={`form-group ${errors.username ? 'error' : ''}`}>
          <label>Your Name / Username</label>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Enter your name"
            required
            className="vpa-input"
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>

        <div className={`form-group ${errors.bank ? 'error' : ''}`}>
          <label>Select Bank Handle</label>
          <select
            value={selectedBank}
            onChange={handleBankChange}
            className="bank-select"
            required
          >
            <option value="">Choose bank handle...</option>
            {bankOptions.map((bank) => (
              <option key={bank.value} value={bank.value}>
                {bank.label}
              </option>
            ))}
          </select>
          {errors.bank && <span className="error-message">{errors.bank}</span>}
          {selectedBank === 'custom' && (
            <>
              <input
                type="text"
                value={customBank}
                onChange={handleCustomBankChange}
                placeholder="Enter custom handle (e.g., yourbank)"
                className={`custom-bank-input ${errors.customBank ? 'error' : ''}`}
                required
              />
              {errors.customBank && <span className="error-message">{errors.customBank}</span>}
            </>
          )}
        </div>

        <div className="form-group">
          <label>Your VPA</label>
          <div className={`vpa-display-preview ${errors.vpa ? 'error' : ''}`}>
            <span className="vpa-preview-value">{vpa || 'name@bank'}</span>
          </div>
          {errors.vpa && <span className="error-message">{errors.vpa}</span>}
        </div>

        <button type="submit" className="submit-btn primary" disabled={!vpa.includes('@')}>
          Continue
        </button>
      </form>
    </div>
  );

  const renderCombinedStep = () => (
    <div className="mandate-section">
      <div className="section-header">
        <h2>Payment Setup</h2>
        <p>Downpayment + Mandate in one go</p>
      </div>

      <div className="vpa-display">
        <span className="vpa-label">UPI ID</span>
        <span className="vpa-value">{vpa}</span>
        <button className="change-btn" onClick={() => setStep('vpa')}>
          Change
        </button>
      </div>

      <div className="payment-cards">
        <div className="payment-card dp-card">
          <div className="card-icon">💰</div>
          <h3>Downpayment</h3>
          <div className="frozen-amount">
            <span className="currency">₹</span>
            <span className="amount">{offer.downpayment.toLocaleString()}</span>
          </div>
          <span className="frozen-badge">Fixed</span>
        </div>

        <div className="payment-card mandate-card">
          <div className="card-icon">🔄</div>
          <h3>Auto-Debit Mandate</h3>
          <div className="frozen-amount">
            <span className="currency">₹</span>
            <span className="amount">{offer.mandateAmount.toLocaleString()}</span>
            <span className="period">/month</span>
          </div>
          <span className="frozen-badge">{offer.tenure} Months</span>
        </div>
      </div>

      <div className="total-section">
        <div className="total-row">
          <span>Downpayment</span>
          <span>₹{offer.downpayment.toLocaleString()}</span>
        </div>
        <div className="total-row">
          <span>First Mandate</span>
          <span>₹{offer.mandateAmount.toLocaleString()}</span>
        </div>
        <div className="total-row grand">
          <span>Total Today</span>
          <span>₹{(offer.downpayment + offer.mandateAmount).toLocaleString()}</span>
        </div>
      </div>

      <button onClick={handleCombinedSubmit} className="submit-btn primary large">
        Pay ₹{(offer.downpayment + offer.mandateAmount).toLocaleString()}
      </button>
    </div>
  );

  const renderConfirmation = () => (
    <div className="modal-overlay" onClick={() => setShowConfirmation(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {paymentStatus === null && (
          <>
            <h3>Confirm Payment</h3>
            <div className="confirmation-details">
              <div className="detail-row">
                <span>UPI ID:</span>
                <span className="highlight-text">{vpa}</span>
              </div>
              <div className="detail-row">
                <span>Downpayment:</span>
                <span>₹{offer.downpayment.toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span>Mandate (Monthly):</span>
                <span>₹{offer.mandateAmount.toLocaleString()}</span>
              </div>
              <div className="detail-row total-row-confirm">
                <span>Total:</span>
                <span className="total-amount">₹{(offer.downpayment + offer.mandateAmount).toLocaleString()}</span>
              </div>
            </div>
            <p className="confirmation-text">
              Approve this request on your UPI app
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleConfirmPayment}>
                Confirm
              </button>
            </div>
          </>
        )}

        {paymentStatus === 'processing' && (
          <div className="processing-state">
            <div className="spinner-small"></div>
            <h3>Processing</h3>
            <p>Check your UPI app for approval</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="success-state">
            <div className="success-checkmark">✓</div>
            <h3>Success!</h3>
            <p>Redirecting to KFS...</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mandate-page">
      <div className="mandate-header">
        <div className="header-content">
          <button className="back-btn" onClick={handleGoBack} aria-label="Go back to KYC">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>Mandate Setup</h1>
          <div className="step-indicator">
            <span className="step completed">CKYC</span>
            <span className="step-divider">→</span>
            <span className={`step ${step === 'vpa' || step === 'combined' ? 'active' : ''}`}>Mandate</span>
            <span className="step-divider">→</span>
            <span className="step">Complete</span>
          </div>
        </div>
      </div>

      <div className="mandate-content">
        <div className="mandate-container">
          {step === 'vpa' && renderVpaStep()}
          {step === 'combined' && renderCombinedStep()}
        </div>
      </div>

      {showConfirmation && renderConfirmation()}
    </div>
  );
}

export default MandatePage;
