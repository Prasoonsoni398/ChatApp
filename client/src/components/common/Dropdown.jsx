import { useState, useRef, useEffect } from "react";
import { BsChevronDown, BsCheck2 } from "react-icons/bs";

/**
 * Reusable FlyonUI-themed interactive dropdown component.
 *
 * Props:
 * - value: string | number
 * - onChange: (value: any, option: object) => void
 * - options: Array<{ value: string|number, label: string, icon?: ReactNode, description?: string }> | string[]
 * - placeholder?: string
 * - size?: "xs" | "sm" | "md"
 * - align?: "left" | "right"
 * - disabled?: boolean
 * - className?: string (applied to trigger button)
 * - menuClassName?: string (applied to dropdown menu)
 */
const Dropdown = ({
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  size = "sm",
  align = "right",
  disabled = false,
  className = "",
  menuClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Normalize options to objects { value, label, icon, description }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value,
        label: opt.label ?? String(opt.value),
        icon: opt.icon,
        description: opt.description,
      };
    }
    return {
      value: opt,
      label: String(opt),
    };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value),
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (opt) => {
    if (disabled) return;
    onChange?.(opt.value, opt);
    setIsOpen(false);
  };

  // Size styling maps
  const sizeStyles = {
    xs: "h-7 text-xs px-2.5 gap-1.5 rounded-lg",
    sm: "h-8 text-xs px-3 gap-2 rounded-xl",
    md: "h-10 text-sm px-3.5 gap-2 rounded-xl",
  };

  const iconSizes = {
    xs: 11,
    sm: 12,
    md: 14,
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between border select-none transition-all duration-150 cursor-pointer shadow-xs ${
          isOpen
            ? "border-primary ring-2 ring-primary/20 bg-base-100"
            : "border-base-300/80 bg-base-200/60 hover:bg-base-200 hover:border-base-300"
        } ${sizeStyles[size] || sizeStyles.sm} ${
          disabled ? "opacity-50 cursor-not-allowed" : "active:scale-[0.98]"
        } ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {selectedOption?.icon && (
            <span className="flex-shrink-0 text-primary">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate text-base-content font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <BsChevronDown
          size={iconSizes[size] || 12}
          className={`text-base-content/50 flex-shrink-0 transition-transform duration-200 ml-1 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${
            align === "left" ? "left-0" : "right-0"
          } mt-1.5 z-50 min-w-[170px] max-w-xs bg-base-100 border border-base-300 rounded-2xl shadow-xl p-1.5 animate-slide-up origin-top`}
          style={{ maxHeight: "240px", overflowY: "auto" }}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={String(opt.value)}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt)}
                className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer select-none transition-all duration-150 ${
                  isSelected
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-base-content hover:bg-base-200/70"
                } ${menuClassName}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {opt.icon && (
                    <span
                      className={`flex-shrink-0 ${
                        isSelected ? "text-primary" : "text-base-content/60"
                      }`}
                    >
                      {opt.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="block text-[10px] text-base-content/50 truncate font-normal">
                        {opt.description}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <BsCheck2 size={16} className="text-primary flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
