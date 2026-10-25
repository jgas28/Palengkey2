import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import AdminLayout from "@/layouts/AdminLayout";
import AdminMarketingLayout from "@/layouts/AdminMarketingLayout";
import RequireAuth from "@/features/auth/RequireAuth";
import RequireGuest from "@/features/auth/RequireGuest";
import RequireAdminAuth from "@/features/admin/RequireAdminAuth";
import LoadingState from "@/components/common/LoadingState";

const Global = lazy(() => import("@/pages/Global"));
const Home = lazy(() => import("@/pages/Home"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Paluto = lazy(() => import("@/pages/Paluto"));
const PalutoStallMenu = lazy(() => import("@/pages/paluto/PalutoStallMenu"));
const Recipes = lazy(() => import("@/pages/Recipes"));
const Cart = lazy(() => import("@/pages/Cart"));
const Vouchers = lazy(() => import("@/pages/Vouchers"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderDetail = lazy(() => import("@/pages/orders/OrderDetail"));
const Profile = lazy(() => import("@/pages/Profile"));
const EditProfile = lazy(() => import("@/pages/profile/EditProfile"));
const ChangePassword = lazy(() => import("@/pages/profile/ChangePassword"));
const DeleteAccount = lazy(() => import("@/pages/profile/DeleteAccount"));
const Addresses = lazy(() => import("@/pages/Addresses"));
const Notifications = lazy(() => import("@/pages/notifications/Notifications"));
const Support = lazy(() => import("@/pages/support/Support"));
const SupportThread = lazy(() => import("@/pages/support/SupportThread"));
const About = lazy(() => import("@/pages/About"));
const Careers = lazy(() => import("@/pages/Careers"));
const Faq = lazy(() => import("@/pages/Faq"));
const DeliveryAreas = lazy(() => import("@/pages/DeliveryAreas"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Maintenance = lazy(() => import("@/pages/system/Maintenance"));
const ErrorPage = lazy(() => import("@/pages/system/ErrorPage"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const OtpVerify = lazy(() => import("@/pages/auth/OtpVerify"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const Checkout = lazy(() => import("@/pages/checkout/Checkout"));
const OrderConfirmationPage = lazy(
  () => import("@/pages/checkout/OrderConfirmationPage"),
);
const QrphPayment = lazy(() => import("@/pages/checkout/QrphPayment"));
const BpiPayment = lazy(() => import("@/pages/checkout/BpiPayment"));

const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminIndex = lazy(() => import("@/pages/admin/AdminIndex"));
const AdminItems = lazy(() => import("@/pages/admin/AdminItems"));
const AdminItemForm = lazy(() => import("@/pages/admin/AdminItemForm"));
const AdminFinance = lazy(() => import("@/pages/admin/AdminFinance"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminVouchers = lazy(() => import("@/pages/admin/marketing/AdminVouchers"));
const AdminPopupAds = lazy(() => import("@/pages/admin/marketing/AdminPopupAds"));
const AdminHeroContent = lazy(() => import("@/pages/admin/marketing/AdminHeroContent"));
const AdminHighlights = lazy(() => import("@/pages/admin/marketing/AdminHighlights"));
const AdminSmsBlast = lazy(() => import("@/pages/admin/marketing/AdminSmsBlast"));
const AdminEmailBlast = lazy(() => import("@/pages/admin/marketing/AdminEmailBlast"));
const AdminPushBlast = lazy(() => import("@/pages/admin/marketing/AdminPushBlast"));
const AdminFeedback = lazy(() => import("@/pages/admin/AdminFeedback"));
const AdminSupport = lazy(() => import("@/pages/admin/AdminSupport"));
const AdminSupportThread = lazy(() => import("@/pages/admin/AdminSupportThread"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/AdminAuditLogs"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminReports = lazy(() => import("@/pages/admin/AdminReports"));
const AdminVerifications = lazy(() => import("@/pages/admin/AdminVerifications"));
const AdminCodSubmissions = lazy(() => import("@/pages/admin/AdminCodSubmissions"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/AdminOrderDetail"));
const AdminRiders = lazy(() => import("@/pages/admin/AdminRiders"));
const AdminRiderTracking = lazy(() => import("@/pages/admin/AdminRiderTracking"));
const AdminMarkets = lazy(() => import("@/pages/admin/AdminMarkets"));
const AdminTypesUnits = lazy(() => import("@/pages/admin/AdminTypesUnits"));
const AdminCareers = lazy(() => import("@/pages/admin/AdminCareers"));
const AdminInventory = lazy(() => import("@/pages/admin/AdminInventory"));
const AdminRecipes = lazy(() => import("@/pages/admin/AdminRecipes"));
const AdminRecipeForm = lazy(() => import("@/pages/admin/AdminRecipeForm"));
const AdminRecipeTypes = lazy(() => import("@/pages/admin/AdminRecipeTypes"));
const AdminPalutoStalls = lazy(() => import("@/pages/admin/AdminPalutoStalls"));
const AdminPalutoDishes = lazy(() => import("@/pages/admin/AdminPalutoDishes"));
const AdminPalutoDishForm = lazy(() => import("@/pages/admin/AdminPalutoDishForm"));

export default function AppRouter() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Public — browsing works without an account, matching the backend
              (items/categories/markets aren't auth-gated server-side either).
              "/" is the marketing landing page (mirrors the old web app's
              global.blade.php); the actual shopping catalog lives at "/shop". */}
          <Route index element={<Global />} />
          <Route path="shop" element={<Home />} />
          <Route path="product/:itemId" element={<ProductDetail />} />
          <Route path="categories" element={<Navigate to="/shop" replace />} />
          <Route path="paluto" element={<Paluto />} />
          <Route path="paluto/stalls/:stallId" element={<PalutoStallMenu />} />
          <Route path="recipes" element={<Recipes />} />
          {/* Guest-accessible — the cart itself works signed-out (device-id keyed on
              the backend); only checkout requires an account. */}
          <Route path="cart" element={<Cart />} />
          <Route path="about" element={<About />} />
          <Route path="careers" element={<Careers />} />
          <Route path="faq" element={<Faq />} />
          <Route path="delivery-areas" element={<DeliveryAreas />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />

          {/* Everything that identifies or charges the customer requires login. */}
          <Route element={<RequireAuth />}>
            <Route path="vouchers" element={<Vouchers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:orderId" element={<OrderDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<EditProfile />} />
            <Route path="profile/password" element={<ChangePassword />} />
            <Route path="profile/delete-account" element={<DeleteAccount />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="support" element={<Support />} />
            <Route path="support/:threadId" element={<SupportThread />} />
            <Route path="checkout" element={<Checkout />} />
            <Route
              path="checkout/confirmation/:orderId"
              element={<OrderConfirmationPage />}
            />
            <Route path="checkout/qrph/:orderId" element={<QrphPayment />} />
            <Route path="checkout/bpi/:orderId" element={<BpiPayment />} />
            <Route path="checkout/pay/:orderId" element={<BpiPayment />} />
          </Route>
        </Route>

        <Route element={<AuthLayout />}>
          <Route element={<RequireGuest />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>
          <Route path="verify-otp" element={<OtpVerify />} />
        </Route>

        {/* Admin/superadmin panel — separate auth (adminAuthStore/Sanctum admin
            tokens), separate layout (role-aware sidebar, no bottom nav). */}
        <Route path="admin/login" element={<AdminLogin />} />
        <Route element={<RequireAdminAuth />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminIndex />} />
            <Route path="items" element={<AdminItems />} />
            <Route path="items/new" element={<AdminItemForm />} />
            <Route path="items/:itemId/edit" element={<AdminItemForm />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="recipes" element={<AdminRecipes />} />
            <Route path="recipes/new" element={<AdminRecipeForm />} />
            <Route path="recipes/:recipeId/edit" element={<AdminRecipeForm />} />
            <Route path="recipe-types" element={<AdminRecipeTypes />} />
            <Route path="paluto-stalls" element={<AdminPalutoStalls />} />
            <Route path="paluto-stalls/:stallId/dishes" element={<AdminPalutoDishes />} />
            <Route
              path="paluto-stalls/:stallId/dishes/new"
              element={<AdminPalutoDishForm />}
            />
            <Route
              path="paluto-stalls/:stallId/dishes/:dishId/edit"
              element={<AdminPalutoDishForm />}
            />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:orderId" element={<AdminOrderDetail />} />
            <Route path="riders" element={<AdminRiders />} />
            <Route path="riders/tracking" element={<AdminRiderTracking />} />
            <Route path="marketing" element={<AdminMarketingLayout />}>
              <Route index element={<Navigate to="vouchers" replace />} />
              <Route path="vouchers" element={<AdminVouchers />} />
              <Route path="popup-ads" element={<AdminPopupAds />} />
              <Route path="hero-content" element={<AdminHeroContent />} />
              <Route path="highlights" element={<AdminHighlights />} />
              <Route path="sms" element={<AdminSmsBlast />} />
              <Route path="email" element={<AdminEmailBlast />} />
              <Route path="push" element={<AdminPushBlast />} />
            </Route>
            <Route path="finance" element={<AdminFinance />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="support/:threadId" element={<AdminSupportThread />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="markets" element={<AdminMarkets />} />
            <Route path="types-units" element={<AdminTypesUnits />} />
            <Route path="careers" element={<AdminCareers />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="cod-submissions" element={<AdminCodSubmissions />} />
          </Route>
        </Route>

        {/* Standalone system pages (no shop header/footer) — Figma /maintenance, /error, 404. */}
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="error" element={<ErrorPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
