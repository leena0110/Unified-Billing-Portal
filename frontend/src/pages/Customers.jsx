import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Edit2, Save, X, Trash2 } from 'lucide-react';
import api from '@/api/axios';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', phone: '', place: '', site: '' });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers/');
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      (c.place && c.place.toLowerCase().includes(search.toLowerCase())) ||
      (c.site && c.site.toLowerCase().includes(search.toLowerCase()))
    );
    setFilteredCustomers(filtered);
  }, [search, customers]);

  const handleStartEdit = (customer) => {
    setEditingId(customer._id);
    setEditData({
      name: customer.name,
      phone: customer.phone,
      place: customer.place || '',
      site: customer.site || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    try {
      await api.put(`/customers/${id}`, editData);
      setEditingId(null);
      fetchCustomers();
      alert('Customer updated successfully!');
    } catch (error) {
      console.error("Failed to update customer", error);
      alert('Error updating customer');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (error) {
      alert('Error deleting customer');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center tracking-tighter">
            <Users className="w-7 h-7 mr-3 text-zinc-400" />
            Customer List
          </h1>
          <p className="text-zinc-400 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">View and edit your customers</p>
        </div>
        <button 
          onClick={fetchCustomers}
          className="bg-white hover:bg-zinc-50 text-zinc-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center shadow-sm border border-zinc-100 transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 mr-3 ${loading ? 'animate-spin' : ''}`} /> Refresh Registry
        </button>
      </div>
      
      <div className="card flex-1 flex flex-col min-h-0">
        <div className="p-8 border-b border-zinc-100 bg-white">
          <div className="max-w-md flex items-center bg-zinc-50 px-5 py-3.5 rounded-2xl border border-zinc-100 focus-within:border-zinc-900 transition-all shadow-inner">
            <Search className="w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by name, phone, or place..." 
              className="bg-transparent border-none outline-none ml-4 w-full text-xs text-zinc-900 placeholder-zinc-400 font-bold tracking-widest uppercase"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Place</th>
                <th className="table-header">Site</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-zinc-50">
              {loading && customers.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-24 text-zinc-400 font-black uppercase tracking-widest text-xs animate-pulse">Accessing directory...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-24 text-zinc-400 font-bold uppercase tracking-widest text-xs">No entries found</td></tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c._id} className={`hover:bg-zinc-50 transition-all group ${editingId === c._id ? 'bg-zinc-50 shadow-inner' : ''}`}>
                    <td className="table-cell">
                      {editingId === c._id ? (
                        <input 
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-black uppercase"
                          value={editData.name}
                          onChange={e => setEditData({...editData, name: e.target.value})}
                        />
                      ) : (
                        <div className="flex items-center space-x-4">
                          <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] font-black text-white shadow-lg uppercase">
                            {c.name.charAt(0)}
                          </div>
                          <span className="font-black text-zinc-900 uppercase tracking-tight text-xs">{c.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      {editingId === c._id ? (
                        <input 
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-black uppercase"
                          value={editData.phone}
                          onChange={e => setEditData({...editData, phone: e.target.value})}
                        />
                      ) : (
                        <span className="font-black text-zinc-400 tracking-[0.2em] text-[10px] uppercase group-hover:text-zinc-900 transition-colors">{c.phone}</span>
                      )}
                    </td>
                    <td className="table-cell">
                      {editingId === c._id ? (
                        <input 
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-black uppercase"
                          value={editData.place}
                          onChange={e => setEditData({...editData, place: e.target.value})}
                        />
                      ) : (
                        <span className="text-zinc-400 font-black uppercase text-[10px] tracking-widest">{c.place || '-'}</span>
                      )}
                    </td>
                    <td className="table-cell">
                      {editingId === c._id ? (
                        <input 
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-black uppercase"
                          value={editData.site}
                          onChange={e => setEditData({...editData, site: e.target.value})}
                        />
                      ) : (
                        <span className="text-zinc-400 font-black uppercase text-[10px] tracking-widest">{c.site || '-'}</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      {editingId === c._id ? (
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleSaveEdit(c._id)} className="p-2 bg-black text-white rounded-lg hover:bg-zinc-800 transition-all shadow-md">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancelEdit} className="p-2 bg-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-300 transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleStartEdit(c)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all" title="Edit Customer">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(c._id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete Customer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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

export default Customers;
