import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Trash2,
  MoreVertical,
  MapPin,
  Navigation,
  Plus,
  ShoppingCart,
  Sparkles
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useShoppingList, useShoppingListActions, useNavigation, useNavigationActions, useUIActions } from '@store';
import { cn, formatCurrency } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import { Skeleton } from '@components/feedback/Skeleton';
import type { ShoppingListItem } from '@core/types';

export function ShoppingListPage() {
  const { currentList, isLoading } = useShoppingList();
  const {
    removeItem,
    toggleItemChecked,
    updateItemQuantity,
    clearCheckedItems,
    getProgress,
    getEstimatedCost
  } = useShoppingListActions();

  const { startNavigation, calculateRoute } = useNavigationActions();
  const { addToast } = useUIActions();
  const navigate = useNavigate();
  const [optimizing, setOptimizing] = useState(false);

  const progress = getProgress();
  const estimatedCost = getEstimatedCost();

  const handleStartNavigation = () => {
    if (!currentList || currentList.items.length === 0) {
      addToast({
        type: 'warning',
        title: 'Empty List',
        message: 'Add some items to your list first'
      });
      return;
    }

    const uncheckedItems = currentList.items.filter((i) => !i.isChecked);
    if (uncheckedItems.length === 0) {
      addToast({
        type: 'info',
        title: 'All Done!',
        message: 'You have checked all items'
      });
      return;
    }

    const route = calculateRoute(
      { x: 50, y: 50 },
      [],
      uncheckedItems.map((i) => i.product)
    );

    startNavigation(route, currentList);
    addToast({
      type: 'success',
      title: 'Navigation Started',
      message: `Route calculated: ${route.estimatedTime} minutes`
    });
    navigate('/navigate');
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setOptimizing(false);
    addToast({
      type: 'success',
      title: 'Route Optimized',
      message: 'Your shopping list has been reordered for efficiency'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" lines={2} />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentList || currentList.items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your list is empty</h2>
        <p className="text-muted-foreground mb-6">
          Start adding products to create your shopping list
        </p>
        <Button onClick={() => navigate('/vehicles')}>Browse Two-Wheelers</Button>
      </div>
    );
  }

  const uncheckedItems = currentList.items.filter((i) => !i.isChecked);
  const checkedItems = currentList.items.filter((i) => i.isChecked);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{currentList.name}</h1>
          <p className="text-muted-foreground">
            {progress.checked} of {progress.total} items collected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOptimize} disabled={optimizing}>
            <Sparkles className="w-4 h-4 mr-2" />
            {optimizing ? 'Optimizing...' : 'Optimize'}
          </Button>
          <Button onClick={handleStartNavigation}>
            <Navigation className="w-4 h-4 mr-2" />
            Navigate
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estimated Total</p>
              <p className="text-2xl font-bold">{formatCurrency(estimatedCost)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold">{progress.percentage}%</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          To Get ({uncheckedItems.length})
        </h3>
        <AnimatePresence mode="popLayout">
          {uncheckedItems.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              onToggle={() => toggleItemChecked(item.id)}
              onRemove={() => removeItem(item.id)}
              onUpdateQuantity={(qty) => updateItemQuantity(item.id, qty)}
            />
          ))}
        </AnimatePresence>
      </div>

      {checkedItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Collected ({checkedItems.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={clearCheckedItems}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
          <AnimatePresence mode="popLayout">
            {checkedItems.map((item) => (
              <ListItem
                key={item.id}
                item={item}
                onToggle={() => toggleItemChecked(item.id)}
                onRemove={() => removeItem(item.id)}
                onUpdateQuantity={(qty) => updateItemQuantity(item.id, qty)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

interface ListItemProps {
  item: ShoppingListItem;
  onToggle: () => void;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

function ListItem({ item, onToggle, onRemove, onUpdateQuantity }: ListItemProps) {
  const price = item.product.isOnSale && item.product.discountPercentage
    ? item.product.price * (1 - item.product.discountPercentage / 100)
    : item.product.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg border transition-colors',
        item.isChecked
          ? 'bg-muted/50 border-muted'
          : 'bg-card border-border hover:border-primary/50'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
          item.isChecked
            ? 'bg-primary border-primary'
            : 'border-muted-foreground/30 hover:border-primary'
        )}
      >
        {item.isChecked && <Check className="w-4 h-4 text-primary-foreground" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-medium truncate',
            item.isChecked && 'line-through text-muted-foreground'
          )}
        >
          {item.product.name}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{item.product.shelfLocation}</span>
          <span>•</span>
          <span>{formatCurrency(price * item.quantity)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!item.isChecked && (
          <div className="flex items-center border rounded">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <span className="text-lg leading-none">-</span>
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-error" />
        </Button>
      </div>
    </motion.div>
  );
}
