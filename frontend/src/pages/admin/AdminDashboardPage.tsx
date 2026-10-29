import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Coins,
  FileText,
  Building2,
  Grid,
  Plus,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import type { ParkingLot } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [showAddLotModal, setShowAddLotModal] = useState<boolean>(false);
  const [showGenModal, setShowGenModal] = useState<boolean>(false);
  const [selectedLotId, setSelectedLotId] = useState<number | ''>('');
  const [genCount, setGenCount] = useState<number>(20);
  const [genFloors, setGenFloors] = useState<number>(2);
  const [genLoading, setGenLoading] = useState<boolean>(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  // New Lot Form
  const [lotName, setLotName] = useState('');
  const [lotCode, setLotCode] = useState('');
  const [lotAddress, setLotAddress] = useState('');
  const [lotArea, setLotArea] = useState('HITEC City');
  const [baseRate, setBaseRate] = useState<number>(50);
  const [is247, setIs247] = useState<boolean>(true);
  const [openTime, setOpenTime] = useState('06:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [lotLoading, setLotLoading] = useState<boolean>(false);

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

  useEffect(() => {
    fetchLots();
  }, []);

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLotLoading(true);
    try {
      await api.adminCreateLot({
        name: lotName,
        code: lotCode.toUpperCase(),
        address: lotAddress,
        city: 'Hyderabad',
        area: lotArea,
        base_hourly_rate: baseRate,
        is_24_7: is247,
        open_time: is247 ? '00:00' : openTime,
        close_time: is247 ? '23:59' : closeTime,
        total_capacity: 0,
      });
      setShowAddLotModal(false);
      setLotName('');
      setLotCode('');
      setLotAddress('');
      fetchLots();
    } catch (err: any) {
      alert(err.message || 'Failed to create lot.');
    } finally {
      setLotLoading(false);
    }
  };

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId) return;
    setGenLoading(true);
    setGenMessage(null);
    try {
      const res = await api.adminGenerateSlots(Number(selectedLotId), genCount, genFloors);
      setGenMessage(res.message);
      fetchLots();
      setTimeout(() => {
        setShowGenModal(false);
        setGenMessage(null);
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Slot generation failed.');
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-amber-500" />
          System Administration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          High-level operational controls, slot grid generation, and platform governance.
        </p>
      </div>

      {/* Admin Modules Quick Launch */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/admin/users')}
          className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-bold text-slate-400">Governance</span>
            <Users className="w-5 h-5 text-electric-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">User & Role Management</h3>
          <p className="text-xs text-slate-400 mt-1">
            Grant operator permissions, manage administrator credentials, and review user accounts.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/pricing')}
          className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-bold text-slate-400">Revenue</span>
            <Coins className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">Pricing Engine Rules</h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure hourly rates, daily maximum caps, minimum charges, and peak-hour multipliers.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/audit-logs')}
          className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-bold text-slate-400">Security</span>
            <FileText className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">Security Audit Trail</h3>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident logs of bookings, slot maintenance changes, user role escalations and logins.
          </p>
        </div>
      </div>

      {/* Facility Operations & Layout Generation */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-electric-500" />
              Smart Facility Layout & Bay Generation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Add new facilities or automatically generate slot grids across multiple floor levels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddLotModal(true)}
              className="px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Facility
            </button>
            <button
              onClick={() => setShowGenModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Grid className="w-4 h-4" /> Auto-Generate Slots
            </button>
          </div>
        </div>

        {/* Existing Lots Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Facility Name</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Area</th>
                <th className="py-2.5 px-3">Base Rate</th>
                <th className="py-2.5 px-3">Operating Window</th>
                <th className="py-2.5 px-3">Total Capacity</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {lots.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{l.name}</td>
                  <td className="py-3 px-3 font-mono font-bold text-electric-500">{l.code}</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{l.area}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">₹{l.base_hourly_rate}/hr</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                    {l.is_24_7 ? '24/7' : `${l.open_time} - ${l.close_time}`}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{l.total_capacity} Slots</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => navigate(`/slot-management?lotId=${l.id}`)}
                      className="text-xs font-bold text-electric-500 hover:underline inline-flex items-center gap-1"
                    >
                      Manage Grid <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Facility Modal */}
      {showAddLotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAddLotModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-500 uppercase tracking-wider">
                Admin Action
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Create Parking Facility</h2>
            </div>

            <form onSubmit={handleCreateLot} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Inorbit Mall Hub"
                    value={lotName}
                    onChange={e => setLotName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Facility Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IM-HYD-05"
                    value={lotCode}
                    onChange={e => setLotCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyberabad Expressway, Madhapur"
                  value={lotAddress}
                  onChange={e => setLotAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Zone / Area
                  </label>
                  <input
                    type="text"
                    value={lotArea}
                    onChange={e => setLotArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Base Hourly Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={baseRate}
                    onChange={e => setBaseRate(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddLotModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lotLoading}
                  className="px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue transition-all disabled:opacity-50"
                >
                  {lotLoading ? 'Creating...' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Generate Slots Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowGenModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 uppercase tracking-wider">
                Grid Generator
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Generate Parking Slots</h2>
              <p className="text-xs text-slate-400">
                Populates an automated mix of Standard, Compact, SUV, EV and Accessible bays.
              </p>
            </div>

            {genMessage ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold text-center">
                {genMessage}
              </div>
            ) : (
              <form onSubmit={handleGenerateSlots} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Select Facility
                  </label>
                  <select
                    value={selectedLotId}
                    onChange={e => setSelectedLotId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {lots.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Slots Count (5 - 100)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={genCount}
                      onChange={e => setGenCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Floors (1 - 5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={genFloors}
                      onChange={e => setGenFloors(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={genLoading}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                  >
                    {genLoading ? 'Generating Grid...' : 'Generate Slots'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
