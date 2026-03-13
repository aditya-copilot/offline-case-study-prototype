import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useOffer } from '../context/OfferContext';
import './KFSPage.css';

function KFSPage() {
  const navigate = useNavigate();
  const { selectedOffer } = useOffer();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!selectedOffer) {
      navigate('/offer');
    }
  }, [selectedOffer, navigate]);

  if (!selectedOffer) return null;

  const KFS_DATA = {
    loanAmount: selectedOffer.amountValue || 120000,
    downpayment: selectedOffer.downpayment || 2000,
    interestRate: selectedOffer.interestRateValue || 0,
    tenure: selectedOffer.termMonths || 12,
    processingFee: selectedOffer.processingFee || Math.round((selectedOffer.amountValue || 120000) * 0.01),
    totalInterest: selectedOffer.totalInterest || Math.round((selectedOffer.amountValue || 120000) * (selectedOffer.interestRateValue || 0) / 100 * ((selectedOffer.termMonths || 12) / 12)),
    monthlyEmi: selectedOffer.monthlyPaymentValue || 3333,
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const totalPayable = KFS_DATA.loanAmount + KFS_DATA.totalInterest + KFS_DATA.processingFee;
    
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
    doc.text('Key Fact Statement', 105, 25, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Loan Agreement Summary', 105, 32, { align: 'center' });
    
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
      ['Loan Amount', formatCurrency(KFS_DATA.loanAmount)],
      ['Downpayment', formatCurrency(KFS_DATA.downpayment)],
      ['Interest Rate', KFS_DATA.interestRate + '% per annum'],
      ['Tenure', KFS_DATA.tenure + ' Months'],
      ['Monthly EMI', formatCurrency(KFS_DATA.monthlyEmi)],
      ['Processing Fee', formatCurrency(KFS_DATA.processingFee)],
      ['Total Interest Payable', formatCurrency(KFS_DATA.totalInterest)],
      ['Total Amount Payable', formatCurrency(totalPayable)],
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
    
    doc.save('Key_Fact_Statement.pdf');
  };

  const handleAccept = () => {
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/approved');
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="kfs-page">
        <div className="success-card">
          <div className="check-animation">
            <svg viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="none" stroke="#e0e0e0" strokeWidth="3" />
              <circle cx="26" cy="26" r="25" fill="none" stroke="#4caf50" strokeWidth="3" 
                strokeDasharray="166" strokeDashoffset="166" className="circle-draw" />
              <path fill="none" stroke="#4caf50" strokeWidth="3" d="M14.1 27.2l7.1 7.2 16.7-16.8" 
                strokeDasharray="48" strokeDashoffset="48" className="check-draw" />
            </svg>
          </div>
          <h2>Loan Approved!</h2>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  const details = [
    { label: 'Loan Amount', value: `₹${KFS_DATA.loanAmount.toLocaleString()}`, icon: '💰' },
    { label: 'Downpayment', value: `₹${KFS_DATA.downpayment.toLocaleString()}`, icon: '💳' },
    { label: 'Interest Rate', value: `${KFS_DATA.interestRate}% p.a.`, icon: '📊' },
    { label: 'Tenure', value: `${KFS_DATA.tenure} Months`, icon: '📅' },
    { label: 'Monthly EMI', value: `₹${KFS_DATA.monthlyEmi.toLocaleString()}`, icon: '🔄' },
    { label: 'Processing Fee', value: `₹${KFS_DATA.processingFee.toLocaleString()}`, icon: '⚙️' },
    { label: 'Total Interest', value: `₹${KFS_DATA.totalInterest.toLocaleString()}`, icon: '📈' },
  ];

  const totalPayable = selectedOffer.totalPayable || (KFS_DATA.loanAmount + KFS_DATA.downpayment + KFS_DATA.processingFee + KFS_DATA.totalInterest);

  return (
    <div className="kfs-page">
      <div className="main-card">
        <div className="card-header">
          <h1>Key Fact Statement</h1>
          <p>Review your loan details</p>
        </div>

        <table className="kfs-table">
          <tbody>
            {details.map((item, idx) => (
              <tr key={idx}>
                <td className="td-label">{item.label}</td>
                <td className="td-value">{item.value}</td>
              </tr>
            ))}
            <tr>
              <td className="td-label">Total Payable</td>
              <td className="td-value">₹{totalPayable.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <button className="download-btn" onClick={handleDownload}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Agreement
        </button>

        <div className="terms-box">
          <div 
            className={`checkbox ${termsAccepted ? 'checked' : ''}`}
            onClick={() => setTermsAccepted(!termsAccepted)}
          >
            {termsAccepted && <span>✓</span>}
          </div>
          <span className="terms-text" onClick={() => setTermsAccepted(!termsAccepted)}>
            I agree to the <a href="#">Terms</a> & <a href="#">Privacy Policy</a>
          </span>
        </div>

        <button 
          className="accept-btn" 
          onClick={handleAccept}
          disabled={!termsAccepted}
        >
          Accept & Proceed
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default KFSPage;
