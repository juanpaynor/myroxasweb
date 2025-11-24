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
  Download,
  MapPin,
  Calendar,
  Eye,
  FolderKanban,
  Building2,
  Shield,
  Megaphone,
  MessageSquare,
  Trash2,
  CheckCircle2,
  FileDown
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getIconEmoji } from '@/lib/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Report = {
  id: string
  title: string
  description: string
  location_address: string | null
  status: string
  urgency: string
  created_at: string
  category: {
    name: string
    icon: string
  }
}

export default function AdminReports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();

    // Subscribe to real-time updates
    let channel: any;
    supabase.then(client => {
      channel = client
        .channel('reports-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'reports' 
          }, 
          () => {
            fetchReports(); // Refresh reports on any change
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        supabase.then(client => client.removeChannel(channel));
      }
    };
  }, [filterStatus, searchQuery]);

  async function fetchReports() {
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
          category:report_categories(name, icon)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filterStatus !== 'All') {
        query = query.eq('status', filterStatus.toLowerCase().replace(' ', '_'));
      }

      // Apply search query
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location_address.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match our type
      const transformedReports = data?.map(report => ({
        id: report.id,
        title: report.title,
        description: report.description,
        location_address: report.location_address,
        status: report.status,
        urgency: report.urgency,
        created_at: report.created_at,
        category: {
          name: (report as any).category?.name || 'Unknown',
          icon: (report as any).category?.icon || '📋'
        }
      })) || [];

      setReports(transformedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
      fetchReports();
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
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  }

  function exportToPDF() {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('MyRoxas - Reports Summary', 14, 22);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);
    doc.text(`Filter: ${filterStatus}`, 14, 36);
    doc.text(`Total Reports: ${filteredReports.length}`, 14, 42);
    
    // Prepare table data
    const tableData = filteredReports.map(report => [
      report.id.slice(0, 8),
      report.title,
      report.category.name,
      report.status.replace('_', ' ').toUpperCase(),
      report.urgency.toUpperCase(),
      formatDate(report.created_at),
      report.location_address || 'N/A'
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['ID', 'Title', 'Category', 'Status', 'Urgency', 'Date', 'Location']],
      body: tableData,
      startY: 48,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 179, 8] }, // Yellow color
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
    doc.save(`reports-${filterStatus.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
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
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-medium">
                  <FileText className="w-4 h-4 mr-1.5" />
                  Reports
                </div>
              </Link>
              <Link href="/admin/users">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 font-medium transition-colors">
                  <Users className="w-4 h-4 mr-1.5" />
                  Users
                </div>
              </Link>
              <Link href="/admin/categories">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 font-medium transition-colors">
                  <FolderKanban className="w-4 h-4 mr-1.5" />
                  Categories
                </div>
              </Link>
              <Link href="/admin/departments">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 font-medium transition-colors">
                  <Building2 className="w-4 h-4 mr-1.5" />
                  Departments
                </div>
              </Link>
              <Link href="/admin/department-users">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 font-medium transition-colors">
                  <Shield className="w-4 h-4 mr-1.5" />
                  Dept. Staff
                </div>
              </Link>
              <Link href="/admin/announcements">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 font-medium transition-colors">
                  <Megaphone className="w-4 h-4 mr-1.5" />
                  Announcements
                </div>
              </Link>
              <Link href="/admin/support-faqs">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 font-medium transition-colors">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Support FAQs
                </div>
              </Link>
              <Link href="/admin/settings">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 font-medium transition-colors">
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
          <h2 className="text-3xl font-bold text-gray-900 dark:bg-gray-700 mb-2">Reports</h2>
          <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-400">Manage and track all citizen reports.</p>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 dark:border-gray-700 dark:border-gray-700 p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, type, location, or reporter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:bg-gray-700"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Export Button */}
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              <FileDown className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </motion.div>

        {/* Reports Table */}
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">
                    Report ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider">
                    Category & Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
                      Loading reports...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-400">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  reports.map((report, index) => (
                    <motion.tr 
                      key={report.id}
                      className="hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:bg-gray-700">#{report.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{getIconEmoji(report.category.icon)}</span>
                            <span className="text-sm font-medium text-gray-900 dark:bg-gray-700">{report.category.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:bg-gray-700">{report.title}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mt-1 max-w-xs truncate">{report.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-400 max-w-xs">{report.location_address || 'No location'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          report.urgency === 'high'
                            ? 'bg-red-100 text-red-800'
                            : report.urgency === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 text-gray-800'
                        }`}>
                          {report.urgency.charAt(0).toUpperCase() + report.urgency.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 dark:bg-gray-700">{formatDate(report.created_at)}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{formatTime(report.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/reports/${report.id}`}>
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md font-medium transition-colors">
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </Link>
                          {report.status !== 'resolved' && (
                            <button 
                              onClick={() => handleResolveReport(report.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md font-medium transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Resolve
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteReport(report.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md font-medium transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-400">
              Showing <span className="font-semibold">{reports.length}</span> report{reports.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 transition-colors disabled:opacity-50" disabled>
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
