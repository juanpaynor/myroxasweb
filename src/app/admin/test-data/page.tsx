'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Bell,
  FolderKanban,
  Building2,
  Shield,
  Database,
  Trash2,
  Plus,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function TestDataPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [appointmentCount, setAppointmentCount] = useState(20);

  useState(() => {
    loadDepartments();
  });

  async function loadDepartments() {
    try {
      const client = await supabase;
      const { data } = await client
        .from('departments')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      setDepartments(data || []);
      if (data && data.length > 0) {
        setSelectedDepartment(data[0].id);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }

  async function generateSampleData() {
    if (!selectedDepartment) {
      toast.error('Please select a department');
      return;
    }

    setIsGenerating(true);

    try {
      const client = await supabase;
      const today = new Date();
      
      const names = [
        'Juan Dela Cruz', 'Maria Santos', 'Pedro Ramos', 'Ana Lopez', 'Carlos Garcia',
        'Rosa Martinez', 'Luis Torres', 'Carmen Reyes', 'Miguel Flores', 'Elena Cruz',
        'Antonio Silva', 'Isabella Rodriguez', 'Diego Fernandez', 'Sofia Gonzalez', 'Manuel Castro',
        'Patricia Morales', 'Jorge Herrera', 'Laura Ruiz', 'Ricardo Diaz', 'Gabriela Mendoza'
      ];

      const purposes = [
        'Business permit renewal',
        'Document request',
        'License application',
        'Certification request',
        'Inquiry about requirements',
        'Payment processing',
        'Complaint filing',
        'Service application',
        'Record verification',
        'General consultation'
      ];

      const statusOptions: Array<'pending' | 'checked_in' | 'in_progress' | 'completed' | 'no_show'> = 
        ['pending', 'checked_in', 'in_progress', 'completed', 'no_show'];

      const appointments = [];

      for (let i = 0; i < appointmentCount; i++) {
        const appointmentDate = new Date(today);
        // Random date within next 7 days
        appointmentDate.setDate(today.getDate() + Math.floor(Math.random() * 7));
        const dateStr = appointmentDate.toISOString().split('T')[0];

        // Random time slot between 8 AM and 4 PM
        const hour = 8 + Math.floor(Math.random() * 8);
        const minute = Math.random() < 0.5 ? '00' : '30';
        const slotStart = `${String(hour).padStart(2, '0')}:${minute}`;
        const slotEnd = `${String(hour).padStart(2, '0')}:${minute === '00' ? '30' : '00'}`;

        // Get department name for ticket prefix
        const dept = departments.find(d => d.id === selectedDepartment);
        const prefix = dept?.name.charAt(0).toUpperCase() || 'A';
        const ticketNumber = `${prefix}-${String(i + 1).padStart(3, '0')}`;

        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomPurpose = purposes[Math.floor(Math.random() * purposes.length)];
        const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];

        const appointment: any = {
          department_id: selectedDepartment,
          citizen_id: null,
          full_name: randomName,
          contact_number: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
          purpose: randomPurpose,
          appointment_date: dateStr,
          slot_start: slotStart,
          slot_end: slotEnd,
          ticket_number: ticketNumber,
          status: randomStatus,
          is_walk_in: Math.random() < 0.3, // 30% walk-ins
          qr_code: `TEST-${ticketNumber}-${Date.now()}`
        };

        // Add timestamps based on status
        if (randomStatus === 'checked_in' || randomStatus === 'in_progress' || randomStatus === 'completed') {
          appointment.checked_in_at = new Date(appointmentDate.getTime() - Math.random() * 3600000).toISOString();
        }
        if (randomStatus === 'in_progress' || randomStatus === 'completed') {
          appointment.serving_started_at = new Date(appointmentDate.getTime() - Math.random() * 1800000).toISOString();
        }
        if (randomStatus === 'completed') {
          appointment.completed_at = new Date(appointmentDate.getTime() - Math.random() * 900000).toISOString();
        }

        appointments.push(appointment);
      }

      const { error } = await client
        .from('appointments')
        .insert(appointments);

      if (error) throw error;

      toast.success(`Generated ${appointmentCount} sample appointments!`);
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data');
      setIsGenerating(false);
    }
  }

  async function clearTestData() {
    if (!confirm('⚠️ This will delete ALL appointments with QR codes starting with "TEST-". Continue?')) {
      return;
    }

    setIsClearing(true);

    try {
      const client = await supabase;
      
      const { error } = await client
        .from('appointments')
        .delete()
        .like('qr_code', 'TEST-%');

      if (error) throw error;

      toast.success('Test data cleared successfully');
      setIsClearing(false);
    } catch (error) {
      console.error('Error clearing test data:', error);
      toast.error('Failed to clear test data');
      setIsClearing(false);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                MyRoxas Admin
              </h1>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-0.5">
              <Link href="/admin/dashboard">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </div>
              </Link>
              <Link href="/admin/reports">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <FileText className="w-4 h-4 mr-1.5" />
                  Reports
                </div>
              </Link>
              <Link href="/admin/users">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <Users className="w-4 h-4 mr-1.5" />
                  Users
                </div>
              </Link>
              <Link href="/admin/categories">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <FolderKanban className="w-4 h-4 mr-1.5" />
                  Categories
                </div>
              </Link>
              <Link href="/admin/departments">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <Building2 className="w-4 h-4 mr-1.5" />
                  Departments
                </div>
              </Link>
              <Link href="/admin/department-users">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <Shield className="w-4 h-4 mr-1.5" />
                  Dept. Staff
                </div>
              </Link>
              <Link href="/admin/announcements">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <Megaphone className="w-4 h-4 mr-1.5" />
                  Announcements
                </div>
              </Link>
              <Link href="/admin/support-faqs">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 font-medium transition-colors">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Support FAQs
                </div>
              </Link>
              <Link href="/admin/test-data">
                <div className="flex items-center px-2 py-1.5 rounded-md text-sm bg-purple-50 text-purple-700 font-medium">
                  <Database className="w-4 h-4 mr-1.5" />
                  Test Data
                </div>
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-2">
              <button className="relative p-1.5 text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-full transition-colors"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Database className="w-16 h-12 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:bg-gray-700 mb-4">Test Data Generator</h1>
          <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 text-lg">
            Generate sample appointments to test the queue management system
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Generate Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:bg-gray-700">Generate Data</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Appointments
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={appointmentCount}
                  onChange={(e) => setAppointmentCount(parseInt(e.target.value) || 20)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">
                  Recommended: 20-50 appointments
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>What will be generated:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Random citizen names & phone numbers</li>
                  <li>Various appointment statuses (pending, checked-in, completed, etc.)</li>
                  <li>Random dates within next 7 days</li>
                  <li>30% marked as walk-ins</li>
                  <li>Sequential ticket numbers</li>
                </ul>
              </div>

              <button
                onClick={generateSampleData}
                disabled={isGenerating || !selectedDepartment}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Generate Sample Data
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Clear Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:bg-gray-700">Clear Test Data</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-semibold mb-2">
                  ⚠️ Warning: Destructive Action
                </p>
                <p className="text-sm text-red-700">
                  This will permanently delete all appointments with QR codes starting with "TEST-".
                  Real appointments from the mobile app will NOT be affected.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>What will be deleted:</strong>
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 mt-2 space-y-1 list-disc list-inside">
                  <li>All test appointments generated from this page</li>
                  <li>QR codes with "TEST-" prefix only</li>
                </ul>
                <p className="text-sm text-gray-700 mt-3">
                  <strong>What will be preserved:</strong>
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 mt-2 space-y-1 list-disc list-inside">
                  <li>Real appointments from mobile app</li>
                  <li>Walk-in appointments from department</li>
                  <li>All department settings</li>
                </ul>
              </div>

              <button
                onClick={clearTestData}
                disabled={isClearing}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-rose-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Clear Test Data
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-purple-900 mb-3">💡 Quick Start Guide</h3>
          <ol className="text-sm text-purple-800 space-y-2 list-decimal list-inside">
            <li>Select a department from the dropdown</li>
            <li>Choose how many appointments to generate (20-50 recommended)</li>
            <li>Click "Generate Sample Data" to create test appointments</li>
            <li>Visit <strong>/department/queue</strong> to see them in action</li>
            <li>Test the queue management features (call next, check-in, complete, etc.)</li>
            <li>When done testing, use "Clear Test Data" to remove all test appointments</li>
          </ol>
        </motion.div>
      </main>
    </div>
  );
}
