'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { addDays, format, isSameDay, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import NewBookingModal from '@/components/dashboard/NewBookingModal';
import { Plus } from 'lucide-react';

export default function InventoryPage() {
  const [startDate, setStartDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const daysToShow = 14;
  const { rooms, bookings, loading, refetch } = useInventory(startDate, daysToShow);

  // Generate array of dates to display
  const dates = Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));

  if (loading) {
    return <div className="p-6">Loading inventory...</div>;
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
    <div className="flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Grid</h2>
        <div className="flex gap-2">
           <button
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-4 py-1 bg-zambia-orange text-white rounded hover:bg-zambia-orange/90 mr-4"
           >
             <Plus size={16} /> New Booking
           </button>

           <button 
             onClick={() => setStartDate(addDays(startDate, -7))}
             className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
           >
             Previous
           </button>
           <button 
             onClick={() => setStartDate(new Date())}
             className="px-3 py-1 bg-zambia-green text-white rounded hover:bg-zambia-green/90"
           >
             Today
           </button>
           <button 
             onClick={() => setStartDate(addDays(startDate, 7))}
             className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
           >
             Next
           </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Room
              </th>
              {dates.map(date => (
                <th key={date.toISOString()} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  <div className="font-bold">{format(date, 'd')}</div>
                  <div className="text-[10px]">{format(date, 'MMM')}</div>
                  <div className="text-[10px] text-gray-400">{format(date, 'EEE')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rooms.map(room => (
              <tr key={room.id}>
                <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                  <div className="flex flex-col">
                    <span>{room.room_number}</span>
                    <span className="text-xs text-gray-500">{room.room_types?.name}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded mt-1 w-fit ${
                      room.status === 'clean' ? 'bg-green-100 text-green-800' :
                      room.status === 'dirty' ? 'bg-red-100 text-red-800' :
                      room.status === 'maintenance' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {room.status}
                    </span>
                  </div>
                </td>
                {dates.map(date => {
                  const booking = getBookingForCell(room.id, date);
                  const isStart = booking && isSameDay(startOfDay(parseISO(booking.check_in_date)), startOfDay(date));
                  const isEnd = booking && isSameDay(startOfDay(parseISO(booking.check_out_date)), startOfDay(date));
                  
                  return (
                    <td key={date.toISOString()} className="px-1 py-2 whitespace-nowrap text-center relative h-16 border-r border-gray-100">
                      {booking ? (
                        <div 
                          className={`
                            h-full rounded-md text-xs flex items-center justify-center px-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity
                            ${booking.status === 'confirmed' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}
                            ${isStart ? 'ml-1' : '-ml-1'} 
                            ${isEnd ? 'mr-1' : '-mr-1'}
                          `}
                          title={`${booking.guests?.first_name} ${booking.guests?.last_name}`}
                        >
                           {isStart && <span className="font-bold truncate">{booking.guests?.first_name}</span>}
                        </div>
                      ) : (
                        <div className="h-full hover:bg-gray-50 cursor-pointer" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <NewBookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={refetch} 
      />
    </div>
  );
}
