'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import Breadcrumb from '@/components/ui/Breadcrumb';
import GuestNavbar from './GuestNavbar';
import {
    ShoppingBag, Utensils, BedDouble, Search, Plus, Minus, X,
    MapPin, Phone, Mail, Clock, CheckCircle, Star,
    ChevronRight, ArrowRight, Instagram, Facebook, Twitter, Building2, ArrowLeft, Calendar, Info, Home, Coffee, User, Wine, Image as ImageIcon,
    Share, Heart, ChevronLeft,
    BadgeCheck, Wifi, Wind, Tv, Bookmark
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface ModernPropertyDetailsProps {
    property: any;
    roomTypes: any[];
    menuItems: any[];
    categories: any[];
    barMenuItems?: any[];
    barCategories?: any[];
}

export default function ModernPropertyDetails({ property, roomTypes, menuItems, categories, barMenuItems = [], barCategories = [] }: ModernPropertyDetailsProps) {
    // -- State --
    const [activeSection, setActiveSection] = useState('overview');
    const [isScrolled, setIsScrolled] = useState(false);
    const [galleryPage, setGalleryPage] = useState(0);
    const [photosIndex, setPhotosIndex] = useState(0);
    const [showFullMenu, setShowFullMenu] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);

    // Review Form State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Cart & Booking State
    const [cart, setCart] = useState<any[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const [bookingDates, setBookingDates] = useState({ checkIn: '', checkOut: '' });
    const [guestDetails, setGuestDetails] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialRequests: ''
    });

    const [availableRoomTypes, setAvailableRoomTypes] = useState<Set<string> | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    // Refs for scrolling
    const overviewRef = useRef<HTMLDivElement>(null);
    const roomsRef = useRef<HTMLDivElement>(null);
    const diningRef = useRef<HTMLDivElement>(null);
    const amenitiesRef = useRef<HTMLDivElement>(null);
    const locationRef = useRef<HTMLDivElement>(null);
    const photosRef = useRef<HTMLDivElement>(null);

    // -- Effects --
    useEffect(() => {
        const handleScroll = () => {

            // Update active section based on scroll position
            const sections = [
                { id: 'overview', ref: overviewRef },
                { id: 'photos', ref: photosRef },
                { id: 'rooms', ref: roomsRef },
                { id: 'dining', ref: diningRef },
                { id: 'amenities', ref: amenitiesRef },
                { id: 'location', ref: locationRef }
            ];

            for (const section of sections) {
                if (section.ref.current) {
                    const rect = section.ref.current.getBoundingClientRect();
                    if (rect.top >= 0 && rect.top < 300) {
                        setActiveSection(section.id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const checkAvailability = async () => {
            if (bookingDates.checkIn && bookingDates.checkOut) {
                setCheckingAvailability(true);
                const supabase = createClient();
                const { data, error } = await supabase.rpc('get_room_availability', {
                    p_property_id: property.id,
                    p_check_in: bookingDates.checkIn,
                    p_check_out: bookingDates.checkOut
                });

                if (error) {
                    console.error('Error checking availability:', error);
                } else {
                    const availableIds = new Set<string>(
                        (data || []).filter((r: any) => r.available_rooms > 0).map((r: any) => r.room_type_id as string)
                    );
                    setAvailableRoomTypes(availableIds);
                }
                setCheckingAvailability(false);
            } else {
                setAvailableRoomTypes(null);
            }
        };

        checkAvailability();
    }, [bookingDates, property.id]);

    const fetchReviews = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('reviews')
            .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
            .eq('property_id', property.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setReviews(data);
        }
        setReviewsLoading(false);
    }, [property.id]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    useEffect(() => {
        const checkSavedStatus = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('saved_properties')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('property_id', property.id)
                    .single();
                setIsSaved(!!data);
            }
        };
        checkSavedStatus();
    }, [property.id]);

    const handleSave = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error('Please log in to save this property');
            return;
        }

        if (isSaved) {
            const { error } = await supabase
                .from('saved_properties')
                .delete()
                .eq('user_id', user.id)
                .eq('property_id', property.id);

            if (error) {
                toast.error('Failed to unsave property');
            } else {
                setIsSaved(false);
                toast.success('Property removed from saved items');
            }
        } else {
            const { error } = await supabase
                .from('saved_properties')
                .insert({ user_id: user.id, property_id: property.id });

            if (error) {
                toast.error('Failed to save property');
            } else {
                setIsSaved(true);
                toast.success('Property saved to your profile');
            }
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: property.name,
                    text: `Check out ${property.name} on Zamora!`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };

    const handleSubmitReview = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error('Please log in to leave a review');
            return;
        }

        if (newRating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setIsSubmittingReview(true);
        const { error } = await supabase
            .from('reviews')
            .insert({
                property_id: property.id,
                user_id: user.id,
                rating: newRating,
                comment: newComment
            });

        if (error) {
            console.error('Error submitting review:', error);
            toast.error('Failed to submit review');
        } else {
            toast.success('Review submitted successfully!');
            setIsReviewModalOpen(false);
            setNewRating(0);
            setNewComment('');
            fetchReviews();
        }
        setIsSubmittingReview(false);
    };

    // -- Helpers --
    const minPrice = roomTypes.length > 0
        ? Math.min(...roomTypes.map((r: any) => r.base_price))
        : 0;

    const galleryImages = property.gallery_urls?.length
        ? property.gallery_urls
        : (property.images?.length ? property.images : []);

    const displayImages = galleryImages.length > 0
        ? galleryImages
        : roomTypes.flatMap((r: any) => r.gallery_urls || (r.images || (r.image_url ? [r.image_url] : []))).filter(Boolean);

    const galleryPageCount = Math.ceil(displayImages.length / 4);
    const currentGalleryImages = Array.from({ length: 4 }).map((_, i) => {
        // Use modulo to cycle through images if we have enough
        if (displayImages.length === 0) return null;
        return displayImages[(galleryPage * 4 + i) % displayImages.length];
    }).filter(Boolean);

    const nextGallery = () => setGalleryPage(p => p + 1);
    const prevGallery = () => setGalleryPage(p => p - 1 < 0 ? galleryPageCount - 1 : p - 1);

    // Auto-transition for gallery
    useEffect(() => {
        if (displayImages.length <= 4) return;

        const interval = setInterval(() => {
            nextGallery();
        }, 3000);

        return () => clearInterval(interval);
    }, [displayImages.length]);

    // Auto-transition for photos section
    useEffect(() => {
        if (displayImages.length <= 3) return;

        const interval = setInterval(() => {
            setPhotosIndex(prev => (prev + 1) % displayImages.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [displayImages.length]);

    const scrollToSection = (ref: React.RefObject<HTMLDivElement>, id: string) => {
        setActiveSection(id);
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const nights = bookingDates.checkIn && bookingDates.checkOut
        ? Math.max(1, Math.ceil((new Date(bookingDates.checkOut).getTime() - new Date(bookingDates.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;

    // -- Cart Logic --
    const addToCart = (item: any, type: 'room' | 'food' | 'bar') => {
        if (type === 'room' && (!bookingDates.checkIn || !bookingDates.checkOut)) {
            toast.error('Please select check-in and check-out dates first');
            document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setCart(prev => {
            const itemWithDetails = type === 'room' ? {
                ...item,
                bookingDates,
                guestDetails,
                quantity: 1,
                calculatedPrice: item.base_price * nights
            } : item;

            if (type === 'food' || type === 'bar') {
                const existing = prev.find(i => i.id === item.id && i.type === type);
                if (existing) {
                    return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i);
                }
                return [...prev, { ...itemWithDetails, type, quantity: 1 }];
            }

            return [...prev, { ...itemWithDetails, type, quantity: 1, calculatedPrice: itemWithDetails.calculatedPrice }];
        });
        setIsCartOpen(true);
        toast.success('Added to cart');
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => prev.map((item, i) => {
            if (i === index) {
                const newQ = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQ };
            }
            return item;
        }).filter(i => i.quantity > 0));
    };

    const cartTotal = cart.reduce((sum, item) => {
        if (item.type === 'room') {
            return sum + (item.calculatedPrice || item.base_price * item.quantity);
        }
        return sum + (item.price || item.base_price) * item.quantity;
    }, 0);

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        try {
            const roomItems = cart.filter(item => item.type === 'room');

            for (const item of roomItems) {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomTypeId: item.id,
                        propertyId: property.id,
                        checkIn: item.bookingDates.checkIn,
                        checkOut: item.bookingDates.checkOut,
                        guestDetails: item.guestDetails
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to book room');
                }
            }

            setCart([]);
            setIsCartOpen(false);
            toast.success('Booking confirmed! We look forward to your stay.');

        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error(`Checkout failed: ${error.message}`);
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 pt-16 md:pt-20">

            <GuestNavbar
                cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
                onCartClick={() => setIsCartOpen(true)}
            />

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
                <Breadcrumb items={[
                    { label: 'Explore', href: '/explore' },
                    { label: property.name }
                ]} />
            </div>

            {/* 2. Hero Section */}
            <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
                {property.cover_image_url ? (
                    <Image src={property.cover_image_url} alt={property.name} fill className="object-cover" unoptimized />
                ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <Building2 className="text-slate-700 w-32 h-32" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                    >
                        <Share size={20} />
                    </button>
                    <button
                        onClick={handleSave}
                        className={`p-2 rounded-full backdrop-blur-md transition-colors ${isSaved ? 'bg-white text-zambia-red' : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                    >
                        <Bookmark size={20} className={isSaved ? 'fill-current' : ''} />
                    </button>
                </div>

                {/* Mobile Search Form - Bottom Position */}
                <div className="md:hidden absolute bottom-6 left-4 right-4 z-30 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-lg">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Check-in</label>
                                <input
                                    type="date"
                                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none p-0"
                                    value={bookingDates.checkIn}
                                    onChange={(e) => setBookingDates(prev => ({ ...prev, checkIn: e.target.value }))}
                                />
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Check-out</label>
                                <input
                                    type="date"
                                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none p-0"
                                    value={bookingDates.checkOut}
                                    min={bookingDates.checkIn}
                                    onChange={(e) => setBookingDates(prev => ({ ...prev, checkOut: e.target.value }))}
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => scrollToSection(roomsRef, 'rooms')}
                            className="w-full py-3 bg-zambia-red text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all text-sm"
                        >
                            Check Availability
                        </button>
                    </div>
                </div>

                {/* Overlay Content Wrapper - Aligned with Max Width */}
                <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 h-full relative">

                        {/* Check Availability Form - Left Side */}
                        <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-6 md:left-12 lg:left-0 pointer-events-auto w-[380px] bg-white rounded-3xl p-6 shadow-2xl animate-in slide-in-from-left-10 duration-700">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="border border-slate-200 rounded-2xl p-3 hover:border-slate-400 transition-colors bg-slate-50">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-wider">Check-in</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            className="w-full text-sm font-bold text-slate-900 bg-transparent outline-none"
                                            value={bookingDates.checkIn}
                                            onChange={(e) => setBookingDates(prev => ({ ...prev, checkIn: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-2xl p-3 hover:border-slate-400 transition-colors bg-slate-50">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-wider">Check-out</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            className="w-full text-sm font-bold text-slate-900 bg-transparent outline-none"
                                            value={bookingDates.checkOut}
                                            min={bookingDates.checkIn}
                                            onChange={(e) => setBookingDates(prev => ({ ...prev, checkOut: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => scrollToSection(roomsRef, 'rooms')}
                                className="w-full py-4 bg-zambia-red hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 text-lg"
                            >
                                Check Availability
                            </button>
                        </div>

                        {/* Gallery Grid Overlay - Desktop Only */}
                        {displayImages.length > 0 && (
                            <div className="hidden xl:block absolute top-24 right-6 md:right-12 lg:right-0 pointer-events-auto w-[400px] lg:w-[480px]">
                                <div className="relative grid grid-cols-3 gap-3">

                                    {/* Navigation Buttons */}
                                    {displayImages.length > 4 && (
                                        <>
                                            <button
                                                onClick={prevGallery}
                                                className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors z-30"
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={nextGallery}
                                                className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors z-30"
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                        </>
                                    )}

                                    <AnimatePresence mode="popLayout">
                                        {/* First 3 images */}
                                        {currentGalleryImages.slice(0, 3).map((img: string, i: number) => (
                                            <div key={`small-${i}`} className="aspect-square relative bg-slate-200 border-8 border-white shadow-2xl overflow-hidden">
                                                <motion.div
                                                    key={`${galleryPage}-${i}`}
                                                    initial={{ rotateY: 90, opacity: 0 }}
                                                    animate={{ rotateY: 0, opacity: 1 }}
                                                    exit={{ rotateY: -90, opacity: 0 }}
                                                    transition={{ duration: 0.5, ease: "easeInOut", delay: i * 0.1 }}
                                                    className="absolute inset-0"
                                                >
                                                    <Image src={img} alt={`Gallery ${i + 1}`} fill className="object-cover" unoptimized />
                                                </motion.div>
                                            </div>
                                        ))}

                                        {/* 4th large image */}
                                        {currentGalleryImages.length > 3 && (
                                            <div className="col-span-3 aspect-[2.5/1] relative bg-slate-200 border-8 border-white shadow-2xl overflow-hidden">
                                                <motion.div
                                                    key={`${galleryPage}-large`}
                                                    initial={{ rotateY: 90, opacity: 0 }}
                                                    animate={{ rotateY: 0, opacity: 1 }}
                                                    exit={{ rotateY: -90, opacity: 0 }}
                                                    transition={{ duration: 0.5, ease: "easeInOut", delay: 0.3 }}
                                                    className="absolute inset-0"
                                                >
                                                    <Image src={currentGalleryImages[3]} alt="Gallery 4" fill className="object-cover" unoptimized />
                                                </motion.div>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute top-24 md:top-auto md:bottom-0 left-0 right-0 p-4 md:p-12 z-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-xs font-bold uppercase tracking-wider mb-4">
                                    <Star size={14} className="fill-white" />
                                    <span>Luxury Stay</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">{property.name}</h1>
                                <div className="flex items-center gap-4 text-white/90 font-medium text-sm md:text-base">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={18} />
                                        {property.city || property.address?.split(',')[0]}, {property.country || 'Zambia'}
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <Star size={18} className={property.review_count > 0 ? "fill-yellow-400 text-yellow-400" : "text-slate-300"} />
                                        {property.review_count > 0 ? (
                                            <span>{property.average_rating} ({property.review_count} Reviews)</span>
                                        ) : (
                                            <span>New</span>
                                        )}
                                    </div>
                                </div>
                            </div>


                            {/* Property Logo */}
                            {property.logo_url && (
                                <div className="hidden md:block w-32 h-32 bg-white rounded-2xl p-2 shadow-2xl rotate-3 transition-transform hover:rotate-0">
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={property.logo_url}
                                            alt={`${property.name} logo`}
                                            fill
                                            className="object-contain rounded-xl"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Sticky Sub-Nav */}
            <div className="sticky top-16 md:top-20 z-40 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-6 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-6 md:gap-8">
                        {[
                            { id: 'overview', label: 'Overview', ref: overviewRef },
                            { id: 'photos', label: 'Photos', ref: photosRef },
                            { id: 'rooms', label: 'Rooms', ref: roomsRef },
                            { id: 'dining', label: 'Dining', ref: diningRef },
                            { id: 'amenities', label: 'Amenities', ref: amenitiesRef },
                            { id: 'location', label: 'Location', ref: locationRef }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.ref, item.id)}
                                className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeSection === item.id ? 'border-black text-black' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Main Content Grid */}
            <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">

                {/* Left Column: Content */}
                <div className="lg:col-span-2 space-y-16">

                    {/* Overview */}
                    <section id="overview" ref={overviewRef} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                <Clock className="text-slate-900" />
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Check-in</p>
                                    <p className="font-bold text-slate-900">{property.check_in_time || '14:00'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                <Clock className="text-slate-900" />
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Check-out</p>
                                    <p className="font-bold text-slate-900">{property.check_out_time || '11:00'}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Photos */}
                    <section id="photos" ref={photosRef} className="space-y-6 scroll-mt-32 md:scroll-mt-40">
                        <h2 className="text-2xl font-bold text-slate-900">Photos</h2>
                        <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                            {(() => {
                                // Calculate visible images with wrapping
                                const visibleImages = [];
                                const count = displayImages.length;
                                if (count > 0) {
                                    for (let i = 0; i < Math.min(count, 3); i++) {
                                        visibleImages.push(displayImages[(photosIndex + i) % count]);
                                    }
                                }
                                return visibleImages.map((img: string, i: number) => (
                                    <div key={`${photosIndex}-${i}`} className="flex-none w-[85vw] md:w-auto snap-center aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 group cursor-pointer relative">
                                        <Image src={img} alt={`Property ${i + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                                    </div>
                                ));
                            })()}
                        </div>
                    </section>

                    {/* Rooms */}
                    <section id="rooms" ref={roomsRef} className="space-y-8 scroll-mt-32 md:scroll-mt-40">
                        <div className="flex justify-between items-end">
                            <h2 className="text-2xl font-bold text-slate-900">Available Rooms</h2>
                            <span className="text-sm font-medium text-slate-500">{roomTypes.length} types available</span>
                        </div>

                        <div className="space-y-6">
                            {roomTypes.map(room => {
                                const isAvailable = availableRoomTypes ? availableRoomTypes.has(room.id) : true;
                                const queryParams = bookingDates.checkIn && bookingDates.checkOut
                                    ? `?checkIn=${bookingDates.checkIn}&checkOut=${bookingDates.checkOut}`
                                    : '';

                                return (
                                    <div key={room.id} className="group border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row bg-white h-auto md:h-52">
                                        <div className="md:w-1/3 relative h-48 md:h-full overflow-hidden">
                                            {room.image_url ? (
                                                <Image src={room.image_url} alt={room.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                    <BedDouble size={32} className="text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{room.name}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1"><User size={14} /> Max {room.capacity}</span>
                                                        <span className="flex items-center gap-1"><BedDouble size={14} /> {room.bed_type || 'King Bed'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-slate-900">K{room.base_price}</p>
                                                    <p className="text-[10px] text-slate-500">/ night</p>
                                                </div>
                                            </div>

                                            <p className="text-slate-600 text-xs line-clamp-2 my-2">{room.description}</p>

                                            <div className="flex items-center justify-between mt-1">
                                                <Link
                                                    href={`/book/${property.slug || property.id}/room/${room.id}${queryParams}`}
                                                    className="text-xs font-bold text-slate-900 underline hover:text-slate-600"
                                                >
                                                    View Details
                                                </Link>
                                                <Link
                                                    href={`/book/${property.slug || property.id}/room/${room.id}${queryParams}`}
                                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all transform active:scale-95 ${isAvailable
                                                            ? 'bg-slate-900 text-white hover:bg-black shadow-md hover:shadow-lg'
                                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                                                        }`}
                                                >
                                                    {isAvailable ? 'Book Now' : 'Unavailable'}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Dining */}
                    {(menuItems.length > 0 || barMenuItems.length > 0) && (
                        <section id="dining" ref={diningRef} className="space-y-8 scroll-mt-24">
                            <h2 className="text-2xl font-bold text-slate-900">Dining & Drinks</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[...menuItems, ...barMenuItems].slice(0, showFullMenu ? undefined : 4).map(item => (
                                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors bg-white">
                                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                                            {item.image_url ? (
                                                <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Utensils className="text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                                                    <span className="font-bold text-slate-900">K{item.price}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                            </div>
                                            <span className="self-end text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wide">
                                                Order on-site
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowFullMenu(!showFullMenu)}
                                className="w-full py-3 border border-slate-200 rounded-xl font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                            >
                                {showFullMenu ? 'Show Less' : 'View Full Menu'}
                            </button>
                        </section>
                    )}

                    {/* Amenities */}
                    <section id="amenities" ref={amenitiesRef} className="space-y-6 scroll-mt-24">
                        <h2 className="text-2xl font-bold text-slate-900">Amenities</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {property.amenities?.map((amenity: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                    <CheckCircle size={20} className="text-slate-900" />
                                    <span className="font-medium text-slate-700">{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Location */}
                    <section id="location" ref={locationRef} className="space-y-6 scroll-mt-32 md:scroll-mt-40">
                        <h2 className="text-2xl font-bold text-slate-900">Location</h2>
                        <div className="aspect-video bg-slate-100 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                            <MapPin size={48} className="text-slate-300 mb-2" />
                            <div className="absolute inset-0 bg-slate-200/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <button className="bg-white px-6 py-3 rounded-full font-bold shadow-lg text-slate-900">
                                    View on Map
                                </button>
                            </div>
                        </div>
                        <p className="text-slate-600">
                            {[property.address, property.city, property.country].filter(Boolean).join(', ')}
                        </p>
                    </section>

                    {/* Reviews */}
                    <section className="space-y-8 pb-20">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-900">Reviews</h2>
                            <button
                                onClick={() => setIsReviewModalOpen(true)}
                                className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors"
                            >
                                Write a Review
                            </button>
                        </div>
                        {reviewsLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                            </div>
                        ) : reviews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-slate-50 p-6 rounded-3xl">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 overflow-hidden relative">
                                                {review.profiles?.avatar_url ? (
                                                    <Image src={review.profiles.avatar_url} alt="User" fill className="object-cover" unoptimized />
                                                ) : (
                                                    <User size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {review.profiles?.first_name || 'Guest'} {review.profiles?.last_name || ''}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={12}
                                                            className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}
                                                        />
                                                    ))}
                                                    <span className="text-slate-400 ml-2">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-slate-50 rounded-3xl">
                                <p className="text-slate-500 font-medium mb-4">No reviews yet. Be the first to review!</p>
                                <button
                                    onClick={() => setIsReviewModalOpen(true)}
                                    className="px-6 py-2 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    Write a Review
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Review Modal */}
                    <Modal
                        isOpen={isReviewModalOpen}
                        onClose={() => setIsReviewModalOpen(false)}
                        title="Write a Review"
                    >
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setNewRating(star)}
                                            className="focus:outline-none transition-transform active:scale-95 hover:scale-110"
                                        >
                                            <Star
                                                size={32}
                                                className={`${star <= newRating
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-slate-300'
                                                    } transition-colors`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Comment</label>
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
                                    placeholder="Share your experience..."
                                />
                            </div>

                            <button
                                onClick={handleSubmitReview}
                                disabled={isSubmittingReview}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmittingReview ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Review'
                                )}
                            </button>
                        </div>
                    </Modal>

                </div>

                {/* Right Column: Sticky Booking Widget */}
                <div className="lg:col-span-1 relative">
                    <div className="sticky top-28 space-y-6" id="booking-widget">
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                            <div className="mb-6">
                                <span className="text-sm text-slate-500 font-bold block mb-1">From</span>
                                <span className="text-3xl font-black text-slate-900">K{minPrice}</span>
                                <span className="text-slate-500 font-medium"> / night</span>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 border border-slate-200 rounded-xl hover:border-slate-400 transition-colors bg-slate-50">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Check-in</label>
                                        <input
                                            type="date"
                                            className="w-full bg-transparent font-bold text-sm outline-none"
                                            value={bookingDates.checkIn}
                                            onChange={(e) => setBookingDates(prev => ({ ...prev, checkIn: e.target.value }))}
                                        />
                                    </div>
                                    <div className="p-3 border border-slate-200 rounded-xl hover:border-slate-400 transition-colors bg-slate-50">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Check-out</label>
                                        <input
                                            type="date"
                                            className="w-full bg-transparent font-bold text-sm outline-none"
                                            value={bookingDates.checkOut}
                                            min={bookingDates.checkIn}
                                            onChange={(e) => setBookingDates(prev => ({ ...prev, checkOut: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="w-full py-4 bg-zambia-red text-white rounded-xl font-bold text-lg hover:bg-red-600 transition-all shadow-lg hover:shadow-xl active:scale-95"
                                    onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Check Availability
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                                <p className="text-sm text-slate-500 font-medium">No payment charged yet</p>
                            </div>
                        </div>

                        {/* Host Info */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center relative">
                                <User size={24} className="text-slate-400" />
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                                    <BadgeCheck size={12} className="text-white fill-blue-500" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900">Verified by Zamora</p>
                                    <BadgeCheck size={16} className="text-blue-500 fill-blue-500/10" />
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Official partner</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Booking Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 md:hidden z-50 flex justify-between items-center safe-area-bottom">
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">From</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-xl font-black text-slate-900">K{minPrice}</p>
                        <p className="text-xs text-slate-500 font-medium">/ night</p>
                    </div>
                </div>
                <button
                    onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-zambia-red text-white px-8 py-3 rounded-full font-bold shadow-lg"
                >
                    Check Availability
                </button>
            </div>

            {/* Cart Modal Overlay */}
            {isCartOpen && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <ShoppingBag size={20} /> Your Cart
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                                    <ShoppingBag size={64} className="opacity-20" />
                                    <p className="font-medium">Your cart is empty</p>
                                    <button onClick={() => setIsCartOpen(false)} className="text-black font-bold underline">
                                        Start Browsing
                                    </button>
                                </div>
                            ) : (
                                cart.map((item, index) => (
                                    <div key={index} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                                            {item.image_url ? (
                                                <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    {item.type === 'room' ? <BedDouble size={24} /> : <Utensils size={24} />}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                                                    {item.type === 'room' && (
                                                        <p className="text-[10px] text-slate-500 mt-1">
                                                            {item.bookingDates?.checkIn} - {item.bookingDates?.checkOut}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="font-bold text-slate-900 text-sm">
                                                    K{item.type === 'room' ? item.calculatedPrice : item.price * item.quantity}
                                                </p>
                                            </div>

                                            <div className="flex justify-between items-end mt-2">
                                                {item.type === 'food' ? (
                                                    <div className="flex items-center gap-3 bg-slate-100 rounded-full px-2 py-1">
                                                        <button onClick={() => updateQuantity(index, -1)} className="p-1 hover:bg-white rounded-full text-slate-500"><Minus size={12} /></button>
                                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(index, 1)} className="p-1 hover:bg-white rounded-full text-slate-900"><Plus size={12} /></button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
                                                        {nights} nights
                                                    </span>
                                                )}
                                                <button onClick={() => removeFromCart(index)} className="text-xs font-bold text-red-500 hover:text-red-600">Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-slate-500 font-medium">Total</span>
                                <span className="text-3xl font-black text-slate-900">K{cartTotal}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isCheckingOut}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isCheckingOut ? (
                                    <>
                                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Processing...
                                    </>
                                ) : 'Checkout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
