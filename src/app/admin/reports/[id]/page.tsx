'use client';

import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Users,
  Settings, 
  Bell,
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  Send,
  Clock,
  Edit,
  Save,
  X,
  FolderKanban,
  Building2,
  Shield,
  Megaphone
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getIconEmoji } from '@/lib/icons';

type Report = {
  id: string
  title: string
  description: string
  location_address: string | null
  location_lat: number | null
  location_lng: number | null
  status: string
  urgency: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  assigned_to: string | null
  admin_notes: string | null
  citizen_id: string
  category_id: string
  department_id: string | null
  assigned_to_department_at: string | null
  category: {
    id: string
    name: string
    icon: string
  }
  citizen: {
    full_name: string
    email: string
  }
  department?: {
    id: string
    name: string
  } | null
}

type Comment = {
  id: string
  comment: string
  is_admin: boolean
  created_at: string
  user_id: string
  user: {
    full_name: string
  }
}

type StatusHistory = {
  id: string
  old_status: string | null
  new_status: string
  created_at: string
  changed_by: string | null
  user: {
    full_name: string
  } | null
}

type Category = {
  id: string
  name: string
  icon: string
}

export default function AdminReportDetail() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staffMembers, setStaffMembers] = useState<Array<{id: string, full_name: string, role: string}>>([]);
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  
  const [newComment, setNewComment] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  const [editingCategory, setEditingCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchReportData();
    fetchCategories();
    fetchStaffMembers();
    fetchDepartments();
    
    // Subscribe to real-time updates
    let commentsChannel: any;
    let statusChannel: any;
    
    supabase.then(client => {
      commentsChannel = client
        .channel('report-comments')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'report_comments',
            filter: `report_id=eq.${reportId}`
          }, 
          () => {
            fetchComments();
          }
        )
        .subscribe();

      statusChannel = client
        .channel('report-status')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'reports',
            filter: `id=eq.${reportId}`
          }, 
          () => {
            fetchReportData();
          }
        )
        .subscribe();
    });

    return () => {
      if (commentsChannel) {
        supabase.then(client => client.removeChannel(commentsChannel));
      }
      if (statusChannel) {
        supabase.then(client => client.removeChannel(statusChannel));
      }
    };
  }, [reportId]);

  async function fetchCategories() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('report_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchStaffMembers() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('user_profiles')
        .select('id, full_name, role')
        .in('role', ['admin', 'csm'])
        .order('full_name');

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  }

  async function fetchDepartments() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('departments')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }

  async function fetchReportData() {
    try {
      const client = await supabase;
      
      // Fetch report details
      const { data: reportData, error: reportError } = await client
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;

      // Fetch category
      const { data: categoryData } = await client
        .from('report_categories')
        .select('id, name, icon')
        .eq('id', reportData.category_id)
        .single();

      // Fetch citizen profile
      const { data: citizenData } = await client
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', reportData.user_id)
        .single();

      // Fetch department if assigned
      let departmentData = null;
      if (reportData.department_id) {
        const { data } = await client
          .from('departments')
          .select('id, name')
          .eq('id', reportData.department_id)
          .single();
        departmentData = data;
      }

      const transformedReport = {
        ...reportData,
        category: {
          id: categoryData?.id || '',
          name: categoryData?.name || 'Unknown',
          icon: categoryData?.icon || 'construction'
        },
        citizen: {
          full_name: citizenData?.full_name || 'Unknown',
          email: citizenData?.email || 'N/A'
        },
        department: departmentData
      };

      setReport(transformedReport);
      setSelectedStatus(transformedReport.status);
      setSelectedCategory(transformedReport.category_id);
      setAdminNotes(transformedReport.admin_notes || '');
      setAssignedTo(transformedReport.assigned_to || '');
      setSelectedDepartment(transformedReport.department_id || '');

      await Promise.all([
        fetchComments(),
        fetchStatusHistory()
      ]);
      
    } catch (error) {
      console.error('Error fetching report:', error);
      setMessage('Error loading report');
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments() {
    try {
      const client = await supabase;
      const { data: commentsData, error } = await client
        .from('report_comments')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user data for each comment
      const transformedComments = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: userData } = await client
            .from('user_profiles')
            .select('full_name')
            .eq('id', comment.user_id)
            .single();

          return {
            ...comment,
            user: {
              full_name: userData?.full_name || 'Unknown'
            }
          };
        })
      );

      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }

  async function fetchStatusHistory() {
    try {
      const client = await supabase;
      const { data: historyData, error } = await client
        .from('report_status_history')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user data for each history entry
      const transformedHistory = await Promise.all(
        (historyData || []).map(async (history) => {
          if (!history.changed_by) {
            return {
              ...history,
              user: null
            };
          }

          const { data: userData } = await client
            .from('user_profiles')
            .select('full_name')
            .eq('id', history.changed_by)
            .single();

          return {
            ...history,
            user: userData ? {
              full_name: userData.full_name
            } : null
          };
        })
      );

      setStatusHistory(transformedHistory);
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  }

  async function handleUpdateCategory() {
    if (!selectedCategory) return;

    setSubmitting(true);
    setMessage('');

    try {
      const client = await supabase;

      const { error } = await client
        .from('reports')
        .update({
          category_id: selectedCategory,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      setMessage('Category updated successfully');
      setEditingCategory(false);
      fetchReportData();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate() {
    if (!selectedStatus || !report) return;

    // Prevent duplicate submissions if status hasn't changed
    if (selectedStatus === report.status && adminNotes === (report.admin_notes || '') && assignedTo === (report.assigned_to || '')) {
      setMessage('No changes to update');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Update report
      const updateData: any = {
        status: selectedStatus,
        admin_notes: adminNotes,
        assigned_to: assignedTo || null,
        updated_at: new Date().toISOString()
      };

      if (selectedStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error: updateError } = await client
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (updateError) throw updateError;

      // Insert status history record only if status actually changed
      if (selectedStatus !== report.status) {
        const { error: historyError } = await client
          .from('report_status_history')
          .insert({
            report_id: reportId,
            old_status: report.status,
            new_status: selectedStatus,
            changed_by: user.id
          });

        if (historyError) throw historyError;
      }

      setMessage('Status updated successfully');
      
      // Wait a bit before refetching to ensure database has updated
      setTimeout(() => {
        fetchReportData();
      }, 500);
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;

    setSubmitting(true);
    setMessage('');

    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error } = await client
        .from('report_comments')
        .insert({
          report_id: reportId,
          user_id: user.id,
          comment: newComment,
          is_admin: true
        });

      if (error) throw error;

      setNewComment('');
      setMessage('Comment added successfully');
      fetchComments();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDepartmentAssignment() {
    if (!report) return;

    // Prevent duplicate submissions if department hasn't changed
    if (selectedDepartment === (report.department_id || '')) {
      setMessage('No changes to department assignment');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Update report with department assignment
      const updateData: any = {
        department_id: selectedDepartment || null,
        assigned_to_department_at: selectedDepartment ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await client
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (updateError) throw updateError;

      setMessage(selectedDepartment ? 'Report assigned to department successfully!' : 'Department assignment removed');
      
      // Wait a bit before refetching to ensure database has updated
      setTimeout(() => {
        fetchReportData();
      }, 500);
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setSubmitting(false);
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Report not found</p>
          <Link href="/admin/reports" className="text-yellow-600 hover:underline mt-4 inline-block">
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                MyRoxas Admin
              </h1>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              <Link href="/admin/dashboard">
                <div className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Dashboard
                </div>
              </Link>
              <Link href="/admin/reports">
                <div className="flex items-center px-4 py-2 rounded-lg bg-yellow-50 text-yellow-700 font-medium">
                  <FileText className="w-5 h-5 mr-2" />
                  Reports
                </div>
              </Link>
              <Link href="/admin/users">
                <div className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                  <Users className="w-5 h-5 mr-2" />
                  Users
                </div>
              </Link>
              <Link href="/admin/categories">
                <div className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                  <FolderKanban className="w-5 h-5 mr-2" />
                  Categories
                </div>
              </Link>
              <Link href="/admin/departments">
                <div className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                  <Building2 className="w-5 h-5 mr-2" />
                  Departments
                </div>
              </Link>
              <Link href="/admin/department-users">
                <div className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                  <Shield className="w-5 h-5 mr-2" />
                  Dept. Staff
                </div>
              </Link>
              <Link href="/admin/announcements">
                <div className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                  <Megaphone className="w-5 h-5 mr-2" />
                  Announcements
                </div>
              </Link>
              <Link href="/admin/settings">
                <div className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                  <Settings className="w-5 h-5 mr-2" />
                  Settings
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/admin/reports">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
            <ArrowLeft className="w-5 h-5" />
            Back to Reports
          </button>
        </Link>

        {/* Message */}
        {message && (
          <motion.div
            className={`mb-6 p-4 rounded-xl ${
              message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Report Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Header */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">{getIconEmoji(report.category.icon)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                    {!editingCategory && (
                      <button
                        onClick={() => setEditingCategory(true)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Category
                      </button>
                    )}
                  </div>
                  
                  {editingCategory ? (
                    <div className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Change Category
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleUpdateCategory}
                          disabled={submitting}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(false);
                            setSelectedCategory(report.category_id);
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm text-gray-600">{report.category.name}</span>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        report.urgency === 'high'
                          ? 'bg-red-100 text-red-800'
                          : report.urgency === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.urgency.charAt(0).toUpperCase() + report.urgency.slice(1)} Priority
                      </span>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'resolved' 
                          ? 'bg-green-100 text-green-800'
                          : report.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : report.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {report.status.replace('_', ' ').charAt(0).toUpperCase() + report.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-gray-700 mb-4">{report.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {report.location_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-600">{report.location_address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{formatDate(report.created_at)}</span>
                    </div>
                    {report.resolved_at && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-gray-600">Resolved: {formatDate(report.resolved_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Citizen Information */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Citizen Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{report.citizen.full_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">📧</span>
                  <a href={`mailto:${report.citizen.email}`} className="text-yellow-600 hover:underline">
                    {report.citizen.email}
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Comments Section */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Communication</h3>
              
              {/* Comments List */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-xl ${
                        comment.is_admin
                          ? 'bg-yellow-50 border border-yellow-100'
                          : 'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {comment.user.full_name}
                          </span>
                          {comment.is_admin && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-600 text-white rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-700">{comment.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment visible to the citizen..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all resize-none"
                />
                <button
                  onClick={handleAddComment}
                  disabled={submitting || !newComment.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  Send Comment
                </button>
              </div>
            </motion.div>

            {/* Status History */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Status History</h3>
              <div className="space-y-3">
                {statusHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No status changes yet</p>
                ) : (
                  statusHistory.map((history) => (
                    <div key={history.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          Status changed from <span className="font-semibold">{history.old_status || 'none'}</span> to{' '}
                          <span className="font-semibold">{history.new_status}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {history.user?.full_name || 'System'} • {formatDate(history.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Update Status */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Update Report</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign To (Optional)
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                  >
                    <option value="">Unassigned</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name} ({staff.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Private notes (not visible to citizen)"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleStatusUpdate}
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Report'}
                </button>
              </div>
            </motion.div>

            {/* Assign to Department */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Assign to Department
              </h3>
              
              {report.department && (
                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs text-indigo-600 font-semibold mb-1">Currently Assigned To:</p>
                  <p className="text-sm font-bold text-indigo-900">{report.department.name}</p>
                  {report.assigned_to_department_at && (
                    <p className="text-xs text-indigo-600 mt-1">
                      Assigned {formatDate(report.assigned_to_department_at)}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  >
                    <option value="">No Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleDepartmentAssignment}
                  disabled={submitting || selectedDepartment === (report.department_id || '')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : selectedDepartment ? 'Assign to Department' : 'Remove Department'}
                </button>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <p className="font-semibold text-gray-700 mb-1">ℹ️ About Department Assignment:</p>
                  <p>Assigned reports become visible to department staff for resolution.</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Info */}
            <motion.div
              className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-sm font-bold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Admin Workflow Guide
              </h3>
              <ul className="text-xs text-yellow-800 space-y-2">
                <li>• <strong>Edit Category:</strong> Change report type anytime</li>
                <li>• <strong>Pending:</strong> Report just submitted</li>
                <li>• <strong>In Progress:</strong> Currently working on it</li>
                <li>• <strong>Resolved:</strong> Issue fixed</li>
                <li>• <strong>Rejected:</strong> Invalid/spam report</li>
                <li className="pt-2 border-t border-yellow-200 mt-2">
                  💡 Comments are visible to citizens in real-time
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
