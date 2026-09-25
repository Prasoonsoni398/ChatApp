import React from "react";

/**
 * ToggleSwitch (3D Vision Tactile Toggle Switch)
 *
 * A reusable, premium 3D-styled tactile toggle switch designed with FlyonUI color tokens.
 * Features beveled highlights, recessed socket shadow, multi-layered elevation,
 * and physical spring-like micro-animations.
 *
 * Props:
 * - checked: boolean
 * - onChange: (checked: boolean, e: React.ChangeEvent) => void
 * - disabled?: boolean
 * - size?: "xs" | "sm" | "md" | "lg"
 * - color?: "primary" | "success" | "info" | "warning" | "error"
 * - label?: React.ReactNode
 * - description?: React.ReactNode
 * - id?: string
 * - name?: string
 * - className?: string (wrapper)
 * - trackClassName?: string
 */
const ToggleSwitch = ({
  checked = false,
  onChange,
  disabled = false,
  size = "sm",
  color = "primary",
  label,
  description,
  id,
  name,
  className = "",
  trackClassName = "",
}) => {
  const switchId = id || (name ? `toggle-${name}` : undefined);

  // Size configurations: [trackWidth, trackHeight, knobSize, translateDistance, dotSize]
  const sizeConfig = {
    xs: {
      track: "w-8 h-4.5 p-0.5",
      knob: "w-3.5 h-3.5",
      translate: "translate-x-3.5",
      dot: "w-1 h-1",
    },
    sm: {
      track: "w-10 h-5.5 p-0.5",
      knob: "w-4.5 h-4.5",
      translate: "translate-x-4.5",
      dot: "w-1.5 h-1.5",
    },
    md: {
      track: "w-12 h-6.5 p-0.5",
      knob: "w-5.5 h-5.5",
      translate: "translate-x-5.5",
      dot: "w-1.5 h-1.5",
    },
    lg: {
      track: "w-14 h-8 p-1",
      knob: "w-6 h-6",
      translate: "translate-x-6",
      dot: "w-2 h-2",
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.sm;

  // Semantic color variants for the active track
  const activeColorStyles = {
    primary:
      "bg-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),_0_0_12px_rgba(var(--color-primary),0.35)]",
    success:
      "bg-success shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),_0_0_12px_rgba(var(--color-success),0.35)]",
    info:
      "bg-info shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),_0_0_12px_rgba(var(--color-info),0.35)]",
    warning:
      "bg-warning shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),_0_0_12px_rgba(var(--color-warning),0.35)]",
    error:
      "bg-error shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),_0_0_12px_rgba(var(--color-error),0.35)]",
  };

  const handleToggle = (e) => {
    if (disabled) return;
    const nextVal = !checked;
    onChange?.(nextVal, e);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle(e);
    }
  };

  const switchElement = (
    <div
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center rounded-full cursor-pointer select-none transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        currentSize.track
      } ${
        checked
          ? activeColorStyles[color] || activeColorStyles.primary
          : "bg-base-300/80 hover:bg-base-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.28),_inset_0_1px_1px_rgba(0,0,0,0.15)]"
      } ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "active:scale-[0.97]"
      } ${trackClassName}`}
    >
      {/* Hidden native input for form compatibility */}
      <input
        type="checkbox"
        id={switchId}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => {
          if (!disabled) onChange?.(e.target.checked, e);
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* 3D Tactile Sliding Knob */}
      <div
        className={`relative rounded-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center ${
          currentSize.knob
        } ${checked ? currentSize.translate : "translate-x-0"}`}
        style={{
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 45%, #E2E8F0 100%)",
          boxShadow: checked
            ? "0 3px 6px -1px rgba(0,0,0,0.35), 0 2px 4px -1px rgba(0,0,0,0.2), inset 0 1px 1px #FFFFFF, inset 0 -1.5px 2px rgba(0,0,0,0.12)"
            : "0 3px 5px -1px rgba(0,0,0,0.3), 0 1px 3px -1px rgba(0,0,0,0.2), inset 0 1px 1px #FFFFFF, inset 0 -1.5px 2px rgba(0,0,0,0.15)",
        }}
      >
        {/* Tactile 3D Center Indicator Dot */}
        <span
          className={`rounded-full transition-all duration-300 ${currentSize.dot} ${
            checked
              ? "bg-primary shadow-[0_0_4px_rgba(var(--color-primary),0.8),_inset_0_1px_1px_rgba(255,255,255,0.6)]"
              : "bg-base-content/25 shadow-[inset_0_1px_1px_rgba(0,0,0,0.4)]"
          }`}
        />
      </div>
    </div>
  );

  // If label or description provided, render composite row
  if (label || description) {
    return (
      <div
        className={`flex items-center justify-between gap-3 ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        } ${className}`}
        onClick={handleToggle}
      >
        <div className="min-w-0 flex-1">
          {label && (
            <span className="text-sm font-medium text-base-content block select-none">
              {label}
            </span>
          )}
          {description && (
            <p className="text-xs text-base-content/55 mt-0.5 select-none leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {switchElement}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {switchElement}
    </div>
  );
};

export default ToggleSwitch;
export { ToggleSwitch as Toggle3D };
