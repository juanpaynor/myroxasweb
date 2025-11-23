'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Bell,
  TrendingUp,
  CheckCircle,
  Clock,
  FolderKanban,
  Building2,
  Shield,
  User,
  LogOut,
  Megaphone,
  Calendar,
  TrendingDown,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getIconEmoji } from '@/lib/icons';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThemeToggle } from '@/components/ThemeToggle';
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

type CategoryData = {
  name: string
  count: number
  icon: string
}

type TimeSeriesData = {
  date: string
  reports: number
  resolved: number
}

type StatusData = {
  name: string
  value: number
  color: string
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalReports: { value: 0, change: 0, trend: 'up' as 'up' | 'down' },
    pendingReports: { value: 0, change: 0, trend: 'down' as 'up' | 'down' },
    resolvedToday: { value: 0, change: 0, trend: 'up' as 'up' | 'down' },
    totalUsers: { value: 0, change: 0, trend: 'up' as 'up' | 'down' },
    totalDepartments: { value: 0, change: 0, trend: 'up' as 'up' | 'down' },
    totalAnnouncements: { value: 0, change: 0, trend: 'up' as 'up' | 'down' }
  });
  const [recentReports, setRecentReports] = useState<ReportWithCategory[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const client = await supabase;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Fetch total reports (current vs previous 30 days)
      const { count: totalCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true });

      const { count: last30DaysCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      const { count: previous30DaysCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgo)
        .lt('created_at', thirtyDaysAgo);

      // Fetch pending reports
      const { count: pendingCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: previousPendingCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', thirtyDaysAgo)
        .lt('created_at', today);

      // Fetch resolved today
      const { count: resolvedTodayCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('updated_at', today);

      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { count: resolvedYesterdayCount } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('updated_at', yesterday)
        .lt('updated_at', today);

      // Fetch total users
      const { count: totalUsers } = await client
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: usersLast30Days } = await client
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      const { count: usersPrevious30Days } = await client
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgo)
        .lt('created_at', thirtyDaysAgo);

      // Fetch departments
      const { count: totalDepartments } = await client
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch announcements
      const { count: totalAnnouncements } = await client
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      const { count: announcementsLast30Days } = await client
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', thirtyDaysAgo);

      // Fetch reports by category
      const { data: categoriesData } = await client
        .from('reports')
        .select(`
          category_id,
          report_categories(name, icon)
        `);

      const categoryCount: Record<string, { name: string; count: number; icon: string }> = {};
      categoriesData?.forEach((report: any) => {
        const catName = report.report_categories?.name || 'Unknown';
        const catIcon = report.report_categories?.icon || '📋';
        if (!categoryCount[catName]) {
          categoryCount[catName] = { name: catName, count: 0, icon: catIcon };
        }
        categoryCount[catName].count++;
      });

      // Fetch reports by status
      const { data: statusCounts } = await client
        .from('reports')
        .select('status');

      const statusCount: Record<string, number> = {};
      statusCounts?.forEach((report) => {
        statusCount[report.status] = (statusCount[report.status] || 0) + 1;
      });

      const statusChartData: StatusData[] = [
        { name: 'Pending', value: statusCount['pending'] || 0, color: '#f59e0b' },
        { name: 'In Progress', value: statusCount['in_progress'] || 0, color: '#3b82f6' },
        { name: 'Resolved', value: statusCount['resolved'] || 0, color: '#10b981' },
        { name: 'Rejected', value: statusCount['rejected'] || 0, color: '#ef4444' }
      ];

      // Fetch time series data (last 7 days)
      const timeSeriesPromises = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const nextDateStr = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        timeSeriesPromises.push(
          Promise.all([
            client.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', dateStr).lt('created_at', nextDateStr),
            client.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('updated_at', dateStr).lt('updated_at', nextDateStr)
          ]).then(([reports, resolved]) => ({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            reports: reports.count || 0,
            resolved: resolved.count || 0
          }))
        );
      }
      const timeSeries = await Promise.all(timeSeriesPromises);

      // Fetch recent reports
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

      // Calculate trends
      const reportsTrend = previous30DaysCount ? ((last30DaysCount || 0) - previous30DaysCount) / previous30DaysCount * 100 : 0;
      const pendingTrend = previousPendingCount ? ((pendingCount || 0) - previousPendingCount) / previousPendingCount * 100 : 0;
      const resolvedTrend = resolvedYesterdayCount ? ((resolvedTodayCount || 0) - resolvedYesterdayCount) / resolvedYesterdayCount * 100 : 0;
      const usersTrend = usersPrevious30Days ? ((usersLast30Days || 0) - usersPrevious30Days) / usersPrevious30Days * 100 : 0;

      setStats({
        totalReports: { value: totalCount || 0, change: reportsTrend, trend: reportsTrend >= 0 ? 'up' : 'down' },
        pendingReports: { value: pendingCount || 0, change: Math.abs(pendingTrend), trend: pendingTrend <= 0 ? 'up' : 'down' },
        resolvedToday: { value: resolvedTodayCount || 0, change: resolvedTrend, trend: resolvedTrend >= 0 ? 'up' : 'down' },
        totalUsers: { value: totalUsers || 0, change: usersTrend, trend: usersTrend >= 0 ? 'up' : 'down' },
        totalDepartments: { value: totalDepartments || 0, change: 0, trend: 'up' },
        totalAnnouncements: { value: totalAnnouncements || 0, change: 0, trend: 'up' }
      });

      setRecentReports(transformedReports);
      setCategoryData(Object.values(categoryCount).sort((a, b) => b.count - a.count).slice(0, 6));
      setTimeSeriesData(timeSeries);
      setStatusData(statusChartData);
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
      router.push('/login/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <h1 className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                MyRoxas Admin
              </h1>
            </div>

            <div className="flex items-center space-x-1">
              <Link href="/admin/dashboard" title="Dashboard">
                <div className="flex items-center px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 transition-colors group">
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="ml-2 text-sm font-medium hidden lg:inline">Dashboard</span>
                </div>
              </Link>
              <Link href="/admin/reports" title="Reports">
                <div className="flex items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <FileText className="w-5 h-5" />
                  <span className="ml-2 text-sm font-medium hidden lg:inline">Reports</span>
                </div>
              </Link>
              <Link href="/admin/users" title="Users">
                <div className="flex items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <Users className="w-5 h-5" />
                  <span className="ml-2 text-sm font-medium hidden lg:inline">Users</span>
                </div>
              </Link>
              <Link href="/admin/categories" title="Categories">
                <div className="flex items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <FolderKanban className="w-5 h-5" />
                  <span className="ml-2 text-sm font-medium hidden xl:inline">Categories</span>
                </div>
              </Link>
              <Link href="/admin/departments" title="Departments">
                <div className="flex items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <Building2 className="w-5 h-5" />
                  <span className="ml-2 text-sm font-medium hidden xl:inline">Departments</span>
                </div>
              </Link>
              <Link href="/admin/department-users" title="Department Staff">
                <div className="flex items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <Shield className="w-5 h-5" />
                  <span className="ml-2 text-sm font-medium hidden xl:inline">Staff</span>
                </div>
              </Link>
              <Link href="/admin/announcements" title="Announcements">
                <div className="flex items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <Megaphone className="w-5 h-5" />
                  <span className="ml-2 text-sm font-medium hidden xl:inline">Announcements</span>
                </div>
              </Link>
              <Link href="/admin/support-faqs" title="Support FAQs">
                <div className="flex items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <MessageSquare className="w-5 h-5" />
                  <span className="ml-2 text-sm font-medium hidden xl:inline">FAQs</span>
                </div>
              </Link>
              <Link href="/admin/settings" title="Settings">
                <div className="flex items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <Settings className="w-5 h-5" />
                  <span className="ml-2 text-sm font-medium hidden xl:inline">Settings</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
                  title="Account"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
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
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                      >
                        <button
                          onClick={() => setShowSettingsDropdown(false)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => setShowSettingsDropdown(false)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
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
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300">Overview of MyRoxas platform activity</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading ? (
            // Skeleton Loading
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <Skeleton className="w-16 h-5" />
                </div>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : (
            [
            { title: 'Total Reports', value: stats.totalReports.value, change: stats.totalReports.change, trend: stats.totalReports.trend, icon: FileText, color: 'from-blue-500 to-indigo-500' },
            { title: 'Pending Issues', value: stats.pendingReports.value, change: stats.pendingReports.change, trend: stats.pendingReports.trend, icon: Clock, color: 'from-orange-500 to-red-500' },
            { title: 'Resolved Today', value: stats.resolvedToday.value, change: stats.resolvedToday.change, trend: stats.resolvedToday.trend, icon: CheckCircle, color: 'from-green-500 to-teal-500' },
            { title: 'Active Users', value: stats.totalUsers.value, change: stats.totalUsers.change, trend: stats.totalUsers.trend, icon: Users, color: 'from-purple-500 to-pink-500' },
            { title: 'Departments', value: stats.totalDepartments.value, change: stats.totalDepartments.change, trend: stats.totalDepartments.trend, icon: Building2, color: 'from-cyan-500 to-blue-500' },
            { title: 'Announcements', value: stats.totalAnnouncements.value, change: stats.totalAnnouncements.change, trend: stats.totalAnnouncements.trend, icon: Megaphone, color: 'from-yellow-500 to-orange-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {stat.change !== 0 && (
                  <div className={`flex items-center text-sm font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {Math.abs(stat.change).toFixed(1)}%
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{loading ? '...' : stat.value}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{stat.title}</p>
            </motion.div>
          ))
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {loading ? (
            // Skeleton for charts
            <>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <Skeleton className="h-6 w-64 mb-4" />
                <Skeleton className="h-[300px] w-full" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            </>
          ) : (
            <>
          {/* Reports Over Time */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Reports Activity (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2} name="New Reports" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Reports by Category */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reports by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#f59e0b" name="Reports" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
            </>
          )}
        </div>

        {/* Recent Reports Table */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Reports</h3>
            <Link href="/admin/reports">
              <button className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold">
                View All →
              </button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : recentReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  recentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{getIconEmoji(report.category.icon)}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{report.category.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">{report.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {report.location_address || 'No location'}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
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
