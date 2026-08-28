import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-100 text-slate-600 pt-16 pb-8 border-t border-slate-200/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative w-44 h-12">
              <Image
                src="/Logo.png"
                alt="Cowork30 Logo"
                fill
                sizes="(max-width: 768px) 120px, 176px"
                className="object-contain object-left"
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
              Your on-demand business solution partner. Premium workspace suites, flexible flex-desks, high-tech meeting rooms, and vibrant community networking.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-rose-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-600 font-semibold">GST Compliant & Verified Workspace</span>
            </div>
          </div>

          {/* Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href="/services" className="hover:text-indigo-600 transition-colors">
                  Hot Desk Flex
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-indigo-600 transition-colors">
                  Dedicated Pro Desks
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-indigo-600 transition-colors">
                  Private Office Cabins
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-indigo-600 transition-colors">
                  Virtual Office Address
                </Link>
              </li>
              <li>
                <Link href="/meeting-rooms" className="hover:text-indigo-600 transition-colors">
                  Meeting Rooms
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
                  Membership Plans
                </Link>
              </li>
              <li>
                <Link href="/floor-map" className="hover:text-indigo-600 transition-colors">
                  Interactive Floor Map
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-indigo-600 transition-colors">
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-indigo-600 transition-colors">
                  Schedule a Tour
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-3 text-xs text-slate-500 font-medium">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>100 Innovation Boulevard, Suite 500, Tech City</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                <span>+1 (555) 300-2026</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                <span>contact@cowork30.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} Cowork30 Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/page/terms" className="hover:text-slate-900">
              Terms of Service
            </Link>
            <Link href="/page/privacy" className="hover:text-slate-900">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
