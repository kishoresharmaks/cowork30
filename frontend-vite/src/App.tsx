import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { BranchProvider } from '@/context/BranchContext';

// Public & Member Pages
import HomePage from '@/pages/HomePage';
import MeetingRoomsPage from '@/pages/MeetingRoomsPage';
import ServicesPage from '@/pages/ServicesPage';
import PricingPage from '@/pages/PricingPage';
import FloorMapPage from '@/pages/FloorMapPage';
import GalleryPage from '@/pages/GalleryPage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import MemberBookingsPage from '@/pages/MemberBookingsPage';

// Staff Pages
import StaffDashboardPage from '@/pages/StaffDashboardPage';
import StaffBookingsPage from '@/pages/StaffBookingsPage';
import StaffMeetingRoomsPage from '@/pages/StaffMeetingRoomsPage';
import StaffWalletRequestsPage from '@/pages/StaffWalletRequestsPage';
import StaffReportsPage from '@/pages/StaffReportsPage';

// Admin Pages
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminBranchesPage from '@/pages/AdminBranchesPage';
import AdminMeetingRoomsPage from '@/pages/AdminMeetingRoomsPage';
import AdminServicesPage from '@/pages/AdminServicesPage';
import AdminPricingPage from '@/pages/AdminPricingPage';
import AdminUsersPage from '@/pages/AdminUsersPage';
import AdminBookingsPage from '@/pages/AdminBookingsPage';
import AdminWalletRequestsPage from '@/pages/AdminWalletRequestsPage';
import AdminSettingsPage from '@/pages/AdminSettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/meeting-rooms" element={<MeetingRoomsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/floor-map" element={<FloorMapPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Member Portal Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bookings" element={<MemberBookingsPage />} />

          {/* Staff Reception Portal Routes */}
          <Route path="/staff/login" element={<LoginPage />} />
          <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="/staff/bookings" element={<StaffBookingsPage />} />
          <Route path="/staff/meeting-rooms" element={<StaffMeetingRoomsPage />} />
          <Route path="/staff/wallet-requests" element={<StaffWalletRequestsPage />} />
          <Route path="/staff/reports" element={<StaffReportsPage />} />

          {/* Enterprise Admin Portal Routes */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/branches" element={<AdminBranchesPage />} />
          <Route path="/admin/meeting-rooms" element={<AdminMeetingRoomsPage />} />
          <Route path="/admin/services" element={<AdminServicesPage />} />
          <Route path="/admin/pricing" element={<AdminPricingPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/wallet-requests" element={<AdminWalletRequestsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />

          {/* Fallback Catch-all */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BranchProvider>
    </AuthProvider>
  );
}
