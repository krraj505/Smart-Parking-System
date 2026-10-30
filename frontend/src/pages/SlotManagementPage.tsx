import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Zap,
  Accessibility,
  Search,
  Filter,
  Car,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building2,
  RefreshCw,
  X,
  ChevronRight,
  Shield,
  Layers,
  Wrench,
  Ban,
} from 'lucide-react';
import { api } from '../services/api';
import type { ParkingLot, ParkingSlot, SlotStatus, SlotCategory, Vehicle } from '../types';
import { useAuth } from '../context/AuthContext';

export const SlotManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role, isAuthenticated } = useAuth();

  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<number>(() => {
    const paramId = searchParams.get('lotId');
    return paramId ? Number(paramId) : 1;
  });

  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [evOnly, setEvOnly] = useState<boolean>(false);
  const [accessibleOnly, setAccessibleOnly] = useState<boolean>(false);
  const [searchSlotId, setSearchSlotId] = useState<string>('');

  // Selected Slot Drawer / Modal
  const [activeSlot, setActiveSlot] = useState<ParkingSlot | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  // Quick reservation from slot
  const [showReserveModal, setShowReserveModal] = useState<boolean>(false);
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [resDate, setResDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [resStartTime, setResStartTime] = useState('11:00');
  const [resEndTime, setResEndTime] = useState('14:00');
  const [resLoading, setResLoading] = useState(false);
  const [resError, setResError] = useState<string | null>(null);

  // Fetch initial lots
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const data = await api.getParkingLots();
        setLots(data);
        if (data.length > 0 && !selectedLotId) {
          setSelectedLotId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLots();
  }, []);

  // Fetch slots for selected lot
  const fetchSlots = async () => {
    if (!selectedLotId) return;
    setRefreshing(true);
    try {
      const [lotDetails, slotsData] = await Promise.all([
        api.getParkingLot(selectedLotId),
        api.getLotSlots(selectedLotId, {
          floor: selectedFloor !== 'all' ? selectedFloor : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          slot_status: selectedStatus !== 'all' ? selectedStatus : undefined,
          has_ev: evOnly || undefined,
          is_accessible: accessibleOnly || undefined,
          search: searchSlotId.trim() || undefined,
        }),
      ]);
      setSelectedLot(lotDetails);
      setSlots(slotsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 10000); // 10s auto-refresh for real-time occupancy
    return () => clearInterval(interval);
  }, [selectedLotId, selectedFloor, selectedStatus, selectedCategory, evOnly, accessibleOnly, searchSlotId]);

  // Handle slot status change (Operator / Admin)
  const handleSlotStatusToggle = async (newStatus: SlotStatus) => {
    if (!activeSlot) return;
    setStatusUpdating(true);
    try {
      const updated = await api.updateSlotStatus(activeSlot.id, { status: newStatus });
      setActiveSlot(updated);
      setSlots(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      alert(err.message || 'Failed to update slot status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Open reservation modal for slot
  const handleOpenReserve = async () => {
    try {
      const vehicles = await api.getVehicles();
      setUserVehicles(vehicles);
      if (vehicles.length > 0) {
        setSelectedVehicleId(vehicles[0].id);
      }
      setShowReserveModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmSlotReserve = async () => {
    if (!activeSlot || !selectedLotId || !selectedVehicleId) return;
    setResLoading(true);
    setResError(null);
    try {
      const startIso = `${resDate}T${resStartTime}:00`;
      const endIso = `${resDate}T${resEndTime}:00`;

      const res = await api.createReservation({
        lot_id: selectedLotId,
        slot_id: activeSlot.id,
        vehicle_id: Number(selectedVehicleId),
        start_time: startIso,
        end_time: endIso,
        payment_method: 'simulated_upi',
      });

      setShowReserveModal(false);
      setActiveSlot(null);
      fetchSlots();
      navigate(`/reservations/${res.id}`);
    } catch (err: any) {
      setResError(err.message || 'Slot allocation conflict.');
    } finally {
      setResLoading(false);
    }
  };

  // Extract distinct floors
  const floors = Array.from(new Set(slots.map(s => s.floor_level))).sort();

  // Status badge style helper
  const getStatusBadge = (status: SlotStatus) => {
    switch (status) {
      case 'available':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          border: 'border-emerald-500/30',
          text: 'text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          label: 'Available',
        };
      case 'occupied':
        return {
          bg: 'bg-red-500/10 dark:bg-red-500/15',
          border: 'border-red-500/30',
          text: 'text-red-600 dark:text-red-400',
          dot: 'bg-red-500',
          label: 'Occupied',
        };
      case 'reserved':
        return {
          bg: 'bg-electric-500/10 dark:bg-electric-500/15',
          border: 'border-electric-500/30',
          text: 'text-electric-600 dark:text-electric-400',
          dot: 'bg-electric-500',
          label: 'Reserved',
        };
      case 'maintenance':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/15',
          border: 'border-amber-500/30',
          text: 'text-amber-600 dark:text-amber-400',
          dot: 'bg-amber-500',
          label: 'Maintenance',
        };
      case 'disabled':
        return {
          bg: 'bg-slate-400/10 dark:bg-slate-400/15',
          border: 'border-slate-400/30',
          text: 'text-slate-500 dark:text-slate-400',
          dot: 'bg-slate-400',
          label: 'Disabled',
        };
      default:
        return {
          bg: 'bg-slate-100',
          border: 'border-slate-300',
          text: 'text-slate-600',
          dot: 'bg-slate-400',
          label: status,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Facility Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Interactive Parking Slot Grid
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-electric-500/10 text-electric-500 uppercase tracking-widest">
              Live Map Alternative
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual floor layout with real-time slot sensor feedback. Select any parking bay for specifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedLotId}
            onChange={e => {
              setSelectedLotId(Number(e.target.value));
              setSelectedFloor('all');
            }}
            className="px-4 py-2 text-xs font-bold bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 shadow-sm"
          >
            {lots.map(l => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>

          <button
            onClick={fetchSlots}
            disabled={refreshing}
            className="p-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            title="Refresh slot grid"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Facility Summary Strip */}
      {selectedLot && (
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-electric-500/10 text-electric-500 flex items-center justify-center font-black text-lg">
              {selectedLot.code.split('-')[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {selectedLot.name}
              </h2>
              <p className="text-xs text-slate-400">{selectedLot.address}</p>
            </div>
          </div>

          {/* Quick Metrics Counter */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {selectedLot.total_capacity}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-500 block">Available</span>
              <span className="text-base font-black text-emerald-500">{selectedLot.available_slots}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-red-500 block">Occupied</span>
              <span className="text-base font-black text-red-500">{selectedLot.occupied_slots}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-electric-500 block">Reserved</span>
              <span className="text-base font-black text-electric-500">{selectedLot.reserved_slots}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-500 block">Maint.</span>
              <span className="text-base font-black text-amber-500">{selectedLot.maintenance_slots}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floor Level Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedFloor('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedFloor === 'all'
              ? 'bg-electric-600 text-white shadow-glow-blue'
              : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> All Levels ({slots.length})
        </button>
        {floors.map(fl => {
          const count = slots.filter(s => s.floor_level === fl).length;
          return (
            <button
              key={fl}
              onClick={() => setSelectedFloor(fl)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedFloor === fl
                  ? 'bg-electric-600 text-white shadow-glow-blue'
                  : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
              }`}
            >
              {fl} ({count})
            </button>
          );
        })}
      </div>

      {/* Filter and Legend Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search slot ID */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Slot ID (e.g. A-01)..."
              value={searchSlotId}
              onChange={e => setSearchSlotId(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-electric-500"
            />
          </div>

          {/* Status and Category Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available (Green)</option>
              <option value="occupied">Occupied (Red)</option>
              <option value="reserved">Reserved (Blue)</option>
              <option value="maintenance">Maintenance (Amber)</option>
              <option value="disabled">Disabled (Gray)</option>
            </select>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value="all">All Categories</option>
              <option value="standard">Standard</option>
              <option value="compact">Compact</option>
              <option value="suv">SUV</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="accessible">Accessible</option>
              <option value="ev">EV Charging</option>
            </select>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-800">
              <input
                type="checkbox"
                checked={evOnly}
                onChange={e => setEvOnly(e.target.checked)}
                className="rounded text-electric-600 focus:ring-electric-500 w-3.5 h-3.5"
              />
              <Zap className="w-3.5 h-3.5 text-electric-500" /> EV Bay
            </label>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-800">
              <input
                type="checkbox"
                checked={accessibleOnly}
                onChange={e => setAccessibleOnly(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
              />
              <Accessibility className="w-3.5 h-3.5 text-purple-500" /> Accessible
            </label>
          </div>
        </div>

        {/* Status Legend Strip */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-navy-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-electric-500" />
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>Disabled</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-electric-500">
            <Zap className="w-3 h-3" />
            <span>= EV Charger</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-500">
            <Accessibility className="w-3 h-3" />
            <span>= Accessible Bay</span>
          </div>
        </div>
      </div>

      {/* Interactive Slot Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
            <div
              key={n}
              className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse h-36"
            />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-2">
          <Grid className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">No parking slots found</p>
          <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {slots.map(slot => {
            const badge = getStatusBadge(slot.status);
            const isSelected = activeSlot?.id === slot.id;

            return (
              <div
                key={slot.id}
                onClick={() => setActiveSlot(slot)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-electric-500 shadow-glow-blue border-electric-500'
                    : 'hover:border-slate-400 dark:hover:border-navy-600 bg-white dark:bg-navy-900 shadow-sm'
                } ${badge.border}`}
              >
                {/* Top: Slot ID & Category Icon */}
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                    {slot.slot_number}
                  </span>
                  <div className="flex items-center gap-1">
                    {slot.has_ev_charger && (
                      <span className="p-1 rounded-md bg-electric-500/10 text-electric-500" title="EV Fast Charger">
                        <Zap className="w-3 h-3" />
                      </span>
                    )}
                    {slot.is_accessible && (
                      <span className="p-1 rounded-md bg-purple-500/10 text-purple-500" title="Wheelchair Accessible">
                        <Accessibility className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Center: Stylized Bay Marker */}
                <div className="py-2.5 text-center">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${badge.bg} border ${badge.border} transition-colors`}
                  >
                    <Car className={`w-6 h-6 ${badge.text}`} />
                  </div>
                </div>

                {/* Bottom: Status Pill & Category */}
                <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[10px]">
                  <span className="capitalize font-medium text-slate-500 dark:text-slate-400 truncate">
                    {slot.slot_category}
                  </span>
                  <div className="flex items-center gap-1 font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span className={badge.text}>{badge.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Slot Details Drawer / Modal */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setActiveSlot(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                  getStatusBadge(activeSlot.status).bg
                } ${getStatusBadge(activeSlot.status).text}`}
              >
                {activeSlot.slot_number}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Parking Slot {activeSlot.slot_number}
                </h3>
                <p className="text-xs text-slate-400">{activeSlot.floor_level} • {selectedLot?.name}</p>
              </div>
            </div>

            {/* Specifications List */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Current Status:</span>
                <span className={`font-bold capitalize ${getStatusBadge(activeSlot.status).text}`}>
                  {activeSlot.status}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Bay Category:</span>
                <span className="font-bold text-slate-900 dark:text-white capitalize">
                  {activeSlot.slot_category}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>EV Charging Unit:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeSlot.has_ev_charger ? 'Installed (Type 2 / CCS2)' : 'Not available'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Wheelchair Accessibility:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeSlot.is_accessible ? 'Extra width ramp access' : 'Standard'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Max Dimensions:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeSlot.max_vehicle_length ? `${activeSlot.max_vehicle_length}m length` : 'Standard clearance'}
                </span>
              </div>
            </div>

            {/* Customer Actions */}
            <div className="space-y-2 pt-2">
              {activeSlot.status === 'available' ? (
                <button
                  onClick={handleOpenReserve}
                  className="w-full py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue transition-all"
                >
                  Reserve Slot {activeSlot.slot_number} Now
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold text-center">
                  This slot is currently {activeSlot.status}. Reservations permitted only on available slots.
                </div>
              )}

              {/* Operator / Admin Maintenance Controls */}
              {(role === 'operator' || role === 'admin') && (
                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Operator / Admin Slot Controls:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      disabled={statusUpdating}
                      onClick={() => handleSlotStatusToggle('available')}
                      className="py-1.5 px-2 text-[11px] font-bold rounded-lg border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                    >
                      Set Available
                    </button>
                    <button
                      disabled={statusUpdating}
                      onClick={() => handleSlotStatusToggle('maintenance')}
                      className="py-1.5 px-2 text-[11px] font-bold rounded-lg border border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    >
                      Set Maintenance
                    </button>
                    <button
                      disabled={statusUpdating}
                      onClick={() => handleSlotStatusToggle('disabled')}
                      className="py-1.5 px-2 text-[11px] font-bold rounded-lg border border-slate-400/30 text-slate-400 hover:bg-slate-400/10"
                    >
                      Set Disabled
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reserve Specific Slot Modal */}
      {showReserveModal && activeSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowReserveModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-500 uppercase tracking-wider">
                Slot Booking
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Book Slot {activeSlot.slot_number}
              </h2>
              <p className="text-xs text-slate-400">{selectedLot?.name}</p>
            </div>

            {resError && (
              <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-semibold">
                {resError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={resDate}
                  onChange={e => setResDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={resStartTime}
                    onChange={e => setResStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={resEndTime}
                    onChange={e => setResEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Select Vehicle
                </label>
                {userVehicles.length === 0 ? (
                  <p className="text-xs text-amber-500">Please register a vehicle first.</p>
                ) : (
                  <select
                    value={selectedVehicleId}
                    onChange={e => setSelectedVehicleId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 font-bold"
                  >
                    {userVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} ({v.make} {v.model})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSlotReserve}
                  disabled={resLoading || userVehicles.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue transition-all disabled:opacity-50"
                >
                  {resLoading ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
