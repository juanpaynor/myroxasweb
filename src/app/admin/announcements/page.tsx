'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
  User,
  LogOut,
  Image as ImageIcon,
  Search,
  Filter,
  Star,
  Calendar,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import QuillEditor from '@/components/QuillEditor';

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category_id: string;
  featured_image_url: string | null;
  author: string;
  published_at: string;
  is_published: boolean;
  is_featured: boolean;
  priority: number;
  view_count: number;
  created_at: string;
  category?: Category;
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    featured_image_url: '',
    author: 'Roxas City Government',
    is_published: true,
    is_featured: false,
    priority: 5
  });

  useEffect(() => {
    checkAuth();
    fetchCategories();
    fetchAnnouncements();
  }, []);

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
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/login/admin');
        return;
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login/admin');
    }
  }

  async function fetchCategories() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('announcement_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  }

  async function fetchAnnouncements() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('announcements')
        .select(`
          *,
          category:announcement_categories(id, name, slug, icon, color)
        `)
        .order('is_featured', { ascending: false })
        .order('priority', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category_id: categories[0]?.id || '',
      featured_image_url: '',
      author: 'Roxas City Government',
      is_published: true,
      is_featured: false,
      priority: 5
    });
    setShowModal(true);
  }

  function openEditModal(announcement: Announcement) {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      excerpt: announcement.excerpt,
      category_id: announcement.category_id,
      featured_image_url: announcement.featured_image_url || '',
      author: announcement.author,
      is_published: announcement.is_published,
      is_featured: announcement.is_featured,
      priority: announcement.priority
    });
    setShowModal(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    setUploadingImage(true);
    try {
      const client = await supabase;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await client.storage
        .from('announcement-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = client.storage
        .from('announcement-images')
        .getPublicUrl(fileName);

      setFormData({ ...formData, featured_image_url: urlData.publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }

  // Handler for images uploaded within the rich text editor
  async function handleContentImageUpload(file: File): Promise<string> {
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Image must be less than 2MB');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const client = await supabase;
    const fileExt = file.name.split('.').pop();
    const fileName = `content-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await client.storage
      .from('announcement-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = client.storage
      .from('announcement-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.excerpt || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const client = await supabase;

      const payload = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        category_id: formData.category_id,
        featured_image_url: formData.featured_image_url || null,
        author: formData.author,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        priority: formData.priority,
        published_at: formData.is_published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      if (editingAnnouncement) {
        const { error } = await client
          .from('announcements')
          .update(payload)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        toast.success('Announcement updated successfully');
      } else {
        const { error } = await client
          .from('announcements')
          .insert([payload]);

        if (error) throw error;
        toast.success('Announcement created successfully');
      }

      setShowModal(false);
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast.error(error.message || 'Failed to save announcement');
    }
  }

  async function handleDelete(announcementId: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const client = await supabase;
      const { error } = await client
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast.error(error.message || 'Failed to delete announcement');
    }
  }

  async function handleTogglePublish(announcementId: string, currentStatus: boolean) {
    try {
      const client = await supabase;
      const { error } = await client
        .from('announcements')
        .update({ 
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', announcementId);

      if (error) throw error;
      toast.success(`Announcement ${!currentStatus ? 'published' : 'unpublished'}`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Failed to update announcement');
    }
  }

  async function handleToggleFeatured(announcementId: string, currentStatus: boolean) {
    try {
      const client = await supabase;
      const { error } = await client
        .from('announcements')
        .update({ is_featured: !currentStatus })
        .eq('id', announcementId);

      if (error) throw error;
      toast.success(`Announcement ${!currentStatus ? 'featured' : 'unfeatured'}`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update announcement');
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

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || announcement.category_id === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && announcement.is_published) ||
                         (filterStatus === 'draft' && !announcement.is_published);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center flex-shrink-0">
              <h1 className="text-base sm:text-xl md:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                MyRoxas <span className="hidden sm:inline">Admin</span>
              </h1>
            </div>

            <div className="flex items-center space-x-0.5 overflow-x-auto">
              <Link href="/admin/dashboard">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Dashboard</span>
                </div>
              </Link>
              <Link href="/admin/reports">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <FileText className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Reports</span>
                </div>
              </Link>
              <Link href="/admin/users">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <Users className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Users</span>
                </div>
              </Link>
              <Link href="/admin/categories">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <FolderKanban className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Categories</span>
                </div>
              </Link>
              <Link href="/admin/departments">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <Building2 className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Departments</span>
                </div>
              </Link>
              <Link href="/admin/announcements">
                <div className="flex items-center px-2 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 font-medium whitespace-nowrap">
                  <Megaphone className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">News</span>
                </div>
              </Link>
              <Link href="/admin/support-faqs">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">FAQs</span>
                </div>
              </Link>
              <Link href="/admin/settings">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <Settings className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Settings</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <ThemeToggle />
              <button className="hidden sm:flex relative p-1.5 sm:p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg p-0.5 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    A
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
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                      >
                        <button
                          onClick={() => setShowSettingsDropdown(false)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => setShowSettingsDropdown(false)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 flex items-center gap-2"
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
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:bg-gray-700">Announcements ({filteredAnnouncements.length})</h2>
            <p className="text-gray-600">Manage news and announcements for the mobile app</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/announcement-categories">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 font-medium">
                Manage Categories
              </button>
            </Link>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create Announcement
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search announcements..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 dark:border-gray-700">
            <Megaphone className="w-16 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:bg-gray-700 mb-2">No announcements yet</h3>
            <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-4">Create your first announcement to get started</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus className="w-4 h-4" />
              Create Announcement
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-4">
                  {announcement.featured_image_url && (
                    <div className="w-32 h-32 flex-shrink-0">
                      <img
                        src={announcement.featured_image_url}
                        alt={announcement.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {announcement.is_featured && (
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          )}
                          <h3 className="text-xl font-semibold text-gray-900 dark:bg-gray-700">{announcement.title}</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 text-sm mb-3">{announcement.excerpt}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {announcement.category && (
                            <span 
                              className="px-3 py-1 rounded-full text-white font-medium"
                              style={{ backgroundColor: announcement.category.color }}
                            >
                              {announcement.category.icon} {announcement.category.name}
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            announcement.is_published 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 text-gray-700'
                          }`}>
                            {announcement.is_published ? 'Published' : 'Draft'}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(announcement.published_at).toLocaleDateString()}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400 flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {announcement.view_count} views
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">
                            Priority: {announcement.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleToggleFeatured(announcement.id, announcement.is_featured)}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                      announcement.is_featured
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${announcement.is_featured ? 'fill-yellow-700' : ''}`} />
                    {announcement.is_featured ? 'Featured' : 'Feature'}
                  </button>
                  <button
                    onClick={() => handleTogglePublish(announcement.id, announcement.is_published)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 flex items-center gap-2 text-sm"
                  >
                    {announcement.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {announcement.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => openEditModal(announcement)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:bg-gray-700">
                      {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                      placeholder="Enter announcement title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excerpt (Short Summary) *
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={2}
                      maxLength={200}
                      placeholder="Brief summary for list view (max 200 characters)..."
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{formData.excerpt.length}/200 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <QuillEditor
                        value={formData.content}
                        onChange={(value: string) => setFormData({ ...formData, content: value })}
                        placeholder="Write your announcement content here..."
                        onImageUpload={handleContentImageUpload}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority (0-10)
                      </label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="0"
                        max="10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Featured Image
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled={uploadingImage}
                      />
                      {uploadingImage && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                          Uploading...
                        </div>
                      )}
                    </div>
                    {formData.featured_image_url && (
                      <div className="mt-3 relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={formData.featured_image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, featured_image_url: '' })}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">Max size: 2MB. Recommended: 1200x630px (16:9)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Author
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Published</span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Featured (Pin to Top)</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 dark:border-gray-700 -mx-6 -mb-6 px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 font-medium flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {editingAnnouncement ? 'Update' : 'Create'} Announcement
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
