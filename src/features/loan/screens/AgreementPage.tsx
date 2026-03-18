import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { 
  FileText, 
  Check, 
  ChevronLeft,
  Shield,
  Clock,
  Wallet,
  ArrowRight,
  ScrollText,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Download,
  Info,
  Percent,
  Calendar,
  TrendingUp,
  Banknote,
  Receipt,
  User,
  Building,
  FileCheck
} from 'lucide-react';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader } from '@components/ui/Card';
import { useLoanStore, useSelectedOffer, useSelectedProduct, useLoanActions, useUserFormData } from '@features/loan/store';

interface AgreementField {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

export function AgreementPage() {
  const navigate = useNavigate();
  const selectedOffer = useSelectedOffer();
  const selectedProduct = useSelectedProduct();
  const userFormData = useUserFormData();
  const { setStep, approveLoan } = useLoanActions();
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    consent: false,
    mandate: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!selectedOffer || !selectedProduct) {
      navigate('/loan/offers');
      return;
    }
    setStep('kfs');
  }, [selectedOffer, selectedProduct, navigate, setStep]);

  const allAgreed = Object.values(agreements).every(Boolean);

  // Calculate loan details
  const loanAmount = selectedOffer?.amountValue || 0;
  const downpayment = selectedOffer?.downpayment || 0;
  const processingFee = selectedOffer?.processingFee || 0;
  const interestRate = selectedOffer?.interestRateValue || 0;
  const tenureMonths = selectedOffer?.termMonths || 0;
  const monthlyEmi = selectedOffer?.monthlyPaymentValue || 0;
  const totalInterest = (monthlyEmi * tenureMonths) - loanAmount;
  const totalPayable = loanAmount + downpayment + processingFee + totalInterest;

  const agreementFields: AgreementField[] = [
    { label: 'Loan Amount', value: `₹${loanAmount.toLocaleString()}`, icon: <Banknote className="w-4 h-4" />, highlight: true },
    { label: 'Downpayment', value: `₹${downpayment.toLocaleString()}`, icon: <Wallet className="w-4 h-4" /> },
    { label: 'Processing Fee', value: `₹${processingFee.toLocaleString()}`, icon: <Receipt className="w-4 h-4" /> },
    { label: 'Interest Rate', value: `${interestRate}% p.a.`, icon: <Percent className="w-4 h-4" /> },
    { label: 'Tenure', value: `${tenureMonths} Months`, icon: <Calendar className="w-4 h-4" /> },
    { label: 'Monthly EMI', value: `₹${monthlyEmi.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4" />, highlight: true },
    { label: 'Total Interest', value: `₹${totalInterest.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Total Payable', value: `₹${totalPayable.toLocaleString()}`, icon: <Receipt className="w-4 h-4" />, highlight: true },
  ];

  const borrowerFields: AgreementField[] = [
    { label: 'Borrower Name', value: userFormData.name || 'Not provided', icon: <User className="w-4 h-4" /> },
    { label: 'Email', value: userFormData.email || 'Not provided', icon: <Info className="w-4 h-4" /> },
    { label: 'Phone', value: userFormData.phone || 'Not provided', icon: <Info className="w-4 h-4" /> },
    { label: 'PAN Number', value: userFormData.panNumber ? 'XXXXX' + userFormData.panNumber.slice(-5) : 'Not provided', icon: <FileCheck className="w-4 h-4" /> },
  ];

  const lenderFields: AgreementField[] = [
    { label: 'Lender Name', value: selectedOffer?.lenderName || 'Not specified', icon: <Building className="w-4 h-4" /> },
    { label: 'Loan Type', value: selectedOffer?.isNoCostEMI ? 'No Cost EMI' : 'Standard Loan', icon: <Percent className="w-4 h-4" /> },
    { label: 'Product', value: selectedProduct?.name || 'Not specified', icon: <FileText className="w-4 h-4" /> },
    { label: 'Product Price', value: `₹${(selectedProduct?.price || 0).toLocaleString()}`, icon: <Banknote className="w-4 h-4" /> },
  ];

  const handleAgreeAll = () => {
    const newValue = !allAgreed;
    setAgreements({
      terms: newValue,
      privacy: newValue,
      consent: newValue,
      mandate: newValue
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const doc = new jsPDF();
      const primaryR = 102;
    const primaryG = 126;
    const primaryB = 234;
    const textR = 51;
    const textG = 51;
    const textB = 51;
    const lightGrayR = 248;
    const lightGrayG = 249;
    const lightGrayB = 250;
    
    const formatCurrency = (amount: number) => {
      return 'Rs. ' + amount.toLocaleString('en-IN');
    };
    
    doc.setFillColor(primaryR, primaryG, primaryB);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Agreement', 105, 25, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Key Fact Statement', 105, 35, { align: 'center' });
    doc.text(`${selectedOffer?.lenderName || 'Lender'}`, 105, 42, { align: 'center' });
    
    let y = 65;
    
    doc.setFillColor(primaryR, primaryG, primaryB);
    doc.rect(20, y, 170, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Details', 25, y + 8);
    
    y += 12;
    const rowHeight = 10;
    
    const loanData = [
      ['Loan Amount', formatCurrency(loanAmount)],
      ['Downpayment', formatCurrency(downpayment)],
      ['Processing Fee', formatCurrency(processingFee)],
      ['Interest Rate', interestRate + '% per annum'],
      ['Tenure', tenureMonths + ' Months'],
      ['Monthly EMI', formatCurrency(monthlyEmi)],
      ['Total Interest Payable', formatCurrency(totalInterest)],
      ['Total Amount Payable', formatCurrency(totalPayable)],
    ];
    
    loanData.forEach((row, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
        doc.rect(20, y, 170, rowHeight, 'F');
      }
      
      if (index === loanData.length - 1) {
        doc.setFillColor(primaryR, primaryG, primaryB);
        doc.rect(20, y, 170, rowHeight, 'F');
        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(textR, textG, textB);
        doc.setFont('helvetica', 'normal');
      }
      
      doc.setFontSize(10);
      doc.text(row[0], 25, y + 6);
      const valueWidth = doc.getTextWidth(row[1]);
      doc.text(row[1], 185 - valueWidth, y + 6);
      y += rowHeight;
    });
    
    y += 10;
    
    doc.setFillColor(primaryR, primaryG, primaryB);
    doc.rect(20, y, 170, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Borrower Details', 25, y + 8);
    
    y += 12;
    
    const borrowerData = [
      ['Borrower Name', userFormData.name || 'Not provided'],
      ['Email', userFormData.email || 'Not provided'],
      ['Phone', userFormData.phone || 'Not provided'],
      ['PAN Number', userFormData.panNumber ? 'XXXXX' + userFormData.panNumber.slice(-5) : 'Not provided'],
    ];
    
    borrowerData.forEach((row, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
        doc.rect(20, y, 170, rowHeight, 'F');
      }
      
      doc.setTextColor(textR, textG, textB);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(row[0], 25, y + 6);
      const valueWidth = doc.getTextWidth(row[1]);
      doc.text(row[1], 185 - valueWidth, y + 6);
      y += rowHeight;
    });
    
    y += 10;
    
    doc.setFillColor(primaryR, primaryG, primaryB);
    doc.rect(20, y, 170, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Product Details', 25, y + 8);
    
    y += 12;
    
    const productData = [
      ['Product', selectedProduct?.name || 'Not specified'],
      ['Product Price', 'Rs. ' + (selectedProduct?.price || 0).toLocaleString('en-IN')],
      ['Lender', selectedOffer?.lenderName || 'Not specified'],
      ['Loan Type', selectedOffer?.isNoCostEMI ? 'No Cost EMI' : 'Standard Loan'],
    ];
    
    productData.forEach((row, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
        doc.rect(20, y, 170, rowHeight, 'F');
      }
      
      doc.setTextColor(textR, textG, textB);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(row[0], 25, y + 6);
      const valueWidth = doc.getTextWidth(row[1]);
      doc.text(row[1], 185 - valueWidth, y + 6);
      y += rowHeight;
    });
    
    y += 15;
    
    doc.setTextColor(136, 136, 136);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms & Conditions:', 20, y);
    y += 6;
    doc.text('1. I agree to the loan terms including interest rate, processing fees, and repayment schedule.', 25, y);
    y += 5;
    doc.text('2. I consent to the collection and processing of my personal data as per the privacy policy.', 25, y);
    y += 5;
    doc.text('3. I authorize the lender to access my credit report from RBI-approved credit bureaus.', 25, y);
    y += 5;
    doc.text('4. I authorize automatic EMI deduction from my bank account via NACH mandate.', 25, y);
    
    y += 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 10;
    doc.setTextColor(136, 136, 136);
    doc.setFontSize(9);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text('Generated on ' + dateStr, 105, y, { align: 'center' });
    y += 6;
    doc.text('This is a computer-generated document and does not require signature.', 105, y, { align: 'center' });
    
      doc.save('Loan_Agreement.pdf');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      approveLoan();
      setTimeout(() => {
        navigate('/loan/approved');
      }, 1500);
    }, 2000);
  };

  if (!selectedOffer || !selectedProduct) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ScrollText className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Loan Agreement</span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div
              key="agreement"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-accent" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-8 p-4 bg-muted/50 rounded-xl">
                    {selectedProduct.image ? (
                      <img 
                        src={selectedProduct.image} 
                        alt={selectedProduct.name}
                        className="w-16 h-16 object-cover rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🏍️</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedProduct.name}</h3>
                      <p className="text-sm text-muted-foreground">Loan Amount: <span className="font-semibold text-primary">{selectedOffer.amount}</span></p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">EMI</div>
                      <div className="font-bold">{selectedOffer.monthlyPayment}</div>
                      <div className="text-xs text-muted-foreground">/month</div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-primary" />
                      Loan Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {agreementFields.map((field, index) => (
                        <motion.div
                          key={field.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all",
                            field.highlight 
                              ? "border-primary/30 bg-primary/5" 
                              : "border-border bg-card"
                          )}
                        >
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            {field.icon}
                            <span className="text-xs font-medium">{field.label}</span>
                          </div>
                          <div className={cn(
                            "font-semibold",
                            field.highlight ? "text-primary" : "text-foreground"
                          )}>
                            {field.value}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Borrower Details Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Borrower Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {borrowerFields.map((field, index) => (
                        <motion.div
                          key={field.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="text-muted-foreground">{field.icon}</div>
                          <div>
                            <div className="text-xs text-muted-foreground">{field.label}</div>
                            <div className="font-medium">{field.value}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5 text-primary" />
                      Lender & Product Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {lenderFields.map((field, index) => (
                        <motion.div
                          key={field.label}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="text-muted-foreground">{field.icon}</div>
                          <div>
                            <div className="text-xs text-muted-foreground">{field.label}</div>
                            <div className="font-medium">{field.value}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    variant="outline"
                    className="w-full h-12 mb-8 gap-2 border-primary/30 hover:bg-primary/5"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                        />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Agreement PDF
                      </>
                    )}
                  </Button>

                  {/* Consent Checkboxes */}
                  <div className="space-y-4 mb-8">
                    {[
                      { 
                        key: 'terms', 
                        title: 'Terms & Conditions',
                        description: 'I agree to the loan terms including interest rate, processing fees, and repayment schedule.'
                      },
                      { 
                        key: 'privacy', 
                        title: 'Privacy Policy',
                        description: 'I consent to the collection and processing of my personal data as per the privacy policy.'
                      },
                      { 
                        key: 'consent', 
                        title: 'Credit Bureau Consent',
                        description: 'I authorize the lender to access my credit report from RBI-approved credit bureaus.'
                      },
                      { 
                        key: 'mandate', 
                        title: 'Auto-Debit Authorization',
                        description: 'I authorize automatic EMI deduction from my bank account via NACH mandate.'
                      }
                    ].map((item, index) => (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setAgreements(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof agreements] }))}
                        className={cn(
                          "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                          agreements[item.key as keyof typeof agreements]
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 bg-card"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                            agreements[item.key as keyof typeof agreements]
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30"
                          )}>
                            {agreements[item.key as keyof typeof agreements] && (
                              <Check className="w-4 h-4 text-primary-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-6">
                    <button
                      onClick={handleAgreeAll}
                      className="flex items-center gap-3 mb-6 text-primary hover:text-primary/80 font-medium"
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        allAgreed ? "border-primary bg-primary" : "border-primary/30"
                      )}>
                        {allAgreed && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      I agree to all terms and conditions
                    </button>

                    <Button 
                      className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-primary/25"
                      disabled={!allAgreed || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          Accept & Proceed
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>RBI Regulated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>e-Sign Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span>Secure Payment</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/30"
              >
                <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">
                Agreement Accepted!
              </h3>
              <p className="text-muted-foreground">
                Proceeding to loan approval...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
