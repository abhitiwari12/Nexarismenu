import React, { useState, useEffect } from 'react';
import { FolderPlus, Pencil, Trash2, FolderTree, AlertCircle, Check, X, Sparkles, BookOpen } from 'lucide-react';
import { Category, MenuItem, UniversalCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { createCategoryApi, updateCategoryApi, deleteCategoryApi, getUniversalCategoriesApi, adoptUniversalCategoryApi } from '../services/api';

interface CategoryManagerProps {
  categories: Category[];
  items: MenuItem[];
  onRefresh: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  items,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [displayCategories, setDisplayCategories] = useState<Category[]>(categories);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Synchronize local display state with parent categories prop when refreshed from server
  useEffect(() => {
    setDisplayCategories(categories);
  }, [categories]);

  // Universal Categories preset states
  const [universalCategories, setUniversalCategories] = useState<UniversalCategory[]>([]);
  const [showPresetDrawer, setShowPresetDrawer] = useState(false);
  const [adoptingPresetId, setAdoptingPresetId] = useState<string | null>(null);

  useEffect(() => {
    getUniversalCategoriesApi()
      .then((data) => setUniversalCategories(data))
      .catch(() => {});
  }, []);

  const handleAdoptUniversalCat = async (uCatId: string) => {
    const uCat = universalCategories.find((c) => c.id === uCatId);
    if (!uCat || !user) return;

    const tempId = `temp_ucat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const optimisticCat: Category = {
      id: tempId,
      user_id: user.id,
      universal_category_id: uCat.id,
      name: uCat.name,
      created_at: new Date().toISOString(),
    };

    const previousCategories = displayCategories;
    setDisplayCategories((prev) => [...prev, optimisticCat]);
    setAdoptingPresetId(uCatId);
    setError(null);

    try {
      await adoptUniversalCategoryApi(uCatId);
      onRefresh();
    } catch (err: any) {
      setDisplayCategories(previousCategories);
      setError(err.message || 'Failed to adopt preset category');
    } finally {
      setAdoptingPresetId(null);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCatName.trim();
    if (!trimmedName || !user) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const optimisticCat: Category = {
      id: tempId,
      user_id: user.id,
      name: trimmedName,
      created_at: new Date().toISOString(),
    };

    const previousCategories = displayCategories;
    // Optimistic UI update
    setDisplayCategories((prev) => [...prev, optimisticCat]);
    setNewCatName('');
    setError(null);

    try {
      await createCategoryApi(trimmedName);
      onRefresh();
    } catch (err: any) {
      // Rollback on failure
      setDisplayCategories(previousCategories);
      setNewCatName(trimmedName);
      setError(err.message || 'Failed to add category.');
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = async (catId: string) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) return;

    const previousCategories = displayCategories;
    // Optimistic UI update
    setDisplayCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, name: trimmedName } : c))
    );
    setEditingId(null);
    setError(null);

    try {
      await updateCategoryApi(catId, trimmedName);
      onRefresh();
    } catch (err: any) {
      // Rollback on failure
      setDisplayCategories(previousCategories);
      setError(err.message || 'Failed to update category.');
    }
  };

  const handleDelete = async (catId: string) => {
    if (!user) return;

    const previousCategories = displayCategories;
    // Optimistic UI update
    setDisplayCategories((prev) => prev.filter((c) => c.id !== catId));
    setDeletingId(null);
    setError(null);

    try {
      await deleteCategoryApi(catId);
      onRefresh();
    } catch (err: any) {
      // Rollback on failure
      setDisplayCategories(previousCategories);
      setError(err.message || 'Failed to delete category.');
    }
  };

  const getItemCount = (catId: string) => {
    return items.filter((i) => i.category_id === catId).length;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Category Management</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Group your dishes into structured sections for customer scanning.
          </p>
        </div>
        <button
          onClick={() => setShowPresetDrawer(!showPresetDrawer)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-sm font-medium transition"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{showPresetDrawer ? 'Hide Preset Catalog' : 'Browse Universal Presets'}</span>
        </button>
      </div>

      {showPresetDrawer && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 rounded-2xl p-5 border border-indigo-200/60 dark:border-indigo-800/60 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Universal Category Catalog</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">1-click import into your menu</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
            {universalCategories.map((uCat) => {
              const alreadyExists = displayCategories.some(
                (c) => c.name.toLowerCase().trim() === uCat.name.toLowerCase().trim()
              );
              const isAdopting = adoptingPresetId === uCat.id;

              return (
                <div
                  key={uCat.id}
                  className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{uCat.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{uCat.description}</p>
                  </div>
                  <button
                    onClick={() => handleAdoptUniversalCat(uCat.id)}
                    disabled={alreadyExists || isAdopting}
                    className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      alreadyExists
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-xs'
                    }`}
                  >
                    {alreadyExists ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Added</span>
                      </>
                    ) : isAdopting ? (
                      <span>Adding...</span>
                    ) : (
                      <>
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Add Category</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Category Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="New Category Name (e.g. Italian Pizzas, Craft Cocktails)..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!newCatName.trim() || submitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-sm disabled:opacity-50 transition"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </form>
      </div>

      {/* Category List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Categories ({displayCategories.length})
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">Assigned Menu Items</span>
        </div>

        {displayCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <FolderTree className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No categories created yet.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Use the form above to create your first category.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayCategories.map((cat) => {
              const count = getItemCount(cat.id);
              const isEditing = editingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={submitting}
                        className="p-1.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {cat.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{count} dishes assigned</span>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                        title="Edit category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(cat.id)}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Category?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Deleting this category will also delete all <strong className="text-slate-800 dark:text-slate-200">{getItemCount(deletingId)}</strong> menu items assigned to it. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
              >
                Yes, Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
