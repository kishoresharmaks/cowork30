import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { apiClient } from '@/lib/api-client';

export default function GalleryPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/gallery')
      .then((res) => setItems(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(() => {
        // Fallback demo gallery items
        setItems([
          { id: 1, title: 'Main Open Workspace Lounge', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', category: 'workspaces' },
          { id: 2, title: 'Executive Boardroom Suite', imageUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80', category: 'meeting_rooms' },
          { id: 3, title: 'Barista Espresso Pantry', imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80', category: 'amenities' },
        ]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Visual Atmosphere</span>
          <h1 className="text-3xl font-black text-slate-900 mt-2">Workspace Gallery</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((g) => (
            <div key={g.id} className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 bg-white">
              <img src={g.imageUrl} alt={g.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex items-end">
                <span className="text-xs font-bold text-white">{g.title}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
