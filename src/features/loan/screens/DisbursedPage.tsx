import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { 
  CheckCircle2, 
  Download, 
  Calendar,
  Wallet,
  Building2,
  ArrowRight,
  FileText,
  Repeat,
  ChevronLeft,
  X,
  Check,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader } from '@components/ui/Card';
import { useLoanStore, useSelectedOffer, useSelectedProduct, useLoanActions } from '@features/loan/store';
import { generateId, cn } from '@core/utils';

interface PaymentSchedule {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  status: 'paid' | 'pending';
}

export function DisbursedPage() {
  const navigate = useNavigate();
  const selectedOffer = useSelectedOffer();
  const selectedProduct = useSelectedProduct();
  const { disburseLoan, setStep } = useLoanActions();
  const [loanId] = useState(() => 'LN-' + generateId().slice(-8).toUpperCase());
  const [showSchedule, setShowSchedule] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!selectedOffer || !selectedProduct) {
      navigate('/loan/offers');
      return;
    }
    
    disburseLoan();
    setStep('disbursed');
  }, [selectedOffer, selectedProduct, navigate, disburseLoan, setStep]);

  const generateSchedule = (): PaymentSchedule[] => {
    const schedule: PaymentSchedule[] = [];
    const monthlyInterestRate = selectedOffer!.interestRateValue / 100 / 12;
    let remainingBalance = selectedOffer!.amountValue;
    const monthlyEmi = selectedOffer!.monthlyPaymentValue;

    for (let month = 1; month <= selectedOffer!.termMonths; month++) {
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

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const doc = new jsPDF();
      const totalPaid = selectedOffer!.monthlyPaymentValue * selectedOffer!.termMonths;
    const totalInterest = totalPaid - selectedOffer!.amountValue;
    
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
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Disbursement Receipt', 105, 25, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing us!', 105, 32, { align: 'center' });
    
    let y = 55;
    
    doc.setFillColor(primaryR, primaryG, primaryB);
    doc.rect(20, y, 170, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, y + 9);
    doc.text('Amount / Details', 155, y + 9);
    
    y += 14;
    const rowHeight = 14;
    
    const data = [
      ['Loan Amount', formatCurrency(selectedOffer!.amountValue)],
      ['Disbursed Amount', formatCurrency(selectedOffer!.amountValue)],
      ['Interest Rate', (selectedOffer!.interestRate || '0%') + ' per annum'],
      ['Tenure', selectedOffer!.termMonths + ' Months'],
      ['Monthly EMI', formatCurrency(selectedOffer!.monthlyPaymentValue)],
      ['Total Interest', formatCurrency(totalInterest)],
      ['Total Repayment', formatCurrency(totalPaid)],
      ['Loan ID', loanId],
    ];
    
    data.forEach((row, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
        doc.rect(20, y, 170, rowHeight, 'F');
      }
      
      if (index === data.length - 1) {
        doc.setFillColor(primaryR, primaryG, primaryB);
        doc.rect(20, y, 170, rowHeight, 'F');
        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(textR, textG, textB);
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
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!selectedOffer || !selectedProduct) return null;

  const totalPaid = selectedOffer.monthlyPaymentValue * selectedOffer.termMonths;
  const totalInterest = totalPaid - selectedOffer.amountValue;
  const schedule = generateSchedule();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Loan Disbursed!
          </h1>
          <p className="text-muted-foreground">
            Congratulations! The loan amount has been credited.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader className="text-center pb-2">
              <h3 className="font-semibold text-lg">Disbursement Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                {selectedProduct.image ? (
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏍️</span>
                  </div>
                )}
                <div>
                  <h4 className="font-medium">{selectedProduct.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    ₹{selectedProduct.price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-xs text-muted-foreground mb-1">Loan Amount</div>
                  <div className="text-lg font-bold text-primary">
                    {selectedOffer.amount}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-xs text-muted-foreground mb-1">Disbursed</div>
                  <div className="text-lg font-bold text-primary">
                    {selectedOffer.amount}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loan ID</span>
                  <span className="font-mono font-medium">{loanId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lender</span>
                  <span className="font-medium">{selectedOffer.lenderName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <span className="font-medium">{selectedOffer.interestRate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly EMI</span>
                  <span className="font-semibold text-emerald-600">{selectedOffer.monthlyPayment}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Interest</span>
                  <span className="font-medium">₹{totalInterest.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Repayment</span>
                  <span className="font-semibold">₹{totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">First EMI Date</span>
                  <span className="font-medium">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-12 gap-2"
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                  />
                  <span className="text-xs">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Receipt
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="h-12 gap-2"
              onClick={() => setShowSchedule(!showSchedule)}
            >
              <Calendar className="w-4 h-4" />
              {showSchedule ? 'Hide Schedule' : 'View Schedule'}
            </Button>
          </div>

          <AnimatePresence>
            {showSchedule && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Repayment Schedule
                    </h3>
                    <button 
                      onClick={() => setShowSchedule(false)}
                      className="p-1 hover:bg-muted rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </CardHeader>
                  <CardContent className="max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
                        <span>Month</span>
                        <span>EMI</span>
                        <span>Interest</span>
                        <span>Status</span>
                      </div>
                      {schedule.map((payment) => (
                        <div 
                          key={payment.month}
                          className={cn(
                            "grid grid-cols-4 gap-2 px-3 py-2 rounded-lg text-sm items-center",
                            payment.status === 'paid' 
                              ? "bg-emerald-50 text-emerald-700" 
                              : "bg-muted/50"
                          )}
                        >
                          <span className="font-medium">{payment.month}</span>
                          <span>₹{payment.emi.toLocaleString()}</span>
                          <span className="text-muted-foreground text-xs">₹{payment.interest.toLocaleString()}</span>
                          <span>
                            {payment.status === 'paid' ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-muted-foreground" />
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            className="w-full h-12 text-base"
            onClick={() => navigate('/')}
          >
            Back to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Loan Active</span>
            </div>
            <div className="flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              <span>Auto-Debit Enabled</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
