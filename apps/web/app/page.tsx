import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Inject Custom Keyframes for SVG Animations safely */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flow-dash {
          from { stroke-dashoffset: 8; }
          to { stroke-dashoffset: 0; }
        }
        .animate-flow-dash {
          animation: flow-dash 0.8s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-opacity {
          animation: pulse-opacity 2s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 25s linear infinite;
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 30s linear infinite;
        }
      `}} />

      {/* Ambient glow orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Animated SVG Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] overflow-hidden pointer-events-none z-0 opacity-10 flex items-center justify-center">
        <svg viewBox="0 0 800 800" className="w-full h-full text-white">
          <circle cx="400" cy="400" r="350" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="10 20" className="animate-spin-slow origin-center" />
          <circle cx="400" cy="400" r="250" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="5 15" className="animate-spin-slow-reverse origin-center" />
          <circle cx="400" cy="400" r="150" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="2 8" className="animate-spin-slow origin-center" />
        </svg>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-neutral-800/50 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center transition-transform group-hover:scale-105">
              <svg className="w-4 h-4 text-black group-hover:animate-pulse-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">nodex</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#architecture" className="text-neutral-400 hover:text-white transition-colors text-sm">Architecture</a>
            <a href="#how-it-works" className="text-neutral-400 hover:text-white transition-colors text-sm">How it Works</a>
            <a href="#pricing" className="text-neutral-400 hover:text-white transition-colors text-sm">Pricing</a>
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
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Now with Telegram & Email integrations
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            <span className="text-white">Automate your</span>
            <br />
            <span className="text-white/90">workflows visually</span>
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
              href="#architecture"
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
                <div className="flex items-center">

                  {/* Trigger node */}
                  <div className="px-5 py-4 bg-neutral-800/90 border border-neutral-700 rounded-xl flex items-center gap-3 shadow-lg z-10">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <svg className="w-5 h-5 text-black animate-pulse-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Trigger</p>
                      <p className="text-sm text-white font-medium">Webhook</p>
                    </div>
                  </div>

                  {/* Animated Flow Arrow 1 */}
                  <div className="flex items-center justify-center w-16 -mx-2 z-0">
                    <svg className="w-full h-6 overflow-visible" viewBox="0 0 64 24" fill="none">
                      <line x1="0" y1="12" x2="58" y2="12" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeDasharray="4 4" className="animate-flow-dash" />
                      <polygon points="58,8 64,12 58,16" fill="rgba(255,255,255,0.4)" />
                    </svg>
                  </div>

                  {/* Action node 1 */}
                  <div className="px-5 py-4 bg-neutral-800/90 border border-neutral-700 rounded-xl flex items-center gap-3 shadow-lg z-10">
                    <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white animate-float" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Action</p>
                      <p className="text-sm text-white font-medium">Send Email</p>
                    </div>
                  </div>

                  {/* Animated Flow Arrow 2 */}
                  <div className="flex items-center justify-center w-16 -mx-2 z-0">
                    <svg className="w-full h-6 overflow-visible" viewBox="0 0 64 24" fill="none">
                      <line x1="0" y1="12" x2="58" y2="12" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeDasharray="4 4" className="animate-flow-dash" />
                      <polygon points="58,8 64,12 58,16" fill="rgba(255,255,255,0.4)" />
                    </svg>
                  </div>

                  {/* Action node 2 */}
                  <div className="px-5 py-4 bg-neutral-800/90 border border-neutral-700 rounded-xl flex items-center gap-3 shadow-lg z-10">
                    <div className="w-10 h-10 rounded-lg bg-neutral-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white animate-float-delayed" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </div>
                    <div className="text-left">
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

      {/* Architecture Section */}
      <section id="architecture" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-3">Architecture</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Built for scale &amp; reliability
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Event-driven architecture with transactional guarantees, message queues, and parallel workers.
            </p>
          </div>

          <div className="bg-neutral-900/60 max-w-2xl mx-auto backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl shadow-white/[0.03] overflow-hidden">
            <img
              src="/architecture.png"
              alt="System architecture diagram showing Frontend workflow pipeline, Webhook processing, Transactional Outbox Pattern, Processor, Kafka message bus, and parallel Workers"
              className="w-full h-auto"
            />
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
              <div key={i} className="flex items-start gap-6 group hover:translate-x-2 transition-transform duration-300">
                <div className="w-14 h-14 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                  {/* Animated SVG Ring around Step */}
                  <svg className="absolute inset-0 w-full h-full text-white/20 animate-spin-slow origin-center" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="6 6" />
                  </svg>
                  <span className="text-lg font-bold text-white relative z-10">{s.step}</span>
                </div>
                <div className="pt-2">
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
            {/* CTA Background Decor */}
            <div className="absolute top-[-50%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />

            <div className="absolute -top-12 -right-12 w-64 h-64 text-white/[0.03] pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow origin-center">
                <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" />
                <rect x="35" y="35" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-spin-slow-reverse origin-center" />
              </svg>
            </div>

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
            <span className="text-neutral-500 text-sm">© 2026 nodex. All rights reserved.</span>
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
