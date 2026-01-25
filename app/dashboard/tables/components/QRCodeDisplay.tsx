'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Download, Loader2, Smartphone, X, Copy, ExternalLink } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useProperty } from '../../context/PropertyContext';

interface QRCodeDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  tableType?: string;
  propertyId: string;
}

export default function QRCodeDisplay({ isOpen, onClose, tableNumber, tableType, propertyId }: QRCodeDisplayProps) {
  const { properties } = useProperty();
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  // Find current property details for logo/wifi
  const property = properties.find(p => p.id === propertyId);
  const [menuUrl, setMenuUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        const queryParam = `?table=${encodeURIComponent(tableNumber)}`;
        // Use path-based URL for reliability and to avoid DNS/Subdomain issues
        setMenuUrl(`${origin}/menu/${propertyId}${queryParam}`);
    }
  }, [propertyId, tableNumber]);

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCanvas = async () => {
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
    if (property?.logo_url) {
        try {
            logoImg = new Image();
            logoImg.crossOrigin = "anonymous";
            logoImg.src = property.logo_url;
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
        ctx.quadraticCurveTo(x, y, x + h, y + h - r); // Fix? No, standard curve
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    };
    
    // Re-implement standard rounded rect correctly
    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
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

    // Draw Table Number Top Right
    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    
    // Label
    ctx.font = 'bold 60px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    
    const rightMargin = 120;
    const topMargin = 100;
    
    ctx.fillText('TABLE', WIDTH - rightMargin, topMargin);
    
    // The Number
    ctx.font = '900 200px sans-serif'; // Very bold and large
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tableNumber, WIDTH - rightMargin, topMargin + 80);
    
    ctx.restore();

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
    cursorY += 80;
    ctx.font = '500 70px sans-serif';
    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.letterSpacing = '15px';
    ctx.fillText('ORDER DIRECTLY FROM YOUR TABLE', WIDTH / 2, cursorY);

    // 4. Draw QR Code
    try {
        const qrUrl = await QRCode.toDataURL(menuUrl, {
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
        const cardHeight = 1300;
        const cardX = (WIDTH - cardWidth) / 2;
        // Push card down slightly
        const cardY = cursorY + 80;
        const r = 100;

        // --- Gradient Glow Effect ---
        const glowGradient = ctx.createLinearGradient(cardX, cardY + cardHeight, cardX + cardWidth, cardY);
        glowGradient.addColorStop(0, '#ec4899'); // Pink 500
        glowGradient.addColorStop(0.5, '#a855f7'); // Purple 500
        glowGradient.addColorStop(1, '#6366f1'); // Indigo 500

        ctx.save();
        ctx.filter = 'blur(80px)'; // Strong blur for glow effect
        ctx.fillStyle = glowGradient;
        
        // Draw blurred rect behind
        roundRect(cardX, cardY, cardWidth, cardHeight, r);
        ctx.fill();
        ctx.restore();

        // Draw White Card Inner (Solid, Sharp)
        ctx.fillStyle = '#ffffff';
        roundRect(cardX, cardY, cardWidth, cardHeight, r);
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
        const iconSize = 80;
        const cornerLen = 25;

        // Center Dash
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.stroke();

        // Corners... (Simplified for brevity but keep consistent)
        // Top Left
        ctx.beginPath();
        ctx.moveTo(cx - iconSize / 2, cy - iconSize / 2 + cornerLen);
        ctx.lineTo(cx - iconSize / 2, cy - iconSize / 2);
        ctx.lineTo(cx - iconSize / 2 + cornerLen, cy - iconSize / 2);
        ctx.stroke();
        // Top Right
        ctx.beginPath();
        ctx.moveTo(cx + iconSize / 2 - cornerLen, cy - iconSize / 2);
        ctx.lineTo(cx + iconSize / 2, cy - iconSize / 2);
        ctx.lineTo(cx + iconSize / 2, cy - iconSize / 2 + cornerLen);
        ctx.stroke();
        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(cx + iconSize / 2, cy + iconSize / 2 - cornerLen);
        ctx.lineTo(cx + iconSize / 2, cy + iconSize / 2);
        ctx.lineTo(cx + iconSize / 2 - cornerLen, cy + iconSize / 2);
        ctx.stroke();
        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(cx - iconSize / 2 + cornerLen, cy + iconSize / 2);
        ctx.lineTo(cx - iconSize / 2, cy + iconSize / 2);
        ctx.lineTo(cx - iconSize / 2, cy + iconSize / 2 - cornerLen);
        ctx.stroke();
        
        cursorY = cardY + cardHeight;

    } catch (e) {
        console.error("Error generating QR", e);
    }

    // 5. Scan Instructions
    const instructionsY = cursorY + 150;
    ctx.textAlign = 'center';
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
    
    // 6. Wifi Info
    if (property?.wifi_ssid) {
        const wifiY = instructionsY + 600;
        
        // Draw Card Background
        const cardWidth = 1600;
        const cardHeight = 450;
        const cardX = (WIDTH - cardWidth) / 2;
        const cardY = wifiY - 100;
        
        ctx.fillStyle = 'rgba(30, 41, 59, 0.6)'; // Slate 800
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 5;
        
        roundRect(cardX, cardY, cardWidth, cardHeight, 60);
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
        ctx.font = 'bold 70px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(property.wifi_ssid, valueX, row1Y);
        
        // Password Row
        if (property.wifi_password) {
            const row2Y = row1Y + 110;
            ctx.textAlign = 'left';
            ctx.font = '500 70px sans-serif';
            ctx.fillStyle = '#94a3b8'; // Slate 400
            ctx.fillText('Password', contentX, row2Y);
            
            ctx.textAlign = 'right';
            ctx.font = 'bold 70px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(property.wifi_password, valueX, row2Y);
        }
        
        ctx.textAlign = 'center';
    }

    // Powered By
    ctx.fillStyle = '#475569'; // Slate 600
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText('POWERED BY WWW.ZAMORAAPP.COM', WIDTH / 2, HEIGHT - 100);
    
    return canvas;
  };

  const downloadQR = async () => {
    if (!menuUrl) return;
    setIsDownloading(true);
    try {
        const canvas = await generateCanvas();
        if (canvas) {
            const link = document.createElement('a');
            link.download = `Table-${tableNumber}-Flyer.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error('Error generating QR:', error);
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
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                    <Smartphone size={12} />
                    <span>Touchless Menu</span>
                </div>

                {/* Header */}
                <div className="text-center mb-6">
                    <h3 className="text-3xl font-black text-white mb-1">Table {tableNumber}</h3>
                    <p className="text-slate-500 text-sm">Scan to Order</p>
                </div>

                {/* QR Preview Card */}
                <div className="bg-white p-4 rounded-3xl shadow-[0_0_40px_-10px_rgba(236,72,153,0.3)] relative group transition-transform hover:scale-[1.02] duration-300 mb-8">
                    <div className="relative">
                        {menuUrl ? (
                            <QRCodeSVG 
                                value={menuUrl} 
                                size={180}
                                level="H"
                                includeMargin={true}
                                className="rounded-xl"
                            />
                        ) : (
                            <div className="w-[180px] h-[180px] flex items-center justify-center bg-slate-50 rounded-xl">
                                <Loader2 className="animate-spin text-slate-300" size={32} />
                            </div>
                        )}
                        {/* Center Logo/Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg p-1">
                                <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-white">
                                    <Smartphone size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="w-full space-y-3">
                    <button 
                        onClick={downloadQR}
                        disabled={isDownloading || !menuUrl}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-pink-50 disabled:bg-slate-200 px-6 py-3.5 rounded-xl font-bold transition-all transform active:scale-[0.98] shadow-lg shadow-pink-500/10"
                    >
                        {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        Download High-Res Flyer
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
                            href={menuUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => !menuUrl && e.preventDefault()}
                            className={`flex-1 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-white transition-colors active:scale-[0.98] group ${!menuUrl ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <ExternalLink size={14} className="group-hover:text-pink-400 transition-colors" /> Open Menu
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
