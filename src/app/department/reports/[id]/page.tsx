'use client';

import { motion } from 'framer-motion';
import { 
  Building2,
  FileText, 
  Settings, 
  Bell,
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  Send,
  Clock,
  Save,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Report = {
  id: string;
  title: string;
  description: string;
  location_address: string | null;
  status: string;
  urgency: string;
  created_at: string;
  updated_at: string;
  admin_notes: string | null;
  category: {
    name: string;
  } | null;
  citizen: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
};

type Comment = {
  id: string;
  comment: string;
  is_admin: boolean;
  created_at: string;
  user: {
    full_name: string;
  };
};

export default function DepartmentReportDetail() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, [reportId]);

  async function checkAuthAndFetch() {
    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();

      if (!user) {
        router.push('/department/login');
        return;
      }

      // Verify department role
      const { data: profile } = await client
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'department') {
        router.push('/department/login');
        return;
      }

      await fetchReport();
      await fetchComments();
      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/department/login');
    }
  }

  async function fetchReport() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('reports')
        .select(`
          id,
          title,
          description,
          location_address,
          status,
          urgency,
          created_at,
          updated_at,
          admin_notes,
          category:categories(name),
          citizen:user_profiles!reports_user_id_fkey(full_name, email, phone)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data as any);
      setSelectedStatus(data.status);
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  }

  async function fetchComments() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('report_comments')
        .select(`
          id,
          comment,
          is_admin,
          created_at,
          user:user_profiles(full_name)
        `)
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments((data as any) || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }

  async function handleStatusUpdate() {
    if (!report || selectedStatus === report.status) return;

    setIsUpdating(true);
    setUpdateMessage('');

    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();

      // Update report status
      const { error: updateError } = await client
        .from('reports')
        .update({
          status: selectedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      // Create status history entry
      await client
        .from('status_history')
        .insert({
          report_id: reportId,
          old_status: report.status,
          new_status: selectedStatus,
          changed_by: user?.id
        });

      setUpdateMessage('Status updated successfully!');
      await fetchReport();

      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (error: any) {
      setUpdateMessage('Error: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();

      const { error } = await client
        .from('report_comments')
        .insert({
          report_id: reportId,
          user_id: user?.id,
          comment: newComment.trim(),
          is_admin: true
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
    } catch (error: any) {
      alert('Error adding comment: ' + error.message);
    }
  }

  async function handleLogout() {
    try {
      const client = await supabase;
      await client.auth.signOut();
      router.push('/department/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }

  function getUrgencyColor(urgency: string) {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-6">This report doesn't exist or you don't have access to it.</p>
          <Link
            href="/department/reports"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center flex-shrink-0">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 mr-2" />
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Department <span className="hidden sm:inline">Portal</span>
              </h1>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-1 overflow-x-auto">
              <Link href="/department/dashboard">
                <div className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors whitespace-nowrap">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden md:inline text-sm">Dashboard</span>
                </div>
              </Link>
              <Link href="/department/reports">
                <div className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors whitespace-nowrap">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden md:inline text-sm">Reports</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
              <button className="hidden sm:flex relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/department/reports"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Reports
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Details Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(report.urgency)}`}>
                      {report.urgency.toUpperCase()} URGENCY
                    </span>
                    {report.category && (
                      <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                        {report.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{report.description}</p>
                </div>

                {report.location_address && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </h3>
                    <p className="text-gray-600">{report.location_address}</p>
                  </div>
                )}

                {report.admin_notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Admin Notes</h3>
                    <p className="text-blue-700 text-sm">{report.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Comments & Updates</h2>
              
              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or update..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Add Comment
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">{comment.user.full_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.comment}</p>
                      {comment.is_admin && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Department Staff
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Update Status Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Update Status</h3>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all mb-4"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating || selectedStatus === report.status}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>

              {updateMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 p-3 rounded-lg text-sm ${
                    updateMessage.includes('Error')
                      ? 'bg-red-50 text-red-700'
                      : 'bg-green-50 text-green-700'
                  }`}
                >
                  {updateMessage}
                </motion.div>
              )}
            </div>

            {/* Citizen Info Card */}
            {report.citizen && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Citizen Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{report.citizen.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-900">{report.citizen.email}</p>
                  </div>
                  {report.citizen.phone && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm text-gray-900">{report.citizen.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-gray-900">{new Date(report.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-900">{new Date(report.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
