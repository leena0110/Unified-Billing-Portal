import React, { useState, useEffect } from 'react';
import { Receipt, Search, Calendar, Printer, MessageCircle, FileText } from 'lucide-react';
import api from '@/api/axios';

const SalesSummary = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    payment_type: ''
  });

  useEffect(() => {
    fetchBills();
  }, [filters]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('customer', searchTerm);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.payment_type) params.append('payment_type', filters.payment_type);
      
      const { data } = await api.get(`/bills/?${params.toString()}`);
      setBills(data);
    } catch (error) {
      console.error('Failed to fetch bills', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (billId) => {
    window.open(`${api.defaults.baseURL}/bills/${billId}/pdf`, '_blank');
  };

  const handleWhatsApp = async (billId) => {
    try {
      const { data } = await api.get(`/bills/${billId}/receipt-text`);
      const phone = data.phone.startsWith('91') ? data.phone : '91' + data.phone.replace(/\D/g, '');
      window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(data.text)}`, '_blank');
    } catch (e) {
      alert('Error fetching receipt text');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 flex items-center tracking-tighter">
          <Receipt className="w-7 h-7 mr-3 text-zinc-400" />
          Sales History
        </h1>
        <p className="text-zinc-400 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">View all bills generated for customers</p>
      </div>

      {/* Filters */}
      <div className="card p-6 bg-white border-none shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search Customer..."
            className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-4 py-3 text-xs font-black uppercase"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchBills()}
          />
        </div>
        <input 
          type="date"
          className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-xs font-black"
          value={filters.date_from}
          onChange={e => setFilters({...filters, date_from: e.target.value})}
        />
        <input 
          type="date"
          className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-xs font-black"
          value={filters.date_to}
          onChange={e => setFilters({...filters, date_to: e.target.value})}
        />
        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-xs font-black uppercase"
          value={filters.payment_type}
          onChange={e => setFilters({...filters, payment_type: e.target.value})}
        >
          <option value="">All Payments</option>
          <option value="Cash">Cash</option>
          <option value="Credit">Credit</option>
        </select>
      </div>

      {/* Summary Table */}
      <div className="card flex-1 bg-white border-none shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead className="bg-zinc-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Bill No</th>
                <th className="table-header">Customer</th>
                <th className="table-header text-right">Total</th>
                <th className="table-header text-center">Type</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 bg-white">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-20 font-black text-zinc-300 uppercase tracking-widest text-xs animate-pulse">Loading Records...</td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-20 font-black text-zinc-300 uppercase tracking-widest text-xs">No billing records found</td></tr>
              ) : (
                bills.map(bill => (
                  <tr key={bill._id} className="hover:bg-zinc-50 transition-all group">
                    <td className="table-cell font-black text-zinc-400 text-[10px] uppercase">{bill.date}</td>
                    <td className="table-cell font-black text-zinc-900 tracking-widest text-[10px]">{bill.bill_no}</td>
                    <td className="table-cell font-black text-zinc-900 uppercase text-xs tracking-tight">{bill.customer_name}</td>
                    <td className="table-cell text-right font-black text-zinc-900">Rs.{bill.total.toLocaleString()}</td>
                    <td className="table-cell text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${bill.payment_type === 'Cash' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {bill.payment_type}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handlePrint(bill._id)} className="p-2 bg-zinc-100 hover:bg-zinc-900 hover:text-white rounded-lg transition-all" title="Print Receipt">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleWhatsApp(bill._id)} className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all" title="Share via WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesSummary;
