import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffer } from '../context/OfferContext';
import './CYKCPage.css';

function CYKCPage() {
  const navigate = useNavigate();
  const { selectedOffer } = useOffer();
  const [currentStep, setCurrentStep] = useState('loading');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loadingText, setLoadingText] = useState('Fetching CKYC Data');
  const [dots, setDots] = useState('');
  const [showAutoOtpPopup, setShowAutoOtpPopup] = useState(false);

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
      const timer = setTimeout(() => {
        setCurrentStep('otp');
      }, 800);
      return () => clearTimeout(timer);
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
    if (otpValue.length === 6) {
      setCurrentStep('success');
      setTimeout(() => {
        setCurrentStep('mandateLoading');
      }, 2000);
    }
  };

  const renderLoading = () => (
    <div className="loader-container">
      <div className="spinner"></div>
      <p className="loader-text">{loadingText}{dots}</p>
      <p className="loader-subtext">Please wait while we process your request</p>
    </div>
  );

  const handleResend = () => {
    generateRandomOtp();
    setShowAutoOtpPopup(true);
    setTimeout(() => {
      setShowAutoOtpPopup(false);
    }, 2000);
  };

  const renderOtp = () => (
    <div className="otp-container">
      <div className="otp-card">
        <h2>Enter OTP</h2>
        <p className="otp-description">
          We have sent a 6-digit OTP to your registered mobile number
        </p>
        {showAutoOtpPopup && (
          <div className="auto-otp-popup">
            Auto picking OTP
          </div>
        )}
        <form onSubmit={handleOtpSubmit}>
          <div className="otp-inputs">
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
          <button
            type="submit"
            className="submit-button"
            disabled={otp.join('').length !== 6}
          >
            Verify OTP
          </button>
        </form>
        <p className="resend-text">
          Did not receive OTP? <button className="resend-link" onClick={handleResend}>Resend</button>
        </p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="success-container">
      <div className="success-icon">
        <svg viewBox="0 0 52 52" className="checkmark">
          <circle cx="26" cy="26" r="25" fill="none" className="checkmark-circle" />
          <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" className="checkmark-check" />
        </svg>
      </div>
      <h2>CKYC Verification Successful</h2>
      <p>Your identity has been verified successfully</p>
    </div>
  );

  return (
    <div className="cykc-page">
      {currentStep === 'loading' && renderLoading()}
      {currentStep === 'otp' && renderOtp()}
      {currentStep === 'success' && renderSuccess()}
      {currentStep === 'mandateLoading' && renderLoading()}
    </div>
  );
}

export default CYKCPage;
