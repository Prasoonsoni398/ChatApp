/**
 * Shared Tailwind CSS class strings used across multiple components.
 * Named in camelCase. Import only what you need to keep bundles clean.
 *
 * Usage:
 *   import { authPageWrapper, authCard } from '../constants/styles';
 *   <div className={authPageWrapper}>...</div>
 */

// ─── Auth Pages (Login, Register, ForgotPassword) ────────────────────────────

/** Full-viewport centred wrapper used on all auth pages */
export const authPageWrapper =
  "min-h-screen bg-base-200 flex items-center justify-center p-6";

/** Rounded card that wraps the auth form */
export const authCard =
  "card w-full max-w-md bg-base-100 shadow-xl border border-base-300 !rounded-3xl";

/** Centred bold heading inside the auth card */
export const authCardTitle =
  "card-title text-3xl font-bold text-center justify-center mb-6 text-base-content";

/** DaisyUI form-control wrapper for a labelled input */
export const authFormControl = "form-control";

/** DaisyUI label element */
export const authLabel = "label";

/** Semibold label text inside a DaisyUI label */
export const authLabelText = "label-text font-semibold";

/** Relative wrapper for inputs that have a leading icon */
export const authInputGroup = "input-group relative";

/** Absolutely positioned icon span inside an input group */
export const authInputIconSpan =
  "absolute inset-y-0 left-0 flex items-center pl-3 text-base-content/50";

/** Standard text/email/password input with left-icon padding */
export const authInput = "input input-bordered w-full pl-10 rounded-xl";

/** Full-width primary CTA button used on auth forms */
export const primaryBtn =
  "btn btn-primary w-full shadow-lg shadow-primary/30 rounded-xl";

// ─── Modals ───────────────────────────────────────────────────────────────────

/** Fixed full-screen semi-transparent backdrop for modals */
export const modalOverlay =
  "fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in";

/** Small modal card (sm breakpoint) */
export const modalCard =
  "bg-base-100 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-base-300 animate-modal-pop";

/** Modal card at medium width */
export const modalCardMd =
  "bg-base-100 w-full max-w-md rounded-2xl shadow-2xl border border-base-300 overflow-hidden animate-modal-pop";

// ─── Chat / Context Menu ──────────────────────────────────────────────────────

/** Row inside a context-menu list — icon + label */
export const contextMenuAction = "flex items-center gap-3 py-2.5 rounded-xl";

/** Icon button that turns primary-coloured on hover */
export const hoverPrimary =
  "p-2 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors";

/** Inline search input used in the sidebar and chat header */
export const searchInput =
  "input input-sm w-full pl-9 bg-base-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 border-none";

/** Single row in the sidebar chat list */
export const sidebarChat =
  "flex items-center gap-3 p-3 cursor-pointer hover:bg-base-200/80 transition-all duration-300 hover:px-4 active:scale-[0.98] border-b border-base-200/50";

// ─── HeroPhone floating icons ─────────────────────────────────────────────────

/** Square floating icon tile (shield, etc.) */
export const floatingIconBase =
  "w-10 h-10 rounded-xl bg-base-100 flex items-center justify-center shadow-xl border border-base-300";

/** Circular floating icon (video cam, send, etc.) */
export const floatingCircleBase =
  "w-11 h-11 rounded-full bg-base-100 flex items-center justify-center shadow-xl border border-base-300";
