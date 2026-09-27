import { Outlet } from "react-router-dom";

// Login/Register/OTP each own their full page layout (matching the Figma
// reference exactly, including which side the hero art sits on) — this
// layout is just a pass-through so they aren't double-wrapped. Only
// ForgotPassword/ResetPassword (no dedicated reference design) rely on this
// having no opinion of its own.
export default function AuthLayout() {
  return <Outlet />;
}
