import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Building2,
  Car,
  Clock,
  IndianRupee,
  Zap,
  CheckCircle2,
  Calendar,
  Shield,
  Accessibility,
  ArrowRight,
  Sparkles,
  Info,
  ChevronRight,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import type { ParkingLot, Vehicle } from '../types';
import { useAuth } from '../context/AuthContext';

export const FindParkingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Search parameters
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [area, setArea] = useState('all');
  const [vehicleType, setVehicleType] = useState('car');
  const [arrivalDate, setArrivalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [arrivalTime, setArrivalTime] = useState('10:00');
  const [departureTime, setDepartureTime] = useState('13:00');
  const [maxBudget, setMaxBudget] = useState<number | ''>('');
  const [requiresEv, setRequiresEv] = useState(false);
  const [requiresAccessible, setRequiresAccessible] = useState(false);
  const [sortBy, setSortBy] = useState('availability');

  // Results
  const [results, setResults] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal State
  const [selectedLotForBooking, setSelectedLotForBooking] = useState<ParkingLot | null>(null);
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('simulated_upi');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Fetch facilities
  const executeSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const arrivalIso = `${arrivalDate}T${arrivalTime}:00`;
      const departureIso = `${arrivalDate}T${departureTime}:00`;

      const data = await api.searchParking({
        query: query.trim() || undefined,
        area: area !== 'all' ? area : undefined,
        vehicle_type: vehicleType,
        arrival_time: arrivalIso,
        departure_time: departureIso,
        max_hourly_budget: maxBudget ? Number(maxBudget) : undefined,
        requires_ev: requiresEv,
        requires_accessible: requiresAccessible,
        sort_by: sortBy,
      });
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to search parking facilities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [sortBy]);

  // Load vehicles when booking modal opens
  const handleOpenBooking = async (lot: ParkingLot) => {
    setSelectedLotForBooking(lot);
    setBookingError(null);
    setBookingSuccess(null);
    if (isAuthenticated) {
      try {
        const vehicles = await api.getVehicles();
        setUserVehicles(vehicles);
        if (vehicles.length > 0) {
          setSelectedVehicleId(vehicles[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedLotForBooking) return;
    if (!selectedVehicleId) {
      setBookingError('Please select or register a vehicle.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    try {
      const arrivalIso = `${arrivalDate}T${arrivalTime}:00`;
      const departureIso = `${arrivalDate}T${departureTime}:00`;

      const reservation = await api.createReservation({
        lot_id: selectedLotForBooking.id,
        vehicle_id: Number(selectedVehicleId),
        start_time: arrivalIso,
        end_time: departureIso,
        payment_method: paymentMethod,
      });

      setBookingSuccess(`Booking Confirmed! Reference: ${reservation.booking_reference}`);
      setTimeout(() => {
        setSelectedLotForBooking(null);
        navigate(`/reservations/${reservation.id}`);
      }, 1800);
    } catch (err: any) {
      setBookingError(err.message || 'Slot allocation failed. Try adjusting time or facility.');
    } finally {
      setBookingLoading(false);
    }
  };

  const parseFacilitiesList = (facStr?: string): string[] => {
    if (!facStr) return ['Covered Parking', 'CCTV 24/7', 'Security'];
    try {
      return JSON.parse(facStr);
    } catch {
      return facStr.split(',').map(s => s.trim());
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-electric-500" />
          Find Smart Parking
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Search live availability across smart parking complexes. Filter by amenities, vehicle category, and rates.
        </p>
      </div>

      {/* Search Criteria Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            executeSearch();
          }}
          className="space-y-4"
        >
          {/* Row 1: Search Query + Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Facility Name or Address
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Cyber Gateway, Mindspace, Airport Terminal..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-electric-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Zone / Area
              </label>
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 font-medium"
              >
                <option value="all">All Zones</option>
                <option value="HITEC City">HITEC City</option>
                <option value="Banjara Hills">Banjara Hills</option>
                <option value="Shamshabad">Shamshabad (Airport)</option>
                <option value="Jubilee Hills">Jubilee Hills</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date, Time & Vehicle Type */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={e => setArrivalDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Arrival Time
              </label>
              <input
                type="time"
                value={arrivalTime}
                onChange={e => setArrivalTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Departure Time
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={e => setDepartureTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Vehicle Category
              </label>
              <select
                value={vehicleType}
                onChange={e => {
                  setVehicleType(e.target.value);
                  if (e.target.value === 'ev') setRequiresEv(true);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 font-medium"
              >
                <option value="car">Car (Sedan/Hatchback)</option>
                <option value="suv">SUV / MUV</option>
                <option value="motorcycle">Motorcycle / Two-Wheeler</option>
                <option value="ev">Electric Vehicle (EV)</option>
                <option value="van">Van / Minibus</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Max Rate (₹/hr)
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={maxBudget}
                onChange={e => setMaxBudget(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
              />
            </div>
          </div>

          {/* Row 3: Feature Toggles & Search Action */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-navy-800 gap-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={requiresEv}
                  onChange={e => setRequiresEv(e.target.checked)}
                  className="rounded text-electric-600 focus:ring-electric-500 w-4 h-4"
                />
                <Zap className="w-3.5 h-3.5 text-electric-500" />
                EV Charging Required
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={requiresAccessible}
                  onChange={e => setRequiresAccessible(e.target.checked)}
                  className="rounded text-electric-600 focus:ring-electric-500 w-4 h-4"
                />
                <Accessibility className="w-3.5 h-3.5 text-purple-500" />
                Accessible / Disability Bay
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue flex items-center gap-2 transition-all"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching Facilities...' : 'Search Available Facilities'}
            </button>
          </div>
        </form>
      </div>

      {/* Sort & Results Bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Showing <span className="text-electric-500">{results.length}</span> matching facilities
        </p>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-electric-500"
          >
            <option value="availability">Highest Availability</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="capacity">Total Capacity</option>
          </select>
        </div>
      </div>

      {/* Results Facility Cards Grid (MAP-FREE) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse h-52"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-navy-900 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      ) : results.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-3">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No parking facilities match your criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your budget limit, vehicle category, or reservation time window.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {results.map(lot => {
            const amenities = parseFacilitiesList(lot.facilities);
            const isFull = lot.available_slots === 0;

            return (
              <div
                key={lot.id}
                className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-electric-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Name + Rate */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400">
                          {lot.code}
                        </span>
                        {lot.is_24_7 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                            24/7 Open
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                            {lot.open_time} - {lot.close_time}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                        {lot.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{lot.address}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xl font-black text-slate-900 dark:text-white">₹{lot.base_hourly_rate}</span>
                      <span className="text-[11px] text-slate-400 block font-medium">per hour</span>
                    </div>
                  </div>

                  {/* Availability Gauge */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Slot Availability</span>
                      <span
                        className={`font-black ${
                          isFull
                            ? 'text-red-500'
                            : lot.available_slots < 5
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}
                      >
                        {isFull ? 'COMPLETELY FULL' : `${lot.available_slots} Slots Available`}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? 'bg-red-500'
                            : lot.available_slots < 5
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${lot.total_capacity > 0 ? (lot.available_slots / lot.total_capacity) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Total Capacity: {lot.total_capacity}</span>
                      <span>Occupied: {lot.occupied_slots}</span>
                      <span>Reserved: {lot.reserved_slots}</span>
                    </div>
                  </div>

                  {/* Amenities Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {amenities.slice(0, 4).map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300"
                      >
                        {f}
                      </span>
                    ))}
                    {amenities.length > 4 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-400">
                        +{amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Estimation & Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Est. Total ({lot.duration_hours || 2} hrs)
                    </span>
                    <span className="text-base font-black text-electric-600 dark:text-electric-400">
                      ₹{lot.estimated_total_price || lot.base_hourly_rate * 2}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/slot-management?lotId=${lot.id}`)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-750 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      View Slots Grid
                    </button>

                    <button
                      onClick={() => handleOpenBooking(lot)}
                      disabled={isFull}
                      className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-all flex items-center gap-1.5 ${
                        isFull
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-electric-600 hover:bg-electric-500 shadow-glow-blue'
                      }`}
                    >
                      Reserve Slot <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Drawer / Modal */}
      {selectedLotForBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedLotForBooking(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-500 uppercase tracking-wider">
                Instant Reservation
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {selectedLotForBooking.name}
              </h2>
              <p className="text-xs text-slate-400">{selectedLotForBooking.address}</p>
            </div>

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{bookingSuccess}</h4>
                <p className="text-xs text-slate-400">Redirecting to your booking details...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingError && (
                  <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-semibold">
                    {bookingError}
                  </div>
                )}

                {/* Schedule Summary */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Date & Window:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {arrivalDate} ({arrivalTime} - {departureTime})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Base Hourly Rate:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{selectedLotForBooking.base_hourly_rate}/hr</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-navy-800 font-bold">
                    <span>Estimated Total:</span>
                    <span className="text-electric-500">₹{selectedLotForBooking.estimated_total_price}</span>
                  </div>
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Vehicle for this Booking:
                  </label>
                  {userVehicles.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-navy-700 text-xs text-slate-400 text-center">
                      No vehicles found.{' '}
                      <button
                        onClick={() => navigate('/vehicles')}
                        className="text-electric-500 font-bold hover:underline"
                      >
                        Register a vehicle now
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedVehicleId}
                      onChange={e => setSelectedVehicleId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 font-bold"
                    >
                      {userVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registration_number} - {v.make} {v.model} ({v.vehicle_type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Payment Simulation Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method (Simulated):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'simulated_upi', label: 'UPI / QR' },
                      { id: 'simulated_card', label: 'Card' },
                      { id: 'simulated_netbanking', label: 'Netbanking' },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMethod(p.id)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          paymentMethod === p.id
                            ? 'bg-electric-500/10 border-electric-500 text-electric-500 shadow-sm'
                            : 'border-slate-200 dark:border-navy-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-navy-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    * Development Mode: Transaction is authorized via simulated gateway.
                  </p>
                </div>

                {/* Confirm Action */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedLotForBooking(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading || userVehicles.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue transition-all disabled:opacity-50"
                  >
                    {bookingLoading ? 'Reserving via Allocation Engine...' : 'Confirm & Reserve Slot'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
