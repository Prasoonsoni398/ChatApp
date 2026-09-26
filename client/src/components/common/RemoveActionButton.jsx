import React from "react";
import { BsTrash } from "react-icons/bs";

/**
 * RemoveActionButton — WhatsApp-style danger/remove action button.
 * Renders a crisp red icon with a soft, light background and subtle border.
 * Guarantees NO dark/black hover effect across all themes.
 *
 * Props:
 * - onClick: Function
 * - icon: ReactNode (defaults to <BsTrash />)
 * - label: string (optional button label text)
 * - title: string (tooltip / aria-label)
 * - size: "xs" | "sm" | "md" | "lg"
 * - disabled: boolean
 * - loading: boolean
 * - fullWidth: boolean
 * - className: string (extra custom classes)
 * - variant: "pill" | "square" | "circle" | "row"
 */
const RemoveActionButton = ({
  onClick,
  icon,
  label,
  title,
  size = "sm",
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
  variant = "pill",
  type = "button",
  children,
}) => {
  // Size classes
  const sizeClasses = {
    xs: "text-xs py-1 px-2 gap-1.5 rounded-lg",
    sm: "text-xs py-1.5 px-3 gap-2 rounded-xl",
    md: "text-sm py-2 px-4 gap-2 rounded-xl font-medium",
    lg: "text-base py-2.5 px-5 gap-2.5 rounded-2xl font-semibold",
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
  };

  // Variant classes
  const variantClasses = {
    pill: "inline-flex items-center justify-center shadow-xs",
    circle:
      "!p-0 rounded-full inline-flex items-center justify-center aspect-square shadow-xs",
    square:
      "!p-0 rounded-xl inline-flex items-center justify-center aspect-square shadow-xs",
    row: "w-full flex items-center justify-start text-left px-3 py-2.5 rounded-xl",
  };

  // Dimensions for circle/square icon-only variant
  const circleSizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const isIconOnly = !label && !children;
  const dimensionClass =
    isIconOnly && (variant === "circle" || variant === "square")
      ? circleSizeClasses[size] || "w-8 h-8"
      : sizeClasses[size] || sizeClasses.sm;

  const defaultIcon = <BsTrash size={iconSizes[size] || 14} />;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title || label || "Remove"}
      aria-label={title || label || "Remove"}
      className={`
        group relative select-none cursor-pointer transition-all duration-200
        bg-error/15 text-error border border-error/50
        hover:bg-error/25 hover:text-error hover:border-error/40
        active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40
        ${fullWidth ? "w-full" : ""}
        ${variantClasses[variant] || variantClasses.pill}
        ${dimensionClass}
        ${className}
      `}
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs text-error" />
      ) : (
        icon || defaultIcon
      )}
      {(label || children) && (
        <span className="truncate tracking-wide">{label || children}</span>
      )}
    </button>
  );
};

export default RemoveActionButton;
