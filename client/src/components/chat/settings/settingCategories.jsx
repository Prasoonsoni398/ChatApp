import React from "react";
import {
  BsShieldCheck,
  BsShieldLockFill,
  BsKeyFill,
  BsChatDotsFill,
  BsBellFill,
  BsHddNetworkFill,
  BsPaletteFill,
} from "react-icons/bs";

export const settingCategories = [
  {
    id: "account",
    title: "Account",
    subtitle: "Security notifications, request account info, delete account",
    icon: <BsShieldCheck size={20} />,
    color: "text-info bg-info/10",
  },
  {
    id: "privacy",
    title: "Privacy",
    subtitle:
      "Last seen, profile photo, disappearing messages, blocked contacts",
    icon: <BsShieldLockFill size={20} />,
    color: "text-primary bg-primary/10",
  },
  {
    id: "security",
    title: "Security & 2FA",
    subtitle: "Two-step verification, security status",
    icon: <BsKeyFill size={20} />,
    color: "text-warning bg-warning/10",
  },
  {
    id: "chats",
    title: "Chats",
    subtitle: "Clear all chats, export messages, media settings",
    icon: <BsChatDotsFill size={20} />,
    color: "text-secondary bg-secondary/10",
  },
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "Message sounds, reaction alerts, desktop notifications",
    icon: <BsBellFill size={20} />,
    color: "text-accent bg-accent/10",
  },
  {
    id: "storage",
    title: "Storage and Data",
    subtitle: "Network usage, manage media files, clear cache",
    icon: <BsHddNetworkFill size={20} />,
    color: "text-success bg-success/10",
  },
  {
    id: "theme",
    title: "Theme & Appearance",
    subtitle: "Mintlify, Dark, Black, Luxury, Corporate, System default",
    icon: <BsPaletteFill size={20} />,
    color: "text-primary bg-primary/10",
  },
];
