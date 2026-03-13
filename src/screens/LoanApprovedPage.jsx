import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffer } from '../context/OfferContext';
import './LoanApprovedPage.css';

function LoanApprovedPage() {
  const navigate = useNavigate();
  const { selectedOffer } = useOffer();
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    if (!selectedOffer) {
      navigate('/offer');
    }
  }, [selectedOffer, navigate]);

  if (!selectedOffer) return null;

  const loanAmount = selectedOffer.amountValue || 120000;
  const monthlyEmi = selectedOffer.monthlyPaymentValue || 3333;
  const tenureMonths = selectedOffer.termMonths || 12;
  const interestRate = selectedOffer.interestRateValue || 0;
  const downpayment = selectedOffer.downpayment || 2000;
  const processingFee = selectedOffer.processingFee || 1200;
  const totalInterest = selectedOffer.totalInterest || 0;
  const totalPayable = selectedOffer.totalPayable || (loanAmount + downpayment + processingFee + totalInterest);

  const generateSchedule = () => {
    const schedule = [];
    const monthlyInterestRate = interestRate / 100 / 12;
    let remainingBalance = loanAmount;

    for (let month = 1; month <= tenureMonths; month++) {
      const interestPayment = Math.round(remainingBalance * monthlyInterestRate);
      const principalPayment = monthlyEmi - interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);

      schedule.push({
        month,
        emi: monthlyEmi,
        principal: principalPayment,
        interest: interestPayment,
      });
    }
    return schedule;
  };

  const SCHEDULE_DATA = generateSchedule();

  return (
    <div className="approved-page">
      <div className="approved-card">
        <div className="success-badge">
          <div className="badge-ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#4caf50" strokeWidth="3" 
                strokeDasharray="283" strokeDashoffset="283" className="badge-progress" />
            </svg>
            <span className="badge-check">✓</span>
          </div>
        </div>

        <h1>Loan Approved!</h1>
        <p className="loan-id">ID: LN-{Date.now().toString().slice(-8)}</p>

        <div className="loan-summary">
          <div className="summary-item">
            <span className="label">Amount</span>
            <span className="value">₹{loanAmount.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="label">EMI</span>
            <span className="value">₹{monthlyEmi.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="label">Tenure</span>
            <span className="value">{tenureMonths} Months</span>
          </div>
        </div>

        <div className="next-steps">
          <div className="step-item">
            <span className="step-dot done">✓</span>
            <span className="step-text">KYC Verified</span>
          </div>
          <div className="step-item">
            <span className="step-dot done">✓</span>
            <span className="step-text">Mandate Setup</span>
          </div>
          <div className="step-item">
            <span className="step-dot active">3</span>
            <span className="step-text">Upload Invoice</span>
          </div>
        </div>

        <button className="schedule-toggle" onClick={() => setShowSchedule(!showSchedule)}>
          {showSchedule ? 'Hide' : 'Show'} Repayment Schedule
          <span className={`arrow ${showSchedule ? 'up' : ''}`}>▼</span>
        </button>

        {showSchedule && (
          <div className="schedule-section">
            <div className="schedule-header">
              <span>Month</span>
              <span>EMI</span>
              <span>Principal</span>
              <span>Interest</span>
            </div>
            <div className="schedule-list">
              {SCHEDULE_DATA.map((row) => (
                <div key={row.month} className="schedule-row">
                  <span className="month">{row.month}</span>
                  <span className="emi">₹{row.emi}</span>
                  <span className="principal">₹{row.principal}</span>
                  <span className="interest">₹{row.interest}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="upload-btn" onClick={() => navigate('/invoice')}>
          Upload Invoice
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default LoanApprovedPage;
