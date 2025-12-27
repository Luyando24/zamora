'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, ArrowLeft, Heart, Share2, Star, Check, Wine, Utensils } from 'lucide-react';

interface FoodDetailsPageProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: any, quantity: number, options: any) => void;
  similarItems: any[];
  type?: 'food' | 'bar';
}

export default function FoodDetailsPage({ item, isOpen, onClose, onAddToCart, similarItems, type = 'food' }: FoodDetailsPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [isClosing, setIsClosing] = useState(false);

  // Reset state when item changes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedOptions(new Set());
      setIsClosing(false);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, item]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
        onClose();
        setIsClosing(false);
    }, 300);
  };

  const handleToggleOption = (optionName: string) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(optionName)) {
        newSelected.delete(optionName);
    } else {
        newSelected.add(optionName);
    }
    setSelectedOptions(newSelected);
  };

  if (!isOpen || !item) return null;

  const options = Array.isArray(item.customization_options) ? item.customization_options : [];
  const optionsTotal = options
    .filter((o: any) => selectedOptions.has(o.name))
    .reduce((acc: number, o: any) => acc + (Number(o.price) || 0), 0);

  const basePrice = Number(item.price || item.base_price || 0);
  const totalPrice = (basePrice + optionsTotal) * quantity;
  
  // Calculate original price (if exists) + options (mocking original price logic appropriately)
  const itemOriginalPrice = item.original_price ? Number(item.original_price) : null;
  const originalPriceTotal = itemOriginalPrice ? (itemOriginalPrice + optionsTotal) * quantity : null;

  return (
    <div className={`fixed inset-0 z-[60] flex justify-center items-end md:items-center transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Desktop Overlay Background (Click to close) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm hidden md:block transition-opacity" onClick={handleClose}></div>

      {/* Main Modal Card */}
      <div className="relative w-full h-full md:h-[85vh] md:w-full md:max-w-5xl bg-white md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden transform transition-transform duration-300 md:scale-100">
        
        {/* Close Button - Adapted position */}
        <button 
            onClick={handleClose}
            className="absolute top-4 left-4 md:top-6 md:left-6 z-30 w-10 h-10 bg-white/90 md:bg-white backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-900 hover:bg-slate-100 transition-all active:scale-95"
        >
            <X size={24} />
        </button>

        {/* LEFT SIDE (Desktop): Image */}
        <div className="relative w-full h-[40vh] md:h-full md:w-1/2 bg-slate-100 shrink-0">
           {item.image_url ? (
             <Image 
               src={item.image_url} 
               alt={item.name} 
               fill
               className="object-cover"
               unoptimized
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                {type === 'bar' ? (
                    <Wine size={64} className="opacity-20" />
                ) : (
                    <Utensils size={64} className="opacity-20" />
                )}
             </div>
           )}
           
           {/* Badges */}
           <div className="absolute bottom-4 left-4 flex gap-2 z-10 flex-wrap">
              {item.discount_badge && (
                <span className="bg-pink-500 text-white font-bold px-3 py-1 rounded-lg text-sm shadow-sm">
                  {item.discount_badge}
                </span>
              )}
              <span className="bg-slate-900 text-white font-bold px-3 py-1 rounded-lg text-sm shadow-sm">
                {item.category || 'Combo'}
              </span>
              {item.dietary_info && (
                <span className="bg-green-600 text-white font-bold px-3 py-1 rounded-lg text-sm shadow-sm">
                  {item.dietary_info}
                </span>
              )}
           </div>
        </div>

        {/* RIGHT SIDE (Desktop): Content & Actions */}
        <div className="flex-1 flex flex-col h-full md:w-1/2 relative bg-white">
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-32 md:pb-28 custom-scrollbar">
                <div className="px-5 py-6 md:p-8 md:pt-12">
                   {/* Title & Weight */}
                   <div className="mb-4">
                      <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight mb-2">
                         {item.name}
                      </h1>
                      {item.weight && (
                        <span className="text-slate-400 font-bold text-lg">
                            {item.weight}
                        </span>
                      )}
                   </div>

                   {/* Description */}
                   <p className="text-slate-600 leading-relaxed mb-6 font-medium md:text-lg">
                      {item.description}
                   </p>

                   {/* Ingredients */}
                   {item.ingredients && (
                     <div className="mb-8">
                        <h3 className="text-slate-400 font-bold mb-2 text-sm uppercase tracking-wide">Ingredients</h3>
                        <p className="text-slate-800 font-medium">
                           {item.ingredients}
                        </p>
                     </div>
                   )}

                   <hr className="border-slate-100 mb-8" />

                   {/* Options */}
                   {options.length > 0 && (
                     <div className="mb-10">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Extras & Options</h3>
                        <div className="space-y-4">
                           {options.map((option: any, idx: number) => {
                             const isSelected = selectedOptions.has(option.name);
                             return (
                               <label key={idx} className={`flex items-center justify-between p-4 rounded-2xl border bg-white shadow-sm cursor-pointer transition-colors group ${isSelected ? 'border-pink-500 ring-1 ring-pink-500' : 'border-slate-100 hover:border-pink-300'}`}>
                                  <div className="flex items-center gap-4">
                                     <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-pink-500 border-pink-500' : 'border-slate-300 group-hover:border-pink-300'}`}>
                                        {isSelected && <Check size={16} className="text-white" />}
                                     </div>
                                     <span className="font-bold text-slate-900">{option.name}</span>
                                  </div>
                                  <span className="text-slate-400 font-bold text-sm">
                                    {Number(option.price) > 0 ? `+${Number(option.price)}K` : 'Free'}
                                  </span>
                                  <input 
                                      type="checkbox" 
                                      className="hidden" 
                                      checked={isSelected} 
                                      onChange={() => handleToggleOption(option.name)} 
                                  />
                               </label>
                             );
                           })}
                        </div>
                     </div>
                   )}

                   {/* You Also Like */}
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">You May Also Like</h3>
                      <div className="grid grid-cols-3 gap-3 md:gap-4">
                         {similarItems.slice(0, 6).map((similar) => (
                            <div key={similar.id} className="flex flex-col gap-2 group cursor-pointer">
                              <div className="aspect-square rounded-2xl bg-slate-100 relative overflow-hidden">
                                 {similar.image_url ? (
                                   <Image 
                                     src={similar.image_url} 
                                     alt={similar.name} 
                                     fill
                                     className="object-cover group-hover:scale-110 transition-transform duration-500"
                                     unoptimized
                                   />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center text-slate-300">
                                      {type === 'bar' ? <Wine size={24} className="opacity-50" /> : <Utensils size={24} className="opacity-50" />}
                                   </div>
                                 )}
                                 <div className="absolute top-2 left-2 flex flex-col gap-1">
                                    <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">K{similar.price}</span>
                                 </div>
                                 {similar.dietary_info && (
                                    <div className="absolute bottom-2 right-2">
                                       <span className="bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">{similar.dietary_info}</span>
                                    </div>
                                 )}
                              </div>
                              <div>
                                 <p className="font-black text-slate-900 text-sm">{(similar.price || similar.base_price)} K</p>
                                 <p className="text-xs text-slate-500 font-medium truncate group-hover:text-black transition-colors">{similar.name}</p>
                                 {similar.weight && <p className="text-[10px] text-slate-400">{similar.weight}</p>}
                              </div>
                              <button className="w-full py-1.5 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                                  <Plus size={14} className="text-slate-900" />
                               </button>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
            </div>

            {/* Bottom Action Bar - Sticky within the right column on desktop */}
            <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-0 bg-white border-t border-slate-100 p-4 pb-8 md:pb-6 z-50 md:z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
               <div className="max-w-md mx-auto md:max-w-none flex gap-4">
                  {/* Quantity Control */}
                  <div className="flex items-center gap-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                     <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-6 h-6 flex items-center justify-center text-slate-900 hover:text-slate-600 active:scale-90 transition-transform"
                     >
                        <Minus size={18} />
                     </button>
                     <span className="font-bold text-xl text-slate-900 min-w-[20px] text-center">{quantity}</span>
                     <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-900 hover:text-slate-600 active:scale-90 transition-transform"
                     >
                        <Plus size={18} />
                     </button>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="flex-1 flex items-center justify-between">
                     <div className="flex flex-col">
                        {originalPriceTotal !== null && (
                            <span className="text-slate-400 font-bold text-sm line-through">
                                K{originalPriceTotal.toFixed(2)}
                            </span>
                        )}
                        <span className="font-black text-2xl text-slate-900">
                            K{totalPrice.toFixed(2)}
                        </span>
                     </div>
                     <button 
                        onClick={() => {
                           onAddToCart(item, quantity, { selectedOptions: Array.from(selectedOptions) });
                           handleClose();
                        }}
                        className="bg-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-pink-200 active:scale-95 transition-all hover:bg-pink-600 flex items-center gap-2"
                     >
                        <span>Add to cart</span>
                     </button>
                  </div>
               </div>
            </div>

        </div>

      </div>
    </div>
  );
}
