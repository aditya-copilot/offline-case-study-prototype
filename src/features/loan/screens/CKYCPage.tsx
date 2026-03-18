import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Smartphone, 
  Check, 
  Loader2,
  ArrowRight,
  ChevronLeft,
  Fingerprint,
  UserCheck,
  Timer,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import { useLoanStore, useSelectedOffer, useLoanActions, useUserFormData } from '@features/loan/store';

export function CKYCPage() {
  const navigate = useNavigate();
  const selectedOffer = useSelectedOffer();
  const userFormData = useUserFormData();
  const { setStep, completeCKYC } = useLoanActions();
  const [currentStep, setCurrentStep] = useState<'loading' | 'otp' | 'verifying' | 'success'>('loading');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [showAutoFillPopup, setShowAutoFillPopup] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canSubmit, setCanSubmit] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!selectedOffer) {
      navigate('/loan/offers');
      return;
    }
    setStep('ckyc');
    
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setCurrentStep('otp');
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [selectedOffer, navigate, setStep]);

  useEffect(() => {
    if (currentStep === 'otp' && resendTimer > 0) {
      const timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, resendTimer]);

  useEffect(() => {
    const otpString = otp.join('');
    setCanSubmit(otpString.length === 6);
    
    if (currentStep === 'otp' && otpString.length === 6 && !isAutoFilling) {
      const autoSubmitTimer = setTimeout(() => {
        if (otp.join('').length === 6) {
          handleVerify();
        }
      }, 1200);
      return () => clearTimeout(autoSubmitTimer);
    }
  }, [otp, currentStep, isAutoFilling]);

  useEffect(() => {
    if (currentStep === 'otp') {
      const timer = setTimeout(() => {
        setShowAutoFillPopup(true);
        setIsAutoFilling(true);
        
        const randomOtp = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10).toString());
        
        randomOtp.forEach((digit, index) => {
          setTimeout(() => {
            setOtp((prev) => {
              const newOtp = [...prev];
              newOtp[index] = digit;
              return newOtp;
            });
          }, index * 100);
        });

        setTimeout(() => {
          setShowAutoFillPopup(false);
          setIsAutoFilling(false);
        }, 800);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'success') {
      completeCKYC();
      const timer = setTimeout(() => {
        setStep('mandate');
        navigate('/loan/mandate');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, completeCKYC, navigate, setStep]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return;

    setCurrentStep('verifying');
    setTimeout(() => {
      setCurrentStep('success');
    }, 2000);
  };

  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    setResendTimer(30);
    setIsAutoFilling(false);
    setShowAutoFillPopup(false);
    inputRefs.current[0]?.focus();
  };

  if (!selectedOffer) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Fingerprint className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">CKYC Verification</span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentStep === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center py-12"
            >
              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${loadingProgress * 2.83} 283`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--accent))" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Fingerprint className="w-12 h-12 text-primary" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">
                Fetching Your KYC
              </h3>
              <p className="text-muted-foreground text-sm">
                Retrieving from central KYC registry
              </p>
            </motion.div>
          )}

          {currentStep === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Card className="border shadow-lg bg-card">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <Smartphone className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      Verify OTP
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Enter the 6-digit code sent to your mobile
                    </p>
                  </div>

                  <div className="relative">
                    <div className="flex justify-center gap-3 mb-6">
                      {otp.map((digit, index) => (
                        <motion.div
                          key={index}
                          initial={false}
                          animate={{
                            scale: isAutoFilling && digit ? [1, 1.1, 1] : 1,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <input
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            disabled={isAutoFilling}
                            className={cn(
                              "w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 bg-background",
                              digit 
                                ? "border-primary bg-primary/10 text-primary" 
                                : "border-input",
                              "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20",
                              isAutoFilling && "animate-pulse"
                            )}
                          />
                        </motion.div>
                      ))}
                    </div>

                    <AnimatePresence>
                      {showAutoFillPopup && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.9 }}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 z-10"
                        >
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg whitespace-nowrap">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">Auto-filling OTP...</span>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="w-4 h-4" />
                            </motion.div>
                          </div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rotate-45" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {isAutoFilling && !showAutoFillPopup && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mb-6"
                    >
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </span>
                    </motion.div>
                  )}

                  <Button 
                    className="w-full h-12 mb-4 font-semibold"
                    disabled={!canSubmit || isAutoFilling}
                    onClick={handleVerify}
                  >
                    {isAutoFilling ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Verify OTP
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                        <Timer className="w-4 h-4" />
                        Resend in {resendTimer}s
                      </div>
                    ) : (
                      <button 
                        onClick={handleResend}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Resend OTP
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>RBI Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>256-bit SSL</span>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full rounded-full border-4 border-muted border-t-primary"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <UserCheck className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Verifying Identity
              </h3>
              <p className="text-muted-foreground">Please wait...</p>
            </motion.div>
          )}

          {currentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
              >
                <Check className="w-12 h-12 text-primary-foreground" />
              </motion.div>
              
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold mb-2"
              >
                KYC Verified!
              </motion.h3>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mb-4 p-4 bg-muted/50 rounded-xl mx-auto max-w-sm"
              >
                <div className="text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{userFormData.name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">PAN</span>
                    <span className="font-medium">{userFormData.panNumber ? userFormData.panNumber.toUpperCase() : 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{userFormData.phone || 'Not provided'}</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground"
              >
                Redirecting to mandate setup...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
