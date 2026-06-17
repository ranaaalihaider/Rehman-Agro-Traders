import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/axiosConfig';
import { 
  History, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Settings, 
  UserCheck, 
  ExternalLink,
  Lock
} from 'lucide-react';

// Pure helper functions placed outside the component to guarantee clean hoisting and avoid Temporal Dead Zone (TDZ)
const getActivityCategory = (action) => {
  if (!action) return 'System';
  const act = String(action).toLowerCase();
  if (act.includes('invoice')) return 'Invoice';
  if (act.includes('item') || act.includes('product')) return 'Product';
  if (act.includes('company')) return 'Company';
  if (act.includes('category')) return 'Category';
  if (act.includes('settings')) return 'Settings';
  if (act.includes('login') || act.includes('password')) return 'Security';
  return 'System';
};

const getCategoryStyles = (category) => {
  switch (category) {
    case 'Invoice':
      return 'bg-blue-50 text-blue-700 border-blue-200/60';
    case 'Product':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    case 'Company':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
    case 'Category':
      return 'bg-purple-50 text-purple-700 border-purple-200/60';
    case 'Settings':
      return 'bg-amber-50 text-amber-700 border-amber-200/60';
    case 'Security':
      return 'bg-red-50 text-red-700 border-red-200/60';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200/60';
  }
};

const getActionStyles = (action) => {
  const defaultStyle = { icon: UserCheck, color: 'text-slate-600 bg-slate-50 border-slate-100' };
  if (!action) return defaultStyle;
  try {
    const act = String(action).toLowerCase();
    if (act.includes('created') || act.includes('add') || act.includes('seed')) {
      return { icon: PlusCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
    }
    if (act.includes('edit') || act.includes('update') || act.includes('changed') || act.includes('modify')) {
      return { icon: Edit3, color: 'text-indigo-700 bg-indigo-50 border-indigo-100' };
    }
    if (act.includes('delete') || act.includes('remove')) {
      return { icon: Trash2, color: 'text-red-700 bg-red-50 border-red-100' };
    }
    if (act.includes('settings')) {
      return { icon: Settings, color: 'text-amber-700 bg-amber-50 border-amber-100' };
    }
    if (act.includes('login') || act.includes('password')) {
      return { icon: Lock, color: 'text-rose-700 bg-rose-50 border-rose-100' };
    }
    return defaultStyle;
  } catch (e) {
    console.error(e);
    return defaultStyle;
  }
};

const parseActionLink = (act) => {
  try {
    if (!act || !act.action || !act.description) return null;
    const action = String(act.action).toLowerCase();
    const description = String(act.description);

    // Deletes cannot link to anything as the entity is gone
    if (action.includes('delete') || action.includes('remove')) {
      return null;
    }

    if (action.includes('invoice')) {
      const match = description.match(/Invoice\s*#:\s*([^\s,]+)/i);
      if (match && match[1]) {
        return {
          to: `/invoices?search=${encodeURIComponent(match[1].trim())}`,
          label: 'View Slip',
        };
      }
    }

    if (action.includes('item')) {
      const match = description.match(/item\s*"([^"]+)"/i);
      if (match && match[1]) {
        return {
          to: `/items?search=${encodeURIComponent(match[1].trim())}`,
          label: 'View Product',
        };
      }
    }

    if (action.includes('company')) {
      let match = description.match(/company:\s*([^\n,.]+)/i);
      if (!match) {
        match = description.match(/to\s*"([^"]+)"/i);
      }
      if (match && match[1]) {
        const name = match[1].replace(/"/g, '').trim();
        return {
          to: `/companies?search=${encodeURIComponent(name)}`,
          label: 'View Company',
        };
      }
    }

    if (action.includes('category')) {
      let match = description.match(/category:\s*([^\n,.]+)/i);
      if (!match) {
        match = description.match(/to\s*"([^"]+)"/i);
      }
      if (match && match[1]) {
        const name = match[1].replace(/"/g, '').trim();
        return {
          to: `/categories?search=${encodeURIComponent(name)}`,
          label: 'View Category',
        };
      }
    }

    if (action.includes('settings')) {
      return {
        to: '/settings',
        label: 'View Settings',
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to parse log redirection:', e);
    return null;
  }
};

const formatTimestamp = (ts) => {
  try {
    if (!ts) return 'N/A';
    const d = new Date(ts);
    if (isNaN(d.getTime())) {
      return 'N/A';
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  } catch (e) {
    return 'N/A';
  }
};

const getDifferenceList = (prev, curr) => {
  if (!prev || !curr) return [];
  try {
    const diffs = [];
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
    
    for (const key of allKeys) {
      if (key === 'items') continue;
      
      const oldVal = prev[key];
      const newVal = curr[key];
      
      if (oldVal === newVal) continue;
      if ((oldVal === undefined || oldVal === null) && (newVal === undefined || newVal === null)) continue;
      
      const labels = {
        itemName: 'Item Name',
        companyName: 'Supplier Company',
        categoryName: 'Product Category',
        purchasePrice: 'Purchase Price',
        salePrice: 'Sale Price',
        quantity: 'Stock Qty',
        unit: 'Stock Unit',
        invoiceNumber: 'Invoice #',
        customerSupplierName: 'Customer/Supplier Name',
        totalAmount: 'Total Amount',
        notes: 'Notes',
        date: 'Date',
        name: 'Business Name',
        contact: 'Contact #',
        address: 'Address'
      };

      const formatVal = (v) => {
        if (v === undefined || v === null) return 'None';
        if (typeof v === 'boolean') return v ? 'Yes' : 'No';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
      };
      
      diffs.push({
        field: labels[key] || key,
        oldValue: formatVal(oldVal),
        newValue: formatVal(newVal)
      });
    }
    return diffs;
  } catch (e) {
    console.error(e);
    return [];
  }
};

const getItemDifference = (prevItems, currItems) => {
  if (!Array.isArray(prevItems) || !Array.isArray(currItems)) return null;
  try {
    const diffs = [];
    const allNames = new Set([
      ...prevItems.map(i => i.itemName).filter(Boolean),
      ...currItems.map(i => i.itemName).filter(Boolean)
    ]);

    for (const name of allNames) {
      const oldItem = prevItems.find(i => i.itemName === name);
      const newItem = currItems.find(i => i.itemName === name);

      const oldQty = oldItem ? Number(oldItem.quantity) : 0;
      const newQty = newItem ? Number(newItem.quantity) : 0;
      const oldRate = oldItem ? Number(oldItem.rate) : 0;
      const newRate = newItem ? Number(newItem.rate) : 0;

      if (oldQty !== newQty || oldRate !== newRate) {
        diffs.push({
          itemName: name,
          oldQty,
          newQty,
          oldRate,
          newRate,
        });
      }
    }
    return diffs.length > 0 ? diffs : null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const ActivityLogs = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState(() => getLocalDateString());
  const [endDate, setEndDate] = useState(() => getLocalDateString());
  const [expandedDiffs, setExpandedDiffs] = useState({});

  const toggleDiff = (id) => {
    setExpandedDiffs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderDiffWidget = (act) => {
    if (!act.previousState || !act.newState) return null;
    const isExpanded = !!expandedDiffs[act._id];
    const diffs = getDifferenceList(act.previousState, act.newState);
    const itemDiffs = getItemDifference(act.previousState.items, act.newState.items);

    if (diffs.length === 0 && !itemDiffs) return null;

    return (
      <div className="mt-2 text-xs">
        <button
          onClick={() => toggleDiff(act._id)}
          className="text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1 focus:outline-none transition-colors mb-1.5 cursor-pointer"
        >
          <span>{isExpanded ? 'Hide Changes' : 'Show Changes'}</span>
          <span className="text-[10px] uppercase bg-primary-50 px-1.5 py-0.5 rounded text-primary-700 font-sans border border-primary-100">
            {diffs.length + (itemDiffs ? itemDiffs.length : 0)} updated
          </span>
        </button>

        {isExpanded && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-2.5 animate-fadeIn max-w-xl">
            {diffs.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field Modifications</div>
                <div className="grid gap-2">
                  {diffs.map((d, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                      <span className="font-semibold text-slate-750 text-slate-700">{d.field}:</span>
                      <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-100 text-red-600 line-through">
                          {d.oldValue}
                        </span>
                        <span className="text-slate-400 font-bold">&rarr;</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold">
                          {d.newValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {itemDiffs && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Quantity & Rate Changes</div>
                <div className="grid gap-2">
                  {itemDiffs.map((idiff, index) => (
                    <div key={index} className="p-2 rounded-lg bg-white border border-slate-100 shadow-sm space-y-1">
                      <div className="font-bold text-slate-800 text-[11px]">{idiff.itemName}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                        {idiff.oldQty !== idiff.newQty && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Qty:</span>
                            <span className="text-red-500 line-through">{idiff.oldQty}</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="text-emerald-600 font-semibold">{idiff.newQty}</span>
                          </div>
                        )}
                        {idiff.oldRate !== idiff.newRate && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Rate:</span>
                            <span className="text-red-500 line-through">{idiff.oldRate}</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="text-emerald-600 font-semibold">{idiff.newRate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/activity');
      setActivities(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleRefresh = () => {
    fetchActivities();
  };

  // Filter activities based on search query, type/category, and date range
  const activityList = Array.isArray(activities) ? activities : [];
  const filteredActivities = activityList.filter((act) => {
    if (!act) return false;

    // 1. Search term match
    const term = (search || '').toLowerCase();
    const action = String(act.action || '');
    const description = String(act.description || '');
    const user = String(act.user || '');
    const category = getActivityCategory(action);
    const actCat = category.toLowerCase();
    
    const matchesSearch = (
      action.toLowerCase().includes(term) ||
      description.toLowerCase().includes(term) ||
      user.toLowerCase().includes(term) ||
      actCat.includes(term)
    );

    // 2. Category match
    const matchesCategory = !categoryFilter || category === categoryFilter;

    // 3. Date range match (UTC to local conversion)
    let matchesDate = true;
    if (act.timestamp) {
      const actDateStr = getLocalDateString(new Date(act.timestamp));
      if (startDate && actDateStr < startDate) {
        matchesDate = false;
      }
      if (endDate && actDateStr > endDate) {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-wide font-outfit">Activity History Logs</h2>
            <p className="text-sm text-slate-500">Track operations, invoice saves, edits, settings updates, and admin actions.</p>
          </div>
          <button
            onClick={handleRefresh}
            className="btn-secondary py-2 px-3 flex items-center gap-1.5 hover:bg-slate-100"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Logs
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Info notice about retention */}
      <div className="rounded-xl bg-slate-100 border border-slate-200 p-3 text-xs text-slate-600 flex items-center gap-2">
        <AlertCircle size={16} className="text-slate-500 shrink-0" />
        <span>System Log Policy: Logs older than 3 months are automatically pruned on new inserts.</span>
      </div>

      {/* Filter and Date Panel */}
      <div className="glass-panel p-4 border border-slate-200/50 bg-white/70 space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Logs</label>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                className="glass-input-no-icon pl-9 w-full py-1.5 text-sm"
                placeholder="Search details, operator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Category Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Type</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="glass-input-no-icon w-full py-1.5 text-sm cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Invoice">Invoice</option>
              <option value="Product">Product</option>
              <option value="Company">Company</option>
              <option value="Category">Category</option>
              <option value="Settings">Settings</option>
              <option value="Security">Security</option>
              <option value="System">System</option>
            </select>
          </div>

          {/* Date Filter (Start) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              className="glass-input-no-icon w-full py-1.5 text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Date Filter (End) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
            <input
              type="date"
              className="glass-input-no-icon w-full py-1.5 text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Date Shifts */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleShiftDate(-1)}
              className="btn-secondary py-1.5 px-3 flex items-center gap-1 hover:bg-slate-100 text-xs font-semibold"
            >
              &larr; Previous Day
            </button>
            <button
              onClick={() => handleShiftDate(1)}
              className="btn-secondary py-1.5 px-3 flex items-center gap-1 hover:bg-slate-100 text-xs font-semibold"
            >
              Next Day &rarr;
            </button>
          </div>
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-slate-500 hover:text-primary-600 transition-colors font-semibold"
          >
            Clear Date Filters (Show All)
          </button>
        </div>
      </div>

      {/* Main View Display */}
      {loading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block glass-panel overflow-hidden border border-slate-200/60 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50">
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-slate-500 font-sans">Timestamp</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-slate-500 font-sans">Operator</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-slate-500 font-sans">Category</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-slate-500 font-sans">Action Type</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-slate-500 font-sans">Action Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((act) => {
                      const category = getActivityCategory(act.action);
                      const catStyles = getCategoryStyles(category);
                      const actStyles = getActionStyles(act.action) || {};
                      const linkInfo = parseActionLink(act);
                      const Icon = actStyles.icon || UserCheck;

                      return (
                        <tr key={act._id || Math.random().toString()} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-4 text-slate-500 font-mono whitespace-nowrap">
                            {formatTimestamp(act.timestamp)}
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-block px-2 py-1 uppercase rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/50">
                              {act.user}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${catStyles}`}>
                              {category}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <span className={`rounded p-1 ${actStyles.color || 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                                <Icon size={12} />
                              </span>
                              <span>{act.action}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                              <span className="text-slate-600 break-words max-w-xl">{act.description}</span>
                              {linkInfo && (
                                <Link 
                                  to={linkInfo.to}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-primary-50 text-primary-700 border border-primary-100 hover:bg-primary-100 hover:text-primary-800 transition-all shrink-0 cursor-pointer shadow-sm"
                                >
                                  <span>{linkInfo.label}</span>
                                  <ExternalLink size={12} />
                                </Link>
                              )}
                            </div>
                            {renderDiffWidget(act)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        No history logs match search/filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((act) => {
                const category = getActivityCategory(act.action);
                const catStyles = getCategoryStyles(category);
                const actStyles = getActionStyles(act.action) || {};
                const linkInfo = parseActionLink(act);
                const Icon = actStyles.icon || UserCheck;

                return (
                  <div 
                    key={act._id || Math.random().toString()} 
                    className="glass-panel p-4 border border-slate-200/60 bg-white space-y-3 shadow-sm"
                  >
                    {/* Timestamp & Operator */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-mono">{formatTimestamp(act.timestamp)}</span>
                      <span className="inline-block px-2 py-0.5 uppercase rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/50">
                        {act.user}
                      </span>
                    </div>

                    {/* Category & Action Type */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${catStyles}`}>
                        {category}
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                        <span className={`rounded p-1 ${actStyles.color || 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                          <Icon size={12} />
                        </span>
                        <span>{act.action}</span>
                      </div>
                    </div>

                    {/* Action Details */}
                    <p className="text-xs text-slate-600 break-words leading-relaxed">{act.description}</p>
                    
                    {renderDiffWidget(act)}

                    {/* Secure Direct Link */}
                    {linkInfo && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <Link 
                          to={linkInfo.to}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-primary-50 text-primary-700 border border-primary-100 hover:bg-primary-100 hover:text-primary-800 transition-all shadow-sm"
                        >
                          <span>{linkInfo.label}</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="glass-panel p-6 text-center text-slate-400 text-sm bg-white border border-slate-200/60">
                No history logs match search/filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityLogs;
