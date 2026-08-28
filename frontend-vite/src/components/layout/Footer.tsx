import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <span className="text-xl font-black tracking-tight text-white">
                Cowork<span className="text-rose-500">30</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Enterprise-grade coworking space management platform. Premium meeting suites, hot desks, private cabins, and dynamic credit wallet billing.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs">
              <span className="flex items-center gap-1 text-slate-300">
                <Shield className="w-3.5 h-3.5 text-rose-500" /> SSL 256-Bit Encrypted Checkout
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Workspaces</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/services" className="hover:text-white transition-colors">Virtual Office</Link></li>
              <li><Link to="/meeting-rooms" className="hover:text-white transition-colors">Meeting Suites</Link></li>
              <li><Link to="/floor-map" className="hover:text-white transition-colors">2D Desk Picker</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Membership Tiers</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Portals & Info</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/login" className="hover:text-white transition-colors">Member Sign In</Link></li>
              <li><Link to="/staff/login" className="hover:text-white transition-colors">Staff Reception</Link></li>
              <li><Link to="/admin/login" className="hover:text-white transition-colors">Admin Portal</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition-colors">Workspace Gallery</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Contact Us</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> 100 Innovation Blvd, Tech City
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-rose-500" /> +1 (555) 300-2026
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-rose-500" /> contact@v1dev.cowork30.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Cowork30 Enterprise Platform. All rights reserved.</p>
          <div className="flex items-center gap-1 mt-4 md:mt-0">
            <span>Built with React + Vite & NestJS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
