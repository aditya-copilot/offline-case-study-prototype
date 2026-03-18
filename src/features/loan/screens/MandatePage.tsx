import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Check, 
  ChevronLeft,
  Shield,
  ArrowRight,
  Smartphone,
  Lock,
  Loader2,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader } from '@components/ui/Card';
import { useLoanStore, useSelectedOffer, useLoanActions } from '@features/loan/store';

const GPayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#EA4335"/>
    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c1.66 0 3.16-.67 4.24-1.76L12 12V6z" fill="#FBBC04"/>
    <path d="M12 6v6l4.24 4.24C17.33 15.16 18 13.66 18 12c0-3.31-2.69-6-6-6z" fill="#34A853"/>
    <path d="M6 12c0 3.31 2.69 6 6 6V6c-3.31 0-6 2.69-6 6z" fill="#4285F4"/>
  </svg>
);

const PhonePeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
    <circle cx="12" cy="12" r="10" fill="#5F259F"/>
    <path d="M12 6v4l3 3-3 5v-4l-3-3 3-5z" fill="white"/>
  </svg>
);

const PaytmIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#00BAF2"/>
    <path d="M7 8h3v8H7V8zm5 0h5v2h-5V8zm0 3h4v2h-4v-2zm0 3h5v2h-5v-2z" fill="white"/>
  </svg>
);

const CredIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#1A1A2E"/>
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">C</text>
  </svg>
);

interface UPIApp {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  Icon: React.FC;
  setupSubtitle: string;
  setupSteps: string[];
  setupMessage: string;
  ctaText: string;
}

const UPI_APPS: UPIApp[] = [
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
  },
];

export function MandatePage() {
  const navigate = useNavigate();
  const selectedOffer = useSelectedOffer();
  const { setStep, completeMandate, goToPreviousStep } = useLoanActions();
  const [step, setLocalStep] = useState<'confirm' | 'select' | 'setup' | 'processing' | 'success'>('confirm');
  const [selectedApp, setSelectedApp] = useState<UPIApp | null>(null);

  useEffect(() => {
    if (!selectedOffer) {
      navigate('/loan/offers');
      return;
    }
    setStep('mandate');
  }, [selectedOffer, navigate, setStep]);

  useEffect(() => {
    if (step === 'success') {
      completeMandate();
      const timer = setTimeout(() => {
        navigate('/loan/agreement');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, completeMandate, navigate]);

  const handleConfirmMandate = () => {
    setLocalStep('select');
  };

  const handleAppSelect = (app: UPIApp) => {
    setSelectedApp(app);
    setLocalStep('setup');
  };

  const handleSetupComplete = () => {
    setLocalStep('processing');
  };

  const handleProcessingComplete = () => {
    setLocalStep('success');
  };

  const getEmiAmount = () => selectedOffer?.monthlyPayment || '₹0';

  if (!selectedOffer) return null;

  const getBackButtonText = () => {
    if (step === 'select') return 'Back to Mandate Details';
    if (step === 'setup' || step === 'processing') return 'Back to UPI Apps';
    return 'Back to CKYC';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button 
            onClick={() => {
              if (step === 'select') {
                setLocalStep('confirm');
              } else if (step === 'setup' || step === 'processing') {
                setLocalStep('select');
                setSelectedApp(null);
              } else {
                goToPreviousStep();
                navigate(-1);
              }
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            {getBackButtonText()}
          </button>
          
          <h1 className="text-3xl font-bold mb-2">Setup Auto-Pay</h1>
          <p className="text-muted-foreground">
            {step === 'confirm' ? 'Review and confirm your mandate details' : 'Select your UPI app for automatic EMI deductions'}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Confirm Mandate</h3>
                  <p className="text-sm text-muted-foreground">
                    Review your auto-debit mandate details
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground block">Monthly EMI</span>
                        <span className="text-lg font-bold text-primary">{getEmiAmount()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground block">Frequency</span>
                        <span className="font-medium">Monthly</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground block">Tenure</span>
                        <span className="font-medium">{selectedOffer.term}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground block">First Debit</span>
                        <span className="font-medium">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      By proceeding, you authorize {selectedOffer.lenderName} to debit {getEmiAmount()} 
                      from your selected UPI account every month for {selectedOffer.term.toLowerCase()}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <Shield className="w-3 h-3" />
                    <span>Secured by NPCI</span>
                  </div>

                  <Button 
                    className="w-full h-12"
                    onClick={handleConfirmMandate}
                  >
                    Confirm & Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Choose UPI App</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred UPI payment app
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {UPI_APPS.map((app, index) => (
                      <motion.button
                        key={app.value}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleAppSelect(app)}
                        className="p-4 rounded-xl border-2 border-input hover:border-primary/50 transition-all text-left group"
                        style={{ backgroundColor: app.bgColor }}
                      >
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 shadow-sm"
                          style={{ backgroundColor: 'white' }}
                        >
                          <app.Icon />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 block">
                          {app.label}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 block">
                          Tap to setup
                        </span>
                        <div className="mt-3 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Select <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-4">
                    <Shield className="w-3 h-3" />
                    <span>Secured by NPCI</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'setup' && selectedApp && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center pb-2">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg bg-white"
                  >
                    <selectedApp.Icon />
                  </motion.div>
                  <h3 className="text-lg font-semibold">Setup {selectedApp.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.setupSubtitle}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                    {selectedApp.setupSteps.map((stepText, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ backgroundColor: selectedApp.color }}>
                          {idx + 1}
                        </div>
                        <span className="text-sm">{stepText}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl border" style={{ backgroundColor: selectedApp.bgColor, borderColor: selectedApp.color + '40' }}>
                    <p className="text-sm" style={{ color: selectedApp.color }}>
                      {selectedApp.setupMessage}
                    </p>
                  </div>

                  <Button 
                    className="w-full h-12"
                    onClick={handleSetupComplete}
                    style={{ backgroundColor: selectedApp.color }}
                  >
                    {selectedApp.ctaText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'processing' && selectedApp && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="border-0 shadow-2xl" style={{ backgroundColor: selectedApp.bgColor }}>
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-white shadow-xl"
                  >
                    <selectedApp.Icon />
                  </motion.div>
                  
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-bold mb-2"
                    style={{ color: selectedApp.color }}
                  >
                    {selectedApp.label}
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm mb-8 opacity-70"
                  >
                    Opening app to complete mandate...
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-center gap-3 p-4 bg-white/50 rounded-xl">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-5 h-5" style={{ color: selectedApp.color }} />
                      </motion.div>
                      <span className="text-sm font-medium">Connecting to {selectedApp.label}...</span>
                    </div>

                    <div className="flex items-center gap-2 justify-center text-xs opacity-60">
                      <Lock className="w-3 h-3" />
                      <span>Secure connection established</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="mt-8"
                  >
                    <Button 
                      className="w-full h-12"
                      onClick={handleProcessingComplete}
                      style={{ backgroundColor: selectedApp.color }}
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Approve in {selectedApp.label}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-emerald-600" />
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-emerald-800 mb-2">
                    Mandate Setup Complete!
                  </h3>
                  <p className="text-emerald-700">
                    Your auto-pay has been configured successfully. Redirecting...
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
