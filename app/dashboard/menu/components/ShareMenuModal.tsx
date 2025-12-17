'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { Copy, ExternalLink, X, Download, Share2, ScanLine, Smartphone, Building2, MapPin, Wifi, UtensilsCrossed, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';

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
  const [isDownloading, setIsDownloading] = useState(false);
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

  // Point to the dedicated public menu page
  const getMenuUrl = (locValue: string) => {
    if (typeof window === 'undefined') return '';
    
    const slug = (currentProperty as any).slug;
    const queryParam = locValue 
        ? (locationType === 'room' ? `?room=${encodeURIComponent(locValue)}` : `?table=${encodeURIComponent(locValue)}`)
        : '';

    if (slug) {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const domain = host.includes('localhost') 
                ? 'localhost:3000' 
                : host.split('.').slice(-2).join('.');
                
            return `${protocol}//${slug}.${domain}/menu${queryParam}`;
        }
        return `${window.location.origin}/menu/${currentHotelId}${queryParam}`;
  };

  const menuUrl = getMenuUrl(locationValue);

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

    const generateCanvas = async (targetLocValue: string) => {
        // 1. Setup Canvas (A4 size @ 300dpi: 2480 x 3508 px)
        const canvas = document.createElement('canvas');
        const WIDTH = 2480;
        const HEIGHT = 3508;

        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

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

        // Helper for Rounded Rect
        const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        };

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

        let cursorY = 250;

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
        cursorY += 100;
        ctx.font = '500 70px sans-serif';
        ctx.fillStyle = '#94a3b8'; // Slate 400
        ctx.letterSpacing = '15px';
        
        let subtitleText = 'VIEW FOOD & BAR MENU';
        if (targetLocValue) {
            subtitleText = locationType === 'room' ? 'FOOD DELIVERED TO YOUR ROOM' : 'ORDER DIRECTLY FROM YOUR TABLE';
        }
        
        ctx.fillText(subtitleText, WIDTH / 2, cursorY);

        // 4. Draw QR Code
        // Use the reusable function to get the URL for this specific location
        const targetUrl = getMenuUrl(targetLocValue);
        
        try {
            const qrUrl = await QRCode.toDataURL(targetUrl, {
                width: 1000,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            
            const qrImg = new Image();
            qrImg.src = qrUrl;
            await new Promise((resolve) => { qrImg.onload = resolve; });

            // Draw a white card container for QR
            const cardWidth = 1300;
            const cardHeight = 1500; // Increased height for top/bottom padding
            const cardX = (WIDTH - cardWidth) / 2;
            // Push card down slightly
            const cardY = cursorY + 100;
            const r = 100;

            // --- Gradient Glow Effect ---
            const glowGradient = ctx.createLinearGradient(cardX, cardY + cardHeight, cardX + cardWidth, cardY);
            glowGradient.addColorStop(0, '#ec4899'); // Pink 500
            glowGradient.addColorStop(0.5, '#a855f7'); // Purple 500
            glowGradient.addColorStop(1, '#6366f1'); // Indigo 500

            ctx.save();
            ctx.filter = 'blur(80px)'; // Strong blur for glow effect
            ctx.fillStyle = glowGradient;
            
            // Draw blurred rect behind (same size as card)
            drawRoundedRect(cardX, cardY, cardWidth, cardHeight, r);
            ctx.fill();
            ctx.restore();

            // Draw White Card Inner (Solid, Sharp)
            ctx.fillStyle = '#ffffff';
            drawRoundedRect(cardX, cardY, cardWidth, cardHeight, r);
            ctx.fill();

            // Draw QR centered in card
            const qrSize = 1000;
            const qrX = cardX + (cardWidth - qrSize) / 2;
            const qrY = cardY + (cardHeight - qrSize) / 2;
            
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

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
            cursorY = cardY + cardHeight;

        } catch (e) {
            console.error("Error generating QR", e);
            // Fallback text
            ctx.fillStyle = '#000000';
            ctx.font = '40px sans-serif';
            ctx.fillText('Error generating QR Code', WIDTH/2, HEIGHT/2);
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
        ctx.fillText(`or visit ${targetUrl}`, WIDTH / 2, instructionsY + 220);
        
        // 6. Wifi Info (Restored for Printout)
        // @ts-ignore
        if (currentProperty.wifi_ssid) {
            // Adjust wifiY based on available space, or push it down
            const wifiY = instructionsY + 500;
            
            // Draw Card Background
            const cardWidth = 1600;
            const cardHeight = 450;
            const cardX = (WIDTH - cardWidth) / 2;
            const cardY = wifiY - 100;
            
            ctx.fillStyle = 'rgba(30, 41, 59, 0.6)'; // Slate 800
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 5;
            
            drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 60);
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
        
        return canvas;
    };

    const handleDownload = async () => {
        setIsDownloading(true);

        try {
            // Check for range input "1-17" (numbers only)
            const rangeMatch = locationValue.trim().match(/^(\d+)\s*-\s*(\d+)$/);
            
            if (rangeMatch) {
                const start = parseInt(rangeMatch[1]);
                const end = parseInt(rangeMatch[2]);
                
                // Validation: Ensure valid range and not too large (e.g., max 100 items)
                if (!isNaN(start) && !isNaN(end) && end >= start && (end - start) < 100) {
                    const zip = new JSZip();
                    
                    // Generate all canvases
                    for (let i = start; i <= end; i++) {
                        const loc = i.toString();
                        const canvas = await generateCanvas(loc);
                        if (canvas) {
                            const dataUrl = canvas.toDataURL('image/png');
                            // Remove header to get base64 content
                            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
                            zip.file(`${locationType}-${loc}.png`, base64Data, {base64: true});
                        }
                    }
                    
                    // Download zip
                    const content = await zip.generateAsync({type: "blob"});
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = `${locationType}s-${start}-${end}.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return;
                }
            }

            // Single item download
            const canvas = await generateCanvas(locationValue);
            if (canvas) {
                const link = document.createElement('a');
                link.download = `menu-flyer-${currentHotelId}${locationValue ? `-${locationType}-${locationValue}` : ''}.png`;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Error generating menu:', error);
        } finally {
            setIsDownloading(false);
        }
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

          {/* Wifi Info Card - Hidden from modal but available in printout
          {currentProperty.wifi_ssid && (
            <div className="w-full mt-6 mb-2 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Wifi size={14} className="text-pink-500" />
                    <span className="text-pink-500 text-[10px] font-bold uppercase tracking-wider">Guest Wi-Fi</span>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs font-medium">Wi-Fi Name</span>
                        <span className="text-slate-200 text-xs font-bold font-mono">{currentProperty.wifi_ssid}</span>
                    </div>
                    {currentProperty.wifi_password && (
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-xs font-medium">Password</span>
                            <span className="text-slate-200 text-xs font-bold font-mono">{currentProperty.wifi_password}</span>
                        </div>
                    )}
                </div>
            </div>
          )}
          */}



          {/* Actions */}
          <div className="w-full space-y-3">
             <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors shadow-lg shadow-pink-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isDownloading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" /> Generating...
                    </>
                ) : (
                    <>
                        <Download size={16} /> Download Printable Card
                    </>
                )}
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
