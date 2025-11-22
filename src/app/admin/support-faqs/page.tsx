'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Bell,
  Building2,
  Shield,
  User,
  LogOut,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  X,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';

type FAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  view_count: number;
  helpful_count: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string;
};

const CATEGORIES = [
  { value: 'appointments', label: 'Appointments' },
  { value: 'reports', label: 'Reports' },
  { value: 'services', label: 'Services' },
  { value: 'general', label: 'General' }
];

export default function AdminSupportFAQs() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaqs, setSelectedFaqs] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    category: 'general',
    question: '',
    answer: '',
    keywords: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterFaqs();
  }, [faqs, selectedCategory, selectedStatus, searchQuery]);

  async function checkAuth() {
    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();

      if (!user) {
        router.push('/login/admin');
        return;
      }

      const { data: profile } = await client
        .from('user_profiles')
        .select('id, full_name, email, role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/login/admin');
        return;
      }

      setAdminProfile(profile);
      await fetchFAQs();
      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login/admin');
    }
  }

  async function fetchFAQs() {
    try {
      const response = await fetch('/api/admin/support/faqs');
      if (response.ok) {
        const data = await response.json();
        setFaqs(data);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setMessage('Failed to load FAQs');
    }
  }

  function filterFaqs() {
    let filtered = [...faqs];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      const isActive = selectedStatus === 'active';
      filtered = filtered.filter(faq => faq.is_active === isActive);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.keywords.some(k => k.toLowerCase().includes(query))
      );
    }

    setFilteredFaqs(filtered);
  }

  function openAddModal() {
    setEditingFaq(null);
    setFormData({
      category: 'general',
      question: '',
      answer: '',
      keywords: '',
      display_order: 0,
      is_active: true
    });
    setShowModal(true);
  }

  function openEditModal(faq: FAQ) {
    setEditingFaq(faq);
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords.join(', '),
      display_order: faq.display_order,
      is_active: faq.is_active
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const payload = {
        category: formData.category,
        question: formData.question,
        answer: formData.answer,
        keywords: keywordsArray,
        display_order: formData.display_order,
        is_active: formData.is_active
      };

      const url = editingFaq 
        ? `/api/admin/support/faqs/${editingFaq.id}`
        : '/api/admin/support/faqs';
      
      const method = editingFaq ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage(editingFaq ? 'FAQ updated successfully!' : 'FAQ created successfully!');
        setShowModal(false);
        await fetchFAQs();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to save FAQ');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      setMessage('Failed to save FAQ');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/support/faqs/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage('FAQ deleted successfully!');
        await fetchFAQs();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to delete FAQ');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      setMessage('Failed to delete FAQ');
    }
  }

  async function handleBulkUpdate(isActive: boolean) {
    if (selectedFaqs.length === 0) {
      setMessage('Please select FAQs to update');
      return;
    }

    try {
      const response = await fetch('/api/admin/support/faqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedFaqs, is_active: isActive })
      });

      if (response.ok) {
        setMessage(`${selectedFaqs.length} FAQ(s) ${isActive ? 'activated' : 'deactivated'}!`);
        setSelectedFaqs([]);
        await fetchFAQs();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update FAQs');
      }
    } catch (error) {
      console.error('Error bulk updating FAQs:', error);
      setMessage('Failed to update FAQs');
    }
  }

  function toggleSelectFaq(id: string) {
    setSelectedFaqs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedFaqs.length === filteredFaqs.length) {
      setSelectedFaqs([]);
    } else {
      setSelectedFaqs(filteredFaqs.map(f => f.id));
    }
  }

  async function handleLogout() {
    const client = await supabase;
    await client.auth.signOut();
    router.push('/login/admin');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="flex items-center">
                <div className="w-7 h-7 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-2">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Admin
                </span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-0.5">
                <Link href="/admin/dashboard">
                  <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </div>
                </Link>
                <Link href="/admin/reports">
                  <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                    <FileText className="w-4 h-4 mr-1.5" />
                    Reports
                  </div>
                </Link>
                <Link href="/admin/users">
                  <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                    <Users className="w-4 h-4 mr-1.5" />
                    Users
                  </div>
                </Link>
                <Link href="/admin/departments">
                  <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                    <Building2 className="w-4 h-4 mr-1.5" />
                    Departments
                  </div>
                </Link>
                <Link href="/admin/department-users">
                  <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
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
                  <div className="flex items-center px-2 py-1.5 rounded-md bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium text-sm transition-colors">
                    <MessageSquare className="w-4 h-4 mr-1.5" />
                    Support FAQs
                  </div>
                </Link>
                <Link href="/admin/settings">
                  <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                    <Settings className="w-4 h-4 mr-1.5" />
                    Settings
                  </div>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button className="relative p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-0.5 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {adminProfile?.full_name ? adminProfile.full_name[0].toUpperCase() : 'A'}
                  </div>
                </button>
                
                <AnimatePresence>
                  {showSettingsDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowSettingsDropdown(false)}
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                      >
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {adminProfile?.full_name || 'Admin'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{adminProfile?.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            handleLogout();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Support FAQs</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage AI knowledge base for chat support</p>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              message.includes('success') || message.includes('activated') || message.includes('deactivated')
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search questions, answers, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 outline-none"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 outline-none"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <button
              onClick={openAddModal}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Add FAQ
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedFaqs.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFaqs.length} selected
              </span>
              <button
                onClick={() => handleBulkUpdate(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Activate
              </button>
              <button
                onClick={() => handleBulkUpdate(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Deactivate
              </button>
              <button
                onClick={() => setSelectedFaqs([])}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* FAQs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFaqs.length === filteredFaqs.length && filteredFaqs.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFaqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No FAQs found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' 
                          ? 'Try adjusting your filters'
                          : 'Click "Add FAQ" to create your first FAQ'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredFaqs.map(faq => (
                    <tr key={faq.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedFaqs.includes(faq.id)}
                          onChange={() => toggleSelectFaq(faq.id)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 capitalize">
                          {faq.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {faq.question}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {faq.keywords.length > 0 && `Keywords: ${faq.keywords.join(', ')}`}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          faq.is_active 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                        }`}>
                          {faq.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {faq.view_count}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(faq)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(faq.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total FAQs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{faqs.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {faqs.filter(f => f.is_active).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {faqs.filter(f => !f.is_active).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {faqs.reduce((sum, f) => sum + f.view_count, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold">
                    {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 outline-none"
                      required
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question *
                    </label>
                    <input
                      type="text"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 outline-none"
                      placeholder="How do I book an appointment?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Answer *
                    </label>
                    <textarea
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 outline-none resize-none"
                      placeholder="To book an appointment..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 outline-none"
                      placeholder="book, appointment, schedule, reservation"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Help AI match questions with keywords
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 outline-none"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <label className="flex items-center mt-3">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                      {editingFaq ? 'Update FAQ' : 'Create FAQ'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
