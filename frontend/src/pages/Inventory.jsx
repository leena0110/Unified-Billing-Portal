import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Filter, Edit, Trash2 } from 'lucide-react';
import api from '@/api/axios';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedBrand) params.brand = selectedBrand;
      
      const { data } = await api.get('/products/', { params });
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data } = await api.get('/products/brands/');
      setBrands(data);
    } catch (error) {
      console.error("Failed to fetch brands", error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedBrand]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}/`);
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product", error);
      }
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    brand: '',
    product_name: '',
    purchase_rate: 0,
    margin1: 0,
    wholesale_rate: 0,
    margin2: 0,
    retail_rate: 0,
    opening_stock: 0,
    purchase_date: new Date().toISOString().split('T')[0]
  });

  const handleRateChange = (field, value) => {
    const val = parseFloat(value) || 0;
    setNewProduct(prev => {
      const updates = { ...prev, [field]: val };
      if (field === 'purchase_rate') {
        updates.wholesale_rate = val;
        updates.retail_rate = Math.round(val * 1.1);
      } else if (field === 'wholesale_rate') {
        updates.retail_rate = Math.round(val * 1.1);
      }
      return updates;
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products/', newProduct);
      setIsModalOpen(false);
      fetchProducts();
      fetchBrands();
      setNewProduct({
        brand: '',
        product_name: '',
        purchase_rate: 0,
        margin1: 0,
        wholesale_rate: 0,
        margin2: 0,
        retail_rate: 0,
        opening_stock: 0,
        purchase_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Failed to add product", error);
      const errorMsg = error.response?.data?.detail || error.message || "Unknown error";
      alert(`System Error: ${errorMsg}`);
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleEditClick = (product) => {
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      // Remove internal MongoDB fields before sending update
      const { _id, ...updateData } = editingProduct;
      await api.put(`/products/${_id}/`, updateData);
      setIsEditModalOpen(false);
      fetchProducts();
      alert("Product updated successfully");
    } catch (error) {
      console.error("Failed to update product", error);
      const errorMsg = error.response?.data?.detail || error.message || "Unknown error";
      alert(`Update Failed: ${errorMsg}`);
    }
  };

  const handleEditRateChange = (field, value) => {
    const val = parseFloat(value) || 0;
    setEditingProduct(prev => {
      const updates = { ...prev, [field]: val };
      if (field === 'purchase_rate') {
        updates.wholesale_rate = val;
        updates.retail_rate = Math.round(val * 1.1);
      } else if (field === 'wholesale_rate') {
        updates.retail_rate = Math.round(val * 1.1);
      }
      return updates;
    });
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center tracking-tighter">
            <Package className="w-7 h-7 mr-3 text-zinc-400" />
            Stock Directory
          </h1>
          <p className="text-zinc-400 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">Product catalog and inventory management</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setIsModalOpen(true)} className="bg-black hover:bg-zinc-800 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      <div className="card flex-1 flex flex-col min-h-0 relative">
        <div className="p-8 border-b border-zinc-100 flex flex-wrap gap-8 items-center justify-between bg-white rounded-t-2xl">
          <div className="flex-1 min-w-[350px] flex items-center bg-zinc-50 px-5 py-3.5 rounded-2xl border border-zinc-100 focus-within:border-zinc-900 transition-all shadow-inner">
            <Search className="w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Query product registry..." 
              className="bg-transparent border-none outline-none ml-4 w-full text-sm text-zinc-900 placeholder-zinc-400 font-bold tracking-widest text-[10px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Filter Registry</span>
            <select 
              className="bg-zinc-50 border-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Brand</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Wholesale (₹)</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Retail (₹)</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-20 text-zinc-300 font-black uppercase tracking-widest text-[10px]">Loading Inventory...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-20 text-zinc-300 font-black uppercase tracking-widest text-[10px]">No products found in registry</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-zinc-50 transition-all group">
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-3 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200">
                        {product.brand}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-zinc-900 uppercase tracking-tight text-xs">{product.product_name}</td>
                    <td className="px-6 py-4 text-right font-black text-zinc-400 text-[10px]">₹{product.wholesale_rate?.toLocaleString() || '0.00'}</td>
                    <td className="px-6 py-4 text-right font-black text-zinc-900 text-xs">₹{product.retail_rate?.toLocaleString() || '0.00'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        product.closing_stock <= 5 ? 'bg-red-50 text-red-500 border-red-100' : 
                        product.closing_stock <= 20 ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                      }`}>
                        {product.closing_stock || 0} Units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => handleEditClick(product)}
                          className="p-2 text-zinc-300 hover:text-zinc-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-zinc-200">
            <div className="bg-zinc-900 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-widest">Add New Product</h2>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">Register new SKU to the directory</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <Trash2 className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-8 space-y-6 bg-zinc-50">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Brand Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                    value={newProduct.brand} 
                    onChange={e => setNewProduct({...newProduct, brand: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Product Description</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                    value={newProduct.product_name} 
                    onChange={e => setNewProduct({...newProduct, product_name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Purchase Rate (₹)</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={newProduct.purchase_rate || ''} 
                    onChange={e => handleRateChange('purchase_rate', e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Initial Opening Stock</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={newProduct.opening_stock || ''} 
                    onChange={e => setNewProduct({...newProduct, opening_stock: parseFloat(e.target.value) || 0})} 
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Wholesale Rate (₹)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={newProduct.wholesale_rate || ''} 
                    onChange={e => handleRateChange('wholesale_rate', e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Retail Rate (₹)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-zinc-900 rounded-xl px-4 py-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={newProduct.retail_rate || ''} 
                    onChange={e => setNewProduct({...newProduct, retail_rate: parseFloat(e.target.value) || 0})} 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-black text-white hover:bg-zinc-800 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all"
                >
                  Confirm Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-zinc-200">
            <div className="bg-zinc-900 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-widest">Edit Product</h2>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">Modify existing product details</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <Trash2 className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="p-8 space-y-6 bg-zinc-50">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Brand Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                    value={editingProduct.brand} 
                    onChange={e => setEditingProduct({...editingProduct, brand: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Product Description</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all" 
                    value={editingProduct.product_name} 
                    onChange={e => setEditingProduct({...editingProduct, product_name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Purchase Rate (₹)</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={editingProduct.purchase_rate || ''} 
                    onChange={e => handleEditRateChange('purchase_rate', e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Opening Stock</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={editingProduct.opening_stock || ''} 
                    onChange={e => setEditingProduct({...editingProduct, opening_stock: parseFloat(e.target.value) || 0})} 
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Wholesale Rate (₹)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={editingProduct.wholesale_rate || ''} 
                    onChange={e => handleEditRateChange('wholesale_rate', e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Retail Rate (₹)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-zinc-900 rounded-xl px-4 py-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={editingProduct.retail_rate || ''} 
                    onChange={e => setEditingProduct({...editingProduct, retail_rate: parseFloat(e.target.value) || 0})} 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-black text-white hover:bg-zinc-800 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
