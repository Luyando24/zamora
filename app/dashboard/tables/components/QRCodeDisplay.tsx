'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { useRef } from 'react';

interface QRCodeDisplayProps {
  tableNumber: string;
  propertyId: string;
  propertyName?: string;
}

export default function QRCodeDisplay({ tableNumber, propertyId, propertyName }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrValue = `${baseUrl}/menu/${propertyId}?table=${tableNumber}`;

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40; // Add padding
      canvas.height = img.height + 60; // Add padding + text space
      
      if (ctx) {
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 20, 20);
        
        // Draw Text
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(`Table ${tableNumber}`, canvas.width / 2, canvas.height - 20);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR-Table-${tableNumber}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div ref={qrRef} className="bg-white p-2 rounded-lg">
        <QRCodeSVG 
            value={qrValue} 
            size={120}
            level="H"
            includeMargin={true}
        />
      </div>
      <div className="text-center">
        <p className="font-bold text-slate-900 text-sm">Table {tableNumber}</p>
        <p className="text-xs text-slate-500">Scan to Order</p>
      </div>
      <button 
        onClick={downloadQR}
        className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Download size={14} />
        Download
      </button>
    </div>
  );
}
