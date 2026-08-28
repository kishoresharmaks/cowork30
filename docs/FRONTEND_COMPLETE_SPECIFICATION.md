# Cowork30 Enterprise Platform — Frontend Architecture & Complete Specification 📘

## 1. System Overview & Architecture

The Cowork30 Frontend is built as a modern, high-performance, enterprise-grade Coworking Space Management interface. It supports multi-branch discovery, hourly & daily meeting room booking engines, 2D floor map desk pickers, member wallet & credit billing, live real-time support chat via WebSockets, and dedicated management portals for Members, Staff, and Admins.

---

## 2. Design Tokens & Styling System

The application uses Tailwind CSS with CSS Variables for dynamic branding, glassmorphism UI cards, dark/light surface modes, and smooth micro-animations.

### CSS Variables (`index.css` / `globals.css`):
```css
:root {
  --background: 220 20% 98%;
  --foreground: 220 25% 10%;

  --card: 0 0% 100%;
  --card-foreground: 220 25% 10%;

  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;

  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.75rem;
}
```

---

## 3. Complete Route & Page Specification

| Route Path | Auth Requirement | Purpose & Key Features |
|---|---|---|
| `/` | Public | Homepage featuring Hero Slider, Branch Selector, Service Cards, Pricing Tiers, Gallery, Reviews & CTA |
| `/meeting-rooms` | Public | Hourly/Daily Meeting Suite Engine, Capacity Filters, Amenities Filter, Per-Seat Pricing & Direct Checkout |
| `/services` | Public | Workspace Services Catalog (Virtual Office, Dedicated Desk Pass, Meeting Bundles) |
| `/pricing` | Public | Membership Plans, Pricing Comparison Grid & Tour Booking Inquiry Modal |
| `/floor-map` | Public / Member | Interactive 2D Floor Layout Map, Hot Desk & Private Cabin Seat Selection |
| `/gallery` | Public | Filterable Workspace Image & Video Gallery |
| `/contact` | Public | Contact Form, Location Map & Inquiry Dispatch |
| `/login` | Public | User & Member Login Form with Auto-fill Demo Credentials |
| `/register` | Public | User Registration with Company Details & GSTIN |
| `/dashboard` | Member | Member Portal: Active Bookings, Wallet Top-up, Credit Balance, Profile & Receipt History |
| `/bookings` | Member | Member Booking History, Cancellation Request & Access Passes |
| `/admin/login` | Admin | Dedicated Admin Login Portal |
| `/admin/dashboard` | Admin | Enterprise Analytics, Occupancy Rates, Revenue Charts, Recent Bookings & Quick Actions |
| `/admin/branches` | Admin | Branch Location Management (Add, Edit, Delete, Coordinates & Operating Hours) |
| `/admin/meeting-rooms` | Admin | Meeting Suite Management, Hourly Rates, Seat Pricing & Photo Uploads |
| `/admin/services` | Admin | Workspace Services Management |
| `/admin/pricing` | Admin | Pricing Tier & Feature Manager |
| `/admin/users` | Admin | User Directory, Role Assignment (Admin/Staff/Member), Plan Assignment & Balance Adjustments |
| `/admin/bookings` | Admin | All Booking Records, Payment Confirmations, Check-in & Cancellation Handling |
| `/admin/wallet-requests` | Admin | Wallet Top-up Approval Queue & Proof Verification |
| `/admin/service-inquiries` | Admin | Tour Inquiries & Real-time Live Chat Modal |
| `/admin/gallery` | Admin | CMS Gallery Asset Manager |
| `/admin/settings` | Admin | Branding & Site Settings (Logo Uploads, GST Rates, Company Info) |
| `/staff/login` | Staff | Staff Member Login Portal |
| `/staff/dashboard` | Staff | Receptionist Dashboard, Daily Check-ins, Desk Status & Today's Reservations |
| `/staff/bookings` | Staff | Front Desk Booking Manager & Guest Check-in |
| `/staff/meeting-rooms` | Staff | Live Meeting Suite Status & Instant Booking |
| `/staff/wallet-requests` | Staff | Front Desk Cash Top-up Manager |
| `/staff/reports` | Staff | Daily Reception Reports |

---

## 4. UI Components Registry

### Layout Components:
- **`Navbar`**: Main navigation header with logo, dynamic links, branch switcher, auth buttons & profile menu.
- **`Footer`**: Site footer with quick links, newsletter signup, contact details & legal links.
- **`MemberSidebar`**: Collapsible navigation sidebar for Member Portal.
- **`AdminSidebar`**: Enterprise navigation sidebar for Admin Dashboard.
- **`StaffSidebar`**: Front-desk navigation sidebar for Staff Portal.

### Interactive UI Modals & Components:
- **`UnauthorizedNoticeModal`**: Interactive 401 notice modal offering 1-click solution redirects (`/login`, `/register`, or guest cash payment).
- **`RazorpayGatewayModal`**: Checkout modal handling Razorpay online payment verification, wallet payment, and credit payment.
- **`InquiryChatModal`**: Real-time Socket.io live chat modal between members/guests and receptionist staff.
- **`ImageUploader`**: Single image drag-and-drop uploader.
- **`MultiImageUploader`**: Multiple image preview & upload component.

---

## 5. API Client & Data Integration

All HTTP requests are routed through a dynamic API client ([frontend/src/lib/api-client.ts](file:///d:/cllient/cowork30/frontend/src/lib/api-client.ts)) with automatic Bearer token injection and dynamic fallback URL resolution:

```typescript
import axios from 'axios';

export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  let apiBase = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBase) {
    if (typeof window !== 'undefined') {
      apiBase = `${window.location.origin}/api/v1`;
    } else {
      apiBase = 'http://localhost:4000/api/v1';
    }
  }

  if (config.url && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
    const path = config.url.startsWith('/') ? config.url : `/${config.url}`;
    config.url = `${apiBase.replace(/\/+$/, '')}${path}`;
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});
```
