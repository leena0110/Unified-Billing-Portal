import React, { useState, useEffect } from 'react';
import { User, Receipt, CreditCard, Calendar, CheckCircle2, History, IndianRupee } from 'lucide-react';
import api from '@/api/axios';

const SalesReceipt = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [balanceInfo, setBalanceInfo] = useState({
    total_sales: 0,
    total_paid: 0,
    remaining_amount: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    cash: '',
    cheque: '',
    bank_transfer: '',
    amount_received: 0,
    payment_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  useEffect(() => {
    fetchCustomers();
    fetchRecentPayments();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers/names');
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const { data } = await api.get('/payments/');
      setRecentPayments(data);
    } catch (error) {
      console.error('Failed to fetch recent payments', error);
    }
  };

  const handleCustomerChange = async (name) => {
    setSelectedCustomer(name);
    if (!name) {
      setBalanceInfo({ total_sales: 0, total_paid: 0, remaining_amount: 0 });
      return;
    }
    
    try {
      const { data } = await api.get(`/customers/balance/${encodeURIComponent(name)}/`);
      setBalanceInfo(data);
    } catch (error) {
      console.error('Failed to fetch balance', error);
    }
  };

  const handlePaymentChange = (field, value) => {
    const numVal = value === '' ? '' : (parseFloat(value) || 0);
    
    setFormData(prev => {
      const newForm = { ...prev, [field]: numVal };
      
      // Auto-calculate total received
      const cash = parseFloat(field === 'cash' ? numVal : prev.cash) || 0;
      const cheque = parseFloat(field === 'cheque' ? numVal : prev.cheque) || 0;
      const bank = parseFloat(field === 'bank_transfer' ? numVal : prev.bank_transfer) || 0;
      
      newForm.amount_received = cash + cheque + bank;
      return newForm;
    });
  };

  const handleSaveReceipt = async () => {
    if (!selectedCustomer) return alert('Please select a customer');
    if (formData.amount_received <= 0) return alert('Please enter a payment amount');
    
    setLoading(true);
    try {
      const payload = {
        customer_name: selectedCustomer,
        cash: parseFloat(formData.cash) || 0,
        cheque: parseFloat(formData.cheque) || 0,
        bank_transfer: parseFloat(formData.bank_transfer) || 0,
        amount_received: formData.amount_received,
        payment_date: formData.payment_date,
        remarks: formData.remarks
      };
      
      await api.post('/payments/', payload);
      alert('Receipt saved successfully!');
      
      // Reset form and refresh data
      setFormData({
        cash: '',
        cheque: '',
        bank_transfer: '',
        amount_received: 0,
        payment_date: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      handleCustomerChange(selectedCustomer);
      fetchRecentPayments();
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
            <Receipt className="w-7 h-7 mr-3 text-zinc-400" />
            Add Sales Receipt
          </h1>
          <p className="text-zinc-400 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">Record payments and manage customer balances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection & Balance View */}
          <div className="card p-8 bg-white border-none shadow-sm space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Select Customer</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
                <select 
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-5 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                  value={selectedCustomer} 
                  onChange={e => handleCustomerChange(e.target.value)}
                >
                  <option value="">Choose Customer</option>
                  {customers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-4">
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Sales</p>
                <p className="text-xl font-black text-zinc-900">₹{balanceInfo.total_sales.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Amount Paid</p>
                <p className="text-xl font-black text-green-600">₹{balanceInfo.total_paid.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl shadow-zinc-900/10">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Remaining</p>
                <p className="text-xl font-black text-white">₹{balanceInfo.remaining_amount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Payment Entry Card */}
          <div className="card p-8 bg-white border-none shadow-sm space-y-10">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center border-b border-zinc-50 pb-6">
              <CreditCard className="w-4 h-4 mr-2" /> Payment Mode & Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cash</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 font-black">₹</span>
                  <input 
                    type="number" 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-10 pr-5 py-4 text-lg font-black focus:outline-none focus:ring-2 focus:ring-black transition-all" 
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
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-10 pr-5 py-4 text-lg font-black focus:outline-none focus:ring-2 focus:ring-black transition-all" 
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
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-10 pr-5 py-4 text-lg font-black focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                    placeholder="0.00"
                    value={formData.bank_transfer}
                    onChange={e => handlePaymentChange('bank_transfer', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-50">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Amount Received Now</label>
              <div className="bg-zinc-900 p-8 rounded-3xl flex justify-between items-center shadow-2xl shadow-zinc-900/20">
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Payment</p>
                  <p className="text-4xl font-black text-white tracking-tighter">₹{formData.amount_received.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">New Remaining Balance</p>
                  <p className="text-xl font-black text-zinc-400">₹{(balanceInfo.remaining_amount - formData.amount_received).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Payment Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
                  <input 
                    type="date" 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-5 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                    value={formData.payment_date}
                    onChange={e => setFormData({...formData, payment_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Remarks (Optional)</label>
                <input 
                  type="text" 
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                  placeholder="Reference number, etc."
                  value={formData.remarks}
                  onChange={e => setFormData({...formData, remarks: e.target.value})}
                />
              </div>
            </div>

            <button 
              onClick={handleSaveReceipt}
              disabled={loading}
              className="w-full bg-black hover:bg-zinc-800 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center transition-all shadow-2xl shadow-black/20"
            >
              <CheckCircle2 className="w-5 h-5 mr-4" /> Save Receipt & Update Balance
            </button>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="space-y-6">
          <div className="card h-[calc(100vh-220px)] flex flex-col bg-white border-none shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center">
                <History className="w-4 h-4 mr-2" /> Recent Receipts
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar">
              {recentPayments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-300 text-center space-y-4 px-10">
                  <Receipt className="w-16 h-16 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No recent transactions</p>
                </div>
              ) : (
                recentPayments.map(payment => (
                  <div key={payment._id} className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl hover:border-black transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">{payment.customer_name}</p>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center">
                          <Calendar className="w-3 h-3 mr-1.5" /> {payment.payment_date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-zinc-900">₹{payment.amount_received.toLocaleString()}</p>
                        <p className="text-[8px] font-black text-green-500 uppercase tracking-widest">Received</p>
                      </div>
                    </div>
                    {(payment.cash > 0 || payment.cheque > 0 || payment.bank_transfer > 0) && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-200/50">
                        {payment.cash > 0 && <span className="text-[8px] font-black px-2 py-1 bg-white rounded-md text-zinc-500 border border-zinc-200 uppercase">Cash</span>}
                        {payment.cheque > 0 && <span className="text-[8px] font-black px-2 py-1 bg-white rounded-md text-zinc-500 border border-zinc-200 uppercase">Cheque</span>}
                        {payment.bank_transfer > 0 && <span className="text-[8px] font-black px-2 py-1 bg-white rounded-md text-zinc-500 border border-zinc-200 uppercase">Bank</span>}
                      </div>
                    )}
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

export default SalesReceipt;
