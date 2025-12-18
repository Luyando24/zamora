'use client';

import { useState } from 'react';
import { useMenuCategories } from '@/hooks/useMenuCategories';
import Modal from '@/components/ui/Modal';
import { Plus, Trash2, Settings, Loader2 } from 'lucide-react';
import { useProperty } from '../../context/PropertyContext';

export default function CategoryManager() {
  const [isOpen, setIsOpen] = useState(false);
  // Independent categories
  const { selectedPropertyId } = useProperty();
  const { categories, loading, addCategory, deleteCategory } = useMenuCategories(selectedPropertyId);
  const [newCategory, setNewCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setSubmitting(true);
    const { error } = await addCategory(newCategory.trim());
    setSubmitting(false);

    if (error) {
      alert('Failed to add category: ' + error.message);
    } else {
      setNewCategory('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? Items in this category will remain but the category filter may break.')) return;
    const { error } = await deleteCategory(id);
    if (error) alert('Failed to delete: ' + error.message);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
      >
        <Settings size={18} /> Manage Categories
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Manage Menu Categories"
      >
        <div className="space-y-6">
          {/* Add New Form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              placeholder="New Category Name"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !newCategory.trim()}
              className="bg-zambia-green text-white px-4 py-2 rounded-md hover:bg-zambia-green/90 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            </button>
          </form>

          {/* List */}
          <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : categories.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No categories found.</div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                  <span className="text-gray-900 font-medium">{cat.name}</span>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded"
                    title="Delete Category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Note: Deleting a category does not delete the menu items associated with it.
          </div>
        </div>
      </Modal>
    </>
  );
}
