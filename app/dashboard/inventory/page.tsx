'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useProperty } from '../context/PropertyContext';
import { addDays, format, isSameDay, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import NewBookingModal from '@/components/dashboard/NewBookingModal';
import EditBookingModal from '@/components/dashboard/EditBookingModal';
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function InventoryPage() {
  const [startDate, setStartDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { selectedPropertyId } = useProperty();
  const daysToShow = 14;
  const { rooms, bookings, loading, refetch } = useInventory(startDate, daysToShow, selectedPropertyId);

  // Generate array of dates to display
  const dates = Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
         <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium">Loading inventory...</p>
         </div>
      </div>
    );
  }

  const getBookingForCell = (roomId: string, date: Date) => {
    return bookings.find(booking => {
      const start = startOfDay(parseISO(booking.check_in_date));
      const end = startOfDay(parseISO(booking.check_out_date));
      const current = startOfDay(date);
      return booking.room_id === roomId && 
             (isSameDay(current, start) || (current > start && current < end)); // Logic for stay duration
    });
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Room Bookings</h2>
          <p className="text-slate-500 text-sm">Manage room availability and bookings.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
           <button
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/10"
           >
             <Plus size={16} /> New Booking
           </button>

           <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
             <button 
               onClick={() => setStartDate(addDays(startDate, -7))}
               className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
               title="Previous Week"
             >
               <ChevronLeft size={16} />
             </button>
             <button 
               onClick={() => setStartDate(new Date())}
               className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-2"
             >
               <Calendar size={14} /> Today
             </button>
             <button 
               onClick={() => setStartDate(addDays(startDate, 7))}
               className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
               title="Next Week"
             >
               <ChevronRight size={16} />
             </button>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white shadow-sm rounded-2xl border border-slate-200 flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="min-w-full divide-y divide-slate-100 border-separate border-spacing-0">
            <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 bg-slate-50 px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 w-[200px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                  Room
                </th>
                {dates.map(date => {
                  const isToday = isSameDay(date, new Date());
                  return (
                    <th key={date.toISOString()} className={`px-2 py-3 text-center text-xs border-b border-slate-200 min-w-[100px] ${isToday ? 'bg-blue-50/50' : ''}`}>
                      <div className={`font-black text-lg ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{format(date, 'd')}</div>
                      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                        <span>{format(date, 'MMM')}</span>
                        <span>•</span>
                        <span>{format(date, 'EEE')}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {rooms.map(room => (
                <tr key={room.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-6 py-4 whitespace-nowrap border-r border-slate-100 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-lg">Room {room.room_number}</span>
                      <span className="text-xs font-medium text-slate-500 mb-2">{room.room_types?.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${
                        room.status === 'clean' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        room.status === 'dirty' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        room.status === 'maintenance' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {room.status}
                      </span>
                    </div>
                  </td>
                  {dates.map(date => {
                    const booking = getBookingForCell(room.id, date);
                    const isStart = booking && isSameDay(startOfDay(parseISO(booking.check_in_date)), startOfDay(date));
                    const isEnd = booking && isSameDay(startOfDay(parseISO(booking.check_out_date)), startOfDay(date));
                    const isToday = isSameDay(date, new Date());
                    
                    return (
                      <td key={date.toISOString()} className={`px-1 py-2 whitespace-nowrap text-center relative h-24 border-r border-slate-50/50 ${isToday ? 'bg-blue-50/10' : ''}`}>
                        {booking ? (
                          <div 
                            onClick={() => {
                                setSelectedBooking(booking);
                                setIsEditModalOpen(true);
                            }}
                            className={`
                              h-full rounded-lg text-xs flex flex-col items-center justify-center px-2 overflow-hidden cursor-pointer hover:brightness-95 transition-all shadow-sm
                              ${booking.status === 'confirmed' 
                                ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}
                              ${isStart ? 'ml-1' : '-ml-1'} 
                              ${isEnd ? 'mr-1' : '-mr-1'}
                            `}
                            title={`${booking.guests?.first_name} ${booking.guests?.last_name}`}
                          >
                             {isStart && (
                               <>
                                <span className="font-bold truncate w-full text-center">{booking.guests?.first_name}</span>
                                <span className="text-[10px] opacity-70 truncate w-full text-center">{booking.guests?.last_name}</span>
                               </>
                             )}
                          </div>
                        ) : (
                          <div className="h-full w-full rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group/cell relative">
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 text-slate-300">
                                <Plus size={14} />
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <NewBookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={refetch} 
        propertyId={selectedPropertyId}
      />
      
      <EditBookingModal
        isOpen={isEditModalOpen}
        onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBooking(null);
        }}
        onSuccess={refetch}
        booking={selectedBooking}
        propertyId={selectedPropertyId}
      />
    </div>
  );
}
