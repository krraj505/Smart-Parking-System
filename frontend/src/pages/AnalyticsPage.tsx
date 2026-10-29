import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  Activity,
  Percent,
  Clock,
  Car,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import type { DashboardAnalytics, ParkingLot } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<number | undefined>(undefined);
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [csvType, setCsvType] = useState<'reservations' | 'sessions' | 'revenue' | 'facilities'>('reservations');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsData, lotsData] = await Promise.all([
        api.getDashboardAnalytics(selectedLotId, days),
        api.getParkingLots(),
      ]);
      setData(analyticsData);
      setLots(lotsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLotId, days]);

  const handleDownloadCsv = () => {
    const url = api.getExportCsvUrl(csvType);
    window.open(url, '_blank');
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-electric-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { kpi } = data;
  const PIE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-electric-500" />
            Analytics & Mobility Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical occupancy analysis, facility utilization, and automated CSV export generation.
          </p>
        </div>

        {/* CSV Export & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={csvType}
            onChange={e => setCsvType(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500"
          >
            <option value="reservations">Reservations Report</option>
            <option value="sessions">Gate Sessions Report</option>
            <option value="revenue">Revenue Ledger Report</option>
            <option value="facilities">Facility Audit Report</option>
          </select>

          <button
            onClick={handleDownloadCsv}
            className="px-4 py-1.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Select Facility
            </label>
            <select
              value={selectedLotId || ''}
              onChange={e => setSelectedLotId(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value="">All Facilities</option>
              {lots.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Analysis Window
            </label>
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days (Monthly)</option>
              <option value={90}>Last 90 Days (Quarterly)</option>
            </select>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Parking Duration</span>
          <span className="text-xl font-black text-electric-600 dark:text-electric-400">
            {kpi.average_parking_duration_minutes} mins
          </span>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Traffic Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-500" />
            Peak Parking Traffic Hours
          </h3>
          <p className="text-xs text-slate-400 mb-4">Entry and exit flow volume distribution</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peak_hours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#64748B" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="entries" name="Vehicle Entries" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exits" name="Vehicle Exits" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Parking Facility */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Revenue by Facility (₹ INR)
          </h3>
          <p className="text-xs text-slate-400 mb-4">Total revenue accrued per smart parking complex</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.facility_utilization} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis type="number" unit="₹" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis dataKey="lot_name" type="category" width={120} tick={{ fontSize: 10 }} stroke="#64748B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" name="Total Revenue (₹)" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Facility Utilization Data Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Facility Capacity Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Facility Name</th>
                <th className="py-2.5 px-3">Total Bays</th>
                <th className="py-2.5 px-3">Occupied Bays</th>
                <th className="py-2.5 px-3">Occupancy Rate</th>
                <th className="py-2.5 px-3 text-right">Revenue Accrued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {data.facility_utilization.map(f => (
                <tr key={f.lot_id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{f.lot_name}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-semibold">{f.total_slots}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-semibold">{f.occupied_slots}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        f.occupancy_rate > 80
                          ? 'bg-red-500/10 text-red-500'
                          : f.occupancy_rate > 50
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {f.occupancy_rate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                    ₹{f.revenue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
