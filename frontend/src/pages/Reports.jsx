import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileBarChart, Download, Search, Calendar as CalendarIcon } from 'lucide-react';
import api from '@/api/axios';

const Reports = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  
  const [reportType, setReportType] = useState(type || 'daily');
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Custom Date Range State
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Stats
  const [stats, setStats] = useState({ total: 0, cash: 0, credit: 0, count: 0 });

  useEffect(() => {
    if (type) {
      setReportType(type);
    }
  }, [type]);

  useEffect(() => {
    if (reportType !== 'custom') {
      fetchReportData();
    }
  }, [reportType]);

  const getDateRange = () => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (reportType === 'daily') {
      // Today
    } else if (reportType === 'fortnight') {
      start.setDate(today.getDate() - 14);
    } else if (reportType === 'monthly') {
      start.setDate(1); // 1st of current month
    } else if (reportType === 'custom') {
      return { from: fromDate, to: toDate };
    }

    const formatDate = (d) => {
      // Backend expects DD/MM/YYYY format based on how it's saved, or we can just fetch all and filter client side if date string format is complex.
      // Wait, backend saves date as "DD/MM/YYYY hh:mm A" string.
      // The API filters using $gte and $lte on the string. This might not work perfectly for DD/MM/YYYY string comparisons.
      // For now, we will fetch all and filter in JS for accuracy, since DD/MM/YYYY strings sort alphabetically wrong.
      return d;
    };
    return { start, end };
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bills');
      
      const { start, end } = getDateRange();
      
      let filtered = data;
      
      if (reportType !== 'all') {
        filtered = data.filter(bill => {
          // Parse DD/MM/YYYY hh:mm A
          const parts = bill.date.split(' ')[0].split('/');
          const billDate = new Date(parts[2], parts[1] - 1, parts[0]);
          
          if (reportType === 'custom') {
            if (!fromDate || !toDate) return true;
            const customStart = new Date(fromDate);
            const customEnd = new Date(toDate);
            customEnd.setHours(23, 59, 59);
            return billDate >= customStart && billDate <= customEnd;
          }
          
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return billDate >= start && billDate <= end;
        });
      }

      setBills(filtered);
      
      // Calculate Stats
      let total = 0;
      let cash = 0;
      let credit = 0;
      filtered.forEach(b => {
        total += b.total;
        if (b.payment_type === 'Cash') cash += b.total;
        if (b.payment_type === 'Credit') credit += b.total;
      });
      
      setStats({ total, cash, credit, count: filtered.length });
      
    } catch (error) {
      console.error('Failed to fetch report data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSearch = () => {
    if (!fromDate || !toDate) return alert('Select both dates');
    fetchReportData();
  };

  const downloadCSV = () => {
    if (bills.length === 0) return alert('No data to export');
    
    let csv = 'Date,Bill No,Customer,Phone,Payment Type,Total Amount\n';
    bills.forEach(b => {
      csv += `"${b.date}","${b.bill_no}","${b.customer_name}","${b.customer_phone}","${b.payment_type}","${b.total}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales_Report_${reportType}_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleTypeChange = (newType) => {
    setReportType(newType);
    navigate(`/reports/${newType}`, { replace: true });
  };

  const getTitle = () => {
    switch(reportType) {
      case 'daily': return 'Daily Sales Report';
      case 'fortnight': return 'Fortnightly Sales Report';
      case 'monthly': return 'Monthly Sales Report';
      case 'custom': return 'Custom Date Report';
      default: return 'Sales Report';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center tracking-tighter">
            <FileBarChart className="w-7 h-7 mr-3 text-zinc-400" />
            {getTitle()}
          </h1>
          <p className="text-zinc-400 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">Financial analytics and accounting export</p>
        </div>
        <div className="flex space-x-4">
          <select 
            value={reportType} 
            onChange={(e) => handleTypeChange(e.target.value)}
            className="input-field py-3 bg-white border-zinc-200 text-zinc-600 font-black uppercase tracking-widest text-[10px] w-48"
          >
            <option value="daily">Daily Cycle</option>
            <option value="fortnight">Fortnight Cycle</option>
            <option value="monthly">Monthly Cycle</option>
            <option value="custom">Custom Range</option>
          </select>
          <button onClick={downloadCSV} className="bg-black hover:bg-zinc-800 text-white px-6 py-3 rounded-xl flex items-center text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">
            <Download className="w-4 h-4 mr-2" /> Export Dataset
          </button>
        </div>
      </div>

      {reportType === 'custom' && (
        <div className="card p-4 bg-white flex items-end gap-4">
          <div>
            <label className="label-text">From Date</label>
            <input type="date" className="input-field" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="label-text">To Date</label>
            <input type="date" className="input-field" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <button onClick={handleCustomSearch} className="btn-primary bg-zinc-800 hover:bg-zinc-700 text-white flex items-center h-10 px-6 rounded-lg">
            <Search className="w-4 h-4 mr-2" /> Generate Report
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="card p-8 border-none bg-white shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Gross Revenue</p>
          <p className="text-3xl font-black text-zinc-900 tracking-tighter">₹{stats.total.toLocaleString()}</p>
        </div>
        <div className="card p-8 border-none bg-white shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Cash Settlement</p>
          <p className="text-3xl font-black text-zinc-900 tracking-tighter">₹{stats.cash.toLocaleString()}</p>
        </div>
        <div className="card p-8 border-none bg-white shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Credit Exposure</p>
          <p className="text-3xl font-black text-zinc-900 tracking-tighter">₹{stats.credit.toLocaleString()}</p>
        </div>
        <div className="card p-8 border-none bg-white shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Transaction Count</p>
          <p className="text-3xl font-black text-zinc-900 tracking-tighter">{stats.count}</p>
        </div>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50 sticky top-0">
              <tr>
                <th className="table-header w-48">Date & Time</th>
                <th className="table-header w-24">Bill No</th>
                <th className="table-header">Customer Name</th>
                <th className="table-header text-center w-32">Type</th>
                <th className="table-header text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 bg-transparent">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-20 text-zinc-400 font-black uppercase tracking-widest text-xs animate-pulse">Aggregating records...</td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-20 text-zinc-400 font-bold italic text-xs">No records found for the selected period</td></tr>
              ) : (
                bills.map(b => (
                  <tr key={b._id} className="hover:bg-zinc-50 transition-all group">
                    <td className="table-cell whitespace-nowrap text-zinc-400 text-[10px] font-black uppercase">
                      <div className="flex items-center">
                        <CalendarIcon className="w-3.5 h-3.5 mr-2 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                        {b.date}
                      </div>
                    </td>
                    <td className="table-cell font-black text-zinc-400 group-hover:text-zinc-900 uppercase tracking-tighter text-xs">#{b.bill_no}</td>
                    <td className="table-cell">
                      <p className="font-black text-zinc-900 uppercase tracking-tight text-xs">{b.customer_name}</p>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{b.customer_phone}</p>
                    </td>
                    <td className="table-cell text-center">
                      <span className={`px-3 py-1 inline-flex text-[9px] font-black rounded-lg uppercase tracking-widest border ${
                        b.payment_type === 'Cash' 
                          ? 'bg-zinc-100 text-zinc-600 border-zinc-200' 
                          : 'bg-black text-white border-black'
                      }`}>
                        {b.payment_type}
                      </span>
                    </td>
                    <td className="table-cell text-right font-black text-zinc-900 text-sm">
                      ₹{b.total.toLocaleString()}
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

export default Reports;
