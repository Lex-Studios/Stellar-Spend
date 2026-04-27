'use client';

import { useState, useRef } from 'react';
import { QRCodeData } from '@/types/qrcode';
import { qrCodeService } from '@/lib/services/qrcode-service';

interface QRScannerProps {
  onScan: (data: QRCodeData) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target?.result as string;
        // Try to parse as base64 QR data
        const data = qrCodeService.parseQRData(content);

        if (data) {
          onScan(data);
        } else {
          const err = 'Invalid QR code format';
          setError(err);
          onError?.(err);
        }
      };

      reader.readAsText(file);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to scan QR code';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    try {
      const text = event.clipboardData.getData('text');
      const data = qrCodeService.parseQRData(text);

      if (data) {
        onScan(data);
      } else {
        const err = 'Invalid QR code data in clipboard';
        setError(err);
        onError?.(err);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to parse clipboard data';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  return (
    <div
      onPaste={handlePaste}
      className="space-y-4 p-4 border-2 border-dashed rounded-lg bg-gray-50"
    >
      <div>
        <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
        <p className="text-sm text-gray-600">
          Upload a QR code image or paste QR data from clipboard
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Upload QR Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="text-center text-sm text-gray-600">
        or paste QR data here (Ctrl+V / Cmd+V)
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="text-xs text-gray-500 bg-white p-3 rounded border">
        <p className="font-semibold mb-1">Supported formats:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>QR code images (PNG, JPG, SVG)</li>
          <li>Base64 encoded QR data</li>
          <li>Transaction QR codes from Stellar-Spend</li>
        </ul>
      </div>
    </div>
  );
}
