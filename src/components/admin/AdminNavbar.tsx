'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Bell,
  Building2,
  Shield,
  User,
  LogOut,
  Megaphone,
  MessageSquare,
  FolderKanban
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/lib/supabase';

type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string;
};

interface AdminNavbarProps {
  adminProfile: AdminProfile | null;
}

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/reports', icon: FileText, label: 'Reports' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/categories', icon: FolderKanban, label: 'Categories' },
  { href: '/admin/departments', icon: Building2, label: 'Departments' },
  { href: '/admin/department-users', icon: Shield, label: 'Dept. Staff' },
  { href: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { href: '/admin/support-faqs', icon: MessageSquare, label: 'Support FAQs' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' }
];

export function AdminNavbar({ adminProfile }: AdminNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  async function handleLogout() {
    const client = await supabase;
    await client.auth.signOut();
    router.push('/login/admin');
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-4">
            <Link href="/admin/dashboard" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-2">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                MyRoxas Admin
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                      isActive
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}>
                      <Icon className="w-4 h-4 mr-1.5" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {adminProfile?.full_name ? adminProfile.full_name[0].toUpperCase() : 'A'}
                </div>
              </button>
              
              <AnimatePresence>
                {showSettingsDropdown && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSettingsDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {adminProfile?.full_name || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{adminProfile?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowSettingsDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowSettingsDropdown(false);
                        }}
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
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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
  );
}
