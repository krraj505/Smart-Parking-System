import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  Car,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  IndianRupee,
  ChevronRight,
  X,
  FileText,
  Building2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import type { Reservation, ReservationStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export const ReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'upcoming' | 'active' | 'completed' | 'cancelled'>('all');

  // Cancel Modal
  const [resToCancel, setResToCancel] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Personal schedule change');
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Digital Gate Pass QR Modal
  const [activeGatePass, setActiveGatePass] = useState<Reservation | null>(null);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await api.getReservations();
      setReservations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancelSubmit = async () => {
    if (!resToCancel) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const updated = await api.cancelReservation(resToCancel.id, cancelReason);
      setReservations(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setResToCancel(null);
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel reservation.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Filter reservations based on active tab
  const filteredReservations = reservations.filter(res => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'upcoming') return res.status === 'confirmed';
    if (selectedTab === 'active') return res.status === 'checked_in';
    if (selectedTab === 'completed') return res.status === 'completed';
    if (selectedTab === 'cancelled') return res.status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
          label: 'Confirmed',
          icon: CheckCircle2,
        };
      case 'checked_in':
        return {
          bg: 'bg-electric-500/10 text-electric-500 border-electric-500/30',
          label: 'Checked In',
          icon: Clock,
        };
      case 'completed':
        return {
          bg: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
          label: 'Completed',
          icon: ShieldCheck,
        };
      case 'cancelled':
        return {
          bg: 'bg-red-500/10 text-red-500 border-red-500/30',
          label: 'Cancelled',
          icon: XCircle,
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          label: status,
          icon: AlertCircle,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-electric-500" />
            My Parking Reservations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track active bookings, view entry gate passes, or cancel scheduled reservations.
          </p>
        </div>

        <button
          onClick={() => navigate('/find-parking')}
          className="px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue transition-all"
        >
          + Book New Parking
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-navy-800 pb-2">
        {[
          { id: 'all', label: 'All Bookings', count: reservations.length },
          { id: 'upcoming', label: 'Upcoming', count: reservations.filter(r => r.status === 'confirmed').length },
          { id: 'active', label: 'Checked In', count: reservations.filter(r => r.status === 'checked_in').length },
          { id: 'completed', label: 'Completed', count: reservations.filter(r => r.status === 'completed').length },
          { id: 'cancelled', label: 'Cancelled', count: reservations.filter(r => r.status === 'cancelled').length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedTab === tab.id
                ? 'bg-electric-600 text-white shadow-glow-blue'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse h-40"
            />
          ))}
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-3">
          <CalendarCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No reservations found in this view</h3>
          <p className="text-xs text-slate-400">Search available parking facilities and book a bay in seconds.</p>
          <button
            onClick={() => navigate('/find-parking')}
            className="px-5 py-2 rounded-xl bg-electric-600 text-white text-xs font-bold"
          >
            Find Parking Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map(res => {
            const badge = getStatusBadge(res.status);
            const StatusIcon = badge.icon;
            const startDate = new Date(res.start_time);
            const endDate = new Date(res.end_time);

            return (
              <div
                key={res.id}
                className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-slate-300 dark:hover:border-navy-700 transition-all space-y-4"
              >
                {/* Top Row: Ref & Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-navy-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white tracking-wider bg-slate-100 dark:bg-navy-800 px-3 py-1 rounded-lg">
                      {res.booking_reference}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Charged</span>
                    <span className="text-base font-black text-electric-600 dark:text-electric-400">
                      ₹{res.final_amount ?? res.estimated_amount}
                    </span>
                  </div>
                </div>

                {/* Center Row: Facility & Slot & Vehicle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Facility & Bay
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{res.lot?.name || 'Smart Complex'}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      Slot: <span className="font-black text-electric-500">{res.slot?.slot_number}</span> (
                      {res.slot?.floor_level})
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Schedule Window
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {startDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Registered Vehicle
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white font-mono">
                      {res.vehicle?.registration_number}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {res.vehicle?.make} {res.vehicle?.model} ({res.vehicle?.vehicle_type?.toUpperCase()})
                    </p>
                  </div>
                </div>

                {/* Lifecycle Progress Timeline */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5 px-1">
                    <span className="text-electric-500">1. Booked</span>
                    <span className={res.status !== 'pending' ? 'text-electric-500' : ''}>2. Confirmed</span>
                    <span className={['checked_in', 'completed'].includes(res.status) ? 'text-electric-500' : ''}>
                      3. Checked In
                    </span>
                    <span className={res.status === 'completed' ? 'text-electric-500' : ''}>4. Completed</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-electric-500 rounded-full transition-all duration-500 ${
                        res.status === 'cancelled'
                          ? 'bg-red-500 w-full'
                          : res.status === 'completed'
                          ? 'w-full'
                          : res.status === 'checked_in'
                          ? 'w-3/4'
                          : res.status === 'confirmed'
                          ? 'w-1/2'
                          : 'w-1/4'
                      }`}
                    />
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Booked on {new Date(res.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Digital Gate Pass Button */}
                    {['confirmed', 'checked_in'].includes(res.status) && (
                      <button
                        onClick={() => setActiveGatePass(res)}
                        className="px-3 py-1.5 rounded-xl bg-electric-500/10 hover:bg-electric-500/20 text-electric-600 dark:text-electric-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Gate Pass
                      </button>
                    )}

                    {/* Cancel Action */}
                    {res.status === 'confirmed' && (
                      <button
                        onClick={() => setResToCancel(res)}
                        className="px-3 py-1.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold text-xs transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Digital Gate Pass QR Modal */}
      {activeGatePass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setActiveGatePass(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-electric-500/10 text-electric-500 uppercase tracking-widest">
                Digital Gate Pass
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {activeGatePass.lot?.name}
              </h3>
              <p className="text-xs text-slate-400">Present this gate token at the entry RFID barrier</p>
            </div>

            {/* Simulated QR Pattern Box */}
            <div className="p-6 bg-slate-50 dark:bg-navy-950 rounded-2xl border border-slate-200 dark:border-navy-800 flex flex-col items-center justify-center">
              <div className="w-36 h-36 bg-white p-3 rounded-2xl shadow-inner flex flex-col items-center justify-center border-4 border-slate-900">
                <QrCode className="w-28 h-28 text-slate-950" />
              </div>
              <span className="font-mono text-sm font-black text-slate-900 dark:text-white mt-3 tracking-widest">
                {activeGatePass.booking_reference}
              </span>
              <span className="text-[11px] font-bold text-electric-500 mt-0.5">
                SLOT: {activeGatePass.slot?.slot_number} ({activeGatePass.slot?.floor_level})
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 text-left bg-slate-50 dark:bg-navy-950/60 p-3 rounded-xl border border-slate-100 dark:border-navy-800">
              <div className="flex justify-between">
                <span>Vehicle:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {activeGatePass.vehicle?.registration_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Arrival Window:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {new Date(activeGatePass.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveGatePass(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-750 text-slate-800 dark:text-slate-200 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {resToCancel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setResToCancel(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 uppercase tracking-wider">
                Cancel Reservation
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Cancel Booking {resToCancel.booking_reference}?
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Slot {resToCancel.slot?.slot_number} at {resToCancel.lot?.name} will be immediately released back to
                public availability.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-semibold">
                {cancelError}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Original Estimated Total:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{resToCancel.estimated_amount}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Cancellation Policy:</span>
                <span className="font-bold text-emerald-500">Free (&gt;2 hrs prior)</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setResToCancel(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={cancelLoading}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
