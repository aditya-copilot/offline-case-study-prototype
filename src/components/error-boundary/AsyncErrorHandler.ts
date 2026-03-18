import { analyticsBus } from '@analytics/collectors/AnalyticsEventBus';

export interface AsyncErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export class AsyncErrorHandler {
  private static instance: AsyncErrorHandler;
  private errorLog: Array<{ error: Error; context: AsyncErrorContext; timestamp: number }> = [];

  static getInstance(): AsyncErrorHandler {
    if (!AsyncErrorHandler.instance) {
      AsyncErrorHandler.instance = new AsyncErrorHandler();
    }
    return AsyncErrorHandler.instance;
  }

  async handle<T>(
    promise: Promise<T>,
    context: AsyncErrorContext = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const data = await promise;
      return { data, error: null };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logError(err, context);
      return { data: null, error: err };
    }
  }

  private logError(error: Error, context: AsyncErrorContext): void {
    const entry = { error, context, timestamp: Date.now() };
    this.errorLog.push(entry);
    
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    analyticsBus.emit({
      type: 'error',
      timestamp: Date.now(),
      data: {
        message: error.message,
        stack: error.stack,
        component: context.component,
        action: context.action
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.error('[AsyncErrorHandler]', error, context);
    }
  }

  getRecentErrors(count = 10): Array<{ error: Error; context: AsyncErrorContext; timestamp: number }> {
    return this.errorLog.slice(-count);
  }

  clearErrors(): void {
    this.errorLog = [];
  }
}

export const asyncErrorHandler = AsyncErrorHandler.getInstance();

export function safeAsync<T>(
  fn: () => Promise<T>,
  context?: AsyncErrorContext
): Promise<{ data: T | null; error: Error | null }> {
  return asyncErrorHandler.handle(fn(), context);
}

export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: AsyncErrorContext
): (...args: Parameters<T>) => Promise<{ data: Awaited<ReturnType<T>> | null; error: Error | null }> {
  return async (...args: Parameters<T>) => {
    return asyncErrorHandler.handle(fn(...args), context);
  };
}
