import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  ChevronDown,
  MessageCircle,
  Book,
  Video,
  Mail
} from 'lucide-react';

import { cn } from '@core/utils';
import { Card, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';

const faqs = [
  {
    question: 'How does BLE zone detection work?',
    answer:
      'The app uses Bluetooth Low Energy (BLE) beacons placed throughout the store. When your device detects these beacons, it calculates your approximate location based on signal strength (RSSI) and triangulation between multiple beacons.'
  },
  {
    question: 'Do I need internet to use the app?',
    answer:
      'No! This app is designed to work completely offline. All product data, store maps, and your shopping lists are stored locally on your device. You only need internet for initial setup and updates.'
  },
  {
    question: 'How do I optimize my shopping route?',
    answer:
      'Go to your shopping list and tap the "Optimize" button. The app will reorder your items based on store layout to minimize walking distance and time.'
  },
  {
    question: 'Can I scan products to add them?',
    answer:
      'Yes! Use the Scan tab to scan product barcodes. The app will automatically look up the product and add it to your list.'
  },
  {
    question: 'What happens to my data?',
    answer:
      'All your data is stored locally on your device using secure browser storage. We do not collect or transmit any personal information.'
  }
];

const resources = [
  { icon: Book, label: 'User Guide', description: 'Complete documentation' },
  { icon: Video, label: 'Video Tutorials', description: 'Step-by-step guides' },
  { icon: MessageCircle, label: 'Community', description: 'Join the discussion' }
];

export function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Help Center</h1>
        <p className="text-muted-foreground">
          Find answers and get support
        </p>
      </div>

      <div className="grid gap-3">
        {resources.map((resource) => (
          <Card
            key={resource.label}
            className="cursor-pointer hover:border-primary/50 transition-colors"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <resource.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{resource.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {resource.description}
                </p>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                <span className="font-medium pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0 pb-4 text-muted-foreground">
                      {faq.answer}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-200">
        <CardContent className="p-6 text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h3 className="text-lg font-semibold mb-1">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our support team is here to assist you
          </p>
          <Button>
            <Mail className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
