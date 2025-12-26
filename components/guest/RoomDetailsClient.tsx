'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, BedDouble, User, CheckCircle, Star, 
  Wifi, Coffee, Wind, Tv, Calendar, MessageCircle
} from 'lucide-react';
import GuestNavbar from './GuestNavbar';
import { toast } from 'react-hot-toast';

interface RoomDetailsClientProps {
  property: any;
  room: any;
}

export default function RoomDetailsClient({ property, room }: RoomDetailsClientProps) {
  const router = useRouter();
  
  // Booking State
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  // Calculate nights and price
  const nights = checkIn && checkOut 
    ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  
  const totalPrice = room.base_price * nights;

  const handleBook = async () => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    setIsBooking(true);
    
    // Simulate booking process or redirect to a checkout page
    // For now, we'll just show a success message
    try {
        // Here you would typically add to cart or create a booking intent
        // Since we are on a dedicated page, maybe we redirect to a checkout page with query params?
        // Or we can just use the existing API if we want to book directly.
        
        // Let's assume we want to use the same checkout logic as ModernPropertyDetails
        // But since that logic is inside that component, we might need to replicate it here
        // or redirect to a common checkout.
        
        // For this task, "Book now button must open a new room details page" was the request.
        // On this page, there should likely be a final "Confirm Booking" or "Add to Cart" action.
        
        // Let's implement a direct booking for now using the API found in ModernPropertyDetails
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomTypeId: room.id,
            propertyId: property.id,
            checkIn,
            checkOut,
            guestDetails: {
                firstName: 'Guest', // specific details might be collected in a form
                lastName: 'User',
                email: 'guest@example.com',
                phone: '',
                specialRequests: ''
            }
          })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to book room');
        }

        toast.success('Booking request sent!');
        router.push(`/book/${property.slug || property.id}`); // Go back to property page
        
    } catch (error: any) {
        console.error('Booking error:', error);
        toast.error(error.message);
    } finally {
        setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pt-20">
      <GuestNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Link 
            href={`/book/${property.slug || property.id}`}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-bold transition-colors"
        >
            <ArrowLeft size={20} />
            Back to {property.name}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Room Images & Info */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Image Gallery */}
                <div className="rounded-3xl overflow-hidden aspect-video bg-slate-100 relative shadow-lg">
                    {room.image_url ? (
                        <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BedDouble size={64} className="text-slate-300" />
                        </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                        {room.bed_type || 'King Bed'}
                    </div>
                </div>

                {/* Title & Stats */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{room.name}</h1>
                    
                    <div className="flex flex-wrap gap-6 text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                            <User size={20} />
                            <span>Max {room.capacity} Guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BedDouble size={20} />
                            <span>{room.bed_type || 'King Bed'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star size={20} className={property.review_count > 0 ? "text-yellow-400 fill-yellow-400" : "text-slate-300"} />
                            {property.review_count > 0 ? (
                                <span>{property.average_rating} ({property.review_count} Reviews)</span>
                            ) : (
                                <span>New</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Description */}
                <div>
                    <h2 className="text-xl font-bold mb-3">Room Description</h2>
                    <p className="text-slate-600 leading-relaxed text-lg">
                        {room.description || "Experience comfort and luxury in our meticulously designed room. Perfect for relaxation after a day of exploring."}
                    </p>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Amenities */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Room Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { icon: Wifi, label: 'Free High-Speed Wifi' },
                            { icon: Tv, label: 'Smart TV' },
                            { icon: Wind, label: 'Air Conditioning' },
                            { icon: Coffee, label: 'Coffee Maker' },
                            { icon: CheckCircle, label: 'En-suite Bathroom' },
                            { icon: CheckCircle, label: 'Daily Housekeeping' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-600">
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Right Column: Booking Widget */}
            <div className="relative">
                <div className="sticky top-24 bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <span className="text-3xl font-black text-slate-900">K{room.base_price}</span>
                            <span className="text-slate-500 font-medium"> / night</span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="border border-slate-300 rounded-xl p-3 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Check-in</label>
                                <input 
                                    type="date" 
                                    className="w-full outline-none font-bold text-slate-900 bg-transparent"
                                    value={checkIn}
                                    onChange={(e) => setCheckIn(e.target.value)}
                                />
                            </div>
                            <div className="border border-slate-300 rounded-xl p-3 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Check-out</label>
                                <input 
                                    type="date" 
                                    className="w-full outline-none font-bold text-slate-900 bg-transparent"
                                    value={checkOut}
                                    min={checkIn}
                                    onChange={(e) => setCheckOut(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="border border-slate-300 rounded-xl p-3 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Guests</label>
                            <select 
                                className="w-full outline-none font-bold text-slate-900 bg-transparent"
                                value={guests}
                                onChange={(e) => setGuests(Number(e.target.value))}
                            >
                                {Array.from({ length: room.capacity || 2 }).map((_, i) => (
                                    <option key={i} value={i + 1}>{i + 1} Guest{i > 0 ? 's' : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-slate-600">
                            <span className="underline">K{room.base_price} x {nights} nights</span>
                            <span>K{room.base_price * nights}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span className="underline">Service fee</span>
                            <span>K0</span>
                        </div>
                        <div className="h-px bg-slate-200 my-2" />
                        <div className="flex justify-between font-black text-lg text-slate-900">
                            <span>Total</span>
                            <span>K{totalPrice}</span>
                        </div>
                    </div>

                    {property.whatsapp_booking_phone ? (
                        <button 
                            onClick={() => {
                                if (!checkIn || !checkOut) {
                                    toast.error('Please select check-in and check-out dates');
                                    return;
                                }

                                const message = `Hello, I found this on Zamora and I'm interested in booking the ${room.name} at ${property.name}.\n\nIs this room available for booking from ${checkIn} to ${checkOut} (${nights} nights)?\n\nDetails:\n- Guests: ${guests}\n- Total Price: K${totalPrice}\n\nLooking forward to your response!`;
                                
                                const encodedMessage = encodeURIComponent(message);
                                const cleanPhone = property.whatsapp_booking_phone.replace(/[^0-9]/g, '');
                                const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
                                
                                window.open(whatsappUrl, '_blank');
                            }}
                            className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={20} />
                            Book via WhatsApp
                        </button>
                    ) : (
                        <button 
                            onClick={handleBook}
                            disabled={isBooking}
                            className="w-full py-4 bg-zambia-red hover:bg-red-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            {isBooking ? 'Processing...' : 'Reserve Room'}
                        </button>
                    )}
                    
                    <p className="text-center text-xs text-slate-400 mt-4">
                        You won't be charged yet
                    </p>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}
