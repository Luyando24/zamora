'use client';

import { useState, useEffect } from 'react';
import { X, Check, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ServiceContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signatureData: string, printedName: string) => void;
  userName: string;
}

export default function ServiceContractModal({ isOpen, onClose, onSign, userName }: ServiceContractModalProps) {
  const [printedName, setPrintedName] = useState(userName);
  const [accepted, setAccepted] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrintedName(userName);
      setAccepted(false);
    }
  }, [isOpen, userName]);

  const handleAccept = () => {
    if (!accepted || !printedName.trim()) return;
    // Pass a placeholder for signature data since we're using a digital acceptance
    onSign('digital_consent_v1', printedName);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        <PenTool size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Service Agreement</h2>
                        <p className="text-sm text-slate-500">Please review and sign to continue</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                    <X size={24} />
                </button>
            </div>

            {/* Content - Two Columns on Desktop */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                
                {/* Contract Text */}
                <div className="flex-1 overflow-y-auto p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                    <div className="prose prose-sm prose-slate max-w-none">
                        <h3>ZAMORA SERVICE AGREEMENT</h3>
                        <p className="text-xs text-slate-400 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
                        
                        <h4>1. Services Provided</h4>
                        <p>Zamora ("Provider") agrees to provide the Client with access to the Zamora Property Management System ("Service"). The Service includes property management, point of sale, and inventory management features.</p>

                        <h4>2. Subscription Terms</h4>
                        <p>The Service is provided on a subscription basis. The Client agrees to pay the applicable fees for the selected plan. The initial term is 14 days (Free Trial), after which a paid subscription is required to continue access.</p>

                        <h4>3. User Responsibilities</h4>
                        <p>The Client is responsible for maintaining the confidentiality of account credentials and for all activities that occur under their account. The Client agrees not to use the Service for any illegal or unauthorized purpose.</p>

                        <h4>4. Data Privacy</h4>
                        <p>Zamora respects the Client's privacy and ownership of data. We will not share Client data with third parties without consent, except as required by law or to provide the Service.</p>

                        <h4>5. Termination</h4>
                        <p>Either party may terminate this agreement with notice. Upon termination, the Client's access to the Service will cease.</p>

                        <h4>6. Limitation of Liability</h4>
                        <p>To the maximum extent permitted by law, Zamora shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
                        
                        <p className="mt-8 text-xs text-slate-400">By signing below, you acknowledge that you have read, understood, and agree to be bound by these terms.</p>
                    </div>
                </div>

                {/* Signature Area */}
                <div className="w-full md:w-[400px] bg-white p-8 flex flex-col gap-6 shrink-0">
                    
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700">Printed Name</label>
                        <input 
                            type="text" 
                            value={printedName}
                            onChange={(e) => setPrintedName(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                            placeholder="Full Name"
                        />
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col justify-center">
                         <div 
                            onClick={() => setAccepted(!accepted)}
                            className={`
                                cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-4
                                ${accepted 
                                    ? 'border-slate-900 bg-slate-50' 
                                    : 'border-slate-200 hover:border-slate-300'
                                }
                            `}
                        >
                            <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors
                                ${accepted 
                                    ? 'border-slate-900 bg-slate-900' 
                                    : 'border-slate-300 bg-white'
                                }
                            `}>
                                {accepted && <Check size={14} className="text-white" strokeWidth={3} />}
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${accepted ? 'text-slate-900' : 'text-slate-700'}`}>
                                    I agree to the Terms of Service
                                </p>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    By checking this box, I acknowledge that I have read and understood the service agreement and agree to be bound by its terms.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleAccept}
                        disabled={!accepted || !printedName.trim()}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                        <Check size={20} /> Sign & Accept
                    </button>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
