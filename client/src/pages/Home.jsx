import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { BsArrowRight } from "react-icons/bs";
import HeroPhone from "../components/HeroPhone.jsx";
import useAuthRedirect from "../hooks/useAuthRedirect.js";

const Home = () => {
  useAuthRedirect();

  const openMediaExpiryModal = () => {
    window.dispatchEvent(new CustomEvent("open-media-expiry-modal"));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 110, damping: 14 },
    },
  };

  return (
    <div className="flex-1 min-h-0 h-full w-full bg-base-100 text-base-content flex flex-col justify-between relative overflow-y-auto overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* ── Ambient Background Glows ── */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[450px] bg-primary/12 rounded-full blur-[120px] sm:blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-20 right-0 w-[300px] sm:w-[480px] h-[300px] sm:h-[480px] bg-secondary/10 rounded-full blur-[130px] sm:blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] bg-teal-500/10 rounded-full blur-[120px] sm:blur-[130px] pointer-events-none -z-10" />

      {/* ── Main Hero Section (Fully Responsive for Mobile, Tablet & Laptop) ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-4 flex items-center justify-center shrink-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center w-full my-auto">
          {/* Left Hero Column: Headline, CTAs, Highlights */}
          <motion.div
            className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left z-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Live Update Announcement Pill */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-base-200/90 border border-base-300 backdrop-blur-md shadow-xs mb-3.5 sm:mb-5 cursor-pointer group"
              onClick={openMediaExpiryModal}
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-base-content/90 tracking-wide">
                Guftgu 2.0 • Status Studio & 48h Media Purge
              </span>
              <BsArrowRight
                size={11}
                className="text-primary group-hover:translate-x-1 transition-transform"
              />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-3xl xs:text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.12] sm:leading-[1.1] mb-3 sm:mb-4 text-base-content"
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
              className="text-xs sm:text-sm lg:text-base text-base-content/75 mb-5 sm:mb-6 max-w-lg font-normal leading-relaxed px-1 sm:px-0"
            >
              The modern messaging suite with sub-50ms real-time chat,
              high-definition audio & video calls, and an automatic
              <strong className="text-base-content font-semibold">
                {" "}
                48-hour permanent cloud media purge
              </strong>{" "}
              engineered for true privacy.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mb-6"
            >
              <Link
                to="/signup"
                className="btn btn-primary btn-md lg:btn-lg rounded-2xl px-6 sm:px-7 shadow-lg shadow-primary/25 font-semibold text-sm lg:text-base gap-2 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
              >
                Get Started Free <BsArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="btn btn-outline btn-md lg:btn-lg rounded-2xl px-6 sm:px-7 font-semibold text-sm lg:text-base border-base-300 hover:border-primary hover:bg-base-200 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
              >
                Sign In to Account
              </Link>
            </motion.div>

            {/* Quick Metrics Bar */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-4 gap-2 sm:gap-4 w-full max-w-sm sm:max-w-md border-t border-base-300/70 pt-3 sm:pt-4 text-center sm:text-left"
            >
              <div>
                <span className="text-sm xs:text-base sm:text-xl font-black text-primary block">
                  &lt;50ms
                </span>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] text-base-content/60 font-medium">
                  Real-Time
                </span>
              </div>
              <div>
                <span className="text-sm xs:text-base sm:text-xl font-black text-emerald-500 block">
                  48h
                </span>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] text-base-content/60 font-medium">
                  Auto-Purge
                </span>
              </div>
              <div>
                <span className="text-sm xs:text-base sm:text-xl font-black text-teal-500 block">
                  24h
                </span>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] text-base-content/60 font-medium">
                  Stories
                </span>
              </div>
              <div>
                <span className="text-sm xs:text-base sm:text-xl font-black text-accent block">
                  100%
                </span>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] text-base-content/60 font-medium">
                  Encrypted
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Hero Column: 3D Interactive Smartphone Showcase */}
          <motion.div
            className="lg:col-span-5 flex justify-center items-center relative w-full overflow-hidden sm:overflow-visible py-2"
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            {/* Ambient halo behind phone */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-emerald-500/10 to-transparent rounded-full filter blur-2xl -z-10 transform scale-90" />
            <div className="transform scale-[0.76] xs:scale-[0.84] sm:scale-95 lg:scale-90 xl:scale-100 origin-center transition-transform">
              <HeroPhone />
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── Rights Footer (Fully Responsive for Mobile & Desktop) ── */}
      <footer className="w-full border-t border-base-300/80 bg-base-100/90 backdrop-blur-xs py-3 px-4 sm:px-8 text-xs text-base-content/65 relative z-20 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Links Row */}
          <div className="flex items-center justify-center gap-3 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-cookie-consent"))
              }
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Cookie & Permissions
            </button>
            <span className="text-base-content/30">•</span>
            <button
              type="button"
              onClick={openMediaExpiryModal}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              48h Storage Policy
            </button>
          </div>

          {/* Rights & Author Notice (Stacked on small screens, inline on sm+) */}
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-right text-[11px] sm:text-xs">
            <span className="whitespace-nowrap">
              &copy; {new Date().getFullYear()} Guftgu. All rights reserved.
            </span>
            <span className="text-base-content/40 hidden sm:inline">•</span>
            <span className="whitespace-nowrap inline-flex items-center gap-1">
              Made with <span className="text-rose-500">❤️</span> by Prasoon
              Soni
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
