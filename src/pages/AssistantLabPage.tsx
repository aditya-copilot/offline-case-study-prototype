import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Mic, Camera, Sparkles, MessageSquare, Zap, Brain } from 'lucide-react';
import { cn } from '@core/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { FloatingAssistant, AssistantChat, VoiceInterface, ScanInterface, useAssistant } from '@assistant';
import type { AssistantMode } from '@assistant';

export default function AssistantLabPage() {
  const [activeTab, setActiveTab] = useState<AssistantMode | 'overview'>('overview');
  const { messages, isProcessing, sendMessage } = useAssistant();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'text', label: 'Chat Demo', icon: MessageSquare },
    { id: 'voice', label: 'Voice Demo', icon: Mic },
    { id: 'scan', label: 'Scan Demo', icon: Camera },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            AI Assistant Lab
          </h1>
          <p className="text-muted-foreground">
            Test and explore the AI assistant capabilities
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.id as AssistantMode | 'overview')}
            className="flex items-center gap-2"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Text Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Natural language interaction with vehicle recommendations, comparisons, and specifications.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Vehicle search by criteria
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Price and EMI queries
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Feature explanations
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Comparison assistance
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                Voice Interaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Hands-free voice commands with speech recognition and synthesis.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Push-to-talk mode
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Continuous listening
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Voice responses
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Noise suppression
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Vehicle Scan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Point your camera at any vehicle to identify and get instant information.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  AI-powered recognition
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Works offline
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Real-time overlay
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Feature detection
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Intelligent intent detection and contextual responses.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Intent classification
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Context awareness
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Vehicle matching
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Zone-based personality
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Try these commands:</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Find bikes under 1 lakh</p>
                    <p className="text-muted-foreground">Compare Activa vs Jupiter</p>
                    <p className="text-muted-foreground">Best electric scooters in 2024</p>
                    <p className="text-muted-foreground">What is the mileage of Splendor?</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Features:</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Works completely offline</p>
                    <p className="text-muted-foreground">Remembers conversation context</p>
                    <p className="text-muted-foreground">Shows vehicle cards with actions</p>
                    <p className="text-muted-foreground">Available on all pages</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'text' && (
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)]">
            <AssistantChat
              messages={messages}
              isProcessing={isProcessing}
              onSend={sendMessage}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'voice' && (
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)]">
            <VoiceInterface />
          </CardContent>
        </Card>
      )}

      {activeTab === 'scan' && (
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)] p-0">
            <ScanInterface />
          </CardContent>
        </Card>
      )}

      <FloatingAssistant />
    </div>
  );
}
