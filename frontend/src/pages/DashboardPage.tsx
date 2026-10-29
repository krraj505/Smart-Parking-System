import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Grid,
  CheckCircle,
  AlertCircle,
  Clock,
  IndianRupee,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Car,
  Zap,
  ShieldCheck,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { api } from '../services/api';
import type { DashboardAnalytics, ParkingLot } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<number | undefined>(undefined);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [analyticsData, lotsData] = await Promise.all([
        api.getDashboardAnalytics(selectedLotId, selectedDays),
        api.getParkingLots(),
      ]);
      setData(analyticsData);
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
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [selectedLotId, selectedDays]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-electric-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading operational analytics...</p>
        </div>
      </div>
    );
  }

  const { kpi } = data;

  const PIE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Operational Overview Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time occupancy monitoring, intelligent slot capacity, and revenue analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Facility Filter */}
          <select
            value={selectedLotId || ''}
            onChange={e => setSelectedLotId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500"
          >
            <option value="">All Facilities (System-Wide)</option>
            {lots.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Date range filter */}
          <select
            value={selectedDays}
            onChange={e => setSelectedDays(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500"
          >
            <option value={1}>Today (24 Hours)</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Slots */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Total Capacity</span>
            <Grid className="w-4 h-4 text-electric-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpi.total_slots}</span>
            <span className="text-[11px] text-slate-400">slots</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{kpi.operational_slots} operational bays</p>
        </div>

        {/* Available Slots */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-emerald-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-semibold">Available Slots</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{kpi.available_slots}</span>
            <span className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">ready</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{
                width: `${kpi.operational_slots > 0 ? (kpi.available_slots / kpi.operational_slots) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Occupied Slots */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-red-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-red-500">
            <span className="text-xs font-semibold">Occupied Slots</span>
            <Car className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-500">{kpi.occupied_slots}</span>
            <span className="text-[11px] text-slate-400">in use</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Live active sessions</p>
        </div>

        {/* Current Occupancy Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Occupancy Rate</span>
            <Percent className="w-4 h-4 text-electric-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpi.occupancy_rate}%</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Excludes maintenance bays</p>
        </div>

        {/* Today's Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Today's Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-400">₹</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {kpi.today_revenue.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{kpi.today_reservations} bookings processed</p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Occupancy Curve (Area Chart) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-electric-500" />
                Hourly Occupancy Rate Trend (%)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time 24-hour occupancy pattern across operational bays
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-electric-500/10 text-electric-500">
              Live Curve
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hourly_occupancy}>
                <defs>
                  <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis unit="%" tick={{ fontSize: 11 }} stroke="#64748B" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="occupancy_rate"
                  name="Occupancy Rate"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#occupancyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Category Distribution (Donut Chart) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Car className="w-4 h-4 text-emerald-500" />
            Vehicle Category Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-2">Fleet category breakdown</p>
          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.category_distribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {data.category_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts: Daily Reservations & Facility Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Reservations & Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Daily Reservations & Revenue
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Booking volume over the selected window</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily_reservations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis yAxisId="right" orientation="right" unit="₹" tick={{ fontSize: 11 }} stroke="#10B981" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar yAxisId="left" dataKey="reservations_count" name="Bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Facility Utilization Table & Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-purple-500" />
            Parking Facility Capacity & Utilization
          </h3>
          <p className="text-xs text-slate-400 mb-4">Live operational occupancy across smart facilities</p>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {data.facility_utilization.map(facility => (
              <div
                key={facility.lot_id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {facility.lot_name}
                  </span>
                  <span className="text-xs font-bold text-electric-500">{facility.occupancy_rate}% Occupied</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      facility.occupancy_rate > 85
                        ? 'bg-red-500'
                        : facility.occupancy_rate > 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${facility.occupancy_rate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>
                    {facility.occupied_slots} / {facility.total_slots} Slots Filled
                  </span>
                  <span className="font-semibold text-emerald-500">₹{facility.revenue.toLocaleString('en-IN')} Earned</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed & Fast Action Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-electric-500" />
            Live System Activity Feed
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {data.recent_activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity logged.</p>
            ) : (
              data.recent_activities.map(act => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-slate-100 dark:border-navy-800 text-xs"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      act.badge_color === 'green'
                        ? 'bg-emerald-500'
                        : act.badge_color === 'red'
                        ? 'bg-red-500'
                        : act.badge_color === 'amber'
                        ? 'bg-amber-500'
                        : act.badge_color === 'purple'
                        ? 'bg-purple-500'
                        : 'bg-electric-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{act.title}</span>
                      <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">{act.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div className="space-y-3 flex flex-col justify-between">
          <div
            onClick={() => navigate('/find-parking')}
            className="p-4 rounded-2xl bg-gradient-to-br from-electric-600 to-indigo-700 text-white shadow-glow-blue cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Quick Action</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <h4 className="text-base font-bold mt-2">Find & Reserve Parking</h4>
            <p className="text-xs text-white/80 mt-1">
              Search available parking bays across smart city facilities with automated slot ranking.
            </p>
          </div>

          <div
            onClick={() => navigate('/slot-management')}
            className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm cursor-pointer hover:border-electric-500/50 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Interactive Grid</span>
              <Grid className="w-4 h-4 text-electric-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">Smart Slot Grid</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              View floor-by-floor visual layout with real-time status indicators (Green/Red/Blue/Amber/Gray).
            </p>
          </div>

          <div
            onClick={() => navigate('/entry-exit')}
            className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm cursor-pointer hover:border-purple-500/50 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Operator Tools</span>
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">Gate Entry & Exit Console</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Process vehicle check-in, check-out, duration billing and simulated barrier controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
