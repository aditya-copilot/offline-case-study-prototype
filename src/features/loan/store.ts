import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoanOffer, UserFormData, LoanStep, EMICalculation } from './types';
import { calculateEMI, generateDynamicOffers } from './types';

interface LoanState {
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
  currentStep: LoanStep;
  ckycVerified: boolean;
  mandateSetup: boolean;
  loanApproved: boolean;
  loanDisbursed: boolean;
  availableOffers: LoanOffer[];
  emiCalculation: EMICalculation | null;
  selectProduct: (product: LoanState['selectedProduct']) => void;
  selectOffer: (offer: LoanOffer) => void;
  updateUserFormData: (data: Partial<UserFormData>) => void;
  generateOffers: () => void;
  calculateEMIForOffer: (offer: LoanOffer) => EMICalculation;
  setStep: (step: LoanStep) => void;
  completeCKYC: () => void;
  completeMandate: () => void;
  approveLoan: () => void;
  disburseLoan: () => void;
  resetLoan: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

const initialUserFormData: UserFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  panNumber: '',
  dob: '',
  aadharNumber: '',
  employmentType: 'salaried',
  monthlyIncome: 0
};

const LOAN_STEP_ORDER: LoanStep[] = [
  'product-selection',
  'user-input',
  'offers',
  'ckyc',
  'mandate',
  'kfs',
  'approved',
  'disbursed'
];

export const useLoanStore = create<LoanState>()(
  persist(
    (set, get) => ({
      selectedProduct: null,
      selectedOffer: null,
      userFormData: { ...initialUserFormData },
      currentStep: 'product-selection',
      ckycVerified: false,
      mandateSetup: false,
      loanApproved: false,
      loanDisbursed: false,
      availableOffers: [],
      emiCalculation: null,

      selectProduct: (product) => {
        set({ selectedProduct: product });
        if (product) {
          const offers = generateDynamicOffers(product);
          set({ availableOffers: offers });
        }
      },

      selectOffer: (offer) => {
        set({ selectedOffer: offer });
        const emi = get().calculateEMIForOffer(offer);
        set({ emiCalculation: emi });
      },

      updateUserFormData: (data) => {
        set((state) => ({
          userFormData: { ...state.userFormData, ...data }
        }));
      },

      generateOffers: () => {
        const { selectedProduct } = get();
        if (selectedProduct) {
          const offers = generateDynamicOffers(selectedProduct);
          set({ availableOffers: offers });
        }
      },

      calculateEMIForOffer: (offer) => {
        const { selectedProduct } = get();
        if (!selectedProduct) {
          return {
            principal: 0,
            tenureMonths: offer.termMonths,
            interestRate: offer.interestRateValue,
            monthlyEMI: offer.monthlyPaymentValue,
            totalInterest: offer.totalInterest,
            totalPayable: offer.totalPayable,
            downpayment: offer.downpayment,
            processingFee: offer.processingFee
          };
        }

        const principal = selectedProduct.price - offer.downpayment;
        const monthlyEMI = calculateEMI(principal, offer.termMonths, offer.interestRateValue);
        const totalPayable = monthlyEMI * offer.termMonths + offer.downpayment + offer.processingFee;
        const totalInterest = monthlyEMI * offer.termMonths - principal;

        return {
          principal,
          tenureMonths: offer.termMonths,
          interestRate: offer.interestRateValue,
          monthlyEMI,
          totalInterest,
          totalPayable,
          downpayment: offer.downpayment,
          processingFee: offer.processingFee
        };
      },

      setStep: (step) => set({ currentStep: step }),

      completeCKYC: () => set({ ckycVerified: true }),

      completeMandate: () => set({ mandateSetup: true }),

      approveLoan: () => set({ loanApproved: true }),

      disburseLoan: () => set({ loanDisbursed: true }),

      resetLoan: () => set({
        selectedProduct: null,
        selectedOffer: null,
        userFormData: { ...initialUserFormData },
        currentStep: 'product-selection',
        ckycVerified: false,
        mandateSetup: false,
        loanApproved: false,
        loanDisbursed: false,
        availableOffers: [],
        emiCalculation: null
      }),

      goToNextStep: () => {
        const { currentStep } = get();
        const currentIndex = LOAN_STEP_ORDER.indexOf(currentStep);
        if (currentIndex < LOAN_STEP_ORDER.length - 1) {
          set({ currentStep: LOAN_STEP_ORDER[currentIndex + 1] });
        }
      },

      goToPreviousStep: () => {
        const { currentStep } = get();
        const currentIndex = LOAN_STEP_ORDER.indexOf(currentStep);
        if (currentIndex > 0) {
          set({ currentStep: LOAN_STEP_ORDER[currentIndex - 1] });
        }
      }
    }),
    {
      name: 'loan-storage',
      partialize: (state) => ({
        selectedProduct: state.selectedProduct,
        selectedOffer: state.selectedOffer,
        userFormData: state.userFormData,
        currentStep: state.currentStep,
        ckycVerified: state.ckycVerified,
        mandateSetup: state.mandateSetup,
        loanApproved: state.loanApproved,
        loanDisbursed: state.loanDisbursed,
        availableOffers: state.availableOffers,
        emiCalculation: state.emiCalculation
      })
    }
  )
);

// Selectors
export const useSelectedProduct = () => useLoanStore((state) => state.selectedProduct);
export const useSelectedOffer = () => useLoanStore((state) => state.selectedOffer);
export const useCurrentStep = () => useLoanStore((state) => state.currentStep);
export const useAvailableOffers = () => useLoanStore((state) => state.availableOffers);
export const useEMICalculation = () => useLoanStore((state) => state.emiCalculation);
export const useUserFormData = () => useLoanStore((state) => state.userFormData);
export const useLoanProgress = () => useLoanStore((state) => ({
  ckycVerified: state.ckycVerified,
  mandateSetup: state.mandateSetup,
  loanApproved: state.loanApproved,
  loanDisbursed: state.loanDisbursed
}));

// Actions
export const useLoanActions = () => useLoanStore((state) => ({
  selectProduct: state.selectProduct,
  selectOffer: state.selectOffer,
  updateUserFormData: state.updateUserFormData,
  generateOffers: state.generateOffers,
  setStep: state.setStep,
  completeCKYC: state.completeCKYC,
  completeMandate: state.completeMandate,
  approveLoan: state.approveLoan,
  disburseLoan: state.disburseLoan,
  resetLoan: state.resetLoan,
  goToNextStep: state.goToNextStep,
  goToPreviousStep: state.goToPreviousStep
}));
