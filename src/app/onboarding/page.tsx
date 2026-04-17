'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import '../globals.css'

const STEPS = [
  'Select Role Template',
  'Company Identity',
  'Manager Assignment',
  'Connect Channels',
  'Upload SOPs',
  'Compliance & Guardrails',
  'Deploy Employee'
]

export default function EquippingInterface() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const [formData, setFormData] = useState({
    role_id: '',
    company_name: '',
    company_domain: '',
    manager_email: '',
    channels: [] as string[],
    sops: [] as File[],
    strict_compliance: true
  })

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Azmeth%20AI%20Logo.png" alt="Azmeth AI" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>Azmeth AI</h2>
          </div>
          <p style={{ fontSize: '0.85rem' }}>AI Employee Equipping</p>
        </div>

        <div className="step-list">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === idx
            const isCompleted = currentStep > idx

            return (
              <div key={idx} className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="step-circle">
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span style={{ fontSize: '0.9rem' }}>{step}</span>
                <div className="step-line" />
              </div>
            )
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div key={currentStep} className="animate-slide-up" style={{ flex: 1 }}>
          
          {/* STEP 0: Select Role Template */}
          {currentStep === 0 && (
            <div>
              <h1 style={{ marginBottom: '16px' }}>Select Role Template</h1>
              <p style={{ marginBottom: '40px' }}>What position are you hiring your AI employee for? This defines their baseline skills.</p>
              
              <div className="role-grid">
                {[
                  { id: 'paralegal', title: 'Legal Paralegal', desc: 'Drafts contracts, reviews compliance, manages matter timelines.' },
                  { id: 'sales_sdr', title: 'Outbound SDR', desc: 'Prospects, qualifies, and schedules meetings autonomously.' },
                  { id: 'support_L2', title: 'L2 Tech Support', desc: 'Diagnoses bugs, queries databases, resolves complex tickets.' }
                ].map(role => (
                   <div 
                    key={role.id} 
                    className={`glass-panel role-card ${formData.role_id === role.id ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, role_id: role.id })}
                  >
                    <div className="role-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>{role.title}</h3>
                    <p style={{ fontSize: '0.9rem' }}>{role.desc}</p>
                   </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Company Identity */}
          {currentStep === 1 && (
            <div style={{ maxWidth: '600px' }}>
              <h1 style={{ marginBottom: '16px' }}>Company Context</h1>
              <p style={{ marginBottom: '40px' }}>Who does this employee work for? This context shapes their external voice.</p>
              
              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mehta & Associates"
                  value={formData.company_name}
                  onChange={e => setFormData({...formData, company_name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Company Domain (Tenant ID)</label>
                <input 
                  type="text" 
                  placeholder="e.g. mehta-associates.com"
                  value={formData.company_domain}
                  onChange={e => setFormData({...formData, company_domain: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Manager Assignment */}
          {currentStep === 2 && (
            <div style={{ maxWidth: '600px' }}>
              <h1 style={{ marginBottom: '16px' }}>Assign Manager</h1>
              <p style={{ marginBottom: '40px' }}>Who does this AI employee report to? High-risk actions will be routed to this person for approval.</p>
              
              <div className="form-group">
                <label>Direct Manager Email/Handle</label>
                <input 
                  type="email" 
                  placeholder="e.g. sarah.p@company.com"
                  value={formData.manager_email}
                  onChange={e => setFormData({...formData, manager_email: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Connect Channels */}
          {currentStep === 3 && (
            <div>
              <h1 style={{ marginBottom: '16px' }}>Where do they work?</h1>
              <p style={{ marginBottom: '40px' }}>Select the communication channels this employee will monitor and act on. Click on active integrations to authenticate.</p>
              
              <div className="role-grid">
                
                {/* Live Facebook/Instagram Connection */}
                <div 
                  className={`glass-panel role-card ${formData.channels.includes('Instagram/Meta') ? 'selected' : ''}`}
                  onClick={() => {
                    // 1. Mark as selected in state
                    const list = formData.channels;
                    if (!list.includes('Instagram/Meta')) {
                      setFormData({ ...formData, channels: [...list, 'Instagram/Meta'] });
                    }
                    
                    // 2. Launch popup OAuth flow
                    // Use tenant_id or company_domain if available as user identifier
                    const tenantId = formData.company_domain || 'anon_tenant';
                    const authUrl = `/api/auth/meta/connect?platform=instagram&source=onboarding&userId=${encodeURIComponent(tenantId)}`;
                    
                    // Open in a popup centered on the screen
                    const w = 500;
                    const h = 700;
                    const left = window.screen.width / 2 - w / 2;
                    const top = window.screen.height / 2 - h / 2;
                    window.open(authUrl, 'MetaAuth', `width=${w},height=${h},top=${top},left=${left}`);
                  }}
                  style={{ border: '1px solid #1877F2', position: 'relative' }}
                >
                  {formData.channels.includes('Instagram/Meta') && (
                    <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--success)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  )}
                  <h3 style={{ color: '#1877F2' }}>Instagram & Meta</h3>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Launch Auth Popup &rarr;</p>
                </div>

                {/* Other Static Options */}
                {['WhatsApp', 'Slack', 'Email (Outlook)'].map(channel => (
                  <div 
                    key={channel} 
                    className={`glass-panel role-card ${formData.channels.includes(channel) ? 'selected' : ''}`}
                    onClick={() => {
                      const list = formData.channels
                      setFormData({ 
                        ...formData, 
                        channels: list.includes(channel) ? list.filter(c => c !== channel) : [...list, channel] 
                      })
                    }}
                  >
                    <h3 style={{ color: 'var(--text-primary)' }}>{channel}</h3>
                    <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Internal Gateway Route</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Upload SOPs */}
          {currentStep === 4 && (
            <div>
              <h1 style={{ marginBottom: '16px' }}>Upload Standard Operating Procedures</h1>
              <p style={{ marginBottom: '24px' }}>Upload your exact company workflows, billing codes, and standard contract templates. The AI agent will convert these into its procedural memory layer.</p>
              
              <div className="upload-area">
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Click to upload or drag SOP documents here</h3>
                <p>Supports .pdf, .docx, .txt and Notion URLs</p>
              </div>
            </div>
          )}

          {/* STEP 5: Compliance */}
          {currentStep === 5 && (
            <div style={{ maxWidth: '600px' }}>
              <h1 style={{ marginBottom: '16px' }}>IronPass Compliance</h1>
              <p style={{ marginBottom: '40px' }}>Configure the risk isolation levels for this deployment.</p>
              
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Strict Compliance Mode</h3>
                    <p style={{ fontSize: '0.85rem' }}>Automate suspension hooks for HIGH/CRITICAL tools and feed audit logs securely.</p>
                  </div>
                  <div 
                    style={{ 
                      width: '48px', height: '24px', 
                      borderRadius: '12px', 
                      background: formData.strict_compliance ? 'var(--success)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => setFormData({...formData, strict_compliance: !formData.strict_compliance})}
                  >
                    <div style={{
                      position: 'absolute', top: '2px', left: formData.strict_compliance ? '26px' : '2px',
                      width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                      transition: 'left 0.2s cubic-bezier(0.19, 1, 0.22, 1)'
                    }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Deploy */}
          {currentStep === 6 && (
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                background: 'var(--success)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 32px',
                boxShadow: '0 0 40px rgba(46, 172, 104, 0.4)'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h1 style={{ marginBottom: '16px' }}>Ready to Deploy</h1>
              <p style={{ marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
                Your {formData.role_id || 'AI Employee'} is now fully equipped and bound to the {formData.company_domain || 'company'} tenant. 
                They are standing by in memory, waiting for their first task.
              </p>
              
              <button 
                className="btn-primary" 
                style={{ padding: '16px 40px', fontSize: '1.1rem' }}
                onClick={() => router.push('/dashboard')}
              >
                Deploy AI Employee
              </button>
            </div>
          )}

        </div>

        {/* Controls Row */}
        {currentStep < 6 && (
          <div className="controls-row">
            <button 
              className="btn-secondary" 
              onClick={prevStep}
              style={{ opacity: currentStep === 0 ? 0 : 1, pointerEvents: currentStep === 0 ? 'none' : 'auto' }}
            >
              Back
            </button>
            <button className="btn-primary" onClick={nextStep}>
              {currentStep === 5 ? 'Finalize' : 'Continue'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
