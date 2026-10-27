import { Outlet } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatFab from "@/components/layout/ChatFab";
import PkToast from "@/components/pk/PkToast";
import { usePkTheme } from "@/components/pk/usePkTheme";
import PushNotificationRegistrar from "@/features/notifications/PushNotificationRegistrar";
import PopupAdModal from "@/features/marketing/PopupAdModal";
import { useValidSelectedMarket } from "@/features/home/useValidSelectedMarket";

/** Customer app shell — the Figma design's fixed header, full-bleed pages, footer and chat bubble. */
export default function AppLayout() {
  usePkTheme();
  useValidSelectedMarket();

  return (
    <div>
      <PushNotificationRegistrar />
      <PopupAdModal />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#0097a7] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <div id="main-content" tabIndex={-1} className="focus:outline-none">
        <Outlet />
      </div>
      <Footer />
      <ChatFab />
      <PkToast />
    </div>
  );
}
