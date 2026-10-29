import React, { useState, useEffect } from 'react';
import {
  DoorOpen,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  ShieldCheck,
  Building2,
  IndianRupee,
  RefreshCw,
  QrCode,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import type { ParkingSession, ParkingLot } from '../types';
import { useAuth } from '../context/AuthContext';

export const EntryExitPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<ParkingSession[]>([]);
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Operator Search & Action
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Simulated Hardware Barrier State
  const [entryBarrierOpen, setEntryBarrierOpen] = useState(false);
  const [exitBarrierOpen, setExitBarrierOpen] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [allSess, actSess, lotsData] = await Promise.all([
        api.getSessions('all', selectedLotId),
        api.getActiveSessions(selectedLotId),
        api.getParkingLots(),
      ]);
      setSessions(allSess);
      setActiveSessions(actSess);
      setLots(lotsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, [selectedLotId]);

  // Handle Check-In
  const handleCheckIn = async (refOrPlate: string) => {
    setActionError(null);
    setActionSuccess(null);
    setActionLoading(true);
    try {
      const isRef = refOrPlate.toUpperCase().startsWith('PK-');
      const session = await api.checkInVehicle({
        booking_reference: isRef ? refOrPlate.trim() : undefined,
        vehicle_registration: !isRef ? refOrPlate.trim().toUpperCase() : undefined,
      });

      // Trigger simulated barrier animation
      setEntryBarrierOpen(true);
      setTimeout(() => setEntryBarrierOpen(false), 4000);

      setActionSuccess(
        `Entry Authorized! Vehicle ${session.vehicle_registration} checked in at Slot ${session.slot?.slot_number || ''}. Entry barrier raised.`
      );
      setSearchQuery('');
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Check-in failed. Please verify booking or vehicle plate.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async (sessionId?: number, refOrPlate?: string) => {
    setActionError(null);
    setActionSuccess(null);
    setActionLoading(true);
    try {
      const isRef = refOrPlate && refOrPlate.toUpperCase().startsWith('PK-');
      const session = await api.checkOutVehicle({
        session_id: sessionId,
        booking_reference: isRef ? refOrPlate.trim() : undefined,
        vehicle_registration: !isRef && refOrPlate ? refOrPlate.trim().toUpperCase() : undefined,
        payment_method: 'simulated_upi',
      });

      // Trigger simulated exit barrier animation
      setExitBarrierOpen(true);
      setTimeout(() => setExitBarrierOpen(false), 4000);

      setActionSuccess(
        `Checkout Settled! Vehicle ${session.vehicle_registration} departed. Duration: ${session.duration_minutes}m. Total Charge: ₹${session.calculated_charge}. Exit barrier raised.`
      );
      setSearchQuery('');
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Checkout failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <DoorOpen className="w-6 h-6 text-purple-500" />
              Entry & Exit Management Console
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 uppercase tracking-wider">
              Operator Station
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Validate vehicle gate clearances, control simulated automated barriers, and process session departures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedLotId || ''}
            onChange={e => setSelectedLotId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Gates (Facility-Wide)</option>
            {lots.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
            title="Refresh sessions"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Simulated Barrier Hardware Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Entry Barrier Console */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gate A - Entry Barrier</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-400">
              SIMULATED HARDWARE
            </span>
          </div>

          <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 flex items-center justify-between border border-slate-100 dark:border-navy-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Barrier Status
              </span>
              <span
                className={`text-xl font-black tracking-tight ${
                  entryBarrierOpen ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {entryBarrierOpen ? 'OPEN (CLEAR TO ENTER)' : 'CLOSED (SECURED)'}
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs transition-colors ${
                entryBarrierOpen
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
              }`}
            >
              {entryBarrierOpen ? 'UP' : 'DOWN'}
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Triggered automatically upon booking validation or manual operator clearance.
          </p>
        </div>

        {/* Exit Barrier Console */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gate B - Exit Barrier</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-400">
              SIMULATED HARDWARE
            </span>
          </div>

          <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 flex items-center justify-between border border-slate-100 dark:border-navy-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Barrier Status
              </span>
              <span
                className={`text-xl font-black tracking-tight ${
                  exitBarrierOpen ? 'text-emerald-500' : 'text-slate-400'
                }`}
              >
                {exitBarrierOpen ? 'OPEN (CLEAR TO DEPART)' : 'CLOSED (SECURED)'}
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs transition-colors ${
                exitBarrierOpen
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  : 'bg-slate-200 dark:bg-navy-800 text-slate-500'
              }`}
            >
              {exitBarrierOpen ? 'UP' : 'DOWN'}
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Triggered automatically upon duration payment settlement and slot release.
          </p>
        </div>
      </div>

      {/* Fast Vehicle Clearance Form */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-500" />
            Fast Vehicle Check-In & Clearance Lookup
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter the customer booking reference (e.g. <span className="font-mono text-purple-400">PK-2610-88A102</span>)
            or vehicle registration plate.
          </p>
        </div>

        {actionSuccess && (
          <div className="p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. PK-2610-88A102 or TS-09-EA-2024"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={() => handleCheckIn(searchQuery)}
            disabled={actionLoading || !searchQuery.trim()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Validate & Check-In
          </button>

          <button
            onClick={() => handleCheckOut(undefined, searchQuery)}
            disabled={actionLoading || !searchQuery.trim()}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <DoorOpen className="w-4 h-4" /> Check-Out & Settle
          </button>
        </div>
      </div>

      {/* Active Sessions Inside the Facility */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-500" />
              Currently Parked Vehicles ({activeSessions.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Live active sessions currently occupying bays</p>
          </div>
          <span className="text-xs font-bold text-emerald-500">{activeSessions.length} bays occupied</span>
        </div>

        {activeSessions.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No vehicles currently checked in.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Vehicle Plate</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Slot Bay</th>
                  <th className="py-2.5 px-3">Entry Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {activeSessions.map(sess => (
                  <tr key={sess.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {sess.vehicle_registration}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                      {sess.lot?.name || 'Smart Complex'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-electric-500 bg-electric-500/10 px-2 py-0.5 rounded-md">
                        {sess.slot?.slot_number}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {new Date(sess.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleCheckOut(sess.id)}
                        disabled={actionLoading}
                        className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-sm transition-all"
                      >
                        Gate Check-Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
