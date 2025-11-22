'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type DepartmentSettings = {
  id: string;
  department_id: string;
  can_receive_appointments: boolean;
  daily_appointment_limit: number;
  allow_same_day: boolean;
  min_days_advance: number;
  max_days_advance: number;
  require_qr_checkin: boolean;
  operating_start: string;
  operating_end: string;
  lunch_break_start: string;
  lunch_break_end: string;
};

type TimeSlot = {
  id: string;
  department_id: string;
  slot_start: string;
  slot_end: string;
  max_appointments: number;
  day_of_week: number[];
  is_active: boolean;
};

type Department = {
  id: string;
  name: string;
  description: string;
};

export default function DepartmentAppointmentSettings() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [settings, setSettings] = useState<DepartmentSettings | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const client = await supabase;
      const { data: { user } } = await client.auth.getUser();

      if (!user) {
        router.push('/login/admin');
        return;
      }

      const { data: profile } = await client
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/login/admin');
        return;
      }

      await fetchData();
      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login/admin');
    }
  }

  async function fetchData() {
    try {
      const client = await supabase;

      // Fetch department
      const { data: deptData } = await client
        .from('departments')
        .select('id, name, description')
        .eq('id', departmentId)
        .single();

      setDepartment(deptData);

      // Fetch or create settings
      let { data: settingsData } = await client
        .from('department_settings')
        .select('*')
        .eq('department_id', departmentId)
        .single();

      if (!settingsData) {
        // Create default settings
        const { data: newSettings } = await client
          .from('department_settings')
          .insert({
            department_id: departmentId,
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

      setSettings(settingsData);

      // Fetch time slots
      const { data: slotsData } = await client
        .from('department_time_slots')
        .select('*')
        .eq('department_id', departmentId)
        .order('slot_start');

      setTimeSlots(slotsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async function handleSaveSettings() {
    if (!settings) return;

    setSaving(true);
    try {
      const client = await supabase;

      const { error } = await client
        .from('department_settings')
        .update({
          can_receive_appointments: settings.can_receive_appointments,
          daily_appointment_limit: settings.daily_appointment_limit,
          allow_same_day: settings.allow_same_day,
          min_days_advance: settings.min_days_advance,
          max_days_advance: settings.max_days_advance,
          require_qr_checkin: settings.require_qr_checkin,
          operating_start: settings.operating_start,
          operating_end: settings.operating_end,
          lunch_break_start: settings.lunch_break_start,
          lunch_break_end: settings.lunch_break_end
        })
        .eq('id', settings.id);

      if (error) throw error;

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateSlots(duration: number) {
    if (!settings || !confirm(`Generate ${duration}-minute slots? This will replace existing slots.`)) return;

    try {
      const client = await supabase;

      // Delete existing slots
      await client
        .from('department_time_slots')
        .delete()
        .eq('department_id', departmentId);

      // Generate slots
      const slots: any[] = [];
      let currentTime = parseTime(settings.operating_start);
      const endTime = parseTime(settings.operating_end);
      const lunchStart = parseTime(settings.lunch_break_start);
      const lunchEnd = parseTime(settings.lunch_break_end);

      while (currentTime < endTime) {
        const slotEnd = currentTime + duration;
        
        // Skip lunch break
        if (!(currentTime >= lunchStart && currentTime < lunchEnd)) {
          slots.push({
            department_id: departmentId,
            slot_start: formatTime(currentTime),
            slot_end: formatTime(slotEnd),
            max_appointments: 2,
            day_of_week: [1, 2, 3, 4, 5], // Mon-Fri
            is_active: true
          });
        }

        currentTime = slotEnd;
      }

      const { error } = await client
        .from('department_time_slots')
        .insert(slots);

      if (error) throw error;

      await fetchData();
      alert(`Generated ${slots.length} time slots!`);
    } catch (error) {
      console.error('Error generating slots:', error);
      alert('Failed to generate slots');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!department || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Department not found</p>
          <Link href="/admin/departments" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Departments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/departments" className="text-sm text-blue-600 hover:underline mb-1 block">
                ← Back to Departments
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{department.name}</h1>
              <p className="text-sm text-gray-600">Appointment Settings</p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Basic Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Basic Settings
          </h2>

          <div className="space-y-6">
            {/* Enable Appointments */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-gray-900">Enable Appointments</label>
                <p className="text-sm text-gray-600">Allow citizens to book appointments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.can_receive_appointments}
                  onChange={(e) => setSettings({ ...settings, can_receive_appointments: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Daily Limit */}
            <div>
              <label className="block font-semibold text-gray-900 mb-2">Daily Appointment Limit</label>
              <input
                type="number"
                value={settings.daily_appointment_limit}
                onChange={(e) => setSettings({ ...settings, daily_appointment_limit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                min="1"
              />
            </div>

            {/* Booking Window */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Min Days in Advance</label>
                <input
                  type="number"
                  value={settings.min_days_advance}
                  onChange={(e) => setSettings({ ...settings, min_days_advance: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Max Days in Advance</label>
                <input
                  type="number"
                  value={settings.max_days_advance}
                  onChange={(e) => setSettings({ ...settings, max_days_advance: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  min="1"
                />
              </div>
            </div>

            {/* Allow Same Day */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-gray-900">Allow Same-Day Bookings</label>
                <p className="text-sm text-gray-600">Citizens can book for today</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allow_same_day}
                  onChange={(e) => setSettings({ ...settings, allow_same_day: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* QR Check-in */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-gray-900">Require QR Code Check-In</label>
                <p className="text-sm text-gray-600">Must scan QR before serving</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_qr_checkin}
                  onChange={(e) => setSettings({ ...settings, require_qr_checkin: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Operating Start</label>
                <input
                  type="time"
                  value={settings.operating_start}
                  onChange={(e) => setSettings({ ...settings, operating_start: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Operating End</label>
                <input
                  type="time"
                  value={settings.operating_end}
                  onChange={(e) => setSettings({ ...settings, operating_end: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
            </div>

            {/* Lunch Break */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Lunch Break Start</label>
                <input
                  type="time"
                  value={settings.lunch_break_start}
                  onChange={(e) => setSettings({ ...settings, lunch_break_start: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Lunch Break End</label>
                <input
                  type="time"
                  value={settings.lunch_break_end}
                  onChange={(e) => setSettings({ ...settings, lunch_break_end: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Time Slots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Slots
            </h2>
          </div>

          {/* Quick Generate */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-3">Quick Generate (replaces existing slots):</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerateSlots(15)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                15-min slots
              </button>
              <button
                onClick={() => handleGenerateSlots(30)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                30-min slots
              </button>
              <button
                onClick={() => handleGenerateSlots(60)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                1-hour slots
              </button>
            </div>
          </div>

          {/* Slots List */}
          <div className="space-y-3">
            {timeSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No time slots configured</p>
                <p className="text-sm">Use Quick Generate or add custom slots</p>
              </div>
            ) : (
              timeSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${slot.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {slot.slot_start} - {slot.slot_end}
                      </p>
                      <p className="text-sm text-gray-600">
                        Max: {slot.max_appointments} | Days: {slot.day_of_week.map(getDayName).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${slot.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {slot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
