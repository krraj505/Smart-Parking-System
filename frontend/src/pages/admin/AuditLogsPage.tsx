import React, { useState, useEffect } from 'react';
import { FileText, Shield, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import type { AuditLogItem } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.adminGetAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-500" />
            Security & Operational Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable log of reservation creations, cancellations, gate entries, checkouts, and admin actions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
          title="Refresh logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="h-12 bg-slate-100 dark:bg-navy-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Entity ID</th>
                  <th className="py-2.5 px-3">Details / Narrative</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-electric-600 dark:text-electric-400 bg-electric-500/10 px-2 py-0.5 rounded-md text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {log.entity_type || 'System'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      {log.entity_id || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-md truncate">
                      {log.details || 'Action completed'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
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
