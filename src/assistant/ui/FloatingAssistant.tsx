import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Mic, Camera, MessageSquare } from 'lucide-react';
import { cn } from '@core/utils';
import { AssistantChat } from './AssistantChat';
import { VoiceInterface } from './VoiceInterface';
import { ScanInterface } from './ScanInterface';
import { useAssistant } from '../hooks/useAssistant';
import type { AssistantMode } from '../types';

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('text');
  const [showPulse, setShowPulse] = useState(true);
  const { 
    messages, 
    isProcessing, 
    sendMessage, 
    lastRecommendation,
    openCompare 
  } = useAssistant();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulse(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !isOpen) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isOpen]);

  const handleModeChange = (newMode: AssistantMode) => {
    setMode(newMode);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showPulse && !isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-primary/50"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{
                    scale: [1, 2.5, 3],
                    opacity: [0.8, 0.3, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: 'easeOut',
                  }}
                  style={{
                    width: 56,
                    height: 56,
                    left: -4,
                    top: -4,
                  }}
                />
              ))}
              
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  width: 56,
                  height: 56,
                  left: -4,
                  top: -4,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setShowPulse(false);
          }
        }}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg shadow-primary/30',
          'flex items-center justify-center transition-all duration-300',
          'bg-gradient-to-br from-primary to-primary/80 hover:shadow-xl hover:shadow-primary/40',
          isOpen && 'bg-destructive hover:bg-destructive/90'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-primary-foreground" />
          ) : (
            <Bot className="w-6 h-6 text-primary-foreground" />
          )}
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && !isExpanded && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 flex flex-col gap-2"
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {[
              { mode: 'text' as AssistantMode, icon: MessageSquare, label: 'Chat' },
              { mode: 'voice' as AssistantMode, icon: Mic, label: 'Voice' },
              { mode: 'scan' as AssistantMode, icon: Camera, label: 'Scan' },
            ].map((item, index) => (
              <motion.button
                key={item.mode}
                onClick={() => handleModeChange(item.mode)}
                className="flex items-center gap-3 px-4 py-2 rounded-full bg-card border shadow-lg hover:bg-accent transition-colors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && isExpanded && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-card border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Bot className="w-5 h-5 text-primary" />
                    {isProcessing && (
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <span className="font-semibold text-sm">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                  {(['text', 'voice', 'scan'] as AssistantMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        mode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      )}
                    >
                      {m === 'text' && <MessageSquare className="w-3.5 h-3.5" />}
                      {m === 'voice' && <Mic className="w-3.5 h-3.5" />}
                      {m === 'scan' && <Camera className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 hover:bg-muted rounded-lg ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="h-[450px] max-h-[60vh]">
                {mode === 'text' && (
                  <AssistantChat
                    messages={messages}
                    isProcessing={isProcessing}
                    lastRecommendation={lastRecommendation}
                    onSend={sendMessage}
                    onOpenCompare={openCompare}
                  />
                )}
                {mode === 'voice' && <VoiceInterface />}
                {mode === 'scan' && <ScanInterface />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
