import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffer } from '../context/OfferContext';
import './CYKCPage.css';

function CYKCPage({toolCallUtils}) {
  if (toolCallUtils) {
    toolCallUtils.getFullPrompt = (text) => text;
    toolCallUtils.getDisplayResponse = (res) => res;
    toolCallUtils.handleResponse = (res) => res;
  }

  const navigate = useNavigate();
  const { selectedOffer, userFormData } = useOffer();
  const [currentStep, setCurrentStep] = useState('loading');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loadingText, setLoadingText] = useState('Fetching CKYC Data');
  const [dots, setDots] = useState('');
  const [showAutoOtpPopup, setShowAutoOtpPopup] = useState(false);
  const [progress, setProgress] = useState(0);
  const [otpError, setOtpError] = useState('');

  const generateRandomOtp = () => {
    const newOtp = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10).toString());
    setOtp(newOtp);
  };

  useEffect(() => {
    if (!selectedOffer) {
      navigate('/checkout/offer');
    }
  }, [selectedOffer, navigate]);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    if (currentStep === 'loading') {
      let progressValue = 0;
      const progressInterval = setInterval(() => {
        progressValue += 5;
        setProgress(progressValue);
        if (progressValue >= 100) {
          clearInterval(progressInterval);
          setCurrentStep('otp');
        }
      }, 80);
      return () => clearInterval(progressInterval);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'otp') {
      setOtp(['', '', '', '', '', '']);
      const popupTimer = setTimeout(() => {
        setShowAutoOtpPopup(true);
        const fillTimer = setTimeout(() => {
          generateRandomOtp();
          const hideTimer = setTimeout(() => {
            setShowAutoOtpPopup(false);
          }, 1500);
          return () => clearTimeout(hideTimer);
        }, 500);
        return () => clearTimeout(fillTimer);
      }, 1000);
      return () => clearTimeout(popupTimer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'mandateLoading') {
      setLoadingText('Starting Mandate Page');
      const timer = setTimeout(() => {
        navigate('/checkout/mandate');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }
    setOtpError('');
    sessionStorage.setItem('userName', userFormData?.name || 'XXXX XXXX');
    sessionStorage.setItem('userPan', userFormData?.pan || 'XXXXXXXXXX');
    setCurrentStep('success');
    setTimeout(() => {
      setCurrentStep('mandateLoading');
    }, 2000);
  };

  const handleGoBack = () => {
    navigate('/checkout/offer');
  };

  const handleResend = () => {
    generateRandomOtp();
    setShowAutoOtpPopup(true);
    setTimeout(() => {
      setShowAutoOtpPopup(false);
    }, 2000);
  };

  const renderLoading = () => (
    <div className="cykc-step-container">
      <div className="cykc-loader">
        <div className="progress-ring">
          <svg viewBox="0 0 100 100">
            <circle className="progress-ring-bg" cx="50" cy="50" r="45" />
            <circle 
              className="progress-ring-fill" 
              cx="50" 
              cy="50" 
              r="45" 
              style={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
            />
          </svg>
          <div className="progress-text">{progress}%</div>
        </div>
        <h2>{loadingText}{dots}</h2>
        <p>Please wait while we fetch your CKYC details</p>
      </div>
    </div>
  );

  const renderOtp = () => (
    <div className="cykc-step-container">
      <div className="cykc-otp-card">
        <div className="otp-icon">🔐</div>
        <h2>Verify Your Identity</h2>
        <p className="otp-description">
          Enter the 6-digit OTP sent to your registered mobile number
        </p>
        {showAutoOtpPopup && (
          <div className="auto-otp-popup">
            <span className="popup-icon">✨</span>
            Auto-picking OTP
          </div>
        )}
        <form onSubmit={handleOtpSubmit}>
          <div className={`otp-inputs ${otpError ? 'error' : ''}`}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="otp-input"
                autoComplete="off"
              />
            ))}
          </div>
          {otpError && <div className="otp-error">{otpError}</div>}
          <button
            type="submit"
            className="verify-btn"
            disabled={otp.join('').length !== 6}
          >
            Verify OTP
          </button>
        </form>
        <p className="resend-text">
          Didn't receive OTP? <button className="resend-link" onClick={handleResend}>Resend</button>
        </p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="cykc-step-container">
      <div className="cykc-success">
        <div className="success-animation">
          <div className="checkmark-circle">
            <svg viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="none" />
              <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
        </div>
        <h2>CKYC Verified!</h2>
        <p>Your identity has been verified successfully</p>
        <div className="success-details">
          <div className="detail-row">
            <span>Name</span>
            <strong>{userFormData?.name || 'XXXX XXXX '}</strong>
          </div>
          <div className="detail-row">
            <span>PAN</span>
            <strong>{userFormData?.pan || 'XXXXXXXXXX'}</strong>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="cykc-page">
      <div className="cykc-header">
        <div className="header-content">
          <button className="back-btn" onClick={handleGoBack} aria-label="Go back to offers">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>KYC Verification</h1>
          <div className="step-indicator">
            <span className="step active">CKYC</span>
            <span className="step-divider">→</span>
            <span className="step">Mandate</span>
            <span className="step-divider">→</span>
            <span className="step">Complete</span>
          </div>
        </div>
      </div>
      
      <div className="cykc-content">
        {currentStep === 'loading' && renderLoading()}
        {currentStep === 'otp' && renderOtp()}
        {currentStep === 'success' && renderSuccess()}
        {currentStep === 'mandateLoading' && renderLoading()}
      </div>
    </div>
  );
}

export default CYKCPage;
