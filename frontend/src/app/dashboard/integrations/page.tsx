'use client';

import React, { useState } from "react";
import Link from "next/link";
import { toast } from 'sonner';

export default function IntegrationsPage() {
  const [waitlisted, setWaitlisted] = useState<{ linkedin: boolean; whatsapp: boolean }>({
    linkedin: false,
    whatsapp: false,
  });

  const joinWaitlist = (product: 'linkedin' | 'whatsapp') => {
    const email = window.prompt(`Enter your email to join the ${product === 'linkedin' ? 'LinkedIn' : 'WhatsApp Business'} beta waitlist`);
    if (!email?.trim()) return;
    setWaitlisted(prev => ({ ...prev, [product]: true }));
    toast.success(`${product === 'linkedin' ? 'LinkedIn' : 'WhatsApp Business'} beta waitlist joined`);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#111827]">
      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Integrations</h1>
            <p className="text-[#6b7280]">Connect external channels for the Azmeth Agent to manage.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Meta Business Suite Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#e5e7eb] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
                  {/* Meta logo abstract */}
                  M
                </div>
                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                  Popular
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instagram & Meta</h3>
              <p className="text-sm text-[#6b7280] mb-6">
                Allow your AI to automatically read and respond to Instagram DMs and Facebook Messenger inquiries.
              </p>
            </div>

            {/* The userId parameter should ideally be fetched from auth context.
                Currently hardcoding 'user_tenant_1' or relying on the backend route to handle it. */}
            <Link
              href="/api/auth/meta/connect?platform=instagram&source=dashboard"
              className="w-full inline-flex justify-center items-center px-4 py-2 bg-[#111827] text-white rounded-lg font-medium hover:bg-[#374151] transition-colors"
              prefetch={false}
            >
              Connect Instagram
            </Link>
          </div>

          {/* LinkedIn Placeholder */}
          <div className="bg-white rounded-2xl p-6 border border-[#e5e7eb] shadow-sm flex flex-col justify-between opacity-60">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#f3f4f6] text-[#6b7280] rounded-xl flex items-center justify-center font-bold text-lg">
                  in
                </div>
                <span className="text-xs text-[#9ca3af] font-medium">Coming Soon</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">LinkedIn</h3>
              <p className="text-sm text-[#6b7280] mb-6">
                Automate outbound connection requests and inbox replies.
              </p>
            </div>
            <button
              onClick={() => joinWaitlist('linkedin')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                waitlisted.linkedin
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]'
              }`}
            >
              {waitlisted.linkedin ? 'Joined Waitlist' : 'Join Waitlist'}
            </button>
          </div>

          {/* WhatsApp Placeholder */}
          <div className="bg-white rounded-2xl p-6 border border-[#e5e7eb] shadow-sm flex flex-col justify-between opacity-60">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#f3f4f6] text-[#6b7280] rounded-xl flex items-center justify-center font-bold text-lg">
                  💬
                </div>
                <span className="text-xs text-[#9ca3af] font-medium">Coming Soon</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">WhatsApp Business</h3>
              <p className="text-sm text-[#6b7280] mb-6">
                Agentic responses to your WhatsApp Business number.
              </p>
            </div>
            <button
              onClick={() => joinWaitlist('whatsapp')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                waitlisted.whatsapp
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]'
              }`}
            >
              {waitlisted.whatsapp ? 'Joined Waitlist' : 'Join Waitlist'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
