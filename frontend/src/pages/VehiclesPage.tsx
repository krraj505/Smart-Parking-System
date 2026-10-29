import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  Trash2,
  Zap,
  CheckCircle2,
  X,
  AlertCircle,
  Shield,
  Palette,
  Maximize2,
} from 'lucide-react';
import { api } from '../services/api';
import type { Vehicle } from '../types';
import { useAuth } from '../context/AuthContext';

export const VehiclesPage: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [regNumber, setRegNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [isEv, setIsEv] = useState(false);
  const [preferences, setPreferences] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!regNumber || !make || !model || !color) {
      setFormError('Please fill in all mandatory vehicle details.');
      return;
    }

    setFormLoading(true);
    try {
      const newVeh = await api.createVehicle({
        registration_number: regNumber,
        vehicle_type: vehicleType,
        make,
        model,
        color,
        dimensions: dimensions || undefined,
        is_ev: isEv || vehicleType === 'ev',
        preferences: preferences || undefined,
      });

      setVehicles(prev => [...prev, newVeh]);
      setShowAddModal(false);
      // Reset form
      setRegNumber('');
      setMake('');
      setModel('');
      setColor('');
      setDimensions('');
      setIsEv(false);
      setPreferences('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to register vehicle.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this vehicle from your account?')) return;
    try {
      await api.deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to remove vehicle.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-electric-500" />
            Vehicle Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Register your personal fleet. Used for automated parking slot compatibility and gate entry clearance.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {/* Vehicles Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse h-48"
            />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-3">
          <Car className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No vehicles registered yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add your car, motorcycle, SUV or electric vehicle to enable rapid 1-click reservations.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2 rounded-xl bg-electric-600 text-white text-xs font-bold"
          >
            Register First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map(v => (
            <div
              key={v.id}
              className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-slate-300 dark:hover:border-navy-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {v.vehicle_type}
                    </span>
                    {v.is_ev && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-500 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Electric
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    title="Delete vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3">
                  <span className="font-mono text-base font-black text-slate-900 dark:text-white tracking-wider">
                    {v.registration_number}
                  </span>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {v.make} {v.model}
                  </h3>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-navy-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" /> Color:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{v.color}</span>
                  </div>
                  {v.dimensions && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5" /> Dimensions:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">{v.dimensions}</span>
                    </div>
                  )}
                  {v.preferences && (
                    <p className="text-[11px] text-slate-400 italic pt-1">{v.preferences}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Verified Plate</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Compatible
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-500 uppercase tracking-wider">
                New Registration
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Register Vehicle</h2>
              <p className="text-xs text-slate-400">Enter your vehicle details for automatic slot allocation.</p>
            </div>

            {formError && (
              <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TS-09-AB-1234"
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Vehicle Category *
                  </label>
                  <select
                    value={vehicleType}
                    onChange={e => {
                      setVehicleType(e.target.value);
                      if (e.target.value === 'ev') setIsEv(true);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 font-bold"
                  >
                    <option value="car">Car (Sedan/Hatchback)</option>
                    <option value="suv">SUV / MUV</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                    <option value="van">Van / Minibus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Make (Manufacturer) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyundai, Tesla, Honda"
                    value={make}
                    onChange={e => setMake(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Creta, Model 3, City"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Color *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pearl White, Black"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Dimensions (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4.5m x 1.8m"
                    value={dimensions}
                    onChange={e => setDimensions(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ev-toggle"
                  checked={isEv}
                  onChange={e => setIsEv(e.target.checked)}
                  className="rounded text-electric-600 focus:ring-electric-500 w-4 h-4"
                />
                <label htmlFor="ev-toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  This is an Electric Vehicle (requires EV charger bay)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
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
                  className="px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
