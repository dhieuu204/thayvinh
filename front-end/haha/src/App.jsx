import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import WishlistPage from "./pages/WishlistPage";
import ProductsPage from "./pages/ProductsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountPage from "./pages/AccountPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OrdersPage from "./pages/OrdersPage";
import CategoryPage from "./pages/CategoryPage";
import TrackingPage from "./pages/TrackingPage";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminVouchersPage from "./pages/admin/AdminVouchersPage";
import AdminFlashSalesPage from "./pages/admin/AdminFlashSalesPage";
import AdminReturnRequestsPage from "./pages/admin/AdminReturnRequestsPage";
import AdminBannersPage from "./pages/admin/AdminBannersPage";
import AdminHomepageSettingsPage from "./pages/admin/AdminHomepageSettingsPage";

/** Chặn route khi chưa đăng nhập → redirect /login */
const AuthRoute = ({ children }) => {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
};

/** Chặn route admin khi không phải admin → redirect / */
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "admin") return <Navigate to="/" replace />;
  } catch {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/tracking" element={<TrackingPage />} />

        {/* ── Auth required ── */}
        <Route path="/wishlist"  element={<AuthRoute><WishlistPage /></AuthRoute>} />
        <Route path="/cart"      element={<AuthRoute><CartPage /></AuthRoute>} />
        <Route path="/checkout"  element={<AuthRoute><CheckoutPage /></AuthRoute>} />
        <Route path="/account"   element={<AuthRoute><AccountPage /></AuthRoute>} />
        <Route path="/orders"    element={<AuthRoute><OrdersPage /></AuthRoute>} />

        {/* ── Admin ── */}
        <Route
          path="/admin"
          element={<AdminRoute><AdminLayout /></AdminRoute>}
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="orders"   element={<AdminOrdersPage />} />
          <Route path="users"    element={<AdminUsersPage />} />
          <Route path="products"   element={<AdminProductsPage />} />
          <Route path="reviews"    element={<AdminReviewsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="vouchers"   element={<AdminVouchersPage />} />
          <Route path="flash-sales" element={<AdminFlashSalesPage />} />
          <Route path="returns"    element={<AdminReturnRequestsPage />} />
          <Route path="banners"             element={<AdminBannersPage />} />
          <Route path="homepage-settings"  element={<AdminHomepageSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        draggable
        closeOnClick
        theme="colored"
      />
    </Router>
  );
}

export default App;
