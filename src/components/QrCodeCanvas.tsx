import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QrCodeCanvasProps {
  value: string;
}

export default function QrCodeCanvas({ value }: QrCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: 140,
          margin: 1.5,
          color: {
            dark: '#030712',  // slate-950
            light: '#ffffff' // pure white
          }
        },
        (error) => {
          if (error) {
            console.error('QR creation error inside canvas utility:', error);
          }
        }
      );
    }
  }, [value]);

  return (
    <div className="flex justify-center p-1.5 bg-white rounded-lg">
      <canvas ref={canvasRef} className="rounded-md" />
    </div>
  );
}
