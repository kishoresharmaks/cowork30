import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-amber-400 mb-6">Terms of Service</h1>
        <p className="text-slate-300 leading-relaxed mb-4">
          Welcome to Cowork30. By accessing or using our coworking services, amenities, and platform, you agree to be bound by these Terms of Service.
        </p>
        <p className="text-slate-400 leading-relaxed">
          All members and guests must abide by community guidelines, maintain professional conduct, and follow workspace security protocols.
        </p>
      </main>
      <Footer />
    </div>
  );
}
