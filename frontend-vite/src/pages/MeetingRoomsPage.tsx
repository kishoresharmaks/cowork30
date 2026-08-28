import React, { useState, useEffect } from 'react';
import { Users, Clock, ShieldCheck, Sparkles, Filter, Calendar } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RazorpayGatewayModal from '@/components/ui/RazorpayGatewayModal';
import UnauthorizedNoticeModal from '@/components/ui/UnauthorizedNoticeModal';
import { apiClient } from '@/lib/api-client';
import { useBranch } from '@/context/BranchContext';
import { useAuth } from '@/context/AuthContext';

export default function MeetingRoomsPage() {
  const { activeBranch } = useBranch();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [attendeesCount, setAttendeesCount] = useState(2);
  const [selectedHours, setSelectedHours] = useState(2);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);

  useEffect(() => {
    const branchQuery = activeBranch?.id ? `?branchId=${activeBranch.id}` : '';
    apiClient.get(`/meeting-rooms${branchQuery}`)
      .then((res) => {
        setRooms(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      })
      .catch((err) => console.error('Failed to load meeting rooms:', err))
      .finally(() => setLoading(false));
  }, [activeBranch]);

  const calculateTotalPrice = (room: any) => {
    if (!room) return 0;
    const baseHourly = Number(room.hourlyRate) * selectedHours;
    const seatAddon = (Number(room.perSeatPrice) || 0) * attendeesCount;
    return baseHourly + seatAddon;
  };

  const handleBookNow = (room: any) => {
    setSelectedRoom(room);
    setShowCheckoutModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Executive Meeting Suites & Boardrooms
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Hourly and daily conference suites with 4K AV displays, video conferencing & beverage service.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
            <Filter className="w-4 h-4 text-rose-500" />
            <span>Active Hub: <strong>{activeBranch ? activeBranch.name : 'All Hubs'}</strong></span>
          </div>
        </div>

        {/* Meeting Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col">
              <div className="relative h-48 bg-slate-200">
                <img
                  src={room.images?.[0] || 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80'}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Users className="w-3 h-3 text-rose-400" /> Up to {room.capacity} Seats
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{room.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{room.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Hourly Rate</div>
                    <div className="text-lg font-black text-rose-600">₹{Number(room.hourlyRate).toLocaleString()}</div>
                  </div>

                  <button
                    onClick={() => handleBookNow(room)}
                    className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Book Suite
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Checkout Gateway Modal */}
      {selectedRoom && (
        <RazorpayGatewayModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          bookingDetails={{
            amount: calculateTotalPrice(selectedRoom),
            description: `${selectedRoom.name} (${selectedHours} Hours for ${attendeesCount} Attendees)`,
            customerName: user?.name || 'Guest User',
            customerEmail: user?.email || 'guest@cowork30.com',
            customerPhone: user?.phone || '+1 555-000-0000',
          }}
          onSuccess={(paymentId) => {
            alert(`Booking confirmed! Payment Reference: ${paymentId}`);
            setShowCheckoutModal(false);
          }}
          onUnauthorized={() => {
            setShowCheckoutModal(false);
            setShowUnauthorizedModal(true);
          }}
        />
      )}

      {/* Unauthorized 401 Notice Modal */}
      <UnauthorizedNoticeModal
        isOpen={showUnauthorizedModal}
        onClose={() => setShowUnauthorizedModal(false)}
        returnUrl="/meeting-rooms"
      />

      <Footer />
    </div>
  );
}
