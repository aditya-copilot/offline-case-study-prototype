import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Navigation,
  Eye,
  Scale,
  Bike,
  Zap,
  Check,
  Trophy,
  X,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Clock,
  ChevronDown,
  Mic,
  Image as ImageIcon,
  Paperclip,
  Wand2,
  History,
  Trash2,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Settings,
  MessageSquarePlus,
  Wallet
} from 'lucide-react';
import { cn, timeAgo, formatCurrency } from '@core/utils';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader } from '@components/ui/Card';
import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { CompareView } from './CompareView';
import type { AssistantMessage, AssistantAction } from '../types';
import { useLoanActions } from '@features/loan/store';
import { useNavigate } from 'react-router-dom';

interface Recommendation {
  id: string;
  makeName: string;
  modelName: string;
  priceRange: { min: number; max: number };
  matchScore: number;
  matchReasons: string[];
  pros: string[];
  cons: string[];
  imagePath?: string;
  fuelType?: string;
  bodyStyle?: string;
}

interface AssistantChatProps {
  messages: AssistantMessage[];
  isProcessing: boolean;
  lastRecommendation?: {
    vehicles: Recommendation[];
    comparison?: {
      vehicles: string[];
      comparisonPoints: Array<{
        category: string;
        winner: string;
        details: Record<string, string>;
      }>;
    };
  } | null;
  onSend: (text: string) => void;
  onRegenerate?: (messageId: string) => void;
  onClear?: () => void;
  onOpenCompare?: (vehicleIds: string[]) => void;
}

interface MessageReaction {
  type: 'like' | 'dislike';
  timestamp: number;
}

interface MessageWithMeta extends AssistantMessage {
  reactions?: MessageReaction[];
  isCopied?: boolean;
  isRegenerating?: boolean;
}

export function AssistantChat({ 
  messages, 
  isProcessing, 
  lastRecommendation, 
  onSend, 
  onRegenerate,
  onClear,
  onOpenCompare 
}: AssistantChatProps) {
  const navigate = useNavigate();
  const { selectProduct } = useLoanActions();
  const [inputValue, setInputValue] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, MessageReaction[]>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages, isProcessing, scrollToBottom, showScrollButton]);

  const handleSend = () => {
    if (inputValue.trim() && !isProcessing) {
      onSend(inputValue.trim());
      setInputValue('');
      setShowShortcuts(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      setActiveMenuId(null);
    } catch {
      return;
    }
  };

  const handleReaction = (messageId: string, type: 'like' | 'dislike') => {
    setMessageReactions((prev) => {
      const current = prev[messageId] || [];
      const filtered = current.filter((r) => r.type !== type);
      if (filtered.length === current.length) {
        filtered.push({ type, timestamp: Date.now() });
      }
      return { ...prev, [messageId]: filtered };
    });
  };

  const handleRegenerate = (messageId: string) => {
    onRegenerate?.(messageId);
    setActiveMenuId(null);
  };

  const handleAction = (action: AssistantAction) => {
    switch (action.type) {
      case 'navigate':
        if (typeof action.payload === 'string') {
          window.location.href = action.payload;
        }
        break;
      case 'view-details':
        if (typeof action.payload === 'string') {
          window.location.href = action.payload;
        }
        break;
      case 'compare':
        if (typeof action.payload === 'object' && action.payload && 'vehicles' in action.payload) {
          const vehicles = action.payload.vehicles as string[];
          setCompareIds(vehicles);
          setShowCompare(true);
          onOpenCompare?.(vehicles);
        }
        break;
      case 'book-test-ride':
        window.location.href = `/test-ride/${action.payload}`;
        break;
      default:
        break;
    }
  };

  const openCompare = (ids: string[]) => {
    setCompareIds(ids);
    setShowCompare(true);
  };

  const closeCompare = () => {
    setShowCompare(false);
  };

  const getActionIcon = (type: AssistantAction['type']) => {
    switch (type) {
      case 'navigate':
        return <Navigation className="w-3.5 h-3.5" />;
      case 'view-details':
        return <Eye className="w-3.5 h-3.5" />;
      case 'compare':
        return <Scale className="w-3.5 h-3.5" />;
      case 'book-test-ride':
        return <Bike className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  const getMessageIcon = (type: AssistantMessage['type']) => {
    switch (type) {
      case 'vehicle-card':
        return <Bike className="w-4 h-4" />;
      case 'comparison-table':
        return <Scale className="w-4 h-4" />;
      case 'spec-highlight':
        return <Zap className="w-4 h-4" />;
      case 'voice-transcript':
        return <Mic className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const quickActions = [
    { icon: ImageIcon, label: 'Image', action: () => {} },
    { icon: Mic, label: 'Voice', action: () => {} },
    { icon: Wand2, label: 'AI', action: () => {} },
  ];

  const shortcutSuggestions = [
    { icon: Bike, text: 'Best scooters under 80k', query: 'Best scooters under 80000' },
    { icon: Scale, text: 'Compare Activa vs Jupiter', query: 'Compare Activa vs Jupiter' },
    { icon: Zap, text: 'Electric bikes', query: 'Best electric bikes' },
    { icon: Trophy, text: 'Top rated bikes', query: 'Top rated bikes' },
  ];

  const renderRecommendationCards = (recommendation: typeof lastRecommendation) => {
    if (!recommendation || recommendation.vehicles.length === 0) return null;

    return (
      <div className="space-y-3 mt-3">
        {recommendation.vehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              'overflow-hidden transition-all duration-300 hover:shadow-lg',
              index === 0 ? 'border-primary ring-1 ring-primary/20' : 'border-border/50'
            )}> 
              {index === 0 && (
                <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-xs px-3 py-1.5 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="font-medium">Top Recommendation</span>
                  <Sparkles className="w-3 h-3 ml-auto" />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    {vehicle.imagePath ? (
                      <img src={vehicle.imagePath} alt={vehicle.modelName} className="w-full h-full object-cover" />
                    ) : (
                      <Bike className="w-10 h-10 text-muted-foreground/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm leading-tight">{vehicle.makeName} {vehicle.modelName}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency((vehicle.priceRange.min + vehicle.priceRange.max) / 2, 'INR', 'en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <Sparkles className="w-3 h-3" />
                        {Math.round(vehicle.matchScore * 100)}% match
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {vehicle.matchReasons.slice(0, 2).map((reason, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-1 bg-muted/80 rounded-full text-muted-foreground font-medium">
                          {reason}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => window.location.href = `/vehicles/${vehicle.id}`}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        View Details
                      </Button>
                      {recommendation.vehicles.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => openCompare(recommendation.vehicles.slice(0, 3).map((v) => v.id))}
                        >
                          <Scale className="w-3.5 h-3.5 mr-1.5" />
                          Compare
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                        onClick={() => {
                          selectProduct({
                            id: vehicle.id,
                            name: `${vehicle.makeName} ${vehicle.modelName}`,
                            price: Math.round((vehicle.priceRange.min + vehicle.priceRange.max) / 2),
                            image: vehicle.imagePath,
                            brand: vehicle.makeName,
                            category: vehicle.bodyStyle || 'Two Wheeler'
                          });
                          navigate('/loan/user-input');
                        }}
                      >
                        <Wallet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        Check EMI
                      </Button>
                    </div>
                  </div>
                </div>

                {vehicle.pros.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex flex-wrap gap-2">
                      {vehicle.pros.slice(0, 3).map((pro, i) => (
                        <span key={i} className="text-[11px] px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full flex items-center gap-1.5 font-medium border border-emerald-100">
                          <Check className="w-3 h-3" />
                          {pro}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20 relative">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowShortcuts(!showShortcuts)}>
            <History className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
      >
        <div className="p-4 space-y-5">
          <AnimatePresence initial={false}>
            {messages.length === 0 && showShortcuts && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-10"
              >
                <motion.div 
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-xl shadow-primary/10"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Bot className="w-10 h-10 text-primary" />
                </motion.div>
                <h3 className="font-bold text-xl mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">AI Assistant</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">
                  Your personal vehicle expert. Ask me anything about bikes, compare models, or get personalized recommendations.
                </p>
                
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  {shortcutSuggestions.map((item, index) => (
                    <motion.button
                      key={item.text}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => onSend(item.query)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium leading-tight">{item.text}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((message, index) => {
              const reactions = messageReactions[message.id] || [];
              const isLiked = reactions.some((r) => r.type === 'like');
              const isDisliked = reactions.some((r) => r.type === 'dislike');
              const isMenuOpen = activeMenuId === message.id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    'flex gap-3 group',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                        : 'bg-gradient-to-br from-muted to-muted/50'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4.5 h-4.5" />
                    ) : (
                      <Bot className="w-4.5 h-4.5" />
                    )}
                  </div>

                  <div
                    className={cn(
                      'max-w-[85%] space-y-1.5',
                      message.role === 'user' ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-3 shadow-sm transition-all',
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                          : 'bg-card border border-border/50 rounded-bl-md hover:border-border'
                      )}
                    >
                      {getMessageIcon(message.type) && message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground/70">
                          {getMessageIcon(message.type)}
                          <span className="capitalize font-medium">{message.type.replace('-', ' ')}</span>
                        </div>
                      )}

                      <p className={cn(
                        "text-sm leading-relaxed whitespace-pre-wrap",
                        message.role === 'user' ? 'text-primary-foreground' : 'text-foreground'
                      )}>
                        {message.content}
                      </p>

                      {message.metadata?.confidence && message.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] opacity-60">
                          <Sparkles className="w-3 h-3" />
                          <span>{Math.round(message.metadata.confidence * 100)}% confident</span>
                        </div>
                      )}
                    </div>

                    {message.role === 'assistant' && index === messages.length - 1 && lastRecommendation && (
                      renderRecommendationCards(lastRecommendation)
                    )}

                    {message.metadata?.actions && message.metadata.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.metadata.actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs bg-secondary/50 hover:bg-secondary"
                            onClick={() => handleAction(action)}
                          >
                            {getActionIcon(action.type)}
                            <span className="ml-1.5">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                    )}

                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleReaction(message.id, 'like')}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isLiked ? "bg-emerald-100 text-emerald-600" : "hover:bg-muted text-muted-foreground"
                          )}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReaction(message.id, 'dislike')}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isDisliked ? "bg-red-100 text-red-600" : "hover:bg-muted text-muted-foreground"
                          )}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyMessage(message.content, message.id)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            copiedMessageId === message.id ? "bg-emerald-100 text-emerald-600" : "hover:bg-muted text-muted-foreground"
                          )}
                          title="Copy message"
                        >
                          {copiedMessageId === message.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(isMenuOpen ? null : message.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          
                          <AnimatePresence>
                            {isMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                className="absolute left-0 top-full mt-1 bg-card border rounded-lg shadow-xl py-1 min-w-[140px] z-20"
                              >
                                <button
                                  onClick={() => handleRegenerate(message.id)}
                                  className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors text-left"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Regenerate
                                </button>
                                <button
                                  onClick={() => handleCopyMessage(message.content, message.id)}
                                  className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors text-left"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  Copy
                                </button>
                                <button className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors text-left">
                                  <Share2 className="w-3.5 h-3.5" />
                                  Share
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <span className="text-[10px] text-muted-foreground ml-2">
                          {timeAgo(message.timestamp)}
                        </span>
                      </div>
                    )}

                    {message.role === 'user' && (
                      <span className="text-[10px] text-muted-foreground px-1">
                        {timeAgo(message.timestamp)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">AI is thinking...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-card border shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-xs font-medium hover:shadow-xl transition-shadow z-10"
          >
            <ChevronDown className="w-4 h-4" />
            New messages
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t bg-card/80 backdrop-blur-sm p-4 space-y-3">
        {/* Quick Actions */}
        <div className="flex items-center gap-2 px-1">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <action.icon className="w-3.5 h-3.5" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about bikes, compare models, or get recommendations..."
              disabled={isProcessing}
              className="pr-12 h-12 rounded-xl border-border/50 focus:border-primary/50 bg-background/50"
            />
            {inputValue && (
              <button
                onClick={() => setInputValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            size="icon"
            className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
          <span>AI can make mistakes. Please verify important information.</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Response time: ~2s
            </span>
          </div>
        </div>
      </div>

      {/* Compare View Overlay */}
      <AnimatePresence>
        {showCompare && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-background z-50"
          >
            <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm">
              <h3 className="font-semibold flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Compare Vehicles
              </h3>
              <Button variant="ghost" size="icon" onClick={closeCompare}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="h-[calc(100%-70px)]">
              <CompareView
                vehicleIds={compareIds}
                onClose={closeCompare}
                onViewDetails={(id) => window.location.href = `/vehicles/${id}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close menu */}
      {activeMenuId && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setActiveMenuId(null)}
        />
      )}
    </div>
  );
}
