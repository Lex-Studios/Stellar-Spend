import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  ErrorType,
  ERROR_STATUS_CODES,
  getEnvironmentConfig,
  isError,
  hasMessage,
} from '@/lib/error-types';

describe('ErrorType enum', () => {
  it('has expected string values', () => {
    expect(ErrorType.VALIDATION).toBe('validation_error');
    expect(ErrorType.NOT_FOUND).toBe('not_found');
    expect(ErrorType.UNAUTHORIZED).toBe('unauthorized');
    expect(ErrorType.FORBIDDEN).toBe('forbidden');
    expect(ErrorType.SERVER_ERROR).toBe('server_error');
    expect(ErrorType.EXTERNAL_SERVICE).toBe('external_service_error');
  });
});

describe('ERROR_STATUS_CODES', () => {
  it('maps each ErrorType to the correct HTTP status code', () => {
    expect(ERROR_STATUS_CODES[ErrorType.VALIDATION]).toBe(400);
    expect(ERROR_STATUS_CODES[ErrorType.NOT_FOUND]).toBe(404);
    expect(ERROR_STATUS_CODES[ErrorType.UNAUTHORIZED]).toBe(401);
    expect(ERROR_STATUS_CODES[ErrorType.FORBIDDEN]).toBe(403);
    expect(ERROR_STATUS_CODES[ErrorType.SERVER_ERROR]).toBe(500);
    expect(ERROR_STATUS_CODES[ErrorType.EXTERNAL_SERVICE]).toBe(502);
  });
});

describe('getEnvironmentConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns isProduction=true in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const config = getEnvironmentConfig();
    expect(config.isProduction).toBe(true);
    expect(config.includeDetails).toBe(false);
    expect(config.includeStackTrace).toBe(false);
    expect(config.logLevel).toBe('error');
  });

  it('returns isProduction=false in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const config = getEnvironmentConfig();
    expect(config.isProduction).toBe(false);
    expect(config.includeDetails).toBe(true);
    expect(config.includeStackTrace).toBe(true);
    expect(config.logLevel).toBe('debug');
  });
});

describe('isError', () => {
  it('returns true for Error instances', () => {
    expect(isError(new Error('test'))).toBe(true);
    expect(isError(new TypeError('type error'))).toBe(true);
    expect(isError(new RangeError('range error'))).toBe(true);
  });

  it('returns false for non-Error values', () => {
    expect(isError('string error')).toBe(false);
    expect(isError(42)).toBe(false);
    expect(isError(null)).toBe(false);
    expect(isError(undefined)).toBe(false);
    expect(isError({ message: 'fake error' })).toBe(false);
  });
});

describe('hasMessage', () => {
  it('returns true for objects with a message property', () => {
    expect(hasMessage({ message: 'hello' })).toBe(true);
    expect(hasMessage(new Error('test'))).toBe(true);
  });

  it('returns false for objects without a message property', () => {
    expect(hasMessage({})).toBe(false);
    expect(hasMessage({ code: 404 })).toBe(false);
  });

  it('returns false for non-objects', () => {
    expect(hasMessage('string')).toBe(false);
    expect(hasMessage(null)).toBe(false);
    expect(hasMessage(undefined)).toBe(false);
    expect(hasMessage(42)).toBe(false);
  });
});
