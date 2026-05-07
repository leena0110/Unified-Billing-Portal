import React, { useState, useEffect } from 'react';
import { Receipt, Search, Plus, Trash2, Save, Printer, Edit3, Image } from 'lucide-react';
import api from '@/api/axios';
import html2canvas from 'html2canvas';
import ThermalReceipt from '@/components/ThermalReceipt';

const Billing = () => {
  const [billNo, setBillNo] = useState('');
  const [customer, setCustomer] = useState({ name: 'Cash Sale', phone: '', place: '', site: '' });
  const [billType, setBillType] = useState('Retail');
  const [paymentType, setPaymentType] = useState('Cash');
  const [includeGst, setIncludeGst] = useState(false);
  const [items, setItems] = useState([]);
  const [savedBillData, setSavedBillData] = useState(null);
  
  // Selection/Editing state
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Product Selection State
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [amountPaid, setAmountPaid] = useState(0);
  const [customerNames, setCustomerNames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNextBillNo();
    fetchBrands();
    fetchCustomerNames();
  }, []);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const cgst = includeGst ? subtotal * 0.09 : 0;
  const sgst = includeGst ? subtotal * 0.09 : 0;
  const total = subtotal + cgst + sgst;

  useEffect(() => {
    if (paymentType === 'Cash') {
      setAmountPaid(total);
    } else {
      setAmountPaid(0);
    }
  }, [total, paymentType]);

  const fetchNextBillNo = async () => {
    try {
      const { data } = await api.get('/bills/next-number');
      setBillNo(data.bill_no);
    } catch (error) {
      console.error('Failed to fetch bill number', error);
    }
  };

  const fetchCustomerNames = async () => {
    try {
      const { data } = await api.get('/customers/names');
      setCustomerNames(data);
    } catch (error) {
      console.error('Failed to fetch customer names', error);
    }
  };

  const handleCustomerNameChange = async (name) => {
    setCustomer({ ...customer, name });
    
    // Auto-fetch details if name exists in our known list
    if (customerNames.some(cn => cn.toLowerCase() === name.toLowerCase())) {
      try {
        const { data } = await api.get(`/customers/by-name/${encodeURIComponent(name)}`);
        setCustomer({
          name: data.name,
          phone: data.phone || '',
          place: data.place || '',
          site: data.site || ''
        });
      } catch (error) {
        console.error('Failed to fetch customer details', error);
      }
    }
  };

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
      if (!brand) {
        setProducts([]);
        return;
      }
      const { data } = await api.get(`/products/by-brand/${brand}`);
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const handleBrandChange = (e) => {
    const brand = e.target.value;
    setSelectedBrand(brand);
    setSelectedProduct('');
    fetchProductsByBrand(brand);
  };

  const addItem = () => {
    if (!selectedBrand || !selectedProduct || qty <= 0) return;
    
    const product = products.find(p => p.product_name === selectedProduct);
    if (!product) return;

    // Stock Guard: Check if we have enough stock
    const availableStock = product.closing_stock || 0;
    if (qty > availableStock) {
      alert(`Insufficient Stock! \n\nProduct: ${product.product_name} \nAvailable: ${availableStock} units \nRequested: ${qty} units \n\nPlease restock before selling.`);
      return;
    }

    const rate = billType === 'Retail' ? product.retail_rate : product.wholesale_rate;
    const amount = qty * rate;

    const newItem = {
      brand: selectedBrand,
      name: selectedProduct,
      qty: parseFloat(qty),
      rate: rate,
      amount: amount
    };

    if (isEditing && selectedIndex !== null) {
      const updatedItems = [...items];
      updatedItems[selectedIndex] = newItem;
      setItems(updatedItems);
      setIsEditing(false);
      setSelectedIndex(null);
    } else {
      setItems([...items, newItem]);
    }

    setQty(1);
    setSelectedProduct('');
  };

  const handleEditSelected = () => {
    if (selectedIndex === null) return alert('Please select an item to edit');
    const item = items[selectedIndex];
    
    setSelectedBrand(item.brand);
    fetchProductsByBrand(item.brand);
    setSelectedProduct(item.name);
    setQty(item.qty);
    setIsEditing(true);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
    if (selectedIndex === index) setSelectedIndex(null);
  };

  const [lastSavedBillId, setLastSavedBillId] = useState(null);

  const handleSaveBill = async () => {
    if (items.length === 0) return alert('Add at least one item');
    setLoading(true);
    try {
      const billData = {
        customer_name: customer.name,
        customer_phone: customer.phone,
        place: customer.place,
        site: customer.site,
        bill_type: billType,
        payment_type: paymentType,
        include_gst: includeGst,
        items: items,
        amount_paid: amountPaid
      };
      
      const { data } = await api.post('/bills/', billData);
      setLastSavedBillId(data._id);
      setSavedBillData(data);
      alert(`Bill ${data.bill_no} saved successfully! You can now print or share it.`);
      
      fetchNextBillNo();
      fetchCustomerNames();
    } catch (error) {
      console.error('Failed to save bill', error);
      alert('Error saving bill');
    } finally {
      setLoading(false);
    }
  };

  const handleNewBill = () => {
    setItems([]);
    setCustomer({ name: 'Cash Sale', phone: '', place: '', site: '' });
    setAmountPaid(0);
    setSelectedIndex(null);
    setIsEditing(false);
    setLastSavedBillId(null);
    setSavedBillData(null);
    fetchNextBillNo();
  };

  return (
    <div className="h-full flex flex-col space-y-4 bg-zinc-100 p-4 rounded-3xl overflow-y-auto">
      {/* Business Header */}
      <div className="bg-zinc-900 text-white p-8 rounded-2xl text-center shadow-lg border border-zinc-800 shrink-0 relative overflow-hidden">
        <div className="flex items-center justify-center space-x-4 mb-3">
          <div className="bg-white p-2 rounded-xl shadow-xl rotate-3">
            <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-[0.3em] uppercase">Rite <span className="text-zinc-500">Electricals</span></h1>
        </div>
        <p className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em] leading-relaxed">
          451A, Periyar Nagar, Opp Rajaji Statue, Thirumangalam-625 706<br/>
          Madurai Main Road, Tamil Nadu | Phone: 9342244061, 9842204841<br/>
          <span className="text-white mt-1 inline-block bg-zinc-800 px-4 py-1 rounded-full border border-zinc-700">GSTIN: 33BMGPM7077J1ZO</span>
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Customer Information */}
        <div className="col-span-8 bg-white border border-zinc-200 rounded-xl p-4 shadow-sm relative">
          <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer Information</span>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-center space-x-3">
              <label className="text-[11px] font-black text-zinc-600 uppercase w-32">Customer Name:</label>
              <input 
                type="text" 
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-900" 
                value={customer.name} 
                onChange={e => handleCustomerNameChange(e.target.value)} 
                list="customer-list"
              />
              <datalist id="customer-list">
                {customerNames.map(name => <option key={name} value={name} />)}
              </datalist>
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-[11px] font-black text-zinc-600 uppercase w-24 text-right">Phone No:</label>
              <input type="text" className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-900" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-[11px] font-black text-zinc-600 uppercase w-32">Place:</label>
              <input type="text" className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-900" value={customer.place} onChange={e => setCustomer({...customer, place: e.target.value})} />
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-[11px] font-black text-zinc-600 uppercase w-24 text-right">Site:</label>
              <input type="text" className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-900" value={customer.site} onChange={e => setCustomer({...customer, site: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Bill Information */}
        <div className="col-span-4 bg-white border border-zinc-200 rounded-xl p-4 shadow-sm relative">
          <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bill Information</span>
          <div className="space-y-4 mt-2">
            <div className="flex items-center space-x-3">
              <label className="text-[11px] font-black text-zinc-600 uppercase w-20">Bill No:</label>
              <input type="text" readOnly className="flex-1 bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-black text-zinc-900" value={billNo} />
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-[11px] font-black text-zinc-600 uppercase w-20">Date:</label>
              <span className="text-xs font-black text-zinc-900">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="col-span-12 bg-white border border-zinc-200 rounded-xl p-4 shadow-sm relative mt-2">
          <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Product Selection</span>
          <div className="flex items-center space-x-6 mt-2">
            <div className="flex items-center space-x-3 flex-1">
              <label className="text-[11px] font-black text-zinc-600 uppercase whitespace-nowrap">Select Brand:</label>
              <select className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none" value={selectedBrand} onChange={handleBrandChange}>
                <option value="">Choose Brand</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-3 flex-1">
              <label className="text-[11px] font-black text-zinc-600 uppercase whitespace-nowrap">Select Product:</label>
              <select className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} disabled={!selectedBrand}>
                <option value="">Choose Product</option>
                {products.map(p => <option key={p.product_name} value={p.product_name}>{p.product_name}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-3 w-32">
              <label className="text-[11px] font-black text-zinc-600 uppercase">Qty:</label>
              <input type="number" min="0.1" step="0.1" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-black text-center" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setBillType(billType === 'Retail' ? 'Wholesale' : 'Retail')}
                className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all border ${billType === 'Wholesale' ? 'bg-zinc-800 text-white border-zinc-800' : 'bg-white text-zinc-600 border-zinc-200'}`}
              >
                {billType === 'Wholesale' ? 'Wholesale Rate (W)' : 'Retail Rate (R)'}
              </button>
              <button onClick={addItem} className={`${isEditing ? 'bg-zinc-600 hover:bg-zinc-700' : 'bg-zinc-900 hover:bg-black'} text-white px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md transition-all`}>
                {isEditing ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>

        {/* Bill Items Grid */}
        <div className="col-span-12 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm relative mt-2 flex flex-col min-h-[300px]">
          <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest z-10">Bill Items</span>
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="min-w-full border-collapse">
              <thead className="bg-zinc-50 sticky top-0 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase border-r border-zinc-200 w-16 text-center">S.No</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase border-r border-zinc-200 text-left">Brand</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase border-r border-zinc-200 text-left">Product</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase border-r border-zinc-200 w-24 text-center">Qty</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase border-r border-zinc-200 w-32 text-right">Rate</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase w-40 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-20 text-zinc-300 font-black uppercase tracking-widest text-[10px]">No items listed in the current bill</td></tr>
                ) : (
                  items.map((item, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedIndex(idx)}
                      className={`hover:bg-zinc-50 transition-colors group cursor-pointer ${selectedIndex === idx ? 'bg-zinc-100 ring-1 ring-inset ring-zinc-900' : ''}`}
                    >
                      <td className="px-4 py-2.5 text-center text-xs font-bold text-zinc-400 border-r border-zinc-100">{idx + 1}</td>
                      <td className="px-4 py-2.5 text-xs font-black text-zinc-900 border-r border-zinc-100">{item.brand}</td>
                      <td className="px-4 py-2.5 text-xs font-black text-zinc-900 border-r border-zinc-100">{item.name}</td>
                      <td className="px-4 py-2.5 text-center text-xs font-black text-zinc-600 border-r border-zinc-100">{item.qty}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-black text-zinc-500 border-r border-zinc-100">Rs.{item.rate.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-black text-zinc-900 flex items-center justify-end group">
                        Rs.{item.amount.toLocaleString()}
                        <button onClick={(e) => { e.stopPropagation(); removeItem(idx); }} className="ml-4 opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-zinc-900 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="col-span-12 flex items-center justify-between bg-white border border-zinc-200 rounded-2xl p-6 mt-4 shadow-sm">
          <div className="flex items-center space-x-12">
            <div className="flex items-center space-x-4">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Payment Method</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="radio" checked={paymentType === 'Cash'} onChange={() => setPaymentType('Cash')} className="w-4 h-4 accent-black" />
                  <span className="text-xs font-bold text-zinc-800 group-hover:text-black transition-colors">Cash</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="radio" checked={paymentType === 'Credit'} onChange={() => setPaymentType('Credit')} className="w-4 h-4 accent-black" />
                  <span className="text-xs font-bold text-zinc-800 group-hover:text-black transition-colors">Credit</span>
                </label>
              </div>
            </div>
            
            <div className="h-8 w-px bg-zinc-100"></div>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <input type="checkbox" checked={includeGst} onChange={(e) => setIncludeGst(e.target.checked)} className="w-4 h-4 rounded accent-black" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-black transition-colors">Apply GST (18%)</span>
            </label>
          </div>

          <div className="flex items-center space-x-12">
            <div className="flex flex-col items-end">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Amount Paid</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">₹</span>
                <input 
                  type="number" 
                  className="w-36 bg-zinc-50 border border-zinc-200 rounded-xl pl-7 pr-4 py-2.5 text-sm font-black text-black focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                  value={amountPaid} 
                  onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            <div className="flex flex-col items-end">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Balance Due</label>
              <span className={`text-xl font-black ${(total - amountPaid) > 0 ? 'text-red-500' : 'text-black'}`}>
                ₹{(total - amountPaid).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Final Actions */}
        <div className="col-span-12 flex items-stretch space-x-4 mt-2 h-20">
          <div className="flex-[0.8] bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col items-center justify-center px-8 border-b-4 border-zinc-300">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">Grand Total</span>
            <span className="text-3xl font-black text-black tracking-tighter">₹{total.toLocaleString()}</span>
          </div>

          <div className="flex-[3] flex space-x-3">
            {!lastSavedBillId ? (
              <>
                <button 
                  onClick={handleEditSelected}
                  disabled={selectedIndex === null}
                  className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-zinc-200 font-black uppercase tracking-widest text-[10px] transition-all ${selectedIndex === null ? 'opacity-30' : 'bg-white hover:border-black hover:bg-zinc-50 active:scale-95'}`}
                >
                  <Edit3 className="w-5 h-5 mb-1" />
                  Edit Item
                </button>
                <button 
                  onClick={handleSaveBill} 
                  disabled={loading || items.length === 0} 
                  className="flex-[2] bg-black hover:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 flex items-center justify-center"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <Save className="w-5 h-5 mr-3" /> Save & Finalize Bill
                    </>
                  )}
                </button>
              </>
            ) : (
              <button 
                onClick={handleNewBill} 
                className="flex-[2] bg-black hover:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 flex items-center justify-center animate-in fade-in zoom-in duration-300"
              >
                <Plus className="w-5 h-5 mr-3" /> Create Another Bill
              </button>
            )}
            
            <button 
              disabled={items.length === 0} 
              onClick={async () => {
                if (!lastSavedBillId) {
                  alert("Please Save the Bill first to generate a receipt.");
                  return;
                }
                window.print();
              }}
              className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-zinc-200 font-black uppercase tracking-widest text-[10px] transition-all ${items.length === 0 ? 'opacity-30' : 'bg-white hover:border-black hover:bg-zinc-50 active:scale-95'}`}
            >
              <Printer className="w-5 h-5 mb-1" />
              Print
            </button>
            
            <button 
              disabled={items.length === 0} 
              onClick={async () => {
                if (!savedBillData) return alert('Please Save the Bill first.');
                try {
                  const element = document.getElementById('printable-receipt-content');
                  if (element) {
                    const canvas = await html2canvas(element, { scale: 3 });
                    const image = canvas.toDataURL("image/png", 1.0);
                    const link = document.createElement('a');
                    link.download = `Bill_${savedBillData.bill_no}.png`;
                    link.href = image;
                    link.click();
                  }
                } catch (error) {
                  alert('Error generating image');
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-zinc-200 font-black uppercase tracking-widest text-[10px] transition-all ${items.length === 0 ? 'opacity-30' : 'bg-white hover:border-black hover:bg-zinc-50 active:scale-95'}`}
            >
              <Image className="w-5 h-5 mb-1" />
              Image
            </button>
            
            <button 
              onClick={async () => {
                if (!customer.phone || customer.phone.length < 10) return alert('Enter a valid phone number');
                if (!savedBillData) return alert('Please Save the Bill first to share a receipt.');
                
                try {
                  const element = document.getElementById('printable-receipt-content');
                  if (element) {
                    const canvas = await html2canvas(element, { scale: 2 });
                    canvas.toBlob(async (blob) => {
                      const phone = customer.phone.startsWith('91') ? customer.phone : '91' + customer.phone.replace(/\D/g, '');
                      
                      try {
                        await navigator.clipboard.write([
                          new ClipboardItem({ [blob.type]: blob })
                        ]);
                        alert("Image copied! Opening chat... Just PASTE (Ctrl+V) to send the bill.");
                        window.open(`https://wa.me/${phone}`, '_blank');
                      } catch (err) {
                        console.error('Failed to copy to clipboard', err);
                        const image = canvas.toDataURL("image/png", 1.0);
                        const link = document.createElement('a');
                        link.download = `Receipt_${billNo}.png`;
                        link.href = image;
                        link.click();
                        alert("Image downloaded! Opening chat... Please attach the downloaded file.");
                        window.open(`https://wa.me/${phone}`, '_blank');
                      }
                    });
                  }
                } catch (error) {
                  console.error('Error generating receipt image', error);
                  alert('Could not generate receipt image.');
                }
              }}
              disabled={items.length === 0} 
              className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-zinc-200 font-black uppercase tracking-widest text-[10px] transition-all ${items.length === 0 ? 'opacity-30' : 'bg-white hover:border-black hover:bg-zinc-50 active:scale-95'}`}
            >
              <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              WhatsApp
            </button>
          </div>
        </div>
      </div>
      
      {/* Printable Receipt (Hidden on Screen) */}
      <div className="absolute -left-[9999px] top-0 print:left-0 print:relative">
        <div id="printable-receipt">
          <div id="printable-receipt-content" className="bg-white">
            <ThermalReceipt billData={savedBillData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
