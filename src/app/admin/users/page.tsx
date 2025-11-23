'use client';

import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Bell,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserCog,
  FolderKanban,
  Building2,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';

type UserProfile = {
  id: string
  email: string
  role: string
  full_name: string | null
  created_at: string
}

export default function AdminUsers() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [sortField, setSortField] = useState<'full_name' | 'email' | 'role' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchUsers();
  }, [filterRole, searchQuery, sortField, sortDirection]);

  async function fetchUsers() {
    try {
      const client = await supabase;
      let query = client
        .from('user_profiles')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      // Apply role filter
      if (filterRole !== 'All') {
        query = query.eq('role', filterRole.toLowerCase());
      }

      // Apply search query
      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(field: 'full_name' | 'email' | 'role' | 'created_at') {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function SortIcon({ field }: { field: 'full_name' | 'email' | 'role' | 'created_at' }) {
    if (sortField !== field) {
      return <span className="ml-1 text-gray-400">⇅</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  }

  function handleDeleteUser(user: UserProfile) {
    setUserToDelete(user);
    setShowDeleteModal(true);
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

  function getRoleIcon(role: string) {
    switch (role) {
      case 'admin':
        return <Shield className="w-5 h-5 text-orange-600" />;
      case 'csm':
        return <UserCog className="w-5 h-5 text-blue-600" />;
      case 'department':
        return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 'citizen':
        return <UserCheck className="w-5 h-5 text-green-600" />;
      default:
        return <Users className="w-5 h-5 text-gray-600" />;
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'admin':
        return 'bg-orange-100 text-orange-800';
      case 'csm':
        return 'bg-blue-100 text-blue-800';
      case 'department':
        return 'bg-indigo-100 text-indigo-800';
      case 'citizen':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 text-gray-800';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                MyRoxas Admin
              </h1>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-0.5">
              <Link href="/admin/dashboard">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 font-medium transition-colors">
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
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-medium">
                  <Users className="w-4 h-4 mr-1.5" />
                  Users
                </div>
              </Link>
              <Link href="/admin/categories">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
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

            {/* Right Side Icons */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button className="relative p-1.5 text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:bg-gray-700:text-white hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:bg-gray-700:text-white hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:bg-gray-700 mb-2">User Management</h2>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-400">Manage user accounts and roles</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create User
            </button>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 dark:border-gray-700 dark:border-gray-700 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Role Filter */}
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:bg-gray-700 cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="admin">Admin</option>
                <option value="csm">CSM</option>
                <option value="department">Department</option>
                <option value="citizen">Citizen</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 dark:border-gray-700 dark:border-gray-700 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-900">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('full_name')}
                  >
                    <div className="flex items-center">
                      User
                      <SortIcon field="full_name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      <SortIcon field="email" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      Role
                      <SortIcon field="role" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Created
                      <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold mr-3">
                            {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:bg-gray-700">
                            {user.full_name || 'No name'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete user"
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
        </motion.div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}

      {/* Delete User Modal */}
      {showDeleteModal && userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onSuccess={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

// Create User Modal Component
function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('citizen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use API route - this won't affect the browser session at all
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role })
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to create user');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:bg-gray-700 mb-6">Create New User</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="user@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              disabled={loading}
            >
              <option value="citizen">Citizen</option>
              <option value="csm">CSM</option>
              <option value="department">Department</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Delete User Modal Component
function DeleteUserModal({ 
  user, 
  onClose, 
  onSuccess 
}: { 
  user: UserProfile; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const client = await supabase;

      // Verify admin password first
      const { data: { user: adminUser } } = await client.auth.getUser();
      
      if (!adminUser) {
        throw new Error('Not authenticated');
      }

      // Get admin email
      const { data: adminProfile } = await client
        .from('user_profiles')
        .select('email')
        .eq('id', adminUser.id)
        .single();

      if (!adminProfile) {
        throw new Error('Admin profile not found');
      }

      // Verify password by attempting to sign in
      const { error: passwordError } = await client.auth.signInWithPassword({
        email: adminProfile.email,
        password: adminPassword,
      });

      if (passwordError) {
        throw new Error('Incorrect password');
      }

      // Check if user has any assigned reports
      const { data: assignedReports, error: checkError } = await client
        .from('reports')
        .select('id')
        .eq('assigned_to', user.id)
        .limit(1);

      if (checkError) throw checkError;

      if (assignedReports && assignedReports.length > 0) {
        throw new Error('Cannot delete this user. They have reports assigned to them. Please reassign those reports first.');
      }

      // Check if user is a department head
      const { data: departmentHead, error: deptHeadError } = await client
        .from('departments')
        .select('id, name')
        .eq('department_head_id', user.id)
        .limit(1)
        .single();

      if (deptHeadError && deptHeadError.code !== 'PGRST116') throw deptHeadError;

      if (departmentHead) {
        throw new Error(`Cannot delete this user. They are the department head of "${departmentHead.name}". Please assign a new department head first.`);
      }

      // Call the database function to delete from auth.users
      const { error: deleteError } = await client.rpc('delete_auth_user', {
        user_id: user.id
      });

      if (deleteError) throw deleteError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:bg-gray-700 mb-2">Delete User</h3>
          <p className="text-gray-600">
            Are you sure you want to permanently delete this user?
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-1">User to be deleted:</p>
          <p className="text-lg font-bold text-gray-900 dark:bg-gray-700">{user.full_name || 'N/A'}</p>
          <p className="text-sm text-gray-600">{user.email}</p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
            user.role === 'admin' ? 'bg-orange-100 text-orange-800' :
            user.role === 'csm' ? 'bg-blue-100 text-blue-800' :
            user.role === 'department' ? 'bg-indigo-100 text-indigo-800' :
            'bg-green-100 text-green-800'
          }`}>
            {user.role.toUpperCase()}
          </span>
        </div>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter your admin password to confirm
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
              placeholder="Your password"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ Warning:</strong> This action cannot be undone. The user and all their data will be permanently deleted.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !adminPassword}
              className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
