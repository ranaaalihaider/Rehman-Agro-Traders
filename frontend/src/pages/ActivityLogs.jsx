import React, { useState, useEffect } from 'react';
import API from '../utils/axiosConfig';
import { History, Search, RefreshCw, AlertCircle, PlusCircle, Edit3, Trash2, Settings, UserCheck } from 'lucide-react';

const ActivityLogs = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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

  // Filter activities based on search query
  const filteredActivities = activities.filter((act) => {
    const term = search.toLowerCase();
    return (
      act.action.toLowerCase().includes(term) ||
      act.description.toLowerCase().includes(term) ||
      act.user.toLowerCase().includes(term)
    );
  });

  // Helper to determine action icons and colors
  const getActionStyles = (action) => {
    const act = action.toLowerCase();
    if (act.includes('created') || act.includes('add')) {
      return { icon: PlusCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    }
    if (act.includes('edit') || act.includes('update') || act.includes('changed')) {
      return { icon: Edit3, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    }
    if (act.includes('delete') || act.includes('remove')) {
      return { icon: Trash2, color: 'text-red-600 bg-red-50 border-red-100' };
    }
    if (act.includes('settings')) {
      return { icon: Settings, color: 'text-amber-600 bg-amber-50 border-amber-100' };
    }
    return { icon: UserCheck, color: 'text-slate-600 bg-slate-50 border-slate-100' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-wide">Activity History Logs</h2>
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

      {/* Search Filter */}
      <div className="glass-panel p-4 border border-slate-200/50 flex items-center gap-3 bg-white/70 max-w-md">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          className="bg-transparent focus:outline-none w-full text-slate-700 placeholder-slate-400 text-sm"
          placeholder="Filter history log list..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Timeline View */}
      {loading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600"></div>
        </div>
      ) : (
        <div className="glass-panel p-6 border border-slate-200/60 bg-white relative">
          
          {/* Vertical timeline line helper */}
          <div className="absolute left-11 top-8 bottom-8 w-0.5 bg-slate-100 hidden sm:block"></div>

          <div className="space-y-6 relative">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((act) => {
                const styles = getActionStyles(act.action);
                const Icon = styles.icon;
                return (
                  <div key={act._id} className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm relative">
                    
                    {/* Icon Column */}
                    <div className="flex items-center sm:block z-10 shrink-0">
                      <div className={`rounded-xl border p-2.5 ${styles.color}`}>
                        <Icon size={18} />
                      </div>
                    </div>

                    {/* Content Details Column */}
                    <div className="space-y-1 sm:pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">{act.action}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-sans border border-slate-200/40">
                          operator: {act.user}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs">{act.description}</p>
                      
                      {/* Date details */}
                      <p className="text-[10px] text-slate-400 font-sans">
                        {new Date(act.timestamp).toLocaleDateString([], {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400">
                No history logs match search query.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
