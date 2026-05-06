import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Package, FileText, 
  AlertTriangle, ArrowRight, DollarSign, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import api from '@/api/axios';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/reports/dashboard');
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (!stats) return <div className="p-8 text-red-500">Failed to load dashboard data</div>;

  const chartData = stats.weekly_sales || [];

  const StatCard = ({ title, value, icon: Icon, trend }) => (
    <div className="card p-8 border-none bg-white shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">{title}</p>
          <h3 className="text-3xl font-black text-zinc-900 tracking-tighter">{value}</h3>
          {trend && (
            <p className="text-xs font-bold mt-4 flex items-center text-zinc-500 uppercase tracking-widest">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 opacity-50" />
              {trend}
            </p>
          )}
        </div>
        <div className="p-4 rounded-2xl bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-900 transition-all duration-300">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Shop Overview</h1>
          <p className="text-zinc-400 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">Daily Sales & Stock Summary</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Daily Sales" 
          value={`₹${stats.today_sales.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+12% daily" 
        />
        <StatCard 
          title="Monthly Volume" 
          value={`₹${stats.month_sales.toLocaleString()}`} 
          icon={Activity} 
        />
        <StatCard 
          title="Active Inventory" 
          value={stats.total_products} 
          icon={Package} 
        />
        <StatCard 
          title="Customer Base" 
          value={stats.total_customers} 
          icon={Users} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 p-10 bg-white">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em]">Revenue Stream Analytics</h2>
            <select className="bg-zinc-50 border-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl focus:outline-none transition-all">
              <option>Last 7 Days</option>
              <option>Last Month</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} 
                  itemStyle={{color: '#0f172a', fontWeight: 900, fontSize: 12}}
                  labelStyle={{color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px'}}
                />
                <Bar dataKey="sales" fill="#18181b" radius={[8, 8, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 h-[calc(50%-12px)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-zinc-800 flex items-center">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                Low Stock Alerts
              </h2>
            </div>
            {stats.low_stock_products.length > 0 ? (
              <div className="space-y-3 overflow-y-auto h-32 pr-2">
                {stats.low_stock_products.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 hover:bg-zinc-50 transition-all rounded-xl border border-zinc-100">
                    <div>
                      <p className="text-sm font-black text-zinc-800 tracking-tight">{item.product_name}</p>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{item.brand}</p>
                    </div>
                    <span className="px-3 py-1 bg-zinc-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">
                      {item.closing_stock} Units
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-zinc-500 py-4">No low stock items</div>
            )}
          </div>

          <div className="card p-6 h-[calc(50%-12px)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-zinc-800 flex items-center">
                <FileText className="w-5 h-5 text-primary-500 mr-2" />
                Recent Bills
              </h2>
            </div>
            {stats.recent_bills.length > 0 ? (
              <div className="space-y-3 overflow-y-auto h-32 pr-2">
                {stats.recent_bills.map((bill, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 hover:bg-zinc-50 transition-all rounded-xl border border-zinc-100 cursor-pointer group">
                    <div>
                      <p className="text-sm font-black text-zinc-800 group-hover:text-zinc-600 transition-colors tracking-tight">{bill.customer_name}</p>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">INV #{bill.bill_no}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-zinc-900">₹{bill.total.toLocaleString()}</p>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{bill.date.split(' ')[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-zinc-500 py-4">No recent bills</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
