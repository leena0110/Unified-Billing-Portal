import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Calendar, User, ArrowRight } from 'lucide-react';
import api from '@/api/axios';

const PurchaseSummary = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/purchases/');
      setPurchases(data);
    } catch (error) {
      console.error('Failed to fetch purchases', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(p => 
    p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.bill_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 flex items-center tracking-tighter">
          <ShoppingCart className="w-7 h-7 mr-3 text-zinc-400" />
          Purchase History
        </h1>
        <p className="text-zinc-400 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">View all stock bought from suppliers</p>
      </div>

      {/* Search */}
      <div className="card p-6 bg-white border-none shadow-sm flex items-center space-x-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search Supplier or Bill No..."
            className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-black transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Table */}
      <div className="card flex-1 bg-white border-none shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead className="bg-zinc-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Bill No</th>
                <th className="table-header">Supplier</th>
                <th className="table-header text-right">Total Amount</th>
                <th className="table-header text-right">Paid</th>
                <th className="table-header text-right">Balance</th>
                <th className="table-header w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 bg-white">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-20 font-black text-zinc-300 uppercase tracking-widest text-xs animate-pulse">Loading Records...</td></tr>
              ) : filteredPurchases.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-20 font-black text-zinc-300 uppercase tracking-widest text-xs">No purchase records found</td></tr>
              ) : (
                filteredPurchases.map(p => (
                  <tr key={p._id} className="hover:bg-zinc-50 transition-all group">
                    <td className="table-cell font-black text-zinc-400 text-[10px] uppercase">{p.date}</td>
                    <td className="table-cell font-black text-zinc-900 tracking-widest text-[10px] uppercase">{p.bill_no}</td>
                    <td className="table-cell font-black text-zinc-900 uppercase text-xs tracking-tight">{p.supplier_name}</td>
                    <td className="table-cell text-right font-black text-zinc-900">Rs.{p.total_purchase.toLocaleString()}</td>
                    <td className="table-cell text-right font-black text-green-600">Rs.{p.paid.toLocaleString()}</td>
                    <td className="table-cell text-right font-black text-red-500">Rs.{p.remaining.toLocaleString()}</td>
                    <td className="table-cell text-center">
                      <button className="p-2 text-zinc-200 hover:text-zinc-900 transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </button>
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

export default PurchaseSummary;
