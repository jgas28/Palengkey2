import { Link } from "react-router-dom";
import { Facebook, MessageCircle, MapPin, Mail } from "lucide-react";
import AppleIcon from "@/components/icons/AppleIcon";
import GooglePlayIcon from "@/components/icons/GooglePlayIcon";

const companyLinks = [
  { to: "/about", label: "About Us" },
  { to: "/careers", label: "Careers" },
];

const supportLinks = [
  { to: "/faq", label: "Help Center / FAQ" },
  { to: "/delivery-areas", label: "Delivery Areas" },
];

const legalLinks = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms-of-service", label: "Terms of Service" },
];

export default function Footer() {
  return (
    <footer className="mt-10 bg-[#203238] px-4 py-16 text-white/70 sm:px-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <img
            src="/assets/name.png"
            alt="Palengkey"
            className="h-7 w-auto object-contain brightness-0 invert"
          />
          <p className="text-sm leading-relaxed text-white/50">
            Ang paboritong palengke mo, online na. Fresh, fast, and community-first.
          </p>

          {/* Mobile app — honest "coming soon" badges, matching the hero's */}
          <div className="mt-1 flex flex-col gap-2">
            <span className="flex w-fit cursor-not-allowed items-center gap-2.5 rounded-xl bg-black px-3.5 py-2 opacity-70">
              <AppleIcon className="h-5 w-5 shrink-0 text-white" />
              <span>
                <span className="block text-[9px] leading-none text-white/60">Coming to</span>
                <span className="block text-xs font-semibold leading-tight text-white">
                  App Store
                </span>
              </span>
            </span>
            <span className="flex w-fit cursor-not-allowed items-center gap-2.5 rounded-xl bg-black px-3.5 py-2 opacity-70">
              <GooglePlayIcon className="h-5 w-5 shrink-0 text-white" />
              <span>
                <span className="block text-[9px] leading-none text-white/60">Coming to</span>
                <span className="block text-xs font-semibold leading-tight text-white">
                  Google Play
                </span>
              </span>
            </span>
          </div>
        </div>

        <div>
          <h3 className="mb-5 text-sm font-semibold text-white">Company</h3>
          <ul className="space-y-3">
            {companyLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-sm font-semibold text-white">Support</h3>
          <ul className="space-y-3">
            {supportLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-sm font-semibold text-white">Legal</h3>
          <ul className="space-y-3">
            {legalLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-6 border-t border-white/10 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5 text-sm text-white/50">
            <span className="flex items-center gap-2.5">
              <MapPin size={14} className="shrink-0 text-[#0097A7]" aria-hidden="true" />
              Block 3 Lot 106 Lawang Pari, San Jose Del Monte, Bulacan 3023
            </span>
            <a
              href="mailto:contact@palengkey.ph"
              className="flex items-center gap-2.5 transition-colors hover:text-white"
            >
              <Mail size={14} className="shrink-0 text-[#0097A7]" aria-hidden="true" />
              contact@palengkey.ph
            </a>
          </div>
          <div className="flex gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-all hover:bg-[#0097A7] hover:text-white"
            >
              <Facebook size={14} aria-hidden="true" />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-all hover:bg-[#0097A7] hover:text-white"
            >
              <MessageCircle size={14} aria-hidden="true" />
            </a>
          </div>
        </div>

        <p className="text-xs text-white/30">
          &copy; {new Date().getFullYear()} Palengkey Digital Market Corporation. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
