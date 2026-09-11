import React from 'react';
import {
  BsLightningChargeFill,
  BsShieldLockFill,
  BsStars,
} from 'react-icons/bs';

/**
 * Feature cards shown on the Home landing page.
 * Each entry has a title, description, React icon element, and Tailwind color classes.
 */
const homeFeatures = [
  {
    title: "Real-Time Chat",
    desc: "Lightning fast message delivery with instant read receipts.",
    icon: React.createElement(BsLightningChargeFill),
    iconBg: "bg-warning/20",
    iconColor: "text-warning",
  },
  {
    title: "End-to-End Secure",
    desc: "Your conversations are private, encrypted, and safe from prying eyes.",
    icon: React.createElement(BsShieldLockFill),
    iconBg: "bg-success/20",
    iconColor: "text-success",
  },
  {
    title: "Beautiful UI",
    desc: "A sleek, modern interface powered by FlyonUI that is a joy to use everyday.",
    icon: React.createElement(BsStars),
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
  },
];

export default homeFeatures;
