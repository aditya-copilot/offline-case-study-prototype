import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader } from '@components/ui/Card';
import { useLoanStore, useSelectedOffer, useLoanActions } from '@features/loan/store';

export function InvoicePage() {
  const navigate = useNavigate();
  const selectedOffer = useSelectedOffer();
  const { setStep } = useLoanActions();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'upload' | 'verify' | 'verified'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedOffer) {
      navigate('/loan/offers');
      return;
    }
    setStep('approved');
  }, [selectedOffer, navigate, setStep]);

  useEffect(() => {
    if (status === 'verified') {
      const timer = setTimeout(() => {
        navigate('/loan/disbursed');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('verify');
    
    setTimeout(() => {
      setStatus('verified');
    }, 3000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  if (!selectedOffer) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button 
            onClick={() => navigate('/loan/approved')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Approval
          </button>
          
          <h1 className="text-3xl font-bold mb-2">Upload Invoice</h1>
          <p className="text-muted-foreground">
            Upload your vehicle purchase invoice for loan disbursement
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Upload Invoice</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or click to select file
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                      isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">
                      {isDragging ? 'Drop file here' : 'Click to browse'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG up to 5MB
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Loan Amount</span>
                      <span className="font-medium">{selectedOffer.amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly EMI</span>
                      <span className="font-medium">{selectedOffer.monthlyPayment}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <FileText className="w-4 h-4" />
                    <span>Invoice will be verified within 24 hours</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {status === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="relative w-24 h-32 mx-auto mb-6 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    <FileText className="w-10 h-10 text-muted-foreground" />
                    <motion.div
                      className="absolute inset-x-0 h-0.5 bg-primary shadow-lg"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">Verifying Invoice</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {file?.name}
                  </p>
                  
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {status === 'verified' && (
            <motion.div
              key="verified"
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
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-emerald-800 mb-2">
                    Invoice Verified!
                  </h3>
                  <p className="text-emerald-700">
                    Your invoice has been approved. Redirecting to disbursement...
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
