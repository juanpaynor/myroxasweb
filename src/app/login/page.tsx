'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, Users } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Logo Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative w-full max-w-md mx-auto mb-4">
            <Image
              src="/assets/images/myroxas_text.png"
              alt="MyRoxas"
              width={400}
              height={200}
              className="w-full h-auto"
            />
          </div>
          <p className="text-gray-600 text-lg">Choose your access type</p>
        </motion.div>

        {/* Login Options Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Admin Login */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/login/admin">
              <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer h-full">
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

                {/* Icon */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-600 group-hover:to-orange-600 transition-all duration-300">
                    Admin
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Access administrative dashboard to manage city services, reports, and system settings.
                  </p>
                  <div className="inline-flex items-center text-orange-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Login as Admin
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Citizen Support Login */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href="/login/support">
              <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer h-full">
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

                {/* Icon */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                    Citizen Support
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Provide support to citizens, respond to inquiries, and manage service requests.
                  </p>
                  <div className="inline-flex items-center text-indigo-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Login as Support
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Back to Home */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors duration-300">
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
