import React from 'react';
import TrackingLookup from '@/Components/tracking/TrackingLookup';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function TrackPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#FF5A24] to-[#e54a1f] pt-20 pb-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Track Your Package
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Enter your tracking number below to get real-time updates on your shipment status and location.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrackingLookup />
        </div>
      </main>

      <Footer />
    </div>
  );
}