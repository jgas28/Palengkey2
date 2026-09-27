import AppRouter from "@/router";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ScrollToTop from "@/components/common/ScrollToTop";
import AuthGate from "@/features/auth/AuthGate";

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <AuthGate>
        <AppRouter />
      </AuthGate>
    </ErrorBoundary>
  );
}
