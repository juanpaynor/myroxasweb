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
  UserCheck,
  UserX,
  Save,
  X,
  Building2,
  FolderKanban,
  Shield,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type DepartmentUser = {
  id: string;
  user_id: string;
  department_id: string;
  role: string;
  is_active: boolean;
  assigned_at: string;
  assigned_by: string | null;
  user?: {
    full_name: string;
    email: string;
  };
  department?: {
    name: string;
    color: string;
    icon: string;
  };
};

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

type Department = {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_active: boolean;
};

export default function AdminDepartmentUsers() {
  const router = useRouter();
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<DepartmentUser | null>(null);
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    department_id: '',
    role: 'staff',
    is_active: true
  });

  // Filter state
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchCurrentUser();
    fetchDepartmentUsers();
    fetchUsers();
    fetchDepartments();
  }, []);

  async function fetchCurrentUser() {
    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }

  async function fetchDepartmentUsers() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('department_users')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      // Fetch related user and department data
      const enrichedData = await Promise.all(
        (data || []).map(async (du) => {
          const { data: userData } = await client
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', du.user_id)
            .single();

          const { data: deptData } = await client
            .from('departments')
            .select('name, color, icon')
            .eq('id', du.department_id)
            .single();

          return {
            ...du,
            user: userData || { full_name: 'Unknown', email: '' },
            department: deptData || { name: 'Unknown', color: '#3B82F6', icon: 'briefcase' }
          };
        })
      );

      setDepartmentUsers(enrichedData);
    } catch (error) {
      console.error('Error fetching department users:', error);
      setMessage('Error loading department users');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('user_profiles')
        .select('id, full_name, email, role')
        .in('role', ['admin', 'csm', 'department'])
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  async function fetchDepartments() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('departments')
        .select('id, name, color, icon, is_active')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }

  function openCreateModal() {
    setEditingAssignment(null);
    setFormData({
      user_id: '',
      department_id: '',
      role: 'staff',
      is_active: true
    });
    setShowModal(true);
    setMessage('');
  }

  function openEditModal(assignment: DepartmentUser) {
    setEditingAssignment(assignment);
    setFormData({
      user_id: assignment.user_id,
      department_id: assignment.department_id,
      role: assignment.role,
      is_active: assignment.is_active
    });
    setShowModal(true);
    setMessage('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    try {
      const client = await supabase;

      if (editingAssignment) {
        // Update existing assignment
        const { error } = await client
          .from('department_users')
          .update({
            role: formData.role,
            is_active: formData.is_active
          })
          .eq('id', editingAssignment.id);

        if (error) throw error;
        setMessage('Assignment updated successfully');
      } else {
        // Check if user is already assigned to this department
        const { data: existing } = await client
          .from('department_users')
          .select('id')
          .eq('user_id', formData.user_id)
          .eq('department_id', formData.department_id)
          .single();

        if (existing) {
          setMessage('Error: User is already assigned to this department');
          return;
        }

        // Create new assignment
        const { error } = await client
          .from('department_users')
          .insert([{
            user_id: formData.user_id,
            department_id: formData.department_id,
            role: formData.role,
            is_active: formData.is_active,
            assigned_by: currentUserId
          }]);

        if (error) throw error;
        setMessage('User assigned to department successfully');
      }

      setShowModal(false);
      fetchDepartmentUsers();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    }
  }

  async function handleToggleActive(assignment: DepartmentUser) {
    try {
      const client = await supabase;
      const { error } = await client
        .from('department_users')
        .update({ is_active: !assignment.is_active })
        .eq('id', assignment.id);

      if (error) throw error;
      fetchDepartmentUsers();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    }
  }

  async function handleDelete(assignment: DepartmentUser) {
    if (!confirm(`Remove ${assignment.user?.full_name} from ${assignment.department?.name}?`)) {
      return;
    }

    try {
      const client = await supabase;
      const { error } = await client
        .from('department_users')
        .delete()
        .eq('id', assignment.id);

      if (error) throw error;
      setMessage('Assignment removed successfully');
      fetchDepartmentUsers();
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

  function getIconEmoji(icon: string): string {
    const iconMap: Record<string, string> = {
      'briefcase': '💼',
      'building': '🏢',
      'wrench': '🔧',
      'medical': '🏥',
      'shield': '🛡️',
      'truck': '🚚',
      'tree': '🌳',
      'lightbulb': '💡'
    };
    return iconMap[icon] || '💼';
  }

  // Apply filters
  const filteredAssignments = departmentUsers.filter(assignment => {
    if (filterDepartment !== 'all' && assignment.department_id !== filterDepartment) return false;
    if (filterRole !== 'all' && assignment.role !== filterRole) return false;
    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      if (assignment.is_active !== isActive) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading department assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-12">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <h1 className="text-base sm:text-xl md:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                MyRoxas <span className="hidden sm:inline">Admin</span>
              </h1>
            </div>

            {/* Nav Links */}
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
              <Link href="/admin/department-users">
                <div className="flex items-center px-2 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 font-medium whitespace-nowrap">
                  <Shield className="w-4 h-4 mr-1.5" />
                  <span className="hidden lg:inline text-sm">Dept. Staff</span>
                </div>
              </Link>
              <Link href="/admin/announcements">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
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

            {/* Right Side Icons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button className="hidden sm:flex relative p-1.5 sm:p-1.5 text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-1.5 text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-full transition-colors"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:bg-gray-700">Department Assignments ({filteredAssignments.length})</h2>
            <p className="text-gray-600">Manage department staff and roles</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            Assign User
          </button>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Department
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
              >
                <option value="all">All Roles</option>
                <option value="head">Department Head</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        {filteredAssignments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700 dark:border-gray-700">
            <Shield className="w-16 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:bg-gray-700 mb-2">No Assignments</h3>
            <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-6">Start by assigning users to departments</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Assign User
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Assigned</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssignments.map((assignment) => (
                  <motion.tr
                    key={assignment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 transition-colors ${
                      !assignment.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900 dark:bg-gray-700">{assignment.user?.full_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{assignment.user?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:bg-gray-700">{assignment.department?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        assignment.role === 'head' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {assignment.role === 'head' ? 'Department Head' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(assignment)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          assignment.is_active 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {assignment.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
                      {new Date(assignment.assigned_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(assignment)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(assignment)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:bg-gray-700">
                {editingAssignment ? 'Edit Assignment' : 'Assign User to Department'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  User *
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  required
                  disabled={!!editingAssignment}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all disabled:bg-gray-100"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  required
                  disabled={!!editingAssignment}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all disabled:bg-gray-100"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                >
                  <option value="staff">Staff</option>
                  <option value="head">Department Head</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-2">
                  Department Heads can manage all reports in their department
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-200"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                  Active (user can access department reports)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  {editingAssignment ? 'Update' : 'Assign'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
