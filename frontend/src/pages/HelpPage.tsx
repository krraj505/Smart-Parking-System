import React from 'react';
import {
  HelpCircle,
  Shield,
  Zap,
  Grid,
  CheckCircle2,
  Lock,
  Cpu,
  KeyRound,
  Layers,
  Sparkles,
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-electric-500" />
          System Guide & Documentation
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          B.Tech CSE Project & Portfolio Architecture Reference for Smart Parking Mobility Platform.
        </p>
      </div>

      {/* Demo Credentials Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-electric-600/10 to-indigo-600/10 border border-electric-500/20 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-electric-500 font-bold text-sm">
          <KeyRound className="w-4 h-4" />
          <span>Demo Personas & Evaluation Credentials</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          The application comes seeded with three roles. You can either log in with these credentials or use the instant
          <span className="font-bold text-electric-500"> "Role Switcher"</span> in the top navigation bar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs">
            <span className="font-bold text-amber-500 block uppercase text-[10px]">Administrator</span>
            <p className="font-mono text-slate-900 dark:text-white mt-1">admin@smartparking.com</p>
            <p className="text-slate-400 text-[11px]">Pass: Admin@12345</p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs">
            <span className="font-bold text-purple-500 block uppercase text-[10px]">Gate Operator</span>
            <p className="font-mono text-slate-900 dark:text-white mt-1">operator@smartparking.com</p>
            <p className="text-slate-400 text-[11px]">Pass: Operator@12345</p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs">
            <span className="font-bold text-emerald-500 block uppercase text-[10px]">Customer</span>
            <p className="font-mono text-slate-900 dark:text-white mt-1">customer@smartparking.com</p>
            <p className="text-slate-400 text-[11px]">Pass: Customer@12345</p>
          </div>
        </div>
      </div>

      {/* Map-Free Architecture Explanation */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Grid className="w-4 h-4 text-electric-500" />
          Map-Free Architecture: Why Interactive Slot Grids?
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Traditional geographic maps show parking lots as mere pins on a city map without meaningful interior slot
          granularity. This platform replaces geographic maps with high-fidelity, interactive parking bay layouts. Drivers
          and operators see exact floor levels, real-time bay occupancy status (Green, Red, Blue, Amber, Gray), EV charging
          points, and accessibility ramps with zero latency.
        </p>
      </div>

      {/* Intelligent Allocation Engine Rules */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-500" />
          Rule-Based Intelligent Allocation Algorithm
        </h3>
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-electric-500">1.</span>
            <span>Validates user authentication, ownership of vehicle, and non-overlapping booking schedule.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-electric-500">2.</span>
            <span>Verifies facility operating hours against requested arrival and departure times.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-electric-500">3.</span>
            <span>Filters out disabled and maintenance bays from the operational capacity.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-electric-500">4.</span>
            <span>
              Enforces physical compatibility: EV vehicles are matched to fast charging bays; motorcycles to compact
              slots; SUVs to wide clearance bays.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-electric-500">5.</span>
            <span>
              Ranks candidate bays using proximity heuristics (Ground floors preferred, entry gate distance, category
              fit).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-electric-500">6.</span>
            <span>
              Applies transactional concurrency locking to guarantee zero double-booking during peak reservation spikes.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
