'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { Copy, ExternalLink, X, Download, Share2, ScanLine, Smartphone, Building2, MapPin, Wifi, UtensilsCrossed } from 'lucide-react';
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
  const [locationType, setLocationType] = useState<'room' | 'table'>('room');
  const [locationValue, setLocationValue] = useState('');
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
      setLocationValue('');
      setLocationType('room');
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
  // Append room/table number query param if present
  const menuUrl = typeof window !== 'undefined' 
    ? (() => {
        const queryParam = locationValue 
            ? (locationType === 'room' ? `?room=${encodeURIComponent(locationValue)}` : `?table=${encodeURIComponent(locationValue)}`)
            : '';
        return `${window.location.origin}/menu/${currentHotelId}${queryParam}`;
    })()
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for rounded rects (polyfill for better compatibility)
  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const handleDownload = async () => {
    // 1. Setup Canvas (A4 size @ 300dpi: 2480 x 3508 px)
    const canvas = document.createElement('canvas');
    const WIDTH = 2480;
    const HEIGHT = 3508;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load Logo if available
    let logoImg: HTMLImageElement | null = null;
    // @ts-ignore
    if (currentProperty.logo_url) {
        try {
            logoImg = new Image();
            logoImg.crossOrigin = "anonymous";
            // @ts-ignore
            logoImg.src = currentProperty.logo_url;
            await new Promise((resolve) => {
                logoImg!.onload = resolve;
                logoImg!.onerror = resolve;
            });
        } catch (e) {
            console.error("Failed to load logo", e);
        }
    }

    // 2. Background (Dark Theme: Slate 950 -> #020617)
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, '#0f172a'); // Slate 900
    gradient.addColorStop(1, '#020617'); // Slate 950
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Decorative Pink/Purple glow top
    const topGlow = ctx.createLinearGradient(0, 0, 0, 1000);
    topGlow.addColorStop(0, 'rgba(236, 72, 153, 0.15)'); // Pink 500
    topGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, WIDTH, 1000);

    // 3. Text Configuration
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    // Room/Table Number (Top)
    if (locationValue) {
        // Draw a pill background behind number for emphasis
        ctx.fillStyle = '#fce7f3'; // Pink 100
        const labelText = locationType === 'room' ? `ROOM ${locationValue}` : `TABLE ${locationValue}`;
        ctx.font = 'bold 100px sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        const padding = 60;
        const pillWidth = textWidth + (padding * 2);
        const pillHeight = 180;
        const pillX = (WIDTH - pillWidth) / 2;
        const pillY = 200;
        
        // Draw Pill
        drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 90);
        ctx.fill();

        ctx.fillStyle = '#db2777'; // Pink 600
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, WIDTH / 2, pillY + (pillHeight/2) + 6);
        
        // Reset text baseline
        ctx.textBaseline = 'alphabetic';
        
        // Reset fill style for subsequent text
        ctx.fillStyle = '#ffffff';
    }

    // Logo (Circular Container & Larger)
    if (logoImg) {
        const logoSize = 400; // Larger size
        const centerX = WIDTH / 2;
        const centerY = cursorY + logoSize / 2;
        const radius = logoSize / 2;
        
        // 1. Draw White Circle Background
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // 2. Draw Logo Centered (Contain)
        // Fit within a slightly smaller box to give padding
        const padding = 40;
        const fitSize = (logoSize - padding * 2);
        
        const aspect = logoImg.width / logoImg.height;
        let lw = fitSize;
        let lh = fitSize;
        
        if (aspect > 1) {
            lh = lw / aspect;
        } else {
            lw = lh * aspect;
        }
        
        // Draw centered
        ctx.drawImage(logoImg, centerX - lw / 2, centerY - lh / 2, lw, lh);
        
        cursorY += logoSize + 50;
    } else {
        // If no logo, add a bit of spacing
        cursorY += 50;
    }

    // Subtitle
    cursorY += 50; // Add some spacing before subtitle
    ctx.font = '500 70px sans-serif';
    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.letterSpacing = '15px';
    
    let subtitleText = 'VIEW FOOD & BAR MENU';
    if (locationValue) {
        subtitleText = locationType === 'room' ? 'FOOD DELIVERED TO YOUR ROOM' : 'ORDER DIRECTLY FROM YOUR TABLE';
    }
    
    ctx.fillText(subtitleText, WIDTH / 2, cursorY);
    
    // Update cursorY for next elements
    cursorY += 100;

    // 4. Draw QR Code
    const sourceCanvas = qrRef.current?.querySelector('canvas');
    if (sourceCanvas) {
        // Draw a white card container for QR
        const cardSize = 1300;
        const cardX = (WIDTH - cardSize) / 2;
        const cardY = cursorY + 50; // Use cursorY
        const r = 100;

        // --- Gradient Glow Effect ---
        // Simulating: bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500
        
        // We use a strong blur to create a glow effect instead of a solid border
        const glowGradient = ctx.createLinearGradient(cardX, cardY + cardSize, cardX + cardSize, cardY);
        glowGradient.addColorStop(0, '#ec4899'); // Pink 500
        glowGradient.addColorStop(0.5, '#a855f7'); // Purple 500
        glowGradient.addColorStop(1, '#6366f1'); // Indigo 500

        ctx.save();
        ctx.filter = 'blur(80px)'; // Strong blur for glow effect
        ctx.fillStyle = glowGradient;
        
        // Draw blurred rect behind (same size as card)
        drawRoundedRect(ctx, cardX, cardY, cardSize, cardSize, r);
        ctx.fill();
        ctx.restore();

        // Draw White Card Inner (Solid, Sharp)
        ctx.fillStyle = '#ffffff';
        drawRoundedRect(ctx, cardX, cardY, cardSize, cardSize, r);
        ctx.fill();

        // Draw QR centered in card
        const qrSize = 1000;
        const qrX = cardX + (cardSize - qrSize) / 2;
        const qrY = cardY + (cardSize - qrSize) / 2;
        
        ctx.drawImage(sourceCanvas, qrX, qrY, qrSize, qrSize);

        // Draw Center Overlay (Scan Icon)
        const overlaySize = 220;
        const cx = qrX + qrSize / 2;
        const cy = qrY + qrSize / 2;

        // White outer circle
        ctx.beginPath();
        ctx.arc(cx, cy, overlaySize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 20;

        // Black inner circle
        ctx.beginPath();
        ctx.arc(cx, cy, (overlaySize - 20) / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Scan Icon (White)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const iconSize = 80; // Half-size relative to center
        const cornerLen = 25;

        // Center Dash
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
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
        
        // Update cursor for next elements
        cursorY = cardY + cardSize;
    }

    // 5. Scan Instructions (Moved UP, below QR)
    const instructionsY = cursorY + 200;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 110px sans-serif';
    ctx.letterSpacing = '0px';
    ctx.fillText('Scan to Order', WIDTH / 2, instructionsY);

    ctx.fillStyle = '#cbd5e1'; // Slate 300
    ctx.font = '60px sans-serif';
    ctx.fillText('Open Camera & Scan QR Code', WIDTH / 2, instructionsY + 100);

    // Link
    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText(`or visit ${menuUrl}`, WIDTH / 2, instructionsY + 220);
    
    // 6. Wifi Info (Restored for Printout)
    // @ts-ignore
    if (currentProperty.wifi_ssid) {
        const wifiY = instructionsY + 700;
        
        // Draw Card Background
        const cardWidth = 1600;
        const cardHeight = 450;
        const cardX = (WIDTH - cardWidth) / 2;
        const cardY = wifiY - 100;
        
        ctx.fillStyle = 'rgba(30, 41, 59, 0.6)'; // Slate 800
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 5;
        
        drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 60);
        ctx.fill();
        ctx.stroke();

        // Title: GUEST WI-FI
        const contentX = cardX + 120;
        const contentY = cardY + 100;
        
        ctx.textAlign = 'left';
        ctx.font = 'bold 60px sans-serif';
        ctx.fillStyle = '#ec4899'; // Pink 500
        ctx.fillText('GUEST WI-FI', contentX, contentY);

        // Network Row
        const row1Y = contentY + 120;
        const valueX = cardX + cardWidth - 120;
        
        ctx.font = '500 70px sans-serif';
        ctx.fillStyle = '#94a3b8'; // Slate 400
        ctx.fillText('Wi-Fi Name', contentX, row1Y);
        
        ctx.textAlign = 'right';
        ctx.font = 'bold 70px monospace'; // Monospace for clear reading
        ctx.fillStyle = '#ffffff';
        // @ts-ignore
        ctx.fillText(currentProperty.wifi_ssid, valueX, row1Y);
        
        // Password Row
        // @ts-ignore
        if (currentProperty.wifi_password) {
            const row2Y = row1Y + 110;
            ctx.textAlign = 'left';
            ctx.font = '500 70px sans-serif';
            ctx.fillStyle = '#94a3b8'; // Slate 400
            ctx.fillText('Password', contentX, row2Y);
            
            ctx.textAlign = 'right';
            ctx.font = 'bold 70px monospace';
            ctx.fillStyle = '#ffffff';
            // @ts-ignore
            ctx.fillText(currentProperty.wifi_password, valueX, row2Y);
        }
        
        // Reset Alignment
        ctx.textAlign = 'center';
    }

    // Powered By
    ctx.fillStyle = '#475569'; // Slate 600
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText('POWERED BY WWW.ZAMORAAPP.COM', WIDTH / 2, HEIGHT - 100);

    // 7. Download
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-flyer-${currentHotelId}${locationValue ? `-${locationType}-${locationValue}` : ''}.png`;
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
                          value={selectedPropertyId || ''}
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

              {/* Location Type Toggle */}
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button 
                      onClick={() => setLocationType('room')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${locationType === 'room' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                      Room
                  </button>
                  <button 
                      onClick={() => setLocationType('table')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${locationType === 'table' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                      Table
                  </button>
              </div>

              {/* Number Input */}
              <div className="relative group">
                  {locationType === 'room' ? (
                      <MapPin className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-pink-400 transition-colors" size={16} />
                  ) : (
                      <UtensilsCrossed className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-pink-400 transition-colors" size={16} />
                  )}
                  <input 
                      type="text"
                      placeholder={locationType === 'room' ? "Room Number (Optional)" : "Table Number (Optional)"}
                      value={locationValue}
                      onChange={(e) => setLocationValue(e.target.value)}
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

          {/* Wifi Info Card */}
          {/* @ts-ignore */}
          {currentProperty.wifi_ssid && (
            <div className="w-full mt-6 mb-2 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Wifi size={14} className="text-pink-500" />
                    <span className="text-pink-500 text-[10px] font-bold uppercase tracking-wider">Guest Wi-Fi</span>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs font-medium">Wi-Fi Name</span>
                        {/* @ts-ignore */}
                        <span className="text-slate-200 text-xs font-bold font-mono">{currentProperty.wifi_ssid}</span>
                    </div>
                    {/* @ts-ignore */}
                    {currentProperty.wifi_password && (
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-xs font-medium">Password</span>
                            {/* @ts-ignore */}
                            <span className="text-slate-200 text-xs font-bold font-mono">{currentProperty.wifi_password}</span>
                        </div>
                    )}
                </div>
            </div>
          )}



          {/* Actions */}
          <div className="w-full space-y-3">
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
