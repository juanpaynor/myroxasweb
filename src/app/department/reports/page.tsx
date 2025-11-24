'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2,
  FileText, 
  Settings, 
  Bell,
  Search,
  Filter,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  Clock,
  Monitor,
  User,
  LogOut,
  Trash2,
  CheckCircle2,
  FileDown
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportWithDetails = {
  id: string;
  title: string;
  description: string;
  location_address: string | null;
  status: string;
  urgency: string;
  created_at: string;
  category: {
    name: string;
  } | null;
};

export default function DepartmentReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [newComment, setNewComment] = useState('');
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, statusFilter, urgencyFilter]);

  async function checkAuth() {
    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();

      if (!user) {
        router.push('/department/login');
        return;
      }

      setUserId(user.id);

      // Get user profile
      const { data: profile } = await client
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'department') {
        router.push('/department/login');
        return;
      }

      // Get user's department assignments
      const { data: deptAssignments } = await client
        .from('department_users')
        .select(`
          department:departments(id, name)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      const depts = deptAssignments?.map((assignment: any) => ({
        id: assignment.department.id,
        name: assignment.department.name
      })) || [];

      setDepartments(depts);

      if (depts.length > 0) {
        await fetchReports(depts.map(d => d.id));
      }

      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/department/login');
    }
  }

  async function fetchReports(departmentIds: string[]) {
    try {
      const client = await supabase;
      
      let query = client
        .from('reports')
        .select(`
          id,
          title,
          description,
          location_address,
          status,
          urgency,
          created_at,
          category:report_categories(name)
        `);
      
      if (departmentIds.length === 1) {
        query = query.eq('department_id', departmentIds[0]);
      } else {
        query = query.in('department_id', departmentIds);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch reports query error:', error);
        throw error;
      }
      setReports((data as any) || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }

  function filterReports() {
    let filtered = [...reports];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location_address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(report => report.urgency === urgencyFilter);
    }

    setFilteredReports(filtered);
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

  function exportToPDF() {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('MyRoxas Department - Reports Summary', 14, 22);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);
    doc.text(`Status Filter: ${statusFilter}`, 14, 36);
    doc.text(`Urgency Filter: ${urgencyFilter}`, 14, 42);
    doc.text(`Total Reports: ${filteredReports.length}`, 14, 48);
    
    // Prepare table data
    const tableData = filteredReports.map(report => [
      report.id.slice(0, 8),
      report.title,
      report.category?.name || 'N/A',
      report.status.replace('_', ' ').toUpperCase(),
      report.urgency.toUpperCase(),
      new Date(report.created_at).toLocaleDateString(),
      report.location_address || 'N/A'
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['ID', 'Title', 'Category', 'Status', 'Urgency', 'Date', 'Location']],
      body: tableData,
      startY: 54,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }, // Blue color for department
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 35 }
      }
    });
    
    // Save the PDF
    doc.save(`department-reports-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  async function fetchReportDetails(reportId: string) {
    try {
      const client = await supabase;

      // Fetch status history
      const { data: history } = await client
        .from('report_status_history')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      setStatusHistory(history || []);

      // Fetch comments
      const { data: reportComments } = await client
        .from('report_comments')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      setComments(reportComments || []);
    } catch (error) {
      console.error('Error fetching report details:', error);
    }
  }

  async function handleStatusUpdate() {
    if (!selectedReport || !newStatus || !userId) return;

    try {
      const client = await supabase;

      // Update report status
      const { error: updateError } = await client
        .from('reports')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);

      if (updateError) throw updateError;

      // Create status history entry
      await client.from('report_status_history').insert({
        report_id: selectedReport.id,
        old_status: selectedReport.status,
        new_status: newStatus,
        changed_by: userId,
        notes: statusNotes || null
      });

      // Refresh reports and details
      await fetchReports(departments.map(d => d.id));
      await fetchReportDetails(selectedReport.id);

      // Update selected report
      setSelectedReport({ ...selectedReport, status: newStatus });
      setNewStatus('');
      setStatusNotes('');

      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  }

  async function handleResolveReport(reportId: string) {
    if (!confirm('Are you sure you want to mark this report as resolved?')) return;

    try {
      const client = await supabase;
      const { error } = await client
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (error) throw error;

      // Refresh reports
      await fetchReports(departments.map(d => d.id));
      
      // Close modal if this is the selected report
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Failed to resolve report');
    }
  }

  async function handleDeleteReport(reportId: string) {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;

    try {
      const client = await supabase;
      const { error } = await client
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      // Refresh reports
      await fetchReports(departments.map(d => d.id));
      
      // Close modal if this is the selected report
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  }

  async function handleAddComment() {
    if (!selectedReport || !newComment.trim() || !userId) return;

    try {
      const client = await supabase;

      await client.from('report_comments').insert({
        report_id: selectedReport.id,
        user_id: userId,
        comment: newComment.trim(),
        is_admin: true
      });

      await fetchReportDetails(selectedReport.id);
      setNewComment('');

      alert('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 mr-2" />
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Department <span className="hidden sm:inline">Portal</span>
              </h1>
            </div>

            {/* Nav Links */}
            <div className="flex items-center space-x-0.5 sm:space-x-0.5 overflow-x-auto">
              <Link href="/department/dashboard">
                <div className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors whitespace-nowrap">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden md:inline text-sm">Dashboard</span>
                </div>
              </Link>
              <Link href="/department/reports">
                <div className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-50 text-blue-700 font-medium whitespace-nowrap">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden md:inline text-sm">Reports</span>
                </div>
              </Link>
              <Link href="/department/queue">
                <div className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors whitespace-nowrap">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden md:inline text-sm">Queue</span>
                </div>
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
              <button 
                onClick={() => window.open('/department/display', '_blank')}
                className="hidden sm:flex relative p-1.5 sm:p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-full transition-colors"
              >
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>
              <button className="hidden sm:flex relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
                
                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showSettingsDropdown && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowSettingsDropdown(false)}
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                      >
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            // Navigate to profile/settings page when created
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            // Navigate to department settings when created
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
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
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Assigned Reports</h2>
          <p className="text-gray-600">Manage reports assigned to your department</p>
          
          {/* Department Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {departments.map((dept) => (
              <span
                key={dept.id}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {dept.name}
              </span>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reports..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Urgency Filter */}
            <div>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="all">All Urgency</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-4">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <FileDown className="w-5 h-5" />
              Export to PDF
            </button>
          </div>
        </div>

        {/* Reports Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredReports.length}</span> of <span className="font-semibold">{reports.length}</span> reports
          </p>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No reports have been assigned to your department yet'}
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setSelectedReport(report);
                  setNewStatus('');
                  setStatusNotes('');
                  setNewComment('');
                  fetchReportDetails(report.id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{report.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{report.description}</p>
                    
                    {report.location_address && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                        <MapPin className="w-4 h-4" />
                        {report.location_address}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getUrgencyColor(report.urgency)}`}>
                        {report.urgency.toUpperCase()}
                      </span>
                      {report.category && (
                        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                          {report.category.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-end">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    <button
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReport(report);
                        setNewStatus('');
                        setStatusNotes('');
                        setNewComment('');
                        fetchReportDetails(report.id);
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Sliding Panel for Report Details */}
      <AnimatePresence>
        {selectedReport && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedReport(null)}
            />
            
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedReport.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getUrgencyColor(selectedReport.urgency)}`}>
                      {selectedReport.urgency.toUpperCase()}
                    </span>
                    {selectedReport.category && (
                      <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {selectedReport.category.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedReport.description}</p>
                </div>

                {/* Location */}
                {selectedReport.location_address && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Location</h4>
                    <p className="text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedReport.location_address}
                    </p>
                  </div>
                )}

                {/* Date */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Reported On</h4>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Update Status */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h4>
                  <div className="space-y-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    >
                      <option value="">Select new status...</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Add notes about this status change (optional)..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                      rows={3}
                    />
                    
                    <button
                      onClick={handleStatusUpdate}
                      disabled={!newStatus}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Status
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedReport.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveReport(selectedReport.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Resolved
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReport(selectedReport.id)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Report
                    </button>
                  </div>
                </div>

                {/* Status History */}
                {statusHistory.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Status History</h4>
                    <div className="space-y-3">
                      {statusHistory.map((history) => (
                        <div key={history.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(history.old_status || 'pending')}`}>
                                {(history.old_status || 'New').replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(history.new_status)}`}>
                                {history.new_status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(history.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-gray-600 mt-2">{history.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Comment */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Comment</h4>
                  <div className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment visible to the citizen..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>

                {/* Comments */}
                {comments.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Comments</h4>
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${comment.is_admin ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                              {comment.is_admin ? 'Department' : 'Citizen'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
