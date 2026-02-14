import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-neutral-800/50 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">FlowPilot</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-neutral-400 hover:text-white transition-colors text-sm">
              Features
            </a>
            <a href="#how-it-works" className="text-neutral-400 hover:text-white transition-colors text-sm">
              How it Works
            </a>
            <a href="#pricing" className="text-neutral-400 hover:text-white transition-colors text-sm">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/signin" className="text-neutral-400 hover:text-white transition-colors text-sm px-4 py-2">
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 bg-white hover:bg-neutral-200 text-black text-sm font-medium rounded-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-36 pb-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Now with Telegram & Email integrations
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            <span className="text-white">Automate your</span>
            <br />
            <span className="text-white/90">
              workflows visually
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connect triggers and actions with a drag-and-drop builder. Send emails, push Telegram alerts, call webhooks — all without writing code.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white hover:bg-neutral-200 text-black rounded-xl transition-all text-lg font-medium shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-[0.98]"
            >
              Start Building — Free
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-neutral-700 hover:border-neutral-600 bg-neutral-900/40 backdrop-blur-sm text-neutral-300 hover:text-white rounded-xl transition-all text-lg font-medium"
            >
              Explore Features
            </a>
          </div>

          {/* Product Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />
            <div className="aspect-video bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl shadow-white/[0.03] overflow-hidden relative">
              {/* Fake workflow builder preview */}
              <div className="absolute inset-0 p-8 flex items-center justify-center">
                <div className="flex items-center gap-6">
                  {/* Trigger node */}
                  <div className="px-5 py-4 bg-neutral-800/80 border border-neutral-700 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Trigger</p>
                      <p className="text-sm text-white font-medium">Webhook</p>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-[2px] bg-white/30" />
                    <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  {/* Action node */}
                  <div className="px-5 py-4 bg-neutral-800/80 border border-neutral-700 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Action</p>
                      <p className="text-sm text-white font-medium">Send Email</p>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-[2px] bg-white/30" />
                    <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  {/* Action node 2 */}
                  <div className="px-5 py-4 bg-neutral-800/80 border border-neutral-700 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Action</p>
                      <p className="text-sm text-white font-medium">Telegram</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Dot grid background */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Everything you need to automate
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Powerful building blocks for your workflow automations, no code required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
                title: "Visual Builder",
                desc: "Drag-and-drop workflow editor. Connect triggers to actions with an intuitive canvas.",
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Event Monitoring",
                desc: "Track events in real-time. Trigger automations on incoming webhooks and schedules.",
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                ),
                title: "Multi-Channel Alerts",
                desc: "Send notifications via Email and Telegram. Template variables auto-filled from triggers.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 hover:border-neutral-700 rounded-2xl p-8 transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.03)]"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-3">How it Works</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Three steps to automation
            </h2>
          </div>

          <div className="space-y-8">
            {[
              { step: "01", title: "Pick a Trigger", desc: "Choose what starts your workflow — a webhook, a schedule, or a wallet event." },
              { step: "02", title: "Add Actions", desc: "Chain actions like sending emails, Telegram messages, or calling webhooks." },
              { step: "03", title: "Deploy & Relax", desc: "Save your workflow and it runs automatically whenever the trigger fires." },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-6 group">
                <div className="w-14 h-14 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{s.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{s.title}</h3>
                  <p className="text-neutral-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-[-50%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10">
              Ready to automate?
            </h2>
            <p className="text-xl text-neutral-400 mb-10 relative z-10">
              Join and start building powerful workflow automations today.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-white hover:bg-neutral-200 text-black rounded-xl transition-all text-lg font-medium shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-[0.98] relative z-10"
            >
              Get Started — It&apos;s Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/50 py-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-neutral-500 text-sm">© 2026 FlowPilot. All rights reserved.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">Privacy</a>
            <a href="#" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">Terms</a>
            <a href="#" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
