import React, { useState, useEffect } from 'react';
import { Tag, Save, Calendar, Info, ArrowRight, Trash2 } from 'lucide-react';
import api from '@/api/axios';

const RateChange = () => {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    new_purchase_rate: 0,
    margin1: 0,
    margin2: 0,
    wholesale_rate: 0,
    retail_rate: 0,
    effective_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchBrands();
    fetchPendingChanges();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data } = await api.get('/products/brands');
      setBrands(data);
    } catch (error) {
      console.error('Failed to fetch brands', error);
    }
  };

  const fetchProductsByBrand = async (brand) => {
    try {
      if (!brand) return setProducts([]);
      const { data } = await api.get(`/products/by-brand/${brand}`);
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const fetchPendingChanges = async () => {
    try {
      const { data } = await api.get('/products/rate-changes/pending');
      setPendingChanges(data);
    } catch (error) {
      console.error('Failed to fetch pending changes', error);
    }
  };

  const handleBrandChange = (brand) => {
    setSelectedBrand(brand);
    setSelectedProduct(null);
    fetchProductsByBrand(brand);
  };

  const handleProductSelect = (productName) => {
    const product = products.find(p => p.product_name === productName);
    if (!product) return;
    
    setSelectedProduct(product);
    setFormData({
      ...formData,
      new_purchase_rate: product.purchase_rate,
      margin1: product.margin1 || 0,
      margin2: product.margin2 || 0,
      wholesale_rate: product.wholesale_rate,
      retail_rate: product.retail_rate
    });
  };

  const handleFormChange = (field, value) => {
    // Allow empty string for better input handling
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }

    const val = field === 'effective_date' ? value : (parseFloat(value) || 0);
    
    setFormData(prev => {
      const updates = { ...prev, [field]: val };
      
      // Auto-calculations
      if (['new_purchase_rate', 'margin1', 'margin2', 'wholesale_rate'].includes(field)) {
        const pr = field === 'new_purchase_rate' ? val : (parseFloat(prev.new_purchase_rate) || 0);
        const m1 = field === 'margin1' ? val : (parseFloat(prev.margin1) || 0);
        const m2 = field === 'margin2' ? val : (parseFloat(prev.margin2) || 0);
        let wr = field === 'wholesale_rate' ? val : (parseFloat(prev.wholesale_rate) || 0);
        
        if (m1 > 0 && field !== 'wholesale_rate') {
          wr = Math.round(pr * (1 + m1 / 100));
        }
        
        let rr = parseFloat(prev.retail_rate) || 0;
        if (m2 > 0) {
          rr = Math.round(wr * (1 + m2 / 100));
        }
        
        updates.wholesale_rate = wr;
        updates.retail_rate = rr;
      }
      
      return updates;
    });
  };

  const handleScheduleChange = async () => {
    if (!selectedProduct) return alert('Select a product first');
    setLoading(true);
    try {
      const payload = {
        product_name: selectedProduct.product_name,
        new_purchase_rate: parseFloat(formData.new_purchase_rate) || 0,
        margin1: parseFloat(formData.margin1) || 0,
        margin2: parseFloat(formData.margin2) || 0,
        wholesale_rate: parseFloat(formData.wholesale_rate) || 0,
        retail_rate: parseFloat(formData.retail_rate) || 0,
        effective_date: formData.effective_date
      };
      
      await api.post('/products/rate-change/', payload);
      alert('Rate change scheduled successfully!');
      fetchPendingChanges();
    } catch (error) {
      console.error('Failed to schedule rate change', error);
      const errorMsg = error.response?.data?.detail || error.message || "Unknown error";
      alert(`Error scheduling rate change: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center tracking-tighter">
            <Tag className="w-7 h-7 mr-3 text-zinc-400" />
            Update Prices
          </h1>
          <p className="text-zinc-400 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">Schedule future price changes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Selection Card */}
          <div className="card p-8 bg-white grid grid-cols-2 gap-8 border-none shadow-sm">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Select Brand</label>
              <select className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black transition-all" value={selectedBrand} onChange={e => handleBrandChange(e.target.value)}>
                <option value="">Choose Brand</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Select Product</label>
              <select 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black transition-all disabled:opacity-50" 
                disabled={!selectedBrand}
                value={selectedProduct?.product_name || ''}
                onChange={e => handleProductSelect(e.target.value)}
              >
                <option value="">Choose Product</option>
                {products.map(p => <option key={p.product_name} value={p.product_name}>{p.product_name}</option>)}
              </select>
            </div>
          </div>

          {selectedProduct && (
            <div className="card p-10 bg-white border-none shadow-sm space-y-10">
              <div className="flex justify-between items-end pb-8 border-b border-zinc-50">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center">
                    <Info className="w-4 h-4 mr-2" /> Current Profile
                  </h3>
                  <div className="flex space-x-12">
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Purchase Rate</p>
                      <p className="text-2xl font-black text-zinc-900">₹{selectedProduct.purchase_rate.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Effective Date</p>
                      <p className="text-2xl font-black text-zinc-900">{selectedProduct.purchase_date || 'Initial'}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Modified Date</p>
                  <p className="text-sm font-black text-zinc-900">{new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">New Purchase Rate</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 font-black">₹</span>
                    <input 
                      type="number" 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-10 pr-5 py-4 text-xl font-black focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      value={formData.new_purchase_rate || ''} 
                      onChange={e => handleFormChange('new_purchase_rate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Effective From</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
                    <input 
                      type="date" 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-5 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                      value={formData.effective_date} 
                      onChange={e => handleFormChange('effective_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 hidden md:block"></div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Margin 1 (%)</label>
                  <input 
                    type="number" 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-xl font-black focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={formData.margin1 === 0 ? '' : formData.margin1} 
                    onChange={e => handleFormChange('margin1', e.target.value)}
                  />
                  <p className="text-[9px] text-zinc-400 font-bold uppercase italic ml-1">0 = Manual Entry</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Wholesale Rate</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 font-black">₹</span>
                    <input 
                      type="number" 
                      readOnly={parseFloat(formData.margin1) > 0}
                      className={`w-full border rounded-xl pl-10 pr-5 py-4 text-xl font-black focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${parseFloat(formData.margin1) > 0 ? 'bg-zinc-50 border-zinc-100 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-900'}`} 
                      value={formData.wholesale_rate || ''} 
                      onChange={e => handleFormChange('wholesale_rate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 hidden md:block"></div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Margin 2 (%)</label>
                  <input 
                    type="number" 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-xl font-black focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={formData.margin2 === 0 ? '' : formData.margin2} 
                    onChange={e => handleFormChange('margin2', e.target.value)}
                  />
                  <p className="text-[9px] text-zinc-400 font-bold uppercase italic ml-1">0 = Manual Entry</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Retail Rate</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 font-black">₹</span>
                    <input 
                      type="number" 
                      readOnly={parseFloat(formData.margin2) > 0}
                      className={`w-full border rounded-xl pl-10 pr-5 py-4 text-xl font-black focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${parseFloat(formData.margin2) > 0 ? 'bg-zinc-50 border-zinc-100 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-900'}`} 
                      value={formData.retail_rate || ''} 
                      onChange={e => handleFormChange('retail_rate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleScheduleChange}
                disabled={loading}
                className="w-full bg-black hover:bg-zinc-800 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center transition-all shadow-2xl shadow-black/20"
              >
                <Save className="w-5 h-5 mr-4" /> Save Rate Schedule
              </button>
            </div>
          )}
        </div>

        {/* Queued Updates */}
        <div className="space-y-6">
          <div className="card h-[calc(100vh-280px)] flex flex-col bg-white border-none shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-50">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Queued Registry</h3>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar">
              {pendingChanges.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-300 text-center space-y-4 px-10">
                  <Tag className="w-16 h-16 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No pending transitions</p>
                </div>
              ) : (
                pendingChanges.map(change => (
                  <div key={change._id} className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl hover:border-black transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">{change.product_name}</p>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center">
                          <Calendar className="w-3 h-3 mr-1.5" /> {change.effective_date}
                        </p>
                      </div>
                      <button className="text-zinc-200 hover:text-red-500 p-1 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-200/50">
                      <div className="text-center flex-1">
                        <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">WS</p>
                        <p className="text-sm font-black text-zinc-900">₹{change.wholesale_rate.toLocaleString()}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-200 mx-2" />
                      <div className="text-center flex-1">
                        <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">RT</p>
                        <p className="text-sm font-black text-zinc-900">₹{change.retail_rate.toLocaleString()}</p>
                      </div>
                    </div>
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

export default RateChange;
