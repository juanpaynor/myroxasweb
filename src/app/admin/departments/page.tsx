'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Users,
  Settings, 
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Briefcase,
  FolderKanban,
  Building2,
  Shield,
  Clock,
  Calendar,
  User,
  LogOut,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Department = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  department_head_id: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  department_head?: {
    full_name: string;
  } | null;
};

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export default function AdminDepartments() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [message, setMessage] = useState('');
  
  // Appointment settings state
  const [showAppointmentSettings, setShowAppointmentSettings] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [appointmentSettings, setAppointmentSettings] = useState<any>(null);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Time slot editing state
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Closed dates state
  const [closedDates, setClosedDates] = useState<any[]>([]);
  const [newClosedDate, setNewClosedDate] = useState('');
  const [closedDateReason, setClosedDateReason] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_head_id: '',
    is_active: true,
    display_order: 0
  });



  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  async function fetchDepartments() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('departments')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Fetch department heads separately
      const departmentsWithHeads = await Promise.all(
        (data || []).map(async (dept) => {
          if (!dept.department_head_id) return dept;

          const { data: headData } = await client
            .from('user_profiles')
            .select('full_name')
            .eq('id', dept.department_head_id)
            .single();

          return {
            ...dept,
            department_head: headData ? { full_name: headData.full_name } : null
          };
        })
      );

      setDepartments(departmentsWithHeads);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setMessage('Error loading departments');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const client = await supabase;
      const { data, error } = await client
        .from('user_profiles')
        .select('id, full_name, email, role')
        .in('role', ['admin', 'csm', 'department'])
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  function openCreateModal() {
    setEditingDepartment(null);
    setFormData({
      name: '',
      description: '',
      department_head_id: '',
      is_active: true,
      display_order: departments.length
    });
    setShowModal(true);
    setMessage('');
  }

  function openEditModal(department: Department) {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      department_head_id: department.department_head_id || '',
      is_active: department.is_active,
      display_order: department.display_order
    });
    setShowModal(true);
    setMessage('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    try {
      const client = await supabase;

      const payload = {
        name: formData.name,
        description: formData.description || null,
        department_head_id: formData.department_head_id || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
        updated_at: new Date().toISOString()
      };

      if (editingDepartment) {
        // Update existing department
        const { error } = await client
          .from('departments')
          .update(payload)
          .eq('id', editingDepartment.id);

        if (error) throw error;
        setMessage('Department updated successfully');
      } else {
        // Create new department
        const { error } = await client
          .from('departments')
          .insert([payload]);

        if (error) throw error;
        setMessage('Department created successfully');
      }

      setShowModal(false);
      fetchDepartments();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    }
  }

  async function handleToggleActive(department: Department) {
    try {
      const client = await supabase;
      const { error } = await client
        .from('departments')
        .update({ 
          is_active: !department.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', department.id);

      if (error) throw error;
      fetchDepartments();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    }
  }

  async function handleDelete(department: Department) {
    if (!confirm(`Are you sure you want to delete "${department.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const client = await supabase;

      // Check if department has assigned reports
      const { data: reports } = await client
        .from('reports')
        .select('id')
        .eq('department_id', department.id)
        .limit(1);

      if (reports && reports.length > 0) {
        setMessage('Cannot delete department with assigned reports. Deactivate it instead.');
        return;
      }

      const { error } = await client
        .from('departments')
        .delete()
        .eq('id', department.id);

      if (error) throw error;
      setMessage('Department deleted successfully');
      fetchDepartments();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
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

  async function openAppointmentSettings(department: Department) {
    setSelectedDepartment(department);
    setShowAppointmentSettings(true);
    
    try {
      const client = await supabase;

      // Fetch or create settings
      let { data: settingsData } = await client
        .from('department_settings')
        .select('*')
        .eq('department_id', department.id)
        .single();

      if (!settingsData) {
        const { data: newSettings } = await client
          .from('department_settings')
          .insert({
            department_id: department.id,
            can_receive_appointments: false,
            daily_appointment_limit: 50,
            allow_same_day: false,
            min_days_advance: 1,
            max_days_advance: 30,
            require_qr_checkin: false,
            operating_start: '08:00',
            operating_end: '17:00',
            lunch_break_start: '12:00',
            lunch_break_end: '13:00'
          })
          .select()
          .single();
        settingsData = newSettings;
      }

      setAppointmentSettings(settingsData);

      // Fetch time slots
      const { data: slotsData } = await client
        .from('department_time_slots')
        .select('*')
        .eq('department_id', department.id)
        .order('slot_start');

      setTimeSlots(slotsData || []);
      
      // Fetch closed dates
      const { data: closedData } = await client
        .from('department_closed_dates')
        .select('*')
        .eq('department_id', department.id)
        .order('closed_date');

      setClosedDates(closedData || []);
    } catch (error) {
      console.error('Error fetching appointment settings:', error);
    }
  }

  async function handleSaveAppointmentSettings() {
    if (!appointmentSettings) return;

    setSavingSettings(true);
    try {
      const client = await supabase;

      const { error } = await client
        .from('department_settings')
        .update({
          can_receive_appointments: appointmentSettings.can_receive_appointments,
          daily_appointment_limit: appointmentSettings.daily_appointment_limit,
          allow_same_day: appointmentSettings.allow_same_day,
          min_days_advance: appointmentSettings.min_days_advance,
          max_days_advance: appointmentSettings.max_days_advance,
          require_qr_checkin: appointmentSettings.require_qr_checkin,
          operating_start: appointmentSettings.operating_start,
          operating_end: appointmentSettings.operating_end,
          lunch_break_start: appointmentSettings.lunch_break_start,
          lunch_break_end: appointmentSettings.lunch_break_end
        })
        .eq('id', appointmentSettings.id);

      if (error) throw error;

      setMessage('Appointment settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleGenerateSlots(duration: number) {
    if (!selectedDepartment || !appointmentSettings || !confirm(`Generate ${duration}-minute slots? This will replace existing slots.`)) return;

    try {
      const client = await supabase;

      await client
        .from('department_time_slots')
        .delete()
        .eq('department_id', selectedDepartment.id);

      const slots: any[] = [];
      let currentTime = parseTime(appointmentSettings.operating_start);
      const endTime = parseTime(appointmentSettings.operating_end);
      const lunchStart = parseTime(appointmentSettings.lunch_break_start);
      const lunchEnd = parseTime(appointmentSettings.lunch_break_end);

      while (currentTime < endTime) {
        const slotEnd = currentTime + duration;
        
        if (!(currentTime >= lunchStart && currentTime < lunchEnd)) {
          slots.push({
            department_id: selectedDepartment.id,
            slot_start: formatTime(currentTime),
            slot_end: formatTime(slotEnd),
            max_appointments: 2,
            day_of_week: [1, 2, 3, 4, 5],
            is_active: true
          });
        }

        currentTime = slotEnd;
      }

      const { error } = await client
        .from('department_time_slots')
        .insert(slots);

      if (error) throw error;

      const { data: newSlots } = await client
        .from('department_time_slots')
        .select('*')
        .eq('department_id', selectedDepartment.id)
        .order('slot_start');

      setTimeSlots(newSlots || []);
      setMessage(`Generated ${slots.length} time slots!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error generating slots:', error);
      setMessage('Failed to generate slots');
    }
  }

  function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  function getDayName(dayNum: number): string {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[dayNum - 1];
  }

  async function handleDeleteSlot(slotId: string) {
    if (!confirm('Delete this time slot?')) return;
    
    try {
      const client = await supabase;
      const { error } = await client
        .from('department_time_slots')
        .delete()
        .eq('id', slotId);
      
      if (error) throw error;
      
      setTimeSlots(timeSlots.filter(slot => slot.id !== slotId));
      toast.success('Time slot deleted');
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Failed to delete slot');
    }
  }

  async function handleToggleSlot(slotId: string) {
    try {
      const client = await supabase;
      const slot = timeSlots.find(s => s.id === slotId);
      
      const { error } = await client
        .from('department_time_slots')
        .update({ is_active: !slot.is_active })
        .eq('id', slotId);
      
      if (error) throw error;
      
      setTimeSlots(timeSlots.map(s => 
        s.id === slotId ? { ...s, is_active: !s.is_active } : s
      ));
      toast.success(`Slot ${slot.is_active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      console.error('Error toggling slot:', error);
      toast.error('Failed to update slot');
    }
  }

  function openEditSlot(slot: any) {
    setEditingSlot(slot);
    setShowEditSlotModal(true);
  }
  
  // Closed dates handlers
  async function handleAddClosedDate() {
    if (!newClosedDate || !selectedDepartment) {
      toast.error('Please select a date');
      return;
    }
    
    try {
      const client = await supabase;
      const { error } = await client
        .from('department_closed_dates')
        .insert([{
          department_id: selectedDepartment.id,
          closed_date: newClosedDate,
          reason: closedDateReason || null
        }]);
      
      if (error) throw error;
      
      // Reload closed dates
      const { data: closedData } = await client
        .from('department_closed_dates')
        .select('*')
        .eq('department_id', selectedDepartment.id)
        .order('closed_date');
      
      setClosedDates(closedData || []);
      setNewClosedDate('');
      setClosedDateReason('');
      toast.success('Closed date added');
    } catch (error) {
      console.error('Error adding closed date:', error);
      toast.error('Failed to add closed date');
    }
  }
  
  async function handleDeleteClosedDate(closedDateId: string) {
    if (!confirm('Remove this closed date?')) return;
    
    try {
      const client = await supabase;
      const { error } = await client
        .from('department_closed_dates')
        .delete()
        .eq('id', closedDateId);
      
      if (error) throw error;
      
      setClosedDates(closedDates.filter(d => d.id !== closedDateId));
      toast.success('Closed date removed');
    } catch (error) {
      console.error('Error deleting closed date:', error);
      toast.error('Failed to remove closed date');
    }
  }

  async function generateSampleData() {
    if (!confirm('Generate 20 sample appointments for testing? This will add fake data.')) return;
    
    try {
      const client = await supabase;
      const today = new Date();
      const sampleNames = [
        'Juan Dela Cruz', 'Maria Santos', 'Pedro Rodriguez', 'Ana Garcia', 'Jose Martinez',
        'Carmen Lopez', 'Miguel Torres', 'Sofia Reyes', 'Carlos Morales', 'Isabella Hernandez',
        'Diego Jimenez', 'Valentina Ruiz', 'Alejandro Diaz', 'Lucia Moreno', 'Fernando Castro',
        'Camila Ortega', 'Ricardo Vargas', 'Esperanza Romero', 'Antonio Flores', 'Gabriela Silva'
      ];
      
      const purposes = [
        'Business permit renewal', 'Birth certificate request', 'Marriage certificate', 
        'Health certificate', 'Barangay clearance', 'Cedula application',
        'Tax payment', 'Building permit inquiry', 'License renewal', 'Document authentication'
      ];

      const appointments = [];
      for (let i = 0; i < 20; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + Math.floor(i / 8)); // Spread across multiple days
        
        const hour = 9 + Math.floor((i % 8) * 1); // 9 AM to 4 PM
        const slotStart = `${String(hour).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`;
        const endHour = i % 2 === 0 ? hour : hour + 1;
        const slotEnd = `${String(endHour).padStart(2, '0')}:${i % 2 === 0 ? '30' : '00'}`;
        
        const statuses = ['pending', 'checked_in', 'completed'];
        const status = statuses[i % 3];
        
        appointments.push({
          department_id: departments[0]?.id,
          full_name: sampleNames[i],
          contact_number: `0912345${String(i).padStart(4, '0')}`,
          purpose: purposes[i % purposes.length],
          appointment_date: date.toISOString().split('T')[0],
          slot_start: slotStart,
          slot_end: slotEnd,
          ticket_number: `${departments[0]?.name?.charAt(0)?.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          status,
          is_walk_in: i % 5 === 0,
          qr_code: `TEST-${i + 1}`,
          checked_in_at: status !== 'pending' ? new Date().toISOString() : null,
          serving_started_at: status === 'completed' ? new Date().toISOString() : null,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        });
      }

      const { error } = await client
        .from('appointments')
        .insert(appointments);
      
      if (error) throw error;
      
      toast.success('Generated 20 sample appointments successfully!');
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-12">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <h1 className="text-base sm:text-xl md:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                MyRoxas <span className="hidden sm:inline">Admin</span>
              </h1>
            </div>

            {/* Nav Links */}
            <div className="flex items-center space-x-0.5 overflow-x-auto">
              <Link href="/admin/dashboard">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Dashboard</span>
                </div>
              </Link>
              <Link href="/admin/reports">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <FileText className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Reports</span>
                </div>
              </Link>
              <Link href="/admin/users">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <Users className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Users</span>
                </div>
              </Link>
              <Link href="/admin/categories">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <FolderKanban className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Categories</span>
                </div>
              </Link>
              <Link href="/admin/departments">
                <div className="flex items-center px-2 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 font-medium whitespace-nowrap">
                  <Building2 className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Departments</span>
                </div>
              </Link>
              <Link href="/admin/department-users">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <Shield className="w-4 h-4 mr-1.5" />
                  <span className="hidden lg:inline text-sm">Dept. Staff</span>
                </div>
              </Link>
              <Link href="/admin/announcements">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <Megaphone className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">News</span>
                </div>
              </Link>
              <Link href="/admin/support-faqs">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">FAQs</span>
                </div>
              </Link>
              <Link href="/admin/settings">
                <div className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors whitespace-nowrap">
                  <Settings className="w-4 h-4 mr-1.5" />
                  <span className="hidden md:inline text-sm">Settings</span>
                </div>
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button className="hidden sm:flex relative p-1.5 sm:p-1.5 text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg p-0.5 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
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
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                      >
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 flex items-center gap-2"
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
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:bg-gray-700">Departments ({departments.length})</h2>
            <p className="text-gray-600">Manage departments and assign department heads</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateSampleData}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
            >
              <Calendar className="w-5 h-5" />
              Generate Test Data
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create Department
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* Departments Grid */}
        {departments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700 dark:border-gray-700">
            <Building2 className="w-16 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:bg-gray-700 mb-2">No Departments Yet</h3>
            <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-6">Create your first department to get started</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create Department
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((department) => (
              <motion.div
                key={department.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-2xl p-6 shadow-sm border ${
                  department.is_active ? 'border-gray-100 dark:border-gray-700 dark:border-gray-700' : 'border-gray-300 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:bg-gray-700">{department.name}</h3>
                    {!department.is_active && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Inactive</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(department)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
                    title={department.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {department.is_active ? (
                      <Eye className="w-5 h-5 text-gray-600" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {department.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-4">{department.description}</p>
                )}

                {department.department_head && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1">Department Head</p>
                    <p className="text-sm font-semibold text-gray-900 dark:bg-gray-700">
                      {department.department_head.full_name}
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700 dark:border-gray-700">
                  <button
                    onClick={() => openAppointmentSettings(department)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Appointment Settings
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(department)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(department)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                  <span>Display Order: {department.display_order}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:bg-gray-700">
                {editingDepartment ? 'Edit Department' : 'Create Department'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Public Works, Health Services"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this department handle?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all resize-none"
                />
              </div>

              {/* Department Head */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department Head (Optional)
                </label>
                <select
                  value={formData.department_head_id}
                  onChange={(e) => setFormData({ ...formData, department_head_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                >
                  <option value="">No head assigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-200"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                  Active (visible to users)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Appointment Settings Modal - Slides from LEFT */}
      <AnimatePresence>
        {showAppointmentSettings && selectedDepartment && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowAppointmentSettings(false)}
            />
            
            {/* LEFT Sliding Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 shadow-md flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6" />
                  <div>
                    <h2 className="text-xl font-bold">{selectedDepartment.name}</h2>
                    <p className="text-sm text-white/80">Appointment Settings</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveAppointmentSettings}
                    disabled={savingSettings}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingSettings ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setShowAppointmentSettings(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {appointmentSettings && (
                  <>
                    {/* Basic Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-orange-500" />
                        Basic Settings
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-gray-700">Accept Appointments</label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Allow citizens to book appointments</p>
                          </div>
                          <button
                            onClick={() => setAppointmentSettings({
                              ...appointmentSettings,
                              can_receive_appointments: !appointmentSettings.can_receive_appointments
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              appointmentSettings.can_receive_appointments ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              appointmentSettings.can_receive_appointments ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>

                        <div>
                          <label className="block font-medium text-gray-700 mb-2">Daily Appointment Limit</label>
                          <input
                            type="number"
                            value={appointmentSettings.daily_appointment_limit}
                            onChange={(e) => setAppointmentSettings({
                              ...appointmentSettings,
                              daily_appointment_limit: parseInt(e.target.value)
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-gray-700">Allow Same-Day Booking</label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Let citizens book for today</p>
                          </div>
                          <button
                            onClick={() => setAppointmentSettings({
                              ...appointmentSettings,
                              allow_same_day: !appointmentSettings.allow_same_day
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              appointmentSettings.allow_same_day ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              appointmentSettings.allow_same_day ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block font-medium text-gray-700 mb-2">Min Days Advance</label>
                            <input
                              type="number"
                              value={appointmentSettings.min_days_advance}
                              onChange={(e) => setAppointmentSettings({
                                ...appointmentSettings,
                                min_days_advance: parseInt(e.target.value)
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block font-medium text-gray-700 mb-2">Max Days Advance</label>
                            <input
                              type="number"
                              value={appointmentSettings.max_days_advance}
                              onChange={(e) => setAppointmentSettings({
                                ...appointmentSettings,
                                max_days_advance: parseInt(e.target.value)
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-gray-700">Require QR Check-In</label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Citizens must scan QR at arrival</p>
                          </div>
                          <button
                            onClick={() => setAppointmentSettings({
                              ...appointmentSettings,
                              require_qr_checkin: !appointmentSettings.require_qr_checkin
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              appointmentSettings.require_qr_checkin ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              appointmentSettings.require_qr_checkin ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        Operating Hours
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block font-medium text-gray-700 mb-2">Open Time</label>
                            <input
                              type="time"
                              value={appointmentSettings.operating_start}
                              onChange={(e) => setAppointmentSettings({
                                ...appointmentSettings,
                                operating_start: e.target.value
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block font-medium text-gray-700 mb-2">Close Time</label>
                            <input
                              type="time"
                              value={appointmentSettings.operating_end}
                              onChange={(e) => setAppointmentSettings({
                                ...appointmentSettings,
                                operating_end: e.target.value
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block font-medium text-gray-700 mb-2">Lunch Start</label>
                            <input
                              type="time"
                              value={appointmentSettings.lunch_break_start}
                              onChange={(e) => setAppointmentSettings({
                                ...appointmentSettings,
                                lunch_break_start: e.target.value
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block font-medium text-gray-700 mb-2">Lunch End</label>
                            <input
                              type="time"
                              value={appointmentSettings.lunch_break_end}
                              onChange={(e) => setAppointmentSettings({
                                ...appointmentSettings,
                                lunch_break_end: e.target.value
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-500" />
                          Time Slots ({timeSlots.length})
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGenerateSlots(15)}
                            className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm"
                          >
                            15 min
                          </button>
                          <button
                            onClick={() => handleGenerateSlots(30)}
                            className="px-3 py-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 text-sm"
                          >
                            30 min
                          </button>
                          <button
                            onClick={() => handleGenerateSlots(60)}
                            className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 text-sm"
                          >
                            60 min
                          </button>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {timeSlots.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-center py-8">No time slots configured. Click a button above to generate.</p>
                        ) : (
                          timeSlots.map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-700">
                                  {slot.slot_start} - {slot.slot_end}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
                                  Max: {slot.max_appointments}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  {slot.day_of_week.map((day: number) => (
                                    <span key={day} className="text-xs px-1 py-0.5 bg-orange-100 text-orange-600 rounded">
                                      {getDayName(day)}
                                    </span>
                                  ))}
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  slot.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 text-gray-500 dark:text-gray-400 dark:text-gray-400'
                                }`}>
                                  {slot.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <div className="flex gap-1 ml-2">
                                  <button
                                    onClick={() => handleToggleSlot(slot.id)}
                                    className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                    title={slot.is_active ? 'Deactivate' : 'Activate'}
                                  >
                                    {slot.is_active ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                                  </button>
                                  <button
                                    onClick={() => openEditSlot(slot)}
                                    className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                                    title="Edit slot"
                                  >
                                    <Edit className="w-4 h-4 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                    title="Delete slot"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Closed Dates */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        Closed Dates ({closedDates.length})
                      </h3>
                      
                      {/* Add Closed Date Form */}
                      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 rounded-lg">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                              type="date"
                              value={newClosedDate}
                              onChange={(e) => setNewClosedDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g., Holiday, Maintenance"
                              value={closedDateReason}
                              onChange={(e) => setClosedDateReason(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleAddClosedDate}
                          className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Closed Date
                        </button>
                      </div>
                      
                      {/* Closed Dates List */}
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {closedDates.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-center py-6">No closed dates configured.</p>
                        ) : (
                          closedDates.map((closedDate) => (
                            <div key={closedDate.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-red-500" />
                                <div>
                                  <span className="font-medium text-gray-800">
                                    {new Date(closedDate.closed_date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                  {closedDate.reason && (
                                    <p className="text-sm text-gray-600">{closedDate.reason}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteClosedDate(closedDate.id)}
                                className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                title="Remove closed date"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
