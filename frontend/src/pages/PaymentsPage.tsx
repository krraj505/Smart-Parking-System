import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import type { Payment } from '../types';
import { useAuth } from '../context/AuthContext';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Simulated Payment Modal
  const [showSimulateModal, setShowSimulateModal] = useState<boolean>(false);
  const [simAmount, setSimAmount] = useState<number>(120);
  const [simMethod, setSimMethod] = useState<string>('simulated_upi');
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setRefreshing(true);
      const data = await api.getPayments();
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimSuccess(null);
    try {
      const p = await api.simulatePayment({
        amount: simAmount,
        payment_method: simMethod,
      });
      setSimSuccess(`Payment of ₹${p.amount} simulated successfully! Ref: ${p.transaction_reference}`);
      fetchPayments();
      setTimeout(() => {
        setShowSimulateModal(false);
        setSimSuccess(null);
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed.');
    } finally {
      setSimLoading(false);
    }
  };

  const totalSpent = payments
    .filter(p => p.status === 'successful')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            Payments & Settlement History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review parking session fees, digital UPI receipts, and simulated payment transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSimulateModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Simulate Payment
          </button>

          <button
            onClick={fetchPayments}
            disabled={refreshing}
            className="p-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            title="Refresh payments"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Processed</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-400">₹</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalSpent.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Across {payments.length} transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Settlement Gateway</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">Simulated Razorpay / UPI</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
              Active
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Automated barrier clearance hook enabled</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Default Currency</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">INR (₹)</span>
            <span className="text-[11px] text-slate-400">Indian Rupee</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Standard municipal mobility tariff</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Transaction Ledger</h3>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-12 bg-slate-100 dark:bg-navy-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No payment records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Transaction Reference</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Gateway</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {p.transaction_reference}
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900 dark:text-white">₹{p.amount.toFixed(2)}</td>
                    <td className="py-3 px-3 uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {p.payment_method.replace('simulated_', '')}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      {p.payment_gateway}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(p.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowSimulateModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
                Dev Testing
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Simulate Payment</h2>
              <p className="text-xs text-slate-400">Test digital payment processing and ledger settlement.</p>
            </div>

            {simSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold text-center">
                {simSuccess}
              </div>
            ) : (
              <form onSubmit={handleSimulatePayment} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Amount (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={simAmount}
                    onChange={e => setSimAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Simulated Channel
                  </label>
                  <select
                    value={simMethod}
                    onChange={e => setSimMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="simulated_upi">UPI FastPay (PhonePe / GPay / Paytm)</option>
                    <option value="simulated_card">Credit / Debit Card</option>
                    <option value="simulated_netbanking">Net Banking</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSimulateModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={simLoading}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                  >
                    {simLoading ? 'Authorizing...' : 'Authorize Simulation'}
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
