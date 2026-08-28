import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-amber-400 mb-6">Privacy Policy</h1>
        <p className="text-slate-300 leading-relaxed mb-4">
          At Cowork30, we are committed to protecting your personal information and your right to privacy.
        </p>
        <p className="text-slate-400 leading-relaxed">
          We collect personal information that you provide to us when registering at our workspace, expressing an interest in obtaining information about us or our products and services, or participating in activities on the website.
        </p>
      </main>
      <Footer />
    </div>
  );
}
