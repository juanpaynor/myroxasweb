'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Bell,
  TrendingUp,
  Clock,
  CheckCircle,
  MessageSquare,
  User,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getIconEmoji } from '@/lib/icons';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function CSMDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState([
    {
      title: 'Pending Reports',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: Clock,
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'In Progress',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: MessageSquare,
      color: 'from-blue-500 to-indigo-500'
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
      title: 'Total Reports',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: FileText,
      color: 'from-purple-500 to-pink-500'
    }
  ]);
  const [recentReports, setRecentReports] = useState<ReportWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const client = await supabase;
      
      // Fetch pending reports count
      const { count: pendingCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch in progress reports count
      const { count: inProgressCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      // Fetch resolved today count
      const today = new Date().toISOString().split('T')[0];
      const { count: resolvedTodayCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('resolved_at', today);

      // Fetch all reports count
      const { count: totalCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true });

      // Fetch recent reports with category info
      const { data: reports, error: reportsError } = await client
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
        .limit(5);

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
          title: 'Pending Reports',
          value: pendingCount?.toString() || '0',
          change: '-5%',
          trend: 'down',
          icon: Clock,
          color: 'from-orange-500 to-red-500'
        },
        {
          title: 'In Progress',
          value: inProgressCount?.toString() || '0',
          change: '+12%',
          trend: 'up',
          icon: MessageSquare,
          color: 'from-blue-500 to-indigo-500'
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
          title: 'Total Reports',
          value: totalCount?.toString() || '0',
          change: '+15%',
          trend: 'up',
          icon: FileText,
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <h1 className="text-base sm:text-xl md:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                MyRoxas <span className="hidden sm:inline">CSM</span>
              </h1>
            </div>

            {/* Nav Links */}
            <div className="flex items-center space-x-0.5 overflow-x-auto">
              <Link href="/csm/dashboard">
                <div className="flex items-center px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-medium whitespace-nowrap">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Dashboard</span>
                </div>
              </Link>
              <Link href="/csm/reports">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors whitespace-nowrap">
                  <FileText className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Reports</span>
                </div>
              </Link>
              <Link href="/csm/support">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors whitespace-nowrap">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Support</span>
                </div>
              </Link>
              <Link href="/csm/settings">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors whitespace-nowrap">
                  <Settings className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Settings</span>
                </div>
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button className="hidden sm:flex relative p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center hover:bg-gray-100 rounded-lg p-0.5 transition-colors"
                  title="Account"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    C
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
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                      >
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome back! Here's your report overview.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <Skeleton className="w-16 h-5" />
                </div>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))
          ) : (
            stats.map((stat, index) => (
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
          ))
          )}
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
            <Link href="/csm/reports">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
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
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20 ml-auto" /></td>
                    </tr>
                  ))
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
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">{getIconEmoji(report.category.icon)}</span>
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
                        <Link href={`/csm/reports/${report.id}`}>
                          <button className="text-blue-600 hover:text-blue-700 font-semibold">
                            Respond
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
