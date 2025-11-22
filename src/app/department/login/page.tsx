'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';

export default function DepartmentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const client = await supabase;

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user has department role
      const { data: profile, error: profileError } = await client
        .from('user_profiles')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== 'department') {
        await client.auth.signOut();
        throw new Error('Access denied. This portal is for department staff only.');
      }

      // Check if user is assigned to any department
      const { data: deptAssignment, error: deptError } = await client
        .from('department_users')
        .select('id')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .limit(1);

      if (deptError) throw deptError;

      if (!deptAssignment || deptAssignment.length === 0) {
        await client.auth.signOut();
        throw new Error('You are not assigned to any department. Please contact admin.');
      }

      // Success - redirect to department dashboard
      router.push('/department/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative w-full max-w-xs mx-auto mb-4">
            <Image
              src="/assets/images/myroxas_text.png"
              alt="MyRoxas"
              width={300}
              height={150}
              className="w-full h-auto"
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Department Portal</h1>
          </div>
          <p className="text-gray-600">Sign in to manage assigned reports</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              ← Back to Login Options
            </Link>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-center text-sm text-gray-600"
        >
          <p>Need access? Contact your system administrator.</p>
        </motion.div>
      </div>
    </main>
  );
}
