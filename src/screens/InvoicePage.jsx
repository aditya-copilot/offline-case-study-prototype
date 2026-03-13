import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffer } from '../context/OfferContext';
import './InvoicePage.css';

function InvoicePage() {
  const navigate = useNavigate();
  const { selectedOffer } = useOffer();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('upload');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!selectedOffer) {
      navigate('/offer');
    }
  }, [selectedOffer, navigate]);

  if (!selectedOffer) return null;

  const loanAmount = parseInt(selectedOffer.amount.replace(/[^0-9]/g, '')) || 120000;
  const monthlyEmi = parseInt(selectedOffer.monthlyPayment.replace(/[^0-9]/g, '')) || 3333;

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('verify');
      
      setTimeout(() => {
        setStatus('verified');
        setTimeout(() => {
          navigate('/disbursed');
        }, 1500);
      }, 3000);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setStatus('verify');
      
      setTimeout(() => {
        setStatus('verified');
        setTimeout(() => {
          navigate('/disbursed');
        }, 1500);
      }, 3000);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  if (status === 'verify') {
    return (
      <div className="invoice-page">
        <div className="verify-card">
          <div className="scan-animation">
            <div className="scan-line"></div>
            <div className="doc-preview">
              <span className="doc-icon">📄</span>
              <span className="doc-name">{file?.name}</span>
            </div>
          </div>
          <h2>Verifying Invoice</h2>
          <p>Please wait...</p>
          <div className="progress-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <div className="invoice-page">
        <div className="verify-card success">
          <div className="success-ring">
            <svg viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="none" stroke="#4caf50" strokeWidth="3" />
              <path fill="none" stroke="#4caf50" strokeWidth="3" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <h2>Verified!</h2>
          <p>Invoice approved</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-page">
      <div className="invoice-card">
        <div className="invoice-header">
          <h1>Upload Invoice</h1>
          <p>For loan disbursement</p>
        </div>

        <div 
          className="upload-zone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
            hidden
          />
          <div className="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="upload-text">Drop file here or click to browse</p>
          <span className="upload-hint">PDF, JPG, PNG up to 5MB</span>
        </div>

        <div className="loan-preview">
          <div className="preview-row">
            <span>Loan Amount</span>
            <span>₹{loanAmount.toLocaleString()}</span>
          </div>
          <div className="preview-row">
            <span>Monthly EMI</span>
            <span>₹{monthlyEmi.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicePage;
