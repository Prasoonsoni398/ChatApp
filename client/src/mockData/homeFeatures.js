import React from "react";
import {
  BsLightningChargeFill,
  BsShieldLockFill,
  BsStars,
  BsClockHistory,
  BsMusicNoteBeamed,
  BsBroadcast,
} from "react-icons/bs";

/**
 * Enhanced Feature Showcase for the Guftgu Home Page.
 */
const homeFeatures = [
  {
    title: "Instant Real-Time Messaging",
    desc: "Sub-50ms message delivery with live typing indicators, delivery receipts, and fluid emoji reactions.",
    badge: "Ultra Fast",
    badgeColor: "badge-warning",
    icon: React.createElement(BsLightningChargeFill),
    iconBg: "bg-warning/15 border border-warning/30",
    iconColor: "text-warning",
  },
  {
    title: "WhatsApp-Style Status Studio",
    desc: "Share 24-hour photo & video stories with interactive trimming, song library attachments, stickers, and filters.",
    badge: "New Feature",
    badgeColor: "badge-primary",
    icon: React.createElement(BsMusicNoteBeamed),
    iconBg: "bg-primary/15 border border-primary/30",
    iconColor: "text-primary",
  },
  {
    title: "48-Hour Cloud Media Purge",
    desc: "All shared photos, videos, and documents are automatically and permanently deleted from Cloudinary after 48 hours.",
    badge: "Zero-Trace",
    badgeColor: "badge-info",
    icon: React.createElement(BsClockHistory),
    iconBg: "bg-info/15 border border-info/30",
    iconColor: "text-info",
  },
  {
    title: "Privacy & App Passcode Lock",
    desc: "Keep confidential chats secure with custom PIN passcode locking, stealth disappearing chats, and view-once media.",
    badge: "Ironclad",
    badgeColor: "badge-success",
    icon: React.createElement(BsShieldLockFill),
    iconBg: "bg-success/15 border border-success/30",
    iconColor: "text-success",
  },
  {
    title: "Broadcast Channels & Hubs",
    desc: "Create unlimited subscriber channels, multi-group community networks, and interactive voting polls.",
    badge: "Communities",
    badgeColor: "badge-secondary",
    icon: React.createElement(BsBroadcast),
    iconBg: "bg-secondary/15 border border-secondary/30",
    iconColor: "text-secondary",
  },
  {
    title: "Rich Theming & Modern UI",
    desc: "Enjoy a tailored visual experience with dark mode, OLED midnight, Mintlify green, and responsive glassmorphism.",
    badge: "Modern UI",
    badgeColor: "badge-accent",
    icon: React.createElement(BsStars),
    iconBg: "bg-accent/15 border border-accent/30",
    iconColor: "text-accent",
  },
];

export default homeFeatures;
