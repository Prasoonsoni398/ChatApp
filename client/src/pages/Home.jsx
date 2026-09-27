import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  BsChatDotsFill,
  BsClockHistory,
  BsMusicNoteBeamed,
  BsArrowRight,
  BsCheckCircleFill,
  BsArrowUpShort,
  BsCameraVideoFill,
} from "react-icons/bs";
import HeroPhone from "../components/HeroPhone.jsx";
import homeFeatures from "../mockData/homeFeatures.js";
import useAuthRedirect from "../hooks/useAuthRedirect.js";

const Home = () => {
  useAuthRedirect();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openMediaExpiryModal = () => {
    window.dispatchEvent(new CustomEvent("open-media-expiry-modal"));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 12 },
    },
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col justify-between relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* ── Ambient Background Glows ── */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-40 right-0 w-[550px] h-[550px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-96 left-10 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* ── Main Container ── */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex-grow flex flex-col items-center">
        {/* ── 1. HERO SECTION ── */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8 pt-6 pb-16 w-full">
          {/* Left Text & CTA */}
          <motion.div
            className="text-center lg:text-left lg:w-1/2 flex flex-col items-center lg:items-start"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Live Update Announcement Pill */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-base-200/90 border border-base-300 backdrop-blur-md shadow-xs mb-6 cursor-pointer group"
              onClick={openMediaExpiryModal}
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-base-content/90 tracking-wide">
                Guftgu 2.0 • Status Studio & 48h Media Purge
              </span>
              <BsArrowRight
                size={12}
                className="text-primary group-hover:translate-x-1 transition-transform"
              />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6 text-base-content"
            >
              Connect Seamlessly.{" "}
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Chat Freely.
              </span>{" "}
              <br />
              Zero Footprint.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-base-content/75 mb-8 max-w-xl font-normal leading-relaxed"
            >
              The modern messaging suite with sub-50ms real-time chat,
              WhatsApp-style Status Studio with music trimming, and an automatic
              <strong className="text-base-content font-semibold">
                {" "}
                48-hour permanent cloud media purge
              </strong>{" "}
              engineered for true privacy.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto mb-10"
            >
              <Link
                to="/signup"
                className="btn btn-primary btn-lg rounded-2xl px-8 shadow-lg shadow-primary/25 font-semibold text-base gap-2 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started Free <BsArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="btn btn-outline btn-lg rounded-2xl px-8 font-semibold text-base border-base-300 hover:border-primary hover:bg-base-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign In to Account
              </Link>
            </motion.div>

            {/* Quick Metrics Bar */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg border-t border-base-300/60 pt-6 text-left"
            >
              <div>
                <span className="text-xl sm:text-2xl font-black text-primary block">
                  &lt;50ms
                </span>
                <span className="text-[11px] text-base-content/60 font-medium">
                  Real-Time Latency
                </span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-emerald-500 block">
                  48h
                </span>
                <span className="text-[11px] text-base-content/60 font-medium">
                  Media Auto-Purge
                </span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-teal-500 block">
                  24h
                </span>
                <span className="text-[11px] text-base-content/60 font-medium">
                  Status Stories
                </span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-accent block">
                  100%
                </span>
                <span className="text-[11px] text-base-content/60 font-medium">
                  Private & Secure
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Phone Showcase */}
          <motion.div
            className="lg:w-1/2 flex justify-center lg:justify-end relative"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {/* Soft decorative backdrop glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-emerald-500/10 to-transparent rounded-full filter blur-2xl -z-10 transform scale-90" />
            <HeroPhone />
          </motion.div>
        </section>

        {/* ── 2. 48-HOUR PRIVACY SPOTLIGHT BANNER ── */}
        <section className="w-full my-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-base-200 via-base-200/90 to-base-300/60 border border-base-300 shadow-xl overflow-hidden"
          >
            {/* Background badge accent */}
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4 max-w-2xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 flex-shrink-0 shadow-sm">
                  <BsClockHistory size={28} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                    Architectural Privacy
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-1.5">
                    Permanent 48-Hour Media Deletion
                  </h3>
                  <p className="text-xs sm:text-sm text-base-content/75 leading-relaxed">
                    All photos, videos, audio messages, and documents uploaded
                    to Guftgu are automatically purged from Cloudinary storage
                    after 48 hours. Your conversations remain fast and clean
                    with zero long-term cloud exposure.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={openMediaExpiryModal}
                  className="btn btn-primary rounded-xl px-5 font-semibold text-xs sm:text-sm shadow-md w-full sm:w-auto"
                >
                  View Storage Policy
                </button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── 3. FEATURES SHOWCASE GRID ── */}
        <section className="w-full my-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="badge badge-primary badge-outline font-semibold px-3 py-2 text-xs uppercase tracking-wider mb-3">
              Power Packed Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
              Engineered for Expression & Privacy
            </h2>
            <p className="text-sm sm:text-base text-base-content/70 mt-3 font-normal">
              Every feature in Guftgu is crafted to bring you closer to friends
              while giving you complete control over your content.
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {homeFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.01 }}
                className="rounded-3xl p-6 bg-base-100/80 backdrop-blur-sm border border-base-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${feature.iconBg} ${feature.iconColor} shadow-xs group-hover:scale-110 transition-transform`}
                    >
                      {feature.icon}
                    </div>
                    {feature.badge && (
                      <span
                        className={`badge badge-sm font-semibold ${feature.badgeColor || "badge-ghost"}`}
                      >
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-base-content mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-base-300/40 flex items-center text-xs font-semibold text-primary gap-1 group-hover:gap-2 transition-all">
                  <span>Learn more</span>
                  <BsArrowRight size={12} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── 4. STATUS STUDIO SPOTLIGHT ── */}
        <section className="w-full my-12 rounded-3xl bg-base-200/60 border border-base-300 p-8 sm:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <BsMusicNoteBeamed /> Creative Expression
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-base-content leading-tight mb-4">
                WhatsApp-Inspired <br />
                <span className="text-primary">Status Creation Studio</span>
              </h2>
              <p className="text-sm sm:text-base text-base-content/70 leading-relaxed mb-6">
                Tell your story with precision. Select any video or image, trim
                the exact segment, overlay licensed background music with volume
                mixing, add freehand drawing, stickers, and custom fonts.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Visual Video Timeline & 30-Second Segment Selector",
                  "Built-in Music Library with Song Portion Selector",
                  "Interactive Drawing Pen, Filters & Emoji Overlays",
                  "Audience Privacy (My Contacts, Except, Only Share With)",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-xs sm:text-sm text-base-content/85"
                  >
                    <BsCheckCircleFill
                      className="text-primary flex-shrink-0"
                      size={16}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/signup"
                className="btn btn-primary rounded-xl px-6 font-semibold text-sm shadow-md"
              >
                Create Your First Status
              </Link>
            </div>

            {/* Visual Studio Card Preview */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-3xl bg-black border border-white/10 shadow-2xl overflow-hidden p-4 text-white relative">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-white/70">
                  <span className="font-semibold text-white">
                    Status Studio Preview
                  </span>
                  <span className="badge badge-xs badge-primary font-bold">
                    24h Story
                  </span>
                </div>
                <div className="h-64 my-3 rounded-2xl bg-gradient-to-tr from-emerald-950 via-teal-900 to-black relative flex items-center justify-center overflow-hidden border border-white/5">
                  <div className="text-center p-4">
                    <BsCameraVideoFill
                      size={36}
                      className="text-primary mx-auto mb-2 opacity-80"
                    />
                    <p className="text-xs font-semibold text-white/90">
                      "Summer Roadtrip 🌴"
                    </p>
                    <p className="text-[10px] text-white/50">
                      Trim: 00:12 - 00:27 • 🎵 Chill Beats (80% mix)
                    </p>
                  </div>
                  <div className="absolute bottom-2 inset-x-3 py-1.5 px-3 rounded-xl bg-black/60 backdrop-blur-md flex items-center justify-between text-[10px] text-white/80">
                    <span className="truncate">🎵 Lofi Vibes — Chill Hop</span>
                    <span className="text-primary font-bold">15s</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/60 pt-1">
                  <span>🔒 Shared with My Contacts</span>
                  <span className="text-emerald-400 font-semibold">
                    HD Quality
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. READY TO JOIN CTA BANNER ── */}
        <section className="w-full my-12 text-center">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-teal-500/10 border border-primary/20 shadow-xl max-w-4xl mx-auto flex flex-col items-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-base-content mb-4 tracking-tight">
              Ready to Chat with Complete Peace of Mind?
            </h2>
            <p className="text-sm sm:text-base text-base-content/75 max-w-xl mb-8 leading-relaxed">
              Join Guftgu today. Zero tracking, zero permanent media storage,
              and all the modern messaging features you love.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                to="/signup"
                className="btn btn-primary btn-lg rounded-2xl px-8 font-semibold shadow-lg shadow-primary/30"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="btn btn-outline btn-lg rounded-2xl px-8 font-semibold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── 6. LUXURIOUS MODERN FOOTER ── */}
      <footer className="w-full bg-base-200/90 border-t border-base-300 text-base-content relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-base-300/80">
            {/* Brand Column (2 cols wide on desktop) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-primary-content flex items-center justify-center shadow-md">
                  <BsChatDotsFill size={18} />
                </div>
                <span className="text-2xl font-black tracking-tight text-base-content">
                  Guftgu
                </span>
                <span className="badge badge-sm badge-primary font-bold">
                  2.0
                </span>
              </div>

              <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-sm">
                The privacy-first messaging platform engineered for seamless
                real-time communication, creative status updates, and automatic
                48-hour permanent media purging.
              </p>

              {/* System status pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-300/60 border border-base-300 text-xs text-base-content/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  All Systems Operational
                </span>
                <span className="text-base-content/40">•</span>
                <span className="text-base-content/60">
                  Cloudinary Purge Active
                </span>
              </div>
            </div>

            {/* Column 1: Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">
                Product
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-base-content/75">
                <li>
                  <Link
                    to="/signup"
                    className="hover:text-primary transition-colors"
                  >
                    Web Messenger
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="hover:text-primary transition-colors"
                  >
                    Status Studio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="hover:text-primary transition-colors"
                  >
                    Broadcast Channels
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="hover:text-primary transition-colors"
                  >
                    Community Hubs
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="hover:text-primary transition-colors"
                  >
                    Voice & Audio Notes
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Privacy & Security */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-4">
                Privacy & Data
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-base-content/75">
                <li>
                  <button
                    type="button"
                    onClick={openMediaExpiryModal}
                    className="hover:text-secondary transition-colors text-left font-medium text-primary flex items-center gap-1 cursor-pointer"
                  >
                    48h Media Purge Policy
                  </button>
                </li>
                <li>
                  <span className="hover:text-secondary transition-colors cursor-pointer">
                    Passcode & Chat Lock
                  </span>
                </li>
                <li>
                  <span className="hover:text-secondary transition-colors cursor-pointer">
                    Disappearing Messages
                  </span>
                </li>
                <li>
                  <span className="hover:text-secondary transition-colors cursor-pointer">
                    View-Once Media
                  </span>
                </li>
                <li>
                  <span className="hover:text-secondary transition-colors cursor-pointer">
                    Server-Side Encryption
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal & Support */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-4">
                Legal & Company
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-base-content/75">
                <li>
                  <span className="hover:text-accent transition-colors cursor-pointer">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="hover:text-accent transition-colors cursor-pointer">
                    Terms of Service
                  </span>
                </li>
                <li>
                  <span className="hover:text-accent transition-colors cursor-pointer">
                    Security Architecture
                  </span>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={openMediaExpiryModal}
                    className="hover:text-accent transition-colors text-left cursor-pointer"
                  >
                    Cloud Storage Rules
                  </button>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-accent transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright, Policy Trigger & Back-to-Top */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-base-content/60">
            <div className="flex items-center gap-2">
              <p>
                © 2026 Guftgu Inc. All rights reserved. Crafted with care for
                private communication.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={openMediaExpiryModal}
                className="hover:text-primary transition-colors underline decoration-dotted cursor-pointer"
              >
                Media Expiry Details
              </button>

              <button
                type="button"
                onClick={scrollToTop}
                className="btn btn-ghost btn-xs rounded-full gap-1 text-base-content/70 hover:text-primary hover:bg-base-300 cursor-pointer"
                title="Back to top"
              >
                <span>Back to top</span>
                <BsArrowUpShort size={16} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
