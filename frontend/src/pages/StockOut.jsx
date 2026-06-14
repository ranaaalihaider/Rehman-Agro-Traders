import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/axiosConfig';
import { Plus, Trash2, Calendar, FileText, ShoppingBag, Loader2, FileCheck, Printer, User } from 'lucide-react';
import PrintInvoice from '../components/PrintInvoice';

const StockOut = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  // Form states
  const [date, setDate] = useState(() => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  });
  const [companyId, setCompanyId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [itemsList, setItemsList] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successTx, setSuccessTx] = useState(null); // Saved invoice details

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [compRes, itemsRes] = await Promise.all([
          API.get('/companies'),
          API.get('/items'),
        ]);
        setCompanies(compRes.data);
        setAllItems(itemsRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load companies or items');
        setLoading(false);
      }
    };
    fetchFormData();
  }, []);

  // Filter items when company changes
  useEffect(() => {
    if (companyId) {
      const filtered = allItems.filter(
        (item) => (item.companyId?._id || item.companyId) === companyId
      );
      setFilteredItems(filtered);
      // Reset items list since they belong to another company
      setItemsList([{ itemId: '', itemName: '', quantity: 1, rate: 0, total: 0, availableQty: 0 }]);
    } else {
      setFilteredItems([]);
      setItemsList([]);
    }
  }, [companyId, allItems]);

  const handleAddItemRow = () => {
    setItemsList([
      ...itemsList,
      { itemId: '', itemName: '', quantity: 1, rate: 0, total: 0, availableQty: 0 },
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (itemsList.length === 1) return;
    const newList = [...itemsList];
    newList.splice(index, 1);
    setItemsList(newList);
  };

  const handleItemFieldChange = (index, field, value) => {
    const newList = [...itemsList];
    const item = newList[index];

    if (field === 'itemId') {
      const selectedItem = filteredItems.find((fi) => fi._id === value);
      item.itemId = value;
      item.itemName = selectedItem ? selectedItem.itemName : '';
      item.rate = selectedItem ? selectedItem.salePrice : 0;
      item.availableQty = selectedItem ? selectedItem.quantity : 0;
      item.total = (item.quantity || 0) * (item.rate || 0);
    } else if (field === 'quantity') {
      item.quantity = value === '' ? '' : Math.max(0, Number(value));
      item.total = (item.quantity || 0) * (item.rate || 0);
    } else if (field === 'rate') {
      item.rate = value === '' ? '' : Math.max(0, Number(value));
      item.total = (item.quantity || 0) * (item.rate || 0);
    }

    setItemsList(newList);
  };

  // Compute Grand Total
  const grandTotal = itemsList.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyId) {
      setError('Please select a supplier company');
      return;
    }

    // Front-end validations
    const invalidRow = itemsList.some((item) => 
      !item.itemId || 
      item.quantity === '' || 
      Number(item.quantity) <= 0 || 
      item.rate === '' || 
      Number(item.rate) < 0
    );
    if (invalidRow) {
      setError('Please select items and ensure rates/quantities are valid.');
      return;
    }

    // Validate available stock levels
    for (let item of itemsList) {
      if (item.quantity > item.availableQty) {
        setError(`Insufficient stock for "${item.itemName}". Available: ${item.availableQty}, Requested: ${item.quantity}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        type: 'STOCK_OUT',
        date,
        invoiceNumber,
        customerSupplierName: customerName ? customerName.trim() : 'Walk-in Customer',
        notes,
        items: itemsList.map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          rate: item.rate,
        })),
      };

      const { data } = await API.post('/transactions', payload);
      setSuccessTx(data);
      // Reset form
      setCompanyId('');
      setCustomerName('');
      setInvoiceNumber('');
      setNotes('');
      setItemsList([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit Stock Out invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* If invoice successfully saved, show printable invoice preview */}
      {successTx ? (
        <div className="space-y-6">
          <div className="glass-panel p-6 border border-emerald-200 bg-emerald-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-600 p-3 text-white">
                <FileCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Sales Invoice Saved!</h3>
                <p className="text-sm text-slate-600">Stock updated successfully. You can print the receipt below.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="btn-primary">
                <Printer size={16} />
                Print Invoice
              </button>
              <button
                onClick={() => setSuccessTx(null)}
                className="btn-secondary"
              >
                Create New Entry
              </button>
              <button
                onClick={() => navigate('/invoices')}
                className="btn-secondary bg-slate-100 hover:bg-slate-200 border-none"
              >
                View Invoice List
              </button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div className="glass-panel border border-slate-200 p-4 sm:p-6 md:p-10 bg-white max-w-4xl mx-auto shadow-md print:p-0 print:border-none print:shadow-none print:max-w-none print:bg-transparent">
            <PrintInvoice transaction={successTx} />
          </div>
        </div>
      ) : (
        /* Sales stock exit form */
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-wide">Stock Out (Sales Entry)</h2>
            <p className="text-sm text-slate-500">Record stock sales and automatically deduct quantities from items list.</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Meta fields */}
            <div className="glass-panel p-5 border border-slate-200/50 bg-white grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Sale Date
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="date"
                    required
                    className="glass-input-icon w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Supplier/Company Origin
                </label>
                <select
                  required
                  className="glass-select w-full"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  <option value="" disabled>Select Company</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Customer Name (Optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    className="glass-input-icon w-full"
                    placeholder="e.g. Walk-in or Ali Raza"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Invoice/Slip Number (Optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <FileText size={16} />
                  </div>
                  <input
                    type="text"
                    className="glass-input-icon w-full"
                    placeholder="e.g. SLIP-23423"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Items table entry */}
            {companyId && (
              <div className="glass-panel p-5 border border-slate-200/50 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={18} className="text-orange-600" />
                    <h3 className="font-bold text-slate-800 text-[15px]">Sales Items Grid</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="btn-secondary py-1.5 px-3 text-xs bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100"
                  >
                    <Plus size={14} />
                    Add Row
                  </button>
                </div>

                <div className="space-y-3">
                  {itemsList.map((row, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row gap-3 items-end sm:items-center border-b border-slate-50 sm:border-none pb-4 sm:pb-0"
                    >
                      {/* Item Dropdown */}
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:hidden">
                          Product
                        </label>
                        <select
                          required
                          className="glass-select w-full py-1.5 text-sm"
                          value={row.itemId}
                          onChange={(e) => handleItemFieldChange(index, 'itemId', e.target.value)}
                        >
                          <option value="" disabled>Select Item</option>
                          {filteredItems.map((fi) => (
                            <option key={fi._id} value={fi._id}>
                              {fi.itemName} ({fi.unit}) — Stock: {fi.quantity}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-full sm:w-28">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:hidden">
                          Quantity
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          className={`glass-input-no-icon w-full py-1.5 text-sm font-sans ${
                            row.itemId && row.quantity > row.availableQty
                              ? 'border-red-500 focus:ring-red-500 bg-red-50/50'
                              : ''
                          }`}
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                        />
                        {row.itemId && row.quantity > row.availableQty && (
                          <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                            Over limit! Stock: {row.availableQty}
                          </span>
                        )}
                      </div>

                      {/* Sale price Input */}
                      <div className="w-full sm:w-36">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:hidden">
                          Sale Price (Rs.)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          className="glass-input-no-icon w-full py-1.5 text-sm font-sans"
                          placeholder="Rate"
                          value={row.rate}
                          onChange={(e) => handleItemFieldChange(index, 'rate', e.target.value)}
                        />
                      </div>

                      {/* Total cost */}
                      <div className="w-full sm:w-36 text-right sm:pr-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 sm:hidden">
                          Total (Rs.)
                        </label>
                        <span className="font-sans text-sm font-bold text-slate-700">
                          Rs. {(row.total || 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Delete row */}
                      <button
                        type="button"
                        disabled={itemsList.length === 1}
                        onClick={() => handleRemoveItemRow(index)}
                        className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Notes and Grand Total summary */}
                <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Notes / Remarks (Optional)
                    </label>
                    <textarea
                      className="glass-input-no-icon w-full text-sm h-20 resize-none"
                      placeholder="e.g. Goods delivered. Cash received in drawer..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  
                  <div className="w-full md:w-64 glass-panel p-4 bg-slate-50/50 flex flex-col justify-center gap-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Total Lines:</span>
                      <span className="font-bold">{itemsList.length} Items</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/60 pt-2 text-sm text-slate-800">
                      <span className="font-semibold">Grand Total:</span>
                      <span className="font-sans font-extrabold text-orange-700 text-[16px]">
                        Rs. {grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary bg-orange-600 hover:bg-orange-700 min-w-40"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Invoice...
                      </>
                    ) : (
                      'Save & Log Stock'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyId('');
                      setCustomerName('');
                      setInvoiceNumber('');
                      setNotes('');
                      setItemsList([]);
                    }}
                    className="btn-secondary"
                  >
                    Reset Grid
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default StockOut;
