'use client';

import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Bell,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ReportWithCategory = {
  id: string
  title: string
  location_address: string | null
  status: string
  urgency: string
  created_at: string
  category: {
    name: string
    icon: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    {
      title: 'Total Reports',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: FileText,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'Pending Issues',
      value: '0',
      change: '0%',
      trend: 'down',
      icon: Clock,
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Resolved Today',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: CheckCircle,
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'Active Users',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-pink-500'
    }
  ]);
  const [recentReports, setRecentReports] = useState<ReportWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch all reports count
      const { count: totalCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      // Fetch pending reports count
      const { count: pendingCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch resolved today count
      const today = new Date().toISOString().split('T')[0];
      const { count: resolvedTodayCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('resolved_at', today);

      // Fetch recent reports with category info
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          location_address,
          status,
          urgency,
          created_at,
          report_categories!inner(name, icon)
        `)
        .order('created_at', { ascending: false })
        .limit(4);

      if (reportsError) throw reportsError;

      // Transform the data to match our type
      const transformedReports = reports?.map(report => ({
        id: report.id,
        title: report.title,
        location_address: report.location_address,
        status: report.status,
        urgency: report.urgency,
        created_at: report.created_at,
        category: {
          name: (report as any).report_categories?.name || 'Unknown',
          icon: (report as any).report_categories?.icon || '📋'
        }
      })) || [];

      // Update stats
      setStats([
        {
          title: 'Total Reports',
          value: totalCount?.toString() || '0',
          change: '+12%',
          trend: 'up',
          icon: FileText,
          color: 'from-blue-500 to-indigo-500'
        },
        {
          title: 'Pending Issues',
          value: pendingCount?.toString() || '0',
          change: '-5%',
          trend: 'down',
          icon: Clock,
          color: 'from-orange-500 to-red-500'
        },
        {
          title: 'Resolved Today',
          value: resolvedTodayCount?.toString() || '0',
          change: '+8%',
          trend: 'up',
          icon: CheckCircle,
          color: 'from-green-500 to-teal-500'
        },
        {
          title: 'Active Users',
          value: '5,678',
          change: '+24%',
          trend: 'up',
          icon: Users,
          color: 'from-purple-500 to-pink-500'
        }
      ]);

      setRecentReports(transformedReports);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                MyRoxas Admin
              </h1>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/admin/dashboard">
                <div className="flex items-center px-4 py-2 rounded-lg bg-yellow-50 text-yellow-700 font-medium">
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Dashboard
                </div>
              </Link>
              <Link href="/admin/reports">
                <div className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
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
              <Link href="/admin/settings">
                <div className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                  <Settings className="w-5 h-5 mr-2" />
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
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center text-sm font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`w-4 h-4 mr-1 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent Reports Table */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Recent Reports</h3>
            <Link href="/admin/reports">
              <button className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold">
                View All →
              </button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Loading reports...
                    </td>
                  </tr>
                ) : recentReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  recentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{report.category.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{report.category.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {report.location_address || 'No location provided'}
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
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {report.urgency.charAt(0).toUpperCase() + report.urgency.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getTimeAgo(report.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link href={`/admin/reports/${report.id}`}>
                          <button className="text-yellow-600 hover:text-yellow-700 font-semibold">
                            View Details
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
