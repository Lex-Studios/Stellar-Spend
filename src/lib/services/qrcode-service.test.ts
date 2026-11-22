/**
 * Tests for QRCodeService
 * Covers the generateDownloadableQR method and the removed PNG placeholder.
 */

import { describe, it, expect } from 'vitest';
import { QRCodeService } from './qrcode-service';

const service = new QRCodeService();

const sampleData = {
  transactionId: 'tx_test_001',
  amount: '100.00',
  currency: 'NGN',
  timestamp: 1700000000000,
  status: 'pending' as const,
};

describe('QRCodeService.generateDownloadableQR', () => {
  it('returns a non-empty SVG string for format=svg', () => {
    const result = service.generateDownloadableQR(sampleData, 'svg', 200);
    expect(result).toBeTruthy();
    expect(result).toContain('<svg');
  });

  it('returns SVG by default (no format argument)', () => {
    const result = service.generateDownloadableQR(sampleData);
    expect(result).toContain('<svg');
  });

  it('throws for format=png (not yet implemented — see #1364)', () => {
    expect(() => service.generateDownloadableQR(sampleData, 'png')).toThrow(
      /PNG QR code generation is not yet implemented/,
    );
  });

  it('PNG error message references issue #1364', () => {
    expect(() => service.generateDownloadableQR(sampleData, 'png')).toThrow(/#1364/);
  });
});

describe('QRCodeService.generateQRData', () => {
  it('returns a base64 encoded string', () => {
    const result = service.generateQRData(sampleData);
    expect(() => Buffer.from(result, 'base64').toString('utf-8')).not.toThrow();
  });

  it('round-trips through parseQRData', () => {
    const encoded = service.generateQRData(sampleData);
    const parsed = service.parseQRData(encoded);
    expect(parsed).not.toBeNull();
    expect(parsed!.transactionId).toBe(sampleData.transactionId);
    expect(parsed!.amount).toBe(sampleData.amount);
    expect(parsed!.currency).toBe(sampleData.currency);
  });
});

describe('QRCodeService.parseQRData', () => {
  it('returns null for invalid input', () => {
    expect(service.parseQRData('not-valid-base64!!!')).toBeNull();
  });

  it('returns null for valid base64 that is not JSON', () => {
    const notJson = Buffer.from('hello world').toString('base64');
    expect(service.parseQRData(notJson)).toBeNull();
  });
});
