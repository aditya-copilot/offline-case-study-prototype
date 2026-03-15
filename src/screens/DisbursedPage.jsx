import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useOffer } from '../context/OfferContext';
import './DisbursedPage.css';

function DisbursedPage() {
  const navigate = useNavigate();
  const { selectedOffer, loanId } = useOffer();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const currentLoanId = loanId || 'LN-' + Date.now().toString().slice(-6);

  useEffect(() => {
    if (!selectedOffer) {
      navigate('/checkout/offer');
    }
  }, [selectedOffer, navigate]);

  if (!selectedOffer) return null;

  const loanAmount = selectedOffer.amountValue || 120000;
  const monthlyEmi = selectedOffer.monthlyPaymentValue || 3333;
  const tenureMonths = selectedOffer.termMonths || 12;
  const interestRate = selectedOffer.interestRateValue || 0;

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
        status: month === 1 ? 'paid' : 'pending',
      });
    }
    return schedule;
  };

  const SCHEDULE = generateSchedule();

  const handleDownload = () => {
    const doc = new jsPDF();
    const totalPaid = monthlyEmi * tenureMonths;
    const totalInterest = totalPaid - loanAmount;
    
    const primaryColor = [102, 126, 234];
    const textColor = [51, 51, 51];
    const lightGray = [248, 249, 250];
    
    const formatCurrency = (amount) => {
      return 'Rs. ' + amount.toLocaleString('en-IN');
    };
    
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Disbursement Receipt', 105, 25, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing us!', 105, 32, { align: 'center' });
    
    let y = 60;
    
    doc.setFillColor(...primaryColor);
    doc.rect(20, y, 170, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, y + 9);
    doc.text('Amount / Details', 155, y + 9);
    
    y += 14;
    const rowHeight = 14;
    
    const data = [
      ['Loan Amount', formatCurrency(loanAmount)],
      ['Disbursed Amount', formatCurrency(loanAmount)],
      ['Interest Rate', (selectedOffer.interestRate || '0%') + ' per annum'],
      ['Tenure', tenureMonths + ' Months'],
      ['Monthly EMI', formatCurrency(monthlyEmi)],
      ['Total Interest', formatCurrency(totalInterest)],
      ['Total Repayment', formatCurrency(totalPaid)],
      ['Loan ID', currentLoanId],
    ];
    
    data.forEach((row, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(...lightGray);
        doc.rect(20, y, 170, rowHeight, 'F');
      }
      
      if (index === data.length - 1) {
        doc.setFillColor(102, 126, 234, 0.1);
        doc.rect(20, y, 170, rowHeight, 'F');
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'normal');
      }
      
      doc.setFontSize(10);
      doc.text(row[0], 25, y + 9);
      const valueWidth = doc.getTextWidth(row[1]);
      doc.text(row[1], 185 - valueWidth, y + 9);
      y += rowHeight;
    });
    
    y += 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 10;
    doc.setTextColor(136, 136, 136);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text('Generated on ' + dateStr, 105, y, { align: 'center' });
    y += 6;
    doc.text('This is a computer-generated document and does not require signature.', 105, y, { align: 'center' });
    
    doc.save('Loan_Disbursement_Receipt.pdf');
  };

  const handleViewDetails = () => {
    setShowScheduleModal(true);
  };

  return (
    <div className="disbursed-page">
      <div className="disbursed-card">
        <div className="success-header">
          <div className="money-rain">
            <span>💸</span>
            <span>💸</span>
            <span>💸</span>
          </div>
          <h1>Loan Disbursed!</h1>
          <p className="amount">₹{loanAmount.toLocaleString()}</p>
          <p className="subtitle">Credited to your account</p>
        </div>

        <div className="info-grid">
          <div className="info-box">
            <span className="label">Loan ID</span>
            <span className="value">{currentLoanId}</span>
          </div>
          <div className="info-box">
            <span className="label">Next EMI</span>
            <span className="value">₹{monthlyEmi.toLocaleString()}</span>
          </div>
          <div className="info-box">
            <span className="label">Tenure</span>
            <span className="value">{tenureMonths} Months</span>
          </div>
        </div>

        <button className="schedule-popup-btn" onClick={() => setShowScheduleModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          View Repayment
        </button>

        <div className="action-buttons">
          <button className="primary-btn" onClick={handleDownload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
          <button className="secondary-btn" onClick={handleViewDetails}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Details
          </button>
        </div>
      </div>

      {showScheduleModal && (
        <div className="schedule-modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <h3>Repayment Schedule</h3>
              <button className="close-btn" onClick={() => setShowScheduleModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="schedule-modal-content">
              <div className="schedule-header">
                <span>Month</span>
                <span>EMI</span>
                <span>Principal</span>
                <span>Status</span>
              </div>
              <div className="schedule-body">
                {SCHEDULE.map((row) => (
                  <div key={row.month} className={`schedule-row ${row.status}`}>
                    <span className="month">{row.month}</span>
                    <span className="emi">₹{row.emi}</span>
                    <span className="principal">₹{row.principal}</span>
                    <span className={`status ${row.status}`}>
                      {row.status === 'paid' ? '✓' : '○'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DisbursedPage;
