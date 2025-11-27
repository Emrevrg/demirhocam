import React, { useEffect, useRef, useState } from 'react';

interface QRScannerProps {
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
  disableFlip?: boolean;
  verbose?: boolean;
  qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void;
  qrCodeErrorCallback?: (errorMessage: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = (props) => {
  const scannerRegionId = "html5qr-code-full-region";
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if library is loaded
    if (!(window as any).Html5QrcodeScanner) {
        setError("QR Kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.");
        return;
    }

    const config = {
      fps: props.fps || 10,
      qrbox: props.qrbox || 250,
      aspectRatio: props.aspectRatio || 1.0,
      disableFlip: props.disableFlip || false,
    };

    // Helper to create scanner
    const html5QrcodeScanner = new (window as any).Html5QrcodeScanner(
      scannerRegionId,
      config,
      props.verbose || false
    );

    html5QrcodeScanner.render(
      props.qrCodeSuccessCallback,
      props.qrCodeErrorCallback
    );

    // Cleanup
    return () => {
      html5QrcodeScanner.clear().catch((error: any) => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div id={scannerRegionId} className="w-full max-w-md bg-gray-100 rounded-lg overflow-hidden shadow-inner" />
        <p className="mt-4 text-sm text-gray-500 text-center">
            Kameraya QR kodunu gösterin.
        </p>
    </div>
  );
};