import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '@/lib/error-handler';
import { ErrorType } from '@/lib/error-types';

describe('ErrorHandler', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('handle method', () => {
    it('should return standard error format with error field', () => {
      const response = ErrorHandler.handle(new Error('Test error'));
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    it('should include message field when available', () => {
      const response = ErrorHandler.handle(new Error('Test message'));
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('message');
      expect(body.message).toBe('Test message');
    });

    it('should include details in development environment', () => {
      process.env.NODE_ENV = 'development';
      
      const response = ErrorHandler.handle(new Error('Test error'));
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('details');
    });

    it('should exclude details in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const response = ErrorHandler.handle(new Error('Test error'));
      const body = JSON.parse(response.body);
      
      expect(body).not.toHaveProperty('details');
    });

    it('should handle string input', () => {
      const response = ErrorHandler.handle('String error');
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(body.message).toBe('String error');
    });

    it('should handle malformed input gracefully', () => {
      const response = ErrorHandler.handle(null);
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });
  });

  describe('validation method', () => {
    it('should return 400 status code', () => {
      const response = ErrorHandler.validation('Invalid field');
      expect(response.status).toBe(400);
    });

    it('should return validation_error type', () => {
      const response = ErrorHandler.validation('Invalid field');
      const body = JSON.parse(response.body);
      
      expect(body.error).toBe(ErrorType.VALIDATION);
    });
  });

  describe('notFound method', () => {
    it('should return 404 status code', () => {
      const response = ErrorHandler.notFound();
      expect(response.status).toBe(404);
    });

    it('should return not_found type', () => {
      const response = ErrorHandler.notFound();
      const body = JSON.parse(response.body);
      
      expect(body.error).toBe(ErrorType.NOT_FOUND);
    });
  });

  describe('unauthorized method', () => {
    it('should return 401 status code', () => {
      const response = ErrorHandler.unauthorized();
      expect(response.status).toBe(401);
    });

    it('should return unauthorized type', () => {
      const response = ErrorHandler.unauthorized();
      const body = JSON.parse(response.body);
      
      expect(body.error).toBe(ErrorType.UNAUTHORIZED);
    });
  });

  describe('serverError method', () => {
    it('should return 500 status code', () => {
      const response = ErrorHandler.serverError();
      expect(response.status).toBe(500);
    });

    it('should return server_error type', () => {
      const response = ErrorHandler.serverError();
      const body = JSON.parse(response.body);
      
      expect(body.error).toBe(ErrorType.SERVER_ERROR);
    });

    it('should use generic message in production', () => {
      process.env.NODE_ENV = 'production';
      
      const response = ErrorHandler.serverError(new Error('Sensitive error'));
      const body = JSON.parse(response.body);
      
      expect(body.message).toBe('Internal server error');
    });

    it('should include actual message in development', () => {
      process.env.NODE_ENV = 'development';
      
      const response = ErrorHandler.serverError(new Error('Detailed error'));
      const body = JSON.parse(response.body);
      
      expect(body.message).toBe('Detailed error');
    });
  });

  describe('security filtering', () => {
    it('should sanitize file paths', () => {
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Error in /path/to/file.ts');
      const response = ErrorHandler.handle(error);
      const body = JSON.parse(response.body);
      
      expect(body.message).toContain('[file]');
      expect(body.message).not.toContain('/path/to/file.ts');
    });

    it('should sanitize connection strings', () => {
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Connection failed: mongodb://user:pass@host/db');
      const response = ErrorHandler.handle(error);
      const body = JSON.parse(response.body);
      
      expect(body.message).toContain('[connection_string]');
      expect(body.message).not.toContain('mongodb://user:pass@host/db');
    });

    it('should sanitize API keys', () => {
      process.env.NODE_ENV = 'development';
      
      const error = new Error('API key abc123def456ghi789jkl012mno345pqr failed');
      const response = ErrorHandler.handle(error);
      const body = JSON.parse(response.body);
      
      expect(body.message).toContain('[api_key]');
      expect(body.message).not.toContain('abc123def456ghi789jkl012mno345pqr');
    });
  });

  describe('JSON parsing validity', () => {
    it('should produce valid JSON that can be parsed', () => {
      const response = ErrorHandler.handle(new Error('Test error'));
      
      expect(() => JSON.parse(response.body)).not.toThrow();
      
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
    });
  });
});