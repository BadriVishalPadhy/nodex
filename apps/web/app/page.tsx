"use client";
import { motion } from "framer-motion";
import { ArrowUpRight, Zap, GitBranch, Layers, MessageSquare, Mail, Send, Shield, Activity, RefreshCw } from "lucide-react";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: "easeOut" as const },
  }),
};

export default function Home() {
  return (
    <div className="relative min-h-screen font-pixel">
      {/* ── Full-Screen Background Video (z-0) ───────────────── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_074215_04640ca7-042c-45d6-bb56-58b1e8a42489.mp4"
          type="video/mp4"
        />
      </video>

      {/* ── All Content (z-10) ───────────────────────────────── */}
      <div className="relative z-10">
        {/* ── Navbar ──────────────────────────────────────────── */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4">
          <div className="relative flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">
                nodex
              </span>
            </div>

            {/* Center: Nav links — absolutely centered */}
            <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              <a href="#architecture" className="text-white/70 hover:text-white transition-colors text-sm">
                Architecture
              </a>
              <a href="#how-it-works" className="text-white/70 hover:text-white transition-colors text-sm">
                How it Works
              </a>
              <a href="#features" className="text-white/70 hover:text-white transition-colors text-sm">
                Features
              </a>
            </div>

            {/* Right: Auth buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/signin"
                className="text-white/70 hover:text-white transition-colors text-sm px-4 py-2"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 bg-white hover:bg-white/90 text-black text-sm font-medium rounded-full transition-all active:scale-[0.98] flex items-center gap-1.5"
              >
                Get Started
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero Section ────────────────────────────────────── */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ paddingBottom: "250px" }}>
          <motion.div
            className="max-w-4xl mx-auto flex flex-col items-center"
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              custom={0}
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs text-white/90 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Now with Telegram &amp; Email integrations
            </motion.div>

            {/* Heading */}
            <motion.h1
              custom={1}
              variants={fadeUp}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.05] tracking-tight text-white"
            >
              Automate your{" "}
              <span className="text-white/90">workflows visually</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              custom={2}
              variants={fadeUp}
              className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Connect triggers and actions with a drag-and-drop builder.
              Send emails, push Telegram alerts, call webhooks — all without
              writing code.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              custom={3}
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/signup"
                className="px-8 py-4 bg-white hover:bg-white/90 text-black rounded-full transition-all text-lg font-medium active:scale-[0.98] flex items-center gap-2"
              >
                Start Building — Free
                <ArrowUpRight className="w-5 h-5" />
              </Link>
              <a
                href="#architecture"
                className="px-8 py-4 border border-white/30 hover:border-white/50 bg-white/5 backdrop-blur-sm text-white rounded-full transition-all text-lg font-medium hover:bg-white/10"
              >
                Explore
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Architecture Section ────────────────────────────── */}
        <section id="architecture" className="py-24 px-6 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <motion.div
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-3">
                Architecture
              </p>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-5 tracking-tight">
                Built for scale &amp; reliability
              </h2>
              <p className="text-neutral-400 max-w-2xl mx-auto text-lg leading-relaxed">
                An event-driven microservices architecture with transactional
                guarantees, message queues, and parallel workers — designed to
                never lose an event.
              </p>
            </motion.div>

            {/* Architecture Diagram */}
            <motion.div
              className="max-w-4xl mx-auto mb-24"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/architecture.png"
                  alt="System architecture: Frontend → Server → Webhooks → Outbox → Kafka → Workers"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>

            {/* Architecture Details Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Layers,
                  title: "Microservices Monorepo",
                  desc: "5 independently deployable services — Server, Web, Webhooks, Processor, and Worker — managed in a single Turborepo monorepo with shared packages for database access, UI components, and config.",
                },
                {
                  icon: GitBranch,
                  title: "Transactional Outbox Pattern",
                  desc: 'Every webhook event is persisted in the database alongside an outbox marker in a single ACID transaction. A dedicated Processor polls the outbox and publishes to Kafka — guaranteeing zero data loss even if Kafka is temporarily down.',
                },
                {
                  icon: Activity,
                  title: "Kafka Event Pipeline",
                  desc: "Apache Kafka (Aiven) provides durable, ordered message delivery between the Processor and Workers. Manual offset commits ensure at-least-once delivery — messages are never lost on worker crashes.",
                },
                {
                  icon: RefreshCw,
                  title: "Stage-Based Execution",
                  desc: "Workflows execute action chains stage-by-stage through Kafka re-queuing. Each action gets its own retry boundary — if stage 2 fails, stages 0–1 are not re-executed. This enables partial retries and parallel scaling.",
                },
                {
                  icon: Mail,
                  title: "Multi-Channel Actions",
                  desc: "Workers support Email (via SMTP/Nodemailer) and Telegram (via Bot API) actions out of the box. Template interpolation replaces {variables} with live event data, so notifications are dynamic and contextual.",
                },
                {
                  icon: Shield,
                  title: "Security & Auth",
                  desc: "JWT authentication with httpOnly cookies prevents XSS token theft. Zod validates all API inputs at runtime. Kafka connections use mTLS with SSL certificates. CORS whitelisting restricts cross-origin requests.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                    <item.icon className="w-5 h-5 text-white/80" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it Works ────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 px-6 bg-[#0a0a0a] border-t border-neutral-800/50">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-3">
                How it Works
              </p>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                Three steps to automation
              </h2>
            </motion.div>

            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Pick a Trigger",
                  desc: "Choose what starts your workflow — an incoming webhook, a manual trigger, or an external event.",
                },
                {
                  step: "02",
                  title: "Add Actions",
                  desc: "Chain actions like sending emails, Telegram messages, or calling external APIs. Use {variables} for dynamic content.",
                },
                {
                  step: "03",
                  title: "Deploy & Relax",
                  desc: "Save your workflow and it runs automatically whenever the trigger fires. Events are processed reliably through Kafka.",
                },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-start gap-6 group hover:translate-x-2 transition-transform duration-300"
                >
                  <div className="w-14 h-14 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {s.step}
                    </span>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {s.title}
                    </h3>
                    <p className="text-neutral-400">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Grid ───────────────────────────────────── */}
        <section id="features" className="py-24 px-6 bg-[#0a0a0a] border-t border-neutral-800/50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-3">
                Features
              </p>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                Everything you need
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: "Visual Workflow Builder",
                  desc: "Drag-and-drop React Flow canvas to design workflows. Connect triggers to actions visually.",
                },
                {
                  icon: MessageSquare,
                  title: "Telegram Notifications",
                  desc: "Send formatted messages to any Telegram chat with dynamic template variables.",
                },
                {
                  icon: Mail,
                  title: "Email Alerts",
                  desc: "SMTP-powered email delivery with customizable subject, body, and recipient templates.",
                },
                {
                  icon: Send,
                  title: "Webhook Triggers",
                  desc: "Each workflow gets a unique URL. Any service can POST events to trigger the action chain.",
                },
                {
                  icon: GitBranch,
                  title: "Action Chaining",
                  desc: "Build multi-step pipelines. Actions execute sequentially with stage-based re-queuing.",
                },
                {
                  icon: Shield,
                  title: "Secure by Default",
                  desc: "JWT + httpOnly cookies, bcrypt hashing, Zod validation, and mTLS for Kafka connections.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-white/80" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ─────────────────────────────────────── */}
        <section className="py-24 px-6 bg-[#0a0a0a] border-t border-neutral-800/50">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="absolute top-[-50%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10">
                Ready to automate?
              </h2>
              <p className="text-xl text-neutral-400 mb-10 relative z-10">
                Join and start building powerful workflow automations today.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-white/90 text-black rounded-full transition-all text-lg font-medium active:scale-[0.98] relative z-10"
              >
                Get Started — It&apos;s Free
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="border-t border-neutral-800/50 py-12 px-6 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <Zap className="w-3 h-3 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-neutral-500 text-sm">nodex</span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">
                Privacy
              </a>
              <a href="#" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">
                Terms
              </a>
              <a href="#" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
