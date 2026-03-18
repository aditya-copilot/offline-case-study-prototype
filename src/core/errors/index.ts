import type { AppError } from '../types';
import { ERROR_MESSAGES } from '../constants';

export class AppException extends Error {
  public readonly type: AppError['type'];
  public readonly retryable: boolean;
  public readonly code: string;
  public readonly timestamp: number;

  constructor(
    type: AppError['type'],
    message: string,
    retryable: boolean = false,
    code: string = 'UNKNOWN'
  ) {
    super(message);
    this.name = 'AppException';
    this.type = type;
    this.retryable = retryable;
    this.code = code;
    this.timestamp = Date.now();
  }

  toJSON(): AppError {
    return {
      type: this.type,
      message: this.message,
      retryable: this.retryable
    };
  }
}

export class NetworkException extends AppException {
  constructor(message: string = ERROR_MESSAGES.NETWORK_OFFLINE, retryable = true) {
    super('network', message, retryable, 'NETWORK_ERROR');
    this.name = 'NetworkException';
  }
}

export class StorageException extends AppException {
  constructor(message: string = ERROR_MESSAGES.STORAGE_FULL, retryable = true) {
    super('storage', message, retryable, 'STORAGE_ERROR');
    this.name = 'StorageException';
  }
}

export class BLEException extends AppException {
  constructor(message: string = ERROR_MESSAGES.BLE_NOT_SUPPORTED, retryable = false) {
    super('ble', message, retryable, 'BLE_ERROR');
    this.name = 'BLEException';
  }
}

export class ValidationException extends AppException {
  constructor(message: string) {
    super('validation', message, false, 'VALIDATION_ERROR');
    this.name = 'ValidationException';
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppException) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return {
        type: 'network',
        message: error.message,
        retryable: true
      };
    }

    if (error.name === 'QuotaExceededError' || error.message.includes('storage')) {
      return {
        type: 'storage',
        message: error.message,
        retryable: true
      };
    }

    return {
      type: 'unknown',
      message: error.message,
      retryable: false
    };
  }

  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
    retryable: false
  };
};

export const isRetryableError = (error: unknown): boolean => {
  const appError = handleError(error);
  return appError.retryable;
};

export const getErrorMessage = (error: unknown): string => {
  const appError = handleError(error);
  return appError.message;
};
