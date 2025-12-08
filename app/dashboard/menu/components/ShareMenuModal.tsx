'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { Copy, ExternalLink, X, Download, Share2, ScanLine, Smartphone, Building2, MapPin } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ShareMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName?: string;
  properties?: any[];
}

export default function ShareMenuModal({ isOpen, onClose, hotelId, hotelName, properties = [] }: ShareMenuModalProps) {
  const [copied, setCopied] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState(hotelId);
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Reset state when opening
      setSelectedPropertyId(hotelId);
      setRoomNumber('');
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, hotelId]);

  if (!isOpen) return null;
  
  // Resolve current property details
  const currentProperty = properties.find(p => p.id === selectedPropertyId) || { name: hotelName, id: hotelId };
  const currentHotelId = currentProperty.id;
  const currentHotelName = currentProperty.name;

  if (!currentHotelId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
         <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-400 mb-4">Loading property details...</p>
            <button onClick={onClose} className="text-white hover:underline">Close</button>
         </div>
      </div>
    );
  }

  // Point to the dedicated public menu page: /menu/[propertyId]
  // Append room number query param if present
  const menuUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/menu/${currentHotelId}${roomNumber ? `?room=${encodeURIComponent(roomNumber)}` : ''}` 
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // 1. Setup Canvas (A5 size @ 300dpi approx 1748 x 2480, let's do 1200x1800 for manageable file size)
    const canvas = document.createElement('canvas');
    const WIDTH = 1200;
    const HEIGHT = 1800;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 2. Background (Dark Theme: Slate 950 -> #020617)
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, '#0f172a'); // Slate 900
    gradient.addColorStop(1, '#020617'); // Slate 950
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Decorative Pink/Purple glow top
    const topGlow = ctx.createLinearGradient(0, 0, 0, 600);
    topGlow.addColorStop(0, 'rgba(236, 72, 153, 0.15)'); // Pink 500
    topGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, WIDTH, 600);

    // 3. Text Configuration
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    // Room Number (Top)
    if (roomNumber) {
        // Draw a pill background behind room number for emphasis
        ctx.fillStyle = '#fce7f3'; // Pink 100
        const roomText = `ROOM ${roomNumber}`;
        ctx.font = 'bold 60px sans-serif';
        const textWidth = ctx.measureText(roomText).width;
        const padding = 40;
        const pillWidth = textWidth + (padding * 2);
        const pillHeight = 100;
        const pillX = (WIDTH - pillWidth) / 2;
        const pillY = 150;
        
        // Draw Pill
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 50);
        ctx.fill();

        ctx.fillStyle = '#db2777'; // Pink 600
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(roomText, WIDTH / 2, pillY + (pillHeight/2) + 4);
        
        // Reset text baseline
        ctx.textBaseline = 'alphabetic';
        
        // Reset fill style for subsequent text
        ctx.fillStyle = '#ffffff';
    }

    // Hotel Name
    ctx.font = 'bold 90px sans-serif';
    ctx.fillText(currentHotelName || 'Digital Menu', WIDTH / 2, 350);

    // Subtitle
    ctx.font = '500 40px sans-serif';
    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.letterSpacing = '10px';
    ctx.fillText('FOOD DELIVERED TO YOUR ROOM', WIDTH / 2, 450);

    // 4. Draw QR Code
    const sourceCanvas = qrRef.current?.querySelector('canvas');
    if (sourceCanvas) {
        // Draw a white card container for QR
        const cardSize = 800;
        const cardX = (WIDTH - cardSize) / 2;
        const cardY = 550;
        
        ctx.shadowColor = 'rgba(236, 72, 153, 0.2)'; // Pink shadow
        ctx.shadowBlur = 100;
        ctx.fillStyle = '#ffffff';
        
        // Draw rounded rect manually
        const r = 60;
        ctx.beginPath();
        ctx.moveTo(cardX + r, cardY);
        ctx.lineTo(cardX + cardSize - r, cardY);
        ctx.quadraticCurveTo(cardX + cardSize, cardY, cardX + cardSize, cardY + r);
        ctx.lineTo(cardX + cardSize, cardY + cardSize - r);
        ctx.quadraticCurveTo(cardX + cardSize, cardY + cardSize, cardX + cardSize - r, cardY + cardSize);
        ctx.lineTo(cardX + r, cardY + cardSize);
        ctx.quadraticCurveTo(cardX, cardY + cardSize, cardX, cardY + cardSize - r);
        ctx.lineTo(cardX, cardY + r);
        ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset shadow

        // Draw QR centered in card
        const qrSize = 600;
        const qrX = cardX + (cardSize - qrSize) / 2;
        const qrY = cardY + (cardSize - qrSize) / 2;
        
        ctx.drawImage(sourceCanvas, qrX, qrY, qrSize, qrSize);

        // Draw Center Overlay (Scan Icon)
        const overlaySize = 140;
        const cx = qrX + qrSize / 2;
        const cy = qrY + qrSize / 2;

        // White outer circle
        ctx.beginPath();
        ctx.arc(cx, cy, overlaySize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;

        // Black inner circle
        ctx.beginPath();
        ctx.arc(cx, cy, (overlaySize - 10) / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Scan Icon (White)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const iconSize = 50; // Half-size relative to center
        const cornerLen = 15;

        // Center Dash
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx + 10, cy);
        ctx.stroke();

        // Top Left Corner
        ctx.beginPath();
        ctx.moveTo(cx - iconSize / 2, cy - iconSize / 2 + cornerLen);
        ctx.lineTo(cx - iconSize / 2, cy - iconSize / 2);
        ctx.lineTo(cx - iconSize / 2 + cornerLen, cy - iconSize / 2);
        ctx.stroke();

        // Top Right Corner
        ctx.beginPath();
        ctx.moveTo(cx + iconSize / 2 - cornerLen, cy - iconSize / 2);
        ctx.lineTo(cx + iconSize / 2, cy - iconSize / 2);
        ctx.lineTo(cx + iconSize / 2, cy - iconSize / 2 + cornerLen);
        ctx.stroke();

        // Bottom Right Corner
        ctx.beginPath();
        ctx.moveTo(cx + iconSize / 2, cy + iconSize / 2 - cornerLen);
        ctx.lineTo(cx + iconSize / 2, cy + iconSize / 2);
        ctx.lineTo(cx + iconSize / 2 - cornerLen, cy + iconSize / 2);
        ctx.stroke();

        // Bottom Left Corner
        ctx.beginPath();
        ctx.moveTo(cx - iconSize / 2 + cornerLen, cy + iconSize / 2);
        ctx.lineTo(cx - iconSize / 2, cy + iconSize / 2);
        ctx.lineTo(cx - iconSize / 2, cy + iconSize / 2 - cornerLen);
        ctx.stroke();
    }

    // 5. Footer Instructions
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 70px sans-serif';
    ctx.fillText('Scan to Order', WIDTH / 2, 1530);

    ctx.fillStyle = '#cbd5e1'; // Slate 300
    ctx.font = '40px sans-serif';
    ctx.fillText('Open Camera & Scan QR Code', WIDTH / 2, 1610);
    
    // Powered By
    ctx.fillStyle = '#475569'; // Slate 600
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('POWERED BY ZAMORA', WIDTH / 2, 1720);

    // 6. Download
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-flyer-${currentHotelId}${roomNumber ? `-room-${roomNumber}` : ''}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-sm bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden flex flex-col items-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Futuristic Header Graphic */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X size={18} />
        </button>

        <div className="pt-12 pb-8 px-8 flex flex-col items-center w-full relative z-0">
          
          {/* Badge */}
          <div className="mb-6 flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold uppercase tracking-widest">
            <Smartphone size={12} />
            <span>Touchless Menu</span>
          </div>

          {/* Hotel Name */}
          <h2 className="text-2xl font-black text-white tracking-tight text-center mb-1">
            {hotelName || 'Menu'}
          </h2>
          <p className="text-slate-500 text-sm font-medium mb-6 text-center max-w-[200px]">
            Scan to view our digital menu & order
          </p>

          {/* Configuration Controls */}
          <div className="w-full mb-8 space-y-3 px-2">
              {/* Property Selector */}
              {properties && properties.length > 1 && (
                  <div className="relative group">
                      <Building2 className="absolute left-3 top-2.5 text-slate-500 group-hover:text-pink-400 transition-colors" size={16} />
                      <select 
                          value={selectedPropertyId}
                          onChange={(e) => setSelectedPropertyId(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm focus:ring-1 focus:ring-pink-500 focus:border-pink-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                      >
                          {properties.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </select>
                      {/* Custom Arrow */}
                      <div className="absolute right-3 top-3 pointer-events-none">
                          <div className="border-t-[4px] border-t-slate-500 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent" />
                      </div>
                  </div>
              )}

              {/* Room Number Input */}
              <div className="relative group">
                  <MapPin className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-pink-400 transition-colors" size={16} />
                  <input 
                      type="text"
                      placeholder="Room Number (Optional)"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm focus:ring-1 focus:ring-pink-500 focus:border-pink-500 outline-none placeholder:text-slate-600 hover:bg-slate-800 transition-colors"
                  />
              </div>
          </div>

          {/* QR Container */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-[1.7rem] opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* White Card */}
            <div 
              ref={qrRef}
              className="relative bg-white p-5 rounded-[1.5rem] shadow-2xl"
            >
              <div className="relative">
                 <QRCodeCanvas 
                    value={menuUrl} 
                    size={200}
                    level="H"
                    includeMargin={false}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                  {/* Center Logo/Icon Overlay (Optional) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 shadow-lg">
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-white">
                            <ScanLine size={20} />
                        </div>
                     </div>
                  </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-10 w-full space-y-3">
             <button 
                onClick={handleDownload}
                className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors shadow-lg shadow-pink-500/10 active:scale-[0.98]"
             >
                <Download size={16} /> Download Printable Card
             </button>

             <div className="flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="flex-1 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-white transition-colors active:scale-[0.98] group"
                >
                  <Copy size={14} className="group-hover:text-pink-400 transition-colors" /> 
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <a 
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-white transition-colors active:scale-[0.98] group"
                >
                  <ExternalLink size={14} className="group-hover:text-pink-400 transition-colors" /> Open Menu
                </a>
             </div>
          </div>

          <div className="mt-8 text-[10px] text-slate-600 font-medium uppercase tracking-widest">
            Powered by Zamora
          </div>

        </div>
      </div>
    </div>
  );
}
