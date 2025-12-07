'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Copy, ExternalLink, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useState } from 'react';

interface ShareMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
}

export default function ShareMenuModal({ isOpen, onClose, hotelId }: ShareMenuModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Assuming the public booking page is at /book/[hotelId]
  // and we might want a specific menu tab, e.g. /book/[hotelId]?tab=menu
  // For now, let's point to the main booking page which usually has the menu.
  const menuUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/book/${hotelId}` 
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Food Menu">
      <div className="space-y-6 flex flex-col items-center pt-4">
        <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm">
          <QRCodeSVG 
            value={menuUrl} 
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="font-bold text-gray-900">Scan to Order</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Guests can scan this code with their phone camera to view the menu and place orders.
          </p>
        </div>

        <div className="w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Public Menu Link</label>
          <div className="flex gap-2">
            <input 
              readOnly 
              value={menuUrl}
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zambia-green/20"
            />
            <button
              onClick={handleCopy}
              className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors relative group"
              title="Copy Link"
            >
              <Copy size={18} />
              {copied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded shadow-lg">
                  Copied!
                </span>
              )}
            </button>
            <a
              href={menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-zambia-green text-white rounded-lg hover:bg-zambia-green/90 transition-colors"
              title="Open Link"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </div>

        <div className="w-full pt-4 border-t border-gray-100 flex justify-end">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
           >
             Close
           </button>
        </div>
      </div>
    </Modal>
  );
}
