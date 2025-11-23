'use client';

import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Users,
  Settings, 
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  FolderKanban,
  Building2,
  Shield,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getIconEmoji, availableIcons, recommendedColors } from '@/lib/icons';

type Category = {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export default function AdminCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState('');
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('construction');
  const [formColor, setFormColor] = useState('#3B82F6');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('report_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setMessage('Error loading categories');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormIcon('construction');
    setFormColor('#3B82F6');
    setFormDisplayOrder(categories.length + 1);
    setFormIsActive(true);
    setShowModal(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormIcon(category.icon);
    setFormColor(category.color);
    setFormDisplayOrder(category.display_order);
    setFormIsActive(category.is_active);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCategory(null);
    setMessage('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    try {
      const client = await supabase;

      if (editingCategory) {
        // Update existing category
        const { error } = await client
          .from('report_categories')
          .update({
            name: formName,
            description: formDescription || null,
            icon: formIcon,
            color: formColor,
            display_order: formDisplayOrder,
            is_active: formIsActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        setMessage('Category updated successfully');
      } else {
        // Create new category
        const { error } = await client
          .from('report_categories')
          .insert({
            name: formName,
            description: formDescription || null,
            icon: formIcon,
            color: formColor,
            display_order: formDisplayOrder,
            is_active: formIsActive
          });

        if (error) throw error;
        setMessage('Category created successfully');
      }

      fetchCategories();
      closeModal();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    }
  }

  async function handleToggleActive(category: Category) {
    try {
      const client = await supabase;
      const { error } = await client
        .from('report_categories')
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', category.id);

      if (error) throw error;
      setMessage(`Category ${!category.is_active ? 'activated' : 'deactivated'}`);
      fetchCategories();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const client = await supabase;
      
      // Check if any reports use this category
      const { data: reports, error: checkError } = await client
        .from('reports')
        .select('id')
        .eq('category_id', category.id)
        .limit(1);

      if (checkError) throw checkError;

      if (reports && reports.length > 0) {
        setMessage('Cannot delete: This category has existing reports. Consider deactivating instead.');
        return;
      }

      const { error } = await client
        .from('report_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;
      setMessage('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    }
  }

  async function handleLogout() {
    try {
      const client = await supabase;
      await client.auth.signOut();
      router.push('/login/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                MyRoxas Admin
              </h1>
            </div>

            <div className="hidden md:flex items-center space-x-0.5">
              <Link href="/admin/dashboard">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </div>
              </Link>
              <Link href="/admin/reports">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <FileText className="w-4 h-4 mr-1.5" />
                  Reports
                </div>
              </Link>
              <Link href="/admin/users">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <Users className="w-4 h-4 mr-1.5" />
                  Users
                </div>
              </Link>
              <Link href="/admin/categories">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm bg-yellow-50 text-yellow-700 font-medium">
                  <FolderKanban className="w-4 h-4 mr-1.5" />
                  Categories
                </div>
              </Link>
              <Link href="/admin/departments">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <Building2 className="w-4 h-4 mr-1.5" />
                  Departments
                </div>
              </Link>
              <Link href="/admin/department-users">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <Shield className="w-4 h-4 mr-1.5" />
                  Dept. Staff
                </div>
              </Link>
              <Link href="/admin/announcements">
                <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                  <Megaphone className="w-4 h-4 mr-1.5" />
                  Announcements
                </div>
              </Link>
              <Link href="/admin/support-faqs">
                <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Support FAQs
                </div>
              </Link>
              <Link href="/admin/settings">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <Settings className="w-4 h-4 mr-1.5" />
                  Settings
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <button className="relative p-1.5 text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
              >
                Logout
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          className="mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:bg-gray-700 mb-2">Report Categories</h2>
            <p className="text-gray-600">Manage categories for citizen reports (changes sync to mobile app instantly)</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            className={`mb-6 p-4 rounded-xl ${
              message.includes('Error') || message.includes('Cannot') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message}
          </motion.div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 dark:text-gray-400">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 dark:text-gray-400">No categories found</div>
          ) : (
            categories.map((category, index) => (
              <motion.div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 dark:border-gray-700 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {getIconEmoji(category.icon)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:bg-gray-700">{category.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Order: {category.display_order}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        category.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={category.is_active ? 'Active' : 'Inactive'}
                    >
                      {category.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-4 line-clamp-2">{category.description}</p>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div 
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.color}
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 text-gray-700">
                    {category.icon}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(category)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:bg-gray-700">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Traffic & Transportation"
                  maxLength={50}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icon *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableIcons.map((icon) => (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => setFormIcon(icon.name)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formIcon === icon.name
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{icon.emoji}</div>
                      <div className="text-xs font-medium text-gray-700">{icon.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{icon.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color *
                </label>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {recommendedColors.map((colorOption) => (
                    <button
                      key={colorOption.hex}
                      type="button"
                      onClick={() => setFormColor(colorOption.hex)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        formColor === colorOption.hex
                          ? 'border-yellow-500 ring-2 ring-yellow-200'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: colorOption.hex + '20' }}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg mx-auto mb-1"
                        style={{ backgroundColor: colorOption.hex }}
                      ></div>
                      <div className="text-xs font-medium text-gray-700">{colorOption.name}</div>
                    </button>
                  ))}
                </div>
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-full h-12 rounded-xl border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Display Order *
                  </label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value))}
                    min="0"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex items-center h-12">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Active (visible in mobile app)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md"
                >
                  <Save className="w-5 h-5" />
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
