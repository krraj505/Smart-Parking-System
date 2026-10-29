import React, { useState, useEffect } from 'react';
import { Coins, Plus, CheckCircle2, IndianRupee, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api';
import type { PricingRule, ParkingLot } from '../../types';

export const PricingManagementPage: React.FC = () => {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Rule Form
  const [lotId, setLotId] = useState<number>(1);
  const [ruleName, setRuleName] = useState('');
  const [vehicleType, setVehicleType] = useState('all');
  const [baseRate, setBaseRate] = useState<number>(50);
  const [minCharge, setMinCharge] = useState<number>(30);
  const [dailyMax, setDailyMax] = useState<number>(400);
  const [peakMultiplier, setPeakMultiplier] = useState<number>(1.25);
  const [cancellationFee, setCancellationFee] = useState<number>(10);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesData, lotsData] = await Promise.all([
        api.adminGetPricingRules(),
        api.getParkingLots(),
      ]);
      setRules(rulesData);
      setLots(lotsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const created = await api.adminCreatePricingRule({
        lot_id: lotId,
        name: ruleName,
        vehicle_type: vehicleType,
        base_hourly_rate: baseRate,
        minimum_charge: minCharge,
        daily_max_rate: dailyMax,
        peak_multiplier: peakMultiplier,
        cancellation_fee_percent: cancellationFee,
      });
      setRules(prev => [...prev, created]);
      setShowAddModal(false);
      setRuleName('');
    } catch (err: any) {
      alert(err.message || 'Failed to create pricing rule.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-500" />
            Pricing Rules & Dynamic Tariffs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure hourly rates, minimum charges, daily maximum caps, and peak hour multipliers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Pricing Tier
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-12 bg-slate-100 dark:bg-navy-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Rule Name</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Vehicle Match</th>
                  <th className="py-2.5 px-3">Base Rate</th>
                  <th className="py-2.5 px-3">Minimum Fee</th>
                  <th className="py-2.5 px-3">Daily Max</th>
                  <th className="py-2.5 px-3">Peak Multiplier</th>
                  <th className="py-2.5 px-3 text-right">Cancellation Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {rules.map(r => {
                  const facility = lots.find(l => l.id === r.lot_id);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{r.name}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {facility?.name || `Lot #${r.lot_id}`}
                      </td>
                      <td className="py-3 px-3 uppercase text-[11px] font-semibold text-electric-500">
                        {r.vehicle_type}
                      </td>
                      <td className="py-3 px-3 font-black text-slate-900 dark:text-white">₹{r.base_hourly_rate}/hr</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">₹{r.minimum_charge}</td>
                      <td className="py-3 px-3 font-bold text-emerald-500">₹{r.daily_max_rate}</td>
                      <td className="py-3 px-3 font-bold text-purple-500">{r.peak_multiplier}x</td>
                      <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400 font-semibold">
                        {r.cancellation_fee_percent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
                Pricing Engine
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Configure Pricing Rule</h2>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Pricing Rule Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekend High Demand Tier"
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Facility
                  </label>
                  <select
                    value={lotId}
                    onChange={e => setLotId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {lots.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={e => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Vehicles</option>
                    <option value="car">Car</option>
                    <option value="suv">SUV</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="ev">EV</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Base Rate (₹/hr)
                  </label>
                  <input
                    type="number"
                    value={baseRate}
                    onChange={e => setBaseRate(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Min Charge (₹)
                  </label>
                  <input
                    type="number"
                    value={minCharge}
                    onChange={e => setMinCharge(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Daily Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={dailyMax}
                    onChange={e => setDailyMax(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Peak Multiplier (e.g. 1.25)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={peakMultiplier}
                    onChange={e => setPeakMultiplier(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Cancellation Fee (%)
                  </label>
                  <input
                    type="number"
                    value={cancellationFee}
                    onChange={e => setCancellationFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Pricing Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
