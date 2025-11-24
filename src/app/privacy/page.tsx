'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, UserCheck, FileText, Clock } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-12 h-12" />
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-xl opacity-90">
              Last Updated: November 24, 2025
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Introduction</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Welcome to MyRoxas, the official city portal of Roxas City, Capiz, Philippines. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Information We Collect</h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name, email address, and phone number</li>
                  <li>Physical address and location data</li>
                  <li>Government-issued identification numbers (when required)</li>
                  <li>Profile information and preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Usage Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Log data and analytics</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Service usage patterns and preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Content and Communications</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Reports and issues you submit</li>
                  <li>Support chat messages and inquiries</li>
                  <li>Appointment bookings and related information</li>
                  <li>Photos and attachments you upload</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How We Use Your Information</h2>
            </div>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide and maintain city services</li>
                <li>Process your reports, appointments, and service requests</li>
                <li>Communicate with you about your requests and inquiries</li>
                <li>Send important notifications and announcements</li>
                <li>Improve and personalize your experience</li>
                <li>Analyze usage patterns to enhance our services</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations and government requirements</li>
              </ul>
            </div>
          </section>

          {/* Information Sharing */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Information Sharing and Disclosure</h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>We may share your information with:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>City Departments:</strong> Relevant departments to process your service requests</li>
                <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect rights and safety</li>
                <li><strong>Emergency Services:</strong> In urgent situations requiring immediate response</li>
              </ul>
              <p className="font-semibold">
                We do not sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Security</h2>
            </div>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p>We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Encrypted data transmission (SSL/TLS)</li>
                <li>Secure database storage with access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Staff training on data protection practices</li>
                <li>Multi-factor authentication for sensitive operations</li>
              </ul>
              <p className="mt-4">
                While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but are committed to maintaining the highest standards.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Retention</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. When no longer needed, we securely delete or anonymize your information.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Rights</h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p>Under the Data Privacy Act of 2012 (Republic Act No. 10173), you have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong>Objection:</strong> Object to certain processing of your information</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for optional data processing</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at <a href="mailto:privacy@myroxas.ph" className="text-yellow-600 hover:text-yellow-700 font-semibold">privacy@myroxas.ph</a>
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cookies and Tracking</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie preferences through your browser settings. Note that disabling cookies may affect platform functionality.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Children's Privacy</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Our services are not intended for children under 13. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately for removal.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Changes to This Policy</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last Updated" date. Significant changes will be communicated via email or prominent notice on our platform.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p>For questions about this Privacy Policy or our data practices, contact:</p>
              <div className="space-y-1 font-semibold">
                <p><strong>Data Protection Officer</strong></p>
                <p>City Government of Roxas</p>
                <p>Roxas City Hall, Roxas City, Capiz, Philippines</p>
                <p>Email: <a href="mailto:privacy@myroxas.ph" className="text-yellow-600 hover:text-yellow-700">privacy@myroxas.ph</a></p>
                <p>Phone: (036) 621-0706</p>
              </div>
            </div>
          </section>

          {/* Back to Home */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link href="/">
              <button className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                ← Back to Home
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
