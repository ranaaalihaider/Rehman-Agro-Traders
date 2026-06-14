import React, { useState, useEffect } from 'react';
import API from '../utils/axiosConfig';
import { Calendar, Search, Filter, ArrowRight, BarChart3, TrendingUp, RefreshCw, FileDown, Printer, Sprout } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Helper: get current Pakistan date as YYYY-MM-DD string (module level, always safe)
const getPakistanDateString = (date = new Date()) => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch (e) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  }
};

const Reports = () => {
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState('');

  // Business Profile for printing
  const [profile, setProfile] = useState({
    name: 'Rehman Agro Traders',
    contact: '0312-7788945',
    address: 'Chichawatni, Punjab, Pakistan',
  });

  // Date range, Company & Item filters (Default to current date of Pakistan)
  const [startDate, setStartDate] = useState(() => getPakistanDateString());
  const [endDate, setEndDate] = useState(() => getPakistanDateString());
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');

  useEffect(() => {
    const fetchFiltersAndProfile = async () => {
      try {
        setLoadingFilters(true);
        const [itemsRes, companiesRes, profileRes] = await Promise.all([
          API.get('/items'),
          API.get('/companies'),
          API.get('/settings/profile'),
        ]);
        setItems(itemsRes.data);
        setCompanies(companiesRes.data);
        if (profileRes.data) setProfile(profileRes.data);
      } catch (err) {
        console.error('Failed to load filters or profile', err);
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFiltersAndProfile();
  }, []);

  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Please select both Start Date and End Date.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.get(
        `/reports/date-wise?startDate=${startDate}&endDate=${endDate}&itemId=${selectedItemId}&companyId=${selectedCompanyId}`
      );
      setReportData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate stock report');
    } finally {
      setLoading(false);
    }
  };

  // Generate initial report or on filter change
  useEffect(() => {
    handleGenerateReport();
  }, [selectedItemId, selectedCompanyId]);

  const handleCompanyChange = (companyId) => {
    setSelectedCompanyId(companyId);
    setSelectedItemId(''); // Reset item selection when company changes
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter products dropdown based on selected company
  const filteredProducts = selectedCompanyId
    ? items.filter((item) => (item.companyId?._id || item.companyId) === selectedCompanyId)
    : items;

  // Get aggregated daily totals across all items in report for the Recharts trend line
  const getDailyAggregate = () => {
    const dailyMap = {};
    if (!Array.isArray(reportData)) return [];
    
    reportData.forEach((company) => {
      if (company && Array.isArray(company.items)) {
        company.items.forEach((item) => {
          if (item && Array.isArray(item.history)) {
            item.history.forEach((day) => {
              if (!dailyMap[day.date]) {
                dailyMap[day.date] = {
                  date: day.date,
                  openingStock: 0,
                  stockIn: 0,
                  stockOut: 0,
                  closingStock: 0,
                };
              }
              dailyMap[day.date].openingStock += day.openingStock || 0;
              dailyMap[day.date].stockIn += day.stockIn || 0;
              dailyMap[day.date].stockOut += day.stockOut || 0;
              dailyMap[day.date].closingStock += day.closingStock || 0;
            });
          }
        });
      }
    });
    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Get aggregated metrics across all items in report
  const totalSummary = Array.isArray(reportData)
    ? reportData.reduce(
        (totals, company) => {
          if (company && Array.isArray(company.items)) {
            company.items.forEach((item) => {
              totals.openingStock += item.openingStock || 0;
              totals.stockIn += item.totalStockIn || 0;
              totals.stockOut += item.totalStockOut || 0;
              totals.closingStock += item.closingStock || 0;
            });
          }
          return totals;
        },
        { openingStock: 0, stockIn: 0, stockOut: 0, closingStock: 0 }
      )
    : { openingStock: 0, stockIn: 0, stockOut: 0, closingStock: 0 };

  return (
    <>
      {/* Screen View (Hidden during print) */}
      <div className="space-y-6 print-hide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-wide">Historical Stock Reports</h2>
            <p className="text-sm text-slate-500">Track date-wise inventory balances, opening/closing stock, and daily activity volume.</p>
          </div>
          {Array.isArray(reportData) && reportData.length > 0 && (
            <button
              onClick={handlePrint}
              className="btn-secondary py-2 px-4 flex items-center gap-1.5 hover:bg-slate-100 self-start sm:self-auto"
            >
              <Printer size={15} />
              Print Ledger
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filter Options Form */}
        <form onSubmit={handleGenerateReport} className="glass-panel p-5 border border-slate-200/50 bg-white/70 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Calendar size={15} />
                </div>
                <input
                  type="date"
                  required
                  className="glass-input-icon w-full py-1.5 text-xs"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                End Date
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Calendar size={15} />
                </div>
                <input
                  type="date"
                  required
                  className="glass-input-icon w-full py-1.5 text-xs"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Filter by Company
              </label>
              <select
                className="glass-select w-full py-1.5 text-xs"
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                disabled={loadingFilters}
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Filter by Product
              </label>
              <select
                className="glass-select w-full py-1.5 text-xs"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                disabled={loadingFilters}
              >
                <option value="">All Products combined</option>
                {filteredProducts.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.itemName} ({item.unit})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2 text-xs font-semibold"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </form>

        {/* Visual Chart Section */}
        {Array.isArray(reportData) && reportData.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="glass-panel p-5 border border-slate-200/60 md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary-700" />
                <h3 className="text-[14px] font-bold text-slate-800">Visual Stock Balance Trend</h3>
              </div>
              <div className="h-60 w-full text-[11px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDailyAggregate()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      tickFormatter={(val) => {
                        const parts = val.split('-');
                        return `${parts[1]}-${parts[2]}`; // Short Month-Day format
                      }}
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="openingStock" name="Opening Stock" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stockIn" name="Stock In (+)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stockOut" name="Stock Out (-)" fill="#ea580c" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="closingStock" name="Closing Stock" fill="#15803d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="glass-panel p-5 border border-slate-200/60 flex flex-col justify-center space-y-4 bg-slate-50/20">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Report Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Start Balance:</span>
                  <span className="font-bold text-slate-700">
                    {totalSummary.openingStock.toLocaleString()} Units
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Total Purchased (In):</span>
                  <span className="font-bold text-emerald-600">
                    +{totalSummary.stockIn.toLocaleString()} Units
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Total Sold (Out):</span>
                  <span className="font-bold text-orange-600">
                    -{totalSummary.stockOut.toLocaleString()} Units
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-3 text-sm font-semibold">
                  <span className="text-slate-800">Ending Balance:</span>
                  <span className="font-extrabold text-primary-800">
                    {totalSummary.closingStock.toLocaleString()} Units
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Grid Table */}
        {loading ? (
          <div className="flex h-[20vh] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block space-y-6">
              {Array.isArray(reportData) && reportData.length > 0 ? (
                reportData.map((company) => (
                  <div key={company.companyName} className="glass-panel border border-slate-200/60 bg-white p-5 space-y-6">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                      <span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Company</span>
                      {company.companyName}
                    </h3>
                    
                    {Array.isArray(company.items) && company.items.map((item) => (
                      <div key={item.itemId} className="space-y-3 pl-4 border-l-2 border-primary-500/25">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-semibold text-slate-600 bg-slate-50/50 p-2 rounded-lg gap-2">
                          <span className="font-bold text-primary-900">Product: {item.itemName} ({item.unit})</span>
                          <div className="flex gap-4 text-[11px]">
                            <span>Opening: <strong className="font-sans font-bold text-slate-700">{item.openingStock.toLocaleString()}</strong></span>
                            <span className="text-emerald-700">Stock In: <strong className="font-sans font-bold">+{item.totalStockIn.toLocaleString()}</strong></span>
                            <span className="text-orange-700">Stock Out: <strong className="font-sans font-bold">-{item.totalStockOut.toLocaleString()}</strong></span>
                            <span className="text-primary-800">Closing: <strong className="font-sans font-bold">{item.closingStock.toLocaleString()}</strong></span>
                          </div>
                        </div>
                        
                        <div className="overflow-x-auto border border-slate-100 rounded-lg">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/30 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2 text-right">Opening Stock</th>
                                <th className="px-4 py-2 text-right text-emerald-600">Stock In (+)</th>
                                <th className="px-4 py-2 text-right text-orange-600">Stock Out (-)</th>
                                <th className="px-4 py-2 text-right font-bold text-primary-800">Closing Stock</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[12px] text-slate-700">
                              {Array.isArray(item.history) && item.history.map((row) => (
                                <tr key={row.date} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="px-4 py-2 font-semibold">
                                    {new Date(row.date).toLocaleDateString([], {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </td>
                                  <td className="px-4 py-2 text-right font-sans text-slate-500">
                                    {row.openingStock.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-right font-sans text-emerald-600 font-medium">
                                    +{row.stockIn.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-right font-sans text-orange-600 font-medium">
                                    -{row.stockOut.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-right font-sans font-bold text-primary-900 bg-primary-50/5">
                                    {row.closingStock.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="glass-panel py-8 text-center text-slate-400 bg-white">
                  No stock transactions recorded in selected range.
                </div>
              )}
            </div>

            {/* Mobile Cards View */}
            <div className="grid gap-6 md:hidden">
              {Array.isArray(reportData) && reportData.length > 0 ? (
                reportData.map((company) => (
                  <div key={company.companyName} className="glass-panel border border-slate-200/60 bg-white p-4 space-y-4">
                    <h3 className="text-[13px] font-bold text-slate-800 border-b border-slate-100 pb-2">
                      {company.companyName}
                    </h3>
                    
                    {Array.isArray(company.items) && company.items.map((item) => (
                      <div key={item.itemId} className="space-y-3 pl-3 border-l-2 border-primary-500/25">
                        <div className="bg-slate-50/70 p-2.5 rounded-lg text-xs space-y-1.5">
                          <div className="font-bold text-primary-900">{item.itemName} ({item.unit})</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-500">
                            <div>Opening: <span className="font-bold text-slate-700">{item.openingStock.toLocaleString()}</span></div>
                            <div className="text-emerald-700">Purchases: <span className="font-bold">+{item.totalStockIn.toLocaleString()}</span></div>
                            <div className="text-orange-700">Sales: <span className="font-bold">-{item.totalStockOut.toLocaleString()}</span></div>
                            <div className="text-primary-800">Closing: <span className="font-bold">{item.closingStock.toLocaleString()}</span></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {Array.isArray(item.history) && item.history.map((row) => (
                            <div key={row.date} className="bg-slate-50/30 p-2 rounded-lg border border-slate-100 text-[11px] space-y-1">
                              <div className="flex justify-between font-bold text-slate-600">
                                <span>
                                  {new Date(row.date).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-primary-900 font-extrabold">Bal: {row.closingStock.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Open: {row.openingStock.toLocaleString()}</span>
                                <span className="text-emerald-600">In: +{row.stockIn.toLocaleString()}</span>
                                <span className="text-orange-600">Out: -{row.stockOut.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="glass-panel py-8 text-center text-slate-400 bg-white">
                  No stock transactions recorded in selected range.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Printable Report Section (Visible only during print) */}
      {Array.isArray(reportData) && reportData.length > 0 && (
        <div className="hidden print:block print-area w-full bg-white text-slate-800 font-sans p-2">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-primary-800 pb-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-800 text-white">
                <Sprout size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wide text-primary-900">{profile.name}</h1>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                  Authorized Fertilizer & Seed Dealer
                </p>
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[14px] font-bold text-slate-800">Inventory Ledger Report</p>
              <p className="text-xs text-slate-500">Contact: {profile.contact}</p>
              <p className="text-[11px] text-slate-400 max-w-xs leading-snug">{profile.address}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-6 my-6 border-b border-slate-100 pb-5 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Report Filters</span>
              <p className="font-semibold text-slate-800">
                Company: {selectedCompanyId ? companies.find(c => c._id === selectedCompanyId)?.companyName : 'All Companies'}
              </p>
              <p className="font-semibold text-slate-800">
                Product: {selectedItemId ? items.find(i => i._id === selectedItemId)?.itemName : 'All Products'}
              </p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Report Details</span>
              <p className="font-semibold text-slate-700">Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</p>
              <p className="text-[10px] text-slate-400">Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50 mb-6 text-xs">
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Start Balance</span>
              <span className="font-sans font-bold text-slate-800 text-[13px]">
                {totalSummary.openingStock.toLocaleString()} Units
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider text-emerald-600">Total Purchased (In)</span>
              <span className="font-sans font-bold text-emerald-600 text-[13px]">
                +{totalSummary.stockIn.toLocaleString()} Units
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider text-orange-600">Total Sold (Out)</span>
              <span className="font-sans font-bold text-orange-600 text-[13px]">
                -{totalSummary.stockOut.toLocaleString()} Units
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider text-primary-850">Ending Balance</span>
              <span className="font-sans font-extrabold text-primary-950 text-[13px]">
                {totalSummary.closingStock.toLocaleString()} Units
              </span>
            </div>
          </div>

          {/* Ledger Tables grouped by Company & Item */}
          {reportData.map((company) => (
            <div key={company.companyName} className="my-6 space-y-4">
              <h2 className="text-[11px] font-bold text-slate-800 border-b border-slate-250 pb-1 flex items-center gap-1.5 uppercase tracking-wide">
                Company: {company.companyName}
              </h2>
              
              {Array.isArray(company.items) && company.items.map((item) => (
                <div key={item.itemId} className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-700 bg-slate-50 p-1.5 border border-slate-200/60 rounded">
                    <span>Product: {item.itemName} ({item.unit})</span>
                    <div className="flex gap-4">
                      <span>Start Balance: {item.openingStock.toLocaleString()}</span>
                      <span className="text-emerald-700">Total In: +{item.totalStockIn.toLocaleString()}</span>
                      <span className="text-orange-700">Total Out: -{item.totalStockOut.toLocaleString()}</span>
                      <span className="text-slate-800">End Balance: {item.closingStock.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <table className="w-full text-left border-collapse text-[9px] my-3">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-1.5 px-2.5">Date</th>
                        <th className="py-1.5 px-2.5 text-right">Opening Stock</th>
                        <th className="py-1.5 px-2.5 text-right text-emerald-600">Stock In (+)</th>
                        <th className="py-1.5 px-2.5 text-right text-orange-600">Stock Out (-)</th>
                        <th className="py-1.5 px-2.5 text-right font-bold text-primary-900">Closing Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.isArray(item.history) && item.history.map((row) => (
                        <tr key={row.date} className="text-slate-700">
                          <td className="py-1.5 px-2.5 font-semibold">
                            {new Date(row.date).toLocaleDateString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-sans text-slate-500">
                            {row.openingStock.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-sans text-emerald-600 font-medium">
                            +{row.stockIn.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-sans text-orange-600 font-medium">
                            -{row.stockOut.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-sans font-bold text-primary-900 bg-primary-50/10">
                            {row.closingStock.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Reports;
