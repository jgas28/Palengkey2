import { Outlet } from "react-router-dom";
import Header from "@/components/layout/Header";
import ChatFab from "@/components/layout/ChatFab";
import ToastContainer from "@/components/ui/ToastContainer";
import PushNotificationRegistrar from "@/features/notifications/PushNotificationRegistrar";
import PopupAdModal from "@/features/marketing/PopupAdModal";

export default function AppLayout() {
  return (
    <div className="flex min-h-full flex-col">
      <PushNotificationRegistrar />
      <PopupAdModal />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-white focus:shadow-soft"
      >
        Skip to content
      </a>
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(4rem+env(safe-area-inset-top))] focus:outline-none md:px-6 lg:pt-[calc(5rem+env(safe-area-inset-top))]"
      >
        <Outlet />
      </main>
      <ChatFab />
      <ToastContainer />
    </div>
  );
}
