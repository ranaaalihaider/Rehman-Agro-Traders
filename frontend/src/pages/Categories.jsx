import React, { useState, useEffect } from 'react';
import API from '../utils/axiosConfig';
import { Search, Plus, Edit2, Trash2, X, Check, Tags, AlertTriangle } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Category Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Edit Category Form State
  const [editingId, setEditingId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/categories?search=${search}`);
      setCategories(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchCategories();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const { data } = await API.post('/categories', { name: newCategoryName });
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
      setShowAddForm(false);
      setSuccess('Category added successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleStartEdit = (category) => {
    setEditingId(category._id);
    setEditCategoryName(category.name);
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCategoryName('');
  };

  const handleSaveEdit = async (id) => {
    setError('');
    setSuccess('');
    if (!editCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const { data } = await API.put(`/categories/${id}`, { name: editCategoryName });
      setCategories((prev) =>
        prev
          .map((c) => (c._id === id ? data : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      setSuccess('Category updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    setError('');
    setSuccess('');
    try {
      await API.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      setDeleteConfirmId(null);
      setSuccess('Category deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-wide">Category Management</h2>
          <p className="text-sm text-slate-500">Add or manage product categories registered in the system.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Close Drawer' : 'Add New Category'}
        </button>
      </div>

      {/* Message Notifications */}
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

      {/* Add Category Box */}
      {showAddForm && (
        <div className="glass-panel p-5 border border-slate-200/60 max-w-md animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Register Category</h3>
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              className="glass-input-no-icon flex-1"
              placeholder="e.g. Seeds"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
              autoFocus
            />
            <button type="submit" className="btn-primary shrink-0">
              Save
            </button>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="glass-panel p-4 border border-slate-200/50 flex items-center gap-3 bg-white/70 max-w-md">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          className="bg-transparent focus:outline-none w-full text-slate-700 placeholder-slate-400 text-sm"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600"></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div
                key={category._id}
                className="glass-panel p-4 border border-slate-200/50 flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-50 p-2.5 text-primary-700 border border-primary-100">
                    <Tags size={20} />
                  </div>
                  
                  {/* Category Name View vs Edit Mode */}
                  {editingId === category._id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        className="glass-input-no-icon py-1 px-2 text-sm w-full"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        required
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(category._id)}
                        className="rounded-lg bg-primary-100 p-1.5 text-primary-700 hover:bg-primary-200"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="font-semibold text-slate-800 capitalize">{category.name}</span>
                  )}
                </div>

                {/* Operations / Confirmation Pane */}
                {deleteConfirmId === category._id ? (
                  <div className="mt-4 rounded-xl bg-orange-50 border border-orange-100 p-3 space-y-2">
                    <div className="flex gap-2 text-orange-700 text-xs">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>Are you sure? This removes the category record.</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="rounded-lg bg-orange-600 text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-orange-700"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg bg-white border border-slate-200 text-slate-600 text-xs px-2.5 py-1.5 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  editingId !== category._id && (
                    <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2.5">
                      <button
                        onClick={() => handleStartEdit(category)}
                        className="rounded-lg p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(category._id)}
                        className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-slate-400">
              No categories match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Categories;
