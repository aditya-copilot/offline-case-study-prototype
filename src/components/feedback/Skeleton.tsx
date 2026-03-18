import { cn } from '@core/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circle' | 'text' | 'card';
  lines?: number;
}

export function Skeleton({ className, variant = 'default', lines = 1 }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-muted rounded-md';

  if (variant === 'circle') {
    return (
      <div
        className={cn(
          baseClasses,
          'rounded-full',
          className
        )}
      />
    );
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2 w-full">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              'h-4 w-full',
              i === lines - 1 && 'w-3/4',
              className
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('rounded-lg border border-border p-4 space-y-3', className)}>
        <div className={cn(baseClasses, 'h-32 w-full')} />
        <div className={cn(baseClasses, 'h-5 w-3/4')} />
        <div className={cn(baseClasses, 'h-4 w-1/2')} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        className
      )}
    />
  );
}
