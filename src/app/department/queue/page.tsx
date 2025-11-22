'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Phone,
  User,
  Calendar,
  BarChart3,
  LogOut,
  Monitor,
  UserPlus,
  ArrowRight,
  Pause,
  Play,
  Building2,
  FileText,
  Bell,
  Settings,
  ArrowUpDown,
  Search,
  Edit,
  MessageSquare,
  Star,
  Send,
  MoreVertical,
  Timer,
  TrendingUp,
  Megaphone,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type AppointmentStatus = 'pending' | 'checked_in' | 'serving' | 'in_progress' | 'completed' | 'no_show' | 'missed' | 'cancelled';

type Appointment = {
  id: string;
  citizen_id: string;
  department_id: string;
  appointment_date: string;
  slot_start: string;
  slot_end: string;
  status: AppointmentStatus;
  ticket_number: string;
  purpose: string;
  is_walk_in: boolean;
  checked_in_at: string | null;
  serving_started_at: string | null;
  completed_at: string | null;
  qr_code: string;
  created_at: string;
  citizen: {
    full_name: string;
    mobile_number: string;
  };
};

type DepartmentSettings = {
  can_receive_appointments: boolean;
  allow_walk_ins: boolean;
  daily_appointment_limit: number;
  require_qr_checkin: boolean;
};

export default function DepartmentQueuePage() {
  const router = useRouter();
  const [department, setDepartment] = useState<any>(null);
  const [settings, setSettings] = useState<DepartmentSettings | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    waiting: 0,
    serving: 0,
    completed: 0,
    noShow: 0
  });
  const [selectedTab, setSelectedTab] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'upcoming' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'ticket' | 'name' | 'time' | 'date' | 'status'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [avgWaitTime, setAvgWaitTime] = useState(0);
  const [avgServiceTime, setAvgServiceTime] = useState(0);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInPurpose, setWalkInPurpose] = useState('');
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  
  // Transfer modal state
  const [allDepartments, setAllDepartments] = useState<any[]>([]);

  useEffect(() => {
    loadDepartmentData();
  }, []);

  useEffect(() => {
    if (!department) return;

    loadTodayAppointments();

    // Realtime subscription for appointments
    const subscription = supabase.then(client => 
      client
        .channel('department_appointments')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'appointments' },
          () => loadTodayAppointments()
        )
        .subscribe()
    );

    return () => {
      subscription.then(sub => sub.unsubscribe());
    };
  }, [department, dateFilter]);

  useEffect(() => {
    if (appointments.length > 0) {
      calculateMetrics();
    }
  }, [appointments]);

  async function loadDepartmentData() {
    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        router.push('/department/login');
        return;
      }

      // Get user's department assignment
      const { data: deptAssignment } = await client
        .from('department_users')
        .select(`
          department:departments(id, name, description)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!deptAssignment?.department) {
        router.push('/department/login');
        return;
      }

      const dept = Array.isArray(deptAssignment.department) 
        ? deptAssignment.department[0] 
        : deptAssignment.department;

      setDepartment(dept);

      // Load settings
      const { data: settingsData } = await client
        .from('department_settings')
        .select('*')
        .eq('department_id', dept.id)
        .single();

      setSettings(settingsData);
      
      // Load all departments for transfer modal
      const { data: depts } = await client
        .from('departments')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      setAllDepartments(depts || []);
    } catch (error) {
      console.error('Error loading department:', error);
    }
  }

  async function loadTodayAppointments() {
    if (!department) return;

    try {
      const client = await supabase;
      const today = new Date().toISOString().split('T')[0];

      console.log('Loading appointments for:', {
        department_id: department.id,
        department_name: department.name,
        filter: dateFilter
      });

      let query = client
        .from('appointments')
        .select('*')
        .eq('department_id', department.id);

      // Apply date filter based on selection
      if (dateFilter === 'today') {
        query = query.eq('appointment_date', today);
      } else if (dateFilter === 'upcoming') {
        query = query.gte('appointment_date', today);
      }
      // 'all' = no date filter

      const { data, error } = await query.order('appointment_date', { ascending: true })
        .order('time_slot_start', { ascending: true });

      if (error) {
        console.error('Error loading appointments:', error);
        setLoading(false);
        return;
      }

      console.log('Appointments loaded:', data?.length || 0, 'records');

      // Map the data to match our component's expected structure
      const mappedData = (data || []).map(apt => ({
        ...apt,
        slot_start: apt.time_slot_start,
        slot_end: apt.time_slot_end,
        serving_started_at: apt.called_at,
        citizen: {
          full_name: apt.full_name,
          mobile_number: apt.contact_number
        }
      }));

      setAppointments(mappedData);
      
      // Calculate stats - using app team's status names
      const waiting = mappedData.filter(a => ['pending', 'checked_in'].includes(a.status)).length;
      const serving = mappedData.filter(a => a.status === 'in_progress').length;
      const completed = mappedData.filter(a => a.status === 'completed').length;
      const noShow = mappedData.filter(a => a.status === 'missed').length;

      setStats({ waiting, serving, completed, noShow });
      setLoading(false);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setLoading(false);
    }
  }

  async function handleCallNext() {
    const nextAppointment = appointments.find(a => a.status === 'checked_in');
    if (!nextAppointment) {
      toast.error('No checked-in appointments to call');
      return;
    }

    try {
      const client = await supabase;
      await client
        .from('appointments')
        .update({
          status: 'serving',
          serving_started_at: new Date().toISOString()
        })
        .eq('id', nextAppointment.id);

      toast.success(`Now serving ${nextAppointment.ticket_number} - ${nextAppointment.citizen.full_name}`);
      await loadTodayAppointments();
    } catch (error) {
      console.error('Error calling next:', error);
      toast.error('Failed to call next appointment');
    }
  }

  async function handleCompleteAppointment(appointmentId: string) {
    try {
      const client = await supabase;
      const appointment = appointments.find(a => a.id === appointmentId);
      
      await client
        .from('appointments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      toast.success(`Appointment ${appointment?.ticket_number} completed`);
      await loadTodayAppointments();
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast.error('Failed to complete appointment');
    }
  }

  async function handleMarkNoShow(appointmentId: string) {
    if (!confirm('Mark this appointment as no-show?')) return;

    try {
      const client = await supabase;
      const appointment = appointments.find(a => a.id === appointmentId);
      
      await client
        .from('appointments')
        .update({ status: 'no_show' })
        .eq('id', appointmentId);

      toast.warning(`Marked ${appointment?.ticket_number} as no-show`);
      await loadTodayAppointments();
    } catch (error) {
      console.error('Error marking no-show:', error);
      toast.error('Failed to mark as no-show');
    }
  }

  async function handleCheckIn(appointmentId: string) {
    try {
      const client = await supabase;
      const appointment = appointments.find(a => a.id === appointmentId);
      
      await client
        .from('appointments')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      toast.success(`${appointment?.citizen.full_name} checked in successfully`);
      await loadTodayAppointments();
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in');
    }
  }
  
  async function handleSubmitWalkIn() {
    if (!walkInName.trim() || !walkInPhone.trim() || !walkInPurpose.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmittingWalkIn(true);
    
    try {
      const client = await supabase;
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
      
      // Generate ticket number
      const { data: existingAppointments } = await client
        .from('appointments')
        .select('ticket_number')
        .eq('department_id', department.id)
        .eq('appointment_date', today)
        .order('created_at', { ascending: false })
        .limit(1);
      
      let ticketNum = 1;
      if (existingAppointments && existingAppointments.length > 0) {
        const lastTicket = existingAppointments[0].ticket_number;
        const lastNum = parseInt(lastTicket.split('-')[1]);
        ticketNum = lastNum + 1;
      }
      
      const departmentPrefix = department.name.charAt(0).toUpperCase();
      const ticketNumber = `${departmentPrefix}-${String(ticketNum).padStart(3, '0')}`;
      
      // Create walk-in appointment
      const { error } = await client
        .from('appointments')
        .insert({
          department_id: department.id,
          citizen_id: null, // Walk-ins don't have user accounts
          full_name: walkInName,
          contact_number: walkInPhone,
          purpose: walkInPurpose,
          appointment_date: today,
          slot_start: currentTime,
          slot_end: currentTime,
          ticket_number: ticketNumber,
          status: 'checked_in', // Auto check-in walk-ins
          is_walk_in: true,
          checked_in_at: new Date().toISOString(),
          qr_code: `WALKIN-${ticketNumber}`
        });
      
      if (error) throw error;
      
      toast.success(`Walk-in added: ${ticketNumber} - ${walkInName}`);
      setShowWalkInForm(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInPurpose('');
      await loadTodayAppointments();
    } catch (error) {
      console.error('Error adding walk-in:', error);
      toast.error('Failed to add walk-in appointment');
    } finally {
      setIsSubmittingWalkIn(false);
    }
  }

  async function handleReschedule(appointmentId: string, newDate: string, newTimeStart: string, newTimeEnd: string) {
    try {
      const client = await supabase;
      await client
        .from('appointments')
        .update({
          appointment_date: newDate,
          time_slot_start: newTimeStart,
          time_slot_end: newTimeEnd
        })
        .eq('id', appointmentId);

      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      await loadTodayAppointments();
    } catch (error) {
      console.error('Error rescheduling:', error);
    }
  }

  async function handleAddNotes(appointmentId: string, notes: string) {
    try {
      const client = await supabase;
      await client
        .from('appointments')
        .update({ notes })
        .eq('id', appointmentId);

      setShowNotesModal(false);
      setSelectedAppointment(null);
      setAppointmentNotes('');
      await loadTodayAppointments();
    } catch (error) {
      console.error('Error adding notes:', error);
    }
  }

  async function handlePriorityOverride(appointmentId: string) {
    if (!confirm('Move this appointment to priority queue?')) return;

    try {
      const client = await supabase;
      await client
        .from('appointments')
        .update({
          is_priority: true,
          priority_set_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      await loadTodayAppointments();
    } catch (error) {
      console.error('Error setting priority:', error);
    }
  }

  async function handleTransfer(appointmentId: string, newDepartmentId: string) {
    try {
      const client = await supabase;
      await client
        .from('appointments')
        .update({
          department_id: newDepartmentId,
          status: 'pending'
        })
        .eq('id', appointmentId);

      setShowTransferModal(false);
      setSelectedAppointment(null);
      await loadTodayAppointments();
    } catch (error) {
      console.error('Error transferring:', error);
    }
  }

  async function handleCancelAppointment(appointmentId: string) {
    if (!confirm('Cancel this appointment?')) return;

    try {
      const client = await supabase;
      await client
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      await loadTodayAppointments();
    } catch (error) {
      console.error('Error cancelling:', error);
    }
  }

  function calculateMetrics() {
    const checkedInAppts = appointments.filter(a => a.checked_in_at && a.serving_started_at);
    if (checkedInAppts.length > 0) {
      const totalWaitTime = checkedInAppts.reduce((sum, apt) => {
        const wait = new Date(apt.serving_started_at!).getTime() - new Date(apt.checked_in_at!).getTime();
        return sum + wait;
      }, 0);
      setAvgWaitTime(Math.round(totalWaitTime / checkedInAppts.length / 60000)); // in minutes
    }

    const completedAppts = appointments.filter(a => a.serving_started_at && a.completed_at);
    if (completedAppts.length > 0) {
      const totalServiceTime = completedAppts.reduce((sum, apt) => {
        const service = new Date(apt.completed_at!).getTime() - new Date(apt.serving_started_at!).getTime();
        return sum + service;
      }, 0);
      setAvgServiceTime(Math.round(totalServiceTime / completedAppts.length / 60000)); // in minutes
    }
  }

  function togglePause() {
    setIsPaused(!isPaused);
  }

  function generateDailyReport() {
    const headers = ['Ticket', 'Name', 'Phone', 'Purpose', 'Date', 'Time Slot', 'Status', 'Check-in', 'Service Started', 'Completed'];
    const rows = appointments.map(apt => [
      apt.ticket_number,
      apt.citizen.full_name,
      apt.citizen.mobile_number,
      apt.purpose,
      apt.appointment_date,
      `${apt.slot_start} - ${apt.slot_end}`,
      apt.status,
      apt.checked_in_at || '',
      apt.serving_started_at || '',
      apt.completed_at || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function getStatusBadge(status: AppointmentStatus) {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: Clock },
      checked_in: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Waiting', icon: Users },
      serving: { bg: 'bg-green-100', text: 'text-green-700', label: 'Serving', icon: ArrowRight },
      in_progress: { bg: 'bg-green-100', text: 'text-green-700', label: 'In Progress', icon: ArrowRight },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed', icon: CheckCircle },
      no_show: { bg: 'bg-red-100', text: 'text-red-700', label: 'No Show', icon: XCircle },
      missed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Missed', icon: XCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled', icon: XCircle }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading queue...</p>
        </div>
      </div>
    );
  }

  const queueAppointments = appointments.filter(a => ['pending', 'checked_in', 'serving'].includes(a.status));
  const completedAppointments = appointments.filter(a => ['completed', 'no_show'].includes(a.status));
  const currentlyServing = appointments.find(a => a.status === 'serving');

  // Filter by search query
  const filteredAppointments = queueAppointments.filter(appointment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      appointment.ticket_number.toLowerCase().includes(query) ||
      appointment.citizen.full_name.toLowerCase().includes(query) ||
      appointment.citizen.mobile_number.includes(query) ||
      appointment.purpose.toLowerCase().includes(query)
    );
  });

  // Sort appointments
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'ticket':
        comparison = a.ticket_number.localeCompare(b.ticket_number);
        break;
      case 'name':
        comparison = a.citizen.full_name.localeCompare(b.citizen.full_name);
        break;
      case 'time':
        comparison = a.slot_start.localeCompare(b.slot_start);
        break;
      case 'date':
        comparison = a.appointment_date.localeCompare(b.appointment_date);
        break;
      case 'status':
        const statusOrder = { pending: 0, checked_in: 1, serving: 2, in_progress: 3, completed: 4, no_show: 5, missed: 6, cancelled: 7 };
        comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Handle sort column click
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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
              <Link href="/department/queue">
                <div className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-50 text-blue-700 font-medium whitespace-nowrap">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Waiting</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.waiting}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Serving</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.serving}</p>
              </div>
              <ArrowRight className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-gray-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">No Show</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.noShow}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Avg Wait Time</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{avgWaitTime} min</p>
              </div>
              <Timer className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Avg Service Time</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{avgServiceTime} min</p>
              </div>
              <TrendingUp className="w-12 h-12 text-indigo-500 opacity-20" />
            </div>
          </motion.div>
        </div>

        {/* Currently Serving */}
        {currentlyServing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-2xl p-8 mb-8 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-2">NOW SERVING</p>
                <h2 className="text-5xl font-bold mb-3">{currentlyServing.ticket_number}</h2>
                <p className="text-xl font-semibold">{currentlyServing.citizen.full_name}</p>
                <p className="text-green-100 mt-2">{currentlyServing.purpose}</p>
              </div>
              <div className="text-right">
                <button
                  onClick={() => handleCompleteAppointment(currentlyServing.id)}
                  className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-all shadow-lg"
                >
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Complete
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons Row 1 */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleCallNext}
            disabled={!appointments.find(a => a.status === 'checked_in') || isPaused}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
          >
            <Phone className="w-6 h-6" />
            Call Next in Queue
          </button>

          <button
            onClick={togglePause}
            className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold shadow-lg transition-all ${
              isPaused 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button
            onClick={() => setShowQrScanner(true)}
            className="flex items-center gap-2 px-6 py-4 bg-white text-blue-600 border-2 border-blue-500 rounded-xl font-semibold hover:bg-blue-50 shadow-lg"
          >
            <QrCode className="w-6 h-6" />
            Scan QR
          </button>

          {settings?.allow_walk_ins && (
            <button
              onClick={() => setShowWalkInForm(true)}
              className="flex items-center gap-2 px-6 py-4 bg-white text-blue-600 border-2 border-blue-500 rounded-xl font-semibold hover:bg-blue-50 shadow-lg"
            >
              <UserPlus className="w-6 h-6" />
              Walk-In
            </button>
          )}
        </div>

        {/* Action Buttons Row 2 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowAnnouncementModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 shadow-lg"
          >
            <Megaphone className="w-5 h-5" />
            Make Announcement
          </button>

          <button
            onClick={() => {
              const csv = generateDailyReport();
              downloadCSV(csv, `queue-report-${new Date().toISOString().split('T')[0]}.csv`);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 shadow-lg"
          >
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>

        {isPaused && (
          <div className="mb-6 p-4 bg-orange-100 border-l-4 border-orange-500 rounded-lg">
            <div className="flex items-center gap-2">
              <Pause className="w-5 h-5 text-orange-700" />
              <p className="text-orange-700 font-semibold">Queue is paused. New appointments cannot be called.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-lg">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setSelectedTab('today'); setDateFilter('today'); }}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                selectedTab === 'today'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Today's Queue ({queueAppointments.length})
            </button>
            <button
              onClick={() => { setSelectedTab('upcoming'); setDateFilter('upcoming'); }}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                selectedTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setSelectedTab('completed')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                selectedTab === 'completed'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Completed ({completedAppointments.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="px-6 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ticket, name, phone, or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Queue List */}
          <div className="p-6">
            {selectedTab === 'today' || selectedTab === 'upcoming' ? (
              <div>
                {sortedAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      {searchQuery ? 'No appointments match your search' : 'No appointments in queue'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10">
                        <tr>
                          <th 
                            onClick={() => handleSort('ticket')} 
                            className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              Ticket
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('name')} 
                            className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              Citizen
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Purpose</th>
                          <th 
                            onClick={() => handleSort('time')} 
                            className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              Time
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('date')} 
                            className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              Date
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('status')} 
                            className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              Status
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sortedAppointments.map((appointment, index) => (
                          <motion.tr
                            key={appointment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`hover:bg-gray-50 transition-colors ${
                              appointment.status === 'in_progress' ? 'bg-green-50' : ''
                            }`}
                          >
                            {/* Ticket Number */}
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <div className="text-xl font-bold text-blue-600">
                                  {appointment.ticket_number}
                                </div>
                                {appointment.is_walk_in && (
                                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                                    Walk-in
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Citizen Info */}
                            <td className="px-4 py-2">
                              <div>
                                <p className="font-semibold text-gray-800">{appointment.citizen.full_name}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                  <Phone className="w-3 h-3" />
                                  {appointment.citizen.mobile_number}
                                </p>
                              </div>
                            </td>

                            {/* Purpose */}
                            <td className="px-4 py-2">
                              <p className="text-sm text-gray-700 max-w-xs truncate" title={appointment.purpose}>
                                {appointment.purpose}
                              </p>
                            </td>

                            {/* Time Slot */}
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1 text-sm text-gray-700">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{appointment.slot_start}</span>
                                <span className="text-gray-400">-</span>
                                <span className="font-medium">{appointment.slot_end}</span>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1 text-sm text-gray-700">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {new Date(appointment.appointment_date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: new Date(appointment.appointment_date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                })}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-2">
                              {getStatusBadge(appointment.status)}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-2">
                              <div className="flex items-center justify-center gap-2">
                                {appointment.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleCheckIn(appointment.id)}
                                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm"
                                      title="Mark citizen as arrived and checked in"
                                    >
                                      Check In
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setShowActionsModal(true);
                                      }}
                                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </>
                                )}

                                {appointment.status === 'checked_in' && (
                                  <>
                                    <button
                                      onClick={() => handleMarkNoShow(appointment.id)}
                                      className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium text-sm"
                                    >
                                      No Show
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setShowActionsModal(true);
                                      }}
                                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </>
                                )}

                                {appointment.status === 'in_progress' && (
                                  <>
                                    <button
                                      onClick={() => handleCompleteAppointment(appointment.id)}
                                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm"
                                    >
                                      Complete
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setShowActionsModal(true);
                                      }}
                                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {completedAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No completed appointments yet</p>
                  </div>
                ) : (
                  completedAppointments.map((appointment, index) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 rounded-xl bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-gray-400">
                            {appointment.ticket_number}
                          </div>
                          <div className="border-l pl-4">
                            <h3 className="font-semibold text-gray-700">
                              {appointment.citizen.full_name}
                            </h3>
                            <p className="text-gray-500 text-sm">{appointment.purpose}</p>
                            {appointment.completed_at && (
                              <p className="text-xs text-gray-400 mt-1">
                                Completed at {new Date(appointment.completed_at).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Reschedule Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                <input
                  type="date"
                  id="reschedule-date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Start</label>
                <input
                  type="time"
                  id="reschedule-time-start"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time End</label>
                <input
                  type="time"
                  id="reschedule-time-end"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const date = (document.getElementById('reschedule-date') as HTMLInputElement).value;
                  const timeStart = (document.getElementById('reschedule-time-start') as HTMLInputElement).value;
                  const timeEnd = (document.getElementById('reschedule-time-end') as HTMLInputElement).value;
                  if (date && timeStart && timeEnd) {
                    handleReschedule(selectedAppointment.id, date, timeStart, timeEnd);
                  }
                }}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedAppointment(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Add Notes</h3>
            <textarea
              value={appointmentNotes}
              onChange={(e) => setAppointmentNotes(e.target.value)}
              placeholder="Enter notes about this appointment..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32 resize-none"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleAddNotes(selectedAppointment.id, appointmentNotes)}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
              >
                Save Notes
              </button>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedAppointment(null);
                  setAppointmentNotes('');
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Transfer Appointment</h3>
            <p className="text-gray-600 mb-4">Transfer {selectedAppointment.citizen.full_name} to another department?</p>
            <select
              id="transfer-department"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-6"
            >
              <option value="">Select Department</option>
              {allDepartments.filter(d => d.id !== department?.id).map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const deptId = (document.getElementById('transfer-department') as HTMLSelectElement).value;
                  if (deptId) {
                    handleTransfer(selectedAppointment.id, deptId);
                  }
                }}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
              >
                Transfer
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedAppointment(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Make Announcement</h3>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Enter your announcement message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32 resize-none"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  // Broadcast announcement to display board
                  alert('Announcement sent: ' + announcement);
                  setShowAnnouncementModal(false);
                  setAnnouncement('');
                }}
                className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600"
              >
                Broadcast
              </button>
              <button
                onClick={() => {
                  setShowAnnouncementModal(false);
                  setAnnouncement('');
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions Modal */}
      {showActionsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Appointment Actions</h3>
              <button
                onClick={() => {
                  setShowActionsModal(false);
                  setSelectedAppointment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Ticket</p>
              <p className="text-xl font-bold text-blue-600">{selectedAppointment.ticket_number}</p>
              <p className="text-lg font-semibold text-gray-800 mt-2">{selectedAppointment.citizen.full_name}</p>
              <p className="text-sm text-gray-600">{selectedAppointment.purpose}</p>
            </div>

            <div className="space-y-3">
              {selectedAppointment.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowActionsModal(false);
                      setShowRescheduleModal(true);
                    }}
                    className="w-full px-4 py-3 text-left bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Reschedule</p>
                      <p className="text-sm text-gray-500">Change date and time</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handlePriorityOverride(selectedAppointment.id);
                      setShowActionsModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="w-full px-4 py-3 text-left bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-semibold text-gray-800">Set Priority</p>
                      <p className="text-sm text-gray-500">Move to priority queue</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowActionsModal(false);
                      setShowTransferModal(true);
                    }}
                    className="w-full px-4 py-3 text-left bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Send className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-gray-800">Transfer</p>
                      <p className="text-sm text-gray-500">Move to another department</p>
                    </div>
                  </button>
                </>
              )}

              {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'checked_in') && (
                <button
                  onClick={() => {
                    setShowActionsModal(false);
                    setShowNotesModal(true);
                  }}
                  className="w-full px-4 py-3 text-left bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-semibold text-gray-800">Add Notes</p>
                    <p className="text-sm text-gray-500">Internal notes or comments</p>
                  </div>
                </button>
              )}

              {selectedAppointment.status === 'checked_in' && (
                <button
                  onClick={() => {
                    handlePriorityOverride(selectedAppointment.id);
                    setShowActionsModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="w-full px-4 py-3 text-left bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Star className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-semibold text-gray-800">Set Priority</p>
                    <p className="text-sm text-gray-500">Move to priority queue</p>
                  </div>
                </button>
              )}

              {selectedAppointment.status === 'in_progress' && (
                <button
                  onClick={() => {
                    setShowActionsModal(false);
                    setShowNotesModal(true);
                  }}
                  className="w-full px-4 py-3 text-left bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-semibold text-gray-800">Add Notes</p>
                    <p className="text-sm text-gray-500">Internal notes or comments</p>
                  </div>
                </button>
              )}

              {selectedAppointment.status === 'pending' && (
                <button
                  onClick={() => {
                    handleCancelAppointment(selectedAppointment.id);
                    setShowActionsModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="w-full px-4 py-3 text-left bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-3 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-700">Cancel Appointment</p>
                    <p className="text-sm text-red-600">Permanently cancel</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Walk-In Form Modal */}
      {showWalkInForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Add Walk-In Appointment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Enter citizen name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="09XXXXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose of Visit *
                </label>
                <textarea
                  value={walkInPurpose}
                  onChange={(e) => setWalkInPurpose(e.target.value)}
                  placeholder="Describe the purpose..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Walk-in appointment will be auto-checked in and added to the queue immediately.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmitWalkIn}
                disabled={isSubmittingWalkIn}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingWalkIn ? 'Adding...' : 'Add to Queue'}
              </button>
              <button
                onClick={() => {
                  setShowWalkInForm(false);
                  setWalkInName('');
                  setWalkInPhone('');
                  setWalkInPurpose('');
                }}
                disabled={isSubmittingWalkIn}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
