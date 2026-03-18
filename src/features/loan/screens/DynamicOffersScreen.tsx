import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ChevronRight, 
  Shield, 
  ChevronDown,
  ChevronUp,
  TrendingDown,
  ArrowRight,
  Wallet,
  Percent,
  Clock,
  Building2
} from 'lucide-react';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader } from '@components/ui/Card';
import { useLoanStore, useSelectedProduct, useAvailableOffers, useLoanActions } from '@features/loan/store';
import type { LoanOffer } from '@features/loan/types';

interface LenderGroup {
  lenderName: string;
  lenderLogo: string;
  lenderColor: string;
  offers: LoanOffer[];
}

function groupOffersByLender(offers: LoanOffer[]): LenderGroup[] {
  const grouped = offers.reduce((acc, offer) => {
    const existing = acc.find(g => g.lenderName === offer.lenderName);
    if (existing) {
      existing.offers.push(offer);
    } else {
      acc.push({
        lenderName: offer.lenderName,
        lenderLogo: offer.lenderLogo,
        lenderColor: offer.lenderColor,
        offers: [offer]
      });
    }
    return acc;
  }, [] as LenderGroup[]);
  
  return grouped.map(g => ({
    ...g,
    offers: g.offers.sort((a, b) => a.termMonths - b.termMonths)
  }));
}

interface TenureOption {
  months: number;
  display: string;
  dpPercent: number;
  isNoCostEMI: boolean;
  interestRate: string;
}

const TENURE_OPTIONS: TenureOption[] = [
  { months: 12, display: '12 Months', dpPercent: 5, isNoCostEMI: false, interestRate: '0%' },
  { months: 24, display: '24 Months', dpPercent: 10, isNoCostEMI: false, interestRate: '0%' },
  { months: 36, display: '36 Months', dpPercent: 15, isNoCostEMI: false, interestRate: '0%' },
];

function LenderCard({ 
  lender, 
  selectedOffer,
  onSelectOffer,
  productPrice
}: { 
  lender: LenderGroup;
  selectedOffer: LoanOffer | null;
  onSelectOffer: (offer: LoanOffer) => void;
  productPrice: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDpPercent, setSelectedDpPercent] = useState(5);
  const [isNoCostEMI, setIsNoCostEMI] = useState(false);
  
  const bestOffer = lender.offers[0];
  const lowestEMI = Math.min(...lender.offers.map(o => o.monthlyPaymentValue));
  const hasNoCostOption = lender.offers.some(o => o.isNoCostEMI);
  
  const getOfferForConfig = (months: number, dpPercent: number, ncemi: boolean): LoanOffer => {
    const loanAmount = productPrice - (productPrice * dpPercent / 100);
    const baseOffer = lender.offers.find(o => o.termMonths === months) || lender.offers[0];
    
    const monthlyEMI = ncemi 
      ? Math.round(loanAmount / months)
      : Math.round(loanAmount * (1 + baseOffer.interestRateValue / 100 * months / 12) / months);
    
    const downpayment = Math.round(productPrice * dpPercent / 100);
    const processingFee = Math.round(loanAmount * baseOffer.processingFeePercent / 100);
    const totalInterest = ncemi ? 0 : Math.round(monthlyEMI * months - loanAmount);
    
    return {
      ...baseOffer,
      id: `${lender.lenderName}-${months}-${dpPercent}-${ncemi}`,
      termMonths: months,
      term: `${months} Months`,
      termDisplay: months === 12 ? '1 Year' : months === 24 ? '2 Years' : '3 Years',
      monthlyPayment: `₹${monthlyEMI.toLocaleString()}`,
      monthlyPaymentValue: monthlyEMI,
      downpayment,
      amount: `₹${loanAmount.toLocaleString()}`,
      amountValue: loanAmount,
      totalInterest,
      totalPayable: loanAmount + downpayment + processingFee + totalInterest,
      isNoCostEMI: ncemi,
      interestRate: ncemi ? '0%' : baseOffer.interestRate,
    };
  };
  
  const configOptions = [
    { label: 'Min DP (5%)', dp: 5 },
    { label: 'Standard (10%)', dp: 10 },
    { label: 'High DP (15%)', dp: 15 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden">
        <div 
          className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                style={{ backgroundColor: `${lender.lenderColor}15` }}
              >
                {lender.lenderLogo}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{lender.lenderName}</h3>
                <p className="text-sm text-muted-foreground">
                  Starting at <span className="font-semibold text-primary">₹{lowestEMI.toLocaleString()}</span>/month
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {hasNoCostOption && (
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                      NCEMI Available
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {lender.offers.length} tenure options
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedOffer && selectedOffer.lenderName === lender.lenderName && (
                <span className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-full">
                  Selected
                </span>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t"
            >
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Down Payment</label>
                    <div className="grid grid-cols-3 gap-2">
                      {configOptions.map((opt) => (
                        <button
                          key={opt.dp}
                          onClick={() => setSelectedDpPercent(opt.dp)}
                          className={cn(
                            "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                            selectedDpPercent === opt.dp
                              ? "border-primary bg-primary/5"
                              : "border-input hover:border-primary/50"
                          )}
                        >
                          {opt.label}
                          <span className="block text-xs text-muted-foreground mt-1">
                            ₹{Math.round(productPrice * opt.dp / 100).toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {hasNoCostOption && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <span className="text-sm font-medium">No Cost EMI</span>
                      <button
                        onClick={() => setIsNoCostEMI(!isNoCostEMI)}
                        className={cn(
                          "ml-auto w-12 h-6 rounded-full transition-colors relative",
                          isNoCostEMI ? "bg-emerald-500" : "bg-gray-300"
                        )}
                      >
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                          animate={{ left: isNoCostEMI ? 'calc(100% - 1.375rem)' : '0.125rem' }}
                          transition={{ duration: 0.2 }}
                        />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Select Tenure</h4>
                  <div className="grid gap-3">
                    {[12, 24, 36].map((months) => {
                      const offer = getOfferForConfig(months, selectedDpPercent, isNoCostEMI);
                      const isSelected = selectedOffer?.id === offer.id;
                      
                      return (
                        <button
                          key={months}
                          onClick={() => onSelectOffer(offer)}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-input hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <div>
                                <span className="font-medium">{months} Months</span>
                                <span className="text-xs text-muted-foreground block">
                                  {months === 12 ? '1 Year' : months === 24 ? '2 Years' : '3 Years'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-primary">
                                {offer.monthlyPayment}
                              </span>
                              <span className="text-xs text-muted-foreground block">/month</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground ml-9">
                            <span>Interest: {offer.interestRate}</span>
                            <span>Processing: ₹{offer.processingFee.toLocaleString()}</span>
                            {offer.isNoCostEMI && (
                              <span className="text-emerald-600 font-medium">No Cost EMI</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <h4 className="text-sm font-semibold">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {bestOffer.features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 bg-muted rounded-lg"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export function DynamicOffersScreen() {
  const navigate = useNavigate();
  const selectedProduct = useSelectedProduct();
  const availableOffers = useAvailableOffers();
  const selectedOffer = useLoanStore((state) => state.selectedOffer);
  const { selectOffer, setStep } = useLoanActions();
  const [isLoading, setIsLoading] = useState(true);

  const { generateOffers } = useLoanActions();

  useEffect(() => {
    if (!selectedProduct) {
      navigate('/vehicles');
      return;
    }
    
    if (availableOffers.length === 0) {
      generateOffers();
    }
    
    useLoanStore.setState({ selectedOffer: null });
    
    const timer = setTimeout(() => setIsLoading(false), availableOffers.length > 0 ? 500 : 1500);
    return () => clearTimeout(timer);
  }, [selectedProduct, navigate, availableOffers.length, generateOffers]);

  const handleSelectOffer = (offer: LoanOffer) => {
    selectOffer(offer);
  };

  const handleContinue = () => {
    if (selectedOffer) {
      setStep('ckyc');
      navigate('/loan/ckyc');
    }
  };

  const lenders = groupOffersByLender(availableOffers);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"
          />
          <p className="text-muted-foreground">Fetching personalized offers...</p>
        </div>
      </div>
    );
  }

  if (!selectedProduct) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span className="hover:text-foreground cursor-pointer" onClick={() => navigate(-1)}>
              Product
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-foreground">Loan Offers</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            Choose Your Loan Offer
          </h1>
          <p className="text-muted-foreground">
            Personalized offers for {selectedProduct.name}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {lenders.map((lender) => (
              <LenderCard
                key={lender.lenderName}
                lender={lender}
                selectedOffer={selectedOffer}
                onSelectOffer={handleSelectOffer}
                productPrice={selectedProduct.price}
              />
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Product Summary</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
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
                  
                  {selectedOffer && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Selected Lender</span>
                        <span className="font-medium">{selectedOffer.lenderName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly EMI</span>
                        <span className="font-semibold text-primary">{selectedOffer.monthlyPayment}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tenure</span>
                        <span className="font-medium">{selectedOffer.term}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Down Payment</span>
                        <span className="font-medium">₹{selectedOffer.downpayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Interest Rate</span>
                        <span className="font-medium">{selectedOffer.interestRate}</span>
                      </div>
                      {selectedOffer.isNoCostEMI && (
                        <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                          <TrendingDown className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-emerald-700 font-medium">No Cost EMI Selected</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button 
                className="w-full h-12 text-base"
                disabled={!selectedOffer}
                onClick={handleContinue}
              >
                {selectedOffer ? 'Continue with Selected Offer' : 'Select an Offer to Continue'}
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Shield className="w-4 h-4" />
                <span>100% secure. Your data is encrypted.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
