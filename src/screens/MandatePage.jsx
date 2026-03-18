import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffer } from '../context/OfferContext';
import './MandatePage.css';

const GPayIcon = () => (
  <svg viewBox="0 0 24 24" className="upi-icon" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#EA4335"/>
    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c1.66 0 3.16-.67 4.24-1.76L12 12V6z" fill="#FBBC04"/>
    <path d="M12 6v6l4.24 4.24C17.33 15.16 18 13.66 18 12c0-3.31-2.69-6-6-6z" fill="#34A853"/>
    <path d="M6 12c0 3.31 2.69 6 6 6V6c-3.31 0-6 2.69-6 6z" fill="#4285F4"/>
  </svg>
);

const PhonePeIcon = () => (
  <svg viewBox="0 0 24 24" className="upi-icon" fill="none">
    <circle cx="12" cy="12" r="10" fill="#5F259F"/>
    <path d="M12 6v4l3 3-3 5v-4l-3-3 3-5z" fill="white"/>
  </svg>
);

const PaytmIcon = () => (
  <svg viewBox="0 0 24 24" className="upi-icon" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#00BAF2"/>
    <path d="M7 8h3v8H7V8zm5 0h5v2h-5V8zm0 3h4v2h-4v-2zm0 3h5v2h-5v-2z" fill="white"/>
  </svg>
);

const CredIcon = () => (
  <svg viewBox="0 0 24 24" className="upi-icon" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#1A1A2E"/>
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">C</text>
  </svg>
);

const UPI_APPS = [
  {
    value: 'gpay',
    label: 'Google Pay',
    color: '#4285F4',
    bgColor: '#E8F0FE',
    Icon: GPayIcon,
    setupSubtitle: 'Connect your Google Pay for auto-debit',
    setupSteps: ['Opening Google Pay...', 'Verifying UPI ID...', 'Setting up auto-debit mandate...'],
    setupMessage: 'You will be redirected to Google Pay to approve the mandate. Please confirm the auto-pay request in your app.',
    ctaText: 'Open Google Pay'
  },
  {
    value: 'phonepe',
    label: 'PhonePe',
    color: '#5F259F',
    bgColor: '#F3E8FF',
    Icon: PhonePeIcon,
    setupSubtitle: 'Connect your PhonePe for auto-debit',
    setupSteps: ['Opening PhonePe...', 'Verifying UPI ID...', 'Setting up auto-debit mandate...'],
    setupMessage: 'You will be redirected to PhonePe to approve the mandate. Please confirm the auto-pay request in your app.',
    ctaText: 'Open PhonePe'
  },
  {
    value: 'paytm',
    label: 'Paytm',
    color: '#00BAF2',
    bgColor: '#E0F7FF',
    Icon: PaytmIcon,
    setupSubtitle: 'Connect your Paytm for auto-debit',
    setupSteps: ['Opening Paytm...', 'Verifying UPI ID...', 'Setting up auto-debit mandate...'],
    setupMessage: 'You will be redirected to Paytm to approve the mandate. Please confirm the auto-pay request in your app.',
    ctaText: 'Open Paytm'
  },
  {
    value: 'cred',
    label: 'CRED',
    color: '#1A1A2E',
    bgColor: '#E8E8EC',
    Icon: CredIcon,
    setupSubtitle: 'Connect your CRED for auto-debit',
    setupSteps: ['Opening CRED...', 'Verifying UPI ID...', 'Setting up auto-debit mandate...'],
    setupMessage: 'You will be redirected to CRED to approve the mandate. Please confirm the auto-pay request in your app.',
    ctaText: 'Open CRED'
  }
];

function MandatePage({toolCallUtils}) {
  if (toolCallUtils) {
    toolCallUtils.getFullPrompt = (text) => text;
    toolCallUtils.getDisplayResponse = (res) => res;
    toolCallUtils.handleResponse = (res) => res;
  }

  const navigate = useNavigate();
  const { selectedOffer, mandateSetup, completeMandate } = useOffer();

  const [step, setStep] = useState('confirm');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    if (!selectedOffer) {
      navigate('/checkout/offer');
      return;
    }
  }, [selectedOffer, navigate]);

  useEffect(() => {
    if (step === 'success') {
      completeMandate({
        selectedApp: selectedApp?.value,
        selectedAppLabel: selectedApp?.label,
        setupDate: new Date().toISOString(),
        status: 'active'
      });
      const timer = setTimeout(() => {
        navigate('/checkout/kfs');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, completeMandate, navigate, selectedApp]);

  if (!selectedOffer) return null;

  const offer = {
    lenderName: selectedOffer.lenderName || 'Lender',
    monthlyPayment: selectedOffer.monthlyPayment || '₹0',
    monthlyPaymentValue: selectedOffer.monthlyPaymentValue || 0,
    term: selectedOffer.term || '12 Months',
    termMonths: selectedOffer.termMonths || 12
  };

  const handleConfirmMandate = () => {
    setStep('select');
  };

  const handleAppSelect = (app) => {
    setSelectedApp(app);
    setStep('setup');
  };

  const handleSetupComplete = () => {
    setStep('processing');
  };

  const handleProcessingComplete = () => {
    setStep('success');
  };

  const handleGoBack = () => {
    if (step === 'select') {
      setStep('confirm');
    } else if (step === 'setup' || step === 'processing') {
      setStep('select');
      setSelectedApp(null);
    } else {
      navigate('/checkout/cykc');
    }
  };

  const getBackButtonText = () => {
    if (step === 'select') return 'Back to Mandate Details';
    if (step === 'setup' || step === 'processing') return 'Back to UPI Apps';
    return 'Back to CKYC';
  };

  const renderConfirmStep = () => (
    <div className="mandate-section">
      <div className="section-header">
        <h2>Confirm Mandate</h2>
        <p>Review your auto-debit mandate details</p>
      </div>

      <div className="payment-form">
        <div className="detail-cards">
          <div className="detail-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <span className="card-label">Monthly EMI</span>
              <span className="card-value primary">{offer.monthlyPayment}</span>
            </div>
          </div>

          <div className="detail-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <span className="card-label">Frequency</span>
              <span className="card-value">Monthly</span>
            </div>
          </div>

          <div className="detail-card">
            <div className="card-icon">📄</div>
            <div className="card-content">
              <span className="card-label">Tenure</span>
              <span className="card-value">{offer.term}</span>
            </div>
          </div>

          <div className="detail-card">
            <div className="card-icon">🗓️</div>
            <div className="card-content">
              <span className="card-label">First Debit</span>
              <span className="card-value">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="consent-box">
          <div className="consent-icon">⚠️</div>
          <p className="consent-text">
            By proceeding, you authorize {offer.lenderName} to debit {offer.monthlyPayment}
            from your selected UPI account every month for {offer.term.toLowerCase()}.
          </p>
        </div>

        <div className="security-badge">
          <span className="security-icon">🛡️</span>
          <span>Secured by NPCI</span>
        </div>

        <button
          type="button"
          className="submit-btn primary large"
          onClick={handleConfirmMandate}
        >
          Confirm & Continue
        </button>
      </div>
    </div>
  );

  const renderSelectStep = () => (
    <div className="mandate-section">
      <div className="section-header">
        <h2>Choose UPI App</h2>
        <p>Select your preferred UPI payment app for auto-debit</p>
      </div>

      <div className="upi-apps-grid">
        {UPI_APPS.map((app) => (
          <button
            key={app.value}
            className="upi-app-card"
            onClick={() => handleAppSelect(app)}
            style={{ backgroundColor: app.bgColor }}
          >
            <div className="upi-app-icon-wrapper" style={{ backgroundColor: 'white' }}>
              <app.Icon />
            </div>
            <span className="upi-app-label">{app.label}</span>
            <span className="upi-app-hint">Tap to setup</span>
            <div className="upi-app-select-hint">
              Select →
            </div>
          </button>
        ))}
      </div>

      <div className="security-badge">
        <span className="security-icon">🛡️</span>
        <span>Secured by NPCI</span>
      </div>
    </div>
  );

  const renderSetupStep = () => (
    <div className="mandate-section">
      <div className="section-header">
        <h2>Setup {selectedApp?.label}</h2>
        <p>{selectedApp?.setupSubtitle}</p>
      </div>

      <div className="payment-form">
        <div className="setup-steps">
          {selectedApp?.setupSteps.map((stepText, idx) => (
            <div key={idx} className="setup-step">
              <div
                className="step-number"
                style={{ backgroundColor: selectedApp.color }}
              >
                {idx + 1}
              </div>
              <span className="step-text">{stepText}</span>
            </div>
          ))}
        </div>

        <div
          className="setup-message"
          style={{
            backgroundColor: selectedApp?.bgColor,
            borderColor: selectedApp?.color + '40'
          }}
        >
          <p style={{ color: selectedApp?.color }}>
            {selectedApp?.setupMessage}
          </p>
        </div>

        <button
          type="button"
          className="submit-btn primary large"
          onClick={handleSetupComplete}
          style={{ background: selectedApp?.color }}
        >
          {selectedApp?.ctaText}
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="mandate-section processing-section" style={{ backgroundColor: selectedApp?.bgColor }}>
      <div className="processing-content">
        <div
          className="upi-app-icon-wrapper large"
          style={{ backgroundColor: 'white' }}
        >
          <selectedApp.Icon />
        </div>

        <h3 style={{ color: selectedApp?.color }}>{selectedApp?.label}</h3>
        <p>Opening app to complete mandate...</p>

        <div className="processing-status">
          <div className="spinner" style={{ borderTopColor: selectedApp?.color }}></div>
          <span>Connecting to {selectedApp?.label}...</span>
        </div>

        <div className="security-badge small">
          <span className="security-icon">🔒</span>
          <span>Secure connection established</span>
        </div>

        <button
          type="button"
          className="submit-btn primary"
          onClick={handleProcessingComplete}
          style={{ background: selectedApp?.color }}
        >
          📱 Approve in {selectedApp?.label}
        </button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="mandate-section success-section">
      <div className="success-content">
        <div className="success-checkmark">
          ✓
        </div>
        <h3>Mandate Setup Complete!</h3>
        <p>Your auto-pay has been configured successfully. Redirecting to agreement...</p>
      </div>
    </div>
  );

  return (
    <div className="mandate-page">
      <div className="mandate-header">
        <div className="header-content">
          <button className="back-btn" onClick={handleGoBack} aria-label="Go back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>Setup Auto-Pay</h1>
          <p>
            {step === 'confirm'
              ? 'Review and confirm your mandate details'
              : 'Select your UPI app for automatic EMI deductions'}
          </p>
        </div>
      </div>

      <div className="mandate-content">
        <div className="mandate-container">
          {step === 'confirm' && renderConfirmStep()}
          {step === 'select' && renderSelectStep()}
          {step === 'setup' && renderSetupStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </div>
    </div>
  );
}

export default MandatePage;
