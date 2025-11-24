'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">MyRoxas</h3>
            <p className="text-sm mb-4">
              Your one-stop portal for Roxas City services. Access city services, report issues, and stay connected with your community.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#features" className="hover:text-yellow-500 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-yellow-500 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-yellow-500 transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/#emergency" className="hover:text-yellow-500 transition-colors">
                  Emergency Hotlines
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="hover:text-yellow-500 transition-colors cursor-pointer">
                  Report Issues
                </span>
              </li>
              <li>
                <span className="hover:text-yellow-500 transition-colors cursor-pointer">
                  Book Appointments
                </span>
              </li>
              <li>
                <span className="hover:text-yellow-500 transition-colors cursor-pointer">
                  Support Chat
                </span>
              </li>
              <li>
                <span className="hover:text-yellow-500 transition-colors cursor-pointer">
                  City Announcements
                </span>
              </li>
              <li>
                <span className="hover:text-yellow-500 transition-colors cursor-pointer">
                  Emergency Hotlines
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Roxas City Hall, Roxas City, Capiz, Philippines</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>(036) 621-0706</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:info@myroxas.ph" className="hover:text-yellow-500 transition-colors">
                  info@myroxas.ph
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © {currentYear} MyRoxas. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-yellow-500 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-yellow-500 transition-colors">
                Terms of Service
              </Link>
              <Link href="/accessibility" className="hover:text-yellow-500 transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
