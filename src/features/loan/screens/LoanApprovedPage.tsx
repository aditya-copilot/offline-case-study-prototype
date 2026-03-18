import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Share2,
  Calendar,
  Wallet,
  Building2,
  ArrowRight,
  FileText,
  Upload,
  Shield,
  Clock,
  Banknote,
  Sparkles,
  Trophy,
  PartyPopper
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader } from '@components/ui/Card';
import { Confetti } from '@components/feedback/Confetti';
import { useLoanStore, useSelectedOffer, useSelectedProduct, useLoanActions } from '@features/loan/store';
import { generateId } from '@core/utils';

export function LoanApprovedPage() {
  const navigate = useNavigate();
  const selectedOffer = useSelectedOffer();
  const selectedProduct = useSelectedProduct();
  const { approveLoan, setStep } = useLoanActions();
  const [referenceId] = useState(() => 'LOAN' + generateId().slice(-8).toUpperCase());
  const [showConfetti, setShowConfetti] = useState(true);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    if (!selectedOffer || !selectedProduct) {
      navigate('/loan/offers');
      return;
    }
    
    approveLoan();
    setStep('approved');

    const pulseInterval = setInterval(() => {
      setPulseCount(c => c + 1);
    }, 3000);

    return () => clearInterval(pulseInterval);
  }, [selectedOffer, selectedProduct, navigate, approveLoan, setStep]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Loan Approved!',
        text: `I've been approved for a loan on ${selectedProduct?.name} from ${selectedOffer?.lenderName}!`,
      });
    }
  };

  if (!selectedOffer || !selectedProduct) return null;

  return (
    <>
      <Confetti active={showConfetti} duration={5000} />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <motion.div 
              className="relative w-32 h-32 mx-auto mb-6"
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{
                    scale: [1, 1.5],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut"
                  }}
                />
              ))}
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <PartyPopper className="w-14 h-14 text-white" />
              </div>
              <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center"
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Congratulations!
              </h1>
              <p className="text-lg text-muted-foreground">
                Your loan has been approved
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-amber-600">
                  You are now ready to ride!
                </span>
              </div>
            </motion.div>
          </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader className="text-center pb-2">
              <h3 className="font-semibold text-lg">Sanction Details</h3>
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
                  <div className="text-xs text-muted-foreground mb-1">Monthly EMI</div>
                  <div className="text-lg font-bold text-primary">
                    {selectedOffer.monthlyPayment}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lender</span>
                  <span className="font-medium">{selectedOffer.lenderName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <span className="font-medium">{selectedOffer.interestRate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tenure</span>
                  <span className="font-medium">{selectedOffer.term}</span>
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

          <div className="mb-4">
            <Button 
              variant="outline" 
              className="w-full h-12 gap-2"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          <Button 
            className="w-full h-12 text-base mb-4"
            onClick={() => navigate('/loan/invoice')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Invoice
          </Button>

          <Button 
            variant="ghost"
            className="w-full h-12"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
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
              <Banknote className="w-4 h-4" />
              <span>Secure Payment</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Reference ID: {referenceId}
          </p>
        </motion.div>
      </div>
    </div>
    </>
  );
}
