import React, { useState, useEffect } from 'react';
import { Truck, Receipt, CreditCard, Calendar, CheckCircle2, History } from 'lucide-react';
import api from '@/api/axios';

const PurchaseReceipt = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [balanceInfo, setBalanceInfo] = useState({
    total_purchase: 0,
    initially_paid: 0,
    remaining: 0
  });
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    cash: '',
    cheque: '',
    bank_transfer: '',
    amount_paid_now: 0,
    payment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSuppliers();
    fetchRecentReceipts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      // Get suppliers who have purchase records
      const { data } = await api.get('/purchases/purchase-receipts/suppliers');
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
    }
  };

  const fetchRecentReceipts = async () => {
    try {
      const { data } = await api.get('/purchases/purchase-receipts/');
      setRecentReceipts(data);
    } catch (error) {
      console.error('Failed to fetch recent receipts', error);
    }
  };

  const handleSupplierChange = async (name) => {
    setSelectedSupplier(name);
    if (!name) {
      setBalanceInfo({ total_purchase: 0, initially_paid: 0, remaining: 0 });
      return;
    }
    
    try {
      const { data } = await api.get(`/purchases/purchase-receipts/supplier/${encodeURIComponent(name)}/summary`);
      setBalanceInfo(data);
    } catch (error) {
      console.error('Failed to fetch summary', error);
    }
  };

  const handlePaymentChange = (field, value) => {
    const numVal = value === '' ? '' : (parseFloat(value) || 0);
    
    setFormData(prev => {
      const newForm = { ...prev, [field]: numVal };
      const cash = parseFloat(field === 'cash' ? numVal : prev.cash) || 0;
      const cheque = parseFloat(field === 'cheque' ? numVal : prev.cheque) || 0;
      const bank = parseFloat(field === 'bank_transfer' ? numVal : prev.bank_transfer) || 0;
      newForm.amount_paid_now = cash + cheque + bank;
      return newForm;
    });
  };

  const handleSaveReceipt = async () => {
    if (!selectedSupplier) return alert('Please select a supplier');
    if (formData.amount_paid_now <= 0) return alert('Please enter a payment amount');
    
    setLoading(true);
    try {
      const payload = {
        supplier: selectedSupplier,
        cash: parseFloat(formData.cash) || 0,
        cheque: parseFloat(formData.cheque) || 0,
        bank_transfer: parseFloat(formData.bank_transfer) || 0,
        amount_paid_now: formData.amount_paid_now,
        date: formData.payment_date
      };
      
      await api.post('/purchases/purchase-receipts/', payload);
      alert('Purchase receipt saved!');
      
      setFormData({
        cash: '',
        cheque: '',
        bank_transfer: '',
        amount_paid_now: 0,
        payment_date: new Date().toISOString().split('T')[0]
      });
      handleSupplierChange(selectedSupplier);
      fetchRecentReceipts();
    } catch (error) {
      console.error('Failed to save receipt', error);
      alert('Error saving receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center tracking-tighter">
            <Truck className="w-7 h-7 mr-3 text-zinc-400" />
            Add Purchase Receipt
          </h1>
          <p className="text-zinc-400 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">Supplier settlements and payment tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier & Balance Info */}
          <div className="card p-8 bg-white border-none shadow-sm space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Select Supplier</label>
              <div className="relative">
                <Truck className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
                <select 
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-5 py-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none transition-all" 
                  value={selectedSupplier} 
                  onChange={e => handleSupplierChange(e.target.value)}
                >
                  <option value="">Choose Supplier</option>
                  {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-4">
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Purchase</p>
                <p className="text-xl font-black text-zinc-900">₹{balanceInfo.total_purchase.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Initially Paid</p>
                <p className="text-xl font-black text-zinc-900">₹{balanceInfo.initially_paid.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-black rounded-2xl border border-zinc-800 shadow-xl shadow-black/10">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Remaining Amount</p>
                <p className="text-xl font-black text-white">₹{balanceInfo.remaining.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="card p-8 bg-white border-none shadow-sm space-y-10">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center border-b border-zinc-50 pb-6">
              <CreditCard className="w-4 h-4 mr-2" /> Payment Mode
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cash</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 font-black">₹</span>
                  <input 
                    type="number" 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-10 pr-5 py-4 text-lg font-black focus:ring-2 focus:ring-black outline-none transition-all" 
                    placeholder="0.00"
                    value={formData.cash}
                    onChange={e => handlePaymentChange('cash', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cheque</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 font-black">₹</span>
                  <input 
                    type="number" 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-10 pr-5 py-4 text-lg font-black focus:ring-2 focus:ring-black outline-none transition-all" 
                    placeholder="0.00"
                    value={formData.cheque}
                    onChange={e => handlePaymentChange('cheque', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Bank Transfer</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 font-black">₹</span>
                  <input 
                    type="number" 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-10 pr-5 py-4 text-lg font-black focus:ring-2 focus:ring-black outline-none transition-all" 
                    placeholder="0.00"
                    value={formData.bank_transfer}
                    onChange={e => handlePaymentChange('bank_transfer', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-50">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Amount Paid Now</label>
              <div className="bg-zinc-900 p-8 rounded-3xl flex justify-between items-center shadow-2xl shadow-zinc-900/20">
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Payment Amount</p>
                  <p className="text-4xl font-black text-white tracking-tighter">₹{formData.amount_paid_now.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Updated Remaining</p>
                  <p className="text-xl font-black text-zinc-400">₹{(balanceInfo.remaining - formData.amount_paid_now).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-w-xs">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Payment Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
                <input 
                  type="date" 
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-5 py-4 text-sm font-black focus:ring-2 focus:ring-black outline-none transition-all" 
                  value={formData.payment_date}
                  onChange={e => setFormData({...formData, payment_date: e.target.value})}
                />
              </div>
            </div>

            <button 
              onClick={handleSaveReceipt}
              disabled={loading}
              className="w-full bg-black hover:bg-zinc-800 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center transition-all shadow-2xl shadow-black/20"
            >
              <CheckCircle2 className="w-5 h-5 mr-4" /> Save Purchase Receipt
            </button>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="space-y-6">
          <div className="card h-[calc(100vh-220px)] flex flex-col bg-white border-none shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-50">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center">
                <History className="w-4 h-4 mr-2" /> Recent Settlements
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar">
              {recentReceipts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-300 text-center space-y-4 px-10 opacity-20">
                  <Receipt className="w-16 h-16" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No recent records</p>
                </div>
              ) : (
                recentReceipts.map(receipt => (
                  <div key={receipt._id} className="p-5 bg-zinc-50 border border-zinc-100 rounded-2xl group hover:border-black transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">{receipt.supplier}</p>
                      <p className="text-sm font-black text-zinc-900">₹{receipt.amount_paid_now.toLocaleString()}</p>
                    </div>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center">
                      <Calendar className="w-3 h-3 mr-1.5" /> {receipt.date}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReceipt;
