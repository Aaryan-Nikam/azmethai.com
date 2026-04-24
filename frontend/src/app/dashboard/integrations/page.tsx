'use client';

import React, { useState } from "react";
import { MetaReviewWorkspace } from "@/components/integrations";

export default function IntegrationsPage() {
  const [waitlisted, setWaitlisted] = useState<{ linkedin: boolean; whatsapp: boolean }>({
    linkedin: false,
    whatsapp: false,
  });

  const joinWaitlist = (product: "linkedin" | "whatsapp") => {
    const email = window.prompt(
      `Enter your email to join the ${product === "linkedin" ? "LinkedIn" : "WhatsApp Business"} beta waitlist`,
    );
    if (!email?.trim()) return;
    setWaitlisted((previous) => ({ ...previous, [product]: true }));
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#111827]">
      <main className="mx-auto max-w-7xl space-y-8 p-8">
        <MetaReviewWorkspace />

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Other Integrations</h2>
            <p className="text-sm text-[#6b7280]">Existing placeholders remain available outside the Meta review flow.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col justify-between rounded-2xl border border-[#e5e7eb] bg-white p-6 opacity-70 shadow-sm">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f4f6] text-lg font-bold text-[#6b7280]">
                    in
                  </div>
                  <span className="text-xs font-medium text-[#9ca3af]">Coming Soon</span>
                </div>
                <h3 className="mb-2 text-xl font-semibold">LinkedIn</h3>
                <p className="mb-6 text-sm text-[#6b7280]">
                  Automate outbound connection requests and inbox replies.
                </p>
              </div>

              <button
                onClick={() => joinWaitlist("linkedin")}
                className={`w-full rounded-lg px-4 py-2 font-medium transition-colors ${
                  waitlisted.linkedin
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]"
                }`}
              >
                {waitlisted.linkedin ? "Joined Waitlist" : "Join Waitlist"}
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-[#e5e7eb] bg-white p-6 opacity-70 shadow-sm">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f4f6] text-lg font-bold text-[#6b7280]">
                    💬
                  </div>
                  <span className="text-xs font-medium text-[#9ca3af]">Coming Soon</span>
                </div>
                <h3 className="mb-2 text-xl font-semibold">WhatsApp Business</h3>
                <p className="mb-6 text-sm text-[#6b7280]">
                  Deeper automation for templates, sessions, and business workflows is coming next.
                </p>
              </div>

              <button
                onClick={() => joinWaitlist("whatsapp")}
                className={`w-full rounded-lg px-4 py-2 font-medium transition-colors ${
                  waitlisted.whatsapp
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]"
                }`}
              >
                {waitlisted.whatsapp ? "Joined Waitlist" : "Join Waitlist"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
