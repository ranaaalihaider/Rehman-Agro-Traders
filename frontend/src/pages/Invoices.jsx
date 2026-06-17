import React, { useState, useEffect } from 'react';
import API from '../utils/axiosConfig';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  X,
  Printer,
  Edit2,
  Plus,
  Loader2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PrintInvoice from '../components/PrintInvoice';

const Invoices = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal Detail View
  const [selectedTx, setSelectedTx] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [editDate, setEditDate] = useState('');
  const [editInvoiceNum, setEditInvoiceNum] = useState('');
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(
        `/transactions?type=${typeFilter}&startDate=${startDate}&endDate=${endDate}&search=${search}`
      );
      setTransactions(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter, startDate, endDate]);

  const handleOpenDetail = async (tx) => {
    try {
      // Reload from DB to ensure freshest state
      const { data } = await API.get(`/transactions/${tx._id}`);
      setSelectedTx(data);
      setShowDetailModal(true);
      setIsEditing(false);
      setError('');
      setSuccess('');
    } catch (err) {
      setError('Failed to load invoice details');
    }
  };

  const handleStartEdit = async () => {
    if (!selectedTx) return;
    
    try {
      // Load all items in the database to populate selects
      const { data } = await API.get('/items');
      setAvailableItems(data);

      setEditDate(selectedTx.date.split('T')[0]);
      setEditInvoiceNum(selectedTx.invoiceNumber || '');
      setEditName(selectedTx.customerSupplierName || '');
      setEditNotes(selectedTx.notes || '');
      
      // We map items list and attach availableQty of each item
      const mappedItems = selectedTx.items.map((i) => {
        const matchingDbItem = data.find((dbI) => dbI._id === i.itemId);
        return {
          itemId: i.itemId,
          itemName: i.itemName,
          quantity: i.quantity,
          rate: i.rate,
          total: i.quantity * i.rate,
          availableQty: matchingDbItem ? matchingDbItem.quantity : i.quantity,
        };
      });
      setEditItems(mappedItems);
      setIsEditing(true);
      setError('');
    } catch (err) {
      setError('Failed to initialize edit view');
    }
  };

  const handleItemFieldChange = (index, field, value) => {
    const newList = [...editItems];
    const item = newList[index];

    if (field === 'itemId') {
      const selectedItem = availableItems.find((fi) => fi._id === value);
      item.itemId = value;
      item.itemName = selectedItem ? selectedItem.itemName : '';
      item.rate = selectedItem
        ? (selectedTx.type === 'STOCK_IN' ? selectedItem.purchasePrice : selectedItem.salePrice)
        : 0;
      item.availableQty = selectedItem ? selectedItem.quantity : 0;
      item.total = item.quantity * item.rate;
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, Number(value));
      item.total = item.quantity * item.rate;
    } else if (field === 'rate') {
      item.rate = Math.max(0, Number(value));
      item.total = item.quantity * item.rate;
    }

    setEditItems(newList);
  };

  const handleAddEditRow = () => {
    setEditItems([
      ...editItems,
      { itemId: '', itemName: '', quantity: 1, rate: 0, total: 0, availableQty: 0 },
    ]);
  };

  const handleRemoveEditRow = (index) => {
    if (editItems.length === 1) return;
    const newList = [...editItems];
    newList.splice(index, 1);
    setEditItems(newList);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');
    
    const invalidRow = editItems.some((item) => !item.itemId || item.quantity <= 0 || item.rate < 0);
    if (invalidRow) {
      setError('Please select items and ensure rates/quantities are valid.');
      return;
    }

    setSubmittingEdit(true);
    try {
      const payload = {
        date: editDate,
        invoiceNumber: editInvoiceNum,
        customerSupplierName: editName,
        notes: editNotes,
        items: editItems.map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          rate: item.rate,
        })),
      };

      const { data } = await API.put(`/transactions/${selectedTx._id}`, payload);
      setSelectedTx(data);
      setIsEditing(false);
      setSuccess('Invoice updated and stock recalculated successfully!');
      
      // Update transaction in main list
      setTransactions((prev) => prev.map((t) => (t._id === data._id ? data : t)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update invoice');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteTx = async (id) => {
    setError('');
    setSuccess('');
    try {
      await API.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      setShowDetailModal(false);
      setDeleteConfirmId(null);
      setSuccess('Invoice deleted and stock reversed successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete invoice');
      setDeleteConfirmId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const editGrandTotal = editItems.reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print-hide">
        <h2 className="text-2xl font-bold text-slate-800 tracking-wide">Invoices & Slips History</h2>
        <p className="text-sm text-slate-500">Query previous transactions, edit values, delete records, or print slips.</p>
      </div>

      {/* Notifications (print:hidden) */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 print-hide">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 print-hide">
          {success}
        </div>
      )}

      {/* Search & Filters (print:hidden) */}
      <div className="glass-panel p-5 border border-slate-200/50 bg-white/70 space-y-4 print-hide">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex items-center gap-3 bg-white border border-slate-200 px-3 py-2 rounded-lg col-span-1 sm:col-span-2">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              className="bg-transparent focus:outline-none w-full text-slate-700 placeholder-slate-400 text-sm"
              placeholder="Search by Slip #, party, item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <select
              className="glass-select w-full py-2"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Invoice Types</option>
              <option value="STOCK_IN">Stock In (Purchases)</option>
              <option value="STOCK_OUT">Stock Out (Sales)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100/50">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase">
            <Calendar size={14} />
            <span>Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="glass-input-no-icon py-1 text-xs"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              className="glass-input-no-icon py-1 text-xs"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-primary-700 font-semibold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      {loading ? (
        <div className="flex h-[30vh] items-center justify-center print-hide">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block glass-panel overflow-hidden border border-slate-200/60 bg-white print-hide">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-4">Slip #</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Party / supplier</th>
                    <th className="px-6 py-4">Operator</th>
                    <th className="px-6 py-4 text-right">Items Count</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => {
                      const isIn = tx.type === 'STOCK_IN';
                      const displayId = tx.invoiceNumber || tx._id.toString().substring(18).toUpperCase();
                      return (
                        <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-mono font-bold text-slate-700">#{displayId}</td>
                          <td className="px-6 py-3.5 text-slate-500">
                            {new Date(tx.date).toLocaleDateString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                isIn
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-orange-50 text-orange-700 border border-orange-100'
                              }`}
                            >
                              {isIn ? (
                                <>
                                  <ArrowDownLeft size={12} /> Stock In
                                </>
                              ) : (
                                <>
                                  <ArrowUpRight size={12} /> Stock Out
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-medium text-slate-800">
                            {tx.customerSupplierName || 'Walk-in Customer'}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 font-sans">
                            @{tx.createdBy || 'admin'}
                          </td>
                          <td className="px-6 py-3.5 text-right font-sans">{tx.items.length}</td>
                          <td className="px-6 py-3.5 text-right font-sans font-bold text-slate-800">
                            Rs. {tx.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <button
                              onClick={() => handleOpenDetail(tx)}
                              className="btn-secondary py-1 px-2.5 text-xs hover:bg-slate-100 flex items-center gap-1 mx-auto"
                            >
                              <Eye size={13} />
                              View Slip
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="grid gap-4 md:hidden print-hide">
            {transactions.length > 0 ? (
              transactions.map((tx) => {
                const isIn = tx.type === 'STOCK_IN';
                const displayId = tx.invoiceNumber || tx._id.toString().substring(18).toUpperCase();
                return (
                  <div
                    key={tx._id}
                    className="glass-panel p-4 border border-slate-200/50 bg-white space-y-3 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-mono font-bold text-slate-800 text-[14px]">#{displayId}</h4>
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5 font-medium">
                          {new Date(tx.date).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {new Date(tx.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          isIn
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-orange-50 text-orange-700 border border-orange-100'
                        }`}
                      >
                        {isIn ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                        {isIn ? 'Stock In' : 'Stock Out'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs border-t border-slate-100 pt-2 text-slate-500">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                          {isIn ? 'Supplier' : 'Customer'}
                        </span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {tx.customerSupplierName || 'Walk-in Customer'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider text-right sm:text-left">Operator</span>
                        <span className="font-semibold text-slate-600 block text-right sm:text-left">@{tx.createdBy || 'admin'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Items Count</span>
                        <span className="font-sans font-medium text-slate-700 block">{tx.items.length} Product(s)</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider text-right sm:text-left">Total Amount</span>
                        <span className="font-sans font-bold text-primary-850 block text-right sm:text-left">Rs. {tx.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex justify-end">
                      <button
                        onClick={() => handleOpenDetail(tx)}
                        className="btn-secondary py-1.5 px-3 text-xs bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 border-slate-200"
                      >
                        <Eye size={14} />
                        View Slip
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="glass-panel py-8 text-center text-slate-400 bg-white">
                No invoices found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Details / Edit Modal */}
      {showDetailModal && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto print:bg-transparent print:static print:p-0 print:overflow-visible print:inset-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-6 animate-scaleUp print:p-0 print:shadow-none print:max-h-none print:rounded-none print:border-none">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print-hide">
              <h3 className="font-bold text-slate-800 text-[15px] uppercase tracking-wider">
                {isEditing ? 'Edit Transaction Details' : 'Invoice Slip Viewer'}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* ERROR banner inside modal */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 print-hide">
                {error}
              </div>
            )}

            {isEditing ? (
              /* EDIT MODE */
              <form onSubmit={handleSaveEdit} className="space-y-4 print-hide">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      className="glass-input-no-icon w-full py-1.5 text-sm"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {selectedTx.type === 'STOCK_IN' ? 'Supplier Name' : 'Customer Name'}
                    </label>
                    <input
                      type="text"
                      className="glass-input-no-icon w-full py-1.5 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Slip / Invoice #
                    </label>
                    <input
                      type="text"
                      className="glass-input-no-icon w-full py-1.5 text-sm"
                      value={editInvoiceNum}
                      onChange={(e) => setEditInvoiceNum(e.target.value)}
                    />
                  </div>
                </div>

                {/* Items grid */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-xs font-bold text-slate-600">Product List</span>
                    <button
                      type="button"
                      onClick={handleAddEditRow}
                      className="btn-secondary py-1 px-2.5 text-xs bg-slate-50 hover:bg-slate-100 border-slate-200"
                    >
                      <Plus size={12} /> Row
                    </button>
                  </div>

                  {editItems.map((row, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row gap-3 items-end sm:items-center border-b border-slate-50 sm:border-none pb-4 sm:pb-0"
                    >
                      {/* Product select */}
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:hidden">
                          Product
                        </label>
                        <select
                          required
                          className="glass-select w-full py-1.5 px-3 text-xs"
                          value={row.itemId}
                          onChange={(e) => handleItemFieldChange(index, 'itemId', e.target.value)}
                        >
                          <option value="" disabled>Select Item</option>
                          {availableItems
                            .filter(
                              (fi) =>
                                selectedTx.type === 'STOCK_IN' ||
                                (fi.companyId?._id || fi.companyId) === selectedTx.companyId ||
                                true // For editing, let's keep all options visible to allow flexibility
                            )
                            .map((fi) => (
                              <option key={fi._id} value={fi._id}>
                                {fi.itemName} ({fi.unit}) — Stock: {fi.quantity}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Quantity input */}
                      <div className="w-full sm:w-24">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:hidden">
                          Quantity
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          className="glass-input-no-icon w-full py-1.5 px-3 text-xs text-right sm:text-left"
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                        />
                      </div>

                      {/* Rate input */}
                      <div className="w-full sm:w-28">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:hidden">
                          Rate (Rs.)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          className="glass-input-no-icon w-full py-1.5 px-3 text-xs text-right sm:text-left"
                          placeholder="Rate"
                          value={row.rate}
                          onChange={(e) => handleItemFieldChange(index, 'rate', e.target.value)}
                        />
                      </div>

                      {/* Line Total */}
                      <div className="w-full sm:w-28 text-right sm:pr-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:hidden">
                          Total (Rs.)
                        </label>
                        <span className="font-semibold font-sans text-xs text-slate-700">
                          Rs. {(row.total || 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Remove Row Button */}
                      <button
                        type="button"
                        disabled={editItems.length === 1}
                        onClick={() => handleRemoveEditRow(index)}
                        className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Notes and Grand Total */}
                <div className="flex flex-col md:flex-row gap-4 justify-between pt-3 border-t border-slate-100">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Notes
                    </label>
                    <textarea
                      className="glass-input-no-icon w-full text-xs h-16 resize-none"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  </div>
                  <div className="w-48 flex flex-col justify-center text-right pr-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Sum</span>
                    <span className="text-md font-bold text-slate-800">
                      Rs. {editGrandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="btn-primary py-1.5 px-4 text-xs font-semibold"
                  >
                    {submittingEdit ? 'Saving...' : 'Save & Adjust Stock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary py-1.5 px-4 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE (Contains Action Buttons & Printable component) */
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 justify-end print-hide">
                  <button onClick={handlePrint} className="btn-primary py-1.5 text-xs">
                    <Printer size={14} />
                    Print Slip
                  </button>
                  <button
                    onClick={handleStartEdit}
                    className="btn-secondary py-1.5 text-xs bg-slate-50 hover:bg-slate-100"
                  >
                    <Edit2 size={14} />
                    Edit Details
                  </button>

                  {deleteConfirmId === selectedTx._id ? (
                    <div className="flex items-center bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg gap-2 animate-fadeIn">
                      <AlertTriangle size={14} className="text-orange-600" />
                      <span className="text-xs text-orange-700 font-medium">Reverts stock levels. Delete?</span>
                      <button
                        onClick={() => handleDeleteTx(selectedTx._id)}
                        className="bg-red-600 text-white text-[10px] font-semibold px-2 py-1 rounded"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-1 rounded"
                      >
                        Abort
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(selectedTx._id)}
                      className="btn-danger py-1.5 text-xs"
                    >
                      <Trash2 size={14} />
                      Delete Invoice
                    </button>
                  )}
                </div>

                {/* Printable Invoice Sheet */}
                <div className="p-4 border border-slate-200 bg-white rounded-xl">
                  <PrintInvoice transaction={selectedTx} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
