'use client';

import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Bell,
  Search,
  Filter,
  Eye,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getIconEmoji } from '@/lib/icons';

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

export default function CSMReports() {
  const router = useRouter();
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
            fetchReports();
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

  async function handleLogout() {
    try {
      const client = await supabase;
      await client.auth.signOut();
      router.push('/login/csm');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                MyRoxas CSM
              </h1>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-0.5">
              <Link href="/csm/dashboard">
                <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </div>
              </Link>
              <Link href="/csm/reports">
                <div className="flex items-center px-2 py-1.5 rounded-md bg-blue-50 text-blue-700 font-medium text-sm">
                  <FileText className="w-4 h-4 mr-1.5" />
                  Reports
                </div>
              </Link>
              <Link href="/csm/support">
                <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Support Chat
                </div>
              </Link>
              <Link href="/csm/settings">
                <div className="flex items-center px-2 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">
                  <Settings className="w-4 h-4 mr-1.5" />
                  Settings
                </div>
              </Link>
            </div>

            {/* Right Side Icons */}
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                C
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Reports</h2>
          <p className="text-gray-600">View and respond to citizen reports</p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No reports found</div>
          ) : (
            reports.map((report, index) => (
              <motion.div
                key={report.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">{getIconEmoji(report.category.icon)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{report.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{report.category.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            report.urgency === 'high'
                              ? 'bg-red-100 text-red-800'
                              : report.urgency === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {report.urgency.charAt(0).toUpperCase() + report.urgency.slice(1)}
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
                      </div>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{report.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatDate(report.created_at)} • {formatTime(report.created_at)}</span>
                        {report.location_address && (
                          <span className="flex items-center gap-1">
                            📍 {report.location_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <Link href={`/csm/reports/${report.id}`}>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all">
                      <Eye className="w-4 h-4" />
                      View & Respond
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
