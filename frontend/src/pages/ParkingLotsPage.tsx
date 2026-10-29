import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Clock,
  Phone,
  Grid,
  Zap,
  Shield,
  ChevronRight,
  IndianRupee,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import type { ParkingLot } from '../types';

export const ParkingLotsPage: React.FC = () => {
  const navigate = useNavigate();
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchLots = async () => {
      try {
        setLoading(true);
        const data = await api.getParkingLots();
        setLots(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, []);

  const filteredLots = lots.filter(
    l =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.area.toLowerCase().includes(search.toLowerCase()) ||
      l.address.toLowerCase().includes(search.toLowerCase())
  );

  const parseFacilities = (facStr?: string): string[] => {
    if (!facStr) return ['Covered', 'CCTV 24/7'];
    try {
      return JSON.parse(facStr);
    } catch {
      return facStr.split(',').map(s => s.trim());
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-electric-500" />
            Smart Parking Facilities
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse all certified municipal and commercial parking garages connected to the smart grid.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search facility name or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-electric-500 shadow-sm"
          />
        </div>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse h-56"
            />
          ))}
        </div>
      ) : filteredLots.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <p className="text-sm font-bold text-slate-900 dark:text-white">No parking facilities match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredLots.map(lot => {
            const amenities = parseFacilities(lot.facilities);
            return (
              <div
                key={lot.id}
                className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-electric-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-500">
                          {lot.code}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-400">
                          {lot.area}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{lot.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{lot.address}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-slate-900 dark:text-white">₹{lot.base_hourly_rate}</span>
                      <span className="text-[10px] text-slate-400 block font-semibold">/ hour</span>
                    </div>
                  </div>

                  {/* Details strip */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-100 dark:border-navy-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Operating Hours</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {lot.is_24_7 ? '24 Hours Open' : `${lot.open_time} - ${lot.close_time}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Capacity</span>
                      <span className="font-bold text-slate-900 dark:text-white">{lot.total_capacity} Slots</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Helpline</span>
                      <span className="font-bold text-slate-900 dark:text-white">{lot.contact_phone || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {amenities.map((a, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => navigate(`/slot-management?lotId=${lot.id}`)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-750 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    View Slot Grid
                  </button>
                  <button
                    onClick={() => navigate(`/find-parking?query=${encodeURIComponent(lot.name)}`)}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-electric-600 hover:bg-electric-500 text-white shadow-glow-blue transition-all flex items-center gap-1"
                  >
                    Reserve Here <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
