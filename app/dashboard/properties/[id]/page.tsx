'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useProperty } from '../../context/PropertyContext';
import { 
  Building2, MapPin, Phone, Mail, Globe, 
  BedDouble, Home, Sun, Car, Tent, Building,
  ArrowLeft, Edit, ExternalLink, CalendarDays,
  Utensils, Users, CheckCircle, Clock
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const PROPERTY_ICONS: Record<string, any> = {
  hotel: Building2,
  lodge: Home,
  guest_house: BedDouble,
  apartment: Building,
  resort: Sun,
  motel: Car,
  campsite: Tent,
};

export default function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { properties, isLoading: contextLoading } = useProperty();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contextLoading) {
      const found = properties.find(p => p.id === id);
      setProperty(found || null);
      setLoading(false);
    }
  }, [id, properties, contextLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Property Not Found</h2>
        <p className="text-slate-500 mt-2">The property you are looking for does not exist or you don&apos;t have access to it.</p>
        <Link href="/dashboard/properties" className="mt-4 inline-flex items-center text-primary hover:text-primary/90 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Properties
        </Link>
      </div>
    );
  }

  const TypeIcon = PROPERTY_ICONS[property.type] || Building2;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/properties" className="inline-flex items-center text-slate-500 hover:text-primary mb-2 transition-colors text-sm font-medium">
            <ArrowLeft size={16} className="mr-1" /> Back to Properties
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <TypeIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{property.name}</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="capitalize">{property.type?.replace('_', ' ')}</span>
                <span>•</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  property.subscription_status === 'active' ? 'bg-primary/10 text-primary' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {property.subscription_status === 'active' ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {property.subscription_status || 'Trial'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
           <Link 
             href={`/book/${property.id}`} 
             target="_blank"
             className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium shadow-sm flex items-center gap-2 transition-all"
           >
             <ExternalLink size={18} /> Public Page
           </Link>
           <Link 
             href={`/dashboard/properties/${property.id}/edit`}
             className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium shadow-md shadow-primary/10 flex items-center gap-2 transition-all"
           >
             <Edit size={18} /> Edit Property
           </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Cover Image */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="aspect-video relative bg-slate-50">
              {property.cover_image_url ? (
                <Image 
                  src={property.cover_image_url} 
                  alt={property.name} 
                  fill 
                  className="object-cover" 
                  unoptimized 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-200">
                  <Building2 size={64} />
                </div>
              )}
            </div>
            {property.gallery_urls && property.gallery_urls.length > 0 && (
              <div className="p-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Gallery</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {property.gallery_urls.map((url: string, index: number) => (
                    <div key={index} className="h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 relative shadow-sm hover:border-primary transition-colors cursor-pointer">
                      <Image src={url} alt={`Gallery ${index}`} fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Amenities & Features</h3>
            {property.amenities && property.amenities.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities.map((amenity: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle size={18} className="text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{typeof amenity === 'object' ? amenity.name : amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic bg-slate-50 p-6 rounded-xl text-center border border-dashed border-slate-200">No amenities listed.</p>
            )}
          </div>

        </div>

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          
          {/* Contact Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Address</p>
                  <p className="text-sm text-slate-700 font-medium">{property.address || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Phone</p>
                  <p className="text-sm text-slate-700 font-medium">{property.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Email</p>
                  <p className="text-sm text-slate-700 font-medium break-all">{property.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Website</p>
                  {property.website_url ? (
                    <a href={property.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium break-all">
                      {property.website_url}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-700 font-medium">N/A</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Property Stats</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100 hover:border-primary/20 transition-colors group">
                 <CalendarDays className="mx-auto text-primary mb-2 group-hover:scale-110 transition-transform" size={24} />
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bookings</p>
                 <p className="text-lg font-bold text-slate-900">-</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100 hover:border-primary/20 transition-colors group">
                 <Users className="mx-auto text-primary mb-2 group-hover:scale-110 transition-transform" size={24} />
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Guests</p>
                 <p className="text-lg font-bold text-slate-900">-</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100 hover:border-primary/20 transition-colors group">
                 <Utensils className="mx-auto text-primary mb-2 group-hover:scale-110 transition-transform" size={24} />
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Orders</p>
                 <p className="text-lg font-bold text-slate-900">-</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100 hover:border-primary/20 transition-colors group">
                 <BedDouble className="mx-auto text-primary mb-2 group-hover:scale-110 transition-transform" size={24} />
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rooms</p>
                 <p className="text-lg font-bold text-slate-900">-</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
