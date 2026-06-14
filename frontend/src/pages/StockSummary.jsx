import React, { useState, useEffect } from 'react';
import API from '../utils/axiosConfig';
import { Search, ClipboardList, Filter, RefreshCw, AlertTriangle, FileSpreadsheet } from 'lucide-react';

const StockSummary = () => {
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [stockLevelFilter, setStockLevelFilter] = useState(''); // 'low', 'out', 'good'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, compRes] = await Promise.all([
        API.get('/items'),
        API.get('/companies'),
      ]);
      setItems(itemsRes.data);
      setCompanies(compRes.data);
    } catch (err) {
      setError('Failed to fetch stock summary data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  // Filter items logic in Frontend
  const filteredItems = items.filter((item) => {
    // Search filter
    const matchesSearch = item.itemName.toLowerCase().includes(search.toLowerCase());
    
    // Company filter
    const matchesCompany = companyFilter
      ? (item.companyId?._id || item.companyId) === companyFilter
      : true;

    // Stock level filter
    let matchesStock = true;
    if (stockLevelFilter === 'out') {
      matchesStock = item.quantity === 0;
    } else if (stockLevelFilter === 'low') {
      matchesStock = item.quantity > 0 && item.quantity <= 10;
    } else if (stockLevelFilter === 'good') {
      matchesStock = item.quantity > 10;
    }

    return matchesSearch && matchesCompany && matchesStock;
  });

  // Calculate totals
  const totalQuantity = filteredItems.reduce((acc, c) => acc + c.quantity, 0);
  const totalValue = filteredItems.reduce((acc, c) => acc + c.quantity * c.purchasePrice, 0);
  const outOfStockCount = filteredItems.filter((i) => i.quantity === 0).length;
  const lowStockCount = filteredItems.filter((i) => i.quantity > 0 && i.quantity <= 10).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-wide">Current Stock Summary</h2>
            <p className="text-sm text-slate-500">Live inventory valuation and item balances calculated dynamically.</p>
          </div>
          <button
            onClick={handleRefresh}
            className="btn-secondary py-2 px-3 flex items-center gap-1.5 hover:bg-slate-100"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stock Widgets Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel p-4 border border-slate-200/50 bg-white/70">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Total Inventory Units
          </span>
          <span className="text-lg font-bold text-slate-800 font-sans">{totalQuantity.toLocaleString()} Units</span>
        </div>

        <div className="glass-panel p-4 border border-slate-200/50 bg-white/70">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Net Valuation (Cost)
          </span>
          <span className="text-lg font-bold text-primary-800 font-sans">Rs. {totalValue.toLocaleString()}</span>
        </div>

        <div className="glass-panel p-4 border border-slate-200/50 bg-white/70 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Low Stock Alert
            </span>
            <span className="text-lg font-bold text-amber-600 font-sans">{lowStockCount} Items</span>
          </div>
          {lowStockCount > 0 && <AlertTriangle size={20} className="text-amber-500 animate-pulse" />}
        </div>

        <div className="glass-panel p-4 border border-slate-200/50 bg-white/70 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Out of Stock
            </span>
            <span className="text-lg font-bold text-red-600 font-sans">{outOfStockCount} Items</span>
          </div>
          {outOfStockCount > 0 && <AlertTriangle size={20} className="text-red-500 animate-pulse" />}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-4 border border-slate-200/50 flex flex-col md:flex-row gap-4 bg-white/70">
        <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            className="bg-transparent focus:outline-none w-full text-slate-700 placeholder-slate-400 text-sm"
            placeholder="Search current stock by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          <select
            className="glass-select py-1 px-3 text-xs w-40"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>{c.companyName}</option>
            ))}
          </select>

          <select
            className="glass-select py-1 px-3 text-xs w-40"
            value={stockLevelFilter}
            onChange={(e) => setStockLevelFilter(e.target.value)}
          >
            <option value="">All Stock Levels</option>
            <option value="good">Good Stock (&gt;10)</option>
            <option value="low">Low Stock (1-10)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Stock Table */}
      {loading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block glass-panel overflow-hidden border border-slate-200/60 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Supplier Company</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4 text-right">Unit cost (Rs.)</th>
                    <th className="px-6 py-4 text-right">Current Stock</th>
                    <th className="px-6 py-4 text-right">Stock Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const valuation = item.quantity * item.purchasePrice;
                      return (
                        <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-slate-800">{item.itemName}</td>
                          <td className="px-6 py-3.5 text-slate-500">
                            {item.companyId?.companyName || 'N/A'}
                          </td>
                          <td className="px-6 py-3.5 text-slate-400 capitalize">
                            {item.category || '—'}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              {item.unit}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right font-sans">
                            Rs. {item.purchasePrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span
                              className={`font-sans font-bold px-2.5 py-0.5 rounded-lg text-xs ${
                                item.quantity === 0
                                  ? 'text-red-700 bg-red-50 border border-red-100'
                                  : item.quantity <= 10
                                  ? 'text-amber-700 bg-amber-50 border border-amber-100'
                                  : 'text-emerald-800 bg-emerald-50 border border-emerald-100'
                              }`}
                            >
                              {item.quantity} {item.unit}s
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right font-sans font-bold text-slate-800">
                            Rs. {valuation.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No stock data matches filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="grid gap-4 md:hidden">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const valuation = item.quantity * item.purchasePrice;
                return (
                  <div
                    key={item._id}
                    className="glass-panel p-4 border border-slate-200/50 bg-white space-y-3 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-[15px]">{item.itemName}</h4>
                        <p className="text-xs text-slate-500 font-medium">{item.companyId?.companyName || 'N/A'}</p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {item.category && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600 capitalize">
                            {item.category}
                          </span>
                        )}
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-semibold text-primary-700">
                          {item.unit}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 text-slate-500">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Unit Cost</span>
                        <span className="font-sans text-slate-700 font-medium">Rs. {item.purchasePrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Valuation</span>
                        <span className="font-sans font-bold text-slate-800">Rs. {valuation.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-600">Current Stock:</span>
                      <span
                        className={`font-sans font-bold px-2.5 py-0.5 rounded-lg text-xs ${
                          item.quantity === 0
                            ? 'text-red-700 bg-red-50 border border-red-100'
                            : item.quantity <= 10
                            ? 'text-amber-700 bg-amber-50 border border-amber-100'
                            : 'text-emerald-800 bg-emerald-50 border border-emerald-100'
                        }`}
                      >
                        {item.quantity} {item.unit}s
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="glass-panel py-8 text-center text-slate-400 bg-white">
                No stock data matches filters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockSummary;
