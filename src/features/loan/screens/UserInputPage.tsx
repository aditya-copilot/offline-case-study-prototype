import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Shield,
  Lock,
  BadgeCheck
} from 'lucide-react';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader } from '@components/ui/Card';
import { useLoanStore, useSelectedProduct, useLoanActions, useUserFormData } from '@features/loan/store';
import { useHaptic } from '@hooks/useHaptic';

export function UserInputPage() {
  const navigate = useNavigate();
  const selectedProduct = useSelectedProduct();
  const userFormData = useUserFormData();
  const { setStep, updateUserFormData } = useLoanActions();
  const { vibrate } = useHaptic();
  
  const [formData, setFormData] = useState({
    name: userFormData.name || '',
    email: userFormData.email || '',
    phone: userFormData.phone || '',
    address: userFormData.address || '',
    panNumber: userFormData.panNumber || '',
    dob: userFormData.dob || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!selectedProduct) {
      navigate('/vehicles');
      return;
    }
    setStep('user-input');
  }, [selectedProduct, navigate, setStep]);

  const validateName = (value: string) => {
    if (!value.trim()) return 'Full name is required';
    if (value.trim().length < 3) return 'Enter a valid full name (min 3 characters)';
    return '';
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    return '';
  };

  const validatePhone = (value: string) => {
    if (!value.trim()) return 'Phone number is required';
    if (!/^[6-9]\d{9}$/.test(value)) return 'Enter a valid 10-digit mobile number starting with 6-9';
    return '';
  };

  const validatePAN = (value: string) => {
    if (!value.trim()) return 'PAN number is required';
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.toUpperCase())) return 'Enter a valid PAN (e.g. ABCDE1234F)';
    return '';
  };

  const validateDOB = (value: string) => {
    if (!value) return 'Date of birth is required';
    const today = new Date();
    const birth = new Date(value);
    const age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    const actualAge = m < 0 || (m === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
    if (actualAge < 18) return 'You must be at least 18 years old';
    if (actualAge > 75) return 'Age must be 75 years or less';
    return '';
  };

  const validateAddress = (value: string) => {
    if (!value.trim()) return 'Address is required';
    if (value.trim().length < 10) return 'Please enter a complete address (min 10 characters)';
    return '';
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'panNumber':
        return validatePAN(value);
      case 'dob':
        return validateDOB(value);
      case 'address':
        return validateAddress(value);
      default:
        return '';
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, formData[name as keyof typeof formData]) }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      vibrate('success');
      updateUserFormData({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        panNumber: formData.panNumber.toUpperCase().trim(),
        dob: formData.dob,
      });
      navigate('/loan/offers');
    } else {
      vibrate('error');
    }
  };

  const getMaxDOB = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  };

  const getMinDOB = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 75);
    return d.toISOString().split('T')[0];
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  const isFormValid = () => {
    return Object.keys(formData).every(key => !validateField(key, formData[key as keyof typeof formData])) &&
           Object.values(formData).every(value => value.trim() !== '');
  };

  if (!selectedProduct) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-2xl mx-auto">
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
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Personal Details</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-accent" />
            <CardHeader className="text-center pb-2">
              <h3 className="font-semibold text-lg">Enter Your Details</h3>
              <p className="text-sm text-muted-foreground">
                Please provide your personal information to proceed with the loan application
              </p>
              <div className="flex items-center justify-center gap-4 mt-4 py-3 px-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">RBI Regulated</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">256-bit Encrypted</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                  <span className="font-medium">Verified Lenders</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <div className="flex-1">
                  <h4 className="font-medium">{selectedProduct.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    ₹{selectedProduct.price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Personal Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      placeholder="Enter your full name"
                      aria-required="true"
                      aria-invalid={touched.name && !!errors.name}
                      aria-describedby={touched.name && errors.name ? "name-error" : undefined}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border-2 bg-background transition-colors",
                        touched.name && errors.name 
                          ? "border-destructive focus:border-destructive" 
                          : "border-border focus:border-primary"
                      )}
                    />
                    {touched.name && errors.name && (
                      <p id="name-error" className="text-xs text-destructive" role="alert">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="your@email.com"
                      aria-required="true"
                      aria-invalid={touched.email && !!errors.email}
                      aria-describedby={touched.email && errors.email ? "email-error" : undefined}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border-2 bg-background transition-colors",
                        touched.email && errors.email 
                          ? "border-destructive focus:border-destructive" 
                          : "border-border focus:border-primary"
                      )}
                    />
                    {touched.email && errors.email && (
                      <p id="email-error" className="text-xs text-destructive" role="alert">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      Phone Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                      onBlur={() => handleBlur('phone')}
                      placeholder="10-digit mobile number"
                      aria-required="true"
                      aria-invalid={touched.phone && !!errors.phone}
                      aria-describedby={touched.phone && errors.phone ? "phone-error" : undefined}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border-2 bg-background transition-colors",
                        touched.phone && errors.phone 
                          ? "border-destructive focus:border-destructive" 
                          : "border-border focus:border-primary"
                      )}
                    />
                    {touched.phone && errors.phone && (
                      <p id="phone-error" className="text-xs text-destructive" role="alert">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="pan" className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      PAN Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="pan"
                      name="pan"
                      type="text"
                      value={formData.panNumber}
                      onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                      onBlur={() => handleBlur('panNumber')}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      aria-required="true"
                      aria-invalid={touched.panNumber && !!errors.panNumber}
                      aria-describedby="pan-hint pan-error"
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border-2 bg-background transition-colors uppercase",
                        touched.panNumber && errors.panNumber 
                          ? "border-destructive focus:border-destructive" 
                          : "border-border focus:border-primary"
                      )}
                    />
                    {touched.panNumber && errors.panNumber ? (
                      <p id="pan-error" className="text-xs text-destructive" role="alert">{errors.panNumber}</p>
                    ) : (
                      <p id="pan-hint" className="text-xs text-muted-foreground">
                        Required for RBI-mandated KYC verification
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="dob" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    Date of Birth <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    onBlur={() => handleBlur('dob')}
                    min={getMinDOB()}
                    max={getMaxDOB()}
                    aria-required="true"
                    aria-invalid={touched.dob && !!errors.dob}
                    aria-describedby="dob-hint dob-error"
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border-2 bg-background transition-colors",
                      touched.dob && errors.dob 
                        ? "border-destructive focus:border-destructive" 
                        : "border-border focus:border-primary"
                    )}
                  />
                  {touched.dob && errors.dob && (
                    <p id="dob-error" className="text-xs text-destructive" role="alert">{errors.dob}</p>
                  )}
                  <p id="dob-hint" className="text-xs text-muted-foreground">
                    You must be between 18 and 75 years old
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    Address <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    onBlur={() => handleBlur('address')}
                    placeholder="Enter your complete address"
                    rows={3}
                    aria-required="true"
                    aria-invalid={touched.address && !!errors.address}
                    aria-describedby={touched.address && errors.address ? "address-error" : undefined}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border-2 bg-background transition-colors resize-none",
                      touched.address && errors.address 
                        ? "border-destructive focus:border-destructive" 
                        : "border-border focus:border-primary"
                    )}
                  />
                  {touched.address && errors.address && (
                    <p id="address-error" className="text-xs text-destructive" role="alert">{errors.address}</p>
                  )}
                </div>
              </div>

              <Button 
                className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-primary/25 mt-6"
                disabled={!isFormValid()}
                onClick={handleSubmit}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Continue to Offers
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
