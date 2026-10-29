import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  DoorOpen,
  Info,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import type { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter(n => (filter === 'unread' ? !n.is_read : true));
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'reservation':
        return CalendarCheck;
      case 'check_in':
      case 'check_out':
        return DoorOpen;
      case 'payment':
        return CreditCard;
      default:
        return Info;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-electric-500" />
            Notification Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System alerts, reservation confirmations, gate clearance events, and digital receipts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-750 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4 text-emerald-500" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-800 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-electric-600 text-white shadow-glow-blue'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-electric-600 text-white shadow-glow-blue'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-white dark:bg-navy-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-2">
          <Bell className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">No notifications in this view</p>
          <p className="text-xs text-slate-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(notif => {
            const Icon = getIcon(notif.notification_type);

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                  notif.is_read
                    ? 'bg-white dark:bg-navy-900/60 border-slate-200 dark:border-navy-800 opacity-80'
                    : 'bg-white dark:bg-navy-900 border-electric-500/30 shadow-sm'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notif.is_read
                      ? 'bg-slate-100 dark:bg-navy-800 text-slate-400'
                      : 'bg-electric-500/10 text-electric-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{notif.title}</h3>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notif.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>

                  <div className="mt-3 flex items-center gap-3">
                    {notif.link && (
                      <button
                        onClick={() => navigate(notif.link!)}
                        className="text-xs font-bold text-electric-500 hover:underline flex items-center gap-1"
                      >
                        View Details <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
