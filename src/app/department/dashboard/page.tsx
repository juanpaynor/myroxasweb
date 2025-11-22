'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2,
  FileText, 
  Settings, 
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MapPin,
  User,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type DepartmentInfo = {
  id: string;
  name: string;
  role: 'head' | 'staff';
};

type ReportWithCategory = {
  id: string;
  title: string;
  location_address: string | null;
  status: string;
  urgency: string;
  created_at: string;
  category: {
    name: string;
  } | null;
};

export default function DepartmentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [recentReports, setRecentReports] = useState<ReportWithCategory[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0
  });
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();

      if (!user) {
        router.push('/department/login');
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await client
        .from('user_profiles')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single();

      if (profileError || profile.role !== 'department') {
        router.push('/department/login');
        return;
      }

      setUserInfo({ name: profile.full_name, email: profile.email });

      // Get user's department assignments
      const { data: deptAssignments, error: deptError } = await client
        .from('department_users')
        .select(`
          role,
          is_active,
          department:departments(id, name)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (deptError) throw deptError;

      const depts = deptAssignments?.map((assignment: any) => ({
        id: assignment.department.id,
        name: assignment.department.name,
        role: assignment.role
      })) || [];

      setDepartments(depts);

      if (depts.length > 0) {
        const departmentIds = depts.map(d => d.id);
        await fetchReportsStats(departmentIds);
        await fetchRecentReports(departmentIds);
      }

      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/department/login');
    }
  }

  async function fetchReportsStats(departmentIds: string[]) {
    try {
      const client = await supabase;
      
      // Get all reports for user's departments
      let query = client.from('reports').select('status');
      
      if (departmentIds.length === 1) {
        query = query.eq('department_id', departmentIds[0]);
      } else {
        query = query.in('department_id', departmentIds);
      }

      const { data: reports, error } = await query;

      if (error) {
        console.error('Stats query error:', error);
        throw error;
      }

      const total = reports?.length || 0;
      const pending = reports?.filter(r => r.status === 'pending').length || 0;
      const in_progress = reports?.filter(r => r.status === 'in_progress').length || 0;
      const completed = reports?.filter(r => r.status === 'completed').length || 0;

      setStats({ total, pending, in_progress, completed });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function fetchRecentReports(departmentIds: string[]) {
    try {
      const client = await supabase;
      
      let query = client
        .from('reports')
        .select(`
          id,
          title,
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
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Recent reports query error:', error);
        throw error;
      }
      setRecentReports((data as any) || []);
    } catch (error) {
      console.error('Error fetching recent reports:', error);
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
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  function getUrgencyColor(urgency: string) {
    switch (urgency) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-12">
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
                <div className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-50 text-blue-700 font-medium whitespace-nowrap">
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
              <Link href="/department/queue">
                <div className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors whitespace-nowrap">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden md:inline text-sm">Queue</span>
                </div>
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {userInfo?.name}</h2>
          <p className="text-gray-600">Here's an overview of your assigned reports</p>
          
          {/* Department Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {departments.map((dept) => (
              <span
                key={dept.id}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {dept.name}
                {dept.role === 'head' && ' (Head)'}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-600">Total Reports</p>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">All assigned reports</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-600">Pending</p>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-600">In Progress</p>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.in_progress}</p>
            <p className="text-xs text-gray-500 mt-1">Currently working on</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-600">Completed</p>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            <p className="text-xs text-gray-500 mt-1">Successfully resolved</p>
          </motion.div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Recent Reports</h3>
              <Link
                href="/department/reports"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No reports assigned yet</p>
              </div>
            ) : (
              recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/department/reports/${report.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{report.title}</h4>
                      {report.location_address && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {report.location_address}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ')}
                        </span>
                        {report.category && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            {report.category.name}
                          </span>
                        )}
                        <span className={`text-xs font-semibold ${getUrgencyColor(report.urgency)}`}>
                          {report.urgency.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
