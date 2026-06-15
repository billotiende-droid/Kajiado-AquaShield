'use client';

import { Phone } from 'lucide-react';

export function FooterSection() {
  return (
    <footer className="bg-slate-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* AquaShield Info */}
          <div>
            <h3 className="font-semibold text-lg mb-3">AquaShield</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Flash-flood risk assessment system for Kajiado County, Kenya. Real-time weather monitoring and AI-powered alert system.
            </p>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Emergency Contact</h3>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Phone className="w-4 h-4" />
              <span>Emergency: +254 Emergency Services</span>
            </div>
            <p className="text-slate-400 text-sm mt-2">Available 24/7 for urgent flood alerts</p>
          </div>

          {/* Data Updates */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Data Updates</h3>
            <p className="text-slate-300 text-sm">
              Real-time weather data updated every 30 seconds
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Powered by Weather-AI API
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-700 pt-6">
          <p className="text-center text-slate-400 text-sm">
            © 2024 AquaShield. All rights reserved. Emergency Support +254
          </p>
        </div>
      </div>
    </footer>
  );
}
