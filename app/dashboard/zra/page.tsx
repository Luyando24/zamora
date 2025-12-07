'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface ZraTransaction {
  id: string;
  created_at: string;
  folio_id: string;
  vsdc_approval_code: string;
  status: string;
  response_payload: any;
  folios: {
    total_amount: number;
    zra_invoice_number: string;
  };
}

export default function ZraDashboard() {
  const [transactions, setTransactions] = useState<ZraTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    vatLiability: 0, // 16%
    tourismLevy: 0,  // 1.5%
    fiscalizedCount: 0
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    // Fetch successful ZRA transactions from the last 30 days
    const { data, error } = await supabase
      .from('zra_transactions')
      .select(`
        *,
        folios ( total_amount, zra_invoice_number )
      `)
      .eq('status', 'success')
      .gte('created_at', subDays(new Date(), 30).toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      setTransactions(data as any);
      
      // Calculate Stats
      const totalSales = data.reduce((sum, tx: any) => sum + (tx.folios?.total_amount || 0), 0);
      // Simplified Tax Logic: Assuming inclusive of taxes for this demo
      // VAT (16%) = Total * 16/116
      // Levy (1.5%) = Total * 1.5/100 (Usually calculated on base, but let's approximate for MVP)
      
      setStats({
        totalSales,
        vatLiability: totalSales * (16 / 116),
        tourismLevy: totalSales * 0.015,
        fiscalizedCount: data.length
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">ZRA Tax Compliance Report</h1>
        <div className="text-sm text-gray-500">
          Last 30 Days
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-gray-500">Total Fiscalized Sales</p>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">K {stats.totalSales.toFixed(2)}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-gray-500">VAT Liability (16%)</p>
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">K {stats.vatLiability.toFixed(2)}</div>
          <p className="text-xs text-gray-400 mt-1">Estimated</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-gray-500">Tourism Levy (1.5%)</p>
            <FileText className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">K {stats.tourismLevy.toFixed(2)}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-gray-500">Invoices Issued</p>
            <CheckCircle2 className="h-4 w-4 text-zambia-green" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.fiscalizedCount}</div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Recent Fiscal Transmissions</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading ZRA data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VSDC Mark ID</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {tx.folios?.zra_invoice_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {tx.vsdc_approval_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                      K {tx.folios?.total_amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Fiscalized
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No fiscalized transactions found in the last 30 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
