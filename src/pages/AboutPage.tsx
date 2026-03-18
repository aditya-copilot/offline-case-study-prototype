import { motion } from 'framer-motion';
import {
  MapPin,
  Heart,
  Github,
  Twitter,
  Globe,
  Zap,
  Shield,
  Users
} from 'lucide-react';

import { APP_NAME, APP_VERSION } from '@core/constants';
import { Card, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';

const features = [
  {
    icon: Zap,
    title: 'Offline First',
    description: 'Works without internet connection'
  },
  {
    icon: Shield,
    title: 'Privacy Focused',
    description: 'Your data stays on your device'
  },
  {
    icon: MapPin,
    title: 'Precise Navigation',
    description: 'BLE-based indoor positioning'
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Built with user feedback'
  }
];

export function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <MapPin className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="text-muted-foreground">Version {APP_VERSION}</p>
      </div>

      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground leading-relaxed">
            {APP_NAME} is an innovative indoor navigation solution designed to
            make shopping faster and more efficient. Using cutting-edge BLE
            technology, we help you navigate complex store layouts with ease.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-4 text-center">
                <feature.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-primary-500 to-accent-500 text-white border-0">
        <CardContent className="p-6 text-center">
          <Heart className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <h3 className="font-semibold mb-1">Made with Love</h3>
          <p className="text-sm opacity-90">
            Built for the hackathon community. Special thanks to all contributors
            and early adopters.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="outline" size="icon">
          <Github className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Twitter className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Globe className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </p>
    </div>
  );
}
