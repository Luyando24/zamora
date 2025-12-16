'use client';

import { useEffect, useState, use } from 'react';
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
  const { properties, loading: contextLoading } = useProperty();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zambia-green"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Property Not Found</h2>
        <p className="text-slate-500 mt-2">The property you are looking for does not exist or you don't have access to it.</p>
        <Link href="/dashboard/properties" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700">
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
          <Link href="/dashboard/properties" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-2 transition-colors text-sm">
            <ArrowLeft size={16} className="mr-1" /> Back to Properties
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <TypeIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{property.name}</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="capitalize">{property.type?.replace('_', ' ')}</span>
                <span>•</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  property.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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
             className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium shadow-sm flex items-center gap-2"
           >
             <ExternalLink size={18} /> Public Page
           </Link>
           <Link 
             href={`/dashboard/properties/${property.id}/edit`}
             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm flex items-center gap-2"
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="aspect-video relative bg-slate-100">
              {property.cover_image_url ? (
                <img src={property.cover_image_url} alt={property.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <Building2 size={64} className="opacity-20" />
                </div>
              )}
            </div>
            {property.gallery_urls && property.gallery_urls.length > 0 && (
              <div className="p-4 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-900 mb-3">Gallery</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {property.gallery_urls.map((url: string, index: number) => (
                    <div key={index} className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
                      <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Amenities & Features</h3>
            {property.amenities && property.amenities.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.amenities.map((amenity: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-slate-700">
                    <CheckCircle size={16} className="text-zambia-green flex-shrink-0" />
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No amenities listed.</p>
            )}
          </div>

        </div>

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          
          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">Address</p>
                  <p className="text-slate-700">{property.address || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">Phone</p>
                  <p className="text-slate-700">{property.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">Email</p>
                  <p className="text-slate-700 break-all">{property.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">Website</p>
                  {property.website_url ? (
                    <a href={property.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {property.website_url}
                    </a>
                  ) : (
                    <p className="text-slate-700">N/A</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Property Stats</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-3 bg-slate-50 rounded-lg text-center">
                 <CalendarDays className="mx-auto text-blue-500 mb-1" size={20} />
                 <p className="text-xs text-slate-500">Bookings</p>
                 <p className="font-bold text-slate-900">-</p>
               </div>
               <div className="p-3 bg-slate-50 rounded-lg text-center">
                 <Users className="mx-auto text-green-500 mb-1" size={20} />
                 <p className="text-xs text-slate-500">Guests</p>
                 <p className="font-bold text-slate-900">-</p>
               </div>
               <div className="p-3 bg-slate-50 rounded-lg text-center">
                 <Utensils className="mx-auto text-orange-500 mb-1" size={20} />
                 <p className="text-xs text-slate-500">Orders</p>
                 <p className="font-bold text-slate-900">-</p>
               </div>
               <div className="p-3 bg-slate-50 rounded-lg text-center">
                 <BedDouble className="mx-auto text-purple-500 mb-1" size={20} />
                 <p className="text-xs text-slate-500">Rooms</p>
                 <p className="font-bold text-slate-900">-</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
