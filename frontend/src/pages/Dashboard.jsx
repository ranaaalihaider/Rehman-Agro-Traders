import React, { useState, useEffect } from 'react';
import API from '../utils/axiosConfig';
import {
  Building2,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  History,
  Activity,
  Boxes,
  DollarSign
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await API.get('/reports/dashboard');
        setStats(data);

        // Fetch transactions to generate a chart of last 7 days activity
        const txRes = await API.get('/transactions');
        const last7Days = [];
        
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          last7Days.push({
            date: dateStr,
            displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            'Stock In': 0,
            'Stock Out': 0,
          });
        }

        txRes.data.forEach((tx) => {
          const txDateStr = new Date(tx.date).toISOString().split('T')[0];
          const day = last7Days.find((d) => d.date === txDateStr);
          if (day) {
            tx.items.forEach((item) => {
              if (tx.type === 'STOCK_IN') {
                day['Stock In'] += item.quantity;
              } else {
                day['Stock Out'] += item.quantity;
              }
            });
          }
        });

        setChartData(last7Days);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600"></div>
      </div>
    );
  }

  const cardItems = [
    {
      title: 'Registered Companies',
      value: stats?.totalCompanies || 0,
      icon: Building2,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Total Items Registered',
      value: stats?.totalItems || 0,
      icon: Layers,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
    {
      title: 'Current Total Stock',
      value: `${stats?.currentTotalStock || 0} Units`,
      icon: Boxes,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Total Stock Value',
      value: `Rs. ${(stats?.totalStockValue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-wide">Business Overview Dashboard</h2>
        <p className="text-sm text-slate-500">Real-time summaries and insights for Rehman Agro Traders.</p>
      </div>

      {/* Stats Cards Deck */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cardItems.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="glass-panel p-5 border border-slate-200/60 hover:shadow-md transition-all duration-200 flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <p className="text-xl font-bold text-slate-800 font-sans leading-none">{card.value}</p>
              </div>
              <div className={`rounded-xl border p-3 ${card.color}`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Quick-Stats (Today's Transactions) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-panel p-4 border border-slate-200/50 flex items-center gap-4 bg-white/70">
          <div className="rounded-xl bg-primary-100 p-3 text-primary-700">
            <ArrowDownLeft size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Today's Stock In
            </span>
            <p className="text-lg font-bold text-slate-800">
              {stats?.todayStockInQty || 0} Bags/Units
            </p>
            <span className="text-xs text-primary-600 font-semibold">
              Valued at Rs. {(stats?.todayStockInValue || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 border border-slate-200/50 flex items-center gap-4 bg-white/70">
          <div className="rounded-xl bg-orange-100 p-3 text-orange-700">
            <ArrowUpRight size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Today's Stock Out
            </span>
            <p className="text-lg font-bold text-slate-800">
              {stats?.todayStockOutQty || 0} Bags/Units
            </p>
            <span className="text-xs text-orange-600 font-semibold">
              Valued at Rs. {(stats?.todayStockOutValue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Chart and Activity Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Stock Movements Chart */}
        <div className="glass-panel p-5 border border-slate-200/60 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-700" />
              <h3 className="text-[15px] font-bold text-slate-800">Weekly Stock Movements</h3>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Past 7 Days</span>
          </div>
          <div className="h-64 w-full text-[12px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Stock In"
                  stroke="#15803d"
                  fillOpacity={1}
                  fill="url(#colorIn)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Stock Out"
                  stroke="#ea580c"
                  fillOpacity={1}
                  fill="url(#colorOut)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="glass-panel p-5 border border-slate-200/60 flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <History size={18} className="text-primary-700" />
            <h3 className="text-[15px] font-bold text-slate-800">Recent Activity Logs</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-64">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => (
                <div key={act._id} className="flex gap-3 text-xs leading-normal">
                  <div className="mt-0.5 rounded-full bg-slate-100 p-1.5 text-slate-600 self-start">
                    <Activity size={12} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-700">{act.action}</p>
                    <p className="text-slate-500 text-[11px]">{act.description}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      •{' '}
                      {new Date(act.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <span>No activities recorded yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
