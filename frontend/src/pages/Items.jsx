import React, { useState, useEffect } from 'react';
import API from '../utils/axiosConfig';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, Layers, Filter } from 'lucide-react';

const Items = () => {
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search and Filter States
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form Drawer States
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Field States
  const [itemName, setItemName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('Bag');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [openingStock, setOpeningStock] = useState('0');

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, companiesRes, categoriesRes] = await Promise.all([
        API.get(`/items?search=${search}&companyId=${companyFilter}&category=${categoryFilter}`),
        API.get('/companies'),
        API.get('/categories'),
      ]);
      setItems(itemsRes.data);
      setCompanies(companiesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, companyFilter, categoryFilter]);

  const handleOpenAdd = () => {
    setEditId(null);
    setItemName('');
    setCompanyId(companies[0]?._id || '');
    
    // Find default fertilizers category
    const defaultCat = categories.find((c) => c.name.toLowerCase() === 'fertilizers');
    setCategory(defaultCat?._id || categories[0]?._id || '');

    setUnit('Bag');
    setPurchasePrice('');
    setSalePrice('');
    setOpeningStock('0');
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item._id);
    setItemName(item.itemName);
    setCompanyId(item.companyId?._id || item.companyId || '');
    setCategory(item.category?._id || item.category || '');
    setUnit(item.unit || 'Bag');
    setPurchasePrice(item.purchasePrice);
    setSalePrice(item.salePrice);
    setOpeningStock(item.openingStock);
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!itemName.trim() || !companyId || !unit || !category) {
      setError('Item name, Company, Category, and Unit are required');
      return;
    }

    const payload = {
      itemName,
      companyId,
      category,
      unit,
      purchasePrice: Number(purchasePrice),
      salePrice: Number(salePrice),
      openingStock: Number(openingStock),
    };

    try {
      if (editId) {
        const { data } = await API.put(`/items/${editId}`, payload);
        setItems((prev) => prev.map((item) => (item._id === editId ? data : item)));
        setSuccess('Item updated successfully!');
      } else {
        const { data } = await API.post('/items', payload);
        setItems((prev) => [...prev, data]);
        setSuccess('Item created successfully!');
      }
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDeleteItem = async (id) => {
    setError('');
    setSuccess('');
    try {
      await API.delete(`/items/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      setDeleteConfirmId(null);
      setSuccess('Item deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
      setDeleteConfirmId(null);
    }
  };

  const unitOptions = ['Bag', 'Kg', 'Liter', 'Pack', 'Bottle', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-wide">Item & Product Management</h2>
          <p className="text-sm text-slate-500">Register fertilizer bags, seed packs, or other items under supplier companies.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-primary"
        >
          <Plus size={16} />
          Register New Item
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Add / Edit Form Modal Drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl overflow-y-auto space-y-6 animate-slideIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-md">
                {editId ? 'Modify Registered Item' : 'Register New Item'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  className="glass-input-no-icon w-full"
                  placeholder="e.g. Urea Prilled"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Supplier Company
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    required
                    className="glass-select w-full"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <select
                    required
                    className="glass-select w-full"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    {unitOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Purchase Price (Rs.)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="glass-input-no-icon w-full"
                    placeholder="e.g. 3000"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Sale Price (Rs.)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="glass-input-no-icon w-full"
                    placeholder="e.g. 3200"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  Save Item Details
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar Card */}
      <div className="glass-panel p-4 border border-slate-200/50 flex flex-col md:flex-row gap-4 bg-white/70">
        <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 px-3 py-2 rounded-lg">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            className="bg-transparent focus:outline-none w-full text-slate-700 placeholder-slate-400 text-sm"
            placeholder="Search items by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
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
            className="glass-select py-1 px-3 text-xs w-36"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Table */}
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
                    <th className="px-6 py-4">Item Details</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4 text-right">Purchase Price</th>
                    <th className="px-6 py-4 text-right">Sale Price</th>
                    <th className="px-6 py-4 text-right">Opening Stock</th>
                    <th className="px-6 py-4 text-right">Current Stock</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-semibold text-slate-800">{item.itemName}</td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {item.companyId?.companyName || 'N/A'}
                        </td>
                        <td className="px-6 py-3.5 text-slate-400 capitalize">
                          {item.category?.name || '—'}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right font-sans">
                          Rs. {item.purchasePrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-right font-sans">
                          Rs. {item.salePrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-right text-slate-400 font-sans">
                          {item.openingStock}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span
                            className={`font-sans font-bold ${
                              item.quantity <= 10
                                ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded-lg'
                                : item.quantity <= 25
                                ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg'
                                : 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg'
                            }`}
                          >
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {deleteConfirmId === item._id ? (
                            <div className="flex items-center justify-center gap-1.5 animate-fadeIn">
                              <button
                                onClick={() => handleDeleteItem(item._id)}
                                className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[10px] px-2 py-1"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-lg bg-white border border-slate-200 text-slate-500 text-[10px] px-2 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                title="Edit Item"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(item._id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">
                        No items registered. Start by adding a new item.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="grid gap-4 md:hidden">
            {items.length > 0 ? (
              items.map((item) => (
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
                          {item.category?.name || '—'}
                        </span>
                      )}
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-semibold text-primary-700">
                        {item.unit}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-2 text-slate-500">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Purchase Price</span>
                      <span className="font-sans text-slate-700 font-semibold">Rs. {item.purchasePrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Sale Price</span>
                      <span className="font-sans text-slate-700 font-semibold">Rs. {item.salePrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Opening Stock</span>
                      <span className="font-sans text-slate-600 font-medium">{item.openingStock} {item.unit}s</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Current Stock</span>
                      <span
                        className={`font-sans font-bold text-xs ${
                          item.quantity <= 10
                            ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded'
                            : item.quantity <= 25
                            ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded'
                            : 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded'
                        }`}
                      >
                        {item.quantity} {item.unit}s
                      </span>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Actions</span>
                    {deleteConfirmId === item._id ? (
                      <div className="flex items-center gap-1.5 animate-fadeIn">
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[10px] px-2.5 py-1.5"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded-lg bg-white border border-slate-200 text-slate-500 text-[10px] px-2.5 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="rounded-lg p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item._id)}
                          className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel py-8 text-center text-slate-400 bg-white">
                No items registered. Start by adding a new item.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
