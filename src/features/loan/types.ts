export interface LoanOffer {
  id: string;
  lenderName: string;
  lenderLogo: string;
  lenderColor: string;
  amount: string;
  amountValue: number;
  interestRate: string;
  interestRateValue: number;
  term: string;
  termMonths: number;
  termDisplay: string;
  monthlyPayment: string;
  monthlyPaymentValue: number;
  downpayment: number;
  processingFee: number;
  processingFeePercent: number;
  totalInterest: number;
  totalPayable: number;
  features: string[];
  expiresIn: string;
  isRecommended: boolean;
  isNoCostEMI: boolean;
  badge: string | null;
}

export interface UserFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  panNumber: string;
  dob: string;
  aadharNumber: string;
  employmentType: 'salaried' | 'self-employed' | 'business';
  monthlyIncome: number;
}

export interface LoanApplicationState {
  selectedProduct: {
    id: string;
    name: string;
    price: number;
    image?: string;
    brand: string;
    category: string;
  } | null;
  selectedOffer: LoanOffer | null;
  userFormData: UserFormData;
  ckycVerified: boolean;
  mandateSetup: boolean;
  loanApproved: boolean;
  currentStep: 'product-selection' | 'offers' | 'ckyc' | 'mandate' | 'kfs' | 'approved' | 'disbursed';
}

export interface EMICalculation {
  principal: number;
  tenureMonths: number;
  interestRate: number;
  monthlyEMI: number;
  totalInterest: number;
  totalPayable: number;
  downpayment: number;
  processingFee: number;
}

export interface CKYCData {
  customerId: string;
  name: string;
  panNumber: string;
  aadharNumber: string;
  address: string;
  verificationStatus: 'pending' | 'in-progress' | 'verified' | 'failed';
  verifiedAt?: Date;
}

export interface MandateDetails {
  vpa: string;
  bankName: string;
  mandateAmount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'active' | 'failed';
  umn?: string;
}

export type LoanStep = 
  | 'product-selection'
  | 'user-input'
  | 'offers'
  | 'ckyc'
  | 'mandate'
  | 'kfs'
  | 'approved'
  | 'disbursed';

export const LOAN_STEPS: LoanStep[] = [
  'product-selection',
  'user-input',
  'offers',
  'ckyc',
  'mandate',
  'kfs',
  'approved',
  'disbursed'
];

export function calculateEMI(
  principal: number, 
  tenureMonths: number, 
  interestRate: number
): number {
  const monthlyRate = interestRate / 12 / 100;
  if (monthlyRate === 0) {
    return Math.round(principal / tenureMonths);
  }
  const emi = 
    principal * 
    monthlyRate * 
    Math.pow(1 + monthlyRate, tenureMonths) / 
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

export function generateDynamicOffers(product: {
  id: string;
  name: string;
  price: number;
  brand: string;
  category: string;
}): LoanOffer[] {
  const productPrice = product.price;
  const downpayment = Math.max(2000, Math.round(productPrice * 0.02));
  const loanAmount = productPrice - downpayment;
  
  const lenders = [
    {
      name: 'ICICI Bank',
      logo: '🏦',
      color: '#1B5E20',
      interestRate: 0,
      interestDisplay: '0%',
      processingFeePercent: 1,
      features: ['Instant approval', 'Zero foreclosure charges', 'Flexible EMI'],
      expiresIn: '5 days',
      isNoCostEMI: true
    },
    {
      name: 'HDFC Bank',
      logo: '🏛️',
      color: '#1565C0',
      interestRate: 8.5,
      interestDisplay: '8.5%',
      processingFeePercent: 1.5,
      features: ['Quick disbursement', 'Minimal documentation', 'Low interest'],
      expiresIn: '12 days',
      isNoCostEMI: false
    },
    {
      name: 'Axis Bank',
      logo: '🏢',
      color: '#B71C1C',
      interestRate: 10.99,
      interestDisplay: '10.99%',
      processingFeePercent: 1,
      features: ['Pre-approved offers', 'Digital process', 'No hidden charges'],
      expiresIn: '10 days',
      isNoCostEMI: false
    },
    {
      name: 'Kotak Mahindra',
      logo: '🏪',
      color: '#0066B3',
      interestRate: 9.99,
      interestDisplay: '9.99%',
      processingFeePercent: 1.2,
      features: ['Same day approval', 'Flexible repayment', 'No collateral'],
      expiresIn: '8 days',
      isNoCostEMI: false
    },
    {
      name: 'Bajaj Finserv',
      logo: '🏭',
      color: '#0066B3',
      interestRate: 0,
      interestDisplay: '0%',
      processingFeePercent: 2,
      features: ['Zero interest EMI', 'Easy documentation', 'Fast processing'],
      expiresIn: '7 days',
      isNoCostEMI: true
    }
  ];
  
  const tenures = [12, 24, 36];
  
  const offers: LoanOffer[] = [];
  
  lenders.forEach((lender, lenderIndex) => {
    tenures.forEach((tenureMonths, tenureIndex) => {
      const monthlyEMI = lender.interestRate === 0 
        ? Math.round(loanAmount / tenureMonths)
        : calculateEMI(loanAmount, tenureMonths, lender.interestRate);
      
      const processingFee = Math.round(loanAmount * lender.processingFeePercent / 100);
      const totalInterest = lender.interestRate === 0 
        ? 0 
        : Math.round(monthlyEMI * tenureMonths - loanAmount);
      const totalPayable = loanAmount + downpayment + processingFee + totalInterest;
      
      const termDisplay = tenureMonths === 12 ? '1 Year' : 
                         tenureMonths === 24 ? '2 Years' : '3 Years';
      
      offers.push({
        id: `${lenderIndex}-${tenureIndex}`,
        lenderName: lender.name,
        lenderLogo: lender.logo,
        lenderColor: lender.color,
        amount: `₹${loanAmount.toLocaleString()}`,
        amountValue: loanAmount,
        interestRate: lender.interestDisplay,
        interestRateValue: lender.interestRate,
        term: `${tenureMonths} Months`,
        termMonths: tenureMonths,
        termDisplay: termDisplay,
        monthlyPayment: `₹${monthlyEMI.toLocaleString()}`,
        monthlyPaymentValue: monthlyEMI,
        downpayment,
        processingFee,
        processingFeePercent: lender.processingFeePercent,
        totalInterest,
        totalPayable,
        features: lender.features,
        expiresIn: lender.expiresIn,
        isRecommended: false,
        isNoCostEMI: lender.isNoCostEMI,
        badge: lender.isNoCostEMI && tenureMonths === 36 ? '0% Interest' : null
      });
    });
  });
  
  return offers.sort((a, b) => a.monthlyPaymentValue - b.monthlyPaymentValue);
}
