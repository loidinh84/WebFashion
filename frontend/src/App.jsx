import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";
import React, { useContext, useEffect } from "react";
import { StoreContext } from "./context/StoreContext";
import { AuthContext } from "./context/AuthContext";
import { fetchCartFromDb } from "./utils/cartHelper";
import PrivateRoute from "./components/PrivateRoute";
import Maintenance from "./pages/Maintenance";
import BASE_URL from "./config/api";
import StoreSettings from "./pages/admin/StoreSetting";
import Home from "./pages/Home";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/register";
import Product from "./pages/admin/Product";
import ProductDetail from "./pages/ProductDetail";
import UserProfile from "./pages/UserProfile";
import OrderDetail from "./pages/OrderDetail";
import Categories from "./pages/admin/Categories";
import Order from "./pages/admin/Order";
import Customer from "./pages/admin/Customer";
import Inventory from "./pages/admin/Inventory";
import InventoryCheck from "./pages/admin/InventoryCheck";
import InventoryImport from "./pages/admin/InventoryImport";
import InventoryCheckCreate from "./pages/admin/InventoryCheckCreate";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Banner from "./pages/admin/Banner";
import CheckoutSetting from "./pages/admin/CheckoutSetting";
import Memberships from "./pages/admin/TheThanhVienList";
import HomeSettings from "./pages/admin/HomeSettings";
import CategoryPage from "./pages/CategoryPage";
import VoucherManagement from "./pages/admin/VoucherManagement";
import SearchPage from "./pages/SearchPage";
import Profile from "./pages/admin/Profile";
import AuthPromptModal from "./components/AuthPromptModal";
import ComparePage from "./pages/ComparePage";
import PrintTemplateBuilder from "./pages/admin/PrintTemplateBuilder";
import ScrollToTopButton from "./components/ScrollToTopButton";
import ContactSupport from "./components/ContactSupport";
import AiBuilder from "./pages/AiBuilder";
import ResetPassword from "./pages/ResetPassword";
const API_URL = BASE_URL;

function App() {
  const { storeConfig } = useContext(StoreContext);
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (user) {
      fetchCartFromDb();
    }
  }, [user]);

  useEffect(() => {
    if (storeConfig) {
      document.title = storeConfig.ten_cua_hang || "LTL Shop";

      if (storeConfig.logo_url) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = `${API_URL}${storeConfig.logo_url}`;
      }
    }
  }, [storeConfig]);

  if (storeConfig?.bao_tri_he_thong && !isAdminPath) {
    return <Maintenance />;
  }

  return (
    <>
      <AuthPromptModal />
      {!isAdminPath && <ContactSupport />}
      {!isAdminPath && <ScrollToTopButton />}
      <Routes>
        {/* Nhánh khách hàng */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/order-detail/:id" element={<OrderDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/so-sanh" element={<ComparePage />} />
        <Route path="/build-pc" element={<AiBuilder />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Nhánh Admin */}
        <Route path="/admin" element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Product />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Order />} />
            <Route path="customers" element={<Customer />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/import" element={<InventoryImport />} />
            <Route path="inventory-check" element={<InventoryCheck />} />
            <Route path="inventory-check/create" element={<InventoryCheckCreate />} />
            <Route path="settings" element={<StoreSettings />} />
            <Route path="banners" element={<Banner />} />
            <Route path="checkout-settings" element={<CheckoutSetting />} />
            <Route path="memberships" element={<Memberships />} />
            <Route path="home-settings" element={<HomeSettings />} />
            <Route path="vouchers" element={<VoucherManagement />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings/templates" element={<PrintTemplateBuilder />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
