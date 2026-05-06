import React, { useState, useEffect } from 'react';
import { ShoppingCart, Save, Plus, Trash2, Calendar, User, Tag, MapPin, Building } from 'lucide-react';
import api from '@/api/axios';

const Purchases = () => {
  // Header State
  const [supplier, setSupplier] = useState({ name: '', phone: '', place: '', site: '' });
  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [places, setPlaces] = useState([]);
  const [sites, setSites] = useState([]);
  const [supplierNames, setSupplierNames] = useState([]);

  // Item Selection State
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [purchaseRate, setPurchaseRate] = useState('');
  
  // Table State
  const [items, setItems] = useState([]);

  // Footer State
  const [paymentType, setPaymentType] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
    generateBillNo();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [brandsRes, suppliersRes, placesRes, sitesRes] = await Promise.all([
        api.get('/products/brands/'),
        api.get('/customers/names/'),
        api.get('/customers/places/'),
        api.get('/customers/sites/')
      ]);
      setBrands(brandsRes.data);
      setSupplierNames(suppliersRes.data);
      setPlaces(placesRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      console.error('Failed to fetch initial data', error);
    }
  };

  const generateBillNo = () => {
    setBillNo(`P${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`);
  };

  const handleSupplierChange = async (name) => {
    setSupplier(prev => ({ ...prev, name }));
  };

  const handleBrandChange = async (brand) => {
    setSelectedBrand(brand);
    setSelectedProduct('');
    setPurchaseRate('');
    try {
      if (!brand) return setProducts([]);
      const { data } = await api.get(`/products/by-brand/${encodeURIComponent(brand)}/`);
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const handleProductSelect = (productName) => {
    setSelectedProduct(productName);
    const p = products.find(prod => prod.product_name === productName);
    if (p) setPurchaseRate(p.purchase_rate);
  };

  const addItem = () => {
    if (!selectedBrand || !selectedProduct || !qty || !purchaseRate) return;
    
    setItems([...items, {
      brand: selectedBrand,
      product: selectedProduct,
      qty: parseFloat(qty),
      rate: parseFloat(purchaseRate),
      total: parseFloat(qty) * parseFloat(purchaseRate)
    }]);
    
    setSelectedProduct('');
    setQty(1);
    setPurchaseRate('');
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleSavePurchase = async () => {
    if (items.length === 0 || !supplier.name) return alert('Please enter supplier name and add items');
    
    setLoading(true);
    try {
      const payload = {
        supplier_name: supplier.name,
        supplier_phone: supplier.phone,
        bill_no: billNo,
        date: date,
        place: supplier.place,
        site: supplier.site,
        payment_type: paymentType,
        items: items.map(item => ({
          brand: item.brand,
          product: item.product,
          qty: item.qty,
          rate: item.rate,
          total: item.total
        })),
        paid: parseFloat(amountPaid) || 0
      };
      
      await api.post('/purchases/', payload);
      alert('Purchase saved successfully!');
      
      setItems([]);
      setSupplier({ name: '', phone: '', place: '', site: '' });
      setAmountPaid('');
      generateBillNo();
    } catch (error) {
      console.error('Failed to save purchase', error);
      alert('Error saving purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 flex items-center tracking-tighter">
          <ShoppingCart className="w-7 h-7 mr-3 text-zinc-400" />
          Add New Purchase
        </h1>
        <p className="text-zinc-400 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">Record stock received from suppliers</p>
      </div>

      <div className="flex-1 flex flex-col space-y-6 min-h-0">
        <div className="card p-8 bg-white border-none shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="md:col-span-2 lg:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Supplier Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
              <input 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-5 py-3.5 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none transition-all" 
                value={supplier.name} 
                onChange={e => handleSupplierChange(e.target.value)}
                list="supplier-names"
                placeholder="Type or Select..."
              />
              <datalist id="supplier-names">
                {supplierNames.map(name => <option key={name} value={name} />)}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Bill No</label>
            <input 
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3.5 text-xs font-black focus:ring-2 focus:ring-black outline-none transition-all" 
              value={billNo}
              onChange={e => setBillNo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
              <input 
                type="date"
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-5 py-3.5 text-xs font-black focus:ring-2 focus:ring-black outline-none transition-all" 
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Place</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
              <input 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-5 py-3.5 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none transition-all" 
                value={supplier.place}
                onChange={e => setSupplier({...supplier, place: e.target.value})}
                list="place-list"
                placeholder="Type Place..."
              />
              <datalist id="place-list">
                {places.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Site</label>
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
              <input 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-12 pr-5 py-3.5 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none transition-all" 
                value={supplier.site}
                onChange={e => setSupplier({...supplier, site: e.target.value})}
                list="site-list"
                placeholder="Type Site..."
              />
              <datalist id="site-list">
                {sites.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
        </div>

        <div className="card p-8 bg-zinc-50 border-zinc-100 flex flex-wrap items-end gap-6 shadow-inner">
          <div className="min-w-[200px] flex-1 space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Brand</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 w-4 h-4" />
              <input 
                className="w-full bg-white border border-zinc-200 rounded-xl pl-12 pr-5 py-3.5 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none transition-all" 
                value={selectedBrand}
                onChange={e => handleBrandChange(e.target.value)}
                list="brand-list"
                placeholder="Type Brand..."
              />
              <datalist id="brand-list">
                {brands.map(b => <option key={b} value={b} />)}
              </datalist>
            </div>
          </div>
          <div className="min-w-[300px] flex-[2] space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Product</label>
            <input 
              className="w-full bg-white border border-zinc-200 rounded-xl px-5 py-3.5 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none transition-all disabled:opacity-50" 
              value={selectedProduct}
              onChange={e => handleProductSelect(e.target.value)}
              disabled={!selectedBrand}
              list="product-list"
              placeholder="Type Product..."
            />
            <datalist id="product-list">
              {products.map(p => <option key={p.product_name} value={p.product_name} />)}
            </datalist>
          </div>
          <div className="w-24 space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Qty</label>
            <input type="number" className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3.5 text-center font-black focus:ring-2 focus:ring-black transition-all" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div className="w-40 space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Purchase Rate</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 font-black">₹</span>
              <input type="number" className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-3.5 font-black focus:ring-2 focus:ring-black transition-all" value={purchaseRate} onChange={e => setPurchaseRate(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <button onClick={addItem} className="bg-black hover:bg-zinc-800 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center shadow-xl transition-all active:scale-95 mb-0.5">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </button>
        </div>

        <div className="card flex-1 flex flex-col min-h-0 bg-white overflow-hidden shadow-sm border-none">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-zinc-100">
              <thead className="bg-zinc-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="table-header w-16 text-center">S.No</th>
                  <th className="table-header">Brand</th>
                  <th className="table-header">Product</th>
                  <th className="table-header text-center w-24">Qty</th>
                  <th className="table-header text-right w-40">Purchase Rate</th>
                  <th className="table-header text-right w-40">Total</th>
                  <th className="table-header w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 bg-white">
                {items.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-20 text-zinc-300 font-black uppercase tracking-widest text-[10px]">No items added yet</td></tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-zinc-50 transition-all">
                      <td className="table-cell text-center font-black text-zinc-400">{idx + 1}</td>
                      <td className="table-cell">
                        <span className="text-[9px] font-black px-2 py-1 bg-zinc-100 rounded text-zinc-500 uppercase tracking-widest">{item.brand}</span>
                      </td>
                      <td className="table-cell font-black text-zinc-900 uppercase text-xs tracking-tight">{item.product}</td>
                      <td className="table-cell text-center font-black text-zinc-600">{item.qty}</td>
                      <td className="table-cell text-right font-black text-zinc-400">₹{item.rate.toLocaleString()}</td>
                      <td className="table-cell text-right font-black text-zinc-900">₹{item.total.toLocaleString()}</td>
                      <td className="table-cell text-center">
                        <button onClick={() => removeItem(idx)} className="p-2 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex flex-wrap justify-between items-center gap-8">
            <div className="flex items-center space-x-12">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-1">Payment Type</label>
                <div className="flex bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
                  <button onClick={() => setPaymentType('Cash')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${paymentType === 'Cash' ? 'bg-black text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-900'}`}>Cash</button>
                  <button onClick={() => setPaymentType('Credit')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${paymentType === 'Credit' ? 'bg-black text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-900'}`}>Credit</button>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-1">Amount Paid</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-300 font-black text-xs">₹</span>
                  <input type="number" className="bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-3 font-black focus:ring-2 focus:ring-black outline-none transition-all w-48 shadow-sm" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Remaining Amount</p>
                <p className="text-xl font-black text-zinc-900">₹{(grandTotal - (parseFloat(amountPaid) || 0)).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-10">
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Grand Total</p>
                <p className="text-4xl font-black text-zinc-900 tracking-tighter">₹{grandTotal.toLocaleString()}</p>
              </div>
              <button onClick={handleSavePurchase} disabled={loading || items.length === 0} className="bg-black hover:bg-zinc-800 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center shadow-2xl transition-all active:scale-95">
                <Save className="w-5 h-5 mr-4" /> Save Purchase
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
